import React, { createContext, useContext, useRef } from 'react';
import type { FlatList } from 'react-native';

interface FeedListContextType {
  feedListRef: React.RefObject<FlatList<any>>;
}

const FeedListContext = createContext<FeedListContextType | undefined>(undefined);

/**
 * FeedListContext Provider
 * 
 * Feed ekranındaki FlatList ref'ini tüm PostCard component'lerine sağlar.
 * Bu sayede CardImageCarousel'lar feed scroll'unu yönetebilir (gesture arbitration).
 */
export const FeedListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const feedListRef = useRef<FlatList<any>>(null);

  return (
    <FeedListContext.Provider value={{ feedListRef }}>
      {children}
    </FeedListContext.Provider>
  );
};

/**
 * Hook to access FeedListContext
 * 
 * @returns FeedListContextType | undefined
 * Feed ekranı dışında kullanılıyorsa undefined döner (optional context)
 * 
 * @example
 * ```tsx
 * const feedListContext = useFeedListContext();
 * if (feedListContext) {
 *   const { feedListRef } = feedListContext;
 * }
 * ```
 */
export const useFeedListContext = (): FeedListContextType | undefined => {
  return useContext(FeedListContext);
};

