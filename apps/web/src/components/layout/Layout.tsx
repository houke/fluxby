import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  CalendarClock,
  Tags,
  Upload,
  Settings,
  HelpCircle,
  LogOut,
  BookUser,
  Menu,
  X,
  Eye,
  EyeOff,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useSpotlight } from '@/contexts/SpotlightContext';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HeaderFilters } from './HeaderFilters';
import { ProfileSwitcher } from './ProfileSwitcher';
import { useDataService } from '@/contexts/DatabaseContext';
import { FluxbyWebGL } from '@fluxby/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useOnboarding } from '@/components/onboarding';
import { NoDataModal } from '@/components/NoDataModal';
import { readFromOPFSSync, deleteFromOPFSWithCache } from '@fluxby/database';

interface UserProfile {
  id: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

export default function Layout() {
  const { t } = useLanguage();
  const { isSwitching } = useProfile();
  const { startOnboarding, state: onboardingState } = useOnboarding();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { open: openSpotlight } = useSpotlight();
  const dataService = useDataService();
  const location = useLocation();

  // Theme toggle functions
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const isDarkMode = () => document.documentElement.classList.contains('dark');

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      to: '/dashboard',
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
      to: '/subscriptions',
      icon: CalendarClock,
      label: t.nav.subscriptions || 'Subscriptions',
      onboarding: 'nav-subscriptions',
      menuKey: 'subscriptions',
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
    queryFn: () => dataService.getUser() as Promise<UserProfile>,
  });

  const [showOverlay, setShowOverlay] = React.useState<boolean>(() => {
    try {
      return (
        readFromOPFSSync('fluxby-switching-overlay') === 'true' || isSwitching
      );
    } catch {
      return isSwitching;
    }
  });

  // Sync overlay with switching and onboarding state / OPFS
  React.useEffect(() => {
    const check = () =>
      setShowOverlay(
        readFromOPFSSync('fluxby-switching-overlay') === 'true' || isSwitching
      );

    check();

    // Note: OPFS doesn't have storage events like localStorage,
    // so we rely on the isSwitching prop and onboardingState changes
  }, [isSwitching]);

  // Hide overlay when onboarding becomes active (onboarding ready)
  React.useEffect(() => {
    if (onboardingState.isActive) {
      setShowOverlay(false);
      deleteFromOPFSWithCache('fluxby-switching-overlay').catch(() => {
        // Ignore OPFS errors
      });
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

        {/* Mobile sidebar overlay backdrop */}
        {isMobileSidebarOpen && (
          <div
            className='fixed inset-0 z-40 bg-black/50 md:hidden'
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - hidden on mobile, visible on md+ */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 md:static md:translate-x-0',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          data-onboarding='sidebar'
        >
          {/* Mobile close button */}
          <div className='absolute top-2 right-2 md:hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsMobileSidebarOpen(false)}
              className='h-8 w-8'
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          {/* Fluxby Branding - Click on avatar to restart onboarding */}
          <div className='w-full px-1 py-2'>
            <div className='flex items-center gap-3'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className='relative transition-opacity hover:opacity-80 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
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
                      <FluxbyWebGL width={72} height={72} />
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
            <button
              onClick={() => window.location.reload()}
              className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
            >
              <LogOut className='h-5 w-5' />
              {t.common.logout}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* Top Bar */}
          <header className='flex h-14 items-center justify-between border-b bg-card px-3 md:h-16 md:px-6'>
            {/* Mobile hamburger menu */}
            <div className='flex items-center gap-2 md:hidden'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsMobileSidebarOpen(true)}
                className='h-9 w-9'
              >
                <Menu className='h-5 w-5' />
              </Button>
            </div>

            <div
              className='flex flex-1 items-center gap-2 md:gap-4'
              data-onboarding='header-date-filter'
            >
              <HeaderFilters />
            </div>
            <div className='flex items-center gap-2'>
              {/* Search / Spotlight button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={openSpotlight}
                    className='h-9 w-9 text-muted-foreground'
                    data-onboarding='header-search'
                  >
                    <Search className='h-5 w-5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className='flex items-center gap-2'>
                    <span>{t.spotlight?.openSearch || 'Search'}</span>
                    <kbd className='rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]'>
                      ⌘K
                    </kbd>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={togglePrivacyMode}
                    className='h-9 w-9 text-muted-foreground'
                    data-onboarding='header-privacy-mode'
                  >
                    {isPrivacyMode ? (
                      <EyeOff className='h-5 w-5' />
                    ) : (
                      <Eye className='h-5 w-5' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className='text-center'>
                    <p className='font-medium'>
                      {isPrivacyMode
                        ? t.common?.disablePrivacy || 'Show sensitive data'
                        : t.common?.enablePrivacy || 'Hide sensitive data'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {t.spotlight?.togglePrivacyTooltip || 'Press ⇧⌘P'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={toggleTheme}
                    className='h-9 w-9 text-muted-foreground'
                  >
                    {isDarkMode() ? (
                      <Sun className='h-5 w-5' />
                    ) : (
                      <Moon className='h-5 w-5' />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className='text-center'>
                    <p className='font-medium'>
                      {isDarkMode()
                        ? t.spotlight?.switchToLight || 'Switch to light mode'
                        : t.spotlight?.switchToDark || 'Switch to dark mode'}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {t.spotlight?.toggleDarkModeTooltip || 'Press ⇧⌘D'}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <div data-onboarding='profile-switcher'>
                <ProfileSwitcher />
              </div>
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

          {/* Page Content - responsive padding */}
          <main className='flex-1 overflow-auto p-3 pb-20 md:p-6 md:pb-6'>
            <Outlet />
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className='fixed right-0 bottom-0 left-0 z-30 flex h-16 items-center justify-around border-t bg-card md:hidden'>
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 px-2 py-1',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <item.icon className='h-5 w-5' />
              <span className='text-[10px] font-medium'>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* No Data Modal */}
        <NoDataModal />
      </div>
    </TooltipProvider>
  );
}
