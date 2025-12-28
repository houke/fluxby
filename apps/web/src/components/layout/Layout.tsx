import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Tags,
  Upload,
  Settings,
  HelpCircle,
  LogOut,
  BookUser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HeaderFilters } from './HeaderFilters';
import { ProfileSwitcher } from './ProfileSwitcher';
import { api } from '@/lib/api';
import { FluxbyWebGL } from '@fluxby/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useOnboarding } from '@/components/onboarding';

interface UserProfile {
  id: number;
  name: string;
  avatar: string | null;
  createdAt: string;
}

export default function Layout() {
  const { t } = useLanguage();
  const { isSwitching } = useProfile();
  const { startOnboarding, state: onboardingState } = useOnboarding();

  const navItems = [
    {
      to: '/',
      icon: LayoutDashboard,
      label: t.nav.dashboard,
      onboarding: 'nav-dashboard',
      menuKey: 'dashboard',
    },
    {
      to: '/transactions',
      icon: ArrowLeftRight,
      label: t.nav.transactions,
      onboarding: 'nav-transactions',
      menuKey: 'transactions',
    },
    {
      to: '/analytics',
      icon: BarChart3,
      label: t.nav.analytics,
      onboarding: 'nav-analytics',
      menuKey: 'analytics',
    },
    {
      to: '/budgets',
      icon: Wallet,
      label: t.nav.budgets,
      onboarding: 'nav-budgets',
      menuKey: 'budgets',
    },
    {
      to: '/addressbook',
      icon: BookUser,
      label: t.nav.addressBook || 'Address Book',
      onboarding: 'nav-addressbook',
      menuKey: 'addressbook',
    },
    {
      to: '/categories',
      icon: Tags,
      label: t.nav.categories,
      onboarding: 'nav-categories',
      menuKey: 'categories',
    },
    {
      to: '/import',
      icon: Upload,
      label: t.nav.import,
      onboarding: 'nav-import',
      menuKey: 'import',
    },
  ];

  const bottomNavItems = [
    {
      to: '/settings',
      icon: Settings,
      label: t.nav.settings,
      onboarding: 'nav-settings',
      menuKey: 'settings',
    },
    {
      to: '/help',
      icon: HelpCircle,
      label: t.nav.help,
      onboarding: 'nav-help',
      menuKey: 'help',
    },
  ];

  useQuery<UserProfile>({
    queryKey: ['user'],
    queryFn: () => api.getUser() as Promise<UserProfile>,
  });

  const [showOverlay, setShowOverlay] = React.useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('fluxby-switching-overlay') === 'true' ||
        isSwitching
      );
    } catch {
      return isSwitching;
    }
  });

  // Sync overlay with switching and onboarding state / localStorage
  React.useEffect(() => {
    const check = () =>
      setShowOverlay(
        localStorage.getItem('fluxby-switching-overlay') === 'true' ||
          isSwitching
      );

    check();

    const onStorage = () => check();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isSwitching]);

  // Hide overlay when onboarding becomes active (onboarding ready)
  React.useEffect(() => {
    if (onboardingState.isActive) {
      setShowOverlay(false);
      try {
        localStorage.removeItem('fluxby-switching-overlay');
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [onboardingState.isActive]);

  return (
    <TooltipProvider>
      <div className='flex h-screen bg-background'>
        {showOverlay && (
          <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur'>
            <div className='flex flex-col items-center gap-4'>
              <div className='h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-purple-600' />
              <p className='text-sm font-medium'>
                {t.common?.preparingOnboarding ||
                  'Switching profiles, preparing onboarding…'}
              </p>
            </div>
          </div>
        )}
        {/* Sidebar */}
        <aside
          className='flex w-64 flex-col border-r bg-card'
          data-onboarding='sidebar'
        >
          {/* Fluxby Branding - Click on avatar to restart onboarding */}
          <div className='w-full px-1 py-2'>
            <div className='flex items-center gap-3'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='relative transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    data-onboarding='fluxby-mascot'
                    onClick={() => {
                      if (!onboardingState.isActive) {
                        // Start onboarding at the chapter matching the current page
                        startOnboarding(false, true);
                      }
                    }}
                    disabled={onboardingState.isActive}
                  >
                    <div className='pointer-events-none'>
                      <FluxbyWebGL width={72} height={72} interactive={false} />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side='right' sideOffset={4}>
                  {t.common.restartOnboarding}
                </TooltipContent>
              </Tooltip>

              <div className='text-left'>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  Fluxby
                </p>
                <p className='text-xs text-muted-foreground'>
                  {t.common.appSubtitle}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <ScrollArea className='flex-1 px-3 py-4'>
            <nav className='space-y-1'>
              {navItems.map((item) => {
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    data-onboarding={item.onboarding}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )
                    }
                  >
                    <item.icon className='h-5 w-5' />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </ScrollArea>

          <Separator />

          {/* Bottom Navigation */}
          <div className='space-y-1 p-3'>
            {bottomNavItems.map((item) => {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-onboarding={item.onboarding}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )
                  }
                >
                  <item.icon className='h-5 w-5' />
                  {item.label}
                </NavLink>
              );
            })}
            <button className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'>
              <LogOut className='h-5 w-5' />
              {t.common.logout}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Top Bar */}
          <header className='flex h-16 items-center justify-between border-b bg-card px-6'>
            <div
              className='flex flex-1 items-center gap-4'
              data-onboarding='header-date-filter'
            >
              <HeaderFilters />
            </div>
            <div
              className='flex items-center gap-2'
              data-onboarding='profile-switcher'
            >
              <ProfileSwitcher />
            </div>
          </header>

          {/* Profile Switching Overlay */}
          {isSwitching && (
            <div className='absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
              <div className='flex items-center gap-2 text-muted-foreground'>
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                <span>Profiel wisselen...</span>
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className='flex-1 overflow-auto p-6'>
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
