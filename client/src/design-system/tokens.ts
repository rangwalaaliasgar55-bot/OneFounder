/**
 * OneFounder Design System V3 — Design Tokens
 *
 * Central source of truth for all visual constants.
 * CSS custom properties are defined in tokens.css and reference these values.
 * TypeScript components can import these directly when needed.
 */

// ─── Colors ───────────────────────────────────────────────────
export const colors = {
  brand: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c7d7fe',
    300: '#a5b9fc',
    400: '#8191f8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  violet: {
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
  },
  emerald: {
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },
  amber: {
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  rose: {
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
  },
  cyan: {
    400: '#22d3ee',
    500: '#06b6d4',
  },
} as const

// ─── Semantic Colors (Dark Theme) ─────────────────────────────
export const semanticColorsDark = {
  bgPrimary: '#060b18',
  bgSecondary: '#0a1128',
  bgTertiary: '#0f172a',
  surface: 'rgba(255,255,255,0.05)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  surfaceActive: 'rgba(255,255,255,0.1)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.15)',
  borderActive: 'rgba(99,102,241,0.3)',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  textDisabled: '#334155',
  glowBrand: 'rgba(99,102,241,0.3)',
  glowEmerald: 'rgba(16,185,129,0.3)',
  glowAmber: 'rgba(245,158,11,0.3)',
  glowRose: 'rgba(244,63,94,0.3)',
} as const

// ─── Semantic Colors (Light Theme) ────────────────────────────
export const semanticColorsLight = {
  bgPrimary: '#f8fafc',
  bgSecondary: '#f1f5f9',
  bgTertiary: '#e2e8f0',
  surface: 'rgba(0,0,0,0.03)',
  surfaceHover: 'rgba(0,0,0,0.05)',
  surfaceActive: 'rgba(0,0,0,0.08)',
  border: 'rgba(0,0,0,0.08)',
  borderHover: 'rgba(0,0,0,0.15)',
  borderActive: 'rgba(99,102,241,0.4)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textDisabled: '#cbd5e1',
  glowBrand: 'rgba(99,102,241,0.2)',
  glowEmerald: 'rgba(16,185,129,0.2)',
  glowAmber: 'rgba(245,158,11,0.2)',
  glowRose: 'rgba(244,63,94,0.2)',
} as const

// ─── Spacing (4px base) ───────────────────────────────────────
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const

// ─── Typography ───────────────────────────────────────────────
export const typography = {
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.8125rem',   // 13px
    base: '0.875rem',  // 14px
    md: '1rem',        // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeights: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
} as const

// ─── Motion ───────────────────────────────────────────────────
export const motion = {
  duration: {
    instant: '100ms',
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    glacial: '1000ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  // Framer Motion spring configs
  spring: {
    gentle: { type: 'spring' as const, stiffness: 120, damping: 20 },
    bouncy: { type: 'spring' as const, stiffness: 300, damping: 15 },
    stiff: { type: 'spring' as const, stiffness: 400, damping: 30 },
    slow: { type: 'spring' as const, stiffness: 80, damping: 20 },
  },
} as const

// ─── Elevation (Shadow System) ────────────────────────────────
export const elevation = {
  0: 'none',
  1: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  2: '0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)',
  3: '0 4px 16px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)',
  4: '0 8px 32px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.12)',
  5: '0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.15)',
} as const

// ─── Glass System ─────────────────────────────────────────────
export const glass = {
  blur: {
    sm: '8px',
    md: '14px',
    lg: '24px',
    xl: '32px',
  },
  opacity: {
    subtle: 0.03,
    light: 0.05,
    medium: 0.08,
    strong: 0.12,
  },
  border: {
    subtle: 0.06,
    light: 0.08,
    medium: 0.1,
    strong: 0.12,
  },
} as const

// ─── Border Radius ────────────────────────────────────────────
export const radius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.625rem',   // 10px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  full: '9999px',
} as const

// ─── Z-Index Scale ────────────────────────────────────────────
export const zIndex = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  sidebar: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const
