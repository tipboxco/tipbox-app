import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

// Event Type Enum
export enum EventType {
  TYPE1 = 'Type1',
  TYPE2 = 'Type2',
}

type InsetsKey = 'top' | 'bottom' | 'left' | 'right';

export function useSafeAreaValues(side: InsetsKey): number;
export function useSafeAreaValues(): EdgeInsets;
/**
 * Safe area değerlerini (top, bottom, left, right) döndürür.
 * Belirli bir yön istenirse sadece o değeri geri verir.
 */
export function useSafeAreaValues(side?: InsetsKey) {
  const insets = useSafeAreaInsets();
  if (side) {
    return insets[side];
  }
  return insets;
}

/**
 * Bottom tab bar yüksekliğini döndürür.
 */
export const useBottomTabBarHeightValue = () => {
  return useBottomTabBarHeight();
};

