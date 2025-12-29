import { useEffect, useRef, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import type { ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useAppStore } from '@/src/store/appStore';
import { API_CONFIG } from '@/src/config/api.config';

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

/**
 * Bottom offset değerini hesaplar.
 * Safe area bottom inset + opsiyonel tab bar yüksekliği + opsiyonel padding değerini döndürür.
 * Floating button'lar, side menu ve benzeri component'ler için kullanılabilir.
 * 
 * @param options - Konfigürasyon seçenekleri
 * @param options.includeTabBar - Tab bar yüksekliğini dahil et (default: false)
 * @param options.extraPadding - Ekstra boşluk (default: 16)
 * @returns Bottom offset değeri (pixel)
 * 
 * @example
 * // Floating button için (tab bar dahil):
 * const bottomOffset = useBottomOffset({ includeTabBar: true, extraPadding: 16 });
 * 
 * // Side menu için (sadece safe area):
 * const bottomPadding = useBottomOffset({ extraPadding: 16 });
 */
export const useBottomOffset = (options: { includeTabBar?: boolean; extraPadding?: number } = {}): number => {
  const { includeTabBar = false, extraPadding = 16 } = options;
  const tabBarHeight = includeTabBar ? useBottomTabBarHeight() : 0;
  const safeAreaBottom = useSafeAreaValues('bottom');
  return safeAreaBottom + tabBarHeight + extraPadding;
};

/**
 * @deprecated useBottomOffset kullanın
 * Floating action button'lar için bottom offset değerini hesaplar.
 */
export const useFloatingButtonBottomOffset = (extraPadding: number = 16): number => {
  return useBottomOffset({ includeTabBar: false, extraPadding });
};

// Image source cache - aynı URL için aynı obje referansını döndürmek için
const imageSourceCache = new Map<string, ImageSourcePropType>();

/**
 * Image URL'lerindeki localhost'u gerçek IP adresi ile değiştirir
 * Mobil cihazlarda localhost çalışmadığı için gerekli
 */
const normalizeImageUrl = (url: string): string => {
  try {
    // localhost veya 127.0.0.1 içeren URL'leri düzelt
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      // Media base URL'i al (varsa MEDIA_BASE_URL, yoksa BASE_URL'den port'u değiştir)
      const mediaBaseUrl = API_CONFIG.MEDIA_BASE_URL || API_CONFIG.BASE_URL.replace(':3000', ':9000');
      
      // URL'i parse et ve host'u değiştir
      const urlObj = new URL(url);
      const mediaUrlObj = new URL(mediaBaseUrl);
      
      // Host ve port'u değiştir
      urlObj.hostname = mediaUrlObj.hostname;
      urlObj.port = mediaUrlObj.port;
      
      const normalizedUrl = urlObj.toString();
      return normalizedUrl;
    }
    return url;
  } catch (error) {
    console.warn('[normalizeImageUrl] URL parse error:', error, 'Original URL:', url);
    return url;
  }
};

