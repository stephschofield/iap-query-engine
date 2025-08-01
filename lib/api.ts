// API configuration and types - Updated to use documentation analysis
import { getApiAnalysis, type ApiDocumentationAnalysis } from "./api-documentation-analyzer"

const API_BASE_URL = "https://ciap-app-kcf5ofqycqvs2.mangomeadow-b5c8efc2.centralus.azurecontainerapps.io"

export interface InteractionData {
  id: string
  date: string
  agent_name: string
  issue_type: string
  description: string
  sentiment_start: number
  sentiment_end: number
  positive_sentiment: number
  negative_sentiment: number
  crosstalk_score: number
  mutual_silence_score: number
  nontalk_score: number
  resolution: string
  coaching_recommendations: string[]
  greeting_text: string
  has_greeting: boolean
  behavior: string
  compliance_score: string
  transcript?: string
}

export interface ApiResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Helper function to check API availability using the docs endpoint
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/docs`, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    })
    return response.ok
  } catch (error) {
    console.error("API health check failed:", error)
    return false
  }
}

// Add a function to fetch and analyze the actual API documentation
export async function fetchSwaggerSpec(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/openapi.json`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch API spec: ${response.status}`)
    }

    const spec = await response.json()
    console.log("Full API Specification:", spec)

    // Log all available endpoints with their methods and descriptions
    if (spec.paths) {
      console.log("Available API Endpoints:")
      Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          console.log(`${method.toUpperCase()} ${path} - ${details.summary || details.description || "No description"}`)
        })
      })
    }

    return spec
  } catch (error) {
    console.error("Error fetching Swagger spec:", error)
    throw error
  }
}

// Get the actual API endpoints from the OpenAPI spec
export async function getApiEndpoints(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/openapi.json`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch OpenAPI spec: ${response.status}`)
    }

    const spec = await response.json()
    const endpoints = Object.keys(spec.paths || {})

    // Filter out problematic endpoints that we know don't work
    const filteredEndpoints = endpoints.filter((endpoint) => {
      // Filter out parameterized endpoints (those with {})
      if (endpoint.includes("{") && endpoint.includes("}")) {
        return false
      }

      // Filter out specific problematic endpoints
      const problematicEndpoints = ["/api/v1/reports/batch", "/api/v1/interactions/search", "/api/v1/dsr/requests"]

      return !problematicEndpoints.includes(endpoint)
    })

    console.log("Available API endpoints from OpenAPI spec:", filteredEndpoints)
    return filteredEndpoints
  } catch (error) {
    console.error("Error fetching API endpoints:", error)
    return []
  }
}

// Helper function to filter out parameterized endpoints and find base endpoints
function findBaseEndpoints(endpoints: string[]): string[] {
  const baseEndpoints = endpoints.filter((endpoint) => {
    // Filter out endpoints with parameters like {id}, {report_id}, etc.
    return !endpoint.includes("{") && !endpoint.includes("}")
  })

  console.log("Base endpoints (without parameters):", baseEndpoints)
  return baseEndpoints
}

// Enhanced function to test all available endpoints and find data
export async function discoverDataEndpoints(): Promise<{
  workingEndpoints: Array<{
    endpoint: string
    sampleData: any
    dataType: string
    recordCount: number
  }>
  totalEndpoints: number
}> {
  try {
    const availableEndpoints = await getApiEndpoints()
    const baseEndpoints = findBaseEndpoints(availableEndpoints)

    console.log("Testing all base endpoints for data...")

    const workingEndpoints = []

    for (const endpoint of baseEndpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`)

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(10000),
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`${endpoint} response:`, data)

          let dataType = "unknown"
          let recordCount = 0

          if (Array.isArray(data)) {
            dataType = "array"
            recordCount = data.length
          } else if (data && typeof data === "object") {
            if (data.data && Array.isArray(data.data)) {
              dataType = "paginated"
              recordCount = data.data.length
            } else if (data.items && Array.isArray(data.items)) {
              dataType = "items"
              recordCount = data.items.length
            } else if (data.results && Array.isArray(data.results)) {
              dataType = "results"
              recordCount = data.results.length
            } else {
              dataType = "object"
              recordCount = 1
            }
          }

          workingEndpoints.push({
            endpoint,
            sampleData: data,
            dataType,
            recordCount,
          })
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error)
      }
    }

    console.log("Working endpoints discovered:", workingEndpoints)

    return {
      workingEndpoints,
      totalEndpoints: baseEndpoints.length,
    }
  } catch (error) {
    console.error("Error discovering data endpoints:", error)
    return {
      workingEndpoints: [],
      totalEndpoints: 0,
    }
  }
}

