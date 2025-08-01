import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Target, AlertTriangle, MessageSquare } from "lucide-react"

interface CoachingInsightsProps {
  data: Array<{
    interactionId: string
    agentName: string
    sentimentStart: number
    sentimentEnd: number
    crosstalkScore: number
    nontalkScore: number
    coachingRecommendations: string[]
    issueType: string
    resolution: string
  }>
}

export function CoachingInsights({ data }: CoachingInsightsProps) {
  // Agent performance analysis
  const agentPerformance = data.reduce(
    (acc, call) => {
      if (!acc[call.agentName]) {
        acc[call.agentName] = {
          calls: [],
          avgSentimentImprovement: 0,
          avgCrosstalk: 0,
          avgNontalk: 0,
          totalCalls: 0,
        }
      }
      acc[call.agentName].calls.push(call)
      acc[call.agentName].totalCalls++
      return acc
    },
    {} as Record<
      string,
      {
        calls: any[]
        avgSentimentImprovement: number
        avgCrosstalk: number
        avgNontalk: number
        totalCalls: number
      }
    >,
  )

  // Calculate averages for each agent
  Object.keys(agentPerformance).forEach((agentName) => {
    const agent = agentPerformance[agentName]
    agent.avgSentimentImprovement =
      agent.calls.reduce((sum, call) => sum + (call.sentimentEnd - call.sentimentStart), 0) / agent.totalCalls
    agent.avgCrosstalk = agent.calls.reduce((sum, call) => sum + call.crosstalkScore, 0) / agent.totalCalls
    agent.avgNontalk = agent.calls.reduce((sum, call) => sum + call.nontalkScore, 0) / agent.totalCalls
  })

  const topPerformers = Object.entries(agentPerformance)
    .map(([name, stats]) => ({
      name,
      sentimentImprovement: Math.round(stats.avgSentimentImprovement),
      crosstalk: Math.round(stats.avgCrosstalk * 10) / 10,
      nontalk: Math.round(stats.avgNontalk * 10) / 10,
      totalCalls: stats.totalCalls,
    }))
    .sort((a, b) => b.sentimentImprovement - a.sentimentImprovement)

  // Coaching priorities based on metrics
  const coachingPriorities = Object.entries(agentPerformance)
    .map(([name, stats]) => {
      const priorities = []
      if (stats.avgCrosstalk > 5) priorities.push("Reduce interruptions")
      if (stats.avgNontalk > 10) priorities.push("Improve preparation")
      if (stats.avgSentimentImprovement < 30) priorities.push("Customer satisfaction")

      return {
        name,
        priorities,
        urgency: priorities.length > 2 ? "high" : priorities.length > 0 ? "medium" : "low",
      }
    })
    .filter((agent) => agent.priorities.length > 0)
    .sort((a, b) => b.priorities.length - a.priorities.length)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Agent Performance Rankings
          </CardTitle>
          <CardDescription>Based on sentiment improvement and call quality metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.slice(0, 4).map((agent, index) => (
              <div key={agent.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.totalCalls} calls analyzed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-3 w-3 text-green-500" />
                    <span>+{agent.sentimentImprovement} sentiment</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span>{agent.crosstalk}% crosstalk</span>
                    <span>{agent.nontalk}% nontalk</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            Coaching Priorities
          </CardTitle>
          <CardDescription>Agents requiring targeted coaching interventions</CardDescription>
        </CardHeader>
        <CardContent>
          {coachingPriorities.length > 0 ? (
            <div className="space-y-3">
              {coachingPriorities.slice(0, 5).map((agent) => (
                <div key={agent.name} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {agent.name}
                      {agent.urgency === "high" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.priorities.map((priority, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={`text-xs ${
                            agent.urgency === "high"
                              ? "border-red-300 text-red-600"
                              : agent.urgency === "medium"
                                ? "border-amber-300 text-amber-600"
                                : "border-blue-300 text-blue-600"
                          }`}
                        >
                          {priority}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All agents meeting performance standards!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
