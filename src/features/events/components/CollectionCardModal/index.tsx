import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CollectionCardModalProps {
  visible: boolean;
  onClose: () => void;
  badge: {
    id: string;
    title: string;
    description: string;
    icon: ImageSourcePropType | string;
    currentProgress: number;
    totalProgress: number;
    status: 'not_started' | 'in_progress' | 'completed';
  } | null;
}

const CollectionCardModal: React.FC<CollectionCardModalProps> = ({
  visible,
  onClose,
  badge,
}) => {
  // ✅ ALL HOOKS FIRST - before any returns or conditionals
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isDownloading, setIsDownloading] = useState(false);
  const flipRotation = useSharedValue(0);

  // Front side animation
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  // Back side animation
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  // ✅ Early return AFTER all hooks
  if (!badge) return null;

  const progressPercentage = (badge.currentProgress / badge.totalProgress) * 100;
  const isCompleted = badge.status === 'completed';

  const handleSetReminder = () => {
    console.log('[CollectionCardModal] Set Reminder pressed');
    // TODO: Implement reminder functionality
  };

  const handleDownload = () => {
    if (!isCompleted || isDownloading) return;

    console.log('[CollectionCardModal] Download badge pressed');
    setIsDownloading(true);

    // Flip animation (0 to 180 degrees)
    flipRotation.value = withTiming(180, { duration: 600 });

    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      console.log('[CollectionCardModal] Badge downloaded successfully');
    }, 2000);
  };

  const handleSeeRewardPool = () => {
    console.log('[CollectionCardModal] See Reward Pool pressed');
    // TODO: Navigate to reward pool
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Modal Container with Flip Animation */}
        <View style={styles.flipContainer} pointerEvents="box-none">
          {/* FRONT SIDE */}
          <Animated.View
            style={[
              styles.container,
              { backgroundColor: isDark ? '#1A1A1A' : '#FFF' },
              frontAnimatedStyle,
            ]}
            pointerEvents="auto"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.contentWrapper}>
                {/* Close Button (Top Left) */}
                <Pressable
                  onPress={onClose}
                  style={styles.closeButtonTop}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={24} color={isDark ? '#FFF' : '#000'} />
                </Pressable>

                {/* Set Reminder Button (Top Center) */}
                <Pressable
                  onPress={handleSetReminder}
                  style={styles.reminderButtonTop}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="bell" size={16} color="#8E8E93" />
                  <Text style={styles.reminderText}>Set Reminder</Text>
                </Pressable>

                {/* Content */}
                <View style={styles.content}> 
                  {/* Title */}
                  <Text style={[styles.title, { color: isDark ? '#FFF' : '#000' }]}>
                    {badge.title}
                  </Text>

                  {/* Description */}
                  <Text style={styles.description}>{badge.description}</Text>

                  {/* Badge Image */}
                  <View style={styles.badgeImageContainer}>
                    {badge.icon ? (
                      <Image
                        source={
                          typeof badge.icon === 'string'
                            ? { uri: badge.icon }
                            : badge.icon
                        }
                        style={styles.badgeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.badgeImagePlaceholder}>
                        <Feather name="award" size={80} color="#C1BEBF" />
                      </View>
                    )}
                  </View>

                  {/* Progress */}
                  <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                      {badge.currentProgress}/{badge.totalProgress}
                    </Text>
                    <View
                      style={[
                        styles.progressBarContainer,
                        { backgroundColor: isDark ? '#2A2A2A' : '#E9E9E9' },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progressPercentage}%` },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Action Buttons - Side by Side */}
                  <View style={styles.actionButtonsRow}>
                    {/* Download Icon Button (Only for completed) */}
                    {isCompleted && (
                      <Pressable
                        style={[
                          styles.downloadIconButton,
                          {
                            backgroundColor: isDownloading ? '#4A4A4A' : '#2A2A2A',
                            opacity: isDownloading ? 0.6 : 1,
                          },
                        ]}
                        onPress={handleDownload}
                        disabled={isDownloading}
                      >
                        <Feather
                          name={isDownloading ? 'loader' : 'download'}
                          size={20}
                          color="#FFF"
                        />
                      </Pressable>
                    )}

                    {/* See Reward Pool Button (Always visible) */}
                    <Pressable
                      style={[
                        styles.rewardButton,
                        {
                          backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                          flex: 1,
                        },
                      ]}
                      onPress={handleSeeRewardPool}
                    >
                      <Text style={styles.rewardButtonText}>See Reward Pool</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* BACK SIDE - Downloaded Badge Card */}
          <Animated.View
            style={[
              styles.container,
              styles.backSide,
              backAnimatedStyle,
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.backContent}>
                {/* Badge Image (Larger, Centered) */}
                <View style={styles.backBadgeContainer}>
                  {badge.icon ? (
                    <Image
                      source={
                        typeof badge.icon === 'string'
                          ? { uri: badge.icon }
                          : badge.icon
                      }
                      style={styles.backBadgeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.backBadgePlaceholder}>
                      <Feather name="award" size={120} color="#C1BEBF" />
                    </View>
                  )}
                </View>

                {/* Badge Info */}
                <View style={styles.backInfo}>
                  <Text style={styles.backTitle}>{badge.title}</Text>
                  <Text style={styles.backDescription}>{badge.description}</Text>
                </View>

                {/* Badge Number (Bottom Right) */}
                <View style={styles.badgeNumber}>
                  <Feather name="award" size={40} color="rgba(255, 255, 255, 0.1)" />
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    position: 'relative',
  },
  container: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  contentWrapper: {
    width: '100%',
    position: 'relative',
  },
  closeButtonTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  reminderButtonTop: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E9E9E9',
    marginBottom: 16,
  },
  backSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2A2A2A',
    minHeight: 500,
  },
  backContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  backBadgeContainer: {
    width: 240,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: 32,
  },
  backBadgeImage: {
    width: '100%',
    height: '100%',
  },
  backBadgePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backInfo: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  backTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  backDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  badgeNumber: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  content: {
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  badgeImageContainer: {
    width: 180,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    marginVertical: 8,
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
  badgeImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A4A4A',
    borderRadius: 4,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  actionButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  downloadIconButton: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  rewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 56,
  },
  rewardButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
});

export default CollectionCardModal;
