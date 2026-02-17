/**
 * Achievement System Implementation
 *
 * Complete achievement system with criteria evaluation and unlocking.
 */

// ============================================================================
// TYPES
// ============================================================================

export type AchievementCategory =
  | 'beginner'
  | 'progression'
  | 'mastery'
  | 'social'
  | 'collection'
  | 'special'
  | 'seasonal';

export type AchievementRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  criteria: AchievementCriteria;
  rewards: Reward[];
  hidden?: boolean;
  progressive?: boolean;
  stages?: AchievementStage[];
}

export interface AchievementStage {
  stage: number;
  target: number;
  name: string;
  rewards: Reward[];
}

export interface Reward {
  type: 'xp' | 'badge' | 'title' | 'currency' | 'cosmetic';
  id?: string;
  amount?: number;
}

export type AchievementCriteria =
  | CountCriteria
  | StreakCriteria
  | TimeCriteria
  | ComboCriteria;

export interface CountCriteria {
  type: 'count';
  action: string;
  target: number;
  timeframe?: 'day' | 'week' | 'month' | 'all_time';
}

export interface StreakCriteria {
  type: 'streak';
  action: string;
  target: number;
}

export interface TimeCriteria {
  type: 'time_based';
  action: string;
  hours?: [number, number];
}

export interface ComboCriteria {
  type: 'combo';
  conditions: AchievementCriteria[];
  operator: 'AND' | 'OR';
}

export interface UserAchievementState {
  unlockedAchievements: Map<string, UnlockedAchievement>;
  progress: Map<string, AchievementProgress>;
  stats: UserStats;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: Date;
  stage?: number;
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  currentStage: number;
}

export interface UserStats {
  actionCounts: Record<string, number>;
  streaks: Record<string, { current: number; lastDate: Date }>;
  lastActions: Record<string, Date>;
}

export interface UnlockResult {
  unlocked: boolean;
  achievement?: Achievement;
  stage?: number;
  rewards?: Reward[];
  newProgress?: number;
}

// ============================================================================
// ACHIEVEMENT SERVICE
// ============================================================================

export class AchievementService {
  private achievements: Map<string, Achievement>;
  private state: UserAchievementState;
  private onUnlock?: (result: UnlockResult) => void;

  constructor(
    achievements: Achievement[],
    initialState?: Partial<UserAchievementState>,
    onUnlock?: (result: UnlockResult) => void,
  ) {
    this.achievements = new Map(achievements.map((a) => [a.id, a]));
    this.state = {
      unlockedAchievements: new Map(),
      progress: new Map(),
      stats: {
        actionCounts: {},
        streaks: {},
        lastActions: {},
      },
      ...initialState,
    };
    this.onUnlock = onUnlock;
  }

  // ============================================================================
  // ACTION TRACKING
  // ============================================================================

  /**
   * Track an action and check for achievement unlocks
   */
  trackAction(action: string, count: number = 1): UnlockResult[] {
    this.updateActionCount(action, count);
    this.updateStreak(action);
    this.state.stats.lastActions[action] = new Date();

    return this.checkAllAchievements();
  }

  private updateActionCount(action: string, count: number): void {
    this.state.stats.actionCounts[action] =
      (this.state.stats.actionCounts[action] || 0) + count;
  }

  private updateStreak(action: string): void {
    const streak = this.state.stats.streaks[action];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streak) {
      this.state.stats.streaks[action] = { current: 1, lastDate: today };
      return;
    }

