/**
 * XP Service Implementation
 *
 * Complete XP system with leveling, multipliers, and anti-farming.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface XPConfig {
  baseXPPerLevel: number;
  growthRate: number;
  maxLevel: number;
}

export interface XPAction {
  id: string;
  baseXP: number;
  cooldownMs?: number;
  dailyCap?: number;
}

export interface XPMultiplier {
  id: string;
  value: number;
  expiresAt?: Date;
}

export interface UserXPState {
  totalXP: number;
  level: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  multipliers: XPMultiplier[];
  actionCounts: Record<string, { count: number; lastAction: Date }>;
}

export interface XPGainResult {
  granted: boolean;
  xpGained: number;
  newTotalXP: number;
  leveledUp: boolean;
  newLevel?: number;
  reason?: string;
}

// ============================================================================
// XP SERVICE
// ============================================================================

export class XPService {
  private config: XPConfig;
  private actions: Map<string, XPAction>;
  private state: UserXPState;

  constructor(
    config: XPConfig,
    actions: XPAction[],
    initialState?: Partial<UserXPState>,
  ) {
    this.config = config;
    this.actions = new Map(actions.map((a) => [a.id, a]));
    this.state = {
      totalXP: 0,
      level: 1,
      xpInCurrentLevel: 0,
      xpForNextLevel: this.xpForLevel(2),
      multipliers: [],
      actionCounts: {},
      ...initialState,
    };
  }

  // ============================================================================
  // LEVEL CALCULATIONS
  // ============================================================================

  /**
   * Calculate XP required to reach a specific level
   */
  xpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(
      this.config.baseXPPerLevel * Math.pow(this.config.growthRate, level - 2),
    );
  }

  /**
   * Calculate total XP required from level 1 to reach a level
   */
  totalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 2; i <= level; i++) {
      total += this.xpForLevel(i);
    }
    return total;
  }

  /**
   * Calculate level from total XP
   */
  levelFromTotalXP(totalXP: number): number {
    let level = 1;
    let accumulatedXP = 0;

    while (level < this.config.maxLevel) {
      const xpNeeded = this.xpForLevel(level + 1);
      if (accumulatedXP + xpNeeded > totalXP) {
        break;
      }
      accumulatedXP += xpNeeded;
      level++;
    }

    return level;
  }

  // ============================================================================
  // XP GRANTING
  // ============================================================================

  /**
   * Grant XP for an action
   */
  grantXP(actionId: string): XPGainResult {
    const action = this.actions.get(actionId);
    if (!action) {
      return this.failResult(`Unknown action: ${actionId}`);
    }

    // Check cooldown
    if (!this.checkCooldown(actionId, action)) {
      return this.failResult('Action on cooldown');
    }

    // Check daily cap
    if (!this.checkDailyCap(actionId, action)) {
      return this.failResult('Daily cap reached');
    }

    // Calculate XP with multipliers
    const baseXP = action.baseXP;
    const multipliedXP = this.applyMultipliers(baseXP);

    // Grant XP
    const previousLevel = this.state.level;
    this.state.totalXP += multipliedXP;

    // Update level
    const newLevel = this.levelFromTotalXP(this.state.totalXP);
    const leveledUp = newLevel > previousLevel;
    this.state.level = newLevel;

    // Update progress
    const xpForCurrentLevel = this.totalXPForLevel(newLevel);
    const xpForNextLevel = this.totalXPForLevel(newLevel + 1);
    this.state.xpInCurrentLevel = this.state.totalXP - xpForCurrentLevel;
    this.state.xpForNextLevel = xpForNextLevel - xpForCurrentLevel;

    // Track action
    this.trackAction(actionId);

    return {
      granted: true,
      xpGained: multipliedXP,
      newTotalXP: this.state.totalXP,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }

  /**
   * Grant arbitrary XP (for rewards, bonuses, etc.)
   */
  grantBonusXP(
    amount: number,
    applyMultipliers: boolean = false,
  ): XPGainResult {
    const xpToGrant = applyMultipliers ? this.applyMultipliers(amount) : amount;

    const previousLevel = this.state.level;
    this.state.totalXP += xpToGrant;

    const newLevel = this.levelFromTotalXP(this.state.totalXP);
    const leveledUp = newLevel > previousLevel;
    this.state.level = newLevel;

    this.updateProgress();

    return {
      granted: true,
      xpGained: xpToGrant,
      newTotalXP: this.state.totalXP,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }

  // ============================================================================
  // MULTIPLIERS
  // ============================================================================

  /**
   * Add an XP multiplier
   */
  addMultiplier(multiplier: XPMultiplier): void {
    // Remove existing multiplier with same ID
    this.state.multipliers = this.state.multipliers.filter(
      (m) => m.id !== multiplier.id,
    );
    this.state.multipliers.push(multiplier);
  }

  /**
   * Remove a multiplier
   */
  removeMultiplier(id: string): void {
    this.state.multipliers = this.state.multipliers.filter((m) => m.id !== id);
  }

  /**
   * Get current total multiplier
   */
  getCurrentMultiplier(): number {
    this.cleanExpiredMultipliers();
    return this.state.multipliers.reduce((acc, m) => acc * m.value, 1);
  }

  private applyMultipliers(baseXP: number): number {
    const multiplier = this.getCurrentMultiplier();
    return Math.floor(baseXP * multiplier);
  }

  private cleanExpiredMultipliers(): void {
    const now = new Date();
    this.state.multipliers = this.state.multipliers.filter(
      (m) => !m.expiresAt || m.expiresAt > now,
    );
  }

  // ============================================================================
  // ANTI-FARMING
  // ============================================================================

  private checkCooldown(actionId: string, action: XPAction): boolean {
    if (!action.cooldownMs) return true;

    const record = this.state.actionCounts[actionId];
    if (!record) return true;

    const elapsed = Date.now() - record.lastAction.getTime();
    return elapsed >= action.cooldownMs;
  }

  private checkDailyCap(actionId: string, action: XPAction): boolean {
    if (!action.dailyCap) return true;

    const record = this.state.actionCounts[actionId];
    if (!record) return true;

    // Reset if last action was before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (record.lastAction < today) {
      record.count = 0;
      return true;
    }

    return record.count < action.dailyCap;
  }

  private trackAction(actionId: string): void {
    const record = this.state.actionCounts[actionId];
    const now = new Date();

    if (record) {
      // Reset count if new day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (record.lastAction < today) {
        record.count = 1;
      } else {
        record.count++;
      }
      record.lastAction = now;
    } else {
      this.state.actionCounts[actionId] = { count: 1, lastAction: now };
    }
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  private updateProgress(): void {
    const xpForCurrentLevel = this.totalXPForLevel(this.state.level);
    const xpForNextLevel = this.totalXPForLevel(this.state.level + 1);
    this.state.xpInCurrentLevel = this.state.totalXP - xpForCurrentLevel;
    this.state.xpForNextLevel = xpForNextLevel - xpForCurrentLevel;
  }

  private failResult(reason: string): XPGainResult {
    return {
      granted: false,
      xpGained: 0,
      newTotalXP: this.state.totalXP,
      leveledUp: false,
      reason,
    };
  }

  getState(): UserXPState {
    return { ...this.state };
  }

  getProgress(): { percentage: number; current: number; required: number } {
    return {
      percentage:
        (this.state.xpInCurrentLevel / this.state.xpForNextLevel) * 100,
      current: this.state.xpInCurrentLevel,
      required: this.state.xpForNextLevel,
    };
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

const xpService = new XPService(
  {
    baseXPPerLevel: 100,
    growthRate: 1.5,
    maxLevel: 100,
  },
  [
    { id: 'complete_task', baseXP: 50, dailyCap: 20 },
    { id: 'daily_login', baseXP: 25, cooldownMs: 24 * 60 * 60 * 1000 },
    { id: 'complete_challenge', baseXP: 200 },
  ],
);

// Add 2x XP weekend event
xpService.addMultiplier({
  id: 'weekend_event',
  value: 2,
  expiresAt: new Date('2024-12-31'),
});

// Grant XP
const result = xpService.grantXP('complete_task');
if (result.leveledUp) {
  console.log(`Level up! Now level ${result.newLevel}`);
}
