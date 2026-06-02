import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { VStack, Text, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';

interface BadgeCardProps {
  data: SeeAllReward;
  onPress?: () => void;
}

const TIER_RING_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

const TIER_GLOW_COLORS: Record<string, string> = {
  bronze: 'rgba(205,127,50,0.35)',
  silver: 'rgba(192,192,192,0.35)',
  gold: 'rgba(255,215,0,0.4)',
};

export const BadgeCard: React.FC<BadgeCardProps> = ({ data, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const isUnlocked = data.isUnlocked ?? false;
  const tier = data.tier;

  const ringColor = !isUnlocked
    ? (isDark ? '#333333' : '#D1D5DB')
    : tier
      ? TIER_RING_COLORS[tier]
      : '#BBFF4E';

  const glowColor = !isUnlocked
    ? 'transparent'
    : tier
      ? TIER_GLOW_COLORS[tier]
      : 'rgba(187,255,78,0.3)';

  const isGold = isUnlocked && tier === 'gold';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.pressable}>
      <VStack alignItems="center" space="xs">
        {/* Circular badge — gold gets a double ring */}
        {isGold ? (
          <View style={[styles.ringOuterGold, { borderColor: '#FFD700', shadowColor: glowColor, opacity: 1 }]}>
            <View style={[styles.ringOuter, { borderColor: ringColor, shadowColor: 'transparent', opacity: 1, elevation: 0, marginBottom: 0 }]}>
              <View style={[styles.ringInner, { backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6' }]}>
                <Image
                  source={data.image || require('@/assets/defaultImages/default-badge.png')}
                  alt={data.title}
                  style={styles.badgeImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.ringOuter, { borderColor: ringColor, shadowColor: glowColor, opacity: isUnlocked ? 1 : 0.45 }]}>
            <View style={[styles.ringInner, { backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6' }]}>
              <Image
                source={data.image || require('@/assets/defaultImages/default-badge.png')}
                alt={data.title}
                style={styles.badgeImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Title */}
        <Text
          color={isDark ? (isUnlocked ? '#FFFFFF' : '#666666') : (isUnlocked ? '#111111' : '#9CA3AF')}
          fontSize={12}
          fontWeight="$bold"
          textAlign="center"
          numberOfLines={2}
          maxWidth={90}
        >
          {data.title}
        </Text>

        {/* Description */}
        {data.description ? (
          <Text
            color={isDark ? '#888888' : '#6B7280'}
            fontSize={10}
            lineHeight={13}
            textAlign="center"
            numberOfLines={2}
            maxWidth={90}
          >
            {data.description}
          </Text>
        ) : null}

        {/* Unlocked indicator */}
        {isUnlocked && (
          <View style={styles.unlockedPill}>
            <Text fontSize={9} fontWeight="$bold" color="#000000">
              ✓
            </Text>
          </View>
        )}
      </VStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  ringOuterGold: {
    width: 98,
    height: 98,
    borderRadius: 49,
    borderWidth: 2,
    padding: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    padding: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 6,
  },
  ringInner: {
    flex: 1,
    borderRadius: 45,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeImage: {
    width: 70,
    height: 70,
  },
  unlockedPill: {
    backgroundColor: '#BBFF4E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});

export default BadgeCard;
