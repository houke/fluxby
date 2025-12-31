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
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (!activeProfile) {
    return null;
  }

  // Filter out hidden profiles from the dropdown (but show all in the profile manager)
  const otherProfiles = profiles.filter(
    (p) => p.id !== activeProfile.id && !p.isHidden
  );
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
          <div
            className={cn(
              'relative h-8 w-8 rounded-full border shadow-sm',
              !activeProfile.avatarUrl && `bg-gradient-to-br ${typeColor}`
            )}
            style={
              activeProfile.avatarUrl
                ? {
                    backgroundImage: activeProfile.avatarUrl,
                    backgroundSize: 'cover',
                  }
                : {}
            }
          >
            <div className='absolute inset-0 flex items-center justify-center'>
              <Icon className='h-4 w-4 text-white drop-shadow' />
            </div>
          </div>

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
          <div
            className={cn(
              'relative h-8 w-8 rounded-full border shadow-sm',
              !activeProfile.avatarUrl && `bg-gradient-to-br ${typeColor}`
            )}
            style={
              activeProfile.avatarUrl
                ? {
                    backgroundImage: activeProfile.avatarUrl,
                    backgroundSize: 'cover',
                  }
                : {}
            }
          >
            <div className='absolute inset-0 flex items-center justify-center'>
              <Icon className='h-4 w-4 text-white drop-shadow' />
            </div>
          </div>
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
                    <div
                      className={cn(
                        'relative h-6 w-6 rounded-full border shadow-sm',
                        !profile.avatarUrl && `bg-gradient-to-br ${color}`
                      )}
                      style={
                        profile.avatarUrl
                          ? {
                              backgroundImage: profile.avatarUrl,
                              backgroundSize: 'cover',
                            }
                          : {}
                      }
                    >
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <OtherIcon className='h-3 w-3 text-white drop-shadow' />
                      </div>
                    </div>
                    <span>{profile.name}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />

        {/* Manage Profiles Link */}
        <DropdownMenuItem
          onSelect={() => navigate('/settings?tab=manage-profiles')}
          className='cursor-pointer'
        >
          <Settings className='h-4 w-4' />
          <span>Profielen beheren</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
