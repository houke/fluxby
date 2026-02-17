/**
 * Streak System Implementation
 *
 * Track user streaks with freeze cards and recovery mechanics.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StreakConfig {
  id: string;
  name: string;
  description: string;
  actionRequired: string;
  resetHour: number; // Hour of day when streak resets (0-23)
  gracePeriodHours: number; // Hours after reset to still count
  maxFreezeCards: number;
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  days: number;
  name: string;
  rewards: Array<{
    type: 'xp' | 'badge' | 'freeze_card' | 'multiplier';
    value: number | string;
  }>;
}

export interface UserStreak {
  configId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: Date | null;
  freezeCardsAvailable: number;
  freezeCardsUsedDates: Date[];
  totalCompletions: number;
  milestonesClaimed: number[];
}

export interface StreakStatus {
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  willExpireAt: Date | null;
  hoursRemaining: number | null;
  isInGracePeriod: boolean;
  canUseFreezeCard: boolean;
  nextMilestone: StreakMilestone | null;
  daysUntilNextMilestone: number;
}

export interface StreakActionResult {
  success: boolean;
  newStreak: number;
  streakExtended: boolean;
  milestoneReached: StreakMilestone | null;
  message: string;
}

// ============================================================================
// STREAK SERVICE
// ============================================================================

export class StreakService {
  private config: StreakConfig;
  private userStreak: UserStreak;
  private onMilestone?: (milestone: StreakMilestone, streak: number) => void;

  constructor(
    config: StreakConfig,
    initialStreak?: Partial<UserStreak>,
    onMilestone?: (milestone: StreakMilestone, streak: number) => void,
  ) {
    this.config = config;
    this.userStreak = {
      configId: config.id,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      freezeCardsAvailable: 0,
      freezeCardsUsedDates: [],
      totalCompletions: 0,
      milestonesClaimed: [],
      ...initialStreak,
    };
    this.onMilestone = onMilestone;
  }

  // ============================================================================
  // CORE STREAK LOGIC
  // ============================================================================

  /**
   * Record a streak action
   */
  recordAction(): StreakActionResult {
    const now = new Date();
    const status = this.getStatus();

    // Already completed today
    if (this.isCompletedToday(now)) {
      return {
        success: true,
        newStreak: this.userStreak.currentStreak,
        streakExtended: false,
        milestoneReached: null,
        message: 'Already completed today!',
      };
    }

    // Check if streak should be reset
    if (!status.isActive && !status.isInGracePeriod) {
      // Try to use freeze card automatically
      if (this.shouldAutoFreeze()) {
        this.useFreezeCard();
      } else {
        this.resetStreak();
      }
    }

    // Extend streak
    this.userStreak.currentStreak++;
    this.userStreak.lastCompletedDate = now;
    this.userStreak.totalCompletions++;

    // Update longest streak
    if (this.userStreak.currentStreak > this.userStreak.longestStreak) {
      this.userStreak.longestStreak = this.userStreak.currentStreak;
    }

    // Check milestones
    const milestone = this.checkMilestone();

    return {
      success: true,
      newStreak: this.userStreak.currentStreak,
      streakExtended: true,
      milestoneReached: milestone,
      message: milestone
        ? `🎉 ${milestone.days}-day milestone reached!`
        : `🔥 ${this.userStreak.currentStreak}-day streak!`,
    };
  }

  /**
   * Get current streak status
   */
  getStatus(): StreakStatus {
    const now = new Date();
    const resetTime = this.getResetTime(now);
    const gracePeriodEnd = new Date(
      resetTime.getTime() + this.config.gracePeriodHours * 60 * 60 * 1000,
    );

    const isActive = this.isStreakActive(now);
    const isInGracePeriod =
      !isActive && now < gracePeriodEnd && this.userStreak.currentStreak > 0;

    const willExpireAt =
      isActive || isInGracePeriod ? this.getNextResetTime(now) : null;

    const hoursRemaining = willExpireAt
      ? Math.max(0, (willExpireAt.getTime() - now.getTime()) / (1000 * 60 * 60))
      : null;

    const nextMilestone = this.getNextMilestone();
    const daysUntilNextMilestone = nextMilestone
      ? nextMilestone.days - this.userStreak.currentStreak
      : 0;

    return {
      isActive,
      currentStreak: this.userStreak.currentStreak,
      longestStreak: this.userStreak.longestStreak,
      willExpireAt,
      hoursRemaining,
      isInGracePeriod,
      canUseFreezeCard: this.userStreak.freezeCardsAvailable > 0,
      nextMilestone,
      daysUntilNextMilestone,
    };
  }

  // ============================================================================
  // FREEZE CARDS
  // ============================================================================

  /**
   * Manually use a freeze card
   */
  useFreezeCard(): boolean {
    if (this.userStreak.freezeCardsAvailable <= 0) {
      return false;
    }

    this.userStreak.freezeCardsAvailable--;
    this.userStreak.freezeCardsUsedDates.push(new Date());

    // Pretend we completed yesterday to keep streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    this.userStreak.lastCompletedDate = yesterday;

    return true;
  }

  /**
   * Add freeze cards to user's inventory
   */
  addFreezeCards(count: number): void {
    this.userStreak.freezeCardsAvailable = Math.min(
      this.userStreak.freezeCardsAvailable + count,
      this.config.maxFreezeCards,
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private isCompletedToday(now: Date): boolean {
    if (!this.userStreak.lastCompletedDate) return false;

    const lastCompleted = new Date(this.userStreak.lastCompletedDate);
    const resetTime = this.getResetTime(now);

    // Completed after today's reset
    return lastCompleted >= resetTime;
  }

  private isStreakActive(now: Date): boolean {
    if (!this.userStreak.lastCompletedDate) return false;

    const lastCompleted = new Date(this.userStreak.lastCompletedDate);
    const daysSinceCompletion = this.getDaysBetween(lastCompleted, now);

    return daysSinceCompletion <= 1;
  }

  private getResetTime(date: Date): Date {
    const reset = new Date(date);
    reset.setHours(this.config.resetHour, 0, 0, 0);

    // If we're before reset hour, use yesterday's reset time
    if (date.getHours() < this.config.resetHour) {
      reset.setDate(reset.getDate() - 1);
    }

    return reset;
  }

  private getNextResetTime(date: Date): Date {
    const reset = this.getResetTime(date);
    reset.setDate(reset.getDate() + 1);
    return reset;
  }

  private getDaysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round((d2.getTime() - d1.getTime()) / oneDay);
  }

  private resetStreak(): void {
    this.userStreak.currentStreak = 0;
  }

  private shouldAutoFreeze(): boolean {
    // Could add logic for auto-freeze on weekends, etc.
    return false;
  }

  private checkMilestone(): StreakMilestone | null {
    const currentStreak = this.userStreak.currentStreak;

    for (const milestone of this.config.milestones) {
      if (
        currentStreak === milestone.days &&
        !this.userStreak.milestonesClaimed.includes(milestone.days)
      ) {
        this.userStreak.milestonesClaimed.push(milestone.days);
        this.onMilestone?.(milestone, currentStreak);
        return milestone;
      }
    }

    return null;
  }

  private getNextMilestone(): StreakMilestone | null {
    const currentStreak = this.userStreak.currentStreak;

    return (
      this.config.milestones
        .filter((m) => m.days > currentStreak)
        .sort((a, b) => a.days - b.days)[0] || null
    );
  }

  // ============================================================================
  // STATE ACCESS
  // ============================================================================

  getUserStreak(): UserStreak {
    return { ...this.userStreak };
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

const streakConfig: StreakConfig = {
  id: 'daily_login',
  name: 'Daily Login Streak',
  description: 'Log in every day to maintain your streak',
  actionRequired: 'login',
  resetHour: 4, // 4 AM local time
  gracePeriodHours: 6, // 6 hour grace period
  maxFreezeCards: 3,
  milestones: [
    {
      days: 7,
      name: 'Week Warrior',
      rewards: [
        { type: 'xp', value: 100 },
        { type: 'freeze_card', value: 1 },
      ],
    },
    {
      days: 30,
      name: 'Monthly Master',
      rewards: [
        { type: 'xp', value: 500 },
        { type: 'badge', value: 'streak_30' },
      ],
    },
    {
      days: 100,
      name: 'Centurion',
      rewards: [
        { type: 'xp', value: 2000 },
        { type: 'multiplier', value: 1.1 },
      ],
    },
    {
      days: 365,
      name: 'Year of Dedication',
      rewards: [
        { type: 'xp', value: 10000 },
        { type: 'badge', value: 'streak_365' },
      ],
    },
  ],
};

const streakService = new StreakService(
  streakConfig,
  { currentStreak: 5 },
  (milestone, streak) => {
    console.log(`🎉 Milestone reached: ${milestone.name} at ${streak} days!`);
  },
);

// Check status
const status = streakService.getStatus();
console.log(`Current streak: ${status.currentStreak}`);
console.log(`Hours until expiry: ${status.hoursRemaining?.toFixed(1)}`);

// Record daily action
const result = streakService.recordAction();
console.log(result.message);
