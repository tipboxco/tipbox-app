/**
 * Search Suggestions Hook for Explore Screen
 * Provides suggestions from search history
 */

import { useMemo } from 'react';
import { useSearchHistoryStore } from '../store/searchHistoryStore';
import { useShallow } from 'zustand/react/shallow';

export interface SearchSuggestion {
  id: string;
  title: string;
}

export const useExploreSearchSuggestions = (searchQuery: string): SearchSuggestion[] => {
  const { history } = useSearchHistoryStore(
    useShallow((state) => ({
      history: state.history,
    }))
  );

  const suggestions = useMemo(() => {
    const results: SearchSuggestion[] = [];

    if (!searchQuery || searchQuery.trim().length === 0) {
      // Show all history if no query
      history.forEach((query) => {
        results.push({
          id: `history-${query}`,
          title: query,
        });
      });
    } else {
      // Filter history by query
      const lowerQuery = searchQuery.toLowerCase();
      const filteredHistory = history.filter((query) =>
        query.toLowerCase().includes(lowerQuery)
      );

      filteredHistory.forEach((query) => {
        results.push({
          id: `history-${query}`,
          title: query,
        });
      });
    }

    return results;
  }, [searchQuery, history]);

  return suggestions;
};
