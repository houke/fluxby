import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  // Check if running in Tauri (no landing page available)
  const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

  // Check if user might be at wrong base URL
  const isAtRoot = location.pathname === '/' || location.pathname === '';
  const currentPath = location.pathname;

  // Check if this looks like a landing page route that ended up in the app
  // Only relevant for web, not Tauri
  const landingRoutes = ['/docs', '/help', '/about', '/privacy', '/terms'];
  const mightBeLandingRoute =
    !isTauri && landingRoutes.some((route) => currentPath.startsWith(route));

  // Navigate to dashboard using React Router (soft navigation)
  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className='flex min-h-[80vh] items-center justify-center'>
      <div className='mx-4 w-full max-w-md rounded-lg border bg-card p-8 shadow-lg'>
        <div className='flex flex-col items-center text-center'>
          {/* Icon */}
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30'>
            <FileQuestion className='h-8 w-8 text-purple-600 dark:text-purple-400' />
          </div>

          {/* Title */}
          <h2 className='mb-2 text-xl font-semibold'>
            {isAtRoot
              ? language === 'nl'
                ? 'Welkom bij Fluxby'
                : 'Welcome to Fluxby'
              : language === 'nl'
                ? 'Pagina niet gevonden'
                : 'Page not found'}
          </h2>

          {/* Description */}
          <p className='mb-6 text-muted-foreground'>
            {isAtRoot && !isTauri ? (
              language === 'nl' ? (
                <>
                  Je bent op de app pagina. Ga naar het{' '}
                  <a
                    href='/'
                    className='text-purple-600 underline hover:text-purple-500'
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/';
                    }}
                  >
                    startscherm
                  </a>{' '}
                  of start met het{' '}
                  <span
                    onClick={goToDashboard}
                    className='cursor-pointer text-purple-600 underline hover:text-purple-500'
                  >
                    dashboard
                  </span>
                  .
                </>
              ) : (
                <>
                  You&apos;re on the app page. Go to the{' '}
                  <a
                    href='/'
                    className='text-purple-600 underline hover:text-purple-500'
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/';
                    }}
                  >
                    home page
                  </a>{' '}
                  or start with the{' '}
                  <span
                    onClick={goToDashboard}
                    className='cursor-pointer text-purple-600 underline hover:text-purple-500'
                  >
                    dashboard
                  </span>
                  .
                </>
              )
            ) : mightBeLandingRoute ? (
              language === 'nl' ? (
                <>
                  Deze pagina bestaat in het hoofdmenu. Ga naar{' '}
                  <a
                    href={currentPath}
                    className='text-purple-600 underline hover:text-purple-500'
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = currentPath.replace('/app', '');
                    }}
                  >
                    {currentPath}
                  </a>{' '}
                  op de landingspagina.
                </>
              ) : (
                <>
                  This page exists in the main menu. Go to{' '}
                  <a
                    href={currentPath}
                    className='text-purple-600 underline hover:text-purple-500'
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = currentPath.replace('/app', '');
                    }}
                  >
                    {currentPath}
                  </a>{' '}
                  on the landing page.
                </>
              )
            ) : language === 'nl' ? (
              'De pagina die je zoekt bestaat niet of is verplaatst.'
            ) : (
              "The page you're looking for doesn't exist or has been moved."
            )}
          </p>

          {/* Buttons */}
          <div className='flex w-full flex-col gap-3'>
            <Button onClick={goToDashboard} className='w-full' size='lg'>
              <Home className='mr-2 h-4 w-4' />
              {language === 'nl' ? 'Naar dashboard' : 'Go to dashboard'}
            </Button>

            <Button
              variant='outline'
              onClick={() => navigate(-1)}
              className='w-full'
              size='lg'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {language === 'nl' ? 'Ga terug' : 'Go back'}
            </Button>

            {/* Only show home page link in web (landing page doesn't exist in Tauri) */}
            {!isTauri && (
              <Button
                variant='ghost'
                onClick={() => (window.location.href = '/')}
                className='w-full'
                size='lg'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                {language === 'nl' ? 'Naar startpagina' : 'Go to home page'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
