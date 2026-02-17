# Gamification Patterns Quick Reference

## Octalysis Framework

```
        Epic Meaning
             │
 Empowerment─┼─Accomplishment
             │
  Social ────┼──── Ownership
             │
 Scarcity ───┼─── Unpredictability
             │
        Avoidance
```

## Core Drives

| #   | Drive            | Motivates Via            |
| --- | ---------------- | ------------------------ |
| 1   | Meaning          | Purpose, bigger cause    |
| 2   | Accomplishment   | Progress, mastery        |
| 3   | Empowerment      | Creativity, choices      |
| 4   | Ownership        | Collection, building     |
| 5   | Social           | Competition, cooperation |
| 6   | Scarcity         | FOMO, exclusivity        |
| 7   | Unpredictability | Curiosity, surprise      |
| 8   | Avoidance        | Loss prevention          |

## XP Formulas

```typescript
// Linear
const xpForLevel = (level: number) => level * 100;

// Exponential
const xpForLevel = (level: number) =>
  Math.floor(100 * Math.pow(1.5, level - 1));

// Polynomial (RPG-style)
const xpForLevel = (level: number) => Math.floor(100 * Math.pow(level, 2));
```

## Level Thresholds

| Level | Linear | Exponential | Polynomial |
| ----- | ------ | ----------- | ---------- |
| 1     | 100    | 100         | 100        |
| 5     | 500    | 506         | 2,500      |
| 10    | 1,000  | 3,844       | 10,000     |
| 20    | 2,000  | 116,000     | 40,000     |

## Achievement Types

| Type       | Trigger          | Example              |
| ---------- | ---------------- | -------------------- |
| Milestone  | Count threshold  | "Complete 10 tasks"  |
| Streak     | Consecutive days | "7-day streak"       |
| Speed      | Time-based       | "Complete in 5 min"  |
| Secret     | Hidden condition | "Easter egg found"   |
| Collection | Gather set       | "Collect all badges" |
| Social     | Peer action      | "Helped 5 users"     |

## Achievement Schema

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  trigger: {
    type: 'count' | 'streak' | 'time' | 'event';
    threshold: number;
    metric: string;
  };
  secret: boolean;
  unlockedAt?: Date;
}
```

## Streak Mechanics

```typescript
// Grace period
const GRACE_HOURS = 12;

// Streak freeze (paid feature)
const canUseFreeze = freezesRemaining > 0;

// Reset protection
if (hoursSinceLastAction < 24 + GRACE_HOURS) {
  // Streak maintained
}
```

## Reward Schedules

| Schedule          | Pattern         | Engagement  |
| ----------------- | --------------- | ----------- |
| Fixed Ratio       | Every N actions | Steady      |
| Variable Ratio    | Random N (avg)  | High        |
| Fixed Interval    | Every N time    | Predictable |
| Variable Interval | Random time     | Checking    |

## Points Table

```markdown
| Action        | XP     | Rationale   |
| ------------- | ------ | ----------- |
| Sign up       | 50     | Onboarding  |
| Complete task | 10-50  | Core action |
| Daily login   | 5      | Retention   |
| Streak bonus  | +10%   | Consistency |
| Achievement   | 25-500 | Milestones  |
| Referral      | 100    | Growth      |
```

## Celebration Effects

```typescript
// Confetti (canvas-confetti)
import confetti from 'canvas-confetti';

confetti({
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
});

// Level up
confetti({
  particleCount: 200,
  spread: 180,
  colors: ['#gold', '#ffd700'],
});
```

## Notification Timing

| Event        | Timing    | Channel        |
| ------------ | --------- | -------------- |
| Achievement  | Immediate | In-app + toast |
| Level up     | Immediate | Full-screen    |
| Streak risk  | 4h before | Push           |
| Daily reward | Morning   | Push           |
| Leaderboard  | Weekly    | Email          |

## Leaderboard Types

| Type     | Scope         | Updates     |
| -------- | ------------- | ----------- |
| Global   | All users     | Real-time   |
| Friends  | Connections   | Real-time   |
| Weekly   | 7-day window  | Daily reset |
| Relative | ±10 positions | Real-time   |

## Anti-patterns to Avoid

| ❌ Don't           | ✅ Do            |
| ------------------ | ---------------- |
| Punitive loss      | Grace periods    |
| Pay to win         | Cosmetic rewards |
| Mandatory social   | Optional sharing |
| Endless grind      | Meaningful caps  |
| Random unlocks     | Skill-based      |
| Spam notifications | Smart timing     |

## Quick Implementation

```typescript
// XP service skeleton
class XpService {
  async addXp(userId: string, amount: number, source: string) {
    const user = await this.getUser(userId);
    const newXp = user.xp + amount;
    const newLevel = this.calculateLevel(newXp);

    await this.updateUser(userId, { xp: newXp, level: newLevel });

    if (newLevel > user.level) {
      await this.triggerLevelUp(userId, newLevel);
    }

    await this.checkAchievements(userId, source);
  }
}
```

## Database Schema

```sql
-- Users
ALTER TABLE users ADD COLUMN xp INT DEFAULT 0;
ALTER TABLE users ADD COLUMN level INT DEFAULT 1;
ALTER TABLE users ADD COLUMN streak INT DEFAULT 0;

-- Achievements
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  achievement_id TEXT,
  unlocked_at TIMESTAMP DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT,
  xp_earned INT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Checklist

```
□ XP awards correctly
□ Level calculation accurate
□ Achievement triggers work
□ Streak maintains/resets properly
□ Grace period respected
□ Celebrations show
□ Notifications fire
□ Leaderboard updates
□ Edge cases handled
```
