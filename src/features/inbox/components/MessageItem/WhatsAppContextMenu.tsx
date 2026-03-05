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
import { Svg, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

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

const REACTION_BAR_HEIGHT = 40; // Küçültüldü
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
  const { t } = useTranslation('inbox');
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
    ? messagePosition.x + messagePosition.width - (reactionEmojis.length * 32) - 8
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
      {/* Overlay - Blur yok, sadece tıklanabilir alan */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ 
          flex: 1, 
          backgroundColor: 'transparent' 
        }}
      />

      {/* Delete Button - Icon + Text (Mesajın Altında) */}
      {(() => {
        const deleteAction = actions.find(a => a.id === 'delete');
        
        // ✅ FIX: Silinen mesajlara delete butonu ekleme
        if (!deleteAction) return null;
        
        // Mesajın altında pozisyon hesapla
        // Delete butonu mesaj bubble'ın sağ kenarıyla aynı hizada olmalı ama sağ kenardan biraz boşluk olmalı
        const deleteButtonY = messagePosition.y + messagePosition.height + 4; // Biraz yukarı taşındı (8'den 4'e)
        const deleteButtonWidth = 120; // Butonun tahmini genişliği
        
        // ✅ FIX: Image mesajlar için delete butonu pozisyonu - sağ kenara hizala
        // Gönderilen mesajlar için: mesajın sağ kenarıyla hizalı ama ekranın sağ kenarından 16px boşluk
        // Alınan mesajlar için: mesajın sol kenarıyla hizalı
        let deleteButtonX: number;
        if (isSent) {
          // Gönderilen mesajlar: sağ kenara hizala
          // Mesaj bubble'ın sağ kenarı = messagePosition.x + messagePosition.width
          // Ekranın sağ kenarından 16px boşluk bırak
          const screenRightEdge = SCREEN_WIDTH;
          const messageRightEdge = messagePosition.x + messagePosition.width;
          // Delete butonu mesajın sağ kenarıyla hizalı ama ekranın sağ kenarından 16px boşluk
          deleteButtonX = Math.min(
            messageRightEdge - deleteButtonWidth,
            screenRightEdge - deleteButtonWidth - 16
          );
        } else {
          // Alınan mesajlar: mesajın sol kenarıyla hizalı
          deleteButtonX = messagePosition.x;
        }
        
        return (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: deleteButtonX,
                top: deleteButtonY,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12, // Mesaj bubble ile aynı
                paddingVertical: 8, // Mesaj bubble ile aynı
                borderRadius: 16, // Mesaj bubble ile aynı (20'den 16'ya değiştirildi)
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 5,
                gap: 6,
              },
              menuStyle,
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                deleteAction.onPress();
                onClose();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Feather
                name="trash-2"
                size={14} // Mesaj text size'ına göre ayarlandı (18'den 14'e)
                color="#F44336"
              />
              <RNText
                style={{
                  color: '#F44336',
                  fontSize: 14, // Mesaj bubble fontSize="$sm" ile aynı
                  fontWeight: 'normal', // Mesaj bubble fontWeight="$normal" ile aynı (600'den normal'e)
                }}
              >
                {t('messageDetail.actions.delete')}
              </RNText>
            </TouchableOpacity>
          </Animated.View>
        );
      })()}

      </Animated.View>
    </Modal>
  );
};
