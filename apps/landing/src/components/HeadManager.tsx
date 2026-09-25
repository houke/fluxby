import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface HeadManagerProps {
  title?: string;
  description?: string;
}

export function HeadManager({ title, description }: HeadManagerProps) {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    // Get current page data
    const pageSpecific = {
      '/features': t.metadata.pages.features,
      '/pricing': t.metadata.pages.pricing,
      '/updates': t.metadata.pages.updates,
      '/about': t.metadata.pages.about,
      '/docs': t.metadata.pages.docs,
      '/help': t.metadata.pages.help,
    };
    const currentPage =
      pageSpecific[location.pathname as keyof typeof pageSpecific];
    const defaultData = t.metadata.default;

    // Set title
    const finalTitle = title || currentPage?.title || defaultData.title;
    document.title = finalTitle;

    // Set description
    const finalDescription =
      description || currentPage?.description || defaultData.description;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDescription);
    }

    // Set Open Graph tags for better social sharing
    const setMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setMetaTag('og:title', finalTitle);
    setMetaTag('og:description', finalDescription);
    setMetaTag('og:url', window.location.href);
    setMetaTag('og:type', 'website');
  }, [title, description, location.pathname, t]);

  return null;
}
