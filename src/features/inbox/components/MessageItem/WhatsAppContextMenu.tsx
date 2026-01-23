import React, { useEffect } from 'react';
import { View, Text as RNText, TouchableOpacity, Dimensions, Platform, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

// Haptic feedback - opsiyonel (expo-haptics yoksa çalışmaz)
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics yoksa sessizce devam et
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MenuAction {
  id: string;
  label: string;
  icon: string;
  color?: string;
  onPress: () => void;
}

interface WhatsAppContextMenuProps {
  visible: boolean;
  onClose: () => void;
  messagePosition: { x: number; y: number; width: number; height: number } | null;
  reactionBarPosition: { x: number; y: number } | null;
  actions: MenuAction[];
  reactionEmojis: string[];
  onReactionPress: (emoji: string) => void;
  isDark: boolean;
  isSent: boolean;
}

const REACTION_BAR_HEIGHT = 50;
const MENU_ITEM_HEIGHT = 50;
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};

export const WhatsAppContextMenu: React.FC<WhatsAppContextMenuProps> = ({
  visible,
  onClose,
  messagePosition,
  reactionBarPosition,
  actions,
  reactionEmojis,
  onReactionPress,
  isDark,
  isSent,
}) => {
  const overlayOpacity = useSharedValue(0);
  const reactionBarScale = useSharedValue(0);
  const reactionBarOpacity = useSharedValue(0);
  const menuScale = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const messageScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      // Haptic feedback (opsiyonel)
      if (Haptics && Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Animasyonları başlat
      overlayOpacity.value = withTiming(1, { duration: 200 });
      messageScale.value = withSpring(1.05, SPRING_CONFIG);
      
      // Reaction bar animasyonu (stagger ile)
      reactionBarScale.value = withSpring(1, SPRING_CONFIG);
      reactionBarOpacity.value = withTiming(1, { duration: 200 });
      
      // Menu animasyonu (biraz gecikme ile)
      menuScale.value = withDelay(50, withSpring(1, SPRING_CONFIG));
      menuOpacity.value = withDelay(50, withTiming(1, { duration: 200 }));
    } else {
      // Animasyonları kapat
      overlayOpacity.value = withTiming(0, { duration: 150 });
      messageScale.value = withSpring(1, SPRING_CONFIG);
      reactionBarScale.value = withTiming(0, { duration: 150 });
      reactionBarOpacity.value = withTiming(0, { duration: 150 });
      menuScale.value = withTiming(0, { duration: 150 });
      menuOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const reactionBarStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      reactionBarScale.value,
      [0, 1],
      [0.8, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: reactionBarOpacity.value,
      transform: [{ scale }],
    };
  });

  const menuStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      menuScale.value,
      [0, 1],
      [0.9, 1],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: menuOpacity.value,
      transform: [{ scale }],
    };
  });

  const messageBubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: messageScale.value }],
  }));

  if (!visible || !messagePosition) return null;

  // Reaction bar pozisyonu (mesajın üstünde)
  const reactionBarY = messagePosition.y - REACTION_BAR_HEIGHT - 8;
  const reactionBarX = isSent 
    ? messagePosition.x + messagePosition.width - (reactionEmojis.length * 40) - 8
    : messagePosition.x + 8;

  // Menu pozisyonu (mesajın altında)
  const menuY = messagePosition.y + messagePosition.height + 8;
  const menuX = isSent 
    ? messagePosition.x + messagePosition.width - 180
    : messagePosition.x;

  // Menu item animasyonları için shared values
  const menuItemOpacity = useSharedValue(0);
  const menuItemTranslateY = useSharedValue(10);

  useEffect(() => {
    if (visible) {
      menuItemOpacity.value = withDelay(50, withTiming(1, { duration: 200 }));
      menuItemTranslateY.value = withDelay(50, withSpring(0, SPRING_CONFIG));
    } else {
      menuItemOpacity.value = withTiming(0, { duration: 150 });
      menuItemTranslateY.value = withTiming(10, { duration: 150 });
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          {
            flex: 1,
          },
          overlayStyle,
        ]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
      {/* Blur Overlay */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1 }}
      >
        <BlurView
          intensity={20}
          tint={isDark ? 'dark' : 'light'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </TouchableOpacity>

      {/* Message Bubble Highlight (animated scale) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: messagePosition.x,
            top: messagePosition.y,
            width: messagePosition.width,
            height: messagePosition.height,
            borderRadius: 16,
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
          },
          messageBubbleStyle,
        ]}
        pointerEvents="none"
      />

      {/* Reaction Bar */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: Math.max(8, Math.min(reactionBarX, SCREEN_WIDTH - (reactionEmojis.length * 40) - 8)),
            top: Math.max(8, reactionBarY),
            flexDirection: 'row',
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderRadius: 25,
            paddingHorizontal: 8,
            paddingVertical: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          },
          reactionBarStyle,
        ]}
      >
        {reactionEmojis.map((emoji, index) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => {
              onReactionPress(emoji);
              onClose();
            }}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText style={{ fontSize: 24 }}>{emoji}</RNText>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Context Menu */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: Math.max(8, Math.min(menuX, SCREEN_WIDTH - 180 - 8)),
            top: Math.min(menuY, SCREEN_HEIGHT - (actions.length * MENU_ITEM_HEIGHT) - 8),
            width: 180,
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
            overflow: 'hidden',
          },
          menuStyle,
        ]}
      >
        {actions.map((action, index) => {
          const itemStyle = useAnimatedStyle(() => {
            // Stagger efekti için her item'a farklı delay
            const delay = index * 20;
            const itemOpacity = interpolate(
              menuItemOpacity.value,
              [0, 1],
              [0, 1],
              Extrapolate.CLAMP
            );
            const itemTranslateY = interpolate(
              menuItemTranslateY.value,
              [10, 0],
              [10, 0],
              Extrapolate.CLAMP
            );
            
            return {
              opacity: itemOpacity,
              transform: [{ translateY: itemTranslateY }],
            };
          });
          
          return (
            <Animated.View key={action.id} style={itemStyle}>
              <TouchableOpacity
                onPress={() => {
                  action.onPress();
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                }}
              >
                <Feather
                  name={action.icon as any}
                  size={16}
                  color={action.color || (isDark ? '#FFFFFF' : '#000000')}
                />
                <RNText
                  style={{
                    color: action.color || (isDark ? '#FFFFFF' : '#000000'),
                    fontSize: 14,
                    fontWeight: '500',
                    marginLeft: 12,
                  }}
                >
                  {action.label}
                </RNText>
              </TouchableOpacity>
              {index < actions.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: isDark ? '#333' : '#E5E5E5',
                    marginLeft: 16,
                  }}
                />
              )}
            </Animated.View>
          );
        })}
      </Animated.View>
      </Animated.View>
    </Modal>
  );
};
