import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Collection } from '../../types/collection.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 16;
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

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
  const isCompleted = collection.currentProgress >= collection.totalProgress;

  return (
    <Pressable
      style={[
        styles.cardContainer,
        {
          width: isFullWidth ? '100%' : CARD_WIDTH,
          height: isFullWidth ? 200 : 160,
        },
      ]}
      onPress={() => onPress?.(collection.id)}
    >
      <LinearGradient
        colors={collection.backgroundGradient.colors}
        start={collection.backgroundGradient.start}
        end={collection.backgroundGradient.end}
        style={styles.gradient}
      >
        {/* Progress Badge */}
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {collection.currentProgress}/{collection.totalProgress}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {collection.title}
          </Text>
          {collection.description && (
            <Text style={styles.description} numberOfLines={2}>
              {collection.description}
            </Text>
          )}
        </View>

        {/* Completed Overlay (if completed) */}
        {isCompleted && (
          <View style={styles.completedOverlay}>
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completed</Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  gradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  progressBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    marginTop: 'auto',
    gap: 4,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  completedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#D8FF08',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  completedText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CollectionCard;
