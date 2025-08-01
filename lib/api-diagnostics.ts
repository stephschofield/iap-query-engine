// API Diagnostics Tool
const API_BASE_URL = "https://ciap-app-kcf5ofqycqvs2.mangomeadow-b5c8efc2.centralus.azurecontainerapps.io"

export interface DiagnosticResult {
  endpoint: string
  status: number | null
  success: boolean
  error?: string
  responseTime?: number
  headers?: Record<string, string>
  data?: any
}

export async function runApiDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = []

  // First get all available endpoints from the OpenAPI spec
  let availableEndpoints: string[] = []

  try {
    const response = await fetch(`${API_BASE_URL}/openapi.json`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (response.ok) {
      const spec = await response.json()
      availableEndpoints = Object.keys(spec.paths || {})
      console.log("All endpoints from OpenAPI:", availableEndpoints)
    }
  } catch (error) {
    console.error("Could not fetch OpenAPI spec:", error)
  }

  // Filter out parameterized endpoints (those with {} placeholders)
  // AND explicitly exclude the problematic endpoints
  const problematicEndpoints = ["/api/v1/reports/batch", "/api/v1/interactions/search", "/api/v1/dsr/requests"]

  const baseEndpoints = availableEndpoints.filter((endpoint) => {
    // Skip parameterized endpoints
    if (endpoint.includes("{") && endpoint.includes("}")) {
      console.log(`Skipping parameterized endpoint: ${endpoint}`)
      return false
    }

    // Skip known problematic endpoints
    if (problematicEndpoints.includes(endpoint)) {
      console.log(`Skipping known problematic endpoint: ${endpoint}`)
      return false
    }

    return true
  })

  console.log("Base endpoints to test:", baseEndpoints)

  // If no base endpoints found, test some common ones that we know work
  const testEndpoints = baseEndpoints.length > 0 ? baseEndpoints : ["/docs", "/openapi.json", "/api/v1/interactions"]

  console.log("Final endpoints to test:", testEndpoints)

  for (const endpoint of testEndpoints) {
    const startTime = Date.now()

    try {
      const headers: Record<string, string> = {}

      // Use appropriate headers for different endpoint types
      if (endpoint === "/docs") {
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      } else {
        headers["Content-Type"] = "application/json"
        headers["Accept"] = "application/json"
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10000),
      })

      const responseTime = Date.now() - startTime
      const responseHeaders: Record<string, string> = {}

      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let data = null
      try {
        const text = await response.text()
        if (text) {
          try {
            data = JSON.parse(text)
          } catch {
            data = text.substring(0, 200)
          }
        }
      } catch (e) {
        // Ignore data parsing errors
      }

      results.push({
        endpoint,
        status: response.status,
        success: response.ok,
        responseTime,
        headers: responseHeaders,
        data,
        error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
      })
    } catch (error) {
      const responseTime = Date.now() - startTime

      results.push({
        endpoint,
        status: null,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

export async function testCorsAndAuth(): Promise<{
  corsSupported: boolean
  authRequired: boolean
  suggestions: string[]
}> {
  const suggestions: string[] = []
  let corsSupported = true
  let authRequired = false

  try {
    // Test basic connectivity to /docs first (since we know it exists)
    const response = await fetch(`${API_BASE_URL}/docs`, {
      method: "OPTIONS",
      headers: {
        Origin: window.location.origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
      },
    })

    if (!response.ok) {
      corsSupported = false
      suggestions.push("CORS might not be properly configured on the server")
    }

    // Check for auth requirements on interactions endpoint
    const getResponse = await fetch(`${API_BASE_URL}/api/v1/interactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (getResponse.status === 401 || getResponse.status === 403) {
      authRequired = true
      suggestions.push("API requires authentication - check if API keys or tokens are needed")
    }
  } catch (error) {
    corsSupported = false
    if (error instanceof Error && error.message.includes("CORS")) {
      suggestions.push("CORS error detected - server needs to allow requests from this domain")
    }
  }

  return {
    corsSupported,
    authRequired,
    suggestions,
  }
}
