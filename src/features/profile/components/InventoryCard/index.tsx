import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TouchableOpacity, Pressable as RNPressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Box, VStack, Text, Pressable, HStack, Divider } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { InventoryItem } from '../../types';
import { toImageSource, cleanNewlines } from '@/src/utils';
import { CachedImage } from '@/src/components/CachedImage';
import { PencilIcon, TrashIcon, EllipsisVerticalIcon } from 'react-native-heroicons/outline';

// Default post image
const DEFAULT_POST_IMAGE = require('@/assets/defaultImages/default-post.png');

interface InventoryCardProps {
  item: InventoryItem;
  width: number;
  isMenuOpen: boolean;
  onMenuToggle: (isOpen: boolean) => void;
  onPress?: () => void;
  onUpdateExperience?: (item: InventoryItem) => void;
  onDeleteProduct?: (item: InventoryItem) => void;
  isOwnProfile?: boolean;
  isDeleting?: boolean;
}

export const InventoryCard = ({ item, width, isMenuOpen, onMenuToggle, onPress, onUpdateExperience, onDeleteProduct, isOwnProfile = false, isDeleting = false }: InventoryCardProps) => {
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

  // Context menu handlers
  const handleUpdateExperience = useCallback(() => {
    onMenuToggle(false);
    onUpdateExperience?.(item);
  }, [item, onUpdateExperience, onMenuToggle]);

  const handleDeleteProduct = useCallback(() => {
    onMenuToggle(false);
    onDeleteProduct?.(item);
  }, [item, onDeleteProduct, onMenuToggle]);

  const handleMenuOpen = useCallback(() => {
    onMenuToggle(true);
  }, [onMenuToggle]);

  return (
    <Box
      position="relative"
      w={width}
      mb={10}
    >
      {isDeleting && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 5, justifyContent: 'center', alignItems: 'center', zIndex: 20 }]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={isDeleting}
      >
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={5}
          w={width}
          h={175}
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
              onLoadEnd={handleImageLoad}
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

      {/* Context Menu Overlay - Item'ın içinde */}
      {false && isOwnProfile && isMenuOpen && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.6)"
          borderRadius={5}
          zIndex={1000}
        >
          {/* Overlay - Tıklamayı engelle ve modal kapat */}
          <RNPressable 
            style={styles.overlayInItem} 
            onPress={() => onMenuToggle(false)}
          >
            {/* Boş alan - sadece overlay kapanması için */}
          </RNPressable>
          
          {/* Menü - Sağ Üst Köşe */}
          <View 
            style={[
              styles.menuContentInItem, 
              { 
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderWidth: 1,
                borderColor: isDark ? '#333333' : '#E9E9E9',
              }
            ]}
          >
            <RNPressable 
              onPress={(e) => e.stopPropagation()}
              style={{ width: '100%' }}
            >
              <VStack px={6} py={4} width="100%">
                {/* Update Experience */}
                <Pressable
                  onPress={handleUpdateExperience}
                  py={6}
                >
                  <HStack alignItems="center" justifyContent="flex-start" space="xs">
                    <PencilIcon width={14} height={14} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text
                      color={isDark ? '#FFFFFF' : '#000000'}
                      fontSize={10}
                      fontWeight="$medium"
                    >
                      Update
                    </Text>
                  </HStack>
                </Pressable>
                <Divider 
                  bg={isDark ? '#333333' : '#E9E9E9'} 
                  mx={0}
                />
                {/* Delete Product */}
                <Pressable
                  onPress={handleDeleteProduct}
                  py={6}
                >
                  <HStack alignItems="center" justifyContent="flex-start" space="xs">
                    <TrashIcon width={14} height={14} color="#FF3040" />
                    <Text
                      color="#FF3040"
                      fontSize={10}
                      fontWeight="$medium"
                    >
                      Delete
                    </Text>
                  </HStack>
                </Pressable>
              </VStack>
            </RNPressable>
          </View>
        </Box>
      )}
    </Box>
  );
};

export default InventoryCard;

const styles = StyleSheet.create({
  overlayInItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menuContentInItem: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 100,
    maxWidth: 110, // Card genişliğinden daha küçük - taşma önleme
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
});
