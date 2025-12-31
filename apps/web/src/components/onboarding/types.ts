// Onboarding types for the Fluxby onboarding system

export interface OnboardingStep {
  id: string;
  title: { nl: string; en: string };
  content: { nl: string; en: string };
  selector?: string; // CSS selector to highlight (e.g., "#net-worth-card")
  showPlaceholder?: boolean; // Show image placeholder
  placement?: 'center' | 'left' | 'right' | 'top' | 'bottom'; // Position of modal relative to spotlight
  action?: 'click'; // Action to perform on the highlighted element when moving to this step
}

export interface OnboardingChapter {
  id: string;
  menuItem: string; // The corresponding menu key (e.g., 'dashboard', 'transactions')
  route: string; // App route to navigate to (e.g., "/", "/transactions")
  icon: string; // Lucide icon name
  title: { nl: string; en: string };
  steps: OnboardingStep[];
}

export interface OnboardingState {
  isActive: boolean;
  hasCompletedOnboarding: boolean;
  currentChapterIndex: number;
  currentStepIndex: number;
  userName: string;
  language: 'nl' | 'en' | null;
}

export interface OnboardingContextType {
  state: OnboardingState;
  isCreatingDemo: boolean;
  // Security setup needed - true when encryption is not yet configured
  needsSecuritySetup: boolean;
  // Onboarding tour - true when demo profile/user not set up (after security setup)
  needsOnboarding: boolean;
  isLoadingUser: boolean;
  // Navigation
  startOnboarding: (restart?: boolean, startAtCurrentPage?: boolean) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToChapter: (chapterIndex: number) => void;
  // Language selection
  setLanguage: (language: 'nl' | 'en') => void;
  // User name
  setUserName: (name: string) => void;
  // Trigger demo profile setup after security setup
  triggerDemoSetup: () => Promise<void>;
  // Computed values
  currentChapter: OnboardingChapter | null;
  currentStep: OnboardingStep | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  totalSteps: number;
  totalChapters: number;
  // Spotlight
  spotlightRect: DOMRect | null;
  updateSpotlight: () => void;
}

// Step position in the flow
export interface StepPosition {
  chapterIndex: number;
  stepIndex: number;
  isFirst: boolean;
  isLast: boolean;
}
