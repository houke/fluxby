import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type LucideIcon,
  Plus,
  Settings2,
  Trash2,
  User,
  Briefcase,
  Users,
  Wallet,
  TrendingUp,
  Check,
  RefreshCcw,
  Copy,
  PiggyBank,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Toast } from '@/components/ui/toast';
import { useProfile } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import type { ProfileType, Profile } from '@fluxby/shared';

// Available profile types with icons
const PROFILE_TYPES: {
  value: ProfileType;
  labelKey: keyof TranslationKeys['settings']['profileManager']['types'];
  icon: LucideIcon;
}[] = [
  { value: 'personal', labelKey: 'personal', icon: User },
  { value: 'business', labelKey: 'business', icon: Briefcase },
  { value: 'shared', labelKey: 'shared', icon: Users },
  { value: 'savings', labelKey: 'savings', icon: Wallet },
  { value: 'investing', labelKey: 'investing', icon: TrendingUp },
];

// Account types for the account form
const ACCOUNT_TYPES = [
  { value: 'checking', icon: Wallet },
  { value: 'savings', icon: PiggyBank },
  { value: 'credit', icon: CreditCard },
] as const;

// Helper type for translation keys to avoid explicit circular dependency if possible, or just cast
import type { TranslationKeys } from '@/lib/i18n/nl';

