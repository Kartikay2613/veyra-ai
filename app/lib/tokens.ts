/**
 * Career Sprint — Design Tokens
 * ─────────────────────────────────────────────────────────────────
 * SOURCE OF TRUTH. All values here must match globals.css exactly.
 * When porting to React Native, map these to NativeWind/StyleSheet.
 *
 * Colors:
 *   drift     #F3F2EE  Background: warm off-white
 *   ink       #14171F  Text: near-black, warm undertone
 *   ignition  #FF4E1F  Primary: vivid orange-red (energy color)
 *   surge     #2D4FFF  Secondary: electric blue (sparingly)
 *   mist      #D8D6CE  Borders / disabled states
 *   win       #1FA77A  Success: confident green (completed only)
 *
 * Fonts:
 *   display   Bricolage Grotesque  Headlines, big numbers
 *   body      Inter                Body copy
 *   mono      JetBrains Mono       Data labels, counters, streaks
 */

export const COLORS = {
  drift: '#F3F2EE',
  ink: '#14171F',
  ignition: '#FF4E1F',
  surge: '#2D4FFF',
  mist: '#D8D6CE',
  win: '#1FA77A',
  white: '#FFFFFF',
  /** Semi-transparent overlays */
  inkAlpha10: 'rgba(20, 23, 31, 0.10)',
  inkAlpha06: 'rgba(20, 23, 31, 0.06)',
} as const;

export const FONTS = {
  display: "'Bricolage Grotesque', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const SPACING = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const;

export const RADII = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const;

export const TRANSITIONS = {
  fast: '150ms ease',
  normal: '200ms ease',
  /** Completion fill animation — satisfying bounce, under 400ms */
  fill: '380ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const SPRINT_DAYS = 30;