// Fetch interactions with proper error handling for 422 validation errors
export async function fetchInteractions(params?: {
  page?: number
  limit?: number
  agent_name?: string
  issue_type?: string
  date_from?: string
  date_to?: string
  search?: string
}): Promise<ApiResponse<InteractionData>> {
  try {
    // First analyze the API documentation to understand the data structure
    console.log("🔍 Analyzing API documentation before fetching data...")
    const apiAnalysis = await getApiAnalysis()

    console.log("📊 API Analysis Complete:")
    console.log("   Title:", apiAnalysis.title)
    console.log("   Interaction endpoints:", apiAnalysis.interactionEndpoints.length)
    console.log("   Field mappings:", apiAnalysis.fieldMappings)

    // First discover all working endpoints
    const discovery = await discoverDataEndpoints()

    if (discovery.workingEndpoints.length === 0) {
      throw new Error("No working data endpoints found")
    }

    // Try each working endpoint to find interaction data
    for (const endpointInfo of discovery.workingEndpoints) {
      try {
        console.log(`Trying to fetch interactions from: ${endpointInfo.endpoint}`)
        console.log(`Endpoint data type: ${endpointInfo.dataType}, records: ${endpointInfo.recordCount}`)

        const response = await fetch(`${API_BASE_URL}${endpointInfo.endpoint}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          const processedData = processApiResponse(data, apiAnalysis)

          // If we got data, return it
          if (processedData.data.length > 0) {
            console.log(`Successfully loaded ${processedData.data.length} interactions from ${endpointInfo.endpoint}`)
            return processedData
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${endpointInfo.endpoint}:`, error)
        continue
      }
    }

    throw new Error("No endpoints returned interaction data")
  } catch (error) {
    console.error("Error in fetchInteractions:", error)
    throw error
  }
}

function processApiResponse(data: any, apiAnalysis: ApiDocumentationAnalysis): ApiResponse<InteractionData> {
  console.log("=== PROCESSING API RESPONSE WITH DOCUMENTATION ANALYSIS ===")
  console.log("Raw data:", JSON.stringify(data, null, 2))
  console.log("API Analysis field mappings:", apiAnalysis.fieldMappings)

  let rawItems: any[] = []

  // Extract the actual data array from various possible structures
  if (Array.isArray(data)) {
    console.log("✓ Direct array with", data.length, "items")
    rawItems = data
  } else if (data && data.data && Array.isArray(data.data)) {
    console.log("✓ Nested data array with", data.data.length, "items")
    rawItems = data.data
  } else if (data && Array.isArray(data.items)) {
    console.log("✓ Items array with", data.items.length, "items")
    rawItems = data.items
  } else if (data && Array.isArray(data.results)) {
    console.log("✓ Results array with", data.results.length, "items")
    rawItems = data.results
  } else if (data && typeof data === "object") {
    console.log("✓ Single object, wrapping in array")
    rawItems = [data]
  } else {
    console.log("✗ No recognizable data structure")
    rawItems = []
  }

  console.log("Raw items to process:", rawItems.length)

  // Log the first item to see its structure
  if (rawItems.length > 0) {
    console.log("First item structure:", JSON.stringify(rawItems[0], null, 2))
    console.log("First item keys:", Object.keys(rawItems[0]))
  }

  // Transform each item to our expected format using the API analysis
  const transformedData = rawItems.map((item, index) => {
    console.log(`Transforming item ${index} using API documentation analysis:`, item)
    const transformed = transformToInteractionDataWithAnalysis(item, apiAnalysis)
    console.log(`Transformed item ${index}:`, transformed)
    return transformed
  })

  console.log("Final transformed data:", transformedData)
  console.log("=== END PROCESSING ===")

  return {
    data: transformedData,
    total: transformedData.length,
    page: 1,
    limit: transformedData.length,
  }
}

