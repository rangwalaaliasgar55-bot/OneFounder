/**
 * Skeleton loading components — shimmer placeholders that match final layout.
 * Improves perceived performance vs generic spinners.
 */

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3.5 rounded"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton skeleton-card ${className}`} />
  )
}

export function SkeletonStat({ className = '' }: { className?: string }) {
  return (
    <div className={`stat-card-3d ${className}`}>
      <div className="skeleton h-3 w-16 rounded mb-3" />
      <div className="skeleton h-8 w-24 rounded mb-2" />
      <div className="skeleton h-2.5 w-full rounded" />
    </div>
  )
}

export function SkeletonAvatar({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }
  return <div className={`skeleton rounded-full ${sizeClasses[size]} ${className}`} />
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton h-4 rounded"
              style={{ width: c === 0 ? '30%' : `${60 / cols}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="glass-strong rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-7 w-48 rounded mb-2" />
            <div className="skeleton h-4 w-64 rounded" />
          </div>
          <div className="skeleton h-8 w-28 rounded-full" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonCard className="h-72" />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <SkeletonCard className="h-72" />
        </div>
      </div>
    </div>
  )
}
