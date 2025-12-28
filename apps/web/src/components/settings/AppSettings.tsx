import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';

export function AppSettings() {
  const { t, language, setLanguage, languages } = useLanguage();
  const queryClient = useQueryClient();

  // User data
  const { data: user } = useQuery<{ id: number; name: string }>({
    queryKey: ['user'],
    queryFn: () => api.getUser() as Promise<{ id: number; name: string }>,
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { name?: string }) => api.updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditingName(false);
    },
  });

  // User name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    if (user?.name) {
      setEditedName(user.name);
    }
  }, [user?.name]);

  const handleSaveName = () => {
    if (editedName.trim()) {
      updateUserMutation.mutate({ name: editedName.trim() });
    }
  };

  // Theme state
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  return (
    <div className='space-y-6'>
      <Card data-onboarding='settings-app-preferences'>
        <CardHeader>
          <CardTitle>{t.settings.appSettings}</CardTitle>
          <CardDescription>{t.settings.appSettingsDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* User Name */}
            <div className='flex items-center justify-between py-3'>
              <div>
                <p className='font-medium'>
                  {language === 'nl' ? 'Je naam' : 'Your name'}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {language === 'nl'
                    ? 'Wordt gebruikt in de begroeting'
                    : 'Used in the greeting'}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                {isEditingName ? (
                  <>
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className='w-40'
                      placeholder={
                        language === 'nl' ? 'Je naam...' : 'Your name...'
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setIsEditingName(false);
                          setEditedName(user?.name || '');
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size='icon'
                      onClick={handleSaveName}
                      disabled={updateUserMutation.isPending}
                      className='rounded-md hover:bg-purple-600 hover:text-white'
                    >
                      <Check className='h-4 w-4' />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className='text-sm text-muted-foreground'>
                      {user?.name ||
                        (language === 'nl' ? 'Niet ingesteld' : 'Not set')}
                    </span>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setIsEditingName(true)}
                            className='rounded-md hover:bg-purple-600 hover:text-white'
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t.common?.edit ||
                            (language === 'nl' ? 'Bewerken' : 'Edit')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}
              </div>
            </div>

            {/* Language */}
            <div className='flex items-center justify-between border-t py-3'>
              <div>
                <p className='font-medium'>{t.settings.language}</p>
                <p className='text-sm text-muted-foreground'>
                  {t.settings.languageDescription}
                </p>
              </div>
              <div className='flex gap-1'>
                {(Object.keys(languages) as Array<keyof typeof languages>).map(
                  (lang) => (
                    <Button
                      key={lang}
                      variant={language === lang ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setLanguage(lang)}
                      className='px-3'
                    >
                      {languages[lang].flag} {languages[lang].name}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Currency */}
            <div className='flex items-center justify-between border-t py-3'>
              <div>
                <p className='font-medium'>{t.settings.currency}</p>
                <p className='text-sm text-muted-foreground'>
                  {t.settings.currencyDescription}
                </p>
              </div>
              <span className='text-sm text-muted-foreground'>€</span>
            </div>

            {/* Theme */}
            <div className='flex items-center justify-between border-t py-3'>
              <div>
                <p className='font-medium'>{t.settings.theme}</p>
                <p className='text-sm text-muted-foreground'>
                  {t.settings.themeDescription}
                </p>
              </div>
              <div className='flex gap-1'>
                <Button
                  variant={currentTheme === 'light' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => {
                    document.documentElement.classList.remove('dark');
                    setCurrentTheme('light');
                  }}
                  className='px-2'
                >
                  ☀️ {t.settings.themeLight}
                </Button>
                <Button
                  variant={currentTheme === 'dark' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => {
                    document.documentElement.classList.add('dark');
                    setCurrentTheme('dark');
                  }}
                  className='px-2'
                >
                  🌙 {t.settings.themeDark}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