function transformToInteractionDataWithAnalysis(apiData: any, apiAnalysis: ApiDocumentationAnalysis): InteractionData {
  console.log("=== TRANSFORMING ITEM WITH API ANALYSIS ===")
  console.log("Raw API item:", JSON.stringify(apiData, null, 2))
  console.log("Using field mappings:", apiAnalysis.fieldMappings)

  // Handle null/undefined
  if (!apiData || typeof apiData !== "object") {
    console.log("Invalid API data, using defaults")
    apiData = {}
  }

  // Log all available keys in the API response
  console.log("Available keys in API response:", Object.keys(apiData))

  // Extract ID using documented field mappings
  let id = `INT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  for (const field of apiAnalysis.fieldMappings.idFields) {
    if (apiData[field] && typeof apiData[field] === "string") {
      id = apiData[field]
      console.log(`✅ FOUND ID in documented field '${field}':`, id)
      break
    }
  }

  // Extract agent name using documented field mappings
  let agentName = "Unknown Agent"
  for (const field of apiAnalysis.fieldMappings.agentFields) {
    if (apiData[field] && typeof apiData[field] === "string" && apiData[field].trim() !== "") {
      agentName = apiData[field].trim()
      console.log(`✅ FOUND AGENT NAME in documented field '${field}':`, agentName)
      break
    }
  }

  // If no agent found in documented fields, try common variations
  if (agentName === "Unknown Agent") {
    const commonAgentFields = [
      "agent_name",
      "agentName",
      "agent",
      "user_name",
      "userName",
      "name",
      "representative",
      "rep_name",
      "employee_name",
      "staff_name",
      "operator",
    ]

    for (const field of commonAgentFields) {
      if (apiData[field] && typeof apiData[field] === "string" && apiData[field].trim() !== "") {
        agentName = apiData[field].trim()
        console.log(`✅ FOUND AGENT NAME in common field '${field}':`, agentName)
        break
      }
    }
  }

  // Extract transcript using documented field mappings
  let transcript = undefined
  for (const field of apiAnalysis.fieldMappings.transcriptFields) {
    if (apiData[field] && typeof apiData[field] === "string" && apiData[field].trim() !== "") {
      transcript = apiData[field].trim()
      console.log(`✅ FOUND TRANSCRIPT in documented field '${field}':`, transcript.substring(0, 100) + "...")
      break
    }
  }

  // Extract date using documented field mappings
  let date = new Date().toISOString().split("T")[0]
  for (const field of apiAnalysis.fieldMappings.dateFields) {
    if (apiData[field]) {
      try {
        const parsedDate = new Date(apiData[field])
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate.toISOString().split("T")[0]
          console.log(`✅ FOUND DATE in documented field '${field}':`, date)
          break
        }
      } catch (e) {
        console.log(`❌ Failed to parse date from documented field '${field}':`, apiData[field])
      }
    }
  }

  // Extract sentiment fields using documented mappings
  const extractSentimentField = (fieldName: string, defaultValue: number): number => {
    // First try documented sentiment fields
    for (const field of apiAnalysis.fieldMappings.sentimentFields) {
      if (field.toLowerCase().includes(fieldName.toLowerCase()) && apiData[field] !== undefined) {
        const value = Number.parseFloat(apiData[field])
        if (!isNaN(value)) {
          console.log(`✅ FOUND ${fieldName} in documented field '${field}':`, value)
          return value
        }
      }
    }

    // Fallback to common field names
    const commonFields = [
      `${fieldName}_score`,
      `${fieldName}Score`,
      fieldName,
      `${fieldName}_value`,
      `${fieldName}Value`,
    ]

    for (const field of commonFields) {
      if (apiData[field] !== undefined) {
        const value = Number.parseFloat(apiData[field])
        if (!isNaN(value)) {
          console.log(`✅ FOUND ${fieldName} in common field '${field}':`, value)
          return value
        }
      }
    }

    console.log(`❌ No ${fieldName} found, using default:`, defaultValue)
    return defaultValue
  }

  const sentimentStart = extractSentimentField("sentiment_start", 50)
  const sentimentEnd = extractSentimentField("sentiment_end", sentimentStart + 25)
  const positiveSentiment = extractSentimentField("positive_sentiment", 70)
  const negativeSentiment = extractSentimentField("negative_sentiment", 30)
  const crosstalkScore = extractSentimentField("crosstalk", 2.5)
  const mutualSilenceScore = extractSentimentField("mutual_silence", 5.0)
  const nontalkScore = extractSentimentField("nontalk", 3.0)

  // Extract other fields with fallbacks
  const issueType = apiData.issue_type || apiData.issueType || apiData.category || apiData.type || "General Inquiry"
  const description =
    apiData.description || apiData.summary || apiData.notes || apiData.details || "No description available"
  const resolution = apiData.resolution || apiData.outcome || apiData.status || apiData.result || "Completed"

  // Handle coaching recommendations
  let coachingRecommendations = ["No coaching recommendations available"]
  const coachingFields = ["coaching_recommendations", "recommendations", "coaching", "feedback", "suggestions"]

  for (const field of coachingFields) {
    if (Array.isArray(apiData[field]) && apiData[field].length > 0) {
      coachingRecommendations = apiData[field]
      console.log(`✅ FOUND COACHING RECOMMENDATIONS (array) in field '${field}':`, coachingRecommendations)
      break
    } else if (typeof apiData[field] === "string" && apiData[field].trim() !== "") {
      coachingRecommendations = [apiData[field].trim()]
      console.log(`✅ FOUND COACHING RECOMMENDATIONS (string) in field '${field}':`, coachingRecommendations)
      break
    }
  }

  const transformed = {
    id,
    date,
    agent_name: agentName,
    issue_type: issueType,
    description,
    sentiment_start: sentimentStart,
    sentiment_end: sentimentEnd,
    positive_sentiment: positiveSentiment,
    negative_sentiment: negativeSentiment,
    crosstalk_score: crosstalkScore,
    mutual_silence_score: mutualSilenceScore,
    nontalk_score: nontalkScore,
    resolution,
    coaching_recommendations: coachingRecommendations,
    greeting_text: apiData.greeting_text || apiData.greetingText || apiData.greeting || "Standard greeting",
    has_greeting: apiData.has_greeting !== undefined ? apiData.has_greeting : true,
    behavior: apiData.behavior || apiData.greeting_behavior || apiData.greetingBehavior || "Professional",
    compliance_score: apiData.compliance_score || apiData.complianceScore || apiData.score || "Good",
    transcript: transcript,
  }

  console.log("✅ FINAL TRANSFORMED OBJECT:", transformed)
  console.log("=== END TRANSFORMING ITEM ===")
  return transformed
}

export async function fetchInteractionById(id: string): Promise<InteractionData> {
  const availableEndpoints = await getApiEndpoints()

  // Find parameterized endpoint for single interaction
  const interactionByIdEndpoint = availableEndpoints.find(
    (endpoint) => endpoint.includes("interaction") && endpoint.includes("{"),
  )

  if (!interactionByIdEndpoint) {
    throw new Error("No interaction by ID endpoint found in API documentation")
  }

  // Replace parameter placeholders with actual ID
  const url = `${API_BASE_URL}${interactionByIdEndpoint
    .replace("{id}", id)
    .replace("{interaction_id}", id)
    .replace("{report_id}", id)
    .replace("{uuid}", id)}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      let errorDetails = `HTTP ${response.status} ${response.statusText}`
      try {
        const errorBody = await response.text()
        if (errorBody) {
          errorDetails += ` - ${errorBody}`
        }
      } catch (e) {
        // Ignore error reading error body
      }
      throw new Error(errorDetails)
    }

    const data = await response.json()
    const apiAnalysis = await getApiAnalysis()
    return transformToInteractionDataWithAnalysis(data, apiAnalysis)
  } catch (error) {
    console.error("Error fetching interaction:", error)
    throw error
  }
}

