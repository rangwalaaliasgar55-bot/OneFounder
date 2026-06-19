interface EmptyStateAnimatedProps {
  icon: string
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

/**
 * Animated empty state — icon floats, text fades in with stagger.
 */
export function EmptyStateAnimated({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateAnimatedProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div
        className="text-6xl mb-6 animate-float"
        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 animate-slide-up stagger-2" style={{ animationFillMode: 'both' }}>
        {title}
      </h3>
      <p className="text-sm text-slate-400 text-center max-w-sm mb-6 animate-slide-up stagger-3" style={{ animationFillMode: 'both' }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary animate-slide-up stagger-4"
          style={{ animationFillMode: 'both' }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
