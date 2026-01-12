import React from 'react';
import { Box, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { CachedImage } from '@/src/components/CachedImage';
import { useColorMode } from '@/src/hooks/useColorMode';

export interface CategoryCardCategory {
  id: string;
  name: string;
  image: any;
}

export interface CategoryCardProps {
  category: CategoryCardCategory;
  onPress: (category: CategoryCardCategory) => void;
  priority?: 'low' | 'normal' | 'high';
  isLargeCard?: boolean;
  style?: any;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress, priority = 'normal', isLargeCard = false, style }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Placeholder görseli
  const placeholder = require('@/assets/inventory/product_01.png');

  // Boyutlar - large card için daha büyük
  const cardHeight = isLargeCard ? 160 : 132;
  const imageSize = isLargeCard ? 120 : 86;
  const fontSize = isLargeCard ? 12 : 8;
  const lineHeight = isLargeCard ? 16 : 10;

  return (
    <Pressable
      onPress={() => onPress(category)}
      height={cardHeight}
      flex={1}
      borderRadius={5}
      bg={isDark ? '#2A2A2A' : '#FDFDFD'}
      borderWidth={1}
      borderColor={isDark ? '#404040' : '#E9E9E9'}
      justifyContent="center"
      alignItems="center"
      style={[
        ({ pressed }) => ({
          transform: [{ scale: pressed ? 0.95 : 1 }],
          opacity: pressed ? 0.8 : 1,
        }),
        style,
      ]}
    >
      <VStack alignItems="center" space="sm" flex={1} justifyContent="center">
        {/* Category Icon */}
        <Box
          width={imageSize}
          height={imageSize}
          borderRadius={5}
          bg="transparent"
          justifyContent="center"
          alignItems="center"
          py="$1"
        >
          <CachedImage
            source={category.image}
            style={{
              width: '100%',
              height: '100%',
            }}
            alt={category.name}
            resizeMode="contain"
            placeholder={placeholder}
            priority={priority}
            // İlk yükleme için memory cache (daha hızlı), sonra disk cache
            cachePolicy={priority === 'high' ? 'memory' : 'memory-disk'}
            // Her görsel için unique recycling key (category.id + image URL)
            recyclingKey={`${category.id}-${typeof category.image === 'string' ? category.image : 'img'}`}
          />
        </Box>

        {/* Category Name */}
        <Text
          color={isDark ? '#FFFFFF' : '#000000'}
          fontSize={fontSize}
          fontWeight="$bold"
          textAlign="center"
          numberOfLines={2}
          px="$2"
          lineHeight={lineHeight}
        >
          {category.name}
        </Text>
      </VStack>
    </Pressable>
  );
};

export default CategoryCard;
