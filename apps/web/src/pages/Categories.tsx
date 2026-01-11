import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCcw,
  Sparkles,
  X,
  Check,
  Search,
  ChevronUp,
  ChevronDown,
  ArrowDownRight,
  ArrowUpRight,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemNoCheck,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDataService } from '@/contexts/DatabaseContext';
import { cn } from '@/lib/utils';
import { Currency } from '@/components/ui/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useFilters } from '@/contexts/FilterContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Toast, ToastType } from '@/components/ui/toast';

import type { Category } from '@fluxby/shared';

interface CategoryRule {
  id: string;
  pattern: string;
  category_id: string;
  category_name: string | null;
  priority: number;
}

interface SeedSubcategory {
  name: string;
  icon: string;
  description: string;
  rules: string[];
}

interface SeedCategory {
  name: string;
  icon: string;
  color: string;
  description: string;
  subcategories: SeedSubcategory[];
}

const PRESET_ICONS = [
  '🏠',
  '🔑',
  '⚡',
  '🗑️',
  '🪑',
  '🔒',
  '🛒',
  '🍎',
  '🧴',
  '🥖',
  '🐾',
  '🚗',
  '⛽',
  '🚆',
  '🅿️',
  '🛡️',
  '🚲',
  '📱',
  '📞',
  '📺',
  '☁️',
  '🍽️',
  '🥂',
  '🍕',
  '🎟️',
  '🛍️',
  '👕',
  '🏬',
  '🎫',
  '🎁',
  '💊',
  '🩺',
  '🩹',
  '🏋️',
  '✈️',
  '🌴',
  '💰',
  '📈',
  '🏦',
  '💸',
  '🎗️',
  '🎓',
  '📚',
  '👶',
  '💼',
  '💵',
  '💶',
  '📦',
  '↔️',
];

const PRESET_COLORS = [
  '#1E40AF',
  '#2563EB',
  '#3B82F6',
  '#0EA5E9',
  '#06B6D4',
  '#14B8A6',
  '#10B981',
  '#22C55E',
  '#34D399',
  '#84CC16',
  '#F59E0B',
  '#F97316',
  '#EA580C',
  '#EF4444',
  '#DC2626',
  '#E11D48',
  '#C026D3',
  '#A855F7',
  '#8B5CF6',
  '#6366F1',
  '#4F46E5',
  '#475569',
  '#94A3B8',
  '#E2E8F0',
];

