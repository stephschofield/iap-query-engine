import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface GreetingAnalysis {
  hasGreeting: boolean
  greetingText: string | null
  behavior: string
  location: string | null
  confidence: number
  complianceScore: string
  coachingNote: string
}

export interface CharterAnalytics {
  sentimentStart: number
  sentimentEnd: number
  sentimentImprovement: number
  crosstalkScore: number
  nontalkScore: number
  coachingRecommendations: string[]
  issueResolution: string
  customerSatisfaction: number
}

export async function analyzeCharterInteraction(
  transcript: string,
  interactionType: string,
): Promise<CharterAnalytics> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt: `
        Analyze this Spectrum customer service interaction for coaching insights.
        
        Interaction Type: ${interactionType}
        Transcript: "${transcript}"
        
        Provide analysis in JSON format with:
        1. sentimentStart: number (0-100, customer sentiment at call start)
        2. sentimentEnd: number (0-100, customer sentiment at call end)  
        3. sentimentImprovement: number (calculated improvement)
        4. crosstalkScore: number (0-20, percentage of time with overlapping speech)
        5. nontalkScore: number (0-30, percentage of silence/research time)
        6. coachingRecommendations: string[] (3-5 specific coaching points)
        7. issueResolution: string (brief description of outcome)
        8. customerSatisfaction: number (0-100, overall satisfaction score)
        
        Focus on actionable coaching insights for Spectrum supervisors.
      `,
    })

    const analysis = JSON.parse(text)
    analysis.sentimentImprovement = analysis.sentimentEnd - analysis.sentimentStart
    return analysis
  } catch (error) {
    console.error("Error analyzing Spectrum interaction:", error)
    return {
      sentimentStart: 50,
      sentimentEnd: 50,
      sentimentImprovement: 0,
      crosstalkScore: 0,
      nontalkScore: 0,
      coachingRecommendations: ["Unable to analyze - technical error occurred"],
      issueResolution: "Analysis Error",
      customerSatisfaction: 0,
    }
  }
}

export async function analyzeCallGreeting(
  transcript: string,
  brandedGreetingRequirements: string[],
): Promise<GreetingAnalysis> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt: `
        Analyze the following Spectrum call transcript for greeting compliance.
        
        Spectrum greeting requirements:
        ${brandedGreetingRequirements.map((req) => `- ${req}`).join("\n")}
        
        Call transcript:
        "${transcript}"
        
        Return JSON with:
        1. hasGreeting: boolean
        2. greetingText: string or null
        3. behavior: string (specific greeting behavior observed)
        4. location: string or null (timestamp/position)
        5. confidence: number (0-1)
        6. complianceScore: string (Excellent, Good, Needs Improvement, Non-compliant)
        7. coachingNote: string (specific coaching recommendation)
      `,
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("Error analyzing greeting:", error)
    return {
      hasGreeting: false,
      greetingText: null,
      behavior: "Analysis Error",
      location: null,
      confidence: 0,
      complianceScore: "Error",
      coachingNote: "Unable to analyze - technical error occurred",
    }
  }
}

export const spectrumGreetingRequirements = [
  "Must include company name (Spectrum)",
  "Must include agent's name",
  "Must include offer to help or assist",
  "Should be professional and welcoming tone",
  "Should occur within first 10 seconds of call",
]
