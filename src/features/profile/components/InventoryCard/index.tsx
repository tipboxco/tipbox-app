import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TouchableOpacity, Pressable as RNPressable, Modal, View, Dimensions } from 'react-native';
import { Box, VStack, Text, Pressable, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { InventoryItem } from '../../types';
import { toImageSource, cleanNewlines } from '@/src/utils';
import { CachedImage } from '@/src/components/CachedImage';
import { PencilIcon, TrashIcon } from 'react-native-heroicons/outline';

// Default post image
const DEFAULT_POST_IMAGE = require('@/assets/defaultImages/default-post.png');

interface InventoryCardProps {
  item: InventoryItem;
  width: number;
  onPress?: () => void;
  onUpdateExperience?: (item: InventoryItem) => void;
  onDeleteProduct?: (item: InventoryItem) => void;
  isOwnProfile?: boolean;
}

export const InventoryCard = ({ item, width, onPress, onUpdateExperience, onDeleteProduct, isOwnProfile = false }: InventoryCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Context menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuTriggerRef = useRef<View>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
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
    setIsMenuOpen(false);
    onUpdateExperience?.(item);
  }, [item, onUpdateExperience]);

  const handleDeleteProduct = useCallback(() => {
    setIsMenuOpen(false);
    onDeleteProduct?.(item);
  }, [item, onDeleteProduct]);

  // Calculate menu position
  const handleMenuOpen = useCallback(() => {
    if (menuTriggerRef.current) {
      menuTriggerRef.current.measureInWindow((x, y, width, height) => {
        const screenWidth = Dimensions.get('window').width;
        const menuWidth = 180;
        const left = Math.max(12, Math.min(x - menuWidth + 10, screenWidth - menuWidth - 12));
        const top = Math.max(12, y - 8);
        setMenuPosition({ top, left });
        setIsMenuOpen(true);
      });
    } else {
      setIsMenuOpen(true);
    }
  }, []);

  return (
    <Box
      position="relative"
      w={width}
      mb={10}
    >
      <View ref={menuTriggerRef} collapsable={false}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          onLongPress={isOwnProfile ? handleMenuOpen : undefined}
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
      </View>
      
      {isOwnProfile && (
        <>
          <Modal
            visible={isMenuOpen}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsMenuOpen(false)}
          >
            <RNPressable
              style={{ flex: 1 }}
              onPress={() => setIsMenuOpen(false)}
            />
            <Box
              position="absolute"
              top={menuPosition.top}
              left={menuPosition.left}
              width={180}
              bg={isDark ? '#1A1A1A' : '#FFFFFF'}
              borderRadius={16}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.25}
              shadowRadius={8}
              elevation={8}
              overflow="hidden"
            >
              <Pressable
                onPress={handleUpdateExperience}
                px={16}
                py={12}
              >
                <HStack alignItems="center" space="md">
                  <PencilIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$md"
                    fontWeight="$medium"
                  >
                    Update Experience
                  </Text>
                </HStack>
              </Pressable>
              <Box h={1} bg={isDark ? '#333333' : '#E9E9E9'} />
              <Pressable
                onPress={handleDeleteProduct}
                px={16}
                py={12}
              >
                <HStack alignItems="center" space="md">
                  <TrashIcon width={20} height={20} color="#FF3040" />
                  <Text
                    color="#FF3040"
                    fontSize="$md"
                    fontWeight="$medium"
                  >
                    Delete Product
                  </Text>
                </HStack>
              </Pressable>
            </Box>
          </Modal>
        </>
      )}
    </Box>
  );
};

export default InventoryCard;
