import React from 'react';
import { HStack, VStack, Text, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BellIcon } from 'react-native-heroicons/outline';
import { useBrandCatalog } from '../../api/hooks';
import { toImageSource } from '@/src/utils';
import { CachedImage } from '@/src/components/CachedImage';

const DEFAULT_CARD_ICON = require('@/assets/events/card-icon.png');

interface BrandInfoCardProps {
  brandId?: string;
  categoryName?: string;
  onNotificationPress?: () => void;
  onHistoryPress?: () => void;
  showPoints?: boolean;
  points?: number;
}

const BrandInfoCard: React.FC<BrandInfoCardProps> = ({
  brandId,
  categoryName,
  onNotificationPress,
  onHistoryPress,
  showPoints = false,
  points = 0,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const { data: catalog, isLoading: isCatalogLoading } = useBrandCatalog(brandId);

  const brandName = catalog?.name ?? '—';
  const brandImageSource = catalog?.bannerImage
    ? toImageSource(catalog.bannerImage, DEFAULT_CARD_ICON)
    : DEFAULT_CARD_ICON;
  const displayCategory = categoryName ?? catalog?.description ?? '—';

  return (
    <HStack space="md">
      {/* Product Info Card */}
      <Box
        flex={1}
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor={isDark ? '#333333' : '#E9E9E9'}
        borderRadius={10}
        p="$3"
      >
        <HStack alignItems="center">
          <Box
            width={52}
            height={52}
            borderRadius={5}
            bg="rgba(0, 0, 0, 0.2)"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <CachedImage
              source={brandImageSource ?? DEFAULT_CARD_ICON}
              alt={brandName}
              style={{ width: 52, height: 52 }}
              resizeMode="cover"
              priority="normal"
              cachePolicy="memory-disk"
            />
          </Box>

          <VStack flex={1} ml="$3">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={12}
              fontWeight="$bold"
              numberOfLines={1}
            >
              {isCatalogLoading && !catalog ? '…' : brandName}
            </Text>
            <Text
              color="#9B9B9B"
              fontSize={12}
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {displayCategory}
            </Text>
          </VStack>

          <Pressable
            onPress={onNotificationPress}
            p="$2"
          >
            <BellIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>
      </Box>

      {/* Brand History Card */}
      <Pressable
        onPress={onHistoryPress}
      >
        <Box
          width={78}
          bg={isDark ? '#1A1A1A' : '#FDFDFD'}
          borderWidth={1}
          borderColor={isDark ? '#333333' : '#E9E9E9'}
          borderRadius={10}
          p="$3"
          alignItems="center"
        >
          <VStack alignItems="center" space="xs">
            <Box
              width={26}
              height={26}
              borderRadius={13}
              bg={isDark ? '#444444' : '#DDDDDD'}
              borderWidth={2}
              borderColor={isDark ? '#1A1A1A' : '#FFFFFF'}
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
            >
              <CachedImage
                source={require('@/assets/avatar/default-useravatar.png')}
                alt="User Avatar"
                style={{ width: 26, height: 26 }}
                resizeMode="cover"
                priority="normal"
                cachePolicy="memory-disk"
              />
            </Box>

            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={10}
              fontWeight="$bold"
              textAlign="center"
              numberOfLines={2}
            >
              {showPoints ? `${points}\nPoints` : 'Brand\nHistory'}
            </Text>
          </VStack>
        </Box>
      </Pressable>
    </HStack>
  );
};

export default BrandInfoCard;
