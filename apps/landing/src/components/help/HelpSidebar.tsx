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

export default function HelpSidebar() {
  const location = useLocation();
  const { t } = useLanguage();

  // User Guide navigation
  const navigation: NavSection[] = [
    {
      title: t.helpCenter?.userNav?.gettingStarted || 'Getting Started',
      items: [
        {
          title: t.helpCenter?.userNav?.welcome || 'Welcome',
          path: '/help',
          icon: '👋',
        },
        {
          title: t.helpCenter?.userNav?.firstSteps || 'First steps',
          path: '/help/first-steps',
          icon: '🚀',
        },
        {
          title:
            t.helpCenter?.userNav?.bankConnection || 'Connecting your bank',
          path: '/help/bank-connection',
          icon: '🏦',
        },
      ],
    },
    {
      title: t.helpCenter?.userNav?.features || 'Features',
      items: [
        {
          title: t.helpCenter?.userNav?.transactions || 'Transactions',
          path: '/help/transactions',
          icon: '💸',
        },
        {
          title: t.helpCenter?.userNav?.categories || 'Categories',
          path: '/help/categories',
          icon: '🏷️',
        },
        {
          title: t.helpCenter?.userNav?.accounts || 'Accounts',
          path: '/help/accounts',
          icon: '🏦',
        },
        {
          title: t.helpCenter?.userNav?.addressBook || 'Address Book',
          path: '/help/address-book',
          icon: '📒',
        },
      ],
    },
    {
      title: t.helpCenter?.userNav?.budgeting || 'Budgeting & Analytics',
      items: [
        {
          title: t.helpCenter?.userNav?.createBudget || 'Creating a budget',
          path: '/help/budgeting',
          icon: '📊',
        },
        {
          title:
            t.helpCenter?.userNav?.understandAnalytics ||
            'Understanding analytics',
          path: '/help/analytics',
          icon: '📈',
        },
      ],
    },
    {
      title: t.helpCenter?.userNav?.security || 'Security & Privacy',
      items: [
        {
          title: t.helpCenter?.userNav?.dataPrivacy || 'Your data & privacy',
          path: '/help/privacy',
          icon: '🔒',
        },
      ],
    },
    {
      title: t.helpCenter?.devNav?.tools || 'Tools',
      items: [
        {
          title: t.helpCenter?.devNav?.developerDocs || 'Developer Docs',
          path: '/docs',
          icon: '💻',
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
            {t.helpCenter?.badge || 'Help Center'}
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
