import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// List of landing routes that should NOT trigger scroll-to-top
const landingRoutes = [
  '/',
  '/features',
  '/pricing',
  '/updates',
  '/about',
  '/privacy',
  '/terms',
];

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Only scroll to top if navigating to a non-landing route
    const isLanding = landingRoutes.includes(pathname);
    if (!isLanding) {
      if (!hash) {
        window.scrollTo(0, 0);
      } else {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    // If landing route, do nothing (preserve scroll)
  }, [pathname, hash]);

  return null;
}
