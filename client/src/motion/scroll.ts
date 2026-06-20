/**
 * OneFounder Motion System — Scroll Hooks
 *
 * Hooks for scroll-triggered animations and parallax effects.
 */

import { useRef, useState, useEffect, type RefObject } from 'react'

/**
 * Returns a ref and boolean indicating if the element is in the viewport.
 * Replaces manual IntersectionObserver patterns throughout the app.
 */
export function useScrollReveal(threshold = 0.1): [RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.unobserve(el) // Only trigger once
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, isInView]
}

/**
 * Returns a CSS transform value for parallax scroll effect.
 * Usage: style={{ transform: `translateY(${parallaxY}px)` }}
 */
export function useParallax(speed = 0.5): number {
  const [y, setY] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setY(window.scrollY * speed)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return y
}

/**
 * Hook that reads prefers-reduced-motion media query.
 * All animation components should check this and disable/reduce motion when true.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}
