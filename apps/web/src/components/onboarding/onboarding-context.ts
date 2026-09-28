// Onboarding context definition - separate file for Fast Refresh compatibility
import { createContext } from 'react';
import type { OnboardingContextType } from './types';

export const ONBOARDING_STORAGE_KEYS = {
  state: 'fluxby_onboarding',
  acknowledged: 'fluxby_onboarding_complete',
  completed: 'fluxby-onboarding-completed',
  restart: 'fluxby-onboarding-restart',
} as const;

export const OnboardingContext = createContext<OnboardingContextType | null>(
  null
);
