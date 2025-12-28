import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const LegalModal = ({ isOpen, onClose, title, children }: LegalModalProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div className='fixed inset-0 z-50'>
      {/* Background - clickable to close */}
      <div className='absolute inset-0' onClick={onClose} />

      {/* Full page card - slides up from bottom with top offset to show stacked effect */}
      <div
        className={`absolute inset-x-0 bottom-0 top-6 overflow-hidden rounded-t-3xl bg-white shadow-2xl transition-transform duration-500 ease-out dark:bg-gray-900 md:top-10 lg:top-14 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Subtle top bar to indicate draggable/stacked card */}
        <div className='flex justify-center pt-3'>
          <div className='h-1 w-12 rounded-full bg-gray-300 dark:bg-gray-700' />
        </div>

        {/* Close button - sticky */}
        <button
          onClick={onClose}
          className='absolute right-4 top-4 z-10 rounded-full bg-gray-100 p-2 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:right-6 md:top-6'
          aria-label='Sluiten'
        >
          <X className='h-5 w-5 md:h-6 md:w-6' />
        </button>

        {/* Content */}
        <div className='h-full overflow-y-auto pb-8'>
          <div className='mx-auto max-w-4xl px-6 py-8 md:px-12 md:py-12'>
            {/* Header */}
            <div className='mb-8 border-b border-gray-200 pb-8 dark:border-gray-700'>
              <div className='flex items-center justify-between'>
                <div className='text-fluxby-purple text-sm font-semibold uppercase tracking-wider'>
                  Fluxby
                </div>
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
              </div>
              <h1 className='mt-2 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl'>
                {title}
              </h1>
            </div>

            {/* Main content */}
            <div
              className={`prose prose-gray dark:prose-invert prose-headings:font-bold prose-h2:mt-8 prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-600 prose-li:text-gray-600 dark:prose-p:text-gray-400 dark:prose-li:text-gray-400 max-w-none ${
                title.toLowerCase().includes('about') ||
                title.toLowerCase().includes('over') ||
                title.toLowerCase().includes('features') ||
                title.toLowerCase().includes('functies')
                  ? 'custom-h3-margin'
                  : ''
              }`}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
