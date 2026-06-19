import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex items-center justify-center min-h-screen"
          style={{ backgroundColor: '#060b18' }}
        >
          <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <div>
              <h1 className="text-white text-xl font-semibold mb-2">Something went wrong</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                An unexpected error occurred in this part of the app. Your data is safe.
              </p>
              {this.state.error && (
                <p className="mt-3 text-xs text-slate-400 font-mono bg-slate-900 rounded-lg px-3 py-2 text-left break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
