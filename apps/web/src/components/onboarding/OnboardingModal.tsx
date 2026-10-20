// Onboarding Modal Component
// The main modal that displays during onboarding with chapter tabs, step content, and navigation

import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { findOnboardingTarget } from './onboarding-target';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  CalendarClock,
  BookUser,
  Tags,
  Upload,
  MessageCircle,
  Settings,
  Menu,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FluxbyWebGL } from '@fluxby/shared';
import { onboardingChapters } from './onboarding-data';
import { SpotlightOverlay } from './SpotlightOverlay';
import { useProfile } from '@/contexts/ProfileContext';
import { useTranslationsFor } from '@/contexts/LanguageContext';
import { useReducedMotion } from '@/hooks/useMediaQuery';
// Types are in ./types.ts

// Icon mapping for chapters
const CHAPTER_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  CalendarClock,
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

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OnboardingModalProps {
  isActive: boolean;
  currentChapterIndex: number;
  currentStepIndex: number;
  language: 'nl' | 'en';
  userName: string;
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
  onComplete: () => void;
  onLanguageSelect: (language: 'nl' | 'en') => void;
  onUserNameChange: (name: string) => void;
  onChapterSelect: (index: number) => void;
  isCreatingDemo?: boolean;
}

export function OnboardingModal({
  isActive,
  currentChapterIndex,
  currentStepIndex,
  language,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userName,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLanguageSelect,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUserNameChange,
  onChapterSelect,
  isCreatingDemo = false,
}: OnboardingModalProps) {
  const t = useTranslationsFor(language).onboarding;
  const location = useLocation();
  const { profiles } = useProfile();
  const prefersReducedMotion = useReducedMotion();
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(
    null
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [measuredModalHeight, setMeasuredModalHeight] = useState(320);
  const [modalState, setModalState] = useState<'normal' | 'closing' | 'closed'>(
    'normal'
  );
  const [mascotRect, setMascotRect] = useState<SpotlightRect | null>(null);
  const [visitedChapters, setVisitedChapters] = useState<Set<number>>(
    new Set([0])
  );
  const prevChapterRef = useRef<number>(0);

  // Animation durations - reduced when user prefers reduced motion
  const transitionDuration = prefersReducedMotion ? 0 : 500;
  const closeAnimationDuration = prefersReducedMotion ? 0 : 700;

  const currentChapter = onboardingChapters[currentChapterIndex];
  const currentStep = currentChapter?.steps[currentStepIndex];
  // The provider owns navigation, including destinations within a chapter.
  const targetRoute = currentStep?.route ?? currentChapter?.route;
  const isNavigating = `${location.pathname}${location.search}` !== targetRoute;

  useEffect(() => {
    const element = modalRef.current;
    if (!isActive || !element) return;
    if (contentRef.current) contentRef.current.scrollTop = 0;
    const measure = () =>
      setMeasuredModalHeight(element.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isActive, currentStep?.id]);

  // Check if only Demo profile exists (for dynamic next steps content)
  const hasOnlyDemoProfile = useMemo(() => {
    return profiles.length === 1 && profiles[0]?.name?.toLowerCase() === 'demo';
  }, [profiles]);

  // Calculate progress
  const totalChapters = onboardingChapters.length;
  const totalStepsInChapter = currentChapter?.steps.length || 0;

  // Track when we move to a new chapter for the first time
  const isChapterIntro = useMemo(() => {
    // First step of a chapter (but not the welcome chapter) and chapter not yet visited
    const isFirstStepOfChapter = currentStepIndex === 0;
    const isNotWelcome = currentChapterIndex > 0;
    const isNewChapter = !visitedChapters.has(currentChapterIndex);
    return isFirstStepOfChapter && isNotWelcome && isNewChapter;
  }, [currentChapterIndex, currentStepIndex, visitedChapters]);

  // Mark chapter as visited when we enter it
  useEffect(() => {
    if (currentChapterIndex !== prevChapterRef.current) {
      setVisitedChapters((prev) => new Set([...prev, currentChapterIndex]));
      prevChapterRef.current = currentChapterIndex;
    }
  }, [currentChapterIndex]);

  // Perform click action when a step has action: 'click'
  useEffect(() => {
    if (!isActive || !currentStep?.action || !currentStep?.selector) return;

    const selector = currentStep.selector;
    if (currentStep.action === 'click') {
      // Longer delay to ensure DOM is ready, especially after route changes
      const timer = setTimeout(() => {
        const element = findOnboardingTarget(selector);
        if (element && element.getAttribute('aria-expanded') !== 'true') {
          // Open disclosure controls without toggling them closed on a revisit.
          element.click();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep?.action, currentStep?.selector, currentStepIndex]);

  // Get the text based on language
  const getText = useCallback(
    (textObj: { nl: string; en: string }) => {
      return textObj[language] || textObj.nl;
    },
    [language]
  );

  // Track spotlight element position
  useEffect(() => {
    if (!isActive || !currentStep?.selector) {
      setSpotlightRect(null);
      return;
    }

    const selector = currentStep.selector;

    const updateRect = () => {
      const element = findOnboardingTarget(
        selector,
        currentStep.fallbackSelector
      );
      if (element) {
        const rect = element.getBoundingClientRect();
        setSpotlightRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setSpotlightRect(null);
      }
    };

    // Initial update after small delay for DOM
    const timer = setTimeout(updateRect, 100);
    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, { childList: true, subtree: true });

    // Update on scroll/resize
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [
    isActive,
    currentStep?.selector,
    currentStep?.fallbackSelector,
    location.pathname,
    location.search,
  ]);

  // Track mascot position for closing animation
  useEffect(() => {
    const updateMascotRect = () => {
      const mascotElement = document.querySelector(
        '[data-onboarding="fluxby-mascot"]'
      );
      if (mascotElement) {
        const rect = mascotElement.getBoundingClientRect();
        setMascotRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial update
    updateMascotRect();

    // Update on resize
    window.addEventListener('resize', updateMascotRect);

    return () => {
      window.removeEventListener('resize', updateMascotRect);
    };
  }, []);

  // Calculate modal position based on spotlight
  const modalPosition = useMemo(() => {
    // Closing animation - shrink towards the fluxby mascot
    if (modalState === 'closing') {
      const targetPosition = mascotRect
        ? {
            top: `${mascotRect.y + mascotRect.height / 2}px`,
            left: `${mascotRect.x + mascotRect.width / 2}px`,
          }
        : { top: '16px', left: '80px' };

      return {
        style: {
          ...targetPosition,
          transitionDuration: `${closeAnimationDuration}ms`,
        },
        className:
          'fixed scale-0 opacity-0 -translate-x-1/2 -translate-y-1/2 transition-all',
      };
    }

    const centeredPosition = {
      style: {
        top: currentChapterIndex === 0 ? '50%' : 'calc((100dvh - 120px) / 2)',
      },
      className: 'fixed left-1/2 -translate-x-1/2 -translate-y-1/2',
    };

    // Center modal for chapter intro (first time visiting a new chapter)
    if (isChapterIntro) {
      return centeredPosition;
    }

    // Center modal if no selector or center placement
    if (
      !currentStep?.selector ||
      currentStep.placement === 'center' ||
      !spotlightRect
    ) {
      return centeredPosition;
    }

    const modalWidth = Math.min(380, window.innerWidth - 24);
    const modalHeight = measuredModalHeight;
    const padding = 16;
    const viewportPadding = 12;
    // Reserve space for the floating bottom navigation card
    const bottomNavHeight = 120;

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Calculate available space around the spotlight
    const spaceRight = viewport.width - (spotlightRect.x + spotlightRect.width);
    const spaceLeft = spotlightRect.x;
    const spaceBottom =
      viewport.height -
      (spotlightRect.y + spotlightRect.height) -
      bottomNavHeight;
    const spaceTop = spotlightRect.y;

    let top: number;
    let left: number;

    // Prefer positioning to the right of the spotlight
    if (spaceRight >= modalWidth + padding + viewportPadding) {
      left = spotlightRect.x + spotlightRect.width + padding;
      top = Math.max(
        viewportPadding,
        Math.min(
          spotlightRect.y,
          viewport.height - modalHeight - viewportPadding - bottomNavHeight
        )
      );
    }
    // Then try left
    else if (spaceLeft >= modalWidth + padding + viewportPadding) {
      left = spotlightRect.x - modalWidth - padding;
      top = Math.max(
        viewportPadding,
        Math.min(
          spotlightRect.y,
          viewport.height - modalHeight - viewportPadding - bottomNavHeight
        )
      );
    }
    // Then try above
    else if (spaceTop >= modalHeight + padding + viewportPadding) {
      top = spotlightRect.y - modalHeight - padding;
      left = Math.max(
        viewportPadding,
        Math.min(
          spotlightRect.x + spotlightRect.width / 2 - modalWidth / 2,
          viewport.width - modalWidth - viewportPadding
        )
      );
    }
    // Then try below (with bottom nav consideration)
    else if (spaceBottom >= modalHeight + padding + viewportPadding) {
      top = spotlightRect.y + spotlightRect.height + padding;
      left = Math.max(
        viewportPadding,
        Math.min(
          spotlightRect.x + spotlightRect.width / 2 - modalWidth / 2,
          viewport.width - modalWidth - viewportPadding
        )
      );
    }
    // Fallback to center
    else {
      return centeredPosition;
    }

    // A tall or not-yet-scrolled target can sit beyond the viewport. Keep the
    // measured explanation above the navigation while the spotlight settles.
    top = Math.max(
      viewportPadding,
      Math.min(
        top,
        viewport.height - modalHeight - viewportPadding - bottomNavHeight
      )
    );
    left = Math.max(
      viewportPadding,
      Math.min(left, viewport.width - modalWidth - viewportPadding)
    );

    return {
      style: { top: `${top}px`, left: `${left}px` },
      className: 'fixed',
    };
  }, [
    currentStep?.selector,
    currentStep?.placement,
    spotlightRect,
    isChapterIntro,
    modalState,
    mascotRect,
    closeAnimationDuration,
    measuredModalHeight,
    currentChapterIndex,
  ]);

  // Handle close with animation (only if skip is allowed)
  const handleClose = useCallback(() => {
    if (!onSkip) return;
    setModalState('closing');
    // After shrink animation, show the "See you later" message
    // Skip animation delay if user prefers reduced motion
    setTimeout(() => {
      setModalState('closed');
      // Keep message visible for 2 seconds then close completely
      setTimeout(() => {
        onSkip();
      }, 2000);
    }, closeAnimationDuration);
  }, [onSkip, closeAnimationDuration]);

  // Handle early close of the see you later message
  const handleCloseSeeYouLater = useCallback(() => {
    if (onSkip) onSkip();
  }, [onSkip]);

  // Close message on any click outside when in 'closed' state
  useEffect(() => {
    if (modalState === 'closed' && onSkip) {
      const handleClick = () => {
        onSkip();
      };
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [modalState, onSkip]);

  if (!isActive || !currentChapter || !currentStep) return null;

  // Check if this is a special step
  const isWelcomeChapter = currentChapterIndex === 0;
  const isFirstGlobalStep = currentChapterIndex === 0 && currentStepIndex === 0;
  const isLastGlobalStep =
    currentChapterIndex === totalChapters - 1 &&
    currentStepIndex === totalStepsInChapter - 1;

  // Show closing message - positioned relative to the fluxby mascot
  // Only show this when state is 'closed' (after shrink animation)
  if (modalState === 'closed') {
    // Calculate position next to the mascot (to the right of it)
    const closingPosition = mascotRect
      ? {
          top: `${mascotRect.y + mascotRect.height / 2 - 40}px`,
          left: `${mascotRect.x + mascotRect.width + 8}px`,
        }
      : { top: '16px', left: '80px' };

    return (
      <div
        className='fixed z-[9999] max-w-xs rounded-xl bg-card p-4 shadow-lg transition-all duration-500 animate-in fade-in zoom-in-95'
        style={{
          ...closingPosition,
        }}
      >
        <div className='flex items-start gap-3'>
          <FluxbyWebGL width={40} height={40} />
          <div className='flex-1'>
            <p className='text-sm font-medium'>{t.seeYouLaterTitle}</p>
            <p className='text-xs text-muted-foreground'>
              {t.seeYouLaterDescription}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCloseSeeYouLater();
            }}
            className='rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            title={t.closeTour}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>
    );
  }

  const handleNext = async () => {
    if (isLastGlobalStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <>
      {/* Spotlight Overlay */}
      <SpotlightOverlay
        targetSelector={currentStep.selector}
        fallbackSelector={currentStep.fallbackSelector}
        isActive={modalState === 'normal'}
        padding={12}
        borderRadius={12}
        transitionDuration={transitionDuration}
      />

      {/* Modal */}
      <div
        data-testid='onboarding-step'
        ref={modalRef}
        className={cn(
          'z-[9999] flex max-h-[min(70vh,calc(100dvh-156px))] w-[calc(100vw-24px)] max-w-[380px] flex-col overflow-hidden rounded-xl bg-card shadow-2xl',
          'transition-[top,left,transform,opacity] duration-200 ease-out',
          modalPosition.className
        )}
        style={modalPosition.style}
      >
        {/* Header */}
        <div className='relative flex flex-col items-center px-4 pt-3 pb-1'>
          {/* The welcome chapter must be completed; later tour steps can be skipped. */}
          {!isWelcomeChapter && !isLastGlobalStep && onSkip && (
            <button
              onClick={handleClose}
              className='absolute top-2 right-2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
              title={t.skipTour}
            >
              <X className='h-4 w-4' />
            </button>
          )}

          {/* Inline step indicator for welcome chapter */}
          {isWelcomeChapter && (
            <div className='flex items-center gap-2 pt-1'>
              {currentChapter.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    idx === currentStepIndex
                      ? 'w-6 bg-purple-600'
                      : idx < currentStepIndex
                        ? 'bg-purple-400'
                        : 'bg-purple-200 dark:bg-purple-900/30'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          ref={contentRef}
          className='flex flex-1 flex-col items-center overflow-y-auto px-5 py-4'
        >
          {/* Loading State */}
          {isNavigating ? (
            <div className='flex flex-col items-center gap-3'>
              <div className='h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600' />
              <p className='text-sm text-muted-foreground'>{t.wait}</p>
            </div>
          ) : (
            <>
              {/* Step Title */}
              <h2 className='text-center text-xl font-bold'>
                {getText(currentStep.title)}
              </h2>

              {/* Step Content - Dynamic for next steps when only Demo profile */}
              <p className='mt-4 text-center whitespace-pre-line text-muted-foreground'>
                {currentStep.id === 'completion-next-steps' &&
                hasOnlyDemoProfile
                  ? t.demoNextSteps
                  : getText(currentStep.content)}
              </p>

              {/* Inline Navigation for Welcome Chapter */}
              {isWelcomeChapter && (
                <div className='mt-8 flex w-full max-w-sm items-center justify-center'>
                  <Button
                    size='sm'
                    onClick={handleNext}
                    disabled={isNavigating}
                    className='gap-1 bg-purple-600 hover:bg-purple-700'
                  >
                    {t.getStarted}
                    <ChevronRight className='h-3.5 w-3.5' />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar - Floating Card (hidden during welcome chapter) */}
      {modalState === 'normal' && !isWelcomeChapter && (
        <div
          data-testid='onboarding-navigation'
          className='fixed bottom-4 left-1/2 z-[10000] w-[calc(100vw-24px)] max-w-2xl -translate-x-1/2'
        >
          <div className='rounded-xl border bg-card/95 shadow-xl backdrop-blur-sm'>
            {/* Chapter Navigation Tabs */}
            {currentChapterIndex > 0 && (
              <TooltipProvider delayDuration={200}>
                <div className='flex items-center justify-start gap-1 overflow-x-auto border-b px-3 py-2 md:justify-center md:px-4'>
                  {onboardingChapters.slice(1, -1).map((chapter, idx) => {
                    const actualIdx = idx + 1;
                    const Icon = CHAPTER_ICONS[chapter.icon] || Sparkles;
                    const isCurrentChapter = actualIdx === currentChapterIndex;
                    const isCompleted = actualIdx < currentChapterIndex;

                    return (
                      <Tooltip key={chapter.id}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => onChapterSelect(actualIdx)}
                            aria-label={getText(chapter.title)}
                            className={cn(
                              'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all',
                              isCurrentChapter
                                ? 'bg-purple-600 text-white shadow'
                                : isCompleted
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                  : 'text-muted-foreground hover:bg-muted'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle className='h-3.5 w-3.5' />
                            ) : (
                              <Icon className='h-3.5 w-3.5' />
                            )}
                            {isCurrentChapter && (
                              <span className='max-w-20 truncate'>
                                {getText(chapter.title)}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side='top' className='z-[10001]'>
                          {isCompleted && (
                            <span className='mr-1 text-green-500'>✓</span>
                          )}
                          {getText(chapter.title)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            )}

            {/* Navigation Buttons with Step Counter */}
            <div className='flex items-center justify-between gap-2 px-3 py-3 sm:gap-6 sm:px-4'>
              {/* Previous Button */}
              <Button
                variant='ghost'
                size='sm'
                onClick={onPrevious}
                disabled={isFirstGlobalStep || isNavigating}
                className={cn(
                  'shrink-0 gap-1',
                  isFirstGlobalStep && 'invisible'
                )}
              >
                <ChevronLeft className='h-3.5 w-3.5' />
                {t.previous}
              </Button>

              {/* Step Counter with Chapter Title */}
              <div className='flex min-w-0 flex-col items-center'>
                <span className='text-xs font-medium whitespace-nowrap text-purple-600 sm:text-sm'>
                  {t.step} {currentStepIndex + 1} {t.of} {totalStepsInChapter}
                </span>
                <span className='max-w-full truncate text-xs text-muted-foreground'>
                  {getText(currentChapter.title)}
                </span>
              </div>

              {/* Next Button */}
              <Button
                size='sm'
                onClick={handleNext}
                disabled={isNavigating || isCreatingDemo}
                className='shrink-0 gap-1 bg-purple-600 hover:bg-purple-700'
              >
                {isCreatingDemo ? (
                  <>
                    <div className='h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    {t.preparingDemo}
                  </>
                ) : isLastGlobalStep ? (
                  t.finish
                ) : (
                  t.next
                )}
                {!isLastGlobalStep && !isCreatingDemo && (
                  <ChevronRight className='h-3.5 w-3.5' />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
