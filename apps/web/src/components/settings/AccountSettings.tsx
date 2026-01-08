import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  Edit2,
  Wallet,
  CreditCard,
  PiggyBank,
  Check,
  X,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConfirm, type ConfirmOptions } from '@/contexts/ConfirmContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useProfile } from '@/contexts/ProfileContext';
import { Currency } from '@/components/ui/currency';
import type { TranslationKeys } from '@/lib/i18n';

// Types
interface Account {
  id: string;
  iban: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  bank: string;
  currentBalance: number;
  balance: number;
  createdAt: string;
}

// Sortable Account Item Component
interface SortableAccountItemProps {
  account: Account;
  editingId: string | null;
  editName: string;
  editType: 'checking' | 'savings' | 'credit';
  editBalance: string;
  setEditName: (value: string) => void;
  setEditType: (value: 'checking' | 'savings' | 'credit') => void;
  setEditBalance: (value: string) => void;
  setEditingId: (value: string | null) => void;
  handleUpdate: () => void;
  deleteMutation: { mutate: (id: string) => void; isPending: boolean };
  getAccountIcon: (type: string, balance?: number) => React.ReactElement;
  getAccountTypeLabel: (type: string) => string;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  t: {
    settings: {
      accounts: {
        types: {
          checking: string;
          savings: string;
          credit: string;
        };
        title: string;
        currentBalance: string;
        deleteConfirm: string;
        deleteAccountTitle?: string;
      };
    };
    common: {
      delete: string;
      edit: string;
    };
  };
  ACCOUNT_TYPES: Array<{
    value: string;
    label: string;
    icon: React.ElementType;
  }>;
}