// Extract agents from interactions data since /agents endpoint doesn't exist
export async function fetchAgents(): Promise<string[]> {
  try {
    const response = await fetchInteractions() // Don't pass limit to avoid validation issues
    console.log("Agents extraction - response:", response)

    if (!response || !response.data || !Array.isArray(response.data)) {
      console.warn("No valid interactions data found for agents extraction")
      return []
    }

    if (response.data.length === 0) {
      console.warn("No interactions found")
      return []
    }

    const agents = [
      ...new Set(
        response.data
          .map((interaction) => interaction?.agent_name)
          .filter((name) => name && typeof name === "string" && name !== "Unknown Agent"),
      ),
    ]

    console.log("Extracted agents:", agents)
    return agents.sort()
  } catch (error) {
    console.error("Error extracting agents from interactions:", error)
    return []
  }
}

// Extract issue types from interactions data since /issue-types endpoint doesn't exist
export async function fetchIssueTypes(): Promise<string[]> {
  try {
    const response = await fetchInteractions() // Don't pass limit to avoid validation issues
    console.log("Issue types extraction - response:", response)

    if (!response || !response.data || !Array.isArray(response.data)) {
      console.warn("No valid interactions data found for issue types extraction")
      return []
    }

    if (response.data.length === 0) {
      console.warn("No interactions found")
      return []
    }

    const issueTypes = [
      ...new Set(
        response.data
          .map((interaction) => interaction?.issue_type)
          .filter((type) => type && typeof type === "string" && type !== "General Inquiry"),
      ),
    ]

    console.log("Extracted issue types:", issueTypes)
    return issueTypes.sort()
  } catch (error) {
    console.error("Error extracting issue types from interactions:", error)
    return []
  }
}

