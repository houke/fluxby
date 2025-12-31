// Onboarding Context Provider
// Provides global state management for the onboarding flow

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { onboardingChapters } from './onboarding-data';
import { OnboardingContext } from './onboarding-context';
import { api } from '@/lib/api';
import { useProfile } from '@/contexts/ProfileContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useEncryption } from '@/contexts/EncryptionContext';
import { DEMO_PROFILE_ID } from '@fluxby/shared';
import { isDatabaseReady as isGlobalDbReady } from '@/lib/db-singleton';
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
  const { isReady: isDatabaseReady } = useDatabase();
  const { switchProfile, profiles, activeProfileId } = useProfile();
  const { isEncryptionEnabled } = useEncryption();
  const [state, setState] = useState<OnboardingState>(loadState);
  // isCreatingDemo is kept for the context value but we don't set it anymore
  // since demo creation now happens in SecuritySetup
  const [isCreatingDemo] = useState(false);

  // Sync with user data from API
  // Important: we need to distinguish between "loading" and "no user"
  // Only query when database is ready - use BOTH React state AND global singleton check
  const isDbTrulyReady = isDatabaseReady && isGlobalDbReady();

  const {
    data: userData,
    isLoading: isLoadingUser,
    isFetched: isUserFetched,
  } = useQuery<{ id: string; name: string } | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const result = await api.getUser();
      return result as { id: string; name: string } | null;
    },
    enabled: isDbTrulyReady,
  });

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check if onboarding should start (new user - no user record exists)
  useEffect(() => {
    // Wait until user query has finished loading
    if (isLoadingUser || !isUserFetched) return;

    // If already active, don't re-trigger
    if (state.isActive) return;

    // If user has completed onboarding before, don't restart
    if (state.hasCompletedOnboarding) return;

    // If we've already progressed past the first step, don't reset to start
    // This prevents restarting onboarding after query invalidation
    if (state.currentChapterIndex > 0 || state.currentStepIndex > 0) return;

    // CRITICAL: Start onboarding if NO user exists in database
    // This is mandatory - app cannot function without a user and profile
    if (userData === null) {
      setState((prev) => ({
        ...prev,
        isActive: true,
        currentChapterIndex: 0,
        currentStepIndex: 0,
      }));
      // Defer navigation to avoid "Cannot update component while rendering" warning
      // This ensures React completes its current render cycle first
      setTimeout(() => navigate('/dashboard/'), 0);
    }
  }, [
    userData,
    isLoadingUser,
    isUserFetched,
    state.isActive,
    state.hasCompletedOnboarding,
    state.currentChapterIndex,
    state.currentStepIndex,
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
  // NOTE: Demo profile creation is handled by SecuritySetup, not here
  const startOnboarding = useCallback(
    async (restart = false, startAtCurrentPage = false) => {
      // Capture the current route before any async work (profile switching can
      // trigger navigation). This ensures the mascot click starts onboarding
      // at the active tab.
      const normalizePath = (p: string) => {
        const trimmed = p.replace(/\/+$/, '');
        return trimmed === '' ? '/' : trimmed;
      };
      const requestedPath = normalizePath(window.location.pathname);

      // If demo profile exists but not active, switch to it
      try {
        const demoProfile = profiles.find((p) => p.id === DEMO_PROFILE_ID);
        if (demoProfile && activeProfileId !== DEMO_PROFILE_ID) {
          switchProfile(DEMO_PROFILE_ID);
          await queryClient.invalidateQueries();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error('Error switching to demo profile:', error);
      }

      // Find chapter matching current route
      let startChapterIndex = 0;

      // If starting at current page, but user never completed initial setup, start from beginning
      if (startAtCurrentPage && !hasCompletedInitialSetup) {
        startAtCurrentPage = false;
      }

      if (startAtCurrentPage) {
        const currentPath = requestedPath;
        // Find all chapters matching this route (excluding welcome at index 0 and completion at last index)
        const lastIndex = onboardingChapters.length - 1;
        const matchingChapters = onboardingChapters
          .map((chapter, index) => ({ chapter, index }))
          .filter(
            ({ chapter, index }) =>
              normalizePath(chapter.route) === currentPath &&
              index > 0 &&
              index < lastIndex
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
        navigate(targetChapter?.route || '/dashboard/');
      }
    },
    [
      navigate,
      state.currentChapterIndex,
      hasCompletedInitialSetup,
      profiles,
      switchProfile,
      activeProfileId,
      queryClient,
    ]
  );

  // Complete onboarding
  // NOTE: Demo profile and data seeding is handled by SecuritySetup
  // This function just marks onboarding as complete
  const completeOnboarding = useCallback(async () => {
    // If demo profile exists but not active, switch to it
    const demoProfile = profiles.find((p) => p.id === DEMO_PROFILE_ID);
    if (demoProfile && activeProfileId !== DEMO_PROFILE_ID) {
      switchProfile(DEMO_PROFILE_ID);
      await queryClient.invalidateQueries();
    }

    setState((prev) => ({
      ...prev,
      isActive: false,
      hasCompletedOnboarding: true,
    }));
  }, [profiles, activeProfileId, switchProfile, queryClient]);

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    // Create user if name is set (using async/await instead of mutation)
    if (state.userName) {
      try {
        await api.updateUser({ name: state.userName });
        queryClient.invalidateQueries({ queryKey: ['user'] });
      } catch (error) {
        console.error('Failed to create user during skip:', error);
      }
    }
    setState((prev) => ({
      ...prev,
      isActive: false,
      hasCompletedOnboarding: true,
    }));
  }, [state.userName, queryClient]);

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
    const timeout = setTimeout(async () => {
      // Only save if we have a name - don't create empty user
      if (state.userName) {
        try {
          await api.updateUser({ name: state.userName });
          queryClient.invalidateQueries({ queryKey: ['user'] });
        } catch {
          // Ignore errors during typing - user might not exist yet
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.userName]);

  // Update spotlight (placeholder - actual implementation is in SpotlightOverlay)
  const updateSpotlight = useCallback(() => {
    // Trigger re-render to update spotlight position
  }, []);

  // Trigger demo profile setup - called after SecuritySetup completes
  // Note: SecuritySetup already creates the demo profile and seeds data
  // This function just needs to start the onboarding tour
  const triggerDemoSetup = useCallback(async () => {
    try {
      // Invalidate all queries to get fresh data (user was just created)
      await queryClient.invalidateQueries();

      // Small delay to ensure data loads
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Start the onboarding tour
      setState((prev) => ({
        ...prev,
        isActive: true,
        currentChapterIndex: 0,
        currentStepIndex: 0,
      }));
    } catch {
      console.error('Failed to start onboarding');
    }
  }, [queryClient]);

  // Separate concerns:
  // 1. needsSecuritySetup: No encryption set up yet (show SecuritySetup component)
  // 2. needsOnboarding: User/demo profile not ready (show onboarding tour on top of dashboard)
  const hasDemoProfile = profiles.some((p) => p.id === DEMO_PROFILE_ID);

  // Security setup needed when encryption is not enabled
  const needsSecuritySetup =
    isDbTrulyReady && isUserFetched && !isEncryptionEnabled;

  // Onboarding tour needed when user or demo profile doesn't exist
  // (but encryption is already set up)
  const needsOnboarding =
    isDbTrulyReady &&
    isUserFetched &&
    isEncryptionEnabled &&
    (userData === null || !hasDemoProfile);

  const value: OnboardingContextType = {
    state,
    isCreatingDemo,
    needsSecuritySetup,
    needsOnboarding,
    isLoadingUser: isLoadingUser || !isDbTrulyReady,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    nextStep,
    previousStep,
    goToChapter,
    setLanguage,
    setUserName,
    triggerDemoSetup,
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
