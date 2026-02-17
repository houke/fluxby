# Achievement System Design

## Achievement Anatomy

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  criteria: AchievementCriteria;
  rewards: Reward[];
  hidden?: boolean; // Secret achievements
  progressive?: boolean; // Has stages (e.g., "Win 10/50/100 games")
  stages?: AchievementStage[];
  unlockDate?: Date;
  displayOrder?: number;
}

type AchievementCategory =
  | 'beginner'
  | 'progression'
  | 'mastery'
  | 'social'
  | 'collection'
  | 'special'
  | 'seasonal';

type AchievementRarity =
  | 'common' // >50% of users
  | 'uncommon' // 25-50%
  | 'rare' // 10-25%
  | 'epic' // 1-10%
  | 'legendary'; // <1%
```

## Achievement Categories

### 1. Onboarding Achievements

Guide new users through features:

```typescript
const onboardingAchievements: Achievement[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first task',
    icon: '👣',
    category: 'beginner',
    rarity: 'common',
    criteria: { type: 'count', action: 'complete_task', target: 1 },
    rewards: [{ type: 'xp', amount: 50 }],
  },
  {
    id: 'profile_complete',
    name: 'Identity Established',
    description: 'Complete your profile',
    icon: '🎭',
    category: 'beginner',
    rarity: 'common',
    criteria: { type: 'profile_completion', percentage: 100 },
    rewards: [{ type: 'badge', id: 'verified' }],
  },
];
```

### 2. Progressive Achievements

Multi-stage achievements that grow:

```typescript
interface AchievementStage {
  stage: number;
  target: number;
  name: string;
  rewards: Reward[];
}

const progressiveAchievement: Achievement = {
  id: 'task_master',
  name: 'Task Master',
  description: 'Complete tasks',
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
      rewards: [
        { type: 'xp', amount: 500 },
        { type: 'badge', id: 'task_master_100' },
      ],
    },
    {
      stage: 4,
      target: 500,
      name: 'Expert',
      rewards: [
        { type: 'xp', amount: 1000 },
        { type: 'title', id: 'The Productive' },
      ],
    },
    {
      stage: 5,
      target: 1000,
      name: 'Master',
      rewards: [
        { type: 'xp', amount: 2000 },
        { type: 'cosmetic', id: 'golden_checkmark' },
      ],
    },
  ],
};
```

### 3. Secret Achievements

Hidden until unlocked (discovery-based):

```typescript
const secretAchievements: Achievement[] = [
  {
    id: 'night_owl',
    name: '???', // Hidden name
    description: '???', // Hidden description
    icon: '❓',
    category: 'special',
    rarity: 'rare',
    hidden: true,
    criteria: { type: 'time_based', action: 'complete_task', hours: [0, 4] },
    rewards: [{ type: 'badge', id: 'night_owl' }],
    // Revealed data:
    // name: 'Night Owl',
    // description: 'Complete a task between midnight and 4 AM',
  },
];
```

### 4. Combo Achievements

Require multiple conditions:

```typescript
interface ComboCriteria {
  type: 'combo';
  conditions: AchievementCriteria[];
  operator: 'AND' | 'OR';
}

const comboAchievement: Achievement = {
  id: 'perfect_week',
  name: 'Perfect Week',
  description: 'Complete all daily goals for 7 consecutive days',
  icon: '🏆',
  category: 'mastery',
  rarity: 'epic',
  criteria: {
    type: 'combo',
    operator: 'AND',
    conditions: [
      { type: 'streak', action: 'daily_goal_complete', target: 7 },
      { type: 'count', action: 'task_complete', target: 35, timeframe: 'week' },
    ],
  },
  rewards: [
    { type: 'xp', amount: 1000 },
    { type: 'badge', id: 'perfectionist' },
  ],
};
```

## Criteria Types

```typescript
type AchievementCriteria =
  | CountCriteria
  | StreakCriteria
  | TimeCriteria
  | CollectionCriteria
  | SocialCriteria
  | ProfileCriteria
  | ComboCriteria;

