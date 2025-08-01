import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Headphones,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"

interface InteractionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  interaction: {
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
  } | null
}

export function InteractionDetailModal({ isOpen, onClose, interaction }: InteractionDetailModalProps) {
  if (!interaction) return null

  const sentimentImprovement =
    typeof interaction.sentiment_end === "number" && typeof interaction.sentiment_start === "number"
      ? interaction.sentiment_end - interaction.sentiment_start
      : 0

  // Enhanced transcript handling - use real transcript if available
  const displayTranscript = interaction.transcript
    ? // If we have a real transcript, try to parse it or display as-is
      (() => {
        try {
          // Try to parse if it's JSON format
          const parsed = JSON.parse(interaction.transcript)
          if (Array.isArray(parsed)) {
            return parsed.map((entry, index) => ({
              speaker: entry.speaker || entry.role || (index % 2 === 0 ? "Agent" : "Customer"),
              timestamp: entry.timestamp || entry.time || `00:${String(index * 15).padStart(2, "0")}`,
              text: entry.text || entry.message || entry.content || String(entry),
              sentiment: entry.sentiment || (interaction.sentiment_start || 50) + index * 5,
            }))
          } else {
            // If it's a single string, split by common patterns
            const lines = interaction.transcript.split(/\n|Agent:|Customer:|Rep:|Caller:/).filter((line) => line.trim())
            return lines.map((line, index) => ({
              speaker: index % 2 === 0 ? "Agent" : "Customer",
              timestamp: `00:${String(index * 30).padStart(2, "0")}`,
              text: line.trim(),
              sentiment: (interaction.sentiment_start || 50) + index * 10,
            }))
          }
        } catch (e) {
          // If parsing fails, treat as plain text
          return [
            {
              speaker: "System",
              timestamp: "00:00",
              text: interaction.transcript,
              sentiment: interaction.sentiment_start || 50,
            },
          ]
        }
      })()
    : // Fallback to mock transcript if no real transcript available
      [
        {
          speaker: "Agent",
          timestamp: "00:00",
          text: interaction.greeting_text || "Hello, how can I help you today?",
          sentiment: interaction.sentiment_start || 50,
        },
        {
          speaker: "Customer",
          timestamp: "00:08",
          text: `I'm having issues with ${interaction.issue_type.toLowerCase()}. ${interaction.description}`,
          sentiment: interaction.sentiment_start || 50,
        },
        {
          speaker: "Agent",
          timestamp: "00:15",
          text: "I understand your concern and I'm here to help resolve this for you right away.",
          sentiment: (interaction.sentiment_start || 50) + 15,
        },
        {
          speaker: "Customer",
          timestamp: "01:45",
          text: "Thank you so much for your help! This is exactly what I needed.",
          sentiment: (interaction.sentiment_end || 80) - 5,
        },
        {
          speaker: "Agent",
          timestamp: "01:52",
          text: "You're very welcome! Is there anything else I can help you with today?",
          sentiment: interaction.sentiment_end || 80,
        },
      ]

  const getSentimentBadge = (sentiment: number) => {
    if (sentiment >= 80) return <Badge className="bg-green-500">Positive</Badge>
    if (sentiment >= 60) return <Badge className="bg-blue-500">Neutral-Positive</Badge>
    if (sentiment >= 40) return <Badge variant="secondary">Neutral</Badge>
    return <Badge variant="destructive">Negative</Badge>
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

  // Safely handle coaching recommendations
  const coachingRecommendations = Array.isArray(interaction.coaching_recommendations)
    ? interaction.coaching_recommendations
    : typeof interaction.coaching_recommendations === "string"
      ? [interaction.coaching_recommendations]
      : ["No coaching recommendations available"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Interaction Analysis: {interaction.id || "Unknown ID"}
          </DialogTitle>
          <DialogDescription>
            Detailed transcript and scoring analysis for {interaction.agent_name || "Unknown Agent"} -{" "}
            {interaction.date || "Unknown Date"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          {/* Transcript Section */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  Call Transcript
                </CardTitle>
                <CardDescription>
                  {interaction.issue_type || "Unknown Issue"} - {interaction.description || "No description available"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {displayTranscript.map((entry, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex-shrink-0">
                          {entry.speaker === "Agent" ? (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Headphones className="h-4 w-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {entry.speaker === "Agent" ? interaction.agent_name || "Agent" : "Customer"}
                            </span>
                            <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                            {getSentimentBadge(entry.sentiment)}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{entry.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Section */}
          <div className="flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <TrendingUp className="h-4 w-4" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{interaction.sentiment_start || 0}</div>
                        <div className="text-xs text-muted-foreground">Start Sentiment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{interaction.sentiment_end || 0}</div>
                        <div className="text-xs text-muted-foreground">End Sentiment</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">+{sentimentImprovement}</div>
                      <div className="text-xs text-muted-foreground">Sentiment Improvement</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Scoring */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4" />
                      Detailed Scoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Positive Sentiment</span>
                      </div>
                      {getScoreBadge(interaction.positive_sentiment || 0, "positive")}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Negative Sentiment</span>
                      </div>
                      {getScoreBadge(interaction.negative_sentiment || 0, "negative")}
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Crosstalk</span>
                      </div>
                      {getScoreBadge(interaction.crosstalk_score || 0, "crosstalk")}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <VolumeX className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Mutual Silence</span>
                      </div>
                      {getScoreBadge(interaction.mutual_silence_score || 0, "silence")}
                    </div>
                  </CardContent>
                </Card>

                {/* Greeting Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle className="h-4 w-4" />
                      Greeting Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      {interaction.has_greeting ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {interaction.has_greeting ? "Greeting Present" : "No Greeting Detected"}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Behavior Observed</div>
                      <Badge variant="outline" className="text-xs">
                        {interaction.behavior || "Unknown"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Compliance Score</div>
                      <Badge
                        variant={
                          interaction.compliance_score === "Excellent"
                            ? "default"
                            : interaction.compliance_score === "Good"
                              ? "secondary"
                              : interaction.compliance_score === "Needs Improvement"
                                ? "outline"
                                : "destructive"
                        }
                        className={
                          interaction.compliance_score === "Excellent"
                            ? "bg-green-500"
                            : interaction.compliance_score === "Good"
                              ? "bg-blue-500 text-white"
                              : ""
                        }
                      >
                        {interaction.compliance_score || "Unknown"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Coaching Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4" />
                      Coaching Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {coachingRecommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Resolution Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4" />
                      Resolution Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="mb-2">
                      {interaction.resolution || "Unknown Resolution"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Issue {interaction.resolution ? "successfully resolved" : "processed"} with{" "}
                      {sentimentImprovement > 50 ? "excellent" : sentimentImprovement > 30 ? "good" : "adequate"}{" "}
                      customer satisfaction improvement.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
