import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Upload,
  MoreHorizontal,
  Wallet,
  CalendarClock,
  Tags,
  BookUser,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';

interface BottomNavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function BottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Primary nav items for bottom bar
  const primaryNavItems: BottomNavItem[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: t.nav.dashboard },
    { to: '/transactions', icon: ArrowLeftRight, label: t.nav.transactions },
    { to: '/analytics', icon: BarChart3, label: t.nav.analytics },
    { to: '/import', icon: Upload, label: t.nav.import },
  ];

  // Secondary items for "More" sheet
  const moreNavItems: BottomNavItem[] = [
    { to: '/budgets', icon: Wallet, label: t.nav.budgets },
    {
      to: '/subscriptions',
      icon: CalendarClock,
      label: t.nav.subscriptions || 'Subscriptions',
    },
    { to: '/categories', icon: Tags, label: t.nav.categories },
    {
      to: '/addressbook',
      icon: BookUser,
      label: t.nav.addressBook || 'Address Book',
    },
  ];

  // Settings/help items
  const settingsNavItems: BottomNavItem[] = [
    { to: '/settings', icon: Settings, label: t.nav.settings },
    { to: '/help', icon: HelpCircle, label: t.nav.help },
  ];

  // Check if current path is in the "More" items
  const isMoreActive =
    moreNavItems.some((item) => location.pathname.startsWith(item.to)) ||
    settingsNavItems.some((item) => location.pathname.startsWith(item.to));

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className='fixed right-0 bottom-0 left-0 z-30 flex h-16 items-center justify-around border-t bg-card md:hidden'>
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className='h-5 w-5' />
            <span className='text-[10px] font-medium'>{item.label}</span>
          </NavLink>
        ))}
        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2',
            isMoreActive ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <MoreHorizontal className='h-5 w-5' />
          <span className='text-[10px] font-medium'>
            {t.bottomNav?.more || 'More'}
          </span>
        </button>
      </nav>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side='bottom'
          className='h-auto max-h-[80vh] rounded-t-2xl pb-8'
        >
          <SheetHeader className='text-left'>
            <SheetTitle>
              {t.bottomNav?.moreOptions || 'More options'}
            </SheetTitle>
          </SheetHeader>

          <div className='mt-6 space-y-1'>
            {/* Secondary navigation items */}
            {moreNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className='h-5 w-5' />
                {item.label}
              </NavLink>
            ))}

            <Separator className='my-3' />

            {/* Settings and help */}
            {settingsNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className='h-5 w-5' />
                {item.label}
              </NavLink>
            ))}

            <Separator className='my-3' />

            {/* Logout */}
            <button
              onClick={() => window.location.reload()}
              className='flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
            >
              <LogOut className='h-5 w-5' />
              {t.common.logout}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
