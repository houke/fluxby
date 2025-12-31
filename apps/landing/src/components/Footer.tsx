import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ExternalLink } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className='bg-gray-900 py-16 text-white'>
      <div className='container mx-auto px-4'>
        <div className='mb-12 grid gap-8 md:grid-cols-4'>
          {/* Brand */}
          <div className='md:col-span-2'>
            <Link to="/" className='text-fluxby-light mb-4 text-3xl font-black hover:opacity-80 transition-opacity block'>
              Fluxby
            </Link>
            <p className='mb-6 max-w-md text-gray-400'>
              {t.footer.description}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className='mb-4 text-lg font-bold'>{t.footer.product.title}</h4>
            <ul className='space-y-2 text-gray-400'>
              <li>
                <Link
                  to="/features"
                  className='hover:text-fluxby-light transition-colors'
                >
                  {t.footer.product.features}
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className='hover:text-fluxby-light transition-colors'
                >
                  {t.footer.product.pricing}
                </Link>
              </li>
              <li>
                <Link
                  to="/updates"
                  className='hover:text-fluxby-light transition-colors'
                >
                  {t.footer.product.updates}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className='hover:text-fluxby-light transition-colors'
                >
                  {t.footer.product.about}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className='mb-4 text-lg font-bold'>{t.footer.support.title}</h4>
            <ul className='space-y-2 text-gray-400'>
              <li>
                <Link
                  to='/help'
                  className='hover:text-fluxby-light inline-flex items-center gap-1.5 transition-colors'
                >
                  {t.footer.support.helpCenter}
                  <ExternalLink className='h-3.5 w-3.5' />
                </Link>
              </li>
              <li>
                <Link
                  to='/docs'
                  className='hover:text-fluxby-light inline-flex items-center gap-1.5 transition-colors'
                >
                  {t.footer.support.developerDocs}
                  <ExternalLink className='h-3.5 w-3.5' />
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className='hover:text-fluxby-light transition-colors'
                >
                  {t.footer.support.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className='hover:text-fluxby-light transition-colors'
                >
                  {t.footer.support.termsOfService}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className='flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 md:flex-row'>
          <p className='text-sm text-gray-400'>{t.footer.copyright}</p>

          <a
            href='https://github.com/houke/fluxby'
            target='_blank'
            rel='noopener noreferrer'
            className='hover:text-fluxby-light flex items-center gap-2 text-gray-400 transition-colors'
            aria-label='Contribute on GitHub'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='currentColor'
              aria-hidden
            >
              <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577v-2.234c-3.338.724-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.757-1.333-1.757-1.089-.744.084-.729.084-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.305-5.466-1.334-5.466-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.656 1.652.244 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.62-5.48 5.92.43.37.81 1.096.81 2.21v3.293c0 .322.21.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' />
            </svg>
            <span className='text-sm font-medium'>{t.footer.github}</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
