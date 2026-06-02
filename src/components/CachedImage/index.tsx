import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image, ImageContentFit, ImageTransition } from 'expo-image';
import { ImageSourcePropType, StyleProp, ImageStyle } from 'react-native';
import { toImageSource } from '@/src/utils';
import LottieView from 'lottie-react-native';
import { CubeIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';

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

export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  recyclingKey,
  onLoadStart,
  onLoadEnd,
  onError,
  resizeMode,
  ...props
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [hasError, setHasError] = useState(false);
  // Loading overlay sadece gecikme sonrası gösterilir - cache'den yüklenen görseller skeleton görmez
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const isLoadedRef = useRef(false);
  const overlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const imageSource = toImageSource(source);

  // Source'dan stabil bir string key türet - obje referansı değişse bile aynı URL ise effect tetiklenmez
  const sourceKey = typeof source === 'string'
    ? source
    : (source && typeof source === 'object' && 'uri' in source)
      ? (source as { uri?: string }).uri || ''
      : typeof source === 'number'
        ? String(source)
        : '';

  const clearTimers = useCallback(() => {
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  }, []);

  // Source değiştiğinde state'leri sıfırla
  // PERFORMANCE FIX: sourceKey (string) kullanarak obje referans değişikliklerinde gereksiz reset'i önle
  useEffect(() => {
    clearTimers();
    isLoadedRef.current = false;
    setHasError(false);
    setShowLoadingOverlay(false);
    setLoadingTimeout(false);

    const resolvedSource = toImageSource(source);
    if (!resolvedSource) return;

    // 200ms gecikme: cache'den yüklenen görseller bu sürede onLoad tetikler,
    // skeleton hiç gösterilmez. Sadece network'ten yüklenen görseller skeleton görür.
    overlayTimerRef.current = setTimeout(() => {
      if (!isLoadedRef.current) {
        setShowLoadingOverlay(true);
      }
    }, 200);

    // 2s timeout: Lottie yerine CubeIcon göster
    timeoutTimerRef.current = setTimeout(() => {
      if (!isLoadedRef.current) {
        setLoadingTimeout(true);
      }
    }, 2000);

    return clearTimers;
  }, [sourceKey, clearTimers]);

  const resizeToContentFit: ImageContentFit =
    resizeMode === 'contain' ? 'contain' :
    resizeMode === 'cover' ? 'cover' :
    resizeMode === 'stretch' ? 'fill' :
    resizeMode === 'center' ? 'center' :
    contentFit;

  const styleArray = Array.isArray(style) ? style : [style];
  const flattenedStyle = StyleSheet.flatten(styleArray);
  const containerWidth = flattenedStyle?.width || 100;
  const containerHeight = flattenedStyle?.height || 100;
  const containerBorderRadius = flattenedStyle?.borderRadius || 5;
  const iconSize = typeof containerWidth === 'number'
    ? Math.min(Number(containerWidth) * 0.35, Number(containerHeight) * 0.35)
    : 32;

  // Source yoksa: placeholder veya CubeIcon
  if (!imageSource) {
    if (placeholder) {
      const placeholderSource = toImageSource(placeholder);
      if (placeholderSource) {
        return (
          <View style={[style, { position: 'relative' }]}>
            <Image
              source={placeholderSource}
              style={[StyleSheet.absoluteFill, { borderRadius: containerBorderRadius }]}
              contentFit={resizeToContentFit}
              cachePolicy={cachePolicy}
            />
          </View>
        );
      }
    }
    return (
      <View style={[style, { position: 'relative' }]}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderRadius: containerBorderRadius,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          <CubeIcon size={iconSize} color={isDark ? '#555555' : '#CCCCCC'} strokeWidth={1.5} />
        </View>
      </View>
    );
  }

  return (
    <View style={[style, { position: 'relative' }]}>
      {/* Asıl görsel */}
      {!hasError && (
        <Image
          source={imageSource}
          style={[StyleSheet.absoluteFill, { borderRadius: containerBorderRadius }]}
          contentFit={resizeToContentFit}
          transition={transition || { duration: 200 }}
          cachePolicy={cachePolicy}
          priority={priority}
          recyclingKey={recyclingKey}
          onLoadStart={() => {
            onLoadStart?.();
          }}
          onLoad={() => {
            isLoadedRef.current = true;
            clearTimers();
            setShowLoadingOverlay(false);
            setHasError(false);
            setLoadingTimeout(false);
            onLoadEnd?.();
          }}
          onError={(error) => {
            isLoadedRef.current = true;
            clearTimers();
            setShowLoadingOverlay(false);
            setHasError(true);
            setLoadingTimeout(false);
            onError?.(error as any);
          }}
          {...props}
        />
      )}

      {/* Loading overlay - sadece 200ms gecikmeden sonra gösterilir */}
      {showLoadingOverlay && !hasError && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
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
                width: typeof containerWidth === 'number' ? Number(containerWidth) * 0.7 : 60,
                height: typeof containerHeight === 'number' ? Number(containerHeight) * 0.7 : 60,
              }}
            />
          ) : placeholder ? (
            (() => {
              const placeholderSource = toImageSource(placeholder);
              return placeholderSource ? (
                <Image
                  source={placeholderSource}
                  style={[StyleSheet.absoluteFill, { borderRadius: containerBorderRadius }]}
                  contentFit={resizeToContentFit}
                  cachePolicy={cachePolicy}
                />
              ) : (
                <CubeIcon size={iconSize} color={isDark ? '#555555' : '#CCCCCC'} strokeWidth={1.5} />
              );
            })()
          ) : (
            <CubeIcon size={iconSize} color={isDark ? '#555555' : '#CCCCCC'} strokeWidth={1.5} />
          )}
        </View>
      )}

      {/* Error state */}
      {hasError && (
        placeholder ? (
          (() => {
            const placeholderSource = toImageSource(placeholder);
            return placeholderSource ? (
              <Image
                source={placeholderSource}
                style={[StyleSheet.absoluteFill, { borderRadius: containerBorderRadius }]}
                contentFit={resizeToContentFit}
                cachePolicy={cachePolicy}
              />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                    borderRadius: containerBorderRadius,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }
                ]}
              >
                <CubeIcon size={iconSize} color={isDark ? '#555555' : '#CCCCCC'} strokeWidth={1.5} />
              </View>
            );
          })()
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                borderRadius: containerBorderRadius,
                justifyContent: 'center',
                alignItems: 'center',
              }
            ]}
          >
            <CubeIcon size={iconSize} color={isDark ? '#555555' : '#CCCCCC'} strokeWidth={1.5} />
          </View>
        )
      )}
    </View>
  );
};

export default CachedImage;
