"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Download,
  Search,
  Filter,
  TrendingUp,
  MessageSquare,
  Users,
  Eye,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Home,
} from "lucide-react"
import { CoachingInsights } from "@/components/coaching-insights"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { InteractionDetailModal } from "@/components/interaction-detail-modal"
import { ApiDiagnosticsPanel } from "@/components/api-diagnostics-panel"
import { ApiDebugPanel } from "@/components/api-debug-panel"
import { GreetingRequirements } from "@/components/greeting-requirements"
import { fetchInteractions, checkApiHealth, fallbackDemoData, fetchSwaggerSpec, type InteractionData } from "@/lib/api"
import Image from "next/image"

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [agentFilter, setAgentFilter] = useState("all")
  const [issueTypeFilter, setIssueTypeFilter] = useState("all")
  const [interactions, setInteractions] = useState<InteractionData[]>([])
  const [filteredData, setFilteredData] = useState<InteractionData[]>([])
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agents, setAgents] = useState<string[]>([])
  const [issueTypes, setIssueTypes] = useState<string[]>([])
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false)
  const [analyticsSummary, setAnalyticsSummary] = useState({
    total_interactions: 0,
    avg_sentiment_improvement: 0,
    avg_crosstalk: 0,
    avg_mutual_silence: 0,
    avg_positive_sentiment: 0,
  })

  const useFallbackData = () => {
    setIsUsingFallbackData(true)
    setInteractions(fallbackDemoData)
    setFilteredData(fallbackDemoData)

    // Extract unique agents and issue types from fallback data
    const fallbackAgents = [...new Set(fallbackDemoData.map((item) => item.agent_name))]
    const fallbackIssueTypes = [...new Set(fallbackDemoData.map((item) => item.issue_type))]

    setAgents(fallbackAgents)
    setIssueTypes(fallbackIssueTypes)

    calculateSummaryFromData(fallbackDemoData)
  }

  // Add a function to analyze the API documentation on component mount
  const analyzeApiDocumentation = async () => {
    try {
      console.log("Analyzing Spectrum Query Engine API documentation...")
      const spec = await fetchSwaggerSpec()

      // Log the API structure for analysis
      console.log("API Title:", spec.info?.title)
      console.log("API Version:", spec.info?.version)
      console.log("API Description:", spec.info?.description)

      if (spec.components?.schemas) {
        console.log("Available Data Models:", Object.keys(spec.components.schemas))
      }

      return spec
    } catch (error) {
      console.error("Failed to analyze API documentation:", error)
      return null
    }
  }

  // Update the loadData function to add more debugging
  const loadData = async () => {
    setLoading(true)
    setError(null)
    setIsUsingFallbackData(false)

    try {
      console.log("=== STARTING DATA LOAD ===")

      // First analyze the API documentation
      const apiSpec = await analyzeApiDocumentation()

      // Check if API is available
      const apiHealthy = await checkApiHealth()
      console.log("API Health Check:", apiHealthy)

      if (!apiSpec || !apiHealthy) {
        console.log("Could not load API specification or API is not available, using fallback data")
        useFallbackData()
        return
      }

      console.log("Attempting to fetch interactions...")

      // Try to load real data using the documented endpoints
      const interactionsResponse = await fetchInteractions({ limit: 100 })
      console.log("Interactions response:", interactionsResponse)

      if (interactionsResponse && interactionsResponse.data && interactionsResponse.data.length > 0) {
        console.log(`✓ Successfully loaded ${interactionsResponse.data.length} interactions`)
        setInteractions(interactionsResponse.data)
        setFilteredData(interactionsResponse.data)

        // Extract agents and issue types from the loaded data
        const loadedAgents = [...new Set(interactionsResponse.data.map((item) => item.agent_name).filter(Boolean))]
        const loadedIssueTypes = [...new Set(interactionsResponse.data.map((item) => item.issue_type).filter(Boolean))]

        setAgents(loadedAgents)
        setIssueTypes(loadedIssueTypes)
        calculateSummaryFromData(interactionsResponse.data)

        console.log("Extracted agents:", loadedAgents)
        console.log("Extracted issue types:", loadedIssueTypes)
      } else {
        console.log("No interaction data found, using fallback")
        useFallbackData()
      }
    } catch (err) {
      console.error("Error loading data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
      useFallbackData()
    } finally {
      setLoading(false)
      console.log("=== DATA LOAD COMPLETE ===")
    }
  }

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const calculateSummaryFromData = (data: InteractionData[]) => {
    if (data.length === 0) return

    const totalInteractions = data.length
    const avgSentimentImprovement = Math.round(
      data.reduce((sum, call) => sum + (call.sentiment_end - call.sentiment_start), 0) / totalInteractions,
    )
    const avgCrosstalk =
      Math.round((data.reduce((sum, call) => sum + call.crosstalk_score, 0) / totalInteractions) * 10) / 10
    const avgMutualSilence =
      Math.round((data.reduce((sum, call) => sum + call.mutual_silence_score, 0) / totalInteractions) * 10) / 10
    const avgPositiveSentiment = Math.round(
      data.reduce((sum, call) => sum + call.positive_sentiment, 0) / totalInteractions,
    )

    setAnalyticsSummary({
      total_interactions: totalInteractions,
      avg_sentiment_improvement: avgSentimentImprovement,
      avg_crosstalk: avgCrosstalk,
      avg_mutual_silence: avgMutualSilence,
      avg_positive_sentiment: avgPositiveSentiment,
    })
  }

  // Filter data based on search and filters
  useEffect(() => {
    let filtered = interactions

    if (searchTerm) {
      filtered = filtered.filter(
        (call) =>
          call.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.agent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.issue_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (agentFilter !== "all") {
      filtered = filtered.filter((call) => call.agent_name === agentFilter)
    }

    if (issueTypeFilter !== "all") {
      filtered = filtered.filter((call) => call.issue_type === issueTypeFilter)
    }

    setFilteredData(filtered)
  }, [searchTerm, agentFilter, issueTypeFilter, interactions])

  const getSentimentBadge = (start: number, end: number) => {
    const improvement = end - start
    if (improvement >= 50) {
      return <Badge className="bg-green-500">Excellent (+{improvement})</Badge>
    } else if (improvement >= 30) {
      return <Badge className="bg-blue-500">Good (+{improvement})</Badge>
    } else if (improvement >= 10) {
      return <Badge variant="secondary">Fair (+{improvement})</Badge>
    } else {
      return <Badge variant="outline">Minimal (+{improvement})</Badge>
    }
  }

  const getScoreBadge = (value: number, type: "crosstalk" | "silence" | "positive" | "negative") => {
    if (type === "crosstalk") {
      if (value <= 2) return <Badge className="bg-green-500">{value}%</Badge>
      if (value <= 5) return <Badge className="bg-yellow-500">{value}%</Badge>
      return <Badge variant="destructive">{value}%</Badge>
    }
    if (type === "silence") {
      if (value <= 5) return <Badge className="bg-green-500">{value}%</Badge>
      if (value <= 10) return <Badge className="bg-yellow-500">{value}%</Badge>
      return <Badge variant="destructive">{value}%</Badge>
    }
    if (type === "positive") {
      if (value >= 80) return <Badge className="bg-green-500">{value}%</Badge>
      if (value >= 60) return <Badge className="bg-blue-500">{value}%</Badge>
      return <Badge variant="secondary">{value}%</Badge>
    }
    if (type === "negative") {
      if (value <= 20) return <Badge className="bg-green-500">{value}%</Badge>
      if (value <= 40) return <Badge className="bg-yellow-500">{value}%</Badge>
      return <Badge variant="destructive">{value}%</Badge>
    }
    return <Badge variant="outline">{value}%</Badge>
  }

  const handleViewInteraction = (interaction: InteractionData) => {
    setSelectedInteraction(interaction)
    setIsModalOpen(true)
  }

  const exportData = () => {
    const csvContent = [
      [
        "Interaction ID",
        "Date",
        "Agent",
        "Issue Type",
        "Sentiment Start",
        "Sentiment End",
        "Improvement",
        "Positive Sentiment %",
        "Negative Sentiment %",
        "Crosstalk %",
        "Mutual Silence %",
        "Nontalk %",
        "Resolution",
        "Top Coaching Recommendation",
      ],
      ...filteredData.map((call) => [
        call.id,
        call.date,
        call.agent_name,
        call.issue_type,
        call.sentiment_start,
        call.sentiment_end,
        call.sentiment_end - call.sentiment_start,
        call.positive_sentiment,
        call.negative_sentiment,
        call.crosstalk_score,
        call.mutual_silence_score,
        call.nontalk_score,
        call.resolution,
        call.coaching_recommendations[0] || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "spectrum-admin-analytics-report.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Spectrum Admin Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Connection Status Alert */}
      {isUsingFallbackData && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Using demo data - API connection unavailable. Dashboard functionality is preserved for demonstration.
            </span>
            <Button variant="outline" size="sm" onClick={loadData} className="ml-4 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && !isUsingFallbackData && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Error loading data: {error}</span>
            <Button variant="outline" size="sm" onClick={loadData} className="ml-4 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* Top Header with Logo and Title */}
        <div className="space-y-4">
          {/* Logo at the top */}
          <div className="flex justify-center">
            <Image
              src="/spectrum-logo-new.png"
              alt="Spectrum"
              width={200}
              height={60}
              className="h-12 w-auto"
              priority
            />
          </div>

          {/* Title and subtitle below logo */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              {isUsingFallbackData ? (
                <>
                  <WifiOff className="h-4 w-4" />
                  Demo mode - Administrative controls and system diagnostics
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4" />
                  Administrative controls and system diagnostics
                </>
              )}
            </p>
          </div>

          {/* Action Buttons Row */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-2 bg-transparent"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={loadData} className="flex items-center gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={exportData} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* API Diagnostics Panel */}
      <ApiDiagnosticsPanel />

      {/* API Debug Panel */}
      <ApiDebugPanel />

      {/* Greeting Requirements */}
      <GreetingRequirements data={filteredData} />

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsSummary.total_interactions}</div>
            <p className="text-xs text-muted-foreground">Spectrum customer contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Sentiment Gain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{analyticsSummary.avg_sentiment_improvement}</div>
            <p className="text-xs text-muted-foreground">Customer satisfaction improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Avg Positive Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analyticsSummary.avg_positive_sentiment}%</div>
            <p className="text-xs text-muted-foreground">Overall positive sentiment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Avg Crosstalk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsSummary.avg_crosstalk}%</div>
            <p className="text-xs text-muted-foreground">Communication overlap</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <VolumeX className="h-4 w-4" />
              Avg Mutual Silence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsSummary.avg_mutual_silence}%</div>
            <p className="text-xs text-muted-foreground">Silence periods</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts data={filteredData} />

      {/* Coaching Insights */}
      <CoachingInsights data={filteredData} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Admin Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search interactions, agents, or issue types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Issue Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issue Types</SelectItem>
                {issueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || agentFilter !== "all" || issueTypeFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("")
                  setAgentFilter("all")
                  setIssueTypeFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Detailed Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin - Detailed Interaction Scoring</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {analyticsSummary.total_interactions} interactions with comprehensive
            scoring metrics {isUsingFallbackData && "(Demo Data)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interaction</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Sentiment Journey</TableHead>
                  <TableHead>Positive Sentiment</TableHead>
                  <TableHead>Negative Sentiment</TableHead>
                  <TableHead>Crosstalk</TableHead>
                  <TableHead>Mutual Silence</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{call.id}</div>
                        <div className="text-xs text-muted-foreground">{call.date}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{call.agent_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{call.issue_type}</div>
                        <div className="text-xs text-muted-foreground">{call.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {call.sentiment_start} → {call.sentiment_end}
                        </div>
                        {getSentimentBadge(call.sentiment_start, call.sentiment_end)}
                      </div>
                    </TableCell>
                    <TableCell>{getScoreBadge(call.positive_sentiment, "positive")}</TableCell>
                    <TableCell>{getScoreBadge(call.negative_sentiment, "negative")}</TableCell>
                    <TableCell>{getScoreBadge(call.crosstalk_score, "crosstalk")}</TableCell>
                    <TableCell>{getScoreBadge(call.mutual_silence_score, "silence")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {call.resolution}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInteraction(call)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Detail Modal */}
      <InteractionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        interaction={selectedInteraction}
      />
    </div>
  )
}
