/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { onboardingChapters } from '@/components/onboarding/onboarding-data';

describe('Onboarding Data', () => {
  describe('Chapter Structure', () => {
    it('should have welcome as first chapter', () => {
      expect(onboardingChapters[0].id).toBe('welcome');
    });

    it('should have completion as last chapter', () => {
      const lastChapter = onboardingChapters[onboardingChapters.length - 1];
      expect(lastChapter.id).toBe('completion');
    });

    it('should have dashboard chapter after welcome and navigation', () => {
      const dashboardChapter = onboardingChapters.find(
        (ch) => ch.id === 'dashboard'
      );
      expect(dashboardChapter).toBeDefined();
      expect(dashboardChapter?.route).toBe('/dashboard');
    });

    it('should have unique chapter ids', () => {
      const ids = onboardingChapters.map((ch) => ch.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required chapter properties', () => {
      onboardingChapters.forEach((chapter) => {
        expect(chapter.id).toBeDefined();
        expect(chapter.menuItem).toBeDefined();
        expect(chapter.route).toBeDefined();
        expect(chapter.icon).toBeDefined();
        expect(chapter.title).toBeDefined();
        expect(chapter.title.nl).toBeDefined();
        expect(chapter.title.en).toBeDefined();
        expect(chapter.steps).toBeDefined();
        expect(Array.isArray(chapter.steps)).toBe(true);
        expect(chapter.steps.length).toBeGreaterThan(0);
      });
    });

    it('should have valid routes for all chapters', () => {
      const validRoutes = [
        '/dashboard',
        '/transactions',
        '/budgets',
        '/import',
        '/categories',
        '/analytics',
        '/subscriptions',
        '/addressbook',
        '/settings',
        '/help',
      ];
      onboardingChapters.forEach((chapter) => {
        expect(validRoutes).toContain(chapter.route);
      });
    });
  });

  describe('Step Structure', () => {
    it('should have all required step properties', () => {
      onboardingChapters.forEach((chapter) => {
        chapter.steps.forEach((step) => {
          expect(step.id).toBeDefined();
          expect(step.title).toBeDefined();
          expect(step.title.nl).toBeDefined();
          expect(step.title.en).toBeDefined();
          expect(step.content).toBeDefined();
          expect(step.content.nl).toBeDefined();
          expect(step.content.en).toBeDefined();
          expect(step.placement).toBeDefined();
        });
      });
    });

    it('should have unique step ids within chapters', () => {
      onboardingChapters.forEach((chapter) => {
        const stepIds = chapter.steps.map((step) => step.id);
        const uniqueStepIds = new Set(stepIds);
        expect(uniqueStepIds.size).toBe(stepIds.length);
      });
    });

    it('should have valid placement values', () => {
      const validPlacements = [
        'top',
        'bottom',
        'left',
        'right',
        'center',
        'top-start',
        'top-end',
        'bottom-start',
        'bottom-end',
      ];
      onboardingChapters.forEach((chapter) => {
        chapter.steps.forEach((step) => {
          expect(validPlacements).toContain(step.placement);
        });
      });
    });

    it('should have selector for non-center placements', () => {
      onboardingChapters.forEach((chapter) => {
        chapter.steps.forEach((step) => {
          if (step.placement !== 'center') {
            // Steps that are not centered should have a selector
            // Some exceptions exist for overview/intro steps
            const isOverviewStep =
              step.id.includes('overview') || step.id.includes('intro');
            if (!isOverviewStep) {
              expect(step.selector).toBeDefined();
            }
          }
        });
      });
    });
  });

  describe('Welcome Chapter', () => {
    const welcomeChapter = onboardingChapters[0];

    it('should have welcome intro step (language and user-name are now in SecuritySetup)', () => {
      const introStep = welcomeChapter.steps.find(
        (s) => s.id === 'welcome-intro'
      );
      expect(introStep).toBeDefined();
      // language-select and user-name steps have been moved to SecuritySetup component
      // and are no longer part of the onboarding flow
      expect(welcomeChapter.steps.length).toBe(1);
    });
  });

  describe('Help Chapter', () => {
    it('should have help chapter', () => {
      const helpChapter = onboardingChapters.find((ch) => ch.id === 'help');
      expect(helpChapter).toBeDefined();
      expect(helpChapter?.route).toBe('/help');
    });
  });

  describe('Settings Chapter', () => {
    const settingsChapter = onboardingChapters.find(
      (ch) => ch.id === 'settings'
    );

    it('should have settings chapter', () => {
      expect(settingsChapter).toBeDefined();
      expect(settingsChapter?.route).toBe('/settings');
    });

    it('should have settings tabs step', () => {
      const tabsStep = settingsChapter?.steps.find(
        (s) => s.id === 'settings-tabs'
      );
      expect(tabsStep).toBeDefined();
      expect(tabsStep?.selector).toBe('[data-onboarding="settings-tabs"]');
    });
  });
});

describe('Onboarding State Logic', () => {
  describe('hasCompletedInitialSetup check', () => {
    it('should detect completed initial setup when userName is set', () => {
      const state = {
        hasCompletedOnboarding: false,
        currentChapterIndex: 0,
        userName: 'Test User',
        language: null,
      };
      const hasCompletedInitialSetup =
        state.hasCompletedOnboarding ||
        state.currentChapterIndex > 0 ||
        !!state.userName ||
        !!state.language;
      expect(hasCompletedInitialSetup).toBe(true);
    });

    it('should detect completed initial setup when language is set', () => {
      const state = {
        hasCompletedOnboarding: false,
        currentChapterIndex: 0,
        userName: '',
        language: 'nl',
      };
      const hasCompletedInitialSetup =
        state.hasCompletedOnboarding ||
        state.currentChapterIndex > 0 ||
        !!state.userName ||
        !!state.language;
      expect(hasCompletedInitialSetup).toBe(true);
    });

    it('should detect completed initial setup when chapter index > 0', () => {
      const state = {
        hasCompletedOnboarding: false,
        currentChapterIndex: 2,
        userName: '',
        language: null,
      };
      const hasCompletedInitialSetup =
        state.hasCompletedOnboarding ||
        state.currentChapterIndex > 0 ||
        !!state.userName ||
        !!state.language;
      expect(hasCompletedInitialSetup).toBe(true);
    });

    it('should not detect completed initial setup when all are default', () => {
      const state = {
        hasCompletedOnboarding: false,
        currentChapterIndex: 0,
        userName: '',
        language: null,
      };
      const hasCompletedInitialSetup =
        state.hasCompletedOnboarding ||
        state.currentChapterIndex > 0 ||
        !!state.userName ||
        !!state.language;
      expect(hasCompletedInitialSetup).toBe(false);
    });
  });

  describe('Finding dashboard chapter', () => {
    it('should find dashboard chapter for route /dashboard', () => {
      const currentPath = '/dashboard';
      const lastIndex = onboardingChapters.length - 1;

      // Find all chapters matching this route (excluding welcome and completion)
      const matchingChapters = onboardingChapters
        .map((chapter, index) => ({ chapter, index }))
        .filter(
          ({ chapter, index }) =>
            chapter.route === currentPath && index > 0 && index < lastIndex
        );

      // Should find navigation and dashboard chapters
      expect(matchingChapters.length).toBeGreaterThanOrEqual(2);

      // Find the dashboard chapter specifically
      const contentChapter = matchingChapters.find(
        ({ chapter }) =>
          chapter.id === chapter.menuItem &&
          !['welcome', 'navigation', 'completion'].includes(chapter.id)
      );

      expect(contentChapter).toBeDefined();
      expect(contentChapter?.chapter.id).toBe('dashboard');
    });

    it('should find correct chapter for /settings route', () => {
      const currentPath = '/settings';
      const lastIndex = onboardingChapters.length - 1;

      const matchingChapters = onboardingChapters
        .map((chapter, index) => ({ chapter, index }))
        .filter(
          ({ chapter, index }) =>
            chapter.route === currentPath && index > 0 && index < lastIndex
        );

      expect(matchingChapters.length).toBe(1);
      expect(matchingChapters[0].chapter.id).toBe('settings');
    });

    it('should find correct chapter for /help route', () => {
      const currentPath = '/help';
      const lastIndex = onboardingChapters.length - 1;

      const matchingChapters = onboardingChapters
        .map((chapter, index) => ({ chapter, index }))
        .filter(
          ({ chapter, index }) =>
            chapter.route === currentPath && index > 0 && index < lastIndex
        );

      expect(matchingChapters.length).toBe(1);
      expect(matchingChapters[0].chapter.id).toBe('help');
    });
  });

  describe('Progress calculation', () => {
    it('should calculate total steps correctly', () => {
      const totalSteps = onboardingChapters.reduce(
        (sum, ch) => sum + ch.steps.length,
        0
      );
      // Should be a reasonable number of steps (at least 20)
      expect(totalSteps).toBeGreaterThanOrEqual(20);
    });

    it('should calculate completed steps correctly', () => {
      const currentChapterIndex = 3;
      const currentStepIndex = 1;

      let completedSteps = 0;
      for (let i = 0; i < currentChapterIndex; i++) {
        completedSteps += onboardingChapters[i].steps.length;
      }
      completedSteps += currentStepIndex;

      // Should have completed all steps from chapters 0, 1, 2 plus 1 step from chapter 3
      const expectedSteps =
        onboardingChapters[0].steps.length +
        onboardingChapters[1].steps.length +
        onboardingChapters[2].steps.length +
        1;

      expect(completedSteps).toBe(expectedSteps);
    });
  });
});

describe('OnboardingSettings Component Logic', () => {
  describe('Progress percentage calculation', () => {
    it('should return 100 when completed', () => {
      const isCompleted = true;
      const wasStarted = true;
      const completedSteps = 10;
      const totalSteps = 50;

      const progressPercentage = isCompleted
        ? 100
        : wasStarted
          ? Math.round((completedSteps / totalSteps) * 100)
          : 0;

      expect(progressPercentage).toBe(100);
    });

    it('should calculate correct percentage when in progress', () => {
      const isCompleted = false;
      const wasStarted = true;
      const completedSteps = 25;
      const totalSteps = 50;

      const progressPercentage = isCompleted
        ? 100
        : wasStarted
          ? Math.round((completedSteps / totalSteps) * 100)
          : 0;

      expect(progressPercentage).toBe(50);
    });

    it('should return 0 when not started', () => {
      const isCompleted = false;
      const wasStarted = false;
      const completedSteps = 0;
      const totalSteps = 50;

      const progressPercentage = isCompleted
        ? 100
        : wasStarted
          ? Math.round((completedSteps / totalSteps) * 100)
          : 0;

      expect(progressPercentage).toBe(0);
    });
  });

  describe('wasStarted detection', () => {
    it('should detect wasStarted when currentChapterIndex > 0', () => {
      const currentChapterIndex = 2;
      const currentStepIndex = 0;
      const isCompleted = false;

      const wasStarted =
        currentChapterIndex > 0 || currentStepIndex > 0 || isCompleted;

      expect(wasStarted).toBe(true);
    });

    it('should detect wasStarted when currentStepIndex > 0', () => {
      const currentChapterIndex = 0;
      const currentStepIndex = 1;
      const isCompleted = false;

      const wasStarted =
        currentChapterIndex > 0 || currentStepIndex > 0 || isCompleted;

      expect(wasStarted).toBe(true);
    });

    it('should not detect wasStarted when all are 0 and not completed', () => {
      const currentChapterIndex = 0;
      const currentStepIndex = 0;
      const isCompleted = false;

      const wasStarted =
        currentChapterIndex > 0 || currentStepIndex > 0 || isCompleted;

      expect(wasStarted).toBe(false);
    });
  });
});
