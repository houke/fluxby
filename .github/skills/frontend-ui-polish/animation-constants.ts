/**
 * Standard animation timings and easing functions for application components.
 * Aligning with "The Juice" philosophy.
 */

export const ANIMATION_TIMING = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  STAGGER: 50,
} as const;

export const ANIMATION_EASING = {
  // Entrance: starts fast, ends slow
  ENTRANCE: 'cubic-bezier(0.2, 0.8, 0.2, 1)',

  // Exit: starts slow, ends fast
  EXIT: 'cubic-bezier(0.4, 0, 1, 1)',

  // Emphasis: bouncy
  BOUNCE: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Standard: balanced
  STANDARD: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const GLASS_STYLES = {
  BACKGROUND: 'rgba(255, 255, 255, 0.1)',
  BLUR: 'Blur(10px)',
  BORDER: '1px solid rgba(255, 255, 255, 0.2)',
} as const;