const colorWithOpacity = (hex: string | null | undefined, alpha = 0.2) => {
  const value = (hex || PRESET_COLORS[0]).replace('#', '');
  const normalized =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value.padEnd(6, '0').slice(0, 6);
  const r = parseInt(normalized.slice(0, 2), 16) || 0;
  const g = parseInt(normalized.slice(2, 4), 16) || 0;
  const b = parseInt(normalized.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function Categories() {
  const { t, language } = useLanguage();
  const { activeProfileId } = useProfile();
  const dataService = useDataService();
  const confirm = useConfirm();
  useDocumentTitle(t.categories.title);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setCategories, clearOpposingAccountFilters } = useFilters();

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'transactions' | 'amount'>(
    'name'
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Sort switch refs
  const sortIndicatorRef = useRef<HTMLDivElement | null>(null);
  const sortSwitchOuterRef = useRef<HTMLDivElement | null>(null);

  // Add category state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('📁');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newParentId, setNewParentId] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('📁');
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);
  const [editParentId, setEditParentId] = useState<string | null>(null);

  // Rules state
  const [ruleDrafts, setRuleDrafts] = useState<Record<string, string>>({});
  const [editingRulesFor, setEditingRulesFor] = useState<string | null>(null);

  // Toast and modals
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] =
    useState(false);
  const [seedCategories, setSeedCategories] = useState<SeedCategory[]>([]);
  const [selectedSeedCategories, setSelectedSeedCategories] = useState<
    Set<string>
  >(new Set());
  const [isSeeding, setIsSeeding] = useState(false);
  const [isLoadingSeed, setIsLoadingSeed] = useState(false);

  // Ensure seed data is loaded when the seed modal opens (fallback if invoked from other places)
  useEffect(() => {
    let mounted = true;
    const loadSeed = async () => {
      try {
        setIsLoadingSeed(true);
        const result = await dataService.getSeedCategories(language);
        const data = Array.isArray(result) ? result : [];
        if (!mounted) return;
        setSeedCategories(data);
        setSelectedSeedCategories(
          new Set(data.map((c: { name: string }) => c.name))
        );
      } catch (err) {
        // ignore - UI shows empty state
        console.error('Failed to load seed categories for modal:', err);
      } finally {
        if (mounted) setIsLoadingSeed(false);
      }
    };

    if (isSeedModalOpen && seedCategories.length === 0) {
      loadSeed();
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeedModalOpen, language]);

  // Queries
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', activeProfileId, true],
    queryFn: () => dataService.getCategories(true) as Promise<Category[]>,
  });

  const { data: rules } = useQuery({
    queryKey: ['categoryRules', activeProfileId],
    queryFn: () => dataService.getCategoryRules() as Promise<CategoryRule[]>,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: dataService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categories', activeProfileId],
      });
      setNewName('');
      setNewDescription('');
      setNewIcon('📁');
      setNewColor(PRESET_COLORS[0]);
      setNewParentId(null);
      setToast({ message: t.categories.toastAdded, type: 'success' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        icon?: string;
        color?: string;
        description?: string | null;
        parentId?: string | null;
      };
    }) => dataService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categories', activeProfileId],
      });
      setEditingId(null);
      setToast({ message: t.categories.toastUpdated, type: 'success' });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: dataService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categories', activeProfileId],
      });
      setToast({ message: t.categories.toastDeleted, type: 'success' });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: dataService.createCategoryRule,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categoryRules', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      setToast({ message: t.categories.toastRuleAdded, type: 'success' });
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: dataService.deleteCategoryRule,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categoryRules', activeProfileId],
      });
      setToast({ message: t.categories.toastRuleDeleted, type: 'success' });
    },
  });

  const applyRulesMutation = useMutation({
    mutationFn: dataService.applyCategoriesToUncategorized,
    onSuccess: (data) => {
      const result = data as { updated: number; processed: number };
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      setShowProgressModal(false);
      setToast({
        message: `${result.updated} ${t.common.of} ${result.processed} ${t.categories.toastRulesApplied}`,
        type: 'success',
      });
    },
    onError: () => {
      setShowProgressModal(false);
      setToast({ message: t.categories.toastRulesError, type: 'error' });
    },
  });

  const applyRuleMutation = useMutation({
    mutationFn: ({
      pattern,
      categoryId,
    }: {
      pattern: string;
      categoryId: string;
    }) => dataService.applyCategoryRuleToTransactions(pattern, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
    },
  });

  // Group categories by parent
  const { parentCategories, subcategoriesByParent, orphanSubcategories } =
    useMemo(() => {
      if (!categories)
        return {
          parentCategories: [],
          subcategoriesByParent: new Map(),
          orphanSubcategories: [],
        };

      const parents: Category[] = [];
      const childMap = new Map<string, Category[]>();
      const orphans: Category[] = [];

      for (const cat of categories) {
        if (!cat.parentId) {
          parents.push(cat);
        } else {
          const existing = childMap.get(cat.parentId) || [];
          existing.push(cat);
          childMap.set(cat.parentId, existing);
        }
      }

      // Find orphan subcategories (where parent doesn't exist)
      for (const cat of categories) {
        if (cat.parentId && !parents.find((p) => p.id === cat.parentId)) {
          orphans.push(cat);
        }
      }

      return {
        parentCategories: parents,
        subcategoriesByParent: childMap,
        orphanSubcategories: orphans,
      };
    }, [categories]);

  // Rules grouped by category (sorted alphabetically)
  const rulesByCategory = useMemo(() => {
    const map = new Map<string, CategoryRule[]>();
    (rules || []).forEach((rule) => {
      const list = map.get(rule.category_id) || [];
      list.push(rule);
      map.set(rule.category_id, list);
    });
    // Sort rules alphabetically by pattern within each category
    map.forEach((ruleList, categoryId) => {
      map.set(
        categoryId,
        ruleList.sort((a, b) =>
          a.pattern.toLowerCase().localeCompare(b.pattern.toLowerCase())
        )
      );
    });
    return map;
  }, [rules]);

  // Calculate parent totals (sum of subcategories)
  const parentTotals = useMemo(() => {
    const totals = new Map<string, { count: number; amount: number }>();
    for (const parent of parentCategories) {
      const subs = subcategoriesByParent.get(parent.id) || [];
      let count = parent.transactionCount || 0;
      let amount = parent.totalExpenses || 0;
      for (const sub of subs) {
        count += sub.transactionCount || 0;
        amount += sub.totalExpenses || 0;
      }
      totals.set(parent.id, { count, amount });
    }
    return totals;
  }, [parentCategories, subcategoriesByParent]);

  // Helper to render amounts with colored arrows
  const renderAmountWithArrow = (amount: number) => {
    if (!amount) {
      return (
        <span className='text-muted-foreground'>
          <Currency amount={0} />
        </span>
      );
    }
    if (amount > 0) {
      // Positive amount = expense -> show down red
      return (
        <span className='flex items-center text-rose-600'>
          <ArrowDownRight className='mr-1 h-3 w-3' />
          <Currency amount={amount} />
        </span>
      );
    }
    // Negative amount = income -> show up green
    return (
      <span className='flex items-center text-emerald-600'>
        <ArrowUpRight className='mr-1 h-3 w-3' />
        <Currency amount={Math.abs(amount)} />
      </span>
    );
  };

  // Filter and sort parent categories
  const filteredSortedParents = useMemo(() => {
    let filtered = [...parentCategories];

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((cat) => {
        const matchesParent =
          cat.name.toLowerCase().includes(searchLower) ||
          cat.description?.toLowerCase().includes(searchLower);
        const subs = subcategoriesByParent.get(cat.id) || [];
        const matchesSub = subs.some(
          (s: Category) =>
            s.name.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower)
        );
        return matchesParent || matchesSub;
      });
    }

    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) =>
          a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' })
        );
        break;
      case 'transactions':
        filtered.sort((a, b) => {
          const aTotal = parentTotals.get(a.id)?.count || 0;
          const bTotal = parentTotals.get(b.id)?.count || 0;
          return bTotal - aTotal;
        });
        break;
      case 'amount':
        filtered.sort((a, b) => {
          const aTotal = Math.abs(parentTotals.get(a.id)?.amount || 0);
          const bTotal = Math.abs(parentTotals.get(b.id)?.amount || 0);
          return bTotal - aTotal;
        });
        break;
    }

    return filtered;
  }, [parentCategories, subcategoriesByParent, search, sortBy, parentTotals]);

  // Sort switch indicator positioning
  useLayoutEffect(() => {
    const outer = sortSwitchOuterRef.current;
    const indicator = sortIndicatorRef.current;
    if (!outer || !indicator) return;

    const buttons = Array.from(
      outer.querySelectorAll('button')
    ) as HTMLElement[];
    const idxMap: Record<string, number> = {
      name: 0,
      transactions: 1,
      amount: 2,
    };
    const idx = idxMap[sortBy];
    const btn = buttons[idx];
    if (!btn) return;

    const outerRect = outer.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const left = btnRect.left - outerRect.left + 2;
    const width = Math.max(40, btnRect.width - 4);

    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
  }, [sortBy, t]);

  const sortOptions = [
    { key: 'name' as const, label: t.addressBook?.sortName || 'Name' },
    { key: 'transactions' as const, label: t.categories.transactions },
    { key: 'amount' as const, label: t.addressBook?.sortAmount || 'Amount' },
  ];

  // Toggle category expansion
  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Expand all by default when categories load or profile changes
  useEffect(() => {
    if (parentCategories.length > 0) {
      // Always expand all categories when they load or profile changes
      setExpandedCategories(new Set(parentCategories.map((p) => p.id)));
    }
  }, [parentCategories, activeProfileId]);

  // Edit handlers
  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditDescription(category.description || '');
    setEditIcon(category.icon || '📁');
    setEditColor(category.color || PRESET_COLORS[0]);
    setEditParentId(category.parentId);
  };

  const saveEditing = () => {
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editName.trim(),
        description: editDescription.trim() || null,
        icon: editIcon,
        color: editColor,
        parentId: editParentId,
      },
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditIcon('📁');
    setEditColor(PRESET_COLORS[0]);
    setEditParentId(null);
  };

  // Create category
  const handleCreateCategory = () => {
    if (!newName.trim()) return;
    createMutation.mutate({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      icon: newIcon,
      color: newColor,
      parentId: newParentId || undefined,
    });
  };

  // Rules handlers
  const handleDraftChange = (categoryId: string, value: string) => {
    setRuleDrafts((prev) => ({ ...prev, [categoryId]: value }));
  };

  const addKeywords = async (categoryId: string, value: string) => {
    const keywords = value
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (keywords.length === 0) return;

    try {
      const createdPatterns: string[] = [];
      for (const kw of keywords) {
        await createRuleMutation.mutateAsync({
          pattern: kw,
          categoryId,
        });
        createdPatterns.push(kw);
      }
      setRuleDrafts((prev) => ({ ...prev, [categoryId]: '' }));

      // Only apply to existing transactions if user confirms
      if (createdPatterns.length > 0) {
        const isConfirmed = await confirm({
          title: t.categories.applyRules || 'Apply rules',
          message: t.categories.applyToExistingConfirm,
          variant: 'default',
        });
        if (isConfirmed) {
          for (const pattern of createdPatterns) {
            await applyRuleMutation.mutateAsync({ pattern, categoryId });
          }
        }
      }
      // Note: Removed the else block that was incorrectly calling applyRulesMutation
      // when the confirm dialog was cancelled. The keywords/rules are already saved
      // and will be applied to future transactions automatically.
    } catch {
      // Errors handled elsewhere
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const isConfirmed = await confirm({
      title: t.categories.deleteRule || 'Delete rule',
      message: t.categories.deleteRuleConfirm,
      variant: 'danger',
    });
    if (!isConfirmed) return;
    deleteRuleMutation.mutate(ruleId);
  };

  // Seed handlers
  const handleSeedClick = async () => {
    setIsLoadingSeed(true);
    try {
      const result = await dataService.getSeedCategories(language);
      const data = Array.isArray(result) ? result : [];
      setSeedCategories(data);
      setSelectedSeedCategories(
        new Set(data.map((c: { name: string }) => c.name))
      );
      setIsSeedModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch seed data', error);
      setToast({
        message: t.categories.seedError || 'Failed to fetch seed data',
        type: 'error',
      });
    } finally {
      setIsLoadingSeed(false);
    }
  };

  const handleSeedSubmit = async () => {
    try {
      setIsSeeding(true);
      const categoriesToSeed = seedCategories.filter((c) =>
        selectedSeedCategories.has(c.name)
      );
      await dataService.applySeedCategories(categoriesToSeed);
      setIsSeedModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({
        queryKey: ['categoryRules', activeProfileId],
      });
      setToast({
        message: t.categories.seedSuccess || 'Categories seeded successfully',
        type: 'success',
      });
      // Automatically apply rules after seeding
      setTimeout(() => {
        applyRulesMutation.mutate();
      }, 500);
    } catch (error) {
      console.error('Failed to seed categories', error);
      setToast({
        message: t.categories.seedError || 'Failed to seed categories',
        type: 'error',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const toggleSeedCategory = (name: string) => {
    const newSelected = new Set(selectedSeedCategories);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedSeedCategories(newSelected);
  };

  const toggleAllSeedCategories = () => {
    if (selectedSeedCategories.size === seedCategories.length) {
      setSelectedSeedCategories(new Set());
    } else {
      setSelectedSeedCategories(new Set(seedCategories.map((c) => c.name)));
    }
  };

  // Navigate to transactions filtered by category
  const navigateToTransactions = (categoryId: string) => {
    clearOpposingAccountFilters();
    setCategories([categoryId]);
    navigate('/transactions/');
  };

  // Render subcategory row - always shows rules inline
  const renderSubcategoryRow = (sub: Category, parentColor: string) => {
    const isEditing = editingId === sub.id;
    const subRules = rulesByCategory.get(sub.id) || [];
    const isAddingRule = editingRulesFor === sub.id;

    if (isEditing) {
      return (
        <div key={sub.id} className='border-t border-border bg-muted/30 p-4'>
          <div className='space-y-4'>
            <div className='flex gap-3'>
              <div className='flex-1 space-y-2'>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t.categories.categoryName}
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={`${t.categories.description} (${t.common.optional})`}
                />
                <Select
                  value={editParentId?.toString() || 'none'}
                  onValueChange={(v) =>
                    setEditParentId(v === 'none' ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.categories.selectParent || 'Select parent category'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItemNoCheck value='none'>
                      {t.categories.noParent || 'No parent (top-level)'}
                    </SelectItemNoCheck>
                    {parentCategories.map((p) => (
                      <SelectItemNoCheck key={p.id} value={p.id.toString()}>
                        {p.icon} {p.name}
                      </SelectItemNoCheck>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex gap-2'>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                  onClick={saveEditing}
                  disabled={updateMutation.isPending || !editName.trim()}
                >
                  <Check className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                  onClick={cancelEditing}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>

            <div>
              <p className='mb-2 text-sm text-muted-foreground'>
                {t.categories.chooseIcon}
              </p>
              <div className='flex flex-wrap gap-2'>
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setEditIcon(icon)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg border-2 text-base transition-colors',
                      editIcon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={sub.id}
        className='border-t border-border'
        data-onboarding='category-subcategory'
      >
        {/* Subcategory header row */}
        <div className='group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/30'>
          <div
            className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base'
            style={{
              backgroundColor: colorWithOpacity(parentColor),
              color: parentColor,
            }}
          >
            {sub.icon || '📁'}
          </div>

          <div className='min-w-0 flex-1'>
            {/* Name and description */}
            <div className='flex items-center gap-2'>
              <span className='font-medium'>{sub.name}</span>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className='inline-flex cursor-pointer'
                      onClick={() => navigateToTransactions(sub.id)}
                    >
                      <ExternalLink className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t.categories.viewTransactions}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className='ml-auto text-xs text-muted-foreground'>
                {renderAmountWithArrow(sub.totalExpenses || 0)}
                {' · '}
                {sub.transactionCount || 0} {t.categories.transactions}
              </span>
            </div>
            {sub.description && (
              <p className='mt-0.5 text-xs text-muted-foreground'>
                {sub.description}
              </p>
            )}

            {/* Rules - always visible */}
            <div
              className='mt-2 flex flex-wrap items-center gap-1.5'
              data-onboarding='category-rules'
            >
              {subRules.map((rule) => (
                <span
                  key={rule.id}
                  className='inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/80'
                >
                  {rule.pattern}
                  <button
                    className='ml-0.5 rounded-md p-0.5 transition-colors hover:bg-red-600 hover:text-white'
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <X className='h-2.5 w-2.5' />
                  </button>
                </span>
              ))}
              {/* Add rule button */}
              {!isAddingRule && (
                <button
                  className='inline-flex items-center gap-1 rounded-md border border-dashed border-muted-foreground/30 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary'
                  onClick={() => setEditingRulesFor(sub.id)}
                >
                  <Plus className='h-3 w-3' />
                  {t.categories.addKeywords}
                </button>
              )}
            </div>

            {/* Inline rule input when adding */}
            {isAddingRule && (
              <div className='mt-2 flex items-center gap-2'>
                <Input
                  className='h-8 text-sm'
                  placeholder={t.categories.keywordsDescription}
                  value={ruleDrafts[sub.id] || ''}
                  onChange={(e) => handleDraftChange(sub.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeywords(sub.id, ruleDrafts[sub.id] || '');
                    }
                    if (e.key === 'Escape') {
                      setEditingRulesFor(null);
                    }
                  }}
                  autoFocus
                />
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                  onClick={() => addKeywords(sub.id, ruleDrafts[sub.id] || '')}
                  disabled={!ruleDrafts[sub.id]?.trim()}
                >
                  <Check className='h-4 w-4' />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                  onClick={() => setEditingRulesFor(null)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className='flex shrink-0 items-center gap-1'>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-purple-600 hover:text-white'
                    onClick={() => startEditing(sub)}
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.common.edit}</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600 hover:text-white'
                    onClick={async () => {
                      const isConfirmed = await confirm({
                        title: t.categories.deleteCategory || 'Delete category',
                        message: t.categories.deleteConfirm,
                        variant: 'danger',
                      });
                      if (isConfirmed) {
                        deleteCategoryMutation.mutate(sub.id);
                      }
                    }}
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t.common.delete}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  };

  // Render parent category card
  const renderCategoryCard = (category: Category) => {
    const isExpanded = expandedCategories.has(category.id);
    const isEditing = editingId === category.id;
    const subs = subcategoriesByParent.get(category.id) || [];
    const totals = parentTotals.get(category.id) || { count: 0, amount: 0 };

    return (
      <Card
        key={category.id}
        className='overflow-hidden rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
      >
        {isEditing ? (
          <CardContent className='p-4'>
            <div className='space-y-4'>
              <div className='flex gap-3'>
                <div className='flex-1 space-y-2'>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t.categories.categoryName}
                  />
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={`${t.categories.description} (${t.common.optional})`}
                  />
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-8 w-8 hover:bg-purple-600 hover:text-white'
                    onClick={saveEditing}
                    disabled={updateMutation.isPending || !editName.trim()}
                  >
                    <Check className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 hover:bg-purple-600 hover:text-white'
                    onClick={cancelEditing}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <div>
                <p className='mb-2 text-sm text-muted-foreground'>
                  {t.categories.chooseIcon}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setEditIcon(icon)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-colors',
                        editIcon === icon
                          ? 'border-primary bg-primary/10'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className='mb-2 text-sm text-muted-foreground'>
                  {t.categories.chooseColor}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setEditColor(color)}
                      className={cn(
                        'h-6 w-6 rounded-full transition-transform hover:scale-110',
                        editColor === color &&
                          'ring-2 ring-primary ring-offset-2'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        ) : (
          <>
            {/* Category header */}
            <div
              className='flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/30'
              onClick={() => toggleExpanded(category.id)}
              style={{
                borderLeft: `4px solid ${category.color || PRESET_COLORS[0]}`,
              }}
            >
              <div
                className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl'
                style={{
                  backgroundColor: colorWithOpacity(category.color),
                  color: category.color || PRESET_COLORS[0],
                }}
              >
                {category.icon || '📁'}
              </div>

              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <h3 className='font-semibold'>{category.name}</h3>
                  <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                    {subs.length}{' '}
                    {t.categories.subcategories || 'subcategories'}
                  </span>
                </div>
                {category.description && (
                  <p className='truncate text-sm text-muted-foreground'>
                    {category.description}
                  </p>
                )}
                <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
                  <span>{renderAmountWithArrow(totals.amount)}</span>
                  <span aria-hidden='true'>•</span>
                  <span>
                    {totals.count} {t.categories.transactions}
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(category);
                        }}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.common.edit}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-7 w-7 rounded-md transition-colors hover:bg-red-600 hover:text-white'
                        onClick={async (e) => {
                          e.stopPropagation();
                          const isConfirmed = await confirm({
                            title:
                              t.categories.deleteCategory || 'Delete category',
                            message: t.categories.deleteConfirm,
                            variant: 'danger',
                          });
                          if (isConfirmed) {
                            deleteCategoryMutation.mutate(category.id);
                          }
                        }}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t.common.delete}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='group h-7 w-7 rounded-md transition-colors hover:bg-purple-600'
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(category.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className='h-3.5 w-3.5 text-muted-foreground group-hover:text-white' />
                        ) : (
                          <ChevronDown className='h-3.5 w-3.5 text-muted-foreground group-hover:text-white' />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isExpanded
                        ? t.common?.collapse || 'Collapse'
                        : t.categories?.toggleSubcategories ||
                          'Toggle subcategories'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Subcategories */}
            {isExpanded && (
              <div className='relative'>
                {subs.length > 0 ? (
                  subs.map((sub: Category) =>
                    renderSubcategoryRow(
                      sub,
                      category.color || PRESET_COLORS[0]
                    )
                  )
                ) : (
                  <div className='border-t border-border px-4 py-6 text-center text-sm text-muted-foreground'>
                    {t.categories.noSubcategories || 'No subcategories yet'}
                  </div>
                )}

                {/* Add subcategory button */}
                <div
                  className='border-t border-border px-4 py-2'
                  data-onboarding='category-subcategories'
                >
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-muted-foreground hover:bg-white hover:text-black'
                    onClick={() => {
                      setNewParentId(category.id);
                      setNewColor(category.color || PRESET_COLORS[0]);
                      setNewName('');
                      setNewDescription('');
                      setNewIcon('📁');
                      setIsAddSubcategoryModalOpen(true);
                    }}
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    {t.categories.addSubcategory || 'Add subcategory'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold sm:text-3xl'>
            {t.categories.title}
          </h1>
          <p className='mt-1 text-xs text-muted-foreground sm:text-base'>
            {t.categories.subtitle}
          </p>
        </div>
        <div className='flex gap-2'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  data-onboarding='apply-rules'
                  onClick={() => {
                    setShowProgressModal(true);
                    applyRulesMutation.mutate();
                  }}
                  disabled={applyRulesMutation.isPending}
                >
                  <RefreshCcw
                    className={cn(
                      'h-4 w-4',
                      applyRulesMutation.isPending && 'animate-spin'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className='max-w-xs'>
                <p>
                  {t.categories.applyRulesTooltip ||
                    'Apply all category rules to transactions'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? 'secondary' : 'default'}
            data-onboarding='add-category-toggle'
          >
            {showAddForm ? (
              <>
                <ChevronUp className='mr-2 h-4 w-4' />
                {t.common.close}
              </>
            ) : (
              <>
                <Plus className='mr-2 h-4 w-4' />
                {t.categories.addCategory || 'Add category'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <Card data-onboarding='add-category-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Plus className='h-5 w-5' />
              {newParentId
                ? t.categories.addSubcategory || 'Add subcategory'
                : t.categories.addNewCategory}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-wrap gap-4'>
              <div className='min-w-[200px] flex-1 space-y-2'>
                <Input
                  placeholder={t.categories.categoryName}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Input
                  placeholder={`${t.categories.description} (${t.common.optional})`}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
                <Select
                  value={newParentId?.toString() || 'none'}
                  onValueChange={(v) => setNewParentId(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.categories.selectParent || 'Select parent category'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='none'>
                      {t.categories.noParent || 'No parent (top-level)'}
                    </SelectItem>
                    {parentCategories.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.icon} {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateCategory}
                disabled={createMutation.isPending || !newName.trim()}
              >
                <Plus className='mr-2 h-4 w-4' />
                {t.categories.add}
              </Button>
            </div>

            {/* Icon selection */}
            <div>
              <p className='mb-2 text-sm text-muted-foreground'>
                {t.categories.chooseIcon}
              </p>
              <div className='flex flex-wrap gap-2'>
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewIcon(icon)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-colors',
                      newIcon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selection - only for parent categories */}
            {!newParentId && (
              <div>
                <p className='mb-2 text-sm text-muted-foreground'>
                  {t.categories.chooseColor}
                </p>
                <div className='flex flex-wrap gap-2'>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={cn(
                        'h-6 w-6 rounded-full transition-transform hover:scale-110',
                        newColor === color &&
                          'ring-2 ring-primary ring-offset-2'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter Card */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='category-search'
        >
          <CardContent className='p-4'>
            <div className='flex flex-col gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder={
                    t.categories.searchPlaceholder || 'Search categories...'
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-10'
                />
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>
                  {filteredSortedParents.length} {t.categories.categoriesCount}
                  {' • '}
                  {filteredSortedParents.reduce(
                    (acc, cat) =>
                      acc + (subcategoriesByParent.get(cat.id)?.length || 0),
                    0
                  )}{' '}
                  {t.categories.subcategoriesCount || 'subcategories'}
                </span>
                <div
                  ref={sortSwitchOuterRef}
                  className='relative inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5'
                >
                  <div
                    ref={sortIndicatorRef}
                    className='absolute top-0.5 h-[calc(100%-4px)] rounded-md bg-purple-600 shadow-sm transition-all duration-200 ease-out'
                  />
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSortBy(option.key)}
                      className={cn(
                        'relative z-10 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                        sortBy === option.key
                          ? 'text-white'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category List */}
      <div className='-mx-3 sm:mx-0'>
        {categoriesLoading ? (
          <div className='space-y-4'>
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className='h-48' />
            ))}
          </div>
        ) : !categories || categories.length === 0 ? (
          <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <FolderOpen className='mb-4 h-12 w-12 text-muted-foreground/50' />
              <h3 className='text-lg font-medium text-muted-foreground'>
                {t.categories.noCategories}
              </h3>
              <p className='mt-1 mb-6 text-sm text-muted-foreground'>
                {t.categories.createFirst}
              </p>
              <Button
                variant='outline'
                onClick={handleSeedClick}
                data-onboarding='seed-categories'
              >
                <Sparkles className='mr-2 h-4 w-4' />
                {t.categories.seedWithDefaultData || 'Seed with default data'}
              </Button>
            </CardContent>
          </Card>
        ) : filteredSortedParents.length === 0 ? (
          <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
            <CardContent className='py-12 text-center text-muted-foreground'>
              <p className='font-medium'>
                {t.addressBook?.noResults || 'No results found'}
              </p>
              <p className='mt-1 text-sm'>
                {t.addressBook?.tryDifferentSearch ||
                  'Try a different search term'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4' data-onboarding='category-list'>
            {filteredSortedParents.map((category) =>
              renderCategoryCard(category)
            )}

            {/* Show orphan subcategories if any */}
            {orphanSubcategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-muted-foreground'>
                    {t.categories.uncategorized ||
                      'Uncategorized subcategories'}
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  {orphanSubcategories.map((sub) =>
                    renderSubcategoryRow(sub, PRESET_COLORS[0])
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t.categories.applyingRulesTitle}</DialogTitle>
            <DialogDescription>
              {t.categories.applyingRulesDescription}
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col items-center space-y-4 py-4'>
            <div className='h-2 w-full rounded-full bg-gray-200'>
              <div className='h-2 w-full animate-pulse rounded-full bg-blue-600' />
            </div>
            <p className='text-sm text-muted-foreground'>
              {t.categories.pleaseWait}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Seed Modal */}
      <Dialog open={isSeedModalOpen} onOpenChange={setIsSeedModalOpen}>
        <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-[700px]'>
          <DialogHeader>
            <DialogTitle>
              {t.categories.seedCategories || 'Seed categories'}
            </DialogTitle>
            <DialogDescription>
              {t.categories.seedCategoriesDescription ||
                'Select the categories you want to add to your profile. Each category includes subcategories with auto-categorization rules.'}
            </DialogDescription>
          </DialogHeader>
          <div className='flex items-center justify-between border-b pb-2'>
            <span className='text-sm text-muted-foreground'>
              {isLoadingSeed
                ? t.common?.loading || 'Loading...'
                : `${selectedSeedCategories.size}/${seedCategories.length} ${
                    t.categories.categoriesCount || 'categories'
                  }`}
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleAllSeedCategories}
              disabled={isLoadingSeed || seedCategories.length === 0}
            >
              {selectedSeedCategories.size === seedCategories.length
                ? t.categories.deselectAll || 'Deselect all'
                : t.categories.selectAll || 'Select all'}
            </Button>
          </div>
          <div className='grid gap-3 py-2'>
            {seedCategories.map((category) => (
              <div
                key={category.name}
                className={cn(
                  'cursor-pointer rounded-lg border p-4 transition-colors',
                  selectedSeedCategories.has(category.name)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => toggleSeedCategory(category.name)}
              >
                <div className='flex items-start gap-3'>
                  <Checkbox
                    id={`seed-${category.name}`}
                    checked={selectedSeedCategories.has(category.name)}
                    onChange={() => toggleSeedCategory(category.name)}
                  />
                  <div
                    className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl'
                    style={{
                      backgroundColor: colorWithOpacity(category.color),
                      color: category.color,
                    }}
                  >
                    {category.icon}
                  </div>
                  <div className='flex-1'>
                    <div className='font-semibold'>{category.name}</div>
                    <p className='text-sm text-muted-foreground'>
                      {category.description}
                    </p>
                    {category.subcategories &&
                      category.subcategories.length > 0 && (
                        <div className='mt-2 flex flex-wrap gap-1'>
                          {category.subcategories.map((sub) => (
                            <span
                              key={sub.name}
                              className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs'
                            >
                              {sub.icon} {sub.name}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => setIsSeedModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSeedSubmit}
              disabled={isSeeding || selectedSeedCategories.size === 0}
            >
              {isSeeding
                ? t.categories.seeding || 'Seeding...'
                : t.categories.addSelected || 'Add selected'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subcategory Modal */}
      <Dialog
        open={isAddSubcategoryModalOpen}
        onOpenChange={(open) => {
          setIsAddSubcategoryModalOpen(open);
          if (!open) {
            setNewName('');
            setNewDescription('');
            setNewIcon('📁');
            setNewParentId(null);
          }
        }}
      >
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>
              {t.categories.addSubcategory || 'Add subcategory'}
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            {/* Parent select (50%) and Name input (50%) on same row */}
            <div className='flex gap-4'>
              <div className='w-1/2'>
                <label className='mb-1.5 block text-sm font-medium'>
                  {t.categories.selectParent || 'Parent category'}
                </label>
                <Select
                  value={newParentId?.toString() || 'none'}
                  onValueChange={(v) => setNewParentId(v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        t.categories.selectParent || 'Select parent category'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {parentCategories.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.icon} {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='w-1/2'>
                <label className='mb-1.5 block text-sm font-medium'>
                  {t.categories.categoryName}
                </label>
                <Input
                  placeholder={t.categories.categoryName}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
            </div>

            {/* Description (100% width) */}
            <div>
              <label className='mb-1.5 block text-sm font-medium'>
                {t.categories.description}{' '}
                <span className='font-normal text-muted-foreground'>
                  ({t.common.optional})
                </span>
              </label>
              <Input
                placeholder={`${t.categories.description} (${t.common.optional})`}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            {/* Icon selection */}
            <div>
              <label className='mb-1.5 block text-sm font-medium'>
                {t.categories.chooseIcon}
              </label>
              <div className='flex flex-wrap gap-2'>
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewIcon(icon)}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg transition-colors',
                      newIcon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setIsAddSubcategoryModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => {
                handleCreateCategory();
                setIsAddSubcategoryModalOpen(false);
              }}
              disabled={createMutation.isPending || !newName.trim()}
            >
              <Plus className='mr-2 h-4 w-4' />
              {t.categories.add}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
