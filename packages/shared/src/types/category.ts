// Category types
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  createdAt: string;
  // Optional fields populated when withCounts=true
  transactionCount?: number;
  totalExpenses?: number;
}

export interface CategoryCreate {
  name: string;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
}

// Category rule types (for auto-categorization)
export interface CategoryRule {
  id: string;
  pattern: string;
  categoryId: string;
  categoryName: string | null;
  categoryIcon: string | null;
  priority: number;
  createdAt: string;
}

export interface CategoryRuleCreate {
  pattern: string;
  categoryId: string;
  priority?: number;
}

// Category Suggestion types
export interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  confidence: number;
  source: 'rule' | 'history' | 'ai' | null;
}

// Cleanup Rule types
export interface CleanupRule {
  id: string;
  pattern: string;
  isActive: boolean;
  createdAt: string;
}

// Payment Provider Rule types
export interface PaymentProviderRule {
  id: string;
  name: string;
  patterns: string;
}
