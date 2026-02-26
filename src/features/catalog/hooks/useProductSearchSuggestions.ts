/**
 * Search Suggestions Hook for ProductCatalog
 * Provides suggestions based on:
 * 1. Previously searched products from search history
 * 2. Recent product selections from catalog navigation
 */

import { useMemo } from 'react';
import { useSearchHistoryStore } from '../store/searchHistoryStore';
import { useCatalogNavigationStore } from '@/src/features/catalog/store/catalogNavigationStore';
import { useShallow } from 'zustand/react/shallow';

export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'history' | 'recent';
}

export const useProductSearchSuggestions = (searchQuery: string): SearchSuggestion[] => {
  const { productSearchHistory } = useSearchHistoryStore(
    useShallow((state) => ({
      productSearchHistory: state.productSearchHistory,
    }))
  );

  const suggestions = useMemo(() => {
    const results: SearchSuggestion[] = [];

    if (!searchQuery || searchQuery.trim().length === 0) {
      // Show all history if no query
      productSearchHistory.forEach((query) => {
        results.push({
          id: `history-${query}`,
          title: query,
          type: 'history',
        });
      });
    } else {
      // Filter history by query
      const lowerQuery = searchQuery.toLowerCase();
      const filteredHistory = productSearchHistory.filter((query) =>
        query.toLowerCase().includes(lowerQuery)
      );

      filteredHistory.forEach((query) => {
        results.push({
          id: `history-${query}`,
          title: query,
          type: 'history',
        });
      });
    }

    return results;
  }, [searchQuery, productSearchHistory]);

  return suggestions;
};
