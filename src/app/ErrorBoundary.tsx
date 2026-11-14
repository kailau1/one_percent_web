import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface State {
  crashed: boolean
}

/**
 * Catches a crash while rendering anywhere below it and shows a way out, instead of leaving a
 * blank white page. (Error boundaries still have to be class components in React.)
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected error:', error, info.componentStack)
  }

  render() {
    if (!this.state.crashed) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-prose flex-col items-start justify-center gap-4 p-8">
        <h1 className="font-serif text-3xl">This page hit a problem</h1>
        <p className="text-ink-muted">
          Nothing you've saved is lost. Reload to carry on; any entry you were writing is kept as a draft.
        </p>
        <Button onClick={() => window.location.reload()}>Reload the page</Button>
      </div>
    )
  }
}
