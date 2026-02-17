---
name: gamification-patterns
description: Implement gamification mechanics including achievements, streaks, XP, and rewards. Use when adding game elements, designing progression systems, or creating engagement features.
---

# Gamification Patterns Skill

Implement engaging gamification mechanics that drive user motivation, retention, and satisfaction.

## Quick Start

```typescript
import { useGamification } from '@/features/gamification';

// Award XP and check for achievements
const { awardXP, checkAchievements, currentLevel } = useGamification();

await awardXP(50, 'task_completed');
const newAchievements = await checkAchievements();
```

## Skill Contents

### Documentation

- `docs/psychology-frameworks.md` - Behavioral psychology principles
- `docs/xp-systems.md` - XP curves and leveling systems
- `docs/achievement-design.md` - Achievement types and triggers

### Examples

- `examples/xp-service.ts` - Complete XP and leveling system
- `examples/achievement-system.ts` - Achievement tracking service
- `examples/streak-system.ts` - Streak management with grace periods

### Templates

- `templates/gamification-spec.md` - Gamification specification template

### Reference

- `REFERENCE.md` - Quick reference cheatsheet

## Behavioral Psychology Foundations

### Core Motivators (Octalysis Framework)

| Driver               | Description              | Implementation             |
| -------------------- | ------------------------ | -------------------------- |
| **Epic Meaning**     | Part of something bigger | Missions, world impact     |
| **Accomplishment**   | Progress & mastery       | XP, levels, achievements   |
| **Empowerment**      | Creativity & choice      | Customization, builds      |
| **Ownership**        | Possessing things        | Collections, virtual goods |
| **Social Influence** | Relatedness, competition | Leaderboards, sharing      |
| **Scarcity**         | Limited availability     | Limited-time events        |
| **Unpredictability** | Curiosity, surprise      | Loot boxes, random rewards |
| **Avoidance**        | Fear of losing           | Streaks, expiring rewards  |

### Flow State

```
Challenge Level
     ↑
     │    Anxiety Zone
     │    ┌─────────────┐
     │    │             │
     │    │  FLOW ZONE  │ ← Target this
     │    │             │
     │    └─────────────┘
     │    Boredom Zone
     └──────────────────→ Skill Level
```

## XP & Leveling System

### XP Curve Formulas

```typescript
// Exponential (slower progression at high levels)
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Polynomial (balanced progression)
function xpForLevelPoly(level: number): number {
  return Math.floor(100 * Math.pow(level, 2));
}

// Linear with bonus (beginner-friendly)
function xpForLevelLinear(level: number): number {
  const base = 100;
  const increment = 50;
  return base + (level - 1) * increment;
}
```

### Level System Implementation

```typescript
interface LevelSystem {
  currentXP: number;
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: number; // 0-1 progress to next level
}

class XPService {
  private xpCurve = (level: number) =>
    Math.floor(100 * Math.pow(1.5, level - 1));

  calculateLevel(totalXP: number): LevelSystem {
    let level = 1;
    let xpRemaining = totalXP;

    while (xpRemaining >= this.xpCurve(level)) {
      xpRemaining -= this.xpCurve(level);
      level++;
    }

    const xpToNextLevel = this.xpCurve(level);

    return {
      currentXP: xpRemaining,
      totalXP,
      level,
      xpToNextLevel,
      xpProgress: xpRemaining / xpToNextLevel,
    };
  }

  async awardXP(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<{
    newXP: number;
    leveledUp: boolean;
    newLevel?: number;
  }> {
    const before = await this.getLevel(userId);
    const newTotalXP = before.totalXP + amount;
    const after = this.calculateLevel(newTotalXP);

    await this.saveXP(userId, newTotalXP);

    return {
      newXP: newTotalXP,
      leveledUp: after.level > before.level,
      newLevel: after.level > before.level ? after.level : undefined,
    };
  }
}
```

### XP Sources & Multipliers

```typescript
const XP_REWARDS = {
  // Core actions
  task_completed: 10,
  goal_achieved: 50,
  streak_milestone: 100,

  // Social actions
  helped_user: 25,
  received_thanks: 15,

  // Discovery
  first_time_feature: 20,
  easter_egg_found: 50,
} as const;

const MULTIPLIERS = {
  streak_bonus: (streak: number) => 1 + Math.min(streak * 0.1, 1), // Max 2x
  weekend_bonus: 1.5,
  event_bonus: 2,
};
```

