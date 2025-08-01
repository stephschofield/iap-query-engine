"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  Download,
  Search,
  Filter,
  TrendingUp,
  MessageSquare,
  Users,
  Eye,
  Volume2,
  VolumeX,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CoachingInsights } from "@/components/coaching-insights"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { InteractionDetailModal } from "@/components/interaction-detail-modal"

// Enhanced Charter demo data with detailed scoring metrics
const charterDemoData = [
  {
    interactionId: "INT-DEMO-001",
    date: "2024-01-15",
    agentName: "Sarah",
    issueType: "Technical Support",
    description: "Internet troubleshooting",
    sentimentStart: 15,
    sentimentEnd: 78,
    positiveSentiment: 72,
    negativeSentiment: 28,
    crosstalkScore: 2.1,
    mutualSilenceScore: 8.3,
    nontalkScore: 5.2,
    resolution: "Excellent recovery",
    coachingRecommendations: [
      "Great technical problem-solving approach",
      "Excellent customer empathy during frustration",
      "Consider mentoring other agents on de-escalation",
    ],
    greetingText: "Thank you for calling Spectrum, this is Sarah, how can I help you today?",
    hasGreeting: true,
    behavior: "Complete Professional Greeting",
    complianceScore: "Excellent",
  },
  {
    interactionId: "INT-DEMO-002",
    date: "2024-01-15",
    agentName: "Mike",
    issueType: "Billing Dispute",
    description: "Premium channel charges",
    sentimentStart: 25,
    sentimentEnd: 92,
    positiveSentiment: 85,
    negativeSentiment: 15,
    crosstalkScore: 1.8,
    mutualSilenceScore: 4.2,
    nontalkScore: 3.1,
    resolution: "Strong resolution",
    coachingRecommendations: [
      "Exceptional billing knowledge demonstration",
      "Strong conflict resolution skills",
      "Maintain this level of customer advocacy",
    ],
    greetingText: "Good morning, Spectrum, this is Mike, what can I help you with?",
    hasGreeting: true,
    behavior: "Professional Greeting",
    complianceScore: "Excellent",
  },
  {
    interactionId: "INT-DEMO-003",
    date: "2024-01-14",
    agentName: "Sarah",
    issueType: "Sales Success",
    description: "Internet upgrade",
    sentimentStart: 45,
    sentimentEnd: 88,
    positiveSentiment: 82,
    negativeSentiment: 18,
    crosstalkScore: 0.9,
    mutualSilenceScore: 3.1,
    nontalkScore: 2.3,
    resolution: "Consultative approach",
    coachingRecommendations: [
      "Perfect consultative selling technique",
      "Great needs assessment questions",
      "Model for other sales interactions",
    ],
    greetingText: "Hi there, Spectrum, Sarah speaking, how may I assist you?",
    hasGreeting: true,
    behavior: "Consultative Greeting",
    complianceScore: "Good",
  },
  {
    interactionId: "INT-DEMO-004",
    date: "2024-01-14",
    agentName: "Jessica",
    issueType: "Frustrated Customer",
    description: "Cable outages",
    sentimentStart: 8,
    sentimentEnd: 85,
    positiveSentiment: 68,
    negativeSentiment: 32,
    crosstalkScore: 7.2,
    mutualSilenceScore: 12.4,
    nontalkScore: 8.7,
    resolution: "Great de-escalation",
    coachingRecommendations: [
      "Outstanding de-escalation skills",
      "Work on reducing interruptions during venting",
      "Excellent empathy and solution focus",
    ],
    greetingText: "Spectrum, this is Jessica, I'm here to help you today",
    hasGreeting: true,
    behavior: "Empathetic Greeting",
    complianceScore: "Good",
  },
  {
    interactionId: "INT-DEMO-005",
    date: "2024-01-13",
    agentName: "Mike",
    issueType: "Service Transfer",
    description: "Moving address",
    sentimentStart: 55,
    sentimentEnd: 78,
    positiveSentiment: 75,
    negativeSentiment: 25,
    crosstalkScore: 1.2,
    mutualSilenceScore: 6.8,
    nontalkScore: 4.8,
    resolution: "Proactive service",
    coachingRecommendations: [
      "Good proactive service approach",
      "Consider upselling opportunities during transfers",
      "Solid process knowledge",
    ],
    greetingText: "Thank you for calling Spectrum, Mike here, how can I make your day better?",
    hasGreeting: true,
    behavior: "Personalized Greeting",
    complianceScore: "Good",
  },
  {
    interactionId: "INT-DEMO-006",
    date: "2024-01-13",
    agentName: "Jessica",
    issueType: "Chat Support",
    description: "Bill explanation",
    sentimentStart: 35,
    sentimentEnd: 82,
    positiveSentiment: 78,
    negativeSentiment: 22,
    crosstalkScore: 0.0,
    mutualSilenceScore: 2.1,
    nontalkScore: 6.2,
    resolution: "Efficient resolution",
    coachingRecommendations: [
      "Excellent chat efficiency",
      "Clear bill explanation skills",
      "Good use of screen sharing tools",
    ],
    greetingText: "Hello! Welcome to Spectrum support chat. I'm Jessica and I'm ready to help!",
    hasGreeting: true,
    behavior: "Chat Greeting",
    complianceScore: "Excellent",
  },
  {
    interactionId: "INT-DEMO-007",
    date: "2024-01-12",
    agentName: "David",
    issueType: "Service Changes",
    description: "Cancel cable TV",
    sentimentStart: 42,
    sentimentEnd: 89,
    positiveSentiment: 81,
    negativeSentiment: 19,
    crosstalkScore: 3.4,
    mutualSilenceScore: 9.2,
    nontalkScore: 7.1,
    resolution: "Value-focused retention",
    coachingRecommendations: [
      "Strong retention conversation",
      "Good value proposition presentation",
      "Reduce research time with better preparation",
    ],
    greetingText: "Spectrum, David speaking, what brings you in today?",
    hasGreeting: true,
    behavior: "Casual Professional",
    complianceScore: "Good",
  },
  {
    interactionId: "INT-DEMO-008",
    date: "2024-01-12",
    agentName: "Sarah",
    issueType: "Chat Upsell",
    description: "Add phone service",
    sentimentStart: 60,
    sentimentEnd: 91,
    positiveSentiment: 88,
    negativeSentiment: 12,
    crosstalkScore: 0.0,
    mutualSilenceScore: 1.5,
    nontalkScore: 1.8,
    resolution: "Consultative sales",
    coachingRecommendations: [
      "Perfect chat-based selling approach",
      "Excellent needs discovery",
      "Great bundle value explanation",
    ],
    greetingText: "Hi! Thanks for choosing Spectrum chat support. I'm Sarah - what can I help you explore today?",
    hasGreeting: true,
    behavior: "Engaging Chat Greeting",
    complianceScore: "Excellent",
  },
  {
    interactionId: "INT-DEMO-009",
    date: "2024-01-11",
    agentName: "David",
    issueType: "WiFi Issues",
    description: "Coverage problems",
    sentimentStart: 28,
    sentimentEnd: 86,
    positiveSentiment: 74,
    negativeSentiment: 26,
    crosstalkScore: 4.1,
    mutualSilenceScore: 18.3,
    nontalkScore: 15.8,
    resolution: "Technical solution",
    coachingRecommendations: [
      "Strong technical troubleshooting",
      "Improve preparation to reduce research time",
      "Consider technical certification advancement",
    ],
    greetingText: "Spectrum tech support, this is David, let's solve your connectivity issue",
    hasGreeting: true,
    behavior: "Solution-Focused Greeting",
    complianceScore: "Good",
  },
  {
    interactionId: "INT-DEMO-010",
    date: "2024-01-11",
    agentName: "Mike",
    issueType: "Critical Issue",
    description: "Frequent outages",
    sentimentStart: 5,
    sentimentEnd: 75,
    positiveSentiment: 58,
    negativeSentiment: 42,
    crosstalkScore: 5.8,
    mutualSilenceScore: 15.7,
    nontalkScore: 12.3,
    resolution: "Escalated support",
    coachingRecommendations: [
      "Excellent crisis management",
      "Good escalation decision making",
      "Work on active listening during high emotion",
    ],
    greetingText: "Spectrum, Mike here, I understand you're having some serious issues - let's get this fixed",
    hasGreeting: true,
    behavior: "Crisis-Aware Greeting",
    complianceScore: "Good",
  },
]

