import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

export function GreetingRequirements() {
  const requirements = [
    "Include company name: 'Charter Communications'",
    "State agent's first name clearly",
    "Offer assistance: 'How can I help you?' or similar",
    "Professional and welcoming tone",
    "Delivered within first 10 seconds of call",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Charter Greeting Standards
        </CardTitle>
        <CardDescription>All agent calls must meet these greeting standards</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {requirements.map((requirement, index) => (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {index + 1}
              </Badge>
              <span className="text-sm">{requirement}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
