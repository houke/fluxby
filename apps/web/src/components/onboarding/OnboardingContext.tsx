// Onboarding Context Provider
// Provides global state management for the onboarding flow

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { onboardingChapters } from './onboarding-data';
import { OnboardingContext } from './onboarding-context';
import { api } from '@/lib/api';
import { useProfile } from '@/contexts/ProfileContext';
import type { OnboardingContextType, OnboardingState } from './types';

const STORAGE_KEY = 'fluxby_onboarding';

// Default state
const defaultState: OnboardingState = {
  isActive: false,
  hasCompletedOnboarding: false,
  currentChapterIndex: 0,
  currentStepIndex: 0,
  userName: '',
  language: null,
};

// Check if onboarding restart was requested
const checkRestartFlag = (): boolean => {
  const restartFlag = localStorage.getItem('fluxby-onboarding-restart');
  if (restartFlag === 'true') {
    // Clear the flag immediately
    localStorage.removeItem('fluxby-onboarding-restart');
    // Also remove the switching overlay flag so the app can hide the overlay when onboarding is ready
    localStorage.removeItem('fluxby-switching-overlay');
    return true;
  }
  return false;
};

// Load state from localStorage
// On page refresh, set isActive to false - user must manually restart
// Exception: if restart flag is set, start onboarding
const loadState = (): OnboardingState => {
  const shouldRestart = checkRestartFlag();

  if (shouldRestart) {
    // Start fresh onboarding
    return { ...defaultState, isActive: true };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Always set isActive to false on load - closing/refreshing the page closes onboarding
      return { ...defaultState, ...parsed, isActive: false };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultState;
};

// Save state to localStorage
const saveState = (state: OnboardingState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
};

// Provider component
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { switchProfile, refreshProfiles, profiles } = useProfile();
  const [state, setState] = useState<OnboardingState>(loadState);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  // Sync with user data from API
  const { data: userData } = useQuery<{ id: number; name: string } | null>({
    queryKey: ['user'],
    queryFn: () => api.getUser() as Promise<{ id: number; name: string }>,
  });

  // Update user name mutation
  const updateUserMutation = useMutation({
    mutationFn: (name: string) => api.updateUser({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check if onboarding should start (new user)
  useEffect(() => {
    if (userData && !state.hasCompletedOnboarding && !state.isActive) {
      // Check if user has any transactions (indicator of existing data)
      // For now, if no name is set, assume new user
      if (!userData.name && !state.userName) {
        setState((prev) => ({
          ...prev,
          isActive: true,
          currentChapterIndex: 0,
          currentStepIndex: 0,
        }));
        // Defer navigation to avoid "Cannot update component while rendering" warning
        // This ensures React completes its current render cycle first
        setTimeout(() => navigate('/'), 0);
      }
    }
  }, [
    userData,
    state.hasCompletedOnboarding,
    state.isActive,
    state.userName,
    navigate,
  ]);

  // Get current chapter and step
  const currentChapter = onboardingChapters[state.currentChapterIndex] || null;
  const currentStep = currentChapter?.steps[state.currentStepIndex] || null;

  // Calculate position info
  const totalChapters = onboardingChapters.length;
  const totalSteps = onboardingChapters.reduce(
    (sum, ch) => sum + ch.steps.length,
    0
  );
  const isFirstStep =
    state.currentChapterIndex === 0 && state.currentStepIndex === 0;
  const isLastStep =
    state.currentChapterIndex === totalChapters - 1 &&
    state.currentStepIndex ===
      onboardingChapters[totalChapters - 1].steps.length - 1;

  // Check if user completed initial setup (has name or language set)
  const hasCompletedInitialSetup =
    state.hasCompletedOnboarding ||
    state.currentChapterIndex > 0 ||
    !!state.userName ||
    !!state.language;

  // Start onboarding (resume from saved position if available)
  // If startAtCurrentPage is true, find the chapter matching the current route and start there
  const startOnboarding = useCallback(
    (restart = false, startAtCurrentPage = false) => {
      // Find chapter matching current route
      let startChapterIndex = 0;

      // If starting at current page, but user never completed initial setup, start from beginning
      if (startAtCurrentPage && !hasCompletedInitialSetup) {
        startAtCurrentPage = false;
      }

      if (startAtCurrentPage) {
        const currentPath = window.location.pathname;
        // Find all chapters matching this route (excluding welcome at index 0 and completion at last index)
        const lastIndex = onboardingChapters.length - 1;
        const matchingChapters = onboardingChapters
          .map((chapter, index) => ({ chapter, index }))
          .filter(
            ({ chapter, index }) =>
              chapter.route === currentPath && index > 0 && index < lastIndex
          );

        // If we found matching chapters, use the first content chapter (after navigation chapters)
        // For dashboard route, this will find the 'dashboard' chapter, not 'welcome' or 'navigation'
        if (matchingChapters.length > 0) {
          // Prefer chapter with id matching the menuItem (content chapters)
          const contentChapter = matchingChapters.find(
            ({ chapter }) =>
              chapter.id === chapter.menuItem &&
              !['welcome', 'navigation', 'completion'].includes(chapter.id)
          );
          startChapterIndex = contentChapter
            ? contentChapter.index
            : matchingChapters[matchingChapters.length - 1].index;
        }
      }

      setState((prev) => {
        // If starting at current page, always start fresh at that chapter
        if (startAtCurrentPage && startChapterIndex > 0) {
          return {
            ...prev,
            isActive: true,
            currentChapterIndex: startChapterIndex,
            currentStepIndex: 0,
          };
        }

        // If restarting, start from beginning
        if (restart) {
          return {
            ...prev,
            isActive: true,
            currentChapterIndex: 0,
            currentStepIndex: 0,
          };
        }

        // Otherwise resume from saved position only if it matches the current route
        const savedChapter = onboardingChapters[prev.currentChapterIndex];
        const currentPath = window.location.pathname;
        if (savedChapter && savedChapter.route === currentPath) {
          // Resume at saved position since we're on the same page
          return {
            ...prev,
            isActive: true,
          };
        }

        // If on different page, find matching chapter and start there
        const matchingChapter = onboardingChapters.findIndex(
          (chapter) => chapter.route === currentPath
        );
        if (matchingChapter > 0) {
          return {
            ...prev,
            isActive: true,
            currentChapterIndex: matchingChapter,
            currentStepIndex: 0,
          };
        }

        // Fallback: start from beginning
        return {
          ...prev,
          isActive: true,
          currentChapterIndex: 0,
          currentStepIndex: 0,
        };
      });
      // Navigate to the appropriate route (for restart or resume cases)
      if (!startAtCurrentPage) {
        const targetChapter = restart
          ? onboardingChapters[0]
          : onboardingChapters[state.currentChapterIndex];
        navigate(targetChapter?.route || '/');
      }
    },
    [navigate, state.currentChapterIndex, hasCompletedInitialSetup]
  );

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    // Save user name to API if set
    if (state.userName) {
      updateUserMutation.mutate(state.userName);
    }

    // Check if we need to create demo profile and seed data
    // This happens when completing the initial setup (welcome chapter)
    const isInitialSetup = state.currentChapterIndex === 0;

    if (isInitialSetup && !isCreatingDemo) {
      setIsCreatingDemo(true);
      try {
        // Check if demo profile exists
        const existingDemo = profiles.find((p) => p.name === 'Demo');

        if (!existingDemo) {
          // Create demo profile
          const demoProfile = await api.createDemoProfile();

          // Seed demo data
          await api.seedDemoData(demoProfile.id);

          // Refresh profiles to include the new demo profile
          await refreshProfiles();

          // Switch to demo profile
          switchProfile(demoProfile.id);

          // Invalidate all queries to get fresh data
          await queryClient.invalidateQueries();

          // Small delay to ensure queries start fetching before we close the modal
          // This prevents the blank screen flash
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          // Demo profile exists, just switch to it
          switchProfile(existingDemo.id);
          await queryClient.invalidateQueries();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Failed to create/seed demo account:', error);
      } finally {
        setIsCreatingDemo(false);
      }
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      hasCompletedOnboarding: true,
    }));
  }, [
    state.userName,
    state.currentChapterIndex,
    updateUserMutation,
    isCreatingDemo,
    profiles,
    refreshProfiles,
    switchProfile,
    queryClient,
  ]);

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    // Save user name to API if set
    if (state.userName) {
      updateUserMutation.mutate(state.userName);
    }
    setState((prev) => ({
      ...prev,
      isActive: false,
      hasCompletedOnboarding: true,
    }));
  }, [state.userName, updateUserMutation]);

  // Navigate to next step
  const nextStep = useCallback(() => {
    setState((prev) => {
      const chapter = onboardingChapters[prev.currentChapterIndex];
      if (!chapter) return prev;

      // Check if there are more steps in current chapter
      if (prev.currentStepIndex < chapter.steps.length - 1) {
        const nextStepIndex = prev.currentStepIndex + 1;

        // Click action is now handled by OnboardingModal useEffect

        return {
          ...prev,
          currentStepIndex: nextStepIndex,
        };
      }

      // Move to next chapter
      if (prev.currentChapterIndex < onboardingChapters.length - 1) {
        const nextChapter = onboardingChapters[prev.currentChapterIndex + 1];

        // Navigate to new route
        navigate(nextChapter.route);

        // Click action is now handled by OnboardingModal useEffect

        return {
          ...prev,
          currentChapterIndex: prev.currentChapterIndex + 1,
          currentStepIndex: 0,
        };
      }

      // End of onboarding
      return prev;
    });
  }, [navigate]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    setState((prev) => {
      // Check if there are previous steps in current chapter
      if (prev.currentStepIndex > 0) {
        return {
          ...prev,
          currentStepIndex: prev.currentStepIndex - 1,
        };
      }

      // Move to previous chapter
      if (prev.currentChapterIndex > 0) {
        const prevChapter = onboardingChapters[prev.currentChapterIndex - 1];
        // Navigate to previous route
        navigate(prevChapter.route);
        return {
          ...prev,
          currentChapterIndex: prev.currentChapterIndex - 1,
          currentStepIndex: prevChapter.steps.length - 1,
        };
      }

      return prev;
    });
  }, [navigate]);

  // Go to specific chapter
  const goToChapter = useCallback(
    (chapterIndex: number) => {
      if (chapterIndex >= 0 && chapterIndex < onboardingChapters.length) {
        const chapter = onboardingChapters[chapterIndex];
        navigate(chapter.route);

        // Click action is now handled by OnboardingModal useEffect

        setState((prev) => ({
          ...prev,
          currentChapterIndex: chapterIndex,
          currentStepIndex: 0,
        }));
      }
    },
    [navigate]
  );

  // Set language
  const setLanguage = useCallback((language: 'nl' | 'en') => {
    setState((prev) => ({
      ...prev,
      language,
    }));
  }, []);

  // Set user name
  const setUserName = useCallback((name: string) => {
    setState((prev) => ({
      ...prev,
      userName: name,
    }));
  }, []);

  // Persist user name changes to API (debounced) so the dashboard greeting updates live
  useEffect(() => {
    // Debounce saves to avoid excessive API calls while typing
    const timeout = setTimeout(() => {
      // Call mutation even for empty string to keep server in sync
      updateUserMutation.mutate(state.userName);
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userName]);

  // Update spotlight (placeholder - actual implementation is in SpotlightOverlay)
  const updateSpotlight = useCallback(() => {
    // Trigger re-render to update spotlight position
  }, []);

  const value: OnboardingContextType = {
    state,
    isCreatingDemo,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    nextStep,
    previousStep,
    goToChapter,
    setLanguage,
    setUserName,
    currentChapter,
    currentStep,
    isFirstStep,
    isLastStep,
    totalSteps,
    totalChapters,
    spotlightRect: null, // Managed by SpotlightOverlay
    updateSpotlight,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
