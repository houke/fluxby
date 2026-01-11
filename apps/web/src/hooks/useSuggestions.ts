import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import type { Transaction } from '@fluxby/shared';

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason?: string;
}

export function useSuggestions(transactions: Transaction[] | undefined) {
  const [suggestions, setSuggestions] = useState<
    Record<string, CategorySuggestion>
  >({});
  const suggestionsCache = useRef<Map<string, CategorySuggestion | null>>(
    new Map()
  );
  const lastFetchRef = useRef<number>(0);
  const lastTransactionsLengthRef = useRef<number>(0);

  useEffect(() => {
    if (!transactions) return;

    // Skip if transactions length hasn't changed significantly
    const currentLength = transactions.length;
    if (
      lastTransactionsLengthRef.current === currentLength &&
      currentLength > 0
    ) {
      return;
    }
    lastTransactionsLengthRef.current = currentLength;

    // Prevent rapid re-fetching (minimum 2 second gap between fetches)
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return;

    const uncategorized = transactions.filter(
      (tx) => !tx.categoryId && tx.merchantName
    );

    // Build initial suggestions from cache
    const newSuggestions: Record<string, CategorySuggestion> = {};
    const merchantsToFetch: Array<{ txId: string; merchantName: string }> = [];

    // Only process first 10 uncategorized transactions to reduce API calls
    for (const tx of uncategorized.slice(0, 10)) {
      if (!tx.merchantName) continue;

      const cached = suggestionsCache.current.get(tx.merchantName);
      if (cached !== undefined) {
        if (cached) {
          newSuggestions[tx.id] = cached;
        }
      } else {
        merchantsToFetch.push({ txId: tx.id, merchantName: tx.merchantName });
      }
    }

    // Apply cached suggestions immediately
    if (Object.keys(newSuggestions).length > 0) {
      setSuggestions((prev) => ({ ...prev, ...newSuggestions }));
    }

    // Limit to 5 API calls at a time for better performance
    const toFetch = merchantsToFetch.slice(0, 5);
    if (toFetch.length === 0) return;

    const timeoutId = setTimeout(async () => {
      lastFetchRef.current = Date.now();
      const fetched: Record<string, CategorySuggestion> = {};

      // Fetch in parallel but limit concurrency
      await Promise.all(
        toFetch.map(async ({ txId, merchantName }) => {
          try {
            const suggestion = (await api.suggestCategory(
              merchantName
            )) as CategorySuggestion | null;
            suggestionsCache.current.set(merchantName, suggestion);
            if (suggestion) {
              fetched[txId] = suggestion;
            }
          } catch {
            // Cache the failure too to avoid retrying
            suggestionsCache.current.set(merchantName, null);
          }
        })
      );

      if (Object.keys(fetched).length > 0) {
        setSuggestions((prev) => ({ ...prev, ...fetched }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [transactions]);

  return suggestions;
}
