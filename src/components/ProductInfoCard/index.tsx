import React, { memo } from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { ChevronRightIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ProductInfoType } from '@/src/types/common';
import { toImageSource, cleanNewlines } from '@/src/utils';
import { CheckIcon } from 'react-native-heroicons/solid';
import { CachedImage } from '@/src/components/CachedImage';
import { useTranslation } from '@/src/hooks/useTranslation';

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
  // Owned status (legacy)
  isOwned?: boolean;
  /** Experience post: "Owned" | "Tried" - content yapısı içinde ikon + metin (görseldeki gibi) */
  ownershipLabel?: 'Owned' | 'Tried';
  // Click handler
  onPress?: () => void;
  // Show average rating badge (deprecated - use type prop instead)
  showAverageRating?: boolean;
  // Show chevron icon (deprecated - use type prop instead)
  showChevron?: boolean;
  // Color overrides for SearchModal
  titleColor?: string;
  subNameColor?: string;
}

const ProductInfoCardComponent = ({
  image,
  title,
  subName,
  size = 'small',
  type,
  isOwned = false,
  ownershipLabel,
  onPress,
  showAverageRating = false,
  showChevron = false,
  titleColor,
  subNameColor,
}: ProductInfoCardProps) => {
  const { t } = useTranslation('post');
  const showOwnership = ownershipLabel ?? (isOwned ? t('card.owned') : undefined);
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Determine image size based on size prop
  const imageSize = size === 'big' ? 58 : 42;

  // Map image source - null ise CachedImage kendi fallback'ini (CubeIcon) gösterecek
  const imageSource = toImageSource(image);

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
          <CachedImage
            source={imageSource}
            alt={title || "Product"}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="cover"
            cachePolicy="memory-disk"
          />
        </Box>

        {/* Product Info */}
        <VStack flex={1} space="xs">
          <Text
            color={titleColor || (isDark ? '$textDark50' : '#A3A3A3')}
            fontSize={11}
            fontWeight="$bold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {(() => {
              const cleanedTitle = cleanNewlines(title);
              const MAX_LENGTH = 40;
              if (cleanedTitle.length > MAX_LENGTH) {
                return cleanedTitle.substring(0, MAX_LENGTH).trim() + '...';
              }
              return cleanedTitle;
            })()}
          </Text>
          {subName && (
            <Text
              color={subNameColor || (isDark ? '$textDark400' : '#A3A3A3')}
              fontSize={11}
              fontWeight="$normal"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {(() => {
                const cleanedSubName = cleanNewlines(subName);
                const MAX_LENGTH = 40;
                if (cleanedSubName.length > MAX_LENGTH) {
                  return cleanedSubName.substring(0, MAX_LENGTH).trim() + '...';
                }
                return cleanedSubName;
              })()}
            </Text>
          )}
          {/* Owned / Tried - content yapısı içinde (ikon + metin) */}
          {showOwnership && (
            <HStack alignItems="center" space="xs" mt={2}>
              <Box
                width={16}
                height={16}
                borderWidth={1}
                borderColor={isDark ? '#555' : '#E8E8E8'}
                borderStyle="dashed"
                borderRadius={2}
                justifyContent="center"
                alignItems="center"
                bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
              >
                {showOwnership === 'Owned' ? (
                  <CheckIcon
                    width={10}
                    height={10}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                ) : (
                  <Box width={6} height={6} borderRadius={1} bg={isDark ? '$textDark400' : '#A3A3A3'} />
                )}
              </Box>
              <Text
                color={isDark ? '$textDark400' : '#A3A3A3'}
                fontSize={10}
                fontWeight="$normal"
              >
                {showOwnership === 'Owned' ? t('card.owned') : t('card.tried')}
              </Text>
            </HStack>
          )}
        </VStack>
      </HStack>
      
      {/* Chevron Icon */}
      {(shouldShowAverageRating || shouldShowChevron) && (
        <Box alignItems="center" justifyContent="center">
          <ChevronRightIcon width={24} height={24} color={isDark ? '#fff' : '#A3A3A3'} />
        </Box>
      )}
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

export const ProductInfoCard = memo(ProductInfoCardComponent);
ProductInfoCard.displayName = 'ProductInfoCard';