## Achievement System

### Achievement Types

```typescript
type AchievementTrigger =
  | 'first_action' // First time doing something
  | 'cumulative' // Total count reaches N
  | 'streak' // N consecutive days
  | 'single_session' // Do X in one session
  | 'discovery' // Find something hidden
  | 'social' // Involve other users
  | 'mastery' // Perfect performance
  | 'speed' // Complete within time
  | 'collection'; // Collect all of type

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  trigger: AchievementTrigger;
  criteria: AchievementCriteria;
  reward: {
    xp: number;
    badge?: string;
    unlockable?: string;
  };
  hidden?: boolean; // Secret achievement
  unlockedAt?: Date;
  progress?: number;
}

interface AchievementCriteria {
  type: string;
  target: number;
  timeframe?: 'session' | 'day' | 'week' | 'all_time';
}
```

### Achievement Examples

```typescript
const ACHIEVEMENTS: Achievement[] = [
  // First-time
  {
    id: 'first_task',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '🎯',
    rarity: 'common',
    trigger: 'first_action',
    criteria: { type: 'task_completed', target: 1 },
    reward: { xp: 50 },
  },

  // Cumulative
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 tasks',
    icon: '💯',
    rarity: 'rare',
    trigger: 'cumulative',
    criteria: { type: 'task_completed', target: 100 },
    reward: { xp: 500, badge: 'centurion_badge' },
  },

  // Streak
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'rare',
    trigger: 'streak',
    criteria: { type: 'daily_login', target: 7 },
    reward: { xp: 200 },
  },

  // Mastery
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a challenge with no mistakes',
    icon: '✨',
    rarity: 'epic',
    trigger: 'mastery',
    criteria: { type: 'challenge_perfect', target: 1 },
    reward: { xp: 300 },
  },

  // Hidden/Discovery
  {
    id: 'easter_egg',
    name: '???',
    description: 'Find the hidden feature',
    icon: '🥚',
    rarity: 'legendary',
    trigger: 'discovery',
    criteria: { type: 'konami_code', target: 1 },
    reward: { xp: 1000 },
    hidden: true,
  },
];
```

### Achievement Service

```typescript
class AchievementService {
  async checkAchievements(
    userId: string,
    event: GameEvent,
  ): Promise<Achievement[]> {
    const userStats = await this.getUserStats(userId);
    const unlockedIds = await this.getUnlockedAchievements(userId);
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      if (this.meetsAchievementCriteria(achievement, userStats, event)) {
        await this.unlockAchievement(userId, achievement);
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  private meetsAchievementCriteria(
    achievement: Achievement,
    stats: UserStats,
    event: GameEvent,
  ): boolean {
    const { criteria } = achievement;
    const value = stats[criteria.type] || 0;

    switch (achievement.trigger) {
      case 'cumulative':
        return value >= criteria.target;
      case 'streak':
        return stats.currentStreak >= criteria.target;
      case 'first_action':
        return event.type === criteria.type && value === 1;
      default:
        return false;
    }
  }
}
```

## Streak System

```typescript
interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  graceUsedToday: boolean;
}

class StreakService {
  private readonly GRACE_HOURS = 36; // Allow one day miss

  async recordActivity(userId: string): Promise<{
    streak: number;
    isNewRecord: boolean;
    streakRestored: boolean;
  }> {
    const current = await this.getStreak(userId);
    const now = new Date();
    const hoursSinceLastActivity = this.hoursBetween(
      current.lastActivityDate,
      now,
    );

    let newStreak: number;
    let streakRestored = false;

    if (hoursSinceLastActivity < 24) {
      // Same day, no change
      newStreak = current.currentStreak;
    } else if (hoursSinceLastActivity < this.GRACE_HOURS) {
      // Within grace period, continue streak
      newStreak = current.currentStreak + 1;
      streakRestored = hoursSinceLastActivity > 24;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const isNewRecord = newStreak > current.longestStreak;

    await this.saveStreak(userId, {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, current.longestStreak),
      lastActivityDate: now,
      graceUsedToday: streakRestored,
    });

    return { streak: newStreak, isNewRecord, streakRestored };
  }

  getStreakReward(streak: number): number {
    // Bonus XP based on streak length
    const milestones = [
      { days: 7, bonus: 50 },
      { days: 30, bonus: 200 },
      { days: 100, bonus: 500 },
      { days: 365, bonus: 2000 },
    ];

    return milestones
      .filter((m) => streak >= m.days)
      .reduce((acc, m) => acc + m.bonus, 0);
  }
}
```

