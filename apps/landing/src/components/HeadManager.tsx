import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface HeadManagerProps {
  title?: string;
  description?: string;
}

export function HeadManager({ title, description }: HeadManagerProps) {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    // Default titles and descriptions based on language
    const defaults = {
      nl: {
        title: 'Fluxby - Maakt geldbeheer leuk',
        description:
          'Ontdek Fluxby, de leukste manier om je financiën te beheren. Volg transacties, budgetten en meer met onze schattige digitale mascotte.',
      },
      en: {
        title: 'Fluxby - Makes money management fun',
        description:
          'Discover Fluxby, the cutest way to manage your finances. Track transactions, budgets, and more with our adorable digital mascotte.',
      },
    };

    // Page-specific titles and descriptions
    const pageSpecific: Record<
      string,
      Record<string, { title: string; description: string }>
    > = {
      '/features': {
        nl: {
          title: 'Functies / Fluxby',
          description:
            'Ontdek waarom Fluxby meer is dan alleen een finance app. Je financiële mascotte die geldbeheer leuk en stressvrij maakt.',
        },
        en: {
          title: 'Features / Fluxby',
          description:
            'Discover why Fluxby is more than just a finance app. Your financial mascotte who makes money management delightful and stress-free.',
        },
      },
      '/pricing': {
        nl: {
          title: 'Prijzen / Fluxby',
          description:
            'Fluxby is en blijft volledig gratis. Geen verborgen kosten, geen premium versie, geen abonnement.',
        },
        en: {
          title: 'Pricing / Fluxby',
          description:
            'Fluxby is and remains completely free. No hidden costs, no premium version, no subscription.',
        },
      },
      '/updates': {
        nl: {
          title: 'Updates / Fluxby',
          description:
            'Blijf op de hoogte van de nieuwste ontwikkelingen en verbeteringen in Fluxby.',
        },
        en: {
          title: 'Updates / Fluxby',
          description:
            'Stay up to date with the latest developments and improvements in Fluxby.',
        },
      },
      '/about': {
        nl: {
          title: 'Over / Fluxby',
          description:
            '1 developer, 2.5 weken, 4 LLM modellen, 375 prompts, 0 regels code',
        },
        en: {
          title: 'About / Fluxby',
          description:
            '1 developer, 2.5 weeks, 4 LLM models, 375 prompts, 0 lines of code',
        },
      },
      '/docs': {
        nl: {
          title: 'API Documentatie / Fluxby',
          description:
            'Volledige API documentatie voor Fluxby. Leer hoe je integraties bouwt met onze lokale finance API.',
        },
        en: {
          title: 'API Documentation / Fluxby',
          description:
            'Complete API documentation for Fluxby. Learn how to build integrations with our local finance API.',
        },
      },
      '/help': {
        nl: {
          title: 'Help Centrum / Fluxby',
          description:
            'Vind antwoorden op je vragen over Fluxby. Gebruikershandleidingen, tutorials en ontwikkelaarsdocumentatie.',
        },
        en: {
          title: 'Help Center / Fluxby',
          description:
            'Find answers to your questions about Fluxby. User guides, tutorials, and developer documentation.',
        },
      },
    };

    // Get current page data
    const currentPage =
      pageSpecific[location.pathname]?.[language] ||
      pageSpecific[location.pathname]?.en;
    const defaultData = defaults[language] || defaults.en;

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
  }, [title, description, location.pathname, language]);

  return null;
}
