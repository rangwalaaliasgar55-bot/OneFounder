import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Page transition wrapper — animates content in/out on route changes.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('enter')

  useEffect(() => {
    setTransitionStage('exit')
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setTransitionStage('enter')
    }, 150)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div
      className="w-full h-full"
      style={{
        animation: transitionStage === 'enter'
          ? 'pageEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          : 'pageExit 0.15s ease-in forwards',
      }}
    >
      {displayChildren}
      <style>{`
        @keyframes pageEnter {
          from { opacity: 0; transform: translateY(8px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pageExit {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-4px) scale(0.99); }
        }
      `}</style>
    </div>
  )
}
