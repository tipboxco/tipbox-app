import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VStack, Text, Image, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { Badge, BadgeRarity } from '@/src/mock/profile/badges/types';

interface BadgeCardProps {
  badge: Badge;
  onPress?: () => void;
}

const RARITY_CONFIG: Record<BadgeRarity, { ring: string; label: string; glow: string }> = {
  Usual:     { ring: '#6B7280', label: '#6B7280', glow: 'rgba(107,114,128,0.2)' },
  Rare:      { ring: '#CD7F32', label: '#CD7F32', glow: 'rgba(205,127,50,0.25)' },
  Epic:      { ring: '#C0C0C0', label: '#9CA3AF', glow: 'rgba(192,192,192,0.25)' },
  Legendary: { ring: '#FFD700', label: '#F59E0B', glow: 'rgba(255,215,0,0.3)' },
};

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const cfg = RARITY_CONFIG[badge.rarity] ?? RARITY_CONFIG.Usual;

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <VStack alignItems="center" space="xs">
        {/* Circular badge with rarity ring */}
        <View style={[styles.ringOuter, { borderColor: cfg.ring, shadowColor: cfg.glow }]}>
          <View style={[styles.ringInner, { backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6' }]}>
            <Image
              source={badge.icon}
              alt={badge.title}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Title */}
        <Text
          fontSize={11}
          fontWeight="$semibold"
          color={isDark ? '#FFFFFF' : '#111111'}
          textAlign="center"
          numberOfLines={2}
          lineHeight={14}
          maxWidth={80}
        >
          {badge.title}
        </Text>

        {/* Rarity label */}
        <View style={[styles.rarityPill, { borderColor: cfg.ring }]}>
          <Text fontSize={9} fontWeight="$bold" color={cfg.label}>
            {badge.rarity}
          </Text>
        </View>
      </VStack>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  ringOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    padding: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 6,
  },
  ringInner: {
    flex: 1,
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeImage: {
    width: 62,
    height: 62,
  },
  rarityPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

export default BadgeCard;
