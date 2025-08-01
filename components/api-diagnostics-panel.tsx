"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Clock,
  Globe,
  Key,
  Loader2,
  Server,
  XCircle,
} from "lucide-react"
import { runApiDiagnostics, testCorsAndAuth, type DiagnosticResult } from "@/lib/api-diagnostics"

export function ApiDiagnosticsPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [corsTest, setCorsTest] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const [diagnosticResults, corsResults] = await Promise.all([runApiDiagnostics(), testCorsAndAuth()])

      setDiagnostics(diagnosticResults)
      setCorsTest(corsResults)
    } catch (error) {
      console.error("Diagnostics failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (result: DiagnosticResult) => {
    if (result.success) {
      return <Badge className="bg-green-500">✓ {result.status}</Badge>
    } else if (result.status) {
      return <Badge variant="destructive">✗ {result.status}</Badge>
    } else {
      return <Badge variant="outline">✗ No Response</Badge>
    }
  }

  const successfulEndpoints = diagnostics.filter((d) => d.success)
  const failedEndpoints = diagnostics.filter((d) => !d.success)

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                API Diagnostics
                {diagnostics.length > 0 && (
                  <Badge variant="outline">
                    {successfulEndpoints.length}/{diagnostics.length} working
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4" />
            </CardTitle>
            <CardDescription>Diagnose API connectivity and discover available endpoints</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Button onClick={runDiagnostics} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <Server className="h-4 w-4 mr-2" />
                  Run API Diagnostics
                </>
              )}
            </Button>

            {corsTest && (
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {corsTest.corsSupported ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>CORS: {corsTest.corsSupported ? "Supported" : "Issues Detected"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {corsTest.authRequired ? (
                        <Key className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span>Auth: {corsTest.authRequired ? "Required" : "Not Required"}</span>
                    </div>
                    {corsTest.suggestions.length > 0 && (
                      <div className="mt-2">
                        <strong>Suggestions:</strong>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {corsTest.suggestions.map((suggestion: string, index: number) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

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
                  {failedEndpoints.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded border">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{result.endpoint}</code>
                        {getStatusBadge(result)}
                      </div>
                      <div className="text-xs text-red-600">{result.error}</div>
                    </div>
                  ))}
                  {failedEndpoints.length > 5 && (
                    <div className="text-sm text-muted-foreground text-center">
                      ... and {failedEndpoints.length - 5} more failed endpoints
                    </div>
                  )}
                </div>
              </div>
            )}

            {diagnostics.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Next Steps:</strong>
                  <ul className="list-disc list-inside text-sm mt-1">
                    <li>Check if the Azure Container App is running</li>
                    <li>Verify the correct base URL and endpoint paths</li>
                    <li>Check if authentication headers are required</li>
                    <li>Ensure CORS is configured for your domain</li>
                    <li>Contact the API administrator if issues persist</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
