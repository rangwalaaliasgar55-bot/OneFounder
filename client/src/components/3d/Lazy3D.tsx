import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'

/**
 * Code-split wrapper for Three.js components.
 * Lazy-loads Three.js-dependent components and shows a lightweight
 * placeholder while loading. Falls back to 2D on error.
 */

function ThreeDPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-500/30 to-violet-500/30 animate-pulse" />
        </div>
        <div className="text-xs text-slate-500">Loading 3D experience...</div>
      </div>
    </div>
  )
}

function ThreeDFallback({ children }: { children?: ReactNode }) {
  return (
    <div className="relative">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
        <div className="text-4xl mb-3">🌐</div>
        <div className="text-sm text-slate-400 mb-1">3D view unavailable</div>
        <div className="text-xs text-slate-500">Your browser may not support WebGL</div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  )
}

/**
 * Error boundary for 3D components.
 * Catches WebGL/R3F errors and shows a fallback.
 */
import { Component, type ErrorInfo } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ThreeDErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[3D] Error caught by boundary:', error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ThreeDFallback />
    }
    return this.props.children
  }
}

/**
 * Check if WebGL is available on this device.
 */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Check if the device is mobile (reduced 3D quality).
 */
export function isMobile(): boolean {
  return window.innerWidth < 768 || navigator.maxTouchPoints > 0
}

/**
 * Create a lazy-loaded 3D component with error boundary and loading state.
 *
 * Usage:
 *   const LazyBrain = createLazy3D(() => import('./BrainVisualization'))
 *   <LazyBrain fallback={<Brain2DView />} props={...} />
 */
export function createLazy3D<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback2D?: ReactNode
) {
  const LazyComponent = lazy(importFn)

  return function WrappedLazy3D(props: P) {
    // On mobile or without WebGL, show 2D fallback
    if (!isWebGLAvailable() || isMobile()) {
      return fallback2D ? <>{fallback2D}</> : <ThreeDFallback />
    }

    return (
      <ThreeDErrorBoundary fallback={fallback2D ? <>{fallback2D}</> : undefined}>
        <Suspense fallback={<ThreeDPlaceholder />}>
          <LazyComponent {...props} />
        </Suspense>
      </ThreeDErrorBoundary>
    )
  }
}
