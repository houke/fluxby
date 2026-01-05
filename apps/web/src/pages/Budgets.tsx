import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  ChevronUp,
  ExternalLink,
  Check,
  X,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFilters } from '@/contexts/FilterContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';

interface Budget {
  id: string;
  categoryId: string | null;
  amount: number;
  period: 'monthly' | 'yearly';
  spent: number;
  remaining: number;
  percentage: number;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon?: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  parentId?: string | null;
}

type SortOption = 'name' | 'spent' | 'percentage' | 'amount';

const colorWithOpacity = (hex: string | null | undefined, alpha = 0.36) => {
  const value = (hex || '#3B82F6').replace('#', '');
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

// Helper to format date as YYYY-MM-DD without timezone issues
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Budgets() {
  const { t } = useLanguage();
  const { activeProfileId } = useProfile();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const {
    setCategories,
    setTransactionType,
    clearOpposingAccountFilters,
    filters,
  } = useFilters();
  useDocumentTitle(t.budgets.title);
  const queryClient = useQueryClient();

  // Add budget card toggle
  const [showAddForm, setShowAddForm] = useState(false);

  // Search and sort state
  const [search, setSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // Sort switch refs
  const sortIndicatorRef = useRef<HTMLDivElement | null>(null);
  const sortSwitchOuterRef = useRef<HTMLDivElement | null>(null);

  // Form state
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [openCategorySelect, setOpenCategorySelect] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  // Proposed budgets state
  const [proposedModalOpen, setProposedModalOpen] = useState(false);
  const [selectedProposals, setSelectedProposals] = useState<Set<string>>(
    new Set()
  );

  // Format dates for API calls
  const startDate = formatDateLocal(filters.dateRange.start);
  const endDate = formatDateLocal(filters.dateRange.end);

  const { data: budgets, isLoading } = useQuery<Budget[]>({
    queryKey: ['budgets', activeProfileId, startDate, endDate],
    queryFn: () =>
      api.getBudgets(undefined, startDate, endDate) as unknown as Promise<
        Budget[]
      >,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories', activeProfileId, false],
    queryFn: () => api.getCategories() as Promise<Category[]>,
  });

  const { data: proposedBudgets, refetch: refetchProposedBudgets } = useQuery({
    queryKey: ['proposedBudgets', activeProfileId],
    queryFn: () =>
      api.getProposedBudgets() as Promise<
        {
          categoryId: string;
          categoryName: string;
          categoryIcon: string | null;
          categoryColor: string | null;
          proposedAmount: number;
          avgMonthlySpent: number;
          basedOnMonths: number;
        }[]
      >,
  });

  const hasEnoughData = proposedBudgets && proposedBudgets.length > 0;

  // Handler to open smart budget modal with fresh data
  const handleOpenProposedModal = () => {
    refetchProposedBudgets();
    setProposedModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: api.createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', activeProfileId] });
      setNewBudgetCategory('');
      setNewBudgetAmount('');
      // Keep form open for quick entry
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.updateBudget(id, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', activeProfileId] });
      setEditingId(null);
      setEditAmount('');
    },
  });

  const createMultipleMutation = useMutation({
    mutationFn: async (budgets: { categoryId: string; amount: number }[]) => {
      for (const budget of budgets) {
        await api.createBudget(budget);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', activeProfileId] });
      queryClient.invalidateQueries({
        queryKey: ['proposedBudgets', activeProfileId],
      });
      setProposedModalOpen(false);
      setSelectedProposals(new Set());
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', activeProfileId] });
    },
  });

  const handleCreateBudget = () => {
    const amount = parseFloat(newBudgetAmount);
    if (isNaN(amount) || amount <= 0) return;

    createMutation.mutate({
      categoryId: newBudgetCategory || undefined,
      amount,
      period: 'monthly',
    });
  };

  const startEditing = (budget: Budget) => {
    setEditingId(budget.id);
    setEditAmount(budget.amount.toString());
  };

  const saveEditing = () => {
    if (editingId === null) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    updateMutation.mutate({ id: editingId, amount });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount('');
  };

  // Get category info by ID
  const getCategoryInfo = (categoryId: string | null) => {
    if (!categoryId || !categories) return null;
    return categories.find((c) => c.id === categoryId);
  };

  // Filter and sort budgets
  const filteredSortedBudgets = (() => {
    if (!budgets) return [];

    let filtered = [...budgets];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (budget) =>
          budget.categoryName?.toLowerCase().includes(searchLower) ||
          (!budget.categoryName &&
            t.budgets.totalBudget.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) =>
          (a.categoryName || t.budgets.totalBudget).localeCompare(
            b.categoryName || t.budgets.totalBudget,
            'nl',
            { sensitivity: 'base' }
          )
        );
        break;
      case 'spent':
        filtered.sort((a, b) => b.spent - a.spent);
        break;
      case 'percentage':
        filtered.sort((a, b) => b.percentage - a.percentage);
        break;
      case 'amount':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
    }

    return filtered;
  })();

  // Sort switch indicator positioning
  useLayoutEffect(() => {
    const outer = sortSwitchOuterRef.current;
    const indicator = sortIndicatorRef.current;
    if (!outer || !indicator) return;

    const buttons = Array.from(
      outer.querySelectorAll('button')
    ) as HTMLElement[];
    const idxMap: Record<SortOption, number> = {
      name: 0,
      spent: 1,
      percentage: 2,
      amount: 3,
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

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'name', label: t.addressBook?.sortName || 'Name' },
    { key: 'spent', label: t.budgets.spent },
    { key: 'percentage', label: '%' },
    { key: 'amount', label: t.budgets.amount || 'Budget' },
  ];

  const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + b.spent, 0) || 0;
  const overallPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const usedCategoryIds = new Set(
    budgets?.map((b) => b.categoryId).filter((id): id is string => id !== null)
  );
  const availableCategories = categories?.filter(
    (cat) => !usedCategoryIds.has(cat.id)
  );

  // Group categories by parent for the dropdown - mimic TransactionRowBadges logic
  const groupedCategories = useMemo(() => {
    if (!availableCategories || !categories) return [];

    const parents = categories
      .filter((c) => !c.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return parents
      .map((parent) => {
        const children = availableCategories
          .filter((c) => c.parentId === parent.id)
          .sort((a, b) => a.name.localeCompare(b.name));
        return { parent, children };
      })
      .filter((group) => group.children.length > 0);
  }, [availableCategories, categories]);

  // Filter grouped categories based on search
  const filteredGroupedCategories = useMemo(() => {
    const searchLower = categorySearch.toLowerCase();
    if (!searchLower) return groupedCategories;

    return groupedCategories
      .map((group) => ({
        ...group,
        children: group.children.filter((c) =>
          c.name.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((group) => group.children.length > 0);
  }, [groupedCategories, categorySearch]);

  const selectedCategory = categories?.find(
    (c) => c.id.toString() === newBudgetCategory
  );

  return (
    <div className='space-y-6'>
      {/* Header with Add button */}
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold sm:text-3xl'>{t.budgets.title}</h1>
          <p className='mt-1 text-xs text-muted-foreground sm:text-base'>
            {t.budgets.subtitle}
          </p>
        </div>
        <div className='flex gap-2'>
          {hasEnoughData && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleOpenProposedModal}
                    variant='outline'
                    size='icon'
                    data-onboarding='budget-smart-proposals'
                  >
                    <Sparkles className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t.budgets.proposedBudgets}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? 'secondary' : 'default'}
            data-onboarding='add-budget-toggle'
          >
            {showAddForm ? (
              <>
                <ChevronUp className='mr-2 h-4 w-4' />
                {t.common.close}
              </>
            ) : (
              <>
                <Plus className='mr-2 h-4 w-4' />
                {t.budgets.addNewBudget}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Add New Budget - collapsible */}
      {showAddForm && (
        <Card data-onboarding='add-budget-card'>
          <CardHeader>
            <CardTitle>{t.budgets.addNewBudget}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap gap-4'>
              <Popover
                open={openCategorySelect}
                onOpenChange={(open) => {
                  setOpenCategorySelect(open);
                  if (!open) setCategorySearch('');
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={openCategorySelect}
                    className='w-[250px] justify-between'
                  >
                    {newBudgetCategory ? (
                      <div className='flex items-center gap-2'>
                        <span
                          className='flex h-5 w-5 items-center justify-center rounded text-xs'
                          style={{
                            backgroundColor: `${
                              selectedCategory?.color || '#9CA3AF'
                            }5C`,
                          }}
                        >
                          {selectedCategory?.icon}
                        </span>
                        {selectedCategory?.name}
                      </div>
                    ) : (
                      'Select Category'
                    )}
                    <ChevronUp className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[250px] p-2' align='start'>
                  <div className='space-y-2'>
                    <Input
                      placeholder={t.common.search}
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className='h-8 text-sm'
                      autoFocus
                    />
                    <div className='max-h-60 space-y-1 overflow-y-auto'>
                      {filteredGroupedCategories.length > 0 ? (
                        filteredGroupedCategories.map((group) => (
                          <div key={group.parent.id}>
                            <div className='flex items-center gap-2 py-1.5'>
                              <div className='h-px flex-1 border-t border-dotted border-muted-foreground/30' />
                              <span className='whitespace-nowrap text-xs text-muted-foreground'>
                                {group.parent.name}
                              </span>
                              <div className='h-px flex-1 border-t border-dotted border-muted-foreground/30' />
                            </div>
                            {group.children.map((category) => (
                              <button
                                key={category.id}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-muted',
                                  newBudgetCategory === category.id &&
                                    'bg-muted'
                                )}
                                onClick={() => {
                                  setNewBudgetCategory(category.id);
                                  setOpenCategorySelect(false);
                                  setCategorySearch('');
                                }}
                              >
                                <span
                                  className='flex h-5 w-5 items-center justify-center rounded text-xs'
                                  style={{
                                    backgroundColor: `${
                                      category.color || '#9CA3AF'
                                    }5C`,
                                  }}
                                >
                                  {category.icon}
                                </span>
                                <span className='truncate'>
                                  {category.name}
                                </span>
                                {newBudgetCategory === category.id && (
                                  <Check className='ml-auto h-3 w-3 text-primary' />
                                )}
                              </button>
                            ))}
                          </div>
                        ))
                      ) : (
                        <div className='py-6 text-center text-sm text-muted-foreground'>
                          {t.common.noResults}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Input
                type='number'
                placeholder={t.budgets.amountPerMonth}
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                className='min-w-[150px] flex-1'
              />
              <Button
                onClick={handleCreateBudget}
                disabled={createMutation.isPending || !newBudgetCategory}
              >
                <Plus className='mr-2 h-4 w-4' />
                {t.budgets.add}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposed Budgets Modal */}
      <Dialog open={proposedModalOpen} onOpenChange={setProposedModalOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-purple-600' />
              {t.budgets.proposedBudgets}
            </DialogTitle>
            <DialogDescription>
              {t.budgets.proposedBudgetsDescription}
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-[400px] space-y-2 overflow-y-auto py-4'>
            {proposedBudgets?.map((proposal) => (
              <div
                key={proposal.categoryId}
                className='flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50'
              >
                <div className='flex items-center gap-3'>
                  <input
                    type='checkbox'
                    checked={selectedProposals.has(proposal.categoryId)}
                    onChange={(e) => {
                      const newSet = new Set(selectedProposals);
                      if (e.target.checked) {
                        newSet.add(proposal.categoryId);
                      } else {
                        newSet.delete(proposal.categoryId);
                      }
                      setSelectedProposals(newSet);
                    }}
                    className='h-4 w-4 cursor-pointer rounded border-gray-300'
                  />
                  <div className='flex items-center gap-2'>
                    <span
                      className='flex h-8 w-8 items-center justify-center rounded'
                      style={{
                        backgroundColor:
                          colorWithOpacity(proposal.categoryColor, 0.2) ||
                          'rgba(156, 163, 175, 0.2)',
                      }}
                    >
                      {proposal.categoryIcon}
                    </span>
                    <div>
                      <p className='font-medium'>{proposal.categoryName}</p>
                      <p className='text-xs text-muted-foreground'>
                        {t.budgets.avgSpent}:{' '}
                        {formatCurrency(proposal.avgMonthlySpent)}/mnd (
                        {proposal.basedOnMonths} mnd)
                      </p>
                    </div>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-lg font-bold'>
                    {formatCurrency(proposal.proposedAmount)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {t.budgets.perMonth}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setProposedModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => {
                const budgetsToCreate = proposedBudgets
                  ?.filter((p) => selectedProposals.has(p.categoryId))
                  .map((p) => ({
                    categoryId: p.categoryId,
                    amount: p.proposedAmount,
                  }));
                if (budgetsToCreate && budgetsToCreate.length > 0) {
                  createMultipleMutation.mutate(budgetsToCreate);
                }
              }}
              disabled={
                selectedProposals.size === 0 || createMultipleMutation.isPending
              }
            >
              {t.budgets.createSelected} ({selectedProposals.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overall Progress */}
      <div className='-mx-3 sm:mx-0'>
        <Card className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'>
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>
              {t.budgets.monthlyOverview}
            </CardTitle>
            <CardDescription>
              {budgets?.length || 0} {t.budgets.budgetsSet}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-2xl font-bold'>
                  {formatCurrency(totalSpent)}
                </span>
                <span className='text-muted-foreground'>
                  {t.common.of} {formatCurrency(totalBudget)}
                </span>
              </div>
              <Progress
                value={Math.min(overallPercentage, 100)}
                className='h-3'
                indicatorClassName={cn(
                  overallPercentage > 100
                    ? 'bg-destructive'
                    : overallPercentage > 80
                      ? 'bg-yellow-500'
                      : 'bg-success'
                )}
              />
              <p className='text-sm text-muted-foreground'>
                {overallPercentage > 100
                  ? `${formatCurrency(totalSpent - totalBudget)} ${
                      t.budgets.overBudget
                    }`
                  : `${formatCurrency(totalBudget - totalSpent)} ${
                      t.budgets.remaining
                    }`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Card */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='budget-search'
        >
          <CardContent className='p-4'>
            <div className='flex flex-col gap-4'>
              {/* Search bar */}
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search budgets...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-10'
                />
              </div>

              {/* Sort Switch */}
              <div className='flex items-center justify-between'>
                <span className='text-sm text-muted-foreground'>
                  {filteredSortedBudgets.length} {t.budgets.budgetsSet}
                </span>
                <div
                  ref={sortSwitchOuterRef}
                  className='relative inline-flex items-center rounded-lg border border-border bg-muted/50 p-0.5'
                >
                  {/* Sliding indicator */}
                  <div
                    ref={sortIndicatorRef}
                    className='absolute top-0.5 h-[calc(100%-4px)] rounded-md bg-purple-600 shadow-sm transition-all duration-200 ease-out'
                  />
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setSortBy(option.key)}
                      className={cn(
                        'relative z-10 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
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

      {/* Budget List */}
      <div className='-mx-3 sm:mx-0'>
        <Card
          className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
          data-onboarding='budget-list'
        >
          <CardHeader>
            <CardTitle className='text-base sm:text-lg'>
              {t.budgets.yourBudgets}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='space-y-4'>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className='h-20' />
                ))}
              </div>
            ) : filteredSortedBudgets.length > 0 ? (
              <div className='space-y-0 sm:space-y-4'>
                {filteredSortedBudgets.map((budget, budgetIndex) => {
                  const categoryInfo = getCategoryInfo(budget.categoryId);
                  const isEditing = editingId === budget.id;
                  const isFirstBudget = budgetIndex === 0;

                  return (
                    <div
                      key={budget.id}
                      className={cn(
                        'group border-x-0 border-b-0 border-t bg-card p-4 sm:rounded-lg sm:border',
                        !isEditing &&
                          'cursor-pointer transition-colors hover:bg-muted/50'
                      )}
                      onClick={() => {
                        if (!isEditing && budget.categoryId) {
                          // Clear all other filters and set only the category
                          setTransactionType('all');
                          clearOpposingAccountFilters();
                          setCategories([budget.categoryId]);
                          navigate('/transactions/');
                        }
                      }}
                      {...(isFirstBudget
                        ? { 'data-onboarding': 'budget-view-transactions' }
                        : {})}
                    >
                      <div className='mb-3 flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          {/* Category icon with color like Categories page */}
                          <div
                            className='flex h-10 w-10 items-center justify-center rounded-lg border border-border text-lg'
                            style={{
                              backgroundColor: colorWithOpacity(
                                budget.categoryColor
                              ),
                              color: budget.categoryColor || '#3B82F6',
                            }}
                          >
                            {categoryInfo?.icon ||
                              budget.categoryIcon ||
                              (budget.categoryId ? '📦' : '💰')}
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>
                              {budget.categoryName || t.budgets.totalBudget}
                            </span>
                            {/* Navigate icon on hover */}
                            {!isEditing && budget.categoryId && (
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className='inline-flex'>
                                      <ExternalLink className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t.budgets.viewTransactions ||
                                      'View transactions'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          {isEditing ? (
                            <>
                              <Input
                                type='number'
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className='h-8 w-24'
                                onClick={(e) => e.stopPropagation()}
                              />
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size='icon'
                                      variant='ghost'
                                      className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveEditing();
                                      }}
                                    >
                                      <Check className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t.common.save}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size='icon'
                                      variant='ghost'
                                      className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditing();
                                      }}
                                    >
                                      <X className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t.common.cancel}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <>
                              <span className='text-sm text-muted-foreground'>
                                {(budget.percentage ?? 0).toFixed(0)}%
                              </span>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(budget);
                                }}
                                {...(isFirstBudget
                                  ? { 'data-onboarding': 'budget-edit' }
                                  : {})}
                              >
                                <Pencil className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='rounded-md text-destructive transition-colors hover:bg-red-600 hover:text-white dark:hover:bg-red-700'
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const isConfirmed = await confirm({
                                    title:
                                      t.budgets.deleteBudget || 'Delete budget',
                                    message: t.budgets.confirmDelete,
                                    variant: 'danger',
                                  });
                                  if (isConfirmed) {
                                    deleteMutation.mutate(budget.id);
                                  }
                                }}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <Progress
                        value={Math.min(budget.percentage, 100)}
                        className='mb-2 h-2'
                        data-onboarding='budget-progress-bar'
                        indicatorClassName={cn(
                          budget.percentage > 100
                            ? 'bg-destructive'
                            : budget.percentage > 80
                              ? 'bg-yellow-500'
                              : 'bg-primary'
                        )}
                      />
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          {t.budgets.spent}: {formatCurrency(budget.spent)}
                        </span>
                        <span
                          className={cn(
                            budget.remaining < 0
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                          )}
                        >
                          {budget.remaining >= 0
                            ? `${t.budgets.remaining}: ${formatCurrency(
                                budget.remaining
                              )}`
                            : `${t.budgets.over}: ${formatCurrency(
                                Math.abs(budget.remaining)
                              )}`}
                        </span>
                        <span className='font-medium'>
                          {t.budgets.budget}: {formatCurrency(budget.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : budgets && budgets.length > 0 ? (
              <div className='py-8 text-center text-muted-foreground'>
                <p className='font-medium'>
                  {t.addressBook?.noResults || 'No results found'}
                </p>
                <p className='mt-1 text-sm'>
                  {t.addressBook?.tryDifferentSearch ||
                    'Try a different search term'}
                </p>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 text-center'>
                <PiggyBank className='mb-4 h-12 w-12 text-muted-foreground/50' />
                <h3 className='text-lg font-medium text-muted-foreground'>
                  {t.budgets.noBudgets}
                </h3>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {t.budgets.createFirst}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
