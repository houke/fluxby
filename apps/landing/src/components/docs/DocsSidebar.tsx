import { Link, useLocation } from 'react-router-dom';
import { FluxbyWebGL } from '@fluxby/shared';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavItem {
  title: string;
  path: string;
  icon?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Helper to scroll to top when navigating
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
};

export default function DocsSidebar() {
  const location = useLocation();
  const { t } = useLanguage();

  const navigation: NavSection[] = [
    {
      title: t.docs?.nav?.gettingStarted || 'Getting Started',
      items: [
        {
          title: t.docs?.nav?.introduction || 'Introduction',
          path: '/docs',
          icon: '📖',
        },
        {
          title: t.docs?.nav?.authentication || 'Authentication',
          path: '/docs/authentication',
          icon: '🔐',
        },
        {
          title: t.docs?.nav?.architecture || 'Architecture',
          path: '/docs/architecture',
          icon: '🏗️',
        },
        {
          title: t.docs?.nav?.profiles || 'Profiles & Multi-Tenancy',
          path: '/docs/profiles',
          icon: '👥',
        },
        {
          title: t.docs?.nav?.errors || 'Error Handling',
          path: '/docs/errors',
          icon: '⚠️',
        },
      ],
    },
    {
      title: t.docs?.nav?.coreResources || 'Core Resources',
      items: [
        {
          title: t.docs?.nav?.accounts || 'Accounts',
          path: '/docs/accounts',
          icon: '🏦',
        },
        {
          title: t.docs?.nav?.transactions || 'Transactions',
          path: '/docs/transactions',
          icon: '💸',
        },
        {
          title: t.docs?.nav?.categories || 'Categories',
          path: '/docs/categories',
          icon: '🏷️',
        },
        {
          title: t.docs?.nav?.budgets || 'Budgets',
          path: '/docs/budgets',
          icon: '📊',
        },
        {
          title: t.docs?.nav?.analytics || 'Analytics',
          path: '/docs/analytics',
          icon: '📈',
        },
        {
          title: t.docs?.nav?.addressBook || 'Address Book',
          path: '/docs/addressbook',
          icon: '📒',
        },
        {
          title: t.docs?.nav?.import || 'Import',
          path: '/docs/import',
          icon: '📥',
        },
        {
          title: t.docs?.nav?.data || 'Data Management',
          path: '/docs/data',
          icon: '💾',
        },
      ],
    },
    {
      title: t.docs?.nav?.tools || 'Tools',
      items: [
        {
          title: t.docs?.nav?.openapi || 'OpenAPI Spec',
          path: '/docs/openapi',
          icon: '📄',
        },
        {
          title: t.docs?.nav?.helpCenter || 'Helpcentrum',
          path: '/help',
          icon: '❓',
        },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isExternal = (path: string) => path.startsWith('http');

  return (
    <aside className='sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
      <div className='p-1'>
        <Link to='/' className='flex items-center gap-2'>
          <div className='h-16 w-16 overflow-hidden'>
            <FluxbyWebGL size={64} className='h-full w-full' />
          </div>
          <span className='text-xl font-bold text-gray-900 dark:text-gray-100'>
            Fluxby
          </span>
          <span className='rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'>
            {t.docs?.badge || 'Docs'}
          </span>
        </Link>
      </div>

      <nav className='px-4 pb-8'>
        {navigation.map((section, idx) => (
          <div key={idx} className='mb-6'>
            <h3 className='mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400'>
              {section.title}
            </h3>
            <ul className='space-y-1'>
              {section.items.map((item) => (
                <li key={item.path}>
                  {isExternal(item.path) ? (
                    <a
                      href={item.path}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                    >
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                      <span className='ml-auto text-gray-400'>↗</span>
                    </a>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={scrollToTop}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive(item.path)
                          ? 'bg-purple-50 font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
