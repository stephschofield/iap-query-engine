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
    interactionId: string
    date: string
    agentName: string
    issueType: string
    description: string
    sentimentStart: number
    sentimentEnd: number
    positiveSentiment: number
    negativeSentiment: number
    crosstalkScore: number
    mutualSilenceScore: number
    nontalkScore: number
    resolution: string
    coachingRecommendations: string[]
    greetingText: string
    hasGreeting: boolean
    behavior: string
    complianceScore: string
    transcript?: string
  } | null
}

export function InteractionDetailModal({ isOpen, onClose, interaction }: InteractionDetailModalProps) {
  if (!interaction) return null

  const sentimentImprovement = interaction.sentimentEnd - interaction.sentimentStart

  // Mock transcript data - in real app this would come from API
  const mockTranscript = [
    {
      speaker: "Agent",
      timestamp: "00:00",
      text: interaction.greetingText,
      sentiment: interaction.sentimentStart,
    },
    {
      speaker: "Customer",
      timestamp: "00:08",
      text: "Hi, I'm having issues with my internet connection. It keeps dropping out every few minutes and it's really frustrating.",
      sentiment: interaction.sentimentStart,
    },
    {
      speaker: "Agent",
      timestamp: "00:15",
      text: "I completely understand how frustrating that must be, especially when you're trying to work or relax at home. Let me help you get this resolved right away. Can you tell me when this started happening?",
      sentiment: interaction.sentimentStart + 10,
    },
    {
      speaker: "Customer",
      timestamp: "00:28",
      text: "It started about three days ago. At first I thought it was just temporary, but it's been consistent since then.",
      sentiment: interaction.sentimentStart + 15,
    },
    {
      speaker: "Agent",
      timestamp: "00:35",
      text: "Thank you for that information. I'm going to run a diagnostic on your connection right now to see what might be causing this. This will take just a moment... I can see there are some signal issues on your line. Let me walk you through a few steps that should resolve this.",
      sentiment: interaction.sentimentStart + 25,
    },
    {
      speaker: "Customer",
      timestamp: "01:45",
      text: "Okay, I followed all those steps and the connection seems much more stable now. Thank you so much for your help!",
      sentiment: interaction.sentimentEnd - 5,
    },
    {
      speaker: "Agent",
      timestamp: "01:52",
      text: "You're very welcome! I'm glad we could get that resolved for you. Is there anything else I can help you with today? And please don't hesitate to call us if you experience any other issues.",
      sentiment: interaction.sentimentEnd,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Interaction Analysis: {interaction.interactionId}
          </DialogTitle>
          <DialogDescription>
            Detailed transcript and scoring analysis for {interaction.agentName} - {interaction.date}
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
                  {interaction.issueType} - {interaction.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {mockTranscript.map((entry, index) => (
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
                              {entry.speaker === "Agent" ? interaction.agentName : "Customer"}
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
                        <div className="text-2xl font-bold text-red-600">{interaction.sentimentStart}</div>
                        <div className="text-xs text-muted-foreground">Start Sentiment</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{interaction.sentimentEnd}</div>
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
                      {getScoreBadge(interaction.positiveSentiment, "positive")}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Negative Sentiment</span>
                      </div>
                      {getScoreBadge(interaction.negativeSentiment, "negative")}
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Crosstalk</span>
                      </div>
                      {getScoreBadge(interaction.crosstalkScore, "crosstalk")}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <VolumeX className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Mutual Silence</span>
                      </div>
                      {getScoreBadge(interaction.mutualSilenceScore, "silence")}
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
                      {interaction.hasGreeting ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {interaction.hasGreeting ? "Greeting Present" : "No Greeting Detected"}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Behavior Observed</div>
                      <Badge variant="outline" className="text-xs">
                        {interaction.behavior}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Compliance Score</div>
                      <Badge
                        variant={
                          interaction.complianceScore === "Excellent"
                            ? "default"
                            : interaction.complianceScore === "Good"
                              ? "secondary"
                              : interaction.complianceScore === "Needs Improvement"
                                ? "outline"
                                : "destructive"
                        }
                        className={
                          interaction.complianceScore === "Excellent"
                            ? "bg-green-500"
                            : interaction.complianceScore === "Good"
                              ? "bg-blue-500 text-white"
                              : ""
                        }
                      >
                        {interaction.complianceScore}
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
                      {interaction.coachingRecommendations.map((recommendation, index) => (
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
                      {interaction.resolution}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Issue successfully resolved with{" "}
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