export const toImageSource = (
  value: string | ImageSourcePropType | null | undefined,
): ImageSourcePropType | undefined => {
  if (!value) return undefined;

  if (typeof value === 'string') {
    // localhost içeren URL'leri normalize et
    const normalizedUrl = normalizeImageUrl(value);
    
    // Cache'den kontrol et - aynı URL için aynı referansı döndür
    if (imageSourceCache.has(normalizedUrl)) {
      return imageSourceCache.get(normalizedUrl);
    }
    
    // Yeni source oluştur ve cache'e ekle
    const imageSource: ImageSourcePropType = { uri: normalizedUrl };
    imageSourceCache.set(normalizedUrl, imageSource);
    
    return imageSource;
  }

  // String değilse (require() veya zaten ImageSourcePropType) direkt döndür
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

/**
 * Store'dan current userId bilgisini döndürür.
 * Eğer store içerisinde kullanıcı yoksa logout işlemi yapar
 * ve Auth stack'ine yönlendirir.
 */
export const useCurrentUserIdOrLogout = (): string | undefined => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAppStore();

  useEffect(() => {
    if (!user) {
      (async () => {
        try {
          await logout();
        } catch (e) {
          console.error('Logout error:', e);
        } finally {
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      })();
    }
  }, [user, logout, navigation]);

  return user?.id;
};

/**
 * String'lerdeki newline karakterlerini temizler
 * Backend'den gelen "Apple\nVisionMax\n55" gibi string'leri düzeltir
 * 
 * @param text - Temizlenecek text
 * @param replacement - Newline yerine konulacak karakter (default: ' ' - boşluk)
 * @returns Temizlenmiş text
 * 
 * @example
 * cleanNewlines("Apple\nVisionMax\n55") // "Apple VisionMax 55"
 * cleanNewlines("Apple\nVisionMax\n55", " - ") // "Apple - VisionMax - 55"
 */
export const cleanNewlines = (text: string | null | undefined, replacement: string = ' '): string => {
  if (!text) return '';
  return text.replace(/\\n|\n/g, replacement).trim();
};

/**
 * Countdown formatı: "DDD:HH:MM:SS" (Gün:Saat:Dakika:Saniye)
 * Örnek: "165:08:34" -> 165 gün, 8 saat, 34 dakika
 */
export type CountdownFormat = string;

/**
 * End date'e göre kalan süreyi hesaplar ve formatlar
 * Performans için: Her saniye güncellenir ama component re-render olmaz
 * 
 * @param endDate - ISO string formatında bitiş tarihi
 * @returns Formatlanmış countdown string (DDD:HH:MM:SS) veya null (süre dolmuşsa)
 */
export const calculateCountdown = (endDate: string): CountdownFormat | null => {
  const end = new Date(endDate);
  const now = new Date();
  
  if (isNaN(end.getTime())) {
    return null;
  }
  
  const diffMs = end.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return null; // Süre dolmuş
  }
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  
  return `${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Countdown hook - Performanslı geri sayım
 * Component re-render olmadan sadece countdown değeri güncellenir
 * 
 * @param endDate - ISO string formatında bitiş tarihi
 * @param updateInterval - Güncelleme aralığı (ms, default: 1000ms = 1 saniye)
 * @returns Formatlanmış countdown string (DDD:HH:MM:SS) veya null (süre dolmuşsa)
 * 
 * @example
 * const countdown = useCountdown('2025-12-10T09:06:56.160Z');
 * // countdown: "165:08:34:12"
 */
export const useCountdown = (
  endDate: string | null | undefined,
  updateInterval: number = 1000
): CountdownFormat | null => {
  const [countdown, setCountdown] = useState<CountdownFormat | null>(() => {
    if (!endDate) return null;
    return calculateCountdown(endDate);
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endDateRef = useRef<string | null | undefined>(endDate);
  
  // endDate değiştiğinde ref'i güncelle
  useEffect(() => {
    endDateRef.current = endDate;
    // İlk değeri hemen hesapla
    if (endDate) {
      setCountdown(calculateCountdown(endDate));
    } else {
      setCountdown(null);
    }
  }, [endDate]);
  
  // Interval'i yönet
  useEffect(() => {
    if (!endDate) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    // İlk değeri hemen hesapla
    const initialCountdown = calculateCountdown(endDate);
    setCountdown(initialCountdown);
    
    // Eğer süre dolmuşsa interval başlatma
    if (!initialCountdown) {
      return;
    }
    
    // Interval başlat
    intervalRef.current = setInterval(() => {
      const currentEndDate = endDateRef.current;
      if (!currentEndDate) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setCountdown(null);
        return;
      }
      
      const newCountdown = calculateCountdown(currentEndDate);
      setCountdown(newCountdown);
      
      // Süre dolmuşsa interval'i temizle
      if (!newCountdown) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, updateInterval);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endDate, updateInterval]);
  
  return countdown;
};