interface CountCriteria {
  type: 'count';
  action: string;
  target: number;
  timeframe?: 'day' | 'week' | 'month' | 'all_time';
}

interface StreakCriteria {
  type: 'streak';
  action: string;
  target: number;
}

interface TimeCriteria {
  type: 'time_based';
  action: string;
  hours?: [number, number]; // Hour range
  days?: number[]; // Day of week (0-6)
  dateRange?: [Date, Date]; // Specific date range
}

interface CollectionCriteria {
  type: 'collection';
  items: string[]; // All items required
  minCount?: number; // Or minimum count
}

interface SocialCriteria {
  type: 'social';
  action: 'invite' | 'collaborate' | 'help' | 'gift';
  target: number;
}

interface ProfileCriteria {
  type: 'profile_completion';
  percentage: number;
}
```

## Rarity System

```typescript
const rarityConfig = {
  common: {
    color: '#9ca3af',
    glow: 'none',
    animation: 'fade-in',
    sound: 'achievement_common.mp3',
  },
  uncommon: {
    color: '#22c55e',
    glow: '0 0 10px #22c55e',
    animation: 'slide-up',
    sound: 'achievement_uncommon.mp3',
  },
  rare: {
    color: '#3b82f6',
    glow: '0 0 15px #3b82f6',
    animation: 'scale-bounce',
    sound: 'achievement_rare.mp3',
  },
  epic: {
    color: '#a855f7',
    glow: '0 0 20px #a855f7',
    animation: 'spin-reveal',
    sound: 'achievement_epic.mp3',
  },
  legendary: {
    color: '#f59e0b',
    glow: '0 0 25px #f59e0b, 0 0 50px #f59e0b',
    animation: 'epic-reveal',
    sound: 'achievement_legendary.mp3',
  },
};
```

## UI Patterns

### Achievement Toast

```typescript
interface AchievementToast {
  achievement: Achievement;
  duration: number; // Auto-dismiss time
  position: 'top' | 'bottom';
  allowDismiss: boolean;
  onView?: () => void; // Navigate to achievement detail
}
```

### Achievement Display Component

```tsx
function AchievementCard({ achievement, progress }: Props) {
  const isUnlocked = progress >= getTarget(achievement);

  return (
    <div className={`achievement ${isUnlocked ? 'unlocked' : 'locked'}`}>
      <div
        className='icon'
        style={{ filter: isUnlocked ? 'none' : 'grayscale(1)' }}
      >
        {achievement.hidden && !isUnlocked ? '❓' : achievement.icon}
      </div>
      <div className='info'>
        <h3>{achievement.hidden && !isUnlocked ? '???' : achievement.name}</h3>
        <p>
          {achievement.hidden && !isUnlocked
            ? 'Secret achievement'
            : achievement.description}
        </p>
        {achievement.progressive && (
          <div className='progress'>
            <div
              className='bar'
              style={{ width: `${(progress / getTarget(achievement)) * 100}%` }}
            />
            <span>
              {progress} / {getTarget(achievement)}
            </span>
          </div>
        )}
      </div>
      <div
        className='rarity-badge'
        style={{ color: rarityConfig[achievement.rarity].color }}
      >
        {achievement.rarity}
      </div>
    </div>
  );
}
```

## Best Practices

1. **Balanced Distribution**: 50% common, 30% uncommon, 15% rare, 4% epic, 1% legendary
2. **Clear Progress**: Always show progress toward multi-stage achievements
3. **Meaningful Rewards**: Achievements should give more than just XP
4. **Discovery**: Include hidden achievements for exploration
5. **Social Proof**: Show percentage of users who have each achievement
6. **Retroactive Unlock**: Check existing user data when adding new achievements
7. **Seasonal Rotation**: Limited-time achievements create urgency