export default function CharterAnalyticsDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<Date>()
  const [agentFilter, setAgentFilter] = useState("all")
  const [issueTypeFilter, setIssueTypeFilter] = useState("all")
  const [filteredData, setFilteredData] = useState(charterDemoData)
  const [selectedInteraction, setSelectedInteraction] = useState<(typeof charterDemoData)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filter data based on search and filters
  useEffect(() => {
    let filtered = charterDemoData

    if (searchTerm) {
      filtered = filtered.filter(
        (call) =>
          call.interactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          call.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (dateFilter) {
      const filterDate = format(dateFilter, "yyyy-MM-dd")
      filtered = filtered.filter((call) => call.date === filterDate)
    }

    if (agentFilter !== "all") {
      filtered = filtered.filter((call) => call.agentName === agentFilter)
    }

    if (issueTypeFilter !== "all") {
      filtered = filtered.filter((call) => call.issueType === issueTypeFilter)
    }

    setFilteredData(filtered)
  }, [searchTerm, dateFilter, agentFilter, issueTypeFilter])

  const totalInteractions = charterDemoData.length
  const avgSentimentImprovement = Math.round(
    charterDemoData.reduce((sum, call) => sum + (call.sentimentEnd - call.sentimentStart), 0) / totalInteractions,
  )
  const avgCrosstalk =
    Math.round((charterDemoData.reduce((sum, call) => sum + call.crosstalkScore, 0) / totalInteractions) * 10) / 10
  const avgMutualSilence =
    Math.round((charterDemoData.reduce((sum, call) => sum + call.mutualSilenceScore, 0) / totalInteractions) * 10) / 10
  const avgPositiveSentiment = Math.round(
    charterDemoData.reduce((sum, call) => sum + call.positiveSentiment, 0) / totalInteractions,
  )

  const uniqueAgents = [...new Set(charterDemoData.map((call) => call.agentName))]
  const uniqueIssueTypes = [...new Set(charterDemoData.map((call) => call.issueType))]

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

  const handleViewInteraction = (interaction: (typeof charterDemoData)[0]) => {
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
        call.interactionId,
        call.date,
        call.agentName,
        call.issueType,
        call.sentimentStart,
        call.sentimentEnd,
        call.sentimentEnd - call.sentimentStart,
        call.positiveSentiment,
        call.negativeSentiment,
        call.crosstalkScore,
        call.mutualSilenceScore,
        call.nontalkScore,
        call.resolution,
        call.coachingRecommendations[0] || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "spectrum-detailed-analytics-report.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Add Spectrum Logo */}
      <div className="flex justify-center mb-8">
        <img src="/images/spectrum-logo.png" alt="Spectrum Logo" className="h-16 w-auto" />
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Spectrum - Supervisor Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Detailed interaction analytics with crosstalk, mutual silence, and sentiment scoring
          </p>
        </div>
        <Button onClick={exportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Detailed Report
        </Button>
      </div>

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
            <div className="text-2xl font-bold">{totalInteractions}</div>
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
            <div className="text-2xl font-bold text-green-600">+{avgSentimentImprovement}</div>
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
            <div className="text-2xl font-bold text-blue-600">{avgPositiveSentiment}%</div>
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
            <div className="text-2xl font-bold">{avgCrosstalk}%</div>
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
            <div className="text-2xl font-bold">{avgMutualSilence}%</div>
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
            Filters & Search
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
                {uniqueAgents.map((agent) => (
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
                {uniqueIssueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus />
              </PopoverContent>
            </Popover>
            {(searchTerm || dateFilter || agentFilter !== "all" || issueTypeFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("")
                  setDateFilter(undefined)
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
          <CardTitle>Detailed Interaction Scoring</CardTitle>
          <CardDescription>
            Showing {filteredData.length} of {totalInteractions} interactions with comprehensive scoring metrics
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
                  <TableRow key={call.interactionId}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{call.interactionId}</div>
                        <div className="text-xs text-muted-foreground">{call.date}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{call.agentName}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{call.issueType}</div>
                        <div className="text-xs text-muted-foreground">{call.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {call.sentimentStart} → {call.sentimentEnd}
                        </div>
                        {getSentimentBadge(call.sentimentStart, call.sentimentEnd)}
                      </div>
                    </TableCell>
                    <TableCell>{getScoreBadge(call.positiveSentiment, "positive")}</TableCell>
                    <TableCell>{getScoreBadge(call.negativeSentiment, "negative")}</TableCell>
                    <TableCell>{getScoreBadge(call.crosstalkScore, "crosstalk")}</TableCell>
                    <TableCell>{getScoreBadge(call.mutualSilenceScore, "silence")}</TableCell>
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