// Calculate summary from interactions data since /analytics/summary doesn't exist
export async function fetchAnalyticsSummary(): Promise<{
  total_interactions: number
  avg_sentiment_improvement: number
  avg_crosstalk: number
  avg_mutual_silence: number
  avg_positive_sentiment: number
}> {
  try {
    const response = await fetchInteractions() // Don't pass limit to avoid validation issues
    console.log("Analytics summary - response:", response)

    if (!response || !response.data || !Array.isArray(response.data)) {
      console.warn("No valid interactions data found for analytics summary")
      return {
        total_interactions: 0,
        avg_sentiment_improvement: 0,
        avg_crosstalk: 0,
        avg_mutual_silence: 0,
        avg_positive_sentiment: 0,
      }
    }

    const interactions = response.data

    if (interactions.length === 0) {
      return {
        total_interactions: 0,
        avg_sentiment_improvement: 0,
        avg_crosstalk: 0,
        avg_mutual_silence: 0,
        avg_positive_sentiment: 0,
      }
    }

    const totalInteractions = interactions.length

    const validSentimentData = interactions.filter(
      (call) => typeof call?.sentiment_start === "number" && typeof call?.sentiment_end === "number",
    )

    const validCrosstalkData = interactions.filter((call) => typeof call?.crosstalk_score === "number")

    const validMutualSilenceData = interactions.filter((call) => typeof call?.mutual_silence_score === "number")

    const validPositiveSentimentData = interactions.filter((call) => typeof call?.positive_sentiment === "number")

    const avgSentimentImprovement =
      validSentimentData.length > 0
        ? Math.round(
            validSentimentData.reduce((sum, call) => sum + (call.sentiment_end - call.sentiment_start), 0) /
              validSentimentData.length,
          )
        : 0

    const avgCrosstalk =
      validCrosstalkData.length > 0
        ? Math.round(
            (validCrosstalkData.reduce((sum, call) => sum + call.crosstalk_score, 0) / validCrosstalkData.length) * 10,
          ) / 10
        : 0

    const avgMutualSilence =
      validMutualSilenceData.length > 0
        ? Math.round(
            (validMutualSilenceData.reduce((sum, call) => sum + call.mutual_silence_score, 0) /
              validMutualSilenceData.length) *
              10,
          ) / 10
        : 0

    const avgPositiveSentiment =
      validPositiveSentimentData.length > 0
        ? Math.round(
            validPositiveSentimentData.reduce((sum, call) => sum + call.positive_sentiment, 0) /
              validPositiveSentimentData.length,
          )
        : 0

    const summary = {
      total_interactions: totalInteractions,
      avg_sentiment_improvement: avgSentimentImprovement,
      avg_crosstalk: avgCrosstalk,
      avg_mutual_silence: avgMutualSilence,
      avg_positive_sentiment: avgPositiveSentiment,
    }

    console.log("Calculated analytics summary:", summary)
    return summary
  } catch (error) {
    console.error("Error calculating analytics summary:", error)
    return {
      total_interactions: 0,
      avg_sentiment_improvement: 0,
      avg_crosstalk: 0,
      avg_mutual_silence: 0,
      avg_positive_sentiment: 0,
    }
  }
}

