# Gamification Specification Template

## Overview

| Field           | Value                        |
| --------------- | ---------------------------- |
| Feature Name    | [Name]                       |
| Target Users    | [User segments]              |
| Primary Goal    | [What behavior to encourage] |
| Success Metrics | [How to measure success]     |

## Motivation Analysis

### Target Behaviors

List the specific behaviors you want to encourage:

1. **[Behavior 1]**
   - Current frequency: [X per user per day/week]
   - Target frequency: [Y per user per day/week]
2. **[Behavior 2]**
   - Current frequency: [X]
   - Target frequency: [Y]

### User Motivation Profile

Based on Bartle types, what's your target audience?

| Type        | Percentage | Key Features            |
| ----------- | ---------- | ----------------------- |
| Achievers   | [%]        | [Features they'll love] |
| Explorers   | [%]        | [Features they'll love] |
| Socializers | [%]        | [Features they'll love] |
| Killers     | [%]        | [Features they'll love] |

### SDT Alignment

How does this feature support Self-Determination Theory?

| Need            | Implementation                  |
| --------------- | ------------------------------- |
| **Autonomy**    | [How users have choice]         |
| **Competence**  | [How users feel skilled]        |
| **Relatedness** | [How users connect with others] |

## XP System

### XP Sources

| Action     | Base XP | Daily Cap | Cooldown | Notes   |
| ---------- | ------- | --------- | -------- | ------- |
| [Action 1] | [XP]    | [Cap]     | [Time]   | [Notes] |
| [Action 2] | [XP]    | [Cap]     | [Time]   | [Notes] |

### Level Progression

| Level Range | XP Required | Cumulative XP | Unlocks    |
| ----------- | ----------- | ------------- | ---------- |
| 1-10        | [Formula]   | [Total]       | [Features] |
| 11-25       | [Formula]   | [Total]       | [Features] |
| 26-50       | [Formula]   | [Total]       | [Features] |

### XP Multipliers

| Multiplier | Value  | Trigger       | Duration   |
| ---------- | ------ | ------------- | ---------- |
| [Name]     | [1.5x] | [When active] | [How long] |

## Achievement System

### Achievement Categories

| Category    | Count | Purpose             |
| ----------- | ----- | ------------------- |
| Onboarding  | [N]   | Guide new users     |
| Progression | [N]   | Reward regular use  |
| Mastery     | [N]   | Recognize expertise |
| Social      | [N]   | Encourage community |
| Special     | [N]   | Rare/hidden         |

### Sample Achievements

#### [Achievement Name]

- **Description**: [What user sees]
- **Criteria**: [How to unlock]
- **Rarity**: [common/uncommon/rare/epic/legendary]
- **Rewards**: [XP, badge, etc.]
- **Hidden**: [Yes/No]

#### [Achievement Name]

- **Description**: [What user sees]
- **Criteria**: [How to unlock]
- **Rarity**: [common/uncommon/rare/epic/legendary]
- **Rewards**: [XP, badge, etc.]
- **Progressive Stages**:
  - Stage 1: [Target] → [Rewards]
  - Stage 2: [Target] → [Rewards]
  - Stage 3: [Target] → [Rewards]

## Streak System

### Configuration

| Setting          | Value           |
| ---------------- | --------------- |
| Reset time       | [4:00 AM local] |
| Grace period     | [6 hours]       |
| Max freeze cards | [3]             |

### Streak Milestones

| Days | Name   | Rewards   |
| ---- | ------ | --------- |
| 7    | [Name] | [Rewards] |
| 30   | [Name] | [Rewards] |
| 100  | [Name] | [Rewards] |
| 365  | [Name] | [Rewards] |

## Social Features

### Leaderboards

| Leaderboard | Scope                     | Reset                  | Rewards        |
| ----------- | ------------------------- | ---------------------- | -------------- |
| [Name]      | [Global/Friends/Regional] | [Weekly/Monthly/Never] | [Top N prizes] |

### Social Actions

| Action         | XP   | Limits  | Notes               |
| -------------- | ---- | ------- | ------------------- |
| Invite friend  | [XP] | [Limit] | [Both get rewards?] |
| Help someone   | [XP] | [Limit] | [Criteria]          |
| Team challenge | [XP] | [Limit] | [Requirements]      |

## Reward Economy

### Currency Types

| Currency | Earn Rate    | Spend On      | Sink                       |
| -------- | ------------ | ------------- | -------------------------- |
| [Name]   | [How earned] | [What to buy] | [How removed from economy] |

### Reward Schedule

| Rarity   | Drop Rate | Examples |
| -------- | --------- | -------- |
| Common   | [%]       | [Items]  |
| Uncommon | [%]       | [Items]  |
| Rare     | [%]       | [Items]  |
| Epic     | [%]       | [Items]  |

## UI Components Needed

- [ ] XP progress bar
- [ ] Level badge
- [ ] Achievement toast
- [ ] Achievement gallery
- [ ] Streak counter
- [ ] Leaderboard view
- [ ] Reward modal
- [ ] Profile stats section

## Anti-Gaming Measures

| Risk                | Mitigation                                   |
| ------------------- | -------------------------------------------- |
| XP farming          | [Daily caps, cooldowns, diminishing returns] |
| Multi-accounting    | [Device limits, verification]                |
| Streak manipulation | [Server-side time, detection]                |

## Ethical Considerations

- [ ] No deceptive patterns
- [ ] Clear odds for random rewards
- [ ] Spending limits for minors
- [ ] Session time warnings
- [ ] Easy opt-out of notifications
- [ ] No punishment for non-engagement beyond streak loss

## Implementation Phases

### Phase 1: Core Loop

- [ ] Basic XP system
- [ ] Level progression
- [ ] 5 starter achievements

### Phase 2: Engagement

- [ ] Streak system
- [ ] 15 more achievements
- [ ] Daily challenges

### Phase 3: Social

- [ ] Leaderboards
- [ ] Social achievements
- [ ] Team features

## Success Metrics

| Metric           | Baseline  | Target | Timeline  |
| ---------------- | --------- | ------ | --------- |
| DAU/MAU          | [Current] | [Goal] | [By when] |
| Session length   | [Current] | [Goal] | [By when] |
| Retention D7     | [Current] | [Goal] | [By when] |
| Retention D30    | [Current] | [Goal] | [By when] |
| Feature adoption | [Current] | [Goal] | [By when] |

## A/B Testing Plan

| Test        | Hypothesis      | Variants          | Success Metric    |
| ----------- | --------------- | ----------------- | ----------------- |
| [Test name] | [What we think] | [Control vs Test] | [What to measure] |
