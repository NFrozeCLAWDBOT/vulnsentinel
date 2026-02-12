import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function App() {
  return (
    <div className="min-h-screen bg-bg-deep text-text-primary">
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-peak-lum">
          VulnSentinel
        </h1>
        <p className="font-body text-text-secondary text-lg">
          Vulnerability intelligence. Actionable in seconds.
        </p>
        <div className="flex gap-3">
          <Button>Primary Action</Button>
          <Badge variant="destructive">Critical</Badge>
          <Badge className="bg-amber text-bg-deep">KEV</Badge>
        </div>
        <div className="glass rounded-2xl p-8 max-w-md text-center">
          <p className="text-text-secondary">
            Glassmorphic panel test — scaffold verified.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
