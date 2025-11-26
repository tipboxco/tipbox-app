import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { ImageSourcePropType } from 'react-native';

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

export const toImageSource = (
  value: string | ImageSourcePropType | null | undefined,
): ImageSourcePropType | undefined => {
  if (!value) return undefined;

  if (typeof value === 'string') {
    return { uri: value };
  }

  return value;
}
/**
 * Verilen ISO timestamp'in şu anki zamana göre ne kadar önce olduğunu
 * kısaltılmış formatta döndürür.
 *
 * Saat: h, Gün: d, Hafta: w, Yıl: y
 * Örnek: 3h, 2d, 1w, 4y
 */
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs <= 0) {
    return '0h';
  }

  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    const h = Math.max(1, Math.floor(diffHours));
    return `${h}h`;
  }

  const diffDays = diffHours / 24;
  if (diffDays < 7) {
    const d = Math.floor(diffDays);
    return `${d}d`;
  }

  const diffWeeks = diffDays / 7;
  if (diffWeeks < 52) {
    const w = Math.floor(diffWeeks);
    return `${w}w`;
  }

  const diffYears = diffWeeks / 52;
  const y = Math.floor(diffYears);
  return `${y}y`;
};

