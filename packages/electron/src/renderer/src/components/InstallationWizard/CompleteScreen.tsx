import { Button } from '@ai-brain/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@ai-brain/ui'
import { CheckCircle } from 'lucide-react'

interface CompleteScreenProps {
  onLaunch: () => void
}

export function CompleteScreen({ onLaunch }: CompleteScreenProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <CardTitle className="text-2xl">You're All Set!</CardTitle>
        <CardDescription>AI Brain is ready to use</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground text-center">
          Your Python environment is configured and AI tools are ready.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onLaunch}>Launch App</Button>
      </CardFooter>
    </Card>
  )
}
