import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMemo } from 'react';
import type { AddressBookEntry, SharedIban } from '@fluxby/shared';

// Extend AddressBookEntry with stats returned by the API
export interface AddressBookEntryWithStats extends AddressBookEntry {
  transactionCount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netAmount?: number;
  lastTransactionDate?: string | null;
  knownProviderName?: string | null;
  isMerged?: boolean;
}

export interface CleanupRule {
  id: string;
  pattern: string;
  isActive: boolean;
  createdAt: string;
}

export interface TopAccount {
  iban: string;
  name: string;
  description: string | null;
  isInAddressBook: boolean;
  addressBookId: string | null;
  transactionCount: number;
  totalAmount: number;
  netAmount: number;
}

export function useAddressBook(options: { enabled?: boolean } = {}) {
  const { activeProfileId } = useProfile();
  const { t } = useLanguage();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: addressBook, isLoading: loadingAddressBook } = useQuery<
    AddressBookEntryWithStats[]
  >({
    queryKey: ['addressbook', activeProfileId],
    queryFn: () => api.getAddressBook() as Promise<AddressBookEntryWithStats[]>,
    enabled: !!activeProfileId && (options.enabled ?? true),
    staleTime: 10 * 60 * 1000, // 10 minutes - address book data rarely changes, only after imports
  });

  const { data: cleanupRules, isLoading: loadingCleanupRules } = useQuery<
    CleanupRule[]
  >({
    queryKey: ['cleanupRules', activeProfileId],
    queryFn: () => api.getCleanupRules() as Promise<CleanupRule[]>,
    enabled: !!activeProfileId && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes - cleanup rules rarely change
  });

  // Use optimized getSuggestedContacts that only queries non-addressbook IBANs
  const { data: suggestedContactsData, isLoading: loadingTopAccounts } =
    useQuery<
      Array<{
        iban: string;
        name: string;
        transactionCount: number;
        totalAmount: number;
        netAmount: number;
      }>
    >({
      queryKey: ['suggestedContacts', activeProfileId],
      queryFn: () => api.getSuggestedContacts(100),
      enabled: !!activeProfileId && (options.enabled ?? true),
      staleTime: 10 * 60 * 1000, // 10 minutes - suggested contacts rarely change
    });

  const { data: sharedIbans = [] } = useQuery<SharedIban[]>({
    queryKey: ['sharedIbans', activeProfileId],
    queryFn: () => api.getSharedIbans() as Promise<SharedIban[]>,
    enabled: !!activeProfileId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Filter out shared IBANs from suggested contacts
  const suggestedContacts = useMemo(() => {
    if (!suggestedContactsData) return [];
    const sharedIbanSet = new Set(sharedIbans.map((s) => s.iban));
    return suggestedContactsData.filter(
      (account) => !sharedIbanSet.has(account.iban)
    );
  }, [suggestedContactsData, sharedIbans]);

  const createContactMutation = useMutation({
    mutationFn: api.createAddressBookEntry,
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['addressbook', activeProfileId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['suggestedContacts', activeProfileId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['topAccounts', activeProfileId],
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: ['transactions', activeProfileId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['sharedIbans', activeProfileId],
        }),
      ]);

      const mergedResult = result as
        | { merged?: boolean; mergeReason?: 'name' | 'iban' }
        | undefined;
      if (mergedResult?.merged) {
        if (mergedResult.mergeReason === 'name') {
          toast.info(
            t.addressBook?.ibanAddedToMatchingName ||
              'IBAN added to contact with matching name'
          );
        } else {
          toast.info(
            t.addressBook?.ibanAddedToExisting ||
              'IBAN added to existing contact'
          );
        }
      } else {
        toast.success(t.addressBook?.contactAdded || 'Contact added');
      }
    },
    onError: (error: Error) => {
      toast.error(
        error.message ||
          t.addressBook?.createError ||
          'Failed to create contact'
      );
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; description?: string };
    }) => api.updateAddressBookEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['suggestedContacts', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      toast.success(t.addressBook?.contactUpdated || 'Contact updated');
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to update contact'),
  });

  const deleteContactMutation = useMutation({
    mutationFn: api.deleteAddressBookEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['suggestedContacts', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      toast.success(t.addressBook?.contactDeleted || 'Contact deleted');
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to delete contact'),
  });

  const createRuleMutation = useMutation({
    mutationFn: api.createCleanupRule,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['cleanupRules', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });

      const data = result as {
        data?: { addressBookUpdated?: number; transactionsUpdated?: number };
      };
      const addressBookCount = data?.data?.addressBookUpdated || 0;
      const transactionsCount = data?.data?.transactionsUpdated || 0;
      const total = addressBookCount + transactionsCount;
      if (total > 0) {
        toast.success(
          (
            t.addressBook?.ruleAppliedAuto ||
            'Rule added and applied: {addressBook} contacts, {transactions} transactions updated'
          )
            .replace('{addressBook}', String(addressBookCount))
            .replace('{transactions}', String(transactionsCount))
        );
      } else {
        toast.success(t.addressBook?.ruleAdded || 'Cleanup rule added');
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || '';
      if (
        errorMessage.includes('409') ||
        errorMessage.includes('already exists')
      ) {
        toast.warning(t.addressBook?.ruleExists || 'Rule already exists');
      } else {
        toast.error(errorMessage || 'Failed to create rule');
      }
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: api.deleteCleanupRule,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cleanupRules', activeProfileId],
      });
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Failed to delete rule'),
  });

  const applyRulesMutation = useMutation({
    mutationFn: api.applyCleanupRules,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['topAccounts', activeProfileId],
        exact: false,
      });
      toast.info(
        t.addressBook?.namesUpdatedInAddressBook ||
          'Cleanup rules applied to address book'
      );
    },
  });

  const mergeContactsMutation = useMutation({
    mutationFn: ({
      contactIds,
      name,
    }: {
      contactIds: string[];
      name?: string;
    }) => api.mergeContacts(contactIds, name),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['transactions', activeProfileId],
      });
      toast.success(
        t.addressBook?.contactsMerged || 'Contacts merged successfully'
      );
    },
    onError: (error: Error) =>
      toast.error(
        error.message ||
          t.addressBook?.errorMergingContacts ||
          'Error merging contacts'
      ),
  });

  return useMemo(
    () => ({
      addressBook,
      cleanupRules,
      suggestedContacts,
      isLoading:
        loadingAddressBook || loadingCleanupRules || loadingTopAccounts,
      createContactMutation,
      updateContactMutation,
      deleteContactMutation,
      createRuleMutation,
      deleteRuleMutation,
      applyRulesMutation,
      mergeContactsMutation,
      getContactById: (id: string) => addressBook?.find((c) => c.id === id),
      getContactByIban: (iban: string) =>
        addressBook?.find((c) => c.iban === iban || c.ibans?.includes(iban)),
    }),
    [
      addressBook,
      cleanupRules,
      suggestedContacts,
      loadingAddressBook,
      loadingCleanupRules,
      loadingTopAccounts,
      createContactMutation,
      updateContactMutation,
      deleteContactMutation,
      createRuleMutation,
      deleteRuleMutation,
      applyRulesMutation,
      mergeContactsMutation,
    ]
  );
}
