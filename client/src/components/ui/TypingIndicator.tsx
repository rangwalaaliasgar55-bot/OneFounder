/**
 * Realistic AI typing indicator — three bouncing dots with stagger.
 */
export function TypingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-4 py-3 ${className}`}>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-400"
            style={{
              animation: 'typingBounce 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 ml-2">AI is thinking...</span>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
