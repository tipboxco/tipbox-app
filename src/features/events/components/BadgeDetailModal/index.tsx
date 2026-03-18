import React from 'react';
import { Dimensions, Modal, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface BadgeDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  data: SeeAllReward | null;
  eventId: string;
  badgeId?: string;
}

export const BadgeDetailModal: React.FC<BadgeDetailModalProps> = React.memo(({
  isVisible,
  onClose,
  data,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  if (!isVisible || !data) return null;

  const progressPercent = data.task > 0
    ? Math.min((data.completed / data.task) * 100, 100)
    : 0;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.container, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#333333' : '#F0F0F0' }]}>
          <Pressable
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
            numberOfLines={1}
          >
            {data.title}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge Image */}
          <View style={styles.imageContainer}>
            <Image
              source={data.image || require('@/assets/defaultImages/default-badge.png')}
              alt={data.title}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          </View>

          {/* Description */}
          {data.description ? (
            <Text style={[styles.description, { color: isDark ? '#CCCCCC' : '#666666' }]}>
              {data.description}
            </Text>
          ) : null}

          {/* Progress */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: data.isUnlocked ? '#0C7A24' : '#686868',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: isDark ? '#8C8C8C' : '#797979' }]}>
              {data.isUnlocked
                ? 'Completed'
                : `${data.completed}/${data.task}`}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.data?.id === nextProps.data?.id
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  imageContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badgeImage: {
    width: 220,
    height: 220,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
  },
});

BadgeDetailModal.displayName = 'BadgeDetailModal';

export default BadgeDetailModal;
