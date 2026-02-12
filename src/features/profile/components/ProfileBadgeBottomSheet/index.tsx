import React from 'react';
import { Box, VStack, HStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource } from '@/src/utils';
import type { Badge } from '../../types';

/**
 * Profile Badge Bottom Sheet
 * Figma: https://www.figma.com/design/HPaYxxtzLlG25uvSSnph8d/Tipbox---Screen-Designs?node-id=6594-24141
 * Kullanıcının kendi profilindeki badges bölümünde kazandığı badge'e tıklanınca açılan bottom sheet.
 */
export interface ProfileBadgeBottomSheetProps {
  badge: Badge;
  onClose: () => void;
}

const ProfileBadgeBottomSheet: React.FC<ProfileBadgeBottomSheetProps> = ({ badge, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const imageSource = badge.image
    ? toImageSource(badge.image)
    : require('@/assets/defaultImages/default-badge.png');
  const description = `You earned the "${badge.title}" badge!`;

  return (
    <Box pb="$6" px="$4">
      {/* Handle bar - Figma bottom sheet üst çizgi (GlobalBottomSheet handle ile birlikte) */}
      <VStack space="lg" alignItems="center">
        {/* Close (X) - sağ üst */}
        <HStack w="100%" justifyContent="flex-end" alignItems="center" mb="-$2">
          <Pressable onPress={onClose} hitSlop={12} p="$1">
            <Text fontSize="$xl" color={isDark ? '$textDark400' : '$textLight600'}>
              ✕
            </Text>
          </Pressable>
        </HStack>

        {/* Badge image - büyük, ortada */}
        <Box
          w={140}
          h={140}
          borderRadius={70}
          overflow="hidden"
          bg={isDark ? '#2A2A2A' : '#F0F0F0'}
          alignItems="center"
          justifyContent="center"
        >
          <Image
            source={imageSource}
            alt={badge.title}
            style={{ width: 112, height: 112 }}
            resizeMode="contain"
          />
        </Box>

        {/* Title */}
        <Text
          fontSize="$xl"
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '$textLight900'}
          textAlign="center"
          px="$2"
        >
          {badge.title}
        </Text>

        {/* Description */}
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark400' : '$textLight600'}
          textAlign="center"
          px="$4"
          lineHeight={20}
        >
          {description}
        </Text>

        {/* CTA - Close / Completed (profilde kazanılmış badge) */}
        <Pressable
          onPress={onClose}
          bg="#C2E607"
          borderRadius={12}
          h={52}
          w="100%"
          maxWidth={280}
          alignItems="center"
          justifyContent="center"
          mt="$2"
        >
          <Text color="#111827" fontSize="$md" fontWeight="$bold">
            Close
          </Text>
        </Pressable>
      </VStack>
    </Box>
  );
};

export default ProfileBadgeBottomSheet;
