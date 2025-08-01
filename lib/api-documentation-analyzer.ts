// API Documentation Analyzer - Fetches and analyzes the actual API structure
const API_BASE_URL = "https://ciap-app-kcf5ofqycqvs2.mangomeadow-b5c8efc2.centralus.azurecontainerapps.io"

export interface ApiEndpointInfo {
  path: string
  method: string
  summary: string
  description: string
  parameters: any[]
  responses: any
  requestBody?: any
}

export interface ApiSchemaInfo {
  name: string
  type: string
  properties: Record<string, any>
  required: string[]
  example?: any
}

export interface ApiDocumentationAnalysis {
  title: string
  version: string
  description: string
  baseUrl: string
  endpoints: ApiEndpointInfo[]
  schemas: ApiSchemaInfo[]
  interactionEndpoints: ApiEndpointInfo[]
  dataModels: {
    interaction?: ApiSchemaInfo
    agent?: ApiSchemaInfo
    report?: ApiSchemaInfo
    analytics?: ApiSchemaInfo
  }
  fieldMappings: {
    agentFields: string[]
    transcriptFields: string[]
    sentimentFields: string[]
    dateFields: string[]
    idFields: string[]
  }
}

export async function analyzeApiDocumentation(): Promise<ApiDocumentationAnalysis> {
  console.log("🔍 Analyzing API Documentation...")

  try {
    // Fetch the OpenAPI specification
    const response = await fetch(`${API_BASE_URL}/openapi.json`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch API documentation: ${response.status}`)
    }

    const spec = await response.json()
    console.log("📋 Full OpenAPI Specification:", spec)

    // Extract basic API information
    const analysis: ApiDocumentationAnalysis = {
      title: spec.info?.title || "Unknown API",
      version: spec.info?.version || "Unknown Version",
      description: spec.info?.description || "No description available",
      baseUrl: API_BASE_URL,
      endpoints: [],
      schemas: [],
      interactionEndpoints: [],
      dataModels: {},
      fieldMappings: {
        agentFields: [],
        transcriptFields: [],
        sentimentFields: [],
        dateFields: [],
        idFields: [],
      },
    }

    console.log(`📊 API Info: ${analysis.title} v${analysis.version}`)

    // Analyze all endpoints
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          const endpointInfo: ApiEndpointInfo = {
            path,
            method: method.toUpperCase(),
            summary: details.summary || "",
            description: details.description || "",
            parameters: details.parameters || [],
            responses: details.responses || {},
            requestBody: details.requestBody,
          }

          analysis.endpoints.push(endpointInfo)

          // Identify interaction-related endpoints
          if (
            path.toLowerCase().includes("interaction") ||
            path.toLowerCase().includes("call") ||
            path.toLowerCase().includes("report") ||
            path.toLowerCase().includes("analytics")
          ) {
            analysis.interactionEndpoints.push(endpointInfo)
            console.log(`🎯 Found interaction endpoint: ${method.toUpperCase()} ${path}`)
          }
        })
      })
    }

    // Analyze schemas/components
    if (spec.components?.schemas) {
      Object.entries(spec.components.schemas).forEach(([name, schema]: [string, any]) => {
        const schemaInfo: ApiSchemaInfo = {
          name,
          type: schema.type || "object",
          properties: schema.properties || {},
          required: schema.required || [],
          example: schema.example,
        }

        analysis.schemas.push(schemaInfo)
        console.log(`📝 Found schema: ${name}`)
        console.log(`   Properties:`, Object.keys(schemaInfo.properties))

        // Categorize important schemas
        const lowerName = name.toLowerCase()
        if (lowerName.includes("interaction") || lowerName.includes("call")) {
          analysis.dataModels.interaction = schemaInfo
          console.log(`🎯 Identified interaction model: ${name}`)
        } else if (lowerName.includes("agent") || lowerName.includes("user")) {
          analysis.dataModels.agent = schemaInfo
          console.log(`👤 Identified agent model: ${name}`)
        } else if (lowerName.includes("report") || lowerName.includes("analytics")) {
          analysis.dataModels.analytics = schemaInfo
          console.log(`📈 Identified analytics model: ${name}`)
        }

        // Extract field mappings from schema properties
        Object.keys(schemaInfo.properties).forEach((fieldName) => {
          const lowerField = fieldName.toLowerCase()

          // Agent-related fields
          if (
            lowerField.includes("agent") ||
            lowerField.includes("user") ||
            lowerField.includes("rep") ||
            lowerField.includes("employee") ||
            lowerField.includes("staff") ||
            lowerField.includes("operator") ||
            lowerField === "name"
          ) {
            analysis.fieldMappings.agentFields.push(fieldName)
          }

          // Transcript-related fields
          if (
            lowerField.includes("transcript") ||
            lowerField.includes("conversation") ||
            lowerField.includes("dialogue") ||
            lowerField.includes("text") ||
            lowerField.includes("content")
          ) {
            analysis.fieldMappings.transcriptFields.push(fieldName)
          }

          // Sentiment-related fields
          if (
            lowerField.includes("sentiment") ||
            lowerField.includes("emotion") ||
            lowerField.includes("mood") ||
            lowerField.includes("score")
          ) {
            analysis.fieldMappings.sentimentFields.push(fieldName)
          }

          // Date-related fields
          if (
            lowerField.includes("date") ||
            lowerField.includes("time") ||
            lowerField.includes("created") ||
            lowerField.includes("updated") ||
            lowerField.includes("timestamp")
          ) {
            analysis.fieldMappings.dateFields.push(fieldName)
          }

          // ID-related fields
          if (
            lowerField.includes("id") ||
            lowerField.includes("uuid") ||
            lowerField.includes("key") ||
            lowerField.includes("reference")
          ) {
            analysis.fieldMappings.idFields.push(fieldName)
          }
        })
      })
    }

    // Log field mappings discovered
    console.log("🗺️ Field Mappings Discovered:")
    console.log("   Agent fields:", analysis.fieldMappings.agentFields)
    console.log("   Transcript fields:", analysis.fieldMappings.transcriptFields)
    console.log("   Sentiment fields:", analysis.fieldMappings.sentimentFields)
    console.log("   Date fields:", analysis.fieldMappings.dateFields)
    console.log("   ID fields:", analysis.fieldMappings.idFields)

    // Test actual endpoints to see real data structure
    console.log("🧪 Testing endpoints for real data structure...")
    await testEndpointsForRealData(analysis)

    return analysis
  } catch (error) {
    console.error("❌ Error analyzing API documentation:", error)
    throw error
  }
}

async function testEndpointsForRealData(analysis: ApiDocumentationAnalysis): Promise<void> {
  // Test the most promising endpoints to see actual data structure
  const testEndpoints = analysis.interactionEndpoints
    .filter((endpoint) => endpoint.method === "GET" && !endpoint.path.includes("{"))
    .slice(0, 3) // Test up to 3 endpoints

  for (const endpoint of testEndpoints) {
    try {
      console.log(`🧪 Testing endpoint: ${endpoint.method} ${endpoint.path}`)

      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${endpoint.path} response structure:`)

        // Analyze the actual response structure
        if (Array.isArray(data)) {
          console.log(`   📊 Array with ${data.length} items`)
          if (data.length > 0) {
            console.log(`   🔍 First item keys:`, Object.keys(data[0]))
            console.log(`   📝 First item sample:`, JSON.stringify(data[0], null, 2))

            // Update field mappings based on real data
            updateFieldMappingsFromRealData(analysis, data[0])
          }
        } else if (data && typeof data === "object") {
          if (data.data && Array.isArray(data.data)) {
            console.log(`   📊 Paginated response with ${data.data.length} items`)
            if (data.data.length > 0) {
              console.log(`   🔍 First item keys:`, Object.keys(data.data[0]))
              console.log(`   📝 First item sample:`, JSON.stringify(data.data[0], null, 2))
              updateFieldMappingsFromRealData(analysis, data.data[0])
            }
          } else {
            console.log(`   📊 Single object response`)
            console.log(`   🔍 Object keys:`, Object.keys(data))
            console.log(`   📝 Object sample:`, JSON.stringify(data, null, 2))
            updateFieldMappingsFromRealData(analysis, data)
          }
        }
      } else {
        console.log(`❌ ${endpoint.path} failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint.path} error:`, error)
    }
  }
}

