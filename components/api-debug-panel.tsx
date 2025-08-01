"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Loader2,
  Server,
  XCircle,
  Code,
  Network,
  Eye,
  Copy,
  BookOpen,
} from "lucide-react"
import { getApiEndpoints } from "@/lib/api"

const API_BASE_URL = "https://ciap-app-kcf5ofqycqvs2.mangomeadow-b5c8efc2.centralus.azurecontainerapps.io"

interface DetailedDiagnostic {
  endpoint: string
  method: string
  status: number | null
  success: boolean
  error?: string
  responseTime?: number
  headers?: Record<string, string>
  responseHeaders?: Record<string, string>
  rawResponse?: string
  parsedData?: any
  corsError?: boolean
  networkError?: boolean
  timeoutError?: boolean
}

export function ApiDebugPanel() {
  const [diagnostics, setDiagnostics] = useState<DetailedDiagnostic[]>([])
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [customEndpoint, setCustomEndpoint] = useState("")
  const [customHeaders, setCustomHeaders] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [liveAnalysis, setLiveAnalysis] = useState<any>(null)

  const discoverApiEndpoints = async () => {
    setLoading(true)
    try {
      const endpoints = await getApiEndpoints()
      setAvailableEndpoints(endpoints)
      console.log("Discovered API endpoints:", endpoints)
    } catch (error) {
      console.error("Error discovering endpoints:", error)
      setAvailableEndpoints([])
    } finally {
      setLoading(false)
    }
  }

  const runDocumentedEndpointTests = async () => {
    setLoading(true)
    setDiagnostics([])

    // First discover the available endpoints
    const allEndpoints = await getApiEndpoints()

    // Filter out parameterized endpoints
    const baseEndpoints = allEndpoints.filter((endpoint) => {
      const hasParameters = endpoint.includes("{") && endpoint.includes("}")
      if (hasParameters) {
        console.log(`Skipping parameterized endpoint: ${endpoint}`)
      }
      return !hasParameters
    })

    setAvailableEndpoints(baseEndpoints)
    console.log("Base endpoints to test:", baseEndpoints)

    if (baseEndpoints.length === 0) {
      setDiagnostics([
        {
          endpoint: "/openapi.json",
          method: "GET",
          status: null,
          success: false,
          error: "No base endpoints found - all endpoints require parameters",
        },
      ])
      setLoading(false)
      return
    }

    const results: DetailedDiagnostic[] = []

    // Test only the base endpoints (no parameters required)
    for (const endpoint of baseEndpoints) {
      const startTime = Date.now()
      console.log(`Testing base endpoint: ${API_BASE_URL}${endpoint}`)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        const headers: Record<string, string> = {
          Accept: "application/json",
          "Content-Type": "application/json",
        }

        if (customHeaders) {
          try {
            const parsed = JSON.parse(customHeaders)
            Object.assign(headers, parsed)
          } catch (e) {
            console.warn("Invalid custom headers JSON")
          }
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "GET",
          headers,
          signal: controller.signal,
          mode: "cors",
        })

        clearTimeout(timeoutId)
        const responseTime = Date.now() - startTime

        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        let rawResponse = ""
        let parsedData = null

        try {
          rawResponse = await response.text()

          if (rawResponse) {
            try {
              parsedData = JSON.parse(rawResponse)
            } catch (e) {
              parsedData = rawResponse.length > 500 ? rawResponse.substring(0, 500) + "..." : rawResponse
            }
          }
        } catch (e) {
          rawResponse = "Failed to read response body"
        }

        results.push({
          endpoint: endpoint,
          method: "GET",
          status: response.status,
          success: response.ok,
          responseTime,
          headers,
          responseHeaders,
          rawResponse,
          parsedData,
          error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
          corsError: false,
          networkError: false,
          timeoutError: false,
        })
      } catch (error) {
        const responseTime = Date.now() - startTime
        let errorType = "Unknown error"
        let corsError = false
        let networkError = false
        let timeoutError = false

        if (error instanceof Error) {
          errorType = error.message

          if (error.name === "AbortError") {
            errorType = "Request timeout (15s)"
            timeoutError = true
          } else if (error.message.includes("CORS") || error.message.includes("cross-origin")) {
            corsError = true
          } else if (error.message.includes("fetch") || error.message.includes("network")) {
            networkError = true
          }
        }

        results.push({
          endpoint: endpoint,
          method: "GET",
          status: null,
          success: false,
          responseTime,
          error: errorType,
          corsError,
          networkError,
          timeoutError,
        })
      }
    }

    setDiagnostics(results)
    setLoading(false)
  }

  const testCustomEndpoint = async () => {
    if (!customEndpoint) return

    setLoading(true)
    const startTime = Date.now()

    try {
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      }

      if (customHeaders) {
        try {
          const parsed = JSON.parse(customHeaders)
          Object.assign(headers, parsed)
        } catch (e) {
          console.warn("Invalid custom headers JSON")
        }
      }

      const response = await fetch(`${API_BASE_URL}${customEndpoint}`, {
        method: "GET",
        headers,
        mode: "cors",
      })

      const responseTime = Date.now() - startTime
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      const rawResponse = await response.text()
      let parsedData = null

      try {
        parsedData = JSON.parse(rawResponse)
      } catch (e) {
        parsedData = rawResponse
      }

      const customResult: DetailedDiagnostic = {
        endpoint: customEndpoint,
        method: "GET",
        status: response.status,
        success: response.ok,
        responseTime,
        responseHeaders,
        rawResponse,
        parsedData,
        error: response.ok ? undefined : `HTTP ${response.status} ${response.statusText}`,
      }

      setDiagnostics([customResult, ...diagnostics])
    } catch (error) {
      const responseTime = Date.now() - startTime
      const customResult: DetailedDiagnostic = {
        endpoint: customEndpoint,
        method: "GET",
        status: null,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }

      setDiagnostics([customResult, ...diagnostics])
    }

    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusBadge = (result: DetailedDiagnostic) => {
    if (result.success) {
      return <Badge className="bg-green-500">✓ {result.status}</Badge>
    } else if (result.status) {
      return <Badge variant="destructive">✗ {result.status}</Badge>
    } else if (result.corsError) {
      return <Badge variant="destructive">✗ CORS</Badge>
    } else if (result.networkError) {
      return <Badge variant="destructive">✗ Network</Badge>
    } else if (result.timeoutError) {
      return <Badge variant="destructive">✗ Timeout</Badge>
    } else {
      return <Badge variant="outline">✗ No Response</Badge>
    }
  }

  const successfulEndpoints = diagnostics.filter((d) => d.success)
  const failedEndpoints = diagnostics.filter((d) => !d.success)

  const runLiveApiAnalysis = async () => {
    setLoading(true)
    setLiveAnalysis(null)

    try {
      // First get the OpenAPI spec
      const specResponse = await fetch(`${API_BASE_URL}/openapi.json`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })

      if (!specResponse.ok) {
        throw new Error(`Failed to fetch API spec: ${specResponse.status}`)
      }

      const spec = await specResponse.json()
      console.log("Full API Spec:", spec)

      // Analyze the spec
      const analysis: any = {
        title: spec.info?.title,
        version: spec.info?.version,
        description: spec.info?.description,
        totalEndpoints: Object.keys(spec.paths || {}).length,
        baseEndpoints: 0,
        endpoints: [],
        schemas: spec.components?.schemas || {},
        endpointTests: [],
      }

      // Process endpoints
      if (spec.paths) {
        Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
          const isBase = !path.includes("{") && !path.includes("}")
          if (isBase) analysis.baseEndpoints++

          const endpointMethods = Object.keys(methods)
          analysis.endpoints.push({
            path,
            methods: endpointMethods,
            isBase,
            summary: methods.get?.summary || methods.post?.summary || "No description",
          })
        })
      }

      // Test each base endpoint
      const baseEndpoints = analysis.endpoints.filter((ep: any) => ep.isBase)
      console.log("Testing base endpoints:", baseEndpoints)

      for (const endpoint of baseEndpoints) {
        const startTime = Date.now()
        try {
          console.log(`Testing: ${API_BASE_URL}${endpoint.path}`)

          const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(10000),
          })

          const responseTime = Date.now() - startTime
          let sampleData = null

          if (response.ok) {
            try {
              const text = await response.text()
              if (text) {
                sampleData = JSON.parse(text)
                console.log(`${endpoint.path} response:`, sampleData)
              }
            } catch (e) {
              console.log(`${endpoint.path} - Could not parse JSON response`)
            }
          }

          analysis.endpointTests.push({
            endpoint: endpoint.path,
            success: response.ok,
            status: response.status,
            responseTime,
            sampleData: sampleData,
            error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
          })
        } catch (error) {
          const responseTime = Date.now() - startTime
          analysis.endpointTests.push({
            endpoint: endpoint.path,
            success: false,
            status: null,
            responseTime,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      setLiveAnalysis(analysis)
      console.log("Complete API Analysis:", analysis)
    } catch (error) {
      console.error("Live API analysis failed:", error)
      setLiveAnalysis({
        error: error instanceof Error ? error.message : "Analysis failed",
        totalEndpoints: 0,
        baseEndpoints: 0,
        endpoints: [],
        endpointTests: [],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                API Documentation & Testing
                {diagnostics.length > 0 && (
                  <Badge variant="outline">
                    {successfulEndpoints.length}/{diagnostics.length} working
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4" />
            </CardTitle>
            <CardDescription>Test only the documented API endpoints from the Swagger documentation</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertDescription>
                <strong>API Documentation:</strong>
                <br />
                <a
                  href={`${API_BASE_URL}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {API_BASE_URL}/docs
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`${API_BASE_URL}/docs`)}
                  className="ml-2 h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="discover" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="discover">Discover</TabsTrigger>
                <TabsTrigger value="test">Test Documented</TabsTrigger>
                <TabsTrigger value="custom">Custom Test</TabsTrigger>
                <TabsTrigger value="live-analysis">Live Analysis</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              <TabsContent value="discover" className="space-y-4">
                <Button onClick={discoverApiEndpoints} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Discovering API Endpoints...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Discover Available Endpoints
                    </>
                  )}
                </Button>

                {availableEndpoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Documented Endpoints ({availableEndpoints.length})
                    </h4>
                    <div className="space-y-1">
                      {availableEndpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                          <code className="text-sm font-mono">{endpoint}</code>
                          <Badge variant="outline">GET</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="test" className="space-y-4">
                <Button onClick={runDocumentedEndpointTests} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing Documented Endpoints...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4 mr-2" />
                      Test All Documented Endpoints
                    </>
                  )}
                </Button>

                {successfulEndpoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Working Endpoints ({successfulEndpoints.length})
                    </h4>
                    <div className="space-y-2">
                      {successfulEndpoints.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{result.endpoint}</code>
                            {getStatusBadge(result)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {result.responseTime}ms
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {failedEndpoints.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Failed Endpoints ({failedEndpoints.length})
                    </h4>
                    <div className="space-y-2">
                      {failedEndpoints.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded border">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{result.endpoint}</code>
                            {getStatusBadge(result)}
                          </div>
                          <div className="text-xs text-red-600 max-w-xs truncate">{result.error}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="endpoint">Custom Endpoint Path</Label>
                    <Input
                      id="endpoint"
                      placeholder="/your-documented-endpoint"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="headers">Custom Headers (JSON)</Label>
                    <Textarea
                      id="headers"
                      placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
                      value={customHeaders}
                      onChange={(e) => setCustomHeaders(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={testCustomEndpoint} disabled={loading || !customEndpoint} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Network className="h-4 w-4 mr-2" />
                        Test Custom Endpoint
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="live-analysis" className="space-y-4">
                <div className="space-y-4">
                  <Button onClick={runLiveApiAnalysis} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Live API...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Run Live API Analysis
                      </>
                    )}
                  </Button>

                  {liveAnalysis && (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">API Specification Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>API Title:</strong> {liveAnalysis.title || "Unknown"}
                            </div>
                            <div>
                              <strong>Version:</strong> {liveAnalysis.version || "Unknown"}
                            </div>
                            <div>
                              <strong>Total Endpoints:</strong> {liveAnalysis.totalEndpoints}
                            </div>
                            <div>
                              <strong>Base Endpoints:</strong> {liveAnalysis.baseEndpoints}
                            </div>
                          </div>

                          {liveAnalysis.endpoints && liveAnalysis.endpoints.length > 0 && (
                            <div>
                              <strong className="text-sm">Available Endpoints:</strong>
                              <div className="mt-2 space-y-1">
                                {liveAnalysis.endpoints.map((endpoint: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded border text-sm"
                                  >
                                    <code className="font-mono">{endpoint.path}</code>
                                    <div className="flex gap-1">
                                      {endpoint.methods.map((method: string) => (
                                        <Badge key={method} variant="outline" className="text-xs">
                                          {method.toUpperCase()}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {liveAnalysis.schemas && Object.keys(liveAnalysis.schemas).length > 0 && (
                            <div>
                              <strong className="text-sm">Data Models:</strong>
                              <div className="mt-2 space-y-1">
                                {Object.keys(liveAnalysis.schemas).map((schema) => (
                                  <Badge key={schema} variant="secondary" className="mr-1 mb-1">
                                    {schema}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {liveAnalysis.endpointTests && liveAnalysis.endpointTests.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Live Endpoint Testing</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {liveAnalysis.endpointTests.map((test: any, index: number) => (
                                <div key={index} className="border rounded p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <code className="text-sm font-mono">{test.endpoint}</code>
                                    {test.success ? (
                                      <Badge className="bg-green-500">✓ {test.status}</Badge>
                                    ) : (
                                      <Badge variant="destructive">✗ {test.status || "Failed"}</Badge>
                                    )}
                                  </div>

                                  {test.success && test.sampleData && (
                                    <div>
                                      <strong className="text-xs">Sample Response:</strong>
                                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-h-32 overflow-y-auto">
                                        {JSON.stringify(test.sampleData, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {!test.success && test.error && (
                                    <div className="text-xs text-red-600 mt-1">
                                      <strong>Error:</strong> {test.error}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="results" className="space-y-4">
                {diagnostics.length > 0 ? (
                  <div className="space-y-4">
                    {diagnostics.map((result, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                              <Code className="h-4 w-4" />
                              {result.method} {result.endpoint}
                            </div>
                            {getStatusBadge(result)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Response Time:</strong> {result.responseTime}ms
                            </div>
                            <div>
                              <strong>Status:</strong> {result.status || "No Response"}
                            </div>
                          </div>

                          {result.error && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{result.error}</AlertDescription>
                            </Alert>
                          )}

                          {result.responseHeaders && Object.keys(result.responseHeaders).length > 0 && (
                            <div>
                              <strong className="text-sm">Response Headers:</strong>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(result.responseHeaders, null, 2)}
                              </pre>
                            </div>
                          )}

                          {result.rawResponse && (
                            <div>
                              <div className="flex items-center justify-between">
                                <strong className="text-sm">Response Body:</strong>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(result.rawResponse || "")}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-h-40 overflow-y-auto">
                                {result.rawResponse}
                              </pre>
                            </div>
                          )}

                          {result.parsedData && typeof result.parsedData === "object" && (
                            <div>
                              <strong className="text-sm">Parsed Data:</strong>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto max-h-40 overflow-y-auto">
                                {JSON.stringify(result.parsedData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2" />
                    <p>Discover and test endpoints to see detailed results</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
