import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SharedIban } from '@fluxby/shared';

export function useSharedIbans() {
  const { activeProfileId } = useProfile();
  const { t } = useLanguage();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: sharedIbans = [], isLoading } = useQuery<SharedIban[]>({
    queryKey: ['sharedIbans', activeProfileId],
    queryFn: () => api.getSharedIbans() as Promise<SharedIban[]>,
    enabled: !!activeProfileId,
  });

  const detectSharedMutation = useMutation({
    mutationFn: api.detectSharedIbans,
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });

      const data = result as { detected?: number; addedToShared?: number };
      const detectedCount = data.detected || 0;
      const addedCount = data.addedToShared || 0;

      if (addedCount > 0) {
        toast.success(
          (
            t.addressBook?.sharedIbansDetected ||
            '{added} shared IBANs added ({detected} detected)'
          )
            .replace('{added}', String(addedCount))
            .replace('{detected}', String(detectedCount))
        );
      } else if (detectedCount > 0) {
        toast.info(
          (
            t.addressBook?.sharedIbansDetected ||
            '{added} shared IBANs ({detected} detected)'
          )
            .replace('{added}', '0')
            .replace('{detected}', String(detectedCount))
        );
      } else {
        toast.info(
          t.addressBook?.noSharedIbansFound || 'No shared IBANs found'
        );
      }
    },
  });

  const markAsSharedMutation = useMutation({
    mutationFn: ({
      iban,
      providerName,
    }: {
      iban: string;
      providerName?: string;
    }) => api.markIbanAsShared(iban, providerName),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
      queryClient.invalidateQueries({
        queryKey: ['addressbook', activeProfileId],
      });
    },
  });

  const removeSharedMutation = useMutation({
    mutationFn: api.removeSharedIban,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['sharedIbans', activeProfileId],
      });
    },
  });

  const resolveSharedMutation = useMutation({
    mutationFn: (data: {
      iban: string;
      name: string;
      originalNames: string[];
      contactId?: string;
    }) =>
      api.resolveSharedIban(
        data.iban,
        data.name,
        data.originalNames,
        data.contactId
      ),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['addressbook', activeProfileId],
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: ['sharedIbans', activeProfileId],
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: ['transactions', activeProfileId],
          refetchType: 'active',
        }),
      ]);

      const data = result as { data?: { transactionsUpdated?: number } };
      toast.success(
        (
          t.addressBook?.contactAddedTransactionsUpdated ||
          'Contact added, {count} transactions updated'
        ).replace('{count}', String(data.data?.transactionsUpdated || 0))
      );
    },
    onError: (error: Error) => {
      if (error.message.includes('already exists')) {
        toast.error(
          t.addressBook?.contactAlreadyExists ||
            'Contact with this IBAN already exists'
        );
      } else {
        toast.error(
          t.addressBook?.errorAddingContact || 'Error adding contact'
        );
      }
    },
  });

  const addIbanToContactMutation = useMutation({
    mutationFn: ({ contactId, iban }: { contactId: string; iban: string }) =>
      api.addContactIban(contactId, iban),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['addressbook', activeProfileId],
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: ['topAccounts', activeProfileId],
          exact: false,
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: ['sharedIbans', activeProfileId],
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: ['transactions', activeProfileId],
          refetchType: 'active',
        }),
      ]);
      toast.success(
        t.addressBook?.assignedToContact || 'IBAN assigned to contact'
      );
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Error assigning IBAN'),
  });

  return {
    sharedIbans,
    isLoading,
    detectSharedMutation,
    markAsSharedMutation,
    removeSharedMutation,
    resolveSharedMutation,
    addIbanToContactMutation,
  };
}
