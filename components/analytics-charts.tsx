import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, MessageSquare, Volume2 } from "lucide-react"

interface AnalyticsChartsProps {
  data: Array<{
    id: string
    agent_name: string
    sentiment_start: number
    sentiment_end: number
    crosstalk_score: number
    mutual_silence_score: number
    issue_type: string
    date: string
  }>
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  // Sentiment improvement data
  const sentimentData = data.map((call, index) => ({
    id: call.id && typeof call.id === "string" ? call.id.split("-").pop() || index.toString() : index.toString(),
    agent: call.agent_name || `Agent ${index + 1}`,
    start: typeof call.sentiment_start === "number" ? call.sentiment_start : 0,
    end: typeof call.sentiment_end === "number" ? call.sentiment_end : 0,
    improvement:
      typeof call.sentiment_end === "number" && typeof call.sentiment_start === "number"
        ? call.sentiment_end - call.sentiment_start
        : 0,
  }))

  // Agent performance summary
  const agentSummary = data.reduce(
    (acc, call) => {
      const agentName = call.agent_name || "Unknown Agent"
      if (!acc[agentName]) {
        acc[agentName] = {
          agent: agentName,
          avgSentiment: 0,
          avgCrosstalk: 0,
          avgMutualSilence: 0,
          callCount: 0,
          totalSentimentEnd: 0,
          totalCrosstalk: 0,
          totalMutualSilence: 0,
        }
      }
      acc[agentName].callCount++
      acc[agentName].totalSentimentEnd += typeof call.sentiment_end === "number" ? call.sentiment_end : 0
      acc[agentName].totalCrosstalk += typeof call.crosstalk_score === "number" ? call.crosstalk_score : 0
      acc[agentName].totalMutualSilence += typeof call.mutual_silence_score === "number" ? call.mutual_silence_score : 0
      return acc
    },
    {} as Record<string, any>,
  )

  const agentPerformanceData = Object.values(agentSummary).map((agent: any) => ({
    agent: agent.agent,
    avgSentiment: Math.round(agent.totalSentimentEnd / agent.callCount),
    avgCrosstalk: Math.round((agent.totalCrosstalk / agent.callCount) * 10) / 10,
    avgMutualSilence: Math.round((agent.totalMutualSilence / agent.callCount) * 10) / 10,
    callCount: agent.callCount,
  }))

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Sentiment Journey Analysis
            </CardTitle>
            <CardDescription>Customer sentiment improvement throughout interactions</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                start: {
                  label: "Start Sentiment",
                  color: "hsl(var(--chart-1))",
                },
                end: {
                  label: "End Sentiment",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sentimentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="id" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="start"
                    stackId="1"
                    stroke="var(--color-start)"
                    fill="var(--color-start)"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="end"
                    stackId="2"
                    stroke="var(--color-end)"
                    fill="var(--color-end)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Agent Performance Comparison
            </CardTitle>
            <CardDescription>Average sentiment scores by agent</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                avgSentiment: {
                  label: "Avg Sentiment",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis domain={[70, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="avgSentiment" fill="var(--color-avgSentiment)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-purple-500" />
              Communication Quality Metrics
            </CardTitle>
            <CardDescription>Crosstalk and mutual silence analysis by agent</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                avgCrosstalk: {
                  label: "Crosstalk %",
                  color: "hsl(var(--chart-4))",
                },
                avgMutualSilence: {
                  label: "Mutual Silence %",
                  color: "hsl(var(--chart-5))",
                },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentPerformanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="agent" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="avgCrosstalk" fill="var(--color-avgCrosstalk)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="avgMutualSilence" fill="var(--color-avgMutualSilence)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
