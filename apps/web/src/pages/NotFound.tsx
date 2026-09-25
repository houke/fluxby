import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, FileQuestion, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

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

  const title = isAtRoot ? t.errors.notFoundWelcome : t.errors.notFoundTitle;

  const description =
    isAtRoot && !isTauri ? (
      <>
        {t.errors.appPageIntro}{' '}
        <a
          href='/'
          className='text-purple-600 underline hover:text-purple-500'
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/';
          }}
        >
          {t.errors.appPageHomeLink}
        </a>{' '}
        {t.errors.appPageDashboardPrefix}{' '}
        <span
          onClick={goToDashboard}
          className='cursor-pointer text-purple-600 underline hover:text-purple-500'
        >
          {t.errors.dashboardLink}
        </span>
        .
      </>
    ) : mightBeLandingRoute ? (
      <>
        {t.errors.landingRouteIntro}{' '}
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
        {t.errors.landingRouteSuffix}
      </>
    ) : (
      t.errors.defaultNotFoundDescription
    );

  return (
    <div className='flex min-h-[80vh] items-center justify-center p-4'>
      <EmptyState
        icon={FileQuestion}
        title={title}
        description={typeof description === 'string' ? description : undefined}
        className='max-w-md rounded-2xl border bg-card p-8 shadow-sm shadow-purple-500/5 dark:shadow-purple-500/10'
        action={
          <div className='flex w-full flex-col gap-3'>
            {typeof description !== 'string' && (
              <p className='mb-4 text-center text-sm text-muted-foreground'>
                {description}
              </p>
            )}
            <Button onClick={goToDashboard} className='w-full' size='lg'>
              <Home className='mr-2 h-4 w-4' />
              {t.errors.goToDashboard}
            </Button>

            <Button
              variant='outline'
              onClick={() => navigate(-1)}
              className='w-full'
              size='lg'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t.errors.goBack}
            </Button>

            {!isTauri && (
              <Button
                variant='ghost'
                onClick={() => (window.location.href = '/')}
                className='w-full'
                size='lg'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                {t.errors.goToHomePage}
              </Button>
            )}
          </div>
        }
      />
    </div>
  );
}
