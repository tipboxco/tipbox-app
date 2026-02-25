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
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { mediaService } from '@/src/services/MediaService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const cardScale = useSharedValue(1);

  // Front side animation
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180], [0, 180]);
    const opacity = interpolate(flipRotation.value, [0, 90, 180], [1, 0, 0]);
    return {
      transform: [
        { perspective: 1500 },
        { rotateY: `${rotateY}deg` },
        { scale: cardScale.value },
      ],
      opacity,
      backfaceVisibility: 'hidden',
    };
  });

  // Back side animation
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipRotation.value, [0, 180, 360], [180, 360, 360]);
    const opacity = interpolate(flipRotation.value, [0, 90, 180], [0, 0, 1]);
    return {
      transform: [
        { perspective: 1500 },
        { rotateY: `${rotateY}deg` },
        { scale: cardScale.value },
      ],
      opacity,
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

  const performDownload = async () => {
    try {
      if (!badge.icon) {
        Alert.alert('Hata', 'İndirilecek badge resmi bulunamadı');
        setIsDownloading(false);
        return;
      }

      // MediaService now handles both local require() and remote URLs
      const result = await mediaService.saveImageToGallery(
        badge.icon,
        `${badge.title.replace(/\s+/g, '_')}_badge.png`
      );

      if (result.success) {
        Alert.alert('Başarılı!', 'Badge galerinize kaydedildi');
      } else {
        Alert.alert('Hata', result.error || 'Badge kaydedilemedi');
      }
    } catch (error) {
      console.error('[CollectionCardModal] Download error:', error);
      Alert.alert('Hata', 'Badge indirme sırasında bir hata oluştu');
    } finally {
      setIsDownloading(false);
    }
  };

  const setBackSide = () => {
    'worklet';
    flipRotation.value = 180;
  };

  const handleDownload = () => {
    if (!isCompleted || isDownloading) return;

    console.log('[CollectionCardModal] Download badge pressed');
    setIsDownloading(true);

    // Scale down slightly
    cardScale.value = withTiming(0.95, { duration: 100 });

    // Scale back to normal
    cardScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });

    // 360 degree flip animation - stays on back side
    flipRotation.value = withTiming(
      360,
      {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          // Set to back side after animation
          setBackSide();
          // Start download
          runOnJS(performDownload)();
        }
      }
    );
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

          {/* BACK SIDE - Badge with Blur Background */}
          <Animated.View
            style={[
              styles.container,
              styles.backSide,
              backAnimatedStyle,
            ]}
          >
            <Pressable 
              onPress={(e) => e.stopPropagation()}
              style={styles.backContainer}
            >
              {/* Blur Background with Badge Image */}
              <View style={styles.backImageWrapper}>
                {badge.icon ? (
                  <>
                    {/* Background Image (Blurred) */}
                    <Image
                      source={
                        typeof badge.icon === 'string'
                          ? { uri: badge.icon }
                          : badge.icon
                      }
                      style={styles.backBackgroundImage}
                      resizeMode="cover"
                      blurRadius={50}
                    />
                    
                    {/* BlurView Overlay */}
                    <BlurView
                      intensity={80}
                      tint={isDark ? 'dark' : 'light'}
                      style={styles.blurOverlay}
                    />

                    {/* Main Badge Image (Centered, Sharp) */}
                    <View style={styles.backBadgeContainer}>
                      <Image
                        source={
                          typeof badge.icon === 'string'
                            ? { uri: badge.icon }
                            : badge.icon
                        }
                        style={styles.backBadgeImage}
                        resizeMode="contain"
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.backBadgePlaceholder}>
                    <Feather name="award" size={120} color="#C1BEBF" />
                  </View>
                )}
              </View>

              {/* Badge Info at Bottom */}
              <View style={styles.backInfo}>
                <Text style={styles.backTitle}>{badge.title}</Text>
                <Text style={styles.backSubtitle}>Completed Badge</Text>
              </View>

              {/* Decorative Elements */}
              <View style={styles.backTopLeftDecor}>
                <Feather name="award" size={24} color="rgba(255, 255, 255, 0.15)" />
              </View>
              <View style={styles.backBottomRightDecor}>
                <Text style={styles.badgeIdText}>#{badge.id}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    height: 550,
    position: 'relative',
  },
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    position: 'absolute',
    overflow: 'hidden',
  },
  contentWrapper: {
    width: '100%',
    height: '100%',
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
  reminderText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
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

  // BACK SIDE STYLES
  backSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
  },
  backContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  backImageWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backBadgeContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    marginTop: -100,
    marginLeft: -100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBadgeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  backBadgePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backInfo: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 4,
  },
  backTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  backSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backTopLeftDecor: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  backBottomRightDecor: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  badgeIdText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.3)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default CollectionCardModal;
