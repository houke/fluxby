import React from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CleanupRule } from '@fluxby/shared';

interface CleanupRulesManagerProps {
  cleanupRules: CleanupRule[] | undefined;
  newRulePattern: string;
  setNewRulePattern: (pattern: string) => void;
  onCreateRule: (pattern: string) => void;
  onDeleteRule: (ruleId: string) => void;
  onApplyToAddressBook: () => void;
  onApplyToTransactions: () => void;
  isCreatePending: boolean;
  isDeletePending: boolean;
  isApplyAddressBookPending: boolean;
  isApplyTransactionsPending: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  translations: any;
}

export const CleanupRulesManager: React.FC<CleanupRulesManagerProps> = ({
  cleanupRules,
  newRulePattern,
  setNewRulePattern,
  onCreateRule,
  onDeleteRule,
  onApplyToAddressBook,
  onApplyToTransactions,
  isCreatePending,
  isDeletePending,
  isApplyAddressBookPending,
  isApplyTransactionsPending,
  translations: t,
}) => {
  return (
    <Card data-onboarding='cleanup-rules-card'>
      <CardHeader>
        <CardTitle>
          {t.addressBook?.cleanupRules || 'Name cleanup rules'}
        </CardTitle>
        <CardHeader className='p-0'>
          <CardDescription>
            {t.addressBook?.cleanupRulesDescription ||
              'Text parts that are automatically removed from account names.'}
          </CardDescription>
        </CardHeader>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Add new rule */}
        <div className='flex gap-2'>
          <Input
            placeholder={
              t.addressBook?.patternPlaceholder || 'Text to remove...'
            }
            value={newRulePattern}
            onChange={(e) => setNewRulePattern(e.target.value)}
            className='flex-1'
          />
          <Button
            onClick={() => onCreateRule(newRulePattern)}
            disabled={!newRulePattern.trim() || isCreatePending}
          >
            <Plus className='mr-2 h-4 w-4' />
            {t.common.add}
          </Button>
        </div>

        {/* Existing rules */}
        <div className='space-y-2'>
          {cleanupRules?.map((rule) => (
            <div
              key={rule.id}
              className='flex items-center justify-between rounded-md bg-muted/50 p-2'
            >
              <code className='text-sm'>{rule.pattern}</code>
              <Button
                variant='ghost'
                size='icon'
                className='rounded-md transition-colors hover:bg-red-600 hover:text-white dark:hover:bg-red-700'
                onClick={() => onDeleteRule(rule.id)}
                disabled={isDeletePending}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          ))}
          {(!cleanupRules || cleanupRules.length === 0) && (
            <p className='py-2 text-center text-sm text-muted-foreground'>
              {t.addressBook?.noRulesDefined || 'No rules defined'}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className='flex flex-wrap gap-2 border-t pt-2'>
          <Button
            variant='outline'
            onClick={onApplyToAddressBook}
            disabled={isApplyAddressBookPending}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                isApplyAddressBookPending && 'animate-spin'
              )}
            />
            {t.addressBook?.applyToAddressBook || 'Apply to address book'}
          </Button>
          <Button
            variant='outline'
            onClick={onApplyToTransactions}
            disabled={isApplyTransactionsPending}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                isApplyTransactionsPending && 'animate-spin'
              )}
            />
            {t.addressBook?.applyToTransactions || 'Apply to transactions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