    const lastDate = new Date(streak.lastDate);
    lastDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === 0) {
      // Same day, no change
      return;
    } else if (daysDiff === 1) {
      // Consecutive day
      streak.current++;
      streak.lastDate = today;
    } else {
      // Streak broken
      streak.current = 1;
      streak.lastDate = today;
    }
  }

  // ============================================================================
  // ACHIEVEMENT CHECKING
  // ============================================================================

  private checkAllAchievements(): UnlockResult[] {
    const results: UnlockResult[] = [];

    for (const [id, achievement] of this.achievements) {
      // Skip if fully unlocked (non-progressive) or max stage reached
      if (this.isFullyUnlocked(id, achievement)) continue;

      const result = this.checkAchievement(achievement);
      if (result.unlocked) {
        this.handleUnlock(result);
        results.push(result);
      }
    }

    return results;
  }

  private checkAchievement(achievement: Achievement): UnlockResult {
    const progress = this.evaluateCriteria(achievement.criteria);
    const currentProgress = this.state.progress.get(achievement.id);

    // Update progress
    const progressRecord: AchievementProgress = {
      achievementId: achievement.id,
      currentValue: progress,
      currentStage: currentProgress?.currentStage || 0,
    };

    if (achievement.progressive && achievement.stages) {
      // Check progressive stages
      for (const stage of achievement.stages) {
        if (
          stage.stage > progressRecord.currentStage &&
          progress >= stage.target
        ) {
          progressRecord.currentStage = stage.stage;
          this.state.progress.set(achievement.id, progressRecord);

          return {
            unlocked: true,
            achievement,
            stage: stage.stage,
            rewards: stage.rewards,
            newProgress: progress,
          };
        }
      }
    } else {
      // Non-progressive achievement
      const target = this.getTarget(achievement);
      if (
        progress >= target &&
        !this.state.unlockedAchievements.has(achievement.id)
      ) {
        this.state.progress.set(achievement.id, progressRecord);

        return {
          unlocked: true,
          achievement,
          rewards: achievement.rewards,
          newProgress: progress,
        };
      }
    }

    this.state.progress.set(achievement.id, progressRecord);

    return { unlocked: false, newProgress: progress };
  }

  private evaluateCriteria(criteria: AchievementCriteria): number {
    switch (criteria.type) {
      case 'count':
        return this.evaluateCountCriteria(criteria);
      case 'streak':
        return this.evaluateStreakCriteria(criteria);
      case 'time_based':
        return this.evaluateTimeCriteria(criteria);
      case 'combo':
        return this.evaluateComboCriteria(criteria);
      default:
        return 0;
    }
  }

  private evaluateCountCriteria(criteria: CountCriteria): number {
    return this.state.stats.actionCounts[criteria.action] || 0;
  }

  private evaluateStreakCriteria(criteria: StreakCriteria): number {
    return this.state.stats.streaks[criteria.action]?.current || 0;
  }

  private evaluateTimeCriteria(criteria: TimeCriteria): number {
    const lastAction = this.state.stats.lastActions[criteria.action];
    if (!lastAction) return 0;

    if (criteria.hours) {
      const hour = new Date(lastAction).getHours();
      const [start, end] = criteria.hours;

      if (start <= end) {
        return hour >= start && hour < end ? 1 : 0;
      } else {
        // Wraps around midnight (e.g., 22-4)
        return hour >= start || hour < end ? 1 : 0;
      }
    }

    return 1;
  }

  private evaluateComboCriteria(criteria: ComboCriteria): number {
    const results = criteria.conditions.map((c) => this.evaluateCriteria(c));

    if (criteria.operator === 'AND') {
      // Return minimum (all must be met)
      return Math.min(...results);
    } else {
      // Return maximum (any can be met)
      return Math.max(...results);
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private getTarget(achievement: Achievement): number {
    if (achievement.criteria.type === 'count') {
      return achievement.criteria.target;
    }
    if (achievement.criteria.type === 'streak') {
      return achievement.criteria.target;
    }
    return 1; // Time-based or combo
  }

  private isFullyUnlocked(id: string, achievement: Achievement): boolean {
    const unlocked = this.state.unlockedAchievements.get(id);
    if (!unlocked) return false;

    if (achievement.progressive && achievement.stages) {
      return unlocked.stage === achievement.stages.length;
    }

    return true;
  }

  private handleUnlock(result: UnlockResult): void {
    if (!result.achievement) return;

    this.state.unlockedAchievements.set(result.achievement.id, {
      achievementId: result.achievement.id,
      unlockedAt: new Date(),
      stage: result.stage,
    });

    this.onUnlock?.(result);
  }

  // ============================================================================
  // PUBLIC GETTERS
  // ============================================================================

  getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  getProgress(id: string): AchievementProgress | undefined {
    return this.state.progress.get(id);
  }

  getUnlocked(): UnlockedAchievement[] {
    return Array.from(this.state.unlockedAchievements.values());
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return Array.from(this.achievements.values()).filter(
      (a) => a.category === category,
    );
  }

  getStats(): UserStats {
    return { ...this.state.stats };
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

const achievements: Achievement[] = [
  {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '👣',
    category: 'beginner',
    rarity: 'common',
    criteria: { type: 'count', action: 'complete_task', target: 1 },
    rewards: [{ type: 'xp', amount: 50 }],
  },
  {
    id: 'task_master',
    name: 'Task Master',
    description: 'Complete many tasks',
    icon: '✅',
    category: 'progression',
    rarity: 'rare',
    progressive: true,
    criteria: { type: 'count', action: 'complete_task', target: 1000 },
    rewards: [],
    stages: [
      {
        stage: 1,
        target: 10,
        name: 'Beginner',
        rewards: [{ type: 'xp', amount: 100 }],
      },
      {
        stage: 2,
        target: 50,
        name: 'Intermediate',
        rewards: [{ type: 'xp', amount: 250 }],
      },
      {
        stage: 3,
        target: 100,
        name: 'Advanced',
        rewards: [{ type: 'badge', id: 'task_master' }],
      },
    ],
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    category: 'mastery',
    rarity: 'uncommon',
    criteria: { type: 'streak', action: 'daily_login', target: 7 },
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'badge', id: 'streak_7' },
    ],
  },
];

const service = new AchievementService(achievements, undefined, (result) => {
  console.log('Achievement unlocked!', result.achievement?.name);
});

// Track actions
service.trackAction('complete_task');
service.trackAction('daily_login');
