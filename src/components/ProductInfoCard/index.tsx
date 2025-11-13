import React from 'react';
import { Box, HStack, VStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface ProductInfoCardProps {
  // Product information
  image: any;
  name?: string;
  brand?: string;
  subName?: string;
  title?: string; // For backward compatibility
  // Card type
  type?: 'small' | 'big';
  // Optional styling props
  mx?: number | string;
  mt?: number | string;
  // Owned status
  isOwned?: boolean;
  // Click handler
  onPress?: () => void;
  // Show average rating badge
  showAverageRating?: boolean;
  // Show chevron icon (for category navigation)
  showChevron?: boolean;
}

export const ProductInfoCard = ({
  image,
  name,
  brand,
  subName,
  title,
  type = 'small',
  isOwned = false,
  onPress,
  showAverageRating = false,
  showChevron = false,
}: ProductInfoCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Determine image size based on type
  const imageSize = type === 'big' ? 58 : 42;

  // Use title for backward compatibility, otherwise use name
  const displayTitle = title || name || '';
  const displayBrand = brand;
  const displaySubName = subName;

  const content = (
    <HStack alignItems="center" justifyContent="space-between" space="md">
      <HStack alignItems="center" space="md" flex={1}>
        {/* Product Image */}
        <Box
          width={imageSize}
          height={imageSize}
          borderRadius={5}
          borderWidth={0.5}
          borderColor="#E9E9E9"
          $dark-borderColor="$borderDark600"
          overflow="hidden"
          bg={isDark ? '$backgroundDark800' : '#F5F5F5'}
        >
          <Image
            source={image}
            alt={displayTitle || "Product"}
            width={imageSize}
            height={imageSize}
            resizeMode="cover"
          />
        </Box>

        {/* Product Info */}
        <VStack flex={1} space="xs">
          {displayBrand && (
            <Text
              color={isDark ? '$textDark400' : '#A3A3A3'}
              fontSize={11}
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {displayBrand}
            </Text>
          )}
          <Text
            color={isDark ? '$textDark50' : '#A3A3A3'}
            fontSize={11}
            fontWeight="$bold"
            numberOfLines={type === 'big' ? 3 : 2}
          >
            {displayTitle}
          </Text>
          {displaySubName && (
            <Text
              color={isDark ? '$textDark400' : '#A3A3A3'}
              fontSize={11}
              fontWeight="$normal"
              numberOfLines={1}
            >
              {displaySubName}
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
        {showAverageRating && (
          <Image
            source={require('@/assets/common/percentage_01.png')}
            alt={'average-rating'}
            width={30}
            height={30}
          />
        )}
        {showChevron && (
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

