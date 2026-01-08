import React, { useState, useEffect } from 'react';
import { View, TextInput, Dimensions, Keyboard as RNKeyboard, Platform } from 'react-native';
import { HStack, Icon, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ImageIcon, SendIcon, SmileIcon } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface DraggableKeyboardProps {
  onSendMessage?: (message: string) => void;
  onAddImage?: () => void;
  onAddEmoji?: () => void;
  placeholder?: string;
  initialMessage?: string;
  minHeight?: number;
}

export const DraggableKeyboard: React.FC<DraggableKeyboardProps> = ({
  onSendMessage,
  onAddImage,
  onAddEmoji,
  placeholder = "Mesajınızı yazın...",
  initialMessage = '',
  minHeight = 140,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const [message, setMessage] = useState(initialMessage);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Reanimated shared value - performanslı animasyon için
  const animatedHeight = useSharedValue(minHeight);

  // Animasyonlu style - UI thread'de çalışır
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
    };
  });

  // Smooth animasyon fonksiyonu - Reanimated ile
  const animateToHeight = (targetHeight: number, duration: number = 300) => {
    animatedHeight.value = withTiming(targetHeight, {
      duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  // Başlangıç animasyonu
  useEffect(() => {
    animatedHeight.value = minHeight;
  }, [minHeight]);

  // Klavye event listener'ları
  useEffect(() => {
    const keyboardDidShowListener = RNKeyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = RNKeyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        // Klavye kapandığında component'i ilk haline döndür
        animateToHeight(minHeight, 300);
        setIsExpanded(false);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [minHeight]);

  const handleSendMessage = () => {
    if (message.trim()) {
      if (onSendMessage) {
        onSendMessage(message);
      }
      setMessage('');
      animateToHeight(minHeight, 300);
      setIsExpanded(false);
    }
  };

  const handleAddImage = () => {
    if (onAddImage) {
      onAddImage();
    }
  };

  const handleAddEmoji = () => {
    if (onAddEmoji) {
      onAddEmoji();
    }
  };

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: 'transparent'
      }}
    >
      {/* Mesaj giriş alanı */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderTopLeftRadius: (isExpanded && isKeyboardVisible) ? 0 : 20,
            borderTopRightRadius: (isExpanded && isKeyboardVisible) ? 0 : 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 1000,
          },
          animatedStyle,
        ]}
      >
          {/* Sürükleme göstergesi - sadece klavye açıkken göster */}
          {isKeyboardVisible && (
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: isDark ? '#475569' : '#D1D5DB',
                borderRadius: 2,
                alignSelf: 'center',
                marginTop: 8,
                marginBottom: 8,
              }}
            />
          )}

          {/* Mesaj giriş alanı */}
          <View style={{ 
            flex: 1, 
            paddingHorizontal: 16,
            paddingTop: isKeyboardVisible ? 0 : 16,
            paddingBottom: isExpanded ? 20 : 8,
          }}>
            <TextInput
              style={{
                flex: 1,
                fontSize: isExpanded ? 18 : 16,
                color: isDark ? '#F1F5F9' : '#111827',
                textAlignVertical: 'top',
                paddingTop: 0,
                paddingBottom: 8,
                lineHeight: isExpanded ? 24 : 20,
              }}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#94A3B8' : '#6B7280'}
              value={message}
              onChangeText={setMessage}
              multiline={isExpanded}
              numberOfLines={isExpanded ? 15 : 1}
            />
          </View>

          {/* Alt butonlar */}
          <HStack
            space="md"
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal={16}
            paddingBottom={isExpanded ? 40 : 16}
            paddingTop={8}
          >
            <HStack space="sm" alignItems="center">
              <Pressable
                onPress={handleAddImage}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDark ? '#334155' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon as={ImageIcon} size="sm" color={isDark ? '#94A3B8' : '#6B7280'} />
              </Pressable>
              
              <Pressable
                onPress={handleAddEmoji}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDark ? '#334155' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon as={SmileIcon} size="sm" color={isDark ? '#94A3B8' : '#6B7280'} />
              </Pressable>
            </HStack>

            <Pressable
              onPress={handleSendMessage}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: message.trim() ? '#6366F1' : (isDark ? '#475569' : '#E5E7EB'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
              disabled={!message.trim()}
            >
              <Icon
                as={SendIcon}
                size="sm"
                color={message.trim() ? 'white' : (isDark ? '#94A3B8' : '#6B7280')}
              />
            </Pressable>
          </HStack>
        </Animated.View>
    </View>
  );
};

export default DraggableKeyboard;
