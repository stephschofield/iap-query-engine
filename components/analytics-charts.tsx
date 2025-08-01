import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, MessageSquare, Volume2, Clock } from "lucide-react"

interface AnalyticsChartsProps {
  data: Array<{
    interactionId: string
    agentName: string
    sentimentStart: number
    sentimentEnd: number
    crosstalkScore: number
    nontalkScore: number
    issueType: string
    date: string
  }>
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  // Sentiment improvement data
  const sentimentData = data.map((call) => ({
    id: call.interactionId.split("-")[2],
    agent: call.agentName,
    start: call.sentimentStart,
    end: call.sentimentEnd,
    improvement: call.sentimentEnd - call.sentimentStart,
  }))

  // Agent performance summary
  const agentSummary = data.reduce(
    (acc, call) => {
      if (!acc[call.agentName]) {
        acc[call.agentName] = {
          agent: call.agentName,
          avgSentiment: 0,
          avgCrosstalk: 0,
          avgNontalk: 0,
          callCount: 0,
          totalSentimentEnd: 0,
          totalCrosstalk: 0,
          totalNontalk: 0,
        }
      }
      acc[call.agentName].callCount++
      acc[call.agentName].totalSentimentEnd += call.sentimentEnd
      acc[call.agentName].totalCrosstalk += call.crosstalkScore
      acc[call.agentName].totalNontalk += call.nontalkScore
      return acc
    },
    {} as Record<string, any>,
  )

  const agentPerformanceData = Object.values(agentSummary).map((agent: any) => ({
    agent: agent.agent,
    avgSentiment: Math.round(agent.totalSentimentEnd / agent.callCount),
    avgCrosstalk: Math.round((agent.totalCrosstalk / agent.callCount) * 10) / 10,
    avgNontalk: Math.round((agent.totalNontalk / agent.callCount) * 10) / 10,
    callCount: agent.callCount,
  }))

  // Issue type distribution
  const issueTypeData = data.reduce(
    (acc, call) => {
      acc[call.issueType] = (acc[call.issueType] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const issueDistribution = Object.entries(issueTypeData).map(([type, count]) => ({
    type,
    count,
    percentage: Math.round((count / data.length) * 100),
  }))

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <CardDescription>Crosstalk and nontalk analysis by agent</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                avgCrosstalk: {
                  label: "Crosstalk %",
                  color: "hsl(var(--chart-4))",
                },
                avgNontalk: {
                  label: "Nontalk %",
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
                  <Bar dataKey="avgNontalk" fill="var(--color-avgNontalk)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Issue Type Distribution
            </CardTitle>
            <CardDescription>Breakdown of customer interaction types</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={issueDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
