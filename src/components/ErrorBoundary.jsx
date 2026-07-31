import { Component } from 'react'
import { AppIcon, Button, Card, CardContent } from '@/components/ui'
import { isChunkLoadError, reloadOnceForChunkError } from '@/utils/chunkLoadRecovery'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
    if (isChunkLoadError(error)) {
      reloadOnceForChunkError()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AppIcon name="warning" className="mx-auto mb-3 size-10 text-amber-500" />
              <h2 className="mb-2 text-lg font-extrabold">Something went wrong</h2>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
              </p>
              <Button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
