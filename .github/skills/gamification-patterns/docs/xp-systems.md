# XP and Leveling Systems

## XP System Design

### Core Formula

```typescript
interface XPConfig {
  baseXP: number; // XP for first level
  growthRate: number; // How much harder each level gets
  maxLevel: number; // Level cap
  xpDecay?: number; // Optional: XP decay for inactivity
}

// Most common: Exponential growth
function xpForLevel(level: number, config: XPConfig): number {
  return Math.floor(config.baseXP * Math.pow(config.growthRate, level - 1));
}

// Alternative: Polynomial growth (gentler curve)
function xpForLevelPolynomial(
  level: number,
  base: number,
  power: number,
): number {
  return Math.floor(base * Math.pow(level, power));
}
```

### Common Progression Curves

| Game Type | Formula           | Feel                      |
| --------- | ----------------- | ------------------------- |
| Casual    | `100 * level`     | Linear, predictable       |
| Standard  | `100 * 1.5^level` | Exponential, challenging  |
| Hardcore  | `100 * 2^level`   | Steep, elite feel         |
| Balanced  | `100 * level^1.5` | Polynomial, middle ground |

### Level Brackets

```typescript
interface LevelBracket {
  name: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  perks: string[];
}

const brackets: LevelBracket[] = [
  { name: 'Novice', minLevel: 1, maxLevel: 10, color: '#9ca3af', perks: [] },
  {
    name: 'Apprentice',
    minLevel: 11,
    maxLevel: 25,
    color: '#22c55e',
    perks: ['custom_avatar'],
  },
  {
    name: 'Expert',
    minLevel: 26,
    maxLevel: 50,
    color: '#3b82f6',
    perks: ['custom_avatar', 'badge_display'],
  },
  {
    name: 'Master',
    minLevel: 51,
    maxLevel: 75,
    color: '#a855f7',
    perks: ['all_previous', 'title'],
  },
  {
    name: 'Legend',
    minLevel: 76,
    maxLevel: 100,
    color: '#f59e0b',
    perks: ['all_previous', 'exclusive_content'],
  },
];
```

## XP Sources

### Action-Based XP

```typescript
interface XPAction {
  action: string;
  baseXP: number;
  cooldown?: number; // Prevent farming (seconds)
  dailyCap?: number; // Max times per day
  multipliers?: XPMultiplier[];
}

const xpActions: XPAction[] = [
  { action: 'complete_task', baseXP: 50, dailyCap: 20 },
  { action: 'daily_login', baseXP: 25, cooldown: 86400 },
  {
    action: 'streak_bonus',
    baseXP: 10,
    multipliers: [{ type: 'streak', value: 1.1 }],
  },
  { action: 'first_of_day', baseXP: 100 },
  { action: 'help_others', baseXP: 30, dailyCap: 10 },
  { action: 'complete_challenge', baseXP: 200 },
];
```

### XP Multipliers

```typescript
interface XPMultiplier {
  type: 'streak' | 'event' | 'premium' | 'difficulty' | 'first_time';
  value: number;
  duration?: number;
}

function calculateXP(baseXP: number, multipliers: XPMultiplier[]): number {
  const totalMultiplier = multipliers.reduce((acc, m) => acc * m.value, 1);
  return Math.floor(baseXP * totalMultiplier);
}

// Example: 50 base XP with 1.5x event and 1.2x streak
// calculateXP(50, [{ type: 'event', value: 1.5 }, { type: 'streak', value: 1.2 }])
// = 50 * 1.5 * 1.2 = 90 XP
```

## Prestige Systems

Reset progress for permanent bonuses:

```typescript
interface PrestigeConfig {
  levelRequired: number;
  xpBonus: number; // Permanent XP multiplier increase
  exclusiveRewards: string[];
  retainedProgress: string[];
}

const prestigeLevels: PrestigeConfig[] = [
  {
    levelRequired: 100,
    xpBonus: 0.1, // +10% XP permanently
    exclusiveRewards: ['prestige_badge_1', 'gold_border'],
    retainedProgress: ['achievements', 'cosmetics'],
  },
  {
    levelRequired: 100,
    xpBonus: 0.15,
    exclusiveRewards: ['prestige_badge_2', 'platinum_border'],
    retainedProgress: ['achievements', 'cosmetics', 'titles'],
  },
];
```

## Anti-Farming Measures

```typescript
interface AntiFarmConfig {
  minTimeBetweenActions: number; // Seconds
  maxActionsPerHour: number;
  suspiciousPatternDetection: boolean;
  diminishingReturns: {
    threshold: number; // Actions before diminishing
    reductionRate: number; // Multiplier per action after threshold
    floor: number; // Minimum XP percentage
  };
}

function calculateDiminishedXP(
  baseXP: number,
  actionCount: number,
  config: AntiFarmConfig['diminishingReturns'],
): number {
  if (actionCount <= config.threshold) {
    return baseXP;
  }

  const overThreshold = actionCount - config.threshold;
  const multiplier = Math.max(
    Math.pow(config.reductionRate, overThreshold),
    config.floor,
  );

  return Math.floor(baseXP * multiplier);
}
```

## Level-Up Rewards

```typescript
interface LevelReward {
  level: number;
  rewards: Reward[];
  notification: {
    title: string;
    message: string;
    animation: 'basic' | 'celebration' | 'epic';
  };
}

interface Reward {
  type: 'currency' | 'item' | 'perk' | 'title' | 'badge';
  id: string;
  quantity?: number;
}

const levelRewards: LevelReward[] = [
  {
    level: 5,
    rewards: [
      { type: 'currency', id: 'coins', quantity: 100 },
      { type: 'badge', id: 'first_steps' },
    ],
    notification: {
      title: 'Level 5!',
      message: 'You earned your first badge!',
      animation: 'basic',
    },
  },
  {
    level: 10,
    rewards: [
      { type: 'currency', id: 'coins', quantity: 500 },
      { type: 'perk', id: 'custom_theme' },
    ],
    notification: {
      title: 'Level 10!',
      message: 'Unlock custom themes!',
      animation: 'celebration',
    },
  },
];
```

## Display Best Practices

### Progress Bar

```typescript
interface ProgressDisplayProps {
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  level: number;
}

function ProgressBar({
  currentXP,
  xpForCurrentLevel,
  xpForNextLevel,
  level
}: ProgressDisplayProps) {
  const xpIntoLevel = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const percentage = (xpIntoLevel / xpNeeded) * 100;

  return (
    <div className="level-progress">
      <span className="level">Lvl {level}</span>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="xp-text">
        {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
      </span>
    </div>
  );
}
```

### Level-Up Animation

Always celebrate level-ups:

1. Pause other UI interactions
2. Show level change prominently
3. Display rewards earned
4. Optional: Particle effects, sound
5. Allow user to dismiss when ready
