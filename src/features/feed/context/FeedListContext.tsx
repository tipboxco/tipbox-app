import React, { createContext, useContext, useRef } from 'react';
import type { FlatList } from 'react-native';
import type Animated from 'react-native-reanimated';

// Animated.FlatList aslında FlatList'i extend ediyor, bu yüzden her ikisini de destekleyen bir tip kullanıyoruz
type FeedListRef = Animated.FlatList<any> | FlatList<any>;

interface FeedListContextType {
  feedListRef: React.RefObject<FeedListRef>;
}

const FeedListContext = createContext<FeedListContextType | undefined>(undefined);

/**
 * FeedListContext Provider
 * 
 * Feed ekranındaki FlatList ref'ini tüm PostCard component'lerine sağlar.
 * Bu sayede CardImageCarousel'lar feed scroll'unu yönetebilir (gesture arbitration).
 */
export const FeedListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const feedListRef = useRef<FeedListRef>(null);

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

