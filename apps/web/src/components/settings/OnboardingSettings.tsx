import { useState } from 'react';
import {
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  BookUser,
  Tags,
  Upload,
  MessageCircle,
  Settings,
  Menu,
  CheckCircle,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useOnboarding } from '@/components/onboarding/useOnboarding';
import { onboardingChapters } from '@/components/onboarding/onboarding-data';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Icon mapping for chapters (same as OnboardingModal)
const CHAPTER_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  BookUser,
  Tags,
  Upload,
  MessageCircle,
  Settings,
  Menu,
  CheckCircle,
  Sparkles,
  HelpCircle,
};

export function OnboardingSettings() {
  const { language } = useLanguage();
  const { state, startOnboarding } = useOnboarding();
  const { profiles, switchProfile, refreshProfiles } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Calculate overall progress
  const totalSteps = onboardingChapters.reduce(
    (acc, ch) => acc + ch.steps.length,
    0
  );

  // Calculate completed steps based on current position
  let completedSteps = 0;
  for (let i = 0; i < state.currentChapterIndex; i++) {
    completedSteps += onboardingChapters[i].steps.length;
  }
  completedSteps += state.currentStepIndex;

  // Check if onboarding was completed (stored in localStorage)
  const isCompleted =
    localStorage.getItem('fluxby-onboarding-completed') === 'true';

  // Check if onboarding was ever started (has state saved)
  const wasStarted =
    state.currentChapterIndex > 0 || state.currentStepIndex > 0 || isCompleted;

  const progressPercentage = isCompleted
    ? 100
    : wasStarted
      ? Math.round((completedSteps / totalSteps) * 100)
      : 0;

  const getText = (nl: string, en: string) => (language === 'nl' ? nl : en);

  // Handle restart with demo account check
  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      // Check if demo profile exists
      let demoProfile = profiles.find((p) => p.name === 'Demo');

      if (!demoProfile) {
        // Create demo profile
        demoProfile = await api.createDemoProfile();
        await refreshProfiles();
      }

      // Always seed/reseed demo data when restarting
      await api.seedDemoData(demoProfile.id);

      // Clear onboarding completion flag
      localStorage.removeItem('fluxby-onboarding-completed');

      // Clear onboarding state to force fresh start
      localStorage.removeItem('fluxby_onboarding');

      // Set restart flag so onboarding starts after reload
      localStorage.setItem('fluxby-onboarding-restart', 'true');
      // Show blocking overlay during profile switch/reload
      localStorage.setItem('fluxby-switching-overlay', 'true');

      // Switch to demo profile
      switchProfile(demoProfile.id);

      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();

      // Navigate to home and start onboarding after profile switch settles
      navigate('/');
      setTimeout(() => {
        // Force page reload to ensure clean state
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error('Failed to restart onboarding:', error);
    } finally {
      setIsRestarting(false);
      setShowRestartDialog(false);
    }
  };

  return (
    <>
      <Card data-onboarding='onboarding-settings'>
        <CardHeader>
          <CardTitle>{getText('Rondleiding', 'Onboarding Tour')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Progress Section */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>
                {getText('Voortgang', 'Progress')}
              </span>
              <span className='font-medium'>
                {isCompleted ? (
                  <span className='flex items-center gap-1 text-green-600'>
                    <Check className='h-4 w-4' />
                    {getText('Voltooid', 'Completed')}
                  </span>
                ) : wasStarted ? (
                  `${progressPercentage}%`
                ) : (
                  getText('Nog niet gestart', 'Not started')
                )}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className='h-2'
              indicatorClassName={
                isCompleted ? 'bg-green-600' : 'bg-purple-600'
              }
            />
          </div>

          {/* Description */}
          <p className='text-sm text-muted-foreground'>
            {isCompleted
              ? getText(
                  'Je hebt de rondleiding voltooid! Je kunt deze altijd opnieuw starten om alle functies te bekijken.',
                  'You have completed the tour! You can always restart it to review all features.'
                )
              : wasStarted
                ? getText(
                    'Je bent bezig met de rondleiding. Ga verder waar je gebleven was of start opnieuw.',
                    'You are in the middle of the tour. Continue where you left off or restart.'
                  )
                : getText(
                    'Ontdek alle functies van Fluxby met onze interactieve rondleiding.',
                    'Discover all features of Fluxby with our interactive tour.'
                  )}
          </p>

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2'>
            {!state.isActive && !isCompleted && wasStarted && (
              <Button
                onClick={() => {
                  // Navigate to the route of the current chapter first, then start
                  const currentChapter =
                    onboardingChapters[state.currentChapterIndex];
                  if (currentChapter) {
                    navigate(currentChapter.route);
                    // Small delay to allow navigation, then start
                    setTimeout(() => startOnboarding(false), 100);
                  } else {
                    startOnboarding(false);
                  }
                }}
                size='sm'
                className='gap-2 bg-purple-600 hover:bg-purple-700'
              >
                <Play className='h-4 w-4' />
                {getText('Verder gaan', 'Continue')}
              </Button>
            )}

            {!state.isActive && !wasStarted && (
              <Button
                onClick={() => startOnboarding(false)}
                size='sm'
                className='gap-2 bg-purple-600 hover:bg-purple-700'
              >
                <Play className='h-4 w-4' />
                {getText('Start rondleiding', 'Start Tour')}
              </Button>
            )}

            {(isCompleted || wasStarted) && !state.isActive && (
              <Button
                variant='outline'
                onClick={() => setShowRestartDialog(true)}
                size='sm'
                className='gap-2'
              >
                <RotateCcw className='h-4 w-4' />
                {getText('Opnieuw starten', 'Restart')}
              </Button>
            )}

            {state.isActive && (
              <div className='flex items-center gap-2 rounded-lg bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'>
                <div className='h-2 w-2 animate-pulse rounded-full bg-purple-600' />
                {getText('Rondleiding is actief', 'Tour is active')}
              </div>
            )}
          </div>

          {/* Chapter Overview */}
          {wasStarted && !isCompleted && (
            <div className='mt-4 border-t pt-4'>
              <p className='mb-2 text-xs font-medium text-muted-foreground'>
                {getText('Hoofdstukken', 'Chapters')}
              </p>
              <TooltipProvider delayDuration={0}>
                <div className='flex flex-wrap items-center gap-2'>
                  {onboardingChapters.slice(1, -1).map((chapter, idx) => {
                    const actualIdx = idx + 1;
                    const isCurrentChapter =
                      actualIdx === state.currentChapterIndex;
                    const isChapterCompleted =
                      actualIdx < state.currentChapterIndex;
                    const ChapterIcon =
                      CHAPTER_ICONS[chapter.icon] || LayoutDashboard;
                    const chapterTitle =
                      chapter.title[language === 'nl' ? 'nl' : 'en'];

                    return (
                      <Tooltip key={chapter.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors',
                              isChapterCompleted &&
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                              isCurrentChapter &&
                                'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                              !isChapterCompleted &&
                                !isCurrentChapter &&
                                'bg-muted text-muted-foreground'
                            )}
                          >
                            {isChapterCompleted ? (
                              <Check className='h-3 w-3' />
                            ) : (
                              <ChapterIcon className='h-3 w-3' />
                            )}
                            {isCurrentChapter && (
                              <span className='max-w-[80px] truncate'>
                                {chapterTitle}
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        {!isCurrentChapter && (
                          <TooltipContent side='bottom'>
                            <p>{chapterTitle}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restart Confirmation Dialog */}
      <Dialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-500' />
              {getText('Rondleiding herstarten', 'Restart Tour')}
            </DialogTitle>
            <DialogDescription className='space-y-2 pt-2'>
              <p>
                {getText(
                  'Door de rondleiding te herstarten wordt je automatisch overgeschakeld naar het Demo profiel.',
                  'By restarting the tour, you will be automatically switched to the Demo profile.'
                )}
              </p>
              <p>
                {getText(
                  'Als er geen Demo profiel bestaat, wordt deze aangemaakt en gevuld met voorbeelddata.',
                  'If no Demo profile exists, one will be created and filled with sample data.'
                )}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowRestartDialog(false)}
              disabled={isRestarting}
            >
              {getText('Annuleren', 'Cancel')}
            </Button>
            <Button
              onClick={handleRestart}
              disabled={isRestarting}
              className='bg-purple-600 hover:bg-purple-700'
            >
              {isRestarting ? (
                <>
                  <RotateCcw className='mr-2 h-4 w-4 animate-spin' />
                  {getText('Bezig...', 'Starting...')}
                </>
              ) : (
                <>
                  <Play className='mr-2 h-4 w-4' />
                  {getText('Herstarten', 'Restart')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
