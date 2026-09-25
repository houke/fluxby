import { Link, useLocation } from 'react-router-dom';
import { FluxbyWebGL } from '@fluxby/shared';
import { useLanguage } from '../../contexts/LanguageContext';
import { useEffect, useRef } from 'react';

interface NavItem {
  title: string;
  path: string;
  icon?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DocsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to scroll to top when navigating
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
};

export default function DocsSidebar({ isOpen, onClose }: DocsSidebarProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const copy = t.docs;
  const prevPathRef = useRef(location.pathname);

  // Close sidebar on route change (mobile)
  // Only close when pathname actually changes, not on initial render or onClose reference changes
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  const navigation: NavSection[] = [
    {
      title: copy.nav.gettingStarted,
      items: [
        {
          title: copy.nav.introduction,
          path: '/docs',
          icon: '📖',
        },
        {
          title: copy.nav.authentication,
          path: '/docs/authentication',
          icon: '🔐',
        },
        {
          title: copy.nav.architecture,
          path: '/docs/architecture',
          icon: '🏗️',
        },
        {
          title: copy.nav.profiles,
          path: '/docs/profiles',
          icon: '👥',
        },
        {
          title: copy.nav.errors,
          path: '/docs/errors',
          icon: '⚠️',
        },
      ],
    },
    {
      title: copy.nav.coreResources,
      items: [
        {
          title: copy.nav.accounts,
          path: '/docs/accounts',
          icon: '🏦',
        },
        {
          title: copy.nav.transactions,
          path: '/docs/transactions',
          icon: '💸',
        },
        {
          title: copy.nav.categories,
          path: '/docs/categories',
          icon: '🏷️',
        },
        {
          title: copy.nav.budgets,
          path: '/docs/budgets',
          icon: '📊',
        },
        {
          title: copy.nav.subscriptions,
          path: '/docs/subscriptions',
          icon: '🔄',
        },
        {
          title: copy.nav.analytics,
          path: '/docs/analytics',
          icon: '📈',
        },
        {
          title: copy.nav.addressBook,
          path: '/docs/addressbook',
          icon: '📒',
        },
        {
          title: copy.nav.import,
          path: '/docs/import',
          icon: '📥',
        },
        {
          title: copy.nav.data,
          path: '/docs/data',
          icon: '💾',
        },
      ],
    },
    {
      title: copy.nav.tools,
      items: [
        {
          title: copy.nav.openapi,
          path: '/docs/openapi',
          icon: '📄',
        },
        {
          title: copy.nav.ai,
          path: '/docs/ai',
          icon: '✨',
        },
        {
          title: copy.nav.helpCenter,
          path: '/help',
          icon: '❓',
        },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isExternal = (path: string) => path.startsWith('http');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className='fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden'
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 shrink-0 transform overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 dark:border-gray-700 dark:bg-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='p-1'>
          <Link to='/' className='flex items-center gap-2'>
            <div className='h-16 w-16 overflow-hidden'>
              <FluxbyWebGL size={64} className='h-full w-full' />
            </div>
            <span className='text-xl font-bold text-gray-900 dark:text-gray-100'>
              Fluxby
            </span>
            <span className='rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'>
              {copy.badge}
            </span>
          </Link>
        </div>

        <nav className='px-4 pb-8'>
          {navigation.map((section, idx) => (
            <div key={idx} className='mb-6'>
              <h3 className='mb-2 px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400'>
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
    </>
  );
}
