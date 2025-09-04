import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Animated, Keyboard as RNKeyboard, Platform } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Box, HStack, VStack, Icon, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ImageIcon, SendIcon, SmileIcon } from 'lucide-react-native';

interface DraggableKeyboardProps {
  onSendMessage?: (message: string) => void;
  onAddImage?: () => void;
  onAddEmoji?: () => void;
  placeholder?: string;
  initialMessage?: string;
  minHeight?: number;
  upThreshold?: number;
  downThreshold?: number;
}

export const DraggableKeyboard: React.FC<DraggableKeyboardProps> = ({
  onSendMessage,
  onAddImage,
  onAddEmoji,
  placeholder = "Mesajınızı yazın...",
  initialMessage = '',
  minHeight = 140,
  upThreshold = 50,
  downThreshold = 30,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const [message, setMessage] = useState(initialMessage);
  const [isExpanded, setIsExpanded] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Smooth animasyon için Animated.Value
  const animatedHeight = useRef(new Animated.Value(minHeight)).current;
  
  // Drag durumu için ref'ler
  const dragStartHeight = useRef(minHeight);
  const isDraggingRef = useRef(false);
  const currentAnimatedHeight = useRef(minHeight);
  
  // Fullscreen için ekran yüksekliğini kullan, container yüksekliğini değil
  // Klavye açıkken klavye yüksekliğini çıkararak taşmayı önle
  const maxHeight = isKeyboardVisible 
    ? Dimensions.get('window').height - keyboardHeight 
    : Dimensions.get('window').height;

  // Smooth animasyon fonksiyonu
  const animateToHeight = (targetHeight: number, duration: number = 300) => {
    Animated.timing(animatedHeight, {
      toValue: targetHeight,
      duration,
      useNativeDriver: false,
    }).start(() => {
      currentAnimatedHeight.current = targetHeight;
    });
  };

  // Başlangıç animasyonu
  useEffect(() => {
    animatedHeight.setValue(minHeight);
    dragStartHeight.current = minHeight;
  }, [minHeight]);

  // Container yüksekliğini takip et
  const handleContainerLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height);
  };

  // Klavye event listener'ları
  useEffect(() => {
    const keyboardDidShowListener = RNKeyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        setIsKeyboardVisible(true);
        console.log('Klavye açıldı, yükseklik:', keyboardHeight);
      }
    );

    const keyboardDidHideListener = RNKeyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        // Klavye kapandığında component'i ilk haline döndür
        console.log('Klavye kapandı, component ilk haline döndürülüyor');
        animateToHeight(minHeight, 300);
        setIsExpanded(false);
        dragStartHeight.current = minHeight;
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleGestureEvent = (event: any) => {
    // Klavye kapalıyken sürüklemeyi engelle
    if (!isKeyboardVisible) return;
    
    const { translationY } = event.nativeEvent;
    
    if (isDraggingRef.current) {
      const newHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeight.current - translationY));
      animatedHeight.setValue(newHeight);
      currentAnimatedHeight.current = newHeight;
    }
  };

  const handleStateChange = (event: any) => {
    // Klavye kapalıyken sürüklemeyi engelle
    if (!isKeyboardVisible) return;
    
    const { translationY, state } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      isDraggingRef.current = true;
      dragStartHeight.current = currentAnimatedHeight.current;
      console.log('Drag başladı, başlangıç height:', dragStartHeight.current);
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      isDraggingRef.current = false;
      
      const currentHeight = currentAnimatedHeight.current;
      const totalDragDistance = dragStartHeight.current - currentHeight;
      
      console.log('=== SNAP POINT DEBUG ===');
      console.log('Drag Start Height:', dragStartHeight.current);
      console.log('Current Height:', currentHeight);
      console.log('Total Drag Distance:', totalDragDistance);
      console.log('Up Threshold (-50):', -upThreshold);
      console.log('Down Threshold (30):', downThreshold);
      
      if (totalDragDistance < -upThreshold) {
        console.log('Yukarı sürükleme 50px geçildi, fullscreen açılıyor');
        animateToHeight(maxHeight, 400);
        setIsExpanded(true);
        dragStartHeight.current = maxHeight;
      } else if (totalDragDistance > downThreshold) {
        console.log('Aşağı sürükleme 30px geçildi, minHeight\'e snap ediliyor');
        animateToHeight(minHeight, 300);
        setIsExpanded(false);
        dragStartHeight.current = minHeight;
      } else {
        console.log('Threshold\'lar geçilmedi, mevcut pozisyonda kalınıyor');
        dragStartHeight.current = currentHeight;
      }
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Mesaj gönderildi:', message);
      if (onSendMessage) {
        onSendMessage(message);
      }
      setMessage('');
      animateToHeight(minHeight, 300);
      setIsExpanded(false);
      dragStartHeight.current = minHeight;
    }
  };

  const handleAddImage = () => {
    console.log('Görsel ekleme');
    if (onAddImage) {
      onAddImage();
    }
  };

  const handleAddEmoji = () => {
    console.log('Emoji ekleme');
    if (onAddEmoji) {
      onAddEmoji();
    }
  };

  const handleTextInputFocus = () => {
    console.log('TextInput focus oldu');
  };

  const handleTextInputBlur = () => {
    console.log('TextInput blur oldu');
  };

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: 'transparent'
      }}
      onLayout={handleContainerLayout}
    >
      {/* Bottom Sheet benzeri mesaj giriş alanı */}
      <PanGestureHandler 
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        enabled={isKeyboardVisible} // Klavye kapalıyken sürüklemeyi devre dışı bırak
        activeOffsetY={[-10, 10]} // Daha hassas gesture detection
        failOffsetX={[-20, 20]} // Yatay sürüklemeyi engelle
      >
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: animatedHeight,
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderTopLeftRadius: (isExpanded && isKeyboardVisible) ? 0 : 20,
            borderTopRightRadius: (isExpanded && isKeyboardVisible) ? 0 : 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
            zIndex: 1000,
          }}
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
            paddingTop: isKeyboardVisible ? 0 : 16, // Klavye kapalıyken padding top ekle
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
              onFocus={handleTextInputFocus}
              onBlur={handleTextInputBlur}
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
      </PanGestureHandler>
    </View>
  );
};

export default DraggableKeyboard;
