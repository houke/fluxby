import { useState, useEffect } from 'react';

/**
 * React hook that returns true if the viewport matches the given media query.
 * Useful for conditionally rendering components based on screen size.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 639px)');
 * const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // SSR-safe: check if window is available
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Convenience hook that returns true when viewport width < 640px (sm breakpoint).
 * Based on Tailwind CSS default breakpoints.
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

/**
 * Convenience hook that returns true when viewport width >= 640px and < 1024px.
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

/**
 * Convenience hook that returns true when viewport width >= 1024px.
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
