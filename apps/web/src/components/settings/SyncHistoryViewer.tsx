/**
 * Sync History Viewer
 * User-facing component to view sync events and conflict resolutions
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Trash2,
  Plus,
  Pencil,
  Trash,
  AlertTriangle,
  Clock,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDataService } from '@/contexts/DatabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface SyncHistoryEntry {
  id: string;
  tableName: string;
  rowId: string;
  action: 'create' | 'update' | 'delete' | 'conflict';
  localUpdatedAt: number | null;
  remoteUpdatedAt: number | null;
  resolution: string | null;
  errorMessage: string | null;
  createdAt: number;
}

interface SyncHistoryStats {
  creates: number;
  updates: number;
  deletes: number;
  conflicts: number;
  total: number;
}

interface SyncHistoryViewerProps {
  onClose?: () => void;
}

export function SyncHistoryViewer({ onClose }: SyncHistoryViewerProps) {
  const dataService = useDataService();
  const { t } = useLanguage();
  const toast = useToast();

  const [entries, setEntries] = useState<SyncHistoryEntry[]>([]);
  const [stats, setStats] = useState<SyncHistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Load sync history
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        dataService.getSyncHistory(100),
        dataService.getSyncHistoryStats(),
      ]);
      setEntries(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load sync history:', error);
      toast.error(
        t.settings?.sync?.syncHistoryLoadError || 'Failed to load sync history'
      );
    } finally {
      setIsLoading(false);
    }
  }, [dataService, toast, t.settings?.sync?.syncHistoryLoadError]);

  // Initial load
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Clear history
  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await dataService.clearSyncHistory();
      setEntries([]);
      setStats({ creates: 0, updates: 0, deletes: 0, conflicts: 0, total: 0 });
      setClearDialogOpen(false);
      toast.success(
        t.settings?.sync?.syncHistoryCleared || 'Sync history cleared'
      );
    } catch (error) {
      console.error('Failed to clear sync history:', error);
      toast.error(
        t.settings?.sync?.syncHistoryClearError ||
          'Failed to clear sync history'
      );
    } finally {
      setIsClearing(false);
    }
  };

  // Format table name for display
  const formatTableName = (tableName: string): string => {
    const tableNames: Record<string, string> = {
      transactions: t.nav?.transactions || 'Transactions',
      accounts: t.settings?.accounts?.title || 'Accounts',
      categories: t.nav?.categories || 'Categories',
      budgets: t.nav?.budgets || 'Budgets',
      profiles: t.settings?.profileManager?.title || 'Profiles',
      category_rules: t.categories?.rules || 'Category Rules',
      address_book: t.addressBook?.title || 'Address Book',
      recurring_patterns: t.nav?.subscriptions || 'Recurring Patterns',
    };
    return tableNames[tableName] || tableName;
  };

  // Get action icon
  const ActionIcon = ({ action }: { action: SyncHistoryEntry['action'] }) => {
    switch (action) {
      case 'create':
        return <Plus className='h-4 w-4 text-green-500' />;
      case 'update':
        return <Pencil className='h-4 w-4 text-blue-500' />;
      case 'delete':
        return <Trash className='h-4 w-4 text-red-500' />;
      case 'conflict':
        return <AlertTriangle className='h-4 w-4 text-amber-500' />;
    }
  };

  // Get action badge
  const getActionBadge = (action: SyncHistoryEntry['action']) => {
    const variants: Record<SyncHistoryEntry['action'], string> = {
      create:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      update:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      conflict:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    };
    const labels: Record<SyncHistoryEntry['action'], string> = {
      create: t.settings?.sync?.actionCreate || 'Created',
      update: t.settings?.sync?.actionUpdate || 'Updated',
      delete: t.settings?.sync?.actionDelete || 'Deleted',
      conflict: t.settings?.sync?.actionConflict || 'Conflict',
    };
    return (
      <Badge
        variant='outline'
        className={cn('text-xs font-medium', variants[action])}
      >
        {labels[action]}
      </Badge>
    );
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} ${t.common?.days || 'days'} ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className='border-border bg-card'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <History className='h-5 w-5' />
            {t.settings?.sync?.syncHistory || 'Sync history'}
          </CardTitle>
          <CardDescription>
            {t.settings?.sync?.syncHistoryDescription ||
              'View recent sync events and conflict resolutions'}
          </CardDescription>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={loadHistory}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          {onClose && (
            <Button variant='ghost' size='sm' onClick={onClose}>
              {t.common?.close || 'Close'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Stats summary */}
        {stats && stats.total > 0 && (
          <div className='flex flex-wrap gap-4 rounded-lg bg-muted/50 p-3'>
            <div className='flex items-center gap-2'>
              <Plus className='h-4 w-4 text-green-500' />
              <span className='text-sm text-muted-foreground'>
                {stats.creates} {t.settings?.sync?.created || 'created'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Pencil className='h-4 w-4 text-blue-500' />
              <span className='text-sm text-muted-foreground'>
                {stats.updates} {t.settings?.sync?.updated || 'updated'}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Trash className='h-4 w-4 text-red-500' />
              <span className='text-sm text-muted-foreground'>
                {stats.deletes} {t.settings?.sync?.deleted || 'deleted'}
              </span>
            </div>
            {stats.conflicts > 0 && (
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4 text-amber-500' />
                <span className='text-sm text-amber-600 dark:text-amber-400'>
                  {stats.conflicts} {t.settings?.sync?.conflicts || 'conflicts'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* History list */}
        <ScrollArea className='h-[300px]'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8 text-muted-foreground'>
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
              {t.common?.loading || 'Loading...'}
            </div>
          ) : entries.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-muted-foreground'>
              <History className='mb-2 h-8 w-8 opacity-50' />
              <p>{t.settings?.sync?.noSyncHistory || 'No sync history yet'}</p>
              <p className='mt-1 text-xs'>
                {t.settings?.sync?.syncHistoryHint ||
                  'Sync events will appear here when you sync with other devices'}
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className='rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-center gap-2'>
                      <ActionIcon action={entry.action} />
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-medium'>
                            {formatTableName(entry.tableName)}
                          </span>
                          {getActionBadge(entry.action)}
                        </div>
                        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                          <Clock className='h-3 w-3' />
                          {formatTime(entry.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-6 w-6 p-0'
                      onClick={() =>
                        setShowDetails(
                          showDetails === entry.id ? null : entry.id
                        )
                      }
                    >
                      {showDetails === entry.id ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </Button>
                  </div>

                  {/* Expanded details */}
                  {showDetails === entry.id && (
                    <div className='mt-2 space-y-1 border-t border-muted pt-2 text-xs'>
                      <div className='flex justify-between text-muted-foreground'>
                        <span>ID:</span>
                        <span className='font-mono'>
                          {entry.rowId.slice(0, 8)}...
                        </span>
                      </div>
                      {entry.resolution && (
                        <div className='flex justify-between text-muted-foreground'>
                          <span>
                            {t.settings?.sync?.resolution || 'Resolution'}:
                          </span>
                          <span>{entry.resolution}</span>
                        </div>
                      )}
                      {entry.errorMessage && (
                        <div className='mt-1 rounded bg-red-100 p-2 text-red-700 dark:bg-red-900/30 dark:text-red-400'>
                          {entry.errorMessage}
                        </div>
                      )}
                      {entry.localUpdatedAt && entry.remoteUpdatedAt && (
                        <div className='text-muted-foreground'>
                          <div className='flex justify-between'>
                            <span>
                              {t.settings?.sync?.localTime || 'Local'}:
                            </span>
                            <span>
                              {new Date(entry.localUpdatedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span>
                              {t.settings?.sync?.remoteTime || 'Remote'}:
                            </span>
                            <span>
                              {new Date(entry.remoteUpdatedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Clear history button */}
        {entries.length > 0 && (
          <div className='flex justify-end border-t border-border pt-4'>
            <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm' disabled={isClearing}>
                  <Trash2 className='mr-2 h-4 w-4' />
                  {t.settings?.sync?.clearHistory || 'Clear history'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t.settings?.sync?.clearHistoryTitle ||
                      'Clear sync history?'}
                  </DialogTitle>
                  <DialogDescription>
                    {t.settings?.sync?.clearHistoryDescription ||
                      'This will remove all sync history records. Your synced data will not be affected.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setClearDialogOpen(false)}
                  >
                    {t.common?.cancel || 'Cancel'}
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={handleClearHistory}
                    disabled={isClearing}
                  >
                    {t.common?.delete || 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
