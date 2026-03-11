import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image, ImageContentFit, ImageTransition } from 'expo-image';
import { ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import { toImageSource } from '@/src/utils';
import LottieView from 'lottie-react-native';
import { CubeIcon } from 'react-native-heroicons/outline';

export interface CachedImageProps {
  source: string | ImageSourcePropType | null | undefined;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  placeholder?: string | number | ImageSourcePropType;
  transition?: ImageTransition;
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  priority?: 'low' | 'normal' | 'high';
  recyclingKey?: string;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: Error) => void;
  // Gluestack UI uyumluluğu için
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center' | 'repeat';
}

/**
 * CachedImage Component
 *
 * expo-image kullanarak disk cache desteği ile görüntü gösterimi sağlar.
 *
 * Özellikler:
 * - Otomatik disk cache (default: 'memory-disk')
 * - Progressive loading
 * - Lottie loading animation
 * - Fallback placeholder support
 * - URL düzeltmesi (localhost için)
 *
 * Loading States:
 * 1. Loading: Lottie animasyonu gösterilir (#F5F5F5 arkaplan)
 * 2. Success: Asıl görsel gösterilir
 * 3. Error: Default placeholder gösterilir
 *
 * @example
 * ```tsx
 * <CachedImage
 *   source="https://example.com/image.jpg"
 *   style={{ width: 200, height: 200 }}
 *   contentFit="cover"
 *   placeholder={require('@/assets/default.png')}
 * />
 * ```
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition,
  cachePolicy = 'memory-disk', // Default: hem memory hem disk cache
  priority = 'normal',
  recyclingKey,
  onLoadStart,
  onLoadEnd,
  onError,
  resizeMode,
  ...props
}) => {
  // Loading ve error state tracking
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // toImageSource ile URL'i düzelt
  const imageSource = toImageSource(source);

  // 2 saniye timeout - yükleme 2 saniyede tamamlanmazsa kutu ikonu göster
  useEffect(() => {
    if (!isLoading || !imageSource) return;

    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, imageSource]);

  // resizeMode'u contentFit'e çevir (Gluestack UI uyumluluğu için)
  const finalContentFit: ImageContentFit =
    resizeMode === 'contain' ? 'contain' :
    resizeMode === 'cover' ? 'cover' :
    resizeMode === 'stretch' ? 'fill' :
    resizeMode === 'center' ? 'center' :
    contentFit;

  // Style'ı parse et (width, height ve borderRadius için)
  const styleArray = Array.isArray(style) ? style : [style];
  const flattenedStyle = StyleSheet.flatten(styleArray);
  const containerWidth = flattenedStyle?.width || 100;
  const containerHeight = flattenedStyle?.height || 100;
  const containerBorderRadius = flattenedStyle?.borderRadius || 5;

  // Eğer source yoksa veya geçersizse, statik kutu ikonu göster
  if (!imageSource) {
    const iconSize = typeof containerWidth === 'number' ? Math.min(containerWidth * 0.35, containerHeight * 0.35) : 32;
    return (
      <View style={[style, { position: 'relative' }]}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#F5F5F5',
              borderRadius: containerBorderRadius,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          <CubeIcon size={iconSize} color="#CCCCCC" strokeWidth={1.5} />
        </View>
      </View>
    );
  }

  return (
    <View style={[style, { position: 'relative' }]}>
      {/* Asıl görsel - sadece error olmadığında göster */}
      {!hasError && (
        <Image
          source={imageSource}
          style={[StyleSheet.absoluteFill, { borderRadius: containerBorderRadius }]}
          contentFit={finalContentFit}
          transition={transition || { duration: 200 }}
          cachePolicy={cachePolicy}
          priority={priority}
          recyclingKey={recyclingKey}
          onLoadStart={() => {
            setIsLoading(true);
            setHasError(false);
            setLoadingTimeout(false);
            onLoadStart?.();
          }}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
            setLoadingTimeout(false);
            onLoadEnd?.();
          }}
          onError={(error) => {
            setIsLoading(false);
            setHasError(true);
            setLoadingTimeout(false);
            onError?.(error as any);
          }}
          {...props}
        />
      )}

      {/* Loading state: #F5F5F5 arkaplan + Lottie animasyon (2 saniye) veya kutu ikonu (timeout sonrası) */}
      {isLoading && !hasError && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#F5F5F5',
              borderRadius: containerBorderRadius,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          {!loadingTimeout ? (
            <LottieView
              source={require('@/placeholder.json')}
              autoPlay
              loop
              style={{
                width: typeof containerWidth === 'number' ? containerWidth * 0.7 : 60,
                height: typeof containerHeight === 'number' ? containerHeight * 0.7 : 60,
              }}
            />
          ) : (
            <CubeIcon
              size={typeof containerWidth === 'number' ? Math.min(containerWidth * 0.35, containerHeight * 0.35) : 32}
              color="#CCCCCC"
              strokeWidth={1.5}
            />
          )}
        </View>
      )}

      {/* Error state: #F5F5F5 arkaplan + Statik kutu ikonu */}
      {hasError && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#F5F5F5',
              borderRadius: containerBorderRadius,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          <CubeIcon
            size={typeof containerWidth === 'number' ? Math.min(containerWidth * 0.35, containerHeight * 0.35) : 32}
            color="#CCCCCC"
            strokeWidth={1.5}
          />
        </View>
      )}
    </View>
  );
};

export default CachedImage;

