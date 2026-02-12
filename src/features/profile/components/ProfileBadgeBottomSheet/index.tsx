import React from 'react';
import { Box, VStack, HStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';
import { Feather } from '@expo/vector-icons';
import type { Badge } from '../../types';

/**
 * Profile Badge Bottom Sheet
 * Figma 6594-24141 oran ve ölçü: handle, close, başlık, badge, Claim NFT, Details.
 * 8pt grid: padding 24, badge 120, buton h 48, detail row h 48.
 */
export interface ProfileBadgeBottomSheetProps {
  badge: Badge;
  onClose: () => void;
}

const formatEarnedDate = (earnedAt: string | null | undefined): string => {
  if (!earnedAt) return '–';
  try {
    const d = new Date(earnedAt);
    if (isNaN(d.getTime())) return '–';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '–';
  }
};

const ProfileBadgeBottomSheet: React.FC<ProfileBadgeBottomSheetProps> = ({ badge, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const imageSource = badge.image
    ? toImageSource(badge.image)
    : require('@/assets/defaultImages/default-badge.png');
  const earnedDate = formatEarnedDate(badge.earnedAt ?? null);
  const rarity = badge.rarity?.trim() || 'Usual';
  const owner = badge.owner?.trim() || '–';

  const detailRowBg = isDark ? '#2A2A2A' : '#F5F5F5';
  const labelColor = isDark ? '#8C8C8C' : '#6B7280';
  const valueColor = isDark ? '#FFFFFF' : '#111827';

  return (
    <Box pb="$4" px="$4">
      {/* Header: sol close, ortada başlık */}
      <HStack w="100%" alignItems="center" justifyContent="space-between" mb="$2">
        <Pressable onPress={onClose} hitSlop={12} w={36} h={36} alignItems="center" justifyContent="center" borderRadius={10} bg={isDark ? '#2A2A2A' : '#E5E5E5'}>
          <Feather name="x" size={18} color={isDark ? '#FFFFFF' : '#374151'} />
        </Pressable>
        <Text flex={1} fontSize="$md" fontWeight="$bold" color={valueColor} textAlign="center" numberOfLines={1}>
          {badge.title}
        </Text>
        <Box w={36} />
      </HStack>

      {/* Badge görseli - arka plan yok, sadece ikon */}
      <Box alignSelf="center" alignItems="center" justifyContent="center" mt="$1" mb="$2">
        <Image
          source={imageSource}
          alt={badge.title}
          style={{ width: 80, height: 80 }}
          resizeMode="contain"
        />
      </Box>

      {/* Claim NFT butonu - küçük kapsül, neon lime yeşil, ince koyu yeşil çerçeve */}
      <Pressable
        onPress={onClose}
        alignSelf="center"
        alignItems="center"
        justifyContent="center"
        px="$5"
        py="$2.5"
        minHeight={40}
        borderRadius={999}
        bg="#E8FF6B"
        mt="$2"
      >
        <Text color="#111827" fontSize="$sm" fontWeight="$bold">
          Claim NFT
        </Text>
      </Pressable>

      {/* Details bölümü */}
      <Text fontSize="$sm" fontWeight="$bold" color={labelColor} mt="$5" mb="$3">
        Details
      </Text>
      <VStack borderRadius={12} overflow="hidden" bg={detailRowBg}>
        <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3" borderBottomWidth={1} borderBottomColor={isDark ? '#333' : '#E5E5E5'}>
          <Text fontSize="$sm" color={labelColor}>Kazanma Tarihi</Text>
          <Text fontSize="$sm" color={valueColor}>{earnedDate}</Text>
        </HStack>
        <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3" borderBottomWidth={1} borderBottomColor={isDark ? '#333' : '#E5E5E5'}>
          <Text fontSize="$sm" color={labelColor}>Enderlik</Text>
          <HStack alignItems="center" bg={isDark ? '#3A3A3A' : '#E5E5E5'} borderRadius={8} px="$2" py="$1">
            <Feather name="award" size={14} color={valueColor} style={{ marginRight: 6 }} />
            <Text fontSize="$sm" color={valueColor}>{rarity}</Text>
          </HStack>
        </HStack>
        <HStack justifyContent="space-between" alignItems="center" px="$4" py="$3">
          <Text fontSize="$sm" color={labelColor}>Sahip</Text>
          <Text fontSize="$sm" color={valueColor}>{owner}</Text>
        </HStack>
      </VStack>
    </Box>
  );
};

export default ProfileBadgeBottomSheet;
