// Main Onboarding Component
// This component renders the onboarding modal when active

import { useOnboarding } from './useOnboarding';
import { OnboardingModal } from './OnboardingModal';
import { useLanguage } from '@/contexts/LanguageContext';

export function Onboarding() {
  const { language: appLanguage, setLanguage: setAppLanguage } = useLanguage();
  const {
    state,
    isCreatingDemo,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    setLanguage,
    setUserName,
    goToChapter,
  } = useOnboarding();

  // Sync app language with onboarding language selection
  const handleLanguageSelect = (lang: 'nl' | 'en') => {
    setLanguage(lang);
    setAppLanguage(lang);
  };

  // Use onboarding language if set, otherwise use app language
  const effectiveLanguage = state.language || appLanguage;

  if (!state.isActive) {
    return null;
  }

  return (
    <OnboardingModal
      isActive={state.isActive}
      currentChapterIndex={state.currentChapterIndex}
      currentStepIndex={state.currentStepIndex}
      language={effectiveLanguage}
      userName={state.userName}
      onNext={nextStep}
      onPrevious={previousStep}
      onSkip={skipOnboarding}
      onComplete={completeOnboarding}
      onLanguageSelect={handleLanguageSelect}
      onUserNameChange={setUserName}
      onChapterSelect={goToChapter}
      isCreatingDemo={isCreatingDemo}
    />
  );
}
