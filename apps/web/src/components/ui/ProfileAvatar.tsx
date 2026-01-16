import { cn } from '@/lib/utils';
import { isGradientPattern } from '@/components/settings/profile-pattern-utils';

interface ProfileAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-12 w-12 text-base',
};

export function ProfileAvatar({
  name,
  avatarUrl,
  className,
  size = 'md',
}: ProfileAvatarProps) {
  const isGradient = isGradientPattern(avatarUrl);
  const initials = name ? name.charAt(0).toUpperCase() : 'P';

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted shadow-sm',
        sizeClasses[size],
        className
      )}
      style={
        isGradient
          ? {
              backgroundImage: avatarUrl as string,
              backgroundSize: 'cover',
            }
          : {}
      }
    >
      {avatarUrl && !isGradient ? (
        <img
          src={avatarUrl}
          alt={name || ''}
          className='h-full w-full object-cover'
        />
      ) : isGradient ? (
        <span className='sr-only'>{name}</span>
      ) : (
        <span className='font-bold text-muted-foreground'>{initials}</span>
      )}
    </div>
  );
}
