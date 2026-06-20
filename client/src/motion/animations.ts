/**
 * OneFounder Motion System — Framer Motion Variants
 *
 * Reusable animation presets for consistent motion across the app.
 * Import these in any component that needs animation.
 */

import type { Variants, Transition } from 'framer-motion'

// ─── Spring Presets ───────────────────────────────────────────
export const springGentle: Transition = { type: 'spring', stiffness: 120, damping: 20 }
export const springBouncy: Transition = { type: 'spring', stiffness: 300, damping: 15 }
export const springStiff: Transition = { type: 'spring', stiffness: 400, damping: 30 }
export const springSlow: Transition = { type: 'spring', stiffness: 80, damping: 20 }

// ─── Duration Presets ─────────────────────────────────────────
export const durationFast = 0.2
export const durationNormal = 0.3
export const durationSlow = 0.5

// ─── Fade Variants ────────────────────────────────────────────
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durationNormal, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: durationFast } },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: durationNormal, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: durationFast } },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: durationNormal, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: 10, transition: { duration: durationFast } },
}

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: durationNormal, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: durationFast } },
}

// ─── Slide Variants ───────────────────────────────────────────
export const slideUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: durationFast } },
}

export const slideDown: Variants = {
  initial: { opacity: 0, y: -24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: 12, transition: { duration: durationFast } },
}

export const slideLeft: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: { duration: durationNormal, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: -12, transition: { duration: durationFast } },
}

export const slideRight: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0, transition: { duration: durationNormal, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, x: 12, transition: { duration: durationFast } },
}

// ─── Stagger Variants ─────────────────────────────────────────
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
}

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
}

// ─── Interactive Variants ─────────────────────────────────────
export const hoverScale = {
  whileHover: { scale: 1.03, transition: springGentle },
  whileTap: { scale: 0.97 },
}

export const hoverLift = {
  whileHover: { y: -4, transition: springGentle },
  whileTap: { y: 0 },
}

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.15)',
    transition: { duration: 0.3 },
  },
}

// ─── Page Transition ──────────────────────────────────────────
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
  },
}

// ─── Modal Transition ─────────────────────────────────────────
export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
}

// ─── List Item Variants ───────────────────────────────────────
export const listItem: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    opacity: 0,
    x: 8,
    transition: { duration: 0.2 },
  },
}

// ─── Number Counter ───────────────────────────────────────────
export const counterVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
}
