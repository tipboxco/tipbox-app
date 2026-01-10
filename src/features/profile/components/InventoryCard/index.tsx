import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { Box, VStack, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { InventoryItem } from '../../types';
import { toImageSource, cleanNewlines } from '@/src/utils';
import { CachedImage } from '@/src/components/CachedImage';

// Default post image
const DEFAULT_POST_IMAGE = require('@/assets/defaultImages/default-post.png');

interface InventoryCardProps {
  item: InventoryItem;
  width: number;
  onPress?: () => void;
}

export const InventoryCard = ({ item, width, onPress }: InventoryCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Image source state - görsel yüklenemezse default image'a geçiş için
  const initialImageSource = toImageSource(item.image) || DEFAULT_POST_IMAGE;
  const [imageSource, setImageSource] = useState(initialImageSource);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imageLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Image değiştiğinde state'i güncelle
  useEffect(() => {
    // Önceki timeout'u temizle
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
      imageLoadTimeoutRef.current = null;
    }
    
    const newSource = toImageSource(item.image) || DEFAULT_POST_IMAGE;
    
    // Eğer yeni source default image değilse, load kontrolü yap
    if (newSource !== DEFAULT_POST_IMAGE) {
      setImageSource(newSource);
      setIsImageLoaded(false);
      
      // 5 saniye içinde görsel yüklenmezse default image'a geç
      imageLoadTimeoutRef.current = setTimeout(() => {
        setImageSource((currentSource: any) => {
          // Eğer hala yüklenmediyse ve source değişmediyse default image'a geç
          if (currentSource === newSource) {
            console.log('[InventoryCard] Image load timeout, using default image:', {
              itemId: item.id,
              attemptedSource: newSource,
            });
            return DEFAULT_POST_IMAGE;
          }
          return currentSource;
        });
        setIsImageLoaded(true);
      }, 5000); // 5 saniye timeout
    } else {
      // Zaten default image ise direkt set et
      setImageSource(DEFAULT_POST_IMAGE);
      setIsImageLoaded(true);
    }
    
    return () => {
      if (imageLoadTimeoutRef.current) {
        clearTimeout(imageLoadTimeoutRef.current);
        imageLoadTimeoutRef.current = null;
      }
    };
  }, [item.image, item.id]);
  
  // Image başarıyla yüklendiğinde
  const handleImageLoad = useCallback(() => {
    setIsImageLoaded(true);
    // Timeout'u temizle
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
      imageLoadTimeoutRef.current = null;
    }
  }, []);
  
  // Image yüklenme hatası durumunda default image'a geçiş
  const handleImageError = useCallback((error: Error) => {
    console.log('[InventoryCard] Image load error, using default image:', {
      itemId: item.id,
      attemptedSource: imageSource,
      error: error.message,
    });
    setImageSource(DEFAULT_POST_IMAGE);
    setIsImageLoaded(true); // Default image zaten yüklü sayılır
    // Timeout'u temizle
    if (imageLoadTimeoutRef.current) {
      clearTimeout(imageLoadTimeoutRef.current);
      imageLoadTimeoutRef.current = null;
    }
  }, [item.id, imageSource]);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Box
        bg={isDark ? '$backgroundDark800' : '$white'}
        borderWidth={1}
        borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
        borderRadius={5}
        w={width}
        h={175}
        mb={10}
        overflow="hidden"
        >
      <Box
          flex={1}
          p={15}
          alignItems="center"
          justifyContent="center"
        >
          <CachedImage
            source={imageSource}
            placeholder={DEFAULT_POST_IMAGE}
            style={{
              width: 100,
              height: 100,
            }}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="normal"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </Box>
        <VStack p={8} space="xs">
          <Text
            color={isDark ? '$textDark400' : '#A3A3A3'}
            fontSize={11}
            fontWeight="$bold"
            numberOfLines={3}
          >
            {[cleanNewlines(item.brand.name), cleanNewlines(item.brand.model), cleanNewlines(item.brand.specs)]
              .filter(Boolean)
              .join(' ')}
          </Text>
        </VStack>
      </Box>
    </TouchableOpacity>
  );
};

export default InventoryCard;