const SortableAccountItem = React.memo(function SortableAccountItem({
  account,
  editingId,
  editName,
  editType,
  editBalance,
  setEditName,
  setEditType,
  setEditBalance,
  setEditingId,
  handleUpdate,
  deleteMutation,
  getAccountIcon,
  getAccountTypeLabel,
  confirm,
  t,
  ACCOUNT_TYPES,
}: SortableAccountItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col items-start gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {editingId === account.id ? (
        <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-center'>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className='flex-1'
            placeholder='Account name'
          />
          <Select
            value={editType}
            onValueChange={(v) => setEditType(v as typeof editType)}
          >
            <SelectTrigger className='w-full sm:w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type='number'
            step='0.01'
            value={editBalance}
            onChange={(e) => setEditBalance(e.target.value)}
            placeholder='Balance'
            className='w-full sm:w-32'
          />
          <div className='flex gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    onClick={handleUpdate}
                    className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                  >
                    <Check className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <p>{(t.common as any)?.save || 'Opslaan'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    onClick={() => setEditingId(null)}
                    className='h-8 w-8 rounded-full hover:bg-purple-600 hover:text-white'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <p>{(t.common as any)?.cancel || 'Annuleren'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ) : (
        <>
          <div className='flex w-full items-center gap-3 sm:w-auto'>
            <button
              className='cursor-grab rounded p-1 hover:bg-muted active:cursor-grabbing'
              {...attributes}
              {...listeners}
            >
              <GripVertical className='h-4 w-4 text-muted-foreground' />
            </button>
            <div
              className={`rounded-lg p-2 ${
                account.type === 'checking'
                  ? account.currentBalance >= 0
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950'
                    : 'bg-red-50 text-red-600 dark:bg-red-950'
                  : account.type === 'savings'
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950'
                    : 'bg-gray-50 text-gray-600 dark:bg-gray-950'
              }`}
            >
              {getAccountIcon(account.type, account.currentBalance)}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium'>{account.name}</p>
              <p className='truncate text-sm text-muted-foreground'>
                {account.iban} • {getAccountTypeLabel(account.type)}
              </p>
            </div>
          </div>
          <div className='flex w-full items-center justify-between gap-4 sm:w-auto'>
            <div className='text-left sm:text-right'>
              <p className='text-lg font-semibold'>
                <Currency amount={account.currentBalance} />
              </p>
              <p className='text-xs text-muted-foreground'>
                {t.settings.accounts.currentBalance}
              </p>
            </div>
            <div className='flex gap-1'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='rounded-md transition-colors hover:bg-purple-600 hover:text-white'
                      onClick={() => {
                        setEditName(account.name);
                        setEditType(account.type);
                        setEditBalance(account.currentBalance.toString());
                        setEditingId(account.id);
                      }}
                    >
                      <Edit2 className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p>{(t.common as any)?.edit || 'Bewerken'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='rounded-md text-destructive transition-colors hover:bg-red-600 hover:text-white dark:hover:bg-red-700'
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          title:
                            t.settings.accounts.deleteAccountTitle ||
                            'Delete account',
                          message: t.settings.accounts.deleteConfirm,
                          variant: 'danger',
                        });
                        if (isConfirmed) {
                          deleteMutation.mutate(account.id);
                        }
                      }}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p>{(t.common as any)?.delete || 'Verwijderen'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

export function AccountSettings() {
  const { t } = useLanguage() as {
    t: TranslationKeys;
    language: string;
    setLanguage: (lang: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    languages: any;
  };
  const { activeProfileId } = useProfile();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [newIban, setNewIban] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'checking' | 'savings' | 'credit'>(
    'checking'
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'checking' | 'savings' | 'credit'>(
    'checking'
  );
  const [editBalance, setEditBalance] = useState('');
  const [accountOrder, setAccountOrder] = useState<string[]>([]);
  const [orderNotice, setOrderNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!orderNotice) return;
    const t = setTimeout(() => setOrderNotice(null), 3500);
    return () => clearTimeout(t);
  }, [orderNotice]);

  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['accounts', activeProfileId],
    queryFn: () => api.getAccounts() as Promise<Account[]>,
  });

  const ACCOUNT_TYPES = useMemo(
    () => [
      {
        value: 'checking',
        label: t.settings.accounts.types.checking,
        icon: Wallet,
      },
      {
        value: 'savings',
        label: t.settings.accounts.types.savings,
        icon: PiggyBank,
      },
      {
        value: 'credit',
        label: t.settings.accounts.types.credit,
        icon: CreditCard,
      },
    ],
    [t]
  );

  const getAccountIcon = useCallback(
    (type: string, balance?: number) => {
      const typeInfo = ACCOUNT_TYPES.find((t) => t.value === type);
      const Icon = typeInfo?.icon || Wallet;
      if (type === 'checking' && balance !== undefined) {
        const isPositive = balance >= 0;
        const colorClass = isPositive ? 'text-emerald-600' : 'text-red-600';
        return <Icon className={`h-5 w-5 ${colorClass}`} />;
      }
      return <Icon className='h-5 w-5' />;
    },
    [ACCOUNT_TYPES]
  );

  const getAccountTypeLabel = useCallback(
    (type: string) => {
      return ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;
    },
    [ACCOUNT_TYPES]
  );

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      setAccountOrder(accounts.map((account) => account.id));
    }
  }, [accounts]);

  const updateOrderMutation = useMutation({
    mutationFn: async (accountIds: string[]) => {
      return await api.updateAccountOrder(
        accountIds.map((id, idx) => ({ id, order: idx }))
      );
    },
    onMutate: async (newOrder: string[]) => {
      await queryClient.cancelQueries({
        queryKey: ['accounts', activeProfileId],
      });
      const previous = queryClient.getQueryData<Account[]>([
        'accounts',
        activeProfileId,
      ]);
      if (previous) {
        const map = new Map(previous.map((a) => [a.id, a]));
        const reordered = newOrder
          .map((id) => map.get(id))
          .filter(Boolean) as Account[];
        const missing = previous.filter((a) => !newOrder.includes(a.id));
        queryClient.setQueryData(
          ['accounts', activeProfileId],
          [...reordered, ...missing]
        );
      }
      setAccountOrder(newOrder);
      return { previous };
    },
    onError: (_err, _newOrder, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ['accounts', activeProfileId],
          context.previous
        );
        setAccountOrder(context.previous.map((a) => a.id));
      }
      setOrderNotice({
        type: 'error',
        text: t.settings.accounts.orderSaveError,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      });
    },
    onSuccess: () => {
      setOrderNotice({ type: 'success', text: t.settings.accounts.orderSaved });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const fromIndex = accountOrder.indexOf(activeId);
    const toIndex = accountOrder.indexOf(overId);

    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = arrayMove(accountOrder, fromIndex, toIndex);
    setAccountOrder(newOrder);
    updateOrderMutation.mutate(newOrder);
  };

  const createMutation = useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      });
      setNewIban('');
      setNewName('');
      setNewType('checking');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; type?: string; currentBalance?: number };
    }) => api.updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['accounts', activeProfileId],
      }); // Clear form after successful creation
      setNewIban('');
      setNewName('');
      setNewType('checking');
    },
  });

  const handleCreate = () => {
    if (!newIban.trim() || !newName.trim()) return;
    createMutation.mutate({
      iban: newIban.trim(),
      name: newName.trim(),
      type: newType,
    });
  };

  const handleUpdate = () => {
    if (editingId === null) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editName,
        type: editType,
        currentBalance: parseFloat(editBalance) || 0,
      },
    });
  };

  return (
    <div className='-mx-3 sm:mx-0'>
      <Card
        className='rounded-none border-x-0 shadow-none sm:rounded-2xl sm:border-x sm:shadow-sm'
        data-onboarding='settings-accounts'
      >
        <CardHeader className='px-3 py-3 sm:px-6 sm:py-4'>
          <CardTitle className='text-base sm:text-lg'>
            {t.settings.accounts.title}
          </CardTitle>
          <CardDescription className='text-xs sm:text-sm'>
            {t.settings.accounts.description}
          </CardDescription>
        </CardHeader>
        <CardContent className='px-3 pt-0 pb-3 sm:px-6 sm:pt-0 sm:pb-6'>
          {orderNotice && (
            <div
              className={`mb-4 rounded border px-3 py-2 text-sm ${
                orderNotice.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-rose-300 bg-rose-50 text-rose-800'
              }`}
            >
              {orderNotice.text}
            </div>
          )}

          {isLoading ? (
            <div className='space-y-3'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Existing Accounts */}
              {accounts && accounts.length > 0 && (
                <div className='space-y-3'>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={accountOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      {accountOrder.map((accountId) => {
                        const account = accounts.find(
                          (a) => a.id === accountId
                        );
                        if (!account) return null;

                        return (
                          <SortableAccountItem
                            key={account.id}
                            account={account}
                            editingId={editingId}
                            editName={editName}
                            editType={editType}
                            editBalance={editBalance}
                            setEditName={setEditName}
                            setEditType={setEditType}
                            setEditBalance={setEditBalance}
                            setEditingId={setEditingId}
                            handleUpdate={handleUpdate}
                            deleteMutation={deleteMutation}
                            getAccountIcon={getAccountIcon}
                            getAccountTypeLabel={getAccountTypeLabel}
                            confirm={confirm}
                            t={t}
                            ACCOUNT_TYPES={ACCOUNT_TYPES}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* New Account Form (always visible) */}
              <div className='border-t pt-4'>
                <p className='mb-3 text-sm font-medium'>
                  {t.settings.accounts.addTitle}
                </p>
                <div className='flex gap-2'>
                  <Input
                    placeholder={t.settings.accounts.ibanPlaceholder}
                    value={newIban}
                    onChange={(e) =>
                      setNewIban(
                        e.target.value.toUpperCase().replace(/\s/g, '')
                      )
                    }
                    className='flex-1'
                  />
                  <Input
                    placeholder={t.settings.accounts.namePlaceholder}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value.trim())}
                    className='flex-1'
                  />
                  <Select
                    value={newType}
                    onValueChange={(v) => setNewType(v as typeof newType)}
                  >
                    <SelectTrigger className='w-40'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleCreate}
                    disabled={
                      createMutation.isPending ||
                      !newIban.trim() ||
                      !newName.trim()
                    }
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    {t.settings.accounts.add}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
