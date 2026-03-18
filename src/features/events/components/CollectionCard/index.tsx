import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ImageBackground } from 'react-native';
import type { Collection } from '../../types/collection.types';
import { toImageSource } from '@/src/utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

const DEFAULT_COLLECTION_IMAGE = require('@/assets/defaultImages/default-collection.png');

interface CollectionCardProps {
  collection: Collection;
  isFullWidth?: boolean;
  onPress?: (id: string) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  isFullWidth = false,
  onPress,
}) => {
  const cardHeight = isFullWidth ? 200 : 160;
  const bgImageSource = toImageSource(collection.coverImage) || DEFAULT_COLLECTION_IMAGE;

  const renderContent = () => (
    <View style={styles.innerContainer}>
      {/* Top row: MainCategory name (left) + Progress (right) */}
      <View style={styles.topRow}>
        {collection.mainCategory?.name ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{collection.mainCategory.name}</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {collection.earnedBadges ?? 0}/{collection.totalBadges ?? 0}
          </Text>
        </View>
      </View>

      {/* Bottom: Title + Description on transparent dark bg */}
      <View style={styles.bottomSection}>
        <Text style={styles.title} numberOfLines={1}>
          {collection.title}
        </Text>
        {collection.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {collection.description}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Pressable
      style={[
        styles.cardContainer,
        {
          width: isFullWidth ? '100%' : CARD_WIDTH,
          height: cardHeight,
        },
      ]}
      onPress={() => onPress?.(collection.id)}
    >
      <ImageBackground
        source={bgImageSource}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        {renderContent()}
      </ImageBackground>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    borderRadius: 16,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBadge: {
    flexShrink: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
});

export default CollectionCard;
