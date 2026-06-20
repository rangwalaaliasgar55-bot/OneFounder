/**
 * OneFounder Gesture Hooks
 *
 * Wrapper around @use-gesture/react providing pre-configured gesture hooks.
 */

import { useSwipe, useDrag, usePinch } from '@use-gesture/react'

/**
 * Swipe gesture hook pre-configured for the app.
 * Returns bind function and swipe state.
 */
export { useSwipe, useDrag, usePinch }

/**
 * Detect swipe direction on mobile for sidebar toggle.
 * threshold: minimum distance in px to register as swipe
 * velocity: minimum velocity to register as swipe
 */
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  options?: { threshold?: number; velocity?: number }
) {
  const threshold = options?.threshold ?? 50
  const velocity = options?.velocity ?? 0.3

  return useDrag(
    (state) => {
      if (state.last) {
        const dx = state.movement[0]
        const vx = state.velocity[0]
        if (Math.abs(dx) > threshold && vx > velocity) {
          if (dx > 0 && onSwipeRight) onSwipeRight()
          if (dx < 0 && onSwipeLeft) onSwipeLeft()
        }
      }
    },
    { axis: 'x', filterTaps: true }
  )
}
