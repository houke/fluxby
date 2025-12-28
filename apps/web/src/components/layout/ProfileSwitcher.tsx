import {
  ChevronDown,
  User,
  Settings,
  Briefcase,
  Users,
  Wallet,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NavLink } from 'react-router-dom';

const PROFILE_TYPE_ICONS: Record<string, LucideIcon> = {
  personal: User,
  business: Briefcase,
  shared: Users,
  savings: Wallet,
  investing: TrendingUp,
};

const PROFILE_TYPE_COLORS: Record<string, string> = {
  personal: 'from-blue-500 to-purple-500',
  business: 'from-green-500 to-teal-500',
  shared: 'from-orange-500 to-yellow-500',
  savings: 'from-emerald-500 to-cyan-500',
  investing: 'from-indigo-500 to-blue-600',
};

export function ProfileSwitcher() {
  const { t: _t } = useLanguage();
  const { activeProfile, profiles, isSwitching, switchProfile } = useProfile();

  if (!activeProfile) {
    return null;
  }

  const otherProfiles = profiles.filter((p) => p.id !== activeProfile.id);
  const Icon = PROFILE_TYPE_ICONS[activeProfile.type] || User;
  const typeColor =
    PROFILE_TYPE_COLORS[activeProfile.type] || 'from-gray-500 to-gray-600';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className={cn(
            'group flex h-auto items-center gap-2 px-3 py-2 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0',
            isSwitching && 'pointer-events-none opacity-50'
          )}
        >
          {/* Profile Avatar */}
          {activeProfile.avatarUrl ? (
            <div
              className='h-8 w-8 rounded-full border shadow-sm'
              style={{
                backgroundImage: activeProfile.avatarUrl,
                backgroundSize: 'cover',
              }}
            />
          ) : (
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-medium text-white',
                typeColor
              )}
            >
              <Icon className='h-4 w-4' />
            </div>
          )}

          {/* Profile Name */}
          <div className='flex flex-col items-start'>
            <span className='text-sm font-medium transition-colors group-hover:text-purple-600'>
              {activeProfile.name}
            </span>
            <span className='text-xs capitalize text-muted-foreground'>
              {activeProfile.type}
            </span>
          </div>

          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-56'>
        {/* Current Profile Header */}
        <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
          Huidig profiel
        </div>
        <div className='flex items-center gap-2 px-2 py-1.5'>
          {activeProfile.avatarUrl ? (
            <div
              className='h-8 w-8 rounded-full border shadow-sm'
              style={{
                backgroundImage: activeProfile.avatarUrl,
                backgroundSize: 'cover',
              }}
            />
          ) : (
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm text-white',
                typeColor
              )}
            >
              <Icon className='h-4 w-4' />
            </div>
          )}
          <div className='flex flex-col'>
            <span className='font-medium'>{activeProfile.name}</span>
            <span className='text-xs capitalize text-muted-foreground'>
              {activeProfile.type}
            </span>
          </div>
        </div>

        {/* Other Profiles */}
        {otherProfiles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
              Wissel naar profiel
            </div>
            {otherProfiles.map((profile) => {
              const OtherIcon = PROFILE_TYPE_ICONS[profile.type] || User;
              const color =
                PROFILE_TYPE_COLORS[profile.type] ||
                'from-gray-500 to-gray-600';
              return (
                <DropdownMenuItem
                  key={profile.id}
                  onClick={() => switchProfile(profile.id)}
                  className='cursor-pointer'
                >
                  <div className='flex items-center gap-2'>
                    {profile.avatarUrl ? (
                      <div
                        className='shadow-xs h-6 w-6 rounded-full border'
                        style={{
                          backgroundImage: profile.avatarUrl,
                          backgroundSize: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br text-xs text-white',
                          color
                        )}
                      >
                        <OtherIcon className='h-3 w-3' />
                      </div>
                    )}
                    <span>{profile.name}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />

        {/* Manage Profiles Link */}
        <DropdownMenuItem asChild>
          <NavLink
            to='/settings?tab=manage-profiles'
            className='flex cursor-pointer items-center gap-2'
          >
            <Settings className='h-4 w-4' />
            <span>Profielen beheren</span>
          </NavLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
