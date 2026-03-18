import React from 'react';
import {
  Box,
  VStack,
  Text,
  Image,
  Pressable,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { Badge, BadgeRarity } from '@/src/mock/profile/badges/types';

interface BadgeCardProps {
  badge: Badge;
  onPress?: () => void;
}

const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'Usual':
      return '#6B7280';
    case 'Rare':
      return '#EC4899';
    case 'Epic':
      return '#8B5CF6';
    case 'Legendary':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
};

const getRarityBgColor = (rarity: BadgeRarity, isDark: boolean): string => {
  switch (rarity) {
    case 'Usual':
      return isDark ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.1)';
    case 'Rare':
      return isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)';
    case 'Epic':
      return isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)';
    case 'Legendary':
      return isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)';
    default:
      return isDark ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.1)';
  }
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  badge,
  onPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '$backgroundDark900' : '$white'}
        borderRadius="$xl"
        p="$4"
        borderWidth={1}
        borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
      >
        <VStack space="md" alignItems="center">
          {/* Badge Icon */}
          <Box
            width={125}
            height={125}
            borderRadius="$xl"
            overflow="hidden"
            justifyContent="center"
            alignItems="center"
            bg={"transparent"}
          >
            <Image
              source={badge.icon}
              alt={badge.title}
              style={{
                width: 125,
                height: 125,
              }}
              resizeMode="contain"
            />
          </Box>

          {/* Badge Title */}
          <Text
            fontSize={13}
            fontWeight="$semibold"
            color={isDark ? '$textDark50' : '$textLight950'}
            textAlign="center"
            numberOfLines={2}
            lineHeight={18}
          >
            {badge.title}
          </Text>

          {/* Rarity Badge */}
          <Box
            bg={getRarityBgColor(badge.rarity, isDark)}
            py="$2"
            px="$3"
            borderRadius="$full"
          >
            <Box flexDirection="row" alignItems="center" justifyContent="center">
              <Feather
                name="award"
                size={12}
                color={getRarityColor(badge.rarity)}
              />
              <Text
                fontSize={11}
                fontWeight="$medium"
                color={getRarityColor(badge.rarity)}
                ml="$1"
              >
                {badge.rarity}
              </Text>
            </Box>
          </Box>
        </VStack>
      </Box>
    </Pressable>
  );
};

export default BadgeCard;
