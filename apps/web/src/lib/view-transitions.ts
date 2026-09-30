import { flushSync } from 'react-dom';
import {
  resolvePath,
  useLocation,
  useNavigate,
  type NavigateOptions,
  type To,
} from 'react-router-dom';
import { useCallback } from 'react';

function normalizePathname(pathname: string): string {
  return pathname === '/' ? pathname : pathname.replace(/\/+$/, '') || '/';
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

export function useViewTransitionNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        navigate(to);
        return;
      }

      const nextPathname = resolvePath(to, location.pathname).pathname;
      const pathChanged =
        normalizePathname(nextPathname) !==
        normalizePathname(location.pathname);
      const shouldTransition = options?.viewTransition ?? pathChanged;
      const startViewTransition = document.startViewTransition;

      if (
        !shouldTransition ||
        prefersReducedMotion() ||
        typeof startViewTransition !== 'function'
      ) {
        navigate(to, options);
        return;
      }

      startViewTransition.call(document, () => {
        flushSync(() => navigate(to, options));
      });
    },
    [location.pathname, navigate]
  );
}