// Fallback demo data in case API is not available - Updated with 10 interactions
export const fallbackDemoData: InteractionData[] = [
  {
    id: "INT-DEMO-001",
    date: "2024-01-15",
    agent_name: "Sarah",
    issue_type: "Technical Support",
    description: "Internet troubleshooting",
    sentiment_start: 15,
    sentiment_end: 78,
    positive_sentiment: 72,
    negative_sentiment: 28,
    crosstalk_score: 2.1,
    mutual_silence_score: 8.3,
    nontalk_score: 5.2,
    resolution: "Excellent recovery",
    coaching_recommendations: [
      "Great technical problem-solving approach",
      "Excellent customer empathy during frustration",
      "Consider mentoring other agents on de-escalation",
    ],
    greeting_text: "Thank you for calling Spectrum, this is Sarah, how can I help you today?",
    has_greeting: true,
    behavior: "Complete Professional Greeting",
    compliance_score: "Excellent",
  },
  {
    id: "INT-DEMO-002",
    date: "2024-01-15",
    agent_name: "Mike",
    issue_type: "Billing Dispute",
    description: "Premium channel charges",
    sentiment_start: 25,
    sentiment_end: 92,
    positive_sentiment: 85,
    negative_sentiment: 15,
    crosstalk_score: 1.8,
    mutual_silence_score: 4.2,
    nontalk_score: 3.1,
    resolution: "Strong resolution",
    coaching_recommendations: [
      "Exceptional billing knowledge demonstration",
      "Strong conflict resolution skills",
      "Maintain this level of customer advocacy",
    ],
    greeting_text: "Good morning, Spectrum, this is Mike, what can I help you with?",
    has_greeting: true,
    behavior: "Professional Greeting",
    compliance_score: "Excellent",
  },
  {
    id: "INT-DEMO-003",
    date: "2024-01-14",
    agent_name: "Sarah",
    issue_type: "Sales Success",
    description: "Internet upgrade",
    sentiment_start: 45,
    sentiment_end: 88,
    positive_sentiment: 82,
    negative_sentiment: 18,
    crosstalk_score: 0.9,
    mutual_silence_score: 3.1,
    nontalk_score: 2.3,
    resolution: "Consultative approach",
    coaching_recommendations: [
      "Perfect consultative selling technique",
      "Great needs assessment questions",
      "Model for other sales interactions",
    ],
    greeting_text: "Hi there, Spectrum, Sarah speaking, how may I assist you?",
    has_greeting: true,
    behavior: "Consultative Greeting",
    compliance_score: "Good",
  },
  {
    id: "INT-DEMO-004",
    date: "2024-01-14",
    agent_name: "Jessica",
    issue_type: "Frustrated Customer",
    description: "Cable outages",
    sentiment_start: 8,
    sentiment_end: 85,
    positive_sentiment: 68,
    negative_sentiment: 32,
    crosstalk_score: 7.2,
    mutual_silence_score: 12.4,
    nontalk_score: 8.7,
    resolution: "Great de-escalation",
    coaching_recommendations: [
      "Outstanding de-escalation skills",
      "Work on reducing interruptions during venting",
      "Excellent empathy and solution focus",
    ],
    greeting_text: "Spectrum, this is Jessica, I'm here to help you today",
    has_greeting: true,
    behavior: "Empathetic Greeting",
    compliance_score: "Good",
  },
  {
    id: "INT-DEMO-005",
    date: "2024-01-13",
    agent_name: "Mike",
    issue_type: "Service Transfer",
    description: "Moving address",
    sentiment_start: 55,
    sentiment_end: 78,
    positive_sentiment: 75,
    negative_sentiment: 25,
    crosstalk_score: 1.2,
    mutual_silence_score: 6.8,
    nontalk_score: 4.8,
    resolution: "Proactive service",
    coaching_recommendations: [
      "Good proactive service approach",
      "Consider upselling opportunities during transfers",
      "Solid process knowledge",
    ],
    greeting_text: "Thank you for calling Spectrum, Mike here, how can I make your day better?",
    has_greeting: true,
    behavior: "Personalized Greeting",
    compliance_score: "Good",
  },
  {
    id: "INT-DEMO-006",
    date: "2024-01-13",
    agent_name: "Jessica",
    issue_type: "Chat Support",
    description: "Bill explanation",
    sentiment_start: 35,
    sentiment_end: 82,
    positive_sentiment: 78,
    negative_sentiment: 22,
    crosstalk_score: 0.0,
    mutual_silence_score: 2.1,
    nontalk_score: 6.2,
    resolution: "Efficient resolution",
    coaching_recommendations: [
      "Excellent chat efficiency",
      "Clear bill explanation skills",
      "Good use of screen sharing tools",
    ],
    greeting_text: "Hello! Welcome to Spectrum support chat. I'm Jessica and I'm ready to help!",
    has_greeting: true,
    behavior: "Chat Greeting",
    compliance_score: "Excellent",
  },
  {
    id: "INT-DEMO-007",
    date: "2024-01-12",
    agent_name: "David",
    issue_type: "Service Changes",
    description: "Cancel cable TV",
    sentiment_start: 42,
    sentiment_end: 89,
    positive_sentiment: 81,
    negative_sentiment: 19,
    crosstalk_score: 3.4,
    mutual_silence_score: 9.2,
    nontalk_score: 7.1,
    resolution: "Value-focused retention",
    coaching_recommendations: [
      "Strong retention conversation",
      "Good value proposition presentation",
      "Reduce research time with better preparation",
    ],
    greeting_text: "Spectrum Communications, David speaking, what brings you in today?",
    has_greeting: true,
    behavior: "Casual Professional",
    compliance_score: "Good",
  },
  {
    id: "INT-DEMO-008",
    date: "2024-01-12",
    agent_name: "Sarah",
    issue_type: "Chat Upsell",
    description: "Add phone service",
    sentiment_start: 60,
    sentiment_end: 91,
    positive_sentiment: 88,
    negative_sentiment: 12,
    crosstalk_score: 0.0,
    mutual_silence_score: 1.5,
    nontalk_score: 1.8,
    resolution: "Consultative sales",
    coaching_recommendations: [
      "Perfect chat-based selling approach",
      "Excellent needs discovery",
      "Great bundle value explanation",
    ],
    greeting_text: "Hi! Thanks for choosing Spectrum chat support. I'm Sarah - what can I help you explore today?",
    has_greeting: true,
    behavior: "Engaging Chat Greeting",
    compliance_score: "Excellent",
  },
  {
    id: "INT-DEMO-009",
    date: "2024-01-11",
    agent_name: "David",
    issue_type: "WiFi Issues",
    description: "Coverage problems",
    sentiment_start: 28,
    sentiment_end: 86,
    positive_sentiment: 74,
    negative_sentiment: 26,
    crosstalk_score: 4.1,
    mutual_silence_score: 18.3,
    nontalk_score: 15.8,
    resolution: "Technical solution",
    coaching_recommendations: [
      "Strong technical troubleshooting",
      "Improve preparation to reduce research time",
      "Consider technical certification advancement",
    ],
    greeting_text: "Spectrum tech support, this is David, let's solve your connectivity issue",
    has_greeting: true,
    behavior: "Solution-Focused Greeting",
    compliance_score: "Good",
  },
  {
    id: "INT-DEMO-010",
    date: "2024-01-11",
    agent_name: "Mike",
    issue_type: "Critical Issue",
    description: "Frequent outages",
    sentiment_start: 5,
    sentiment_end: 75,
    positive_sentiment: 58,
    negative_sentiment: 42,
    crosstalk_score: 5.8,
    mutual_silence_score: 15.7,
    nontalk_score: 12.3,
    resolution: "Escalated support",
    coaching_recommendations: [
      "Excellent crisis management",
      "Good escalation decision making",
      "Work on active listening during high emotion",
    ],
    greeting_text:
      "Spectrum Communications, Mike here, I understand you're having some serious issues - let's get this fixed",
    has_greeting: true,
    behavior: "Crisis-Aware Greeting",
    compliance_score: "Good",
  },
]
