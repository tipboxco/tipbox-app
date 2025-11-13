import React from 'react';
import { Box, HStack, VStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ProductInfoType } from '@/src/types/common';

interface ProductInfoCardProps {
  // Product information
  image: any;
  title: string;
  subName?: string;
  // Card size type
  size?: 'small' | 'big';
  // Product info type (determines what icon to show)
  type?: ProductInfoType;
  // Optional styling props
  mx?: number | string;
  mt?: number | string;
  // Owned status
  isOwned?: boolean;
  // Click handler
  onPress?: () => void;
  // Show average rating badge (deprecated - use type prop instead)
  showAverageRating?: boolean;
  // Show chevron icon (deprecated - use type prop instead)
  showChevron?: boolean;
}

export const ProductInfoCard = ({
  image,
  title,
  subName,
  size = 'small',
  type,
  isOwned = false,
  onPress,
  showAverageRating = false,
  showChevron = false,
}: ProductInfoCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Determine image size based on size prop
  const imageSize = size === 'big' ? 58 : 42;

  // Determine what to show based on type prop
  const shouldShowAverageRating = type === ProductInfoType.PRODUCT || (type === undefined && showAverageRating);
  const shouldShowChevron = 
    type === ProductInfoType.PRODUCT_GROUP || 
    type === ProductInfoType.SUB_CATEGORY || 
    (type === undefined && showChevron);

  const content = (
    <HStack alignItems="center" justifyContent="space-between" space="md">
      <HStack alignItems="center" space="md" flex={1}>
        {/* Product Image */}
        <Box
          width={imageSize}
          height={imageSize}
          borderRadius={5}
          borderColor="#E9E9E9"
          overflow="hidden"
          bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
        >
          <Image
            source={image}
            alt={title || "Product"}
            width={imageSize}
            height={imageSize}
            resizeMode="cover"
          />
        </Box>

        {/* Product Info */}
        <VStack flex={1} space="xs">
          <Text
            color={isDark ? '$textDark50' : '#A3A3A3'}
            fontSize={11}
            fontWeight="$bold"
            numberOfLines={size === 'big' ? 3 : 2}
          >
            {title}
          </Text>
          {subName && (
            <Text
              color={isDark ? '$textDark400' : '#A3A3A3'}
              fontSize={11}
              fontWeight="$normal"
              numberOfLines={1}
            >
              {subName}
            </Text>
          )}
          {/* Owned Status */}
          {isOwned && (
            <HStack alignItems="center" space="xs" mt={2}>
              <Box
                width={16}
                height={16}
                borderWidth={1}
                borderColor="#E8E8E8"
                borderStyle="dashed"
                borderRadius={2}
                justifyContent="center"
                alignItems="center"
                bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
              >
                <Feather
                  name="check"
                  size={10}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              </Box>
              <Text
                color={isDark ? '$textDark400' : '#A3A3A3'}
                fontSize={10}
                fontWeight="$normal"
              >
                Owned
              </Text>
            </HStack>
          )}
        </VStack>
      </HStack>
      
      {/* Average Rating Badge or Chevron */}
      <Box alignItems="center" justifyContent="center">
        {shouldShowAverageRating && (
          <Image
            source={require('@/assets/common/percentage_01.png')}
            alt={'average-rating'}
            width={30}
            height={30}
          />
        )}
        {shouldShowChevron && (
          <Feather name="chevron-right" size={24} color={isDark ? '#fff' : '#A3A3A3'} />
        )}
      </Box>
    </HStack>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        <Box>{content}</Box>
      </Pressable>
    );
  }

  return <Box>{content}</Box>;
};

