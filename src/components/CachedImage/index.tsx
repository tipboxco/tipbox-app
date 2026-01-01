import React from 'react';
import { Image, ImageContentFit, ImageTransition } from 'expo-image';
import { ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import { toImageSource } from '@/src/utils';

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
 * - Placeholder support
 * - URL normalizasyonu (localhost düzeltmesi)
 * 
 * @example
 * ```tsx
 * <CachedImage 
 *   source="https://example.com/image.jpg"
 *   style={{ width: 200, height: 200 }}
 *   contentFit="cover"
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
  // toImageSource ile URL normalizasyonu yap
  const normalizedSource = toImageSource(source);

  // Eğer source yoksa veya geçersizse, placeholder göster
  if (!normalizedSource) {
    if (placeholder) {
      return (
        <Image
          source={placeholder}
          style={style}
          contentFit={contentFit}
          transition={transition}
          cachePolicy={cachePolicy}
          priority={priority}
          recyclingKey={recyclingKey}
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
          onError={onError}
          {...props}
        />
      );
    }
    return null;
  }

  // resizeMode'u contentFit'e çevir (Gluestack UI uyumluluğu için)
  const finalContentFit: ImageContentFit = 
    resizeMode === 'contain' ? 'contain' :
    resizeMode === 'cover' ? 'cover' :
    resizeMode === 'stretch' ? 'fill' :
    resizeMode === 'center' ? 'center' :
    contentFit;

  return (
    <Image
      source={normalizedSource}
      style={style}
      contentFit={finalContentFit}
      placeholder={placeholder}
      transition={transition || { duration: 200 }}
      cachePolicy={cachePolicy}
      priority={priority}
      recyclingKey={recyclingKey}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      onError={onError}
      {...props}
    />
  );
};

export default CachedImage;

