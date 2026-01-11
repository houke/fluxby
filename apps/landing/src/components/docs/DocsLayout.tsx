import { Link, Outlet } from 'react-router-dom';
import DocsSidebar from './DocsSidebar';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

export default function DocsLayout() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
      <DocsSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className='flex flex-1 flex-col bg-gray-50 dark:bg-gray-900'>
        {/* Top bar */}
        <header className='sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 lg:px-8 dark:border-gray-700 dark:bg-gray-800'>
          <div className='flex items-center gap-4'>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className='mr-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-700'
              aria-label='Open menu'
            >
              <svg
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>

            <Link
              to='/'
              className='text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            >
              ←{' '}
              <span className='hidden sm:inline'>
                {t.docs?.backToHome || 'Back to Home'}
              </span>
              <span className='sm:hidden'>Home</span>
            </Link>
          </div>
          <div className='flex items-center gap-4'>
            {/* Language toggle */}
            <div className='flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-700'>
              <button
                onClick={() => setLanguage('nl')}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  language === 'nl'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                NL
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className='rounded-lg border border-gray-200 bg-gray-50 p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-gray-100'
              title={
                theme === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
            >
              {theme === 'dark' ? (
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                  />
                </svg>
              ) : (
                <svg
                  className='h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                  />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className='min-w-0 flex-1 overflow-x-auto px-4 py-8 lg:px-8 lg:py-12'>
          <div className='mx-auto max-w-4xl'>
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className='border-t border-gray-200 bg-white px-8 py-6 dark:border-gray-700 dark:bg-gray-800'>
          <div className='mx-auto max-w-4xl text-center text-sm text-gray-500 dark:text-gray-400'>
            © Fluxby. {t.docs?.footerText || 'Built with ❤️ for developers.'}
          </div>
        </footer>
      </div>
    </div>
  );
}
