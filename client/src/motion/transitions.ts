/**
 * OneFounder Motion System — Transition Configs
 *
 * Shared transition configurations for consistent motion across the app.
 */

import type { Transition } from 'framer-motion'

export const pageTransitionConfig: Transition = {
  duration: 0.35,
  ease: [0.4, 0, 0.2, 1],
}

export const modalTransitionConfig: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
}

export const sidebarTransitionConfig: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
}

export const drawerTransitionConfig: Transition = {
  type: 'spring',
  stiffness: 250,
  damping: 30,
}

export const tooltipTransitionConfig: Transition = {
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1],
}
