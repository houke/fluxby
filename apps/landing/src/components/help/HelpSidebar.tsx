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

interface HelpSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper to scroll to top when navigating
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
};

export default function HelpSidebar({ isOpen, onClose }: HelpSidebarProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const copy = t.helpCenter as NonNullable<typeof t.helpCenter>;
  const prevPathRef = useRef(location.pathname);

  // Close sidebar on route change (mobile)
  // Only close when pathname actually changes, not on initial render or onClose reference changes
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  // User Guide navigation
  const navigation: NavSection[] = [
    {
      title: copy.userNav.gettingStarted,
      items: [
        {
          title: copy.userNav.welcome,
          path: '/help',
          icon: '👋',
        },
        {
          title: copy.userNav.firstSteps,
          path: '/help/first-steps',
          icon: '🚀',
        },
        {
          title: copy.userNav.installation,
          path: '/help/installation',
          icon: '📲',
        },
        {
          title: copy.userNav.bankConnection,
          path: '/help/bank-connection',
          icon: '🏦',
        },
      ],
    },
    {
      title: copy.userNav.features,
      items: [
        {
          title: copy.userNav.transactions,
          path: '/help/transactions',
          icon: '💸',
        },
        {
          title: copy.userNav.bulkDelete,
          path: '/help/bulk-delete',
          icon: '🗑️',
        },
        {
          title: copy.userNav.categories,
          path: '/help/categories',
          icon: '🏷️',
        },
        {
          title: copy.userNav.accounts,
          path: '/help/accounts',
          icon: '🏦',
        },
        {
          title: copy.userNav.addressBook,
          path: '/help/address-book',
          icon: '📒',
        },
      ],
    },
    {
      title: copy.userNav.budgeting,
      items: [
        {
          title: copy.userNav.createBudget,
          path: '/help/budgeting',
          icon: '📊',
        },
        {
          title: copy.userNav.subscriptions,
          path: '/help/subscriptions',
          icon: '🔄',
        },
        {
          title: copy.userNav.understandAnalytics,
          path: '/help/analytics',
          icon: '📈',
        },
      ],
    },
    {
      title: copy.userNav.security,
      items: [
        {
          title: copy.userNav.sync,
          path: '/help/sync',
          icon: '🔄',
        },
        {
          title: copy.userNav.dataPrivacy,
          path: '/help/privacy',
          icon: '🔒',
        },
        {
          title: copy.userNav.ai,
          path: '/help/ai',
          icon: '✨',
        },
      ],
    },
    {
      title: copy.devNav.tools,
      items: [
        {
          title: copy.devNav.developerDocs,
          path: '/docs',
          icon: '💻',
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
