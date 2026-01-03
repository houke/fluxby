// Main Onboarding Component
// This component renders the onboarding modal when active or when mandatory

import { useRef, useEffect } from 'react';
import { useOnboarding } from './useOnboarding';
import { OnboardingModal } from './OnboardingModal';
import { useLanguage } from '@/contexts/LanguageContext';

export function Onboarding() {
  const { language: appLanguage, setLanguage: setAppLanguage } = useLanguage();
  const hasStartedRef = useRef(false);
  const {
    state,
    isCreatingDemo,
    needsOnboarding,
    isLoadingUser,
    nextStep,
    previousStep,
    dismissOnboarding,
    completeOnboarding,
    setLanguage,
    setUserName,
    goToChapter,
    startOnboarding,
  } = useOnboarding();

  // Sync app language with onboarding language selection
  const handleLanguageSelect = (lang: 'nl' | 'en') => {
    setLanguage(lang);
    setAppLanguage(lang);
  };

  // Use onboarding language if set, otherwise use app language
  const effectiveLanguage = state.language || appLanguage;

  // Show onboarding if:
  // 1. User explicitly started it (state.isActive)
  // 2. User needs to complete mandatory onboarding (needsOnboarding)
  const shouldShowOnboarding = state.isActive || needsOnboarding;

  // Auto-start onboarding when needed - use useEffect to avoid multiple calls
  useEffect(() => {
    // Only auto-start if:
    // - needsOnboarding is true (user/demo profile missing)
    // - onboarding is not already active
    // - we haven't already started it
    // - we haven't already progressed past the first step
    const hasProgressed =
      state.currentChapterIndex > 0 || state.currentStepIndex > 0;
    if (
      needsOnboarding &&
      !state.isActive &&
      !hasStartedRef.current &&
      !hasProgressed
    ) {
      hasStartedRef.current = true;
      // Don't use restart=true since that resets progress
      startOnboarding(false);
    }
  }, [
    needsOnboarding,
    state.isActive,
    state.currentChapterIndex,
    state.currentStepIndex,
    startOnboarding,
  ]);

  // Reset the ref when onboarding completes (so it can be triggered again later if needed)
  useEffect(() => {
    if (!needsOnboarding && hasStartedRef.current) {
      hasStartedRef.current = false;
    }
  }, [needsOnboarding]);

  // Show loading screen while checking user status for auto-trigger
  // But if user explicitly started onboarding (state.isActive), show it regardless
  if (isLoadingUser && !state.isActive) {
    return null;
  }

  // If needs onboarding but not yet active, show nothing while starting
  if (needsOnboarding && !state.isActive) {
    return null;
  }

  if (!shouldShowOnboarding) {
    return null;
  }

  return (
    <OnboardingModal
      isActive={shouldShowOnboarding}
      currentChapterIndex={state.currentChapterIndex}
      currentStepIndex={state.currentStepIndex}
      language={effectiveLanguage}
      userName={state.userName}
      onNext={nextStep}
      onPrevious={previousStep}
      onSkip={dismissOnboarding}
      onComplete={completeOnboarding}
      onLanguageSelect={handleLanguageSelect}
      onUserNameChange={setUserName}
      onChapterSelect={goToChapter}
      isCreatingDemo={isCreatingDemo}
    />
  );
}