export function ProfileManager() {
  const {
    profiles,
    activeProfileId,
    switchProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    isLoading: _isLoading,
  } = useProfile();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [copiedProfileId, setCopiedProfileId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Step state for create dialog: 'profile' | 'accounts'
  const [createStep, setCreateStep] = useState<'profile' | 'accounts'>(
    'profile'
  );
  const [newlyCreatedProfileId, setNewlyCreatedProfileId] = useState<
    string | null
  >(null);

  // Account creation state
  const [newAccountIban, setNewAccountIban] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<
    'checking' | 'savings' | 'credit'
  >('checking');
  const [createdAccounts, setCreatedAccounts] = useState<
    Array<{ iban: string; name: string; type: string }>
  >([]);

  // Avatar states
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [isRefreshingAvatars, setIsRefreshingAvatars] = useState(false);

  // Generate random avatar background patterns
  const buildPatternOptions = React.useCallback((): string[] => {
    const patterns: string[] = [];
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
      '#F1948A',
      '#85C1E9',
      '#D7BDE2',
    ];

    for (let i = 0; i < 8; i++) {
      const color1 = colors[Math.floor(Math.random() * colors.length)];
      const color2 = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.floor(Math.random() * 360);
      patterns.push(`linear-gradient(${angle}deg, ${color1}, ${color2})`);
    }

    return patterns;
  }, []);

  React.useEffect(() => {
    setAvatarOptions(buildPatternOptions());
  }, [buildPatternOptions]);

  const refreshAvatars = () => {
    setIsRefreshingAvatars(true);
    setTimeout(() => {
      setAvatarOptions(buildPatternOptions());
      setIsRefreshingAvatars(false);
    }, 300);
  };

  // Get avatar options for display, with selected avatar first when editing
  const getDisplayAvatars = () => {
    const selectedAvatar = formData.avatarUrl;
    if (editingProfile && selectedAvatar) {
      // Filter out the selected avatar from options (if present) and prepend it
      const filtered = avatarOptions.filter((a) => a !== selectedAvatar);
      return [selectedAvatar, ...filtered];
    }
    return avatarOptions;
  };

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    type: ProfileType;
    avatarUrl?: string | null;
  }>({
    name: '',
    type: 'personal',
    avatarUrl: null,
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    try {
      const newProfile = await createProfile({
        name: formData.name,
        type: formData.type,
        avatarUrl: formData.avatarUrl,
      });
      // Store the newly created profile ID and move to accounts step
      if (newProfile && typeof newProfile === 'object' && 'id' in newProfile) {
        setNewlyCreatedProfileId(newProfile.id as string);
      }
      setCreateStep('accounts');
      setCreatedAccounts([]);
    } catch (error) {
      console.error('Failed to create profile', error);
    }
  };

  // Create account for the newly created profile
  const createAccountMutation = useMutation({
    mutationFn: (data: { iban: string; name: string; type: string }) => {
      if (!newlyCreatedProfileId) throw new Error('No profile ID');
      return api.createAccountForProfile({
        profileId: newlyCreatedProfileId,
        name: data.name,
        iban: data.iban,
        type: data.type,
      });
    },
    onSuccess: (_, variables) => {
      setCreatedAccounts((prev) => [...prev, variables]);
      setNewAccountIban('');
      setNewAccountName('');
      setNewAccountType('checking');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleAddAccount = () => {
    if (
      !newAccountIban.trim() ||
      !newAccountName.trim() ||
      !newlyCreatedProfileId
    )
      return;
    createAccountMutation.mutate({
      iban: newAccountIban.trim().toUpperCase().replace(/\s/g, ''),
      name: newAccountName.trim(),
      type: newAccountType,
    });
  };

  const handleCloseCreateDialog = () => {
    setIsCreateOpen(false);
    setCreateStep('profile');
    setFormData({ name: '', type: 'personal', avatarUrl: null });
    setNewlyCreatedProfileId(null);
    setCreatedAccounts([]);
    setNewAccountIban('');
    setNewAccountName('');
    setNewAccountType('checking');
  };

  const handleUpdate = async () => {
    if (!editingProfile || !formData.name.trim()) return;
    try {
      await updateProfile(editingProfile.id, {
        name: formData.name,
        type: formData.type,
        avatarUrl: formData.avatarUrl,
      });
      setEditingProfile(null);
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  const handleDelete = async (id: string) => {
    // Check if this is the demo profile
    const profileToDelete = profiles.find((p) => p.id === id);
    const isDemoProfile = profileToDelete?.name === 'Demo';

    // Show different confirmation for demo profile
    const confirmMessage = isDemoProfile
      ? t.settings?.profileManager?.deleteDemoConfirm ||
        'Are you sure you want to delete the Demo profile? Note: Restarting the onboarding will create a new Demo account with fresh data.'
      : t.settings.profileManager.deleteConfirm;

    if (confirm(confirmMessage)) {
      try {
        await deleteProfile(id);
        if (isDemoProfile) {
          setToastMessage(
            t.settings?.profileManager?.demoDeleted ||
              'Demo profile deleted. Restart onboarding to create a new one.'
          );
        }
      } catch (error) {
        console.error('Failed to delete profile', error);
      }
    }
  };

  const openValidEdit = (profile: Profile) => {
    setFormData({
      name: profile.name,
      type: profile.type as ProfileType,
      avatarUrl: profile.avatarUrl,
    });
    setEditingProfile(profile);
  };

  const handleCopyProfileId = async (profileId: string) => {
    try {
      await navigator.clipboard.writeText(profileId);
      setCopiedProfileId(profileId);
      setToastMessage(
        t.settings?.profileManager?.idCopied ||
          'ID successfully copied to clipboard'
      );
      setTimeout(() => setCopiedProfileId(null), 2000);
    } catch (error) {
      console.error('Failed to copy profile ID', error);
    }
  };
  return (
    <div className='space-y-6' data-onboarding='settings-profiles'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold'>
            {t.settings.profileManager.title}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t.settings.profileManager.description}
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseCreateDialog();
            else setIsCreateOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({ name: '', type: 'personal' });
                setCreateStep('profile');
              }}
            >
              <Plus className='mr-2 h-4 w-4' />
              {t.settings.profileManager.newProfile}
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-lg'>
            {createStep === 'profile' ? (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {t.settings.profileManager.createTitle}
                  </DialogTitle>
                  <DialogDescription>
                    {t.settings.profileManager.createDescription}
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-6 py-4'>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        {t.settings.profileManager.profileName}
                      </label>
                      <Input
                        placeholder={t.settings.profile.namePlaceholder}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        {t.settings.profileManager.type}
                      </label>
                      <Select
                        value={formData.type}
                        onValueChange={(v) =>
                          setFormData({ ...formData, type: v as ProfileType })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFILE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className='flex items-center gap-2'>
                                <type.icon className='h-4 w-4' />
                                <span>
                                  {
                                    t.settings.profileManager.types[
                                      type.labelKey
                                    ]
                                  }
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Avatar Selection */}
                  <div className='space-y-4 border-t pt-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-1'>
                        <label className='text-sm font-medium'>
                          {t.settings.profile.avatarLabel}
                        </label>
                        <p className='text-xs text-muted-foreground'>
                          {t.settings.profile.avatarDescription}
                        </p>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={refreshAvatars}
                        disabled={isRefreshingAvatars}
                        className='h-8'
                      >
                        {isRefreshingAvatars ? (
                          <RefreshCcw className='h-3 w-3 animate-spin' />
                        ) : (
                          t.settings.profile.newPatterns
                        )}
                      </Button>
                    </div>
                    <div className='flex flex-wrap gap-2'>
                      {avatarOptions.map((pattern) => (
                        <button
                          key={pattern}
                          type='button'
                          onClick={() =>
                            setFormData({ ...formData, avatarUrl: pattern })
                          }
                          className={cn(
                            'relative h-11 w-11 shrink-0 rounded-full border shadow-sm transition-all hover:scale-105',
                            formData.avatarUrl === pattern &&
                              'ring-2 ring-purple-600 ring-offset-2 ring-offset-background dark:ring-purple-400'
                          )}
                          style={{
                            backgroundImage: pattern,
                            backgroundSize: 'cover',
                          }}
                        >
                          {formData.avatarUrl === pattern && (
                            <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/20'>
                              <Check className='h-4 w-4 text-white' />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={handleCloseCreateDialog}>
                    {t.settings.profileManager.cancel}
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!formData.name.trim()}
                  >
                    {t.settings.profileManager.create}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {t.settings?.profileManager?.addAccountsTitle ||
                      'Rekeningen toevoegen'}
                  </DialogTitle>
                  <DialogDescription>
                    {t.settings?.profileManager?.addAccountsDescription ||
                      'Voeg bankrekeningen toe aan je nieuwe profiel. Je kunt dit ook later doen via Instellingen.'}
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  {/* Success message */}
                  <div className='rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950'>
                    <p className='text-sm text-green-800 dark:text-green-200'>
                      ✓{' '}
                      {t.settings?.profileManager?.profileCreated?.replace(
                        '{name}',
                        formData.name
                      ) || `Profiel "${formData.name}" is aangemaakt!`}
                    </p>
                  </div>

                  {/* Added accounts list */}
                  {createdAccounts.length > 0 && (
                    <div className='space-y-2'>
                      <p className='text-sm font-medium'>
                        {t.settings?.profileManager?.addedAccounts ||
                          'Toegevoegde rekeningen:'}
                      </p>
                      <div className='space-y-2'>
                        {createdAccounts.map((acc) => {
                          const AccountIcon =
                            ACCOUNT_TYPES.find((at) => at.value === acc.type)
                              ?.icon || Wallet;
                          return (
                            <div
                              key={`${acc.iban}-${acc.type}`}
                              className='flex items-center gap-2 rounded-lg border bg-muted/50 p-2 text-sm'
                            >
                              <AccountIcon className='h-4 w-4 text-muted-foreground' />
                              <span className='font-medium'>{acc.name}</span>
                              <span className='font-mono text-xs text-muted-foreground'>
                                {acc.iban}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add account form */}
                  <div className='space-y-3 border-t pt-4'>
                    <p className='text-sm font-medium'>
                      {t.settings?.accounts?.addTitle || 'Nieuwe rekening'}
                    </p>
                    <div className='flex gap-2'>
                      <Input
                        placeholder={
                          t.settings?.accounts?.ibanPlaceholder ||
                          'NL00BANK0123456789'
                        }
                        value={newAccountIban}
                        onChange={(e) =>
                          setNewAccountIban(
                            e.target.value.toUpperCase().replace(/\s/g, '')
                          )
                        }
                        className='flex-1'
                      />
                      <Input
                        placeholder={
                          t.settings?.accounts?.namePlaceholder ||
                          'Naam rekening'
                        }
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                        className='flex-1'
                      />
                    </div>
                    <div className='flex gap-2'>
                      <Select
                        value={newAccountType}
                        onValueChange={(v) =>
                          setNewAccountType(v as typeof newAccountType)
                        }
                      >
                        <SelectTrigger className='flex-1'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCOUNT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className='flex items-center gap-2'>
                                <type.icon className='h-4 w-4' />
                                <span>
                                  {t.settings?.accounts?.types?.[type.value] ||
                                    type.value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAddAccount}
                        disabled={
                          createAccountMutation.isPending ||
                          !newAccountIban.trim() ||
                          !newAccountName.trim()
                        }
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        {t.settings?.accounts?.add || 'Toevoegen'}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog}>
                    {t.common?.done || 'Klaar'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {profiles.map((profile) => {
          const typeInfo =
            PROFILE_TYPES.find((t) => t.value === profile.type) ||
            PROFILE_TYPES[0];
          const isActive = profile.id === activeProfileId;
          const Icon = typeInfo.icon;

          return (
            <Card
              key={profile.id}
              className={`transition-all ${isActive ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
            >
              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    {profile.avatarUrl ? (
                      <div
                        className='h-10 w-10 rounded-full border shadow-sm'
                        style={{
                          backgroundImage: profile.avatarUrl,
                          backgroundSize: 'cover',
                        }}
                      />
                    ) : (
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted'>
                        <Icon className='h-5 w-5 text-foreground' />
                      </div>
                    )}
                    <div>
                      <CardTitle className='text-base'>
                        {profile.name}
                      </CardTitle>
                      <CardDescription className='capitalize'>
                        {t.settings.profileManager.types[typeInfo.labelKey] ||
                          profile.type}
                      </CardDescription>
                    </div>
                  </div>
                  {isActive && (
                    <span className='flex h-6 items-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary'>
                      {t.settings.profileManager.active}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-muted-foreground'>
                    {t.settings.profileManager.profileId || 'Profile ID'}:{' '}
                    <code className='rounded bg-muted px-1 py-0.5 font-mono text-xs'>
                      {profile.id}
                    </code>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className={cn(
                            'h-7 w-7 rounded-md',
                            copiedProfileId === profile.id &&
                              'bg-green-600 text-white hover:bg-green-600 hover:text-white'
                          )}
                          onClick={() => handleCopyProfileId(profile.id)}
                        >
                          {copiedProfileId === profile.id ? (
                            <Check className='h-3.5 w-3.5' />
                          ) : (
                            <Copy className='h-3.5 w-3.5' />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {copiedProfileId === profile.id
                            ? t.common.copied || 'Copied!'
                            : t.settings.profileManager.copyProfileId ||
                              'Copy Profile ID'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className='mt-1 text-sm text-muted-foreground'>
                  {t.settings.profileManager.createdOn || 'Created on'}{' '}
                  {new Date(
                    profile.createdAt || Date.now()
                  ).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className='flex justify-between border-t bg-muted/20 p-3'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => switchProfile(profile.id)}
                  disabled={isActive}
                  className={isActive ? 'invisible' : ''}
                >
                  {t.settings.profileManager.switchTo}
                </Button>
                <div className='flex gap-1'>
                  {/* Hide edit button for Demo profile - it's only removable, not editable */}
                  {profile.name !== 'Demo' && (
                    <Dialog
                      open={editingProfile?.id === profile.id}
                      onOpenChange={(open) => !open && setEditingProfile(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                          onClick={() => openValidEdit(profile)}
                        >
                          <Settings2 className='h-4 w-4' />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {t.settings.profileManager.editTitle}
                          </DialogTitle>
                        </DialogHeader>
                        <div className='space-y-6 py-4'>
                          <div className='space-y-4'>
                            <div className='space-y-2'>
                              <label className='text-sm font-medium'>
                                {t.settings.profileManager.profileName}
                              </label>
                              <Input
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className='space-y-2'>
                              <label className='text-sm font-medium'>
                                {t.settings.profileManager.type}
                              </label>
                              <Select
                                value={formData.type}
                                onValueChange={(v) =>
                                  setFormData({
                                    ...formData,
                                    type: v as ProfileType,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PROFILE_TYPES.map((type) => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <type.icon className='h-4 w-4' />
                                        <span>
                                          {
                                            t.settings.profileManager.types[
                                              type.labelKey
                                            ]
                                          }
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Avatar Selection */}
                          <div className='space-y-4 border-t pt-4'>
                            <div className='flex items-center justify-between'>
                              <div className='space-y-1'>
                                <label className='text-sm font-medium'>
                                  {t.settings.profile.avatarLabel}
                                </label>
                                <p className='text-xs text-muted-foreground'>
                                  {t.settings.profile.avatarDescription}
                                </p>
                              </div>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={refreshAvatars}
                                disabled={isRefreshingAvatars}
                                className='h-8'
                              >
                                {isRefreshingAvatars ? (
                                  <RefreshCcw className='h-3 w-3 animate-spin' />
                                ) : (
                                  t.settings.profile.newPatterns
                                )}
                              </Button>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {getDisplayAvatars().map((pattern, _idx) => (
                                <button
                                  key={pattern}
                                  type='button'
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      avatarUrl: pattern,
                                    })
                                  }
                                  className={cn(
                                    'relative h-11 w-11 shrink-0 rounded-full border shadow-sm transition-all hover:scale-105',
                                    formData.avatarUrl === pattern &&
                                      'ring-2 ring-purple-600 ring-offset-2 ring-offset-background dark:ring-purple-400'
                                  )}
                                  style={{
                                    backgroundImage: pattern,
                                    backgroundSize: 'cover',
                                  }}
                                >
                                  {formData.avatarUrl === pattern && (
                                    <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/20'>
                                      <Check className='h-4 w-4 text-white' />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant='outline'
                            onClick={() => setEditingProfile(null)}
                          >
                            {t.settings.profileManager.cancel}
                          </Button>
                          <Button onClick={handleUpdate}>
                            {t.settings.profileManager.save}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-destructive hover:bg-destructive hover:text-white'
                    onClick={() => handleDelete(profile.id)}
                    disabled={profiles.length <= 1} // Prevent deleting last profile
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type='success'
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