## Reward Schedules

### Variable Ratio (Most Engaging)

```typescript
// Random rewards are more engaging than predictable ones
function shouldGiveBonus(): boolean {
  return Math.random() < 0.3; // 30% chance
}

function getRandomReward(): Reward {
  const roll = Math.random();
  if (roll < 0.6) return { type: 'common', xp: 10 };
  if (roll < 0.9) return { type: 'rare', xp: 50 };
  return { type: 'epic', xp: 200 };
}
```

### Near Misses

```typescript
// Show "almost got it" to encourage retry
function checkForNearMiss(score: number, target: number): string | null {
  const percentage = score / target;
  if (percentage >= 0.9 && percentage < 1) {
    return 'So close! You were just 10% away from the bonus!';
  }
  return null;
}
```

## Celebration Effects

```typescript
import confetti from 'canvas-confetti';

async function celebrateAchievement(achievement: Achievement) {
  const duration = achievement.rarity === 'legendary' ? 3000 : 1500;

  // Confetti based on rarity
  const particleCount = {
    common: 50,
    rare: 100,
    epic: 200,
    legendary: 500,
  }[achievement.rarity];

  await Promise.all([
    // Visual confetti
    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6 },
    }),

    // Sound effect
    playSound(`achievement-${achievement.rarity}`),

    // Toast notification
    showToast({
      title: 'Achievement Unlocked!',
      description: achievement.name,
      icon: achievement.icon,
      duration,
    }),

    // Haptic feedback (mobile)
    navigator.vibrate?.([100, 50, 100]),
  ]);
}
```

### Animated XP Counter

```typescript
import { animate } from 'motion';

function AnimatedXP({ from, to }: { from: number; to: number }) {
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setDisplay(Math.round(value))
    });

    return () => controls.stop();
  }, [from, to]);

  return <span className="xp-counter">{display.toLocaleString()} XP</span>;
}
```

## Leaderboard Patterns

```typescript
interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar: string;
  score: number;
  rank: number;
  change: number; // Position change since last period
}

interface LeaderboardConfig {
  type: 'all_time' | 'weekly' | 'daily';
  metric: 'xp' | 'achievements' | 'streak';
  limit: number;
}

// Show user's position even if not in top N
async function getLeaderboard(
  config: LeaderboardConfig,
  currentUserId: string,
): Promise<{
  top: LeaderboardEntry[];
  userPosition: LeaderboardEntry | null;
  userInTop: boolean;
}> {
  const top = await fetchTopN(config);
  const userInTop = top.some((e) => e.userId === currentUserId);

  let userPosition = null;
  if (!userInTop) {
    userPosition = await fetchUserPosition(currentUserId, config);
  }

  return { top, userPosition, userInTop };
}
```

## Anti-Patterns to Avoid

| ❌ Dark Pattern            | ✅ Better Alternative     |
| -------------------------- | ------------------------- |
| Pay-to-win mechanics       | Cosmetic-only purchases   |
| Manipulative time pressure | Clear, fair deadlines     |
| Aggressive notifications   | User-controlled reminders |
| Punishing absence harshly  | Gentle streak recovery    |
| Artificial scarcity        | Genuine limited events    |
| Addiction exploitation     | Healthy engagement limits |

## Database Schema

```typescript
// Using Drizzle ORM
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const userProgress = pgTable('user_progress', {
  userId: text('user_id').primaryKey(),
  totalXP: integer('total_xp').default(0),
  level: integer('level').default(1),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userAchievements = pgTable('user_achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  progress: integer('progress').default(0),
});

export const xpHistory = pgTable('xp_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  metadata: text('metadata'), // JSON
  createdAt: timestamp('created_at').defaultNow(),
});
```

## Commands

```bash
# Test gamification features
npm run test -- --grep gamification

# Seed test achievements
npm run db:seed -- --achievements

# Generate leaderboard report
npm run report:leaderboard
```

## After Implementation

> [!IMPORTANT]
> After implementing gamification features:
>
> 1. Run all tests: `npm run test`
> 2. Test the "game feel" manually
> 3. Verify animations are smooth (60fps)
> 4. Test edge cases (max level, 0 XP, streak reset)
> 5. Ensure no dark patterns or addiction mechanics
> 6. Fix ALL errors and warnings
