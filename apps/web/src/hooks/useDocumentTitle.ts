import { useEffect } from 'react';

/**
 * Hook to update the document title with Fluxby branding
 * @param pageTitle - The title of the current page
 */
export function useDocumentTitle(pageTitle: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${pageTitle} • Fluxby`;

    return () => {
      document.title = previousTitle;
    };
  }, [pageTitle]);
}

export default useDocumentTitle;