function updateFieldMappingsFromRealData(analysis: ApiDocumentationAnalysis, sampleData: any): void {
  if (!sampleData || typeof sampleData !== "object") return

  console.log("🔄 Updating field mappings from real data...")

  const actualFields = Object.keys(sampleData)
  console.log("   📋 Actual fields in data:", actualFields)

  // Clear existing mappings and rebuild from real data
  analysis.fieldMappings = {
    agentFields: [],
    transcriptFields: [],
    sentimentFields: [],
    dateFields: [],
    idFields: [],
  }

  actualFields.forEach((fieldName) => {
    const lowerField = fieldName.toLowerCase()
    const fieldValue = sampleData[fieldName]

    console.log(`   🔍 Analyzing field '${fieldName}':`, typeof fieldValue, fieldValue)

    // Agent-related fields (more specific patterns)
    if (
      lowerField.includes("agent") ||
      lowerField.includes("user") ||
      lowerField.includes("rep") ||
      lowerField.includes("employee") ||
      lowerField.includes("staff") ||
      lowerField.includes("operator") ||
      lowerField.includes("analyst") ||
      lowerField.includes("specialist") ||
      (lowerField === "name" && typeof fieldValue === "string")
    ) {
      analysis.fieldMappings.agentFields.push(fieldName)
      console.log(`   ✅ Added to agent fields: ${fieldName}`)
    }

    // Transcript-related fields
    if (
      lowerField.includes("transcript") ||
      lowerField.includes("conversation") ||
      lowerField.includes("dialogue") ||
      lowerField.includes("recording") ||
      (lowerField.includes("text") && typeof fieldValue === "string" && fieldValue.length > 50) ||
      (lowerField.includes("content") && typeof fieldValue === "string" && fieldValue.length > 50)
    ) {
      analysis.fieldMappings.transcriptFields.push(fieldName)
      console.log(`   ✅ Added to transcript fields: ${fieldName}`)
    }

    // Sentiment-related fields
    if (
      lowerField.includes("sentiment") ||
      lowerField.includes("emotion") ||
      lowerField.includes("mood") ||
      lowerField.includes("score") ||
      lowerField.includes("rating")
    ) {
      analysis.fieldMappings.sentimentFields.push(fieldName)
      console.log(`   ✅ Added to sentiment fields: ${fieldName}`)
    }

    // Date-related fields
    if (
      lowerField.includes("date") ||
      lowerField.includes("time") ||
      lowerField.includes("created") ||
      lowerField.includes("updated") ||
      lowerField.includes("timestamp") ||
      (typeof fieldValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(fieldValue))
    ) {
      analysis.fieldMappings.dateFields.push(fieldName)
      console.log(`   ✅ Added to date fields: ${fieldName}`)
    }

    // ID-related fields
    if (
      lowerField.includes("id") ||
      lowerField.includes("uuid") ||
      lowerField.includes("key") ||
      lowerField.includes("reference") ||
      lowerField === "id" ||
      lowerField.endsWith("_id")
    ) {
      analysis.fieldMappings.idFields.push(fieldName)
      console.log(`   ✅ Added to ID fields: ${fieldName}`)
    }
  })

  console.log("🎯 Updated field mappings:")
  console.log("   Agent fields:", analysis.fieldMappings.agentFields)
  console.log("   Transcript fields:", analysis.fieldMappings.transcriptFields)
  console.log("   Sentiment fields:", analysis.fieldMappings.sentimentFields)
  console.log("   Date fields:", analysis.fieldMappings.dateFields)
  console.log("   ID fields:", analysis.fieldMappings.idFields)
}

// Export the analysis for use in other components
let cachedAnalysis: ApiDocumentationAnalysis | null = null

export async function getApiAnalysis(): Promise<ApiDocumentationAnalysis> {
  if (!cachedAnalysis) {
    cachedAnalysis = await analyzeApiDocumentation()
  }
  return cachedAnalysis
}

export function clearApiAnalysisCache(): void {
  cachedAnalysis = null
}
