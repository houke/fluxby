// Onboarding context definition - separate file for Fast Refresh compatibility
import { createContext } from 'react';
import type { OnboardingContextType } from './types';

export const OnboardingContext = createContext<OnboardingContextType | null>(
  null
);
