import { useTheme } from './theme'

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        flex items-center gap-2 rounded-lg transition-all duration-200
        ${compact
          ? 'w-8 h-8 justify-center hover:bg-white/5'
          : 'px-2.5 py-1.5 hover:bg-white/5'
        }
      `}
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <span className="text-sm flex-shrink-0 leading-none transition-transform duration-300"
        style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}>
        {isDark ? '🌙' : '☀️'}
      </span>
      {!compact && (
        <span className="text-xs font-medium">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  )
}
