import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Search History Store
 * Stores search history for ExploreScreen
 * - Keeps track of search queries
 * - Limits history to 20 items
 * - Persists to AsyncStorage
 */
interface SearchHistoryState {
  history: string[];
  addSearchQuery: (query: string) => void;
  removeSearchQuery: (query: string) => void;
  clearHistory: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  devtools(
    persist(
      (set) => ({
        history: [],

        addSearchQuery: (query: string) => {
          set((state) => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) return state;

            // Remove if already exists
            let newHistory = state.history.filter((item) => item !== trimmedQuery);

            // Add to the beginning
            newHistory = [trimmedQuery, ...newHistory];

            // Limit to 20 items
            if (newHistory.length > 20) {
              newHistory = newHistory.slice(0, 20);
            }

            return { history: newHistory };
          });
        },

        removeSearchQuery: (query: string) => {
          set((state) => ({
            history: state.history.filter((item) => item !== query),
          }));
        },

        clearHistory: () => {
          set({ history: [] });
        },
      }),
      {
        name: 'search-history-storage',
        storage: createJSONStorage(() => AsyncStorage),
      }
    ),
    { name: 'SearchHistoryStore' }
  )
);
