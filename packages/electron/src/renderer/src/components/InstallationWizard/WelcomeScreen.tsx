import { Button } from '@ai-brain/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@ai-brain/ui'
import { Check } from 'lucide-react'

interface WelcomeScreenProps {
  onNext: () => void
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-2xl font-bold">AI</span>
          </div>
        </div>
        <CardTitle className="text-2xl text-center">Welcome to AI Brain</CardTitle>
        <CardDescription className="text-center">
          Your personal AI memory, connected to all your AI tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <span>Create knowledge graphs from your notes and documents</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <span>Connect to your favorite AI tools (Claude Code, Copilot, Cursor, etc.)</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <span>Sync across machines via git</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onNext}>Get Started</Button>
      </CardFooter>
    </Card>
  )
}
