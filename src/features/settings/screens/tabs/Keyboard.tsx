import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { Box, HStack, VStack, Icon, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ImageIcon, SendIcon, SmileIcon } from 'lucide-react-native';

interface KeyboardProps {}

export const Keyboard: React.FC<KeyboardProps> = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(140); // Başlangıç height'i minHeight ile aynı
  const [isDragging, setIsDragging] = useState(false);
  
  // Smooth animasyon için Animated.Value
  const animatedHeight = useRef(new Animated.Value(140)).current;
  
  // Drag durumu için ref'ler
  const dragStartHeight = useRef(140);
  const isDraggingRef = useRef(false);
  const currentAnimatedHeight = useRef(140);
  
  const { height: screenHeight } = Dimensions.get('window');
  const minHeight = 140; // Minimum height de artırıldı
  const maxHeight = screenHeight; // Fullscreen için
  const upThreshold = 50; // Yukarı sürükleme için 50px (daha güvenilir)
  const downThreshold = 30; // Aşağı sürükleme için 30px (daha güvenilir)

  // Smooth animasyon fonksiyonları
  const animateToHeight = (targetHeight: number, duration: number = 300) => {
    Animated.timing(animatedHeight, {
      toValue: targetHeight,
      duration,
      useNativeDriver: false,
    }).start(() => {
      // Animasyon bittiğinde currentAnimatedHeight ref'ini güncelle
      currentAnimatedHeight.current = targetHeight;
    });
  };

  // Başlangıç animasyonu
  useEffect(() => {
    animatedHeight.setValue(minHeight);
    dragStartHeight.current = minHeight;
  }, [minHeight]);

  const handleGestureEvent = (event: any) => {
    const { translationY } = event.nativeEvent;
    
    // Sadece sürükleme hareketini takip et
    if (isDraggingRef.current) {
      // Doğrudan translationY kullanarak daha basit hesaplama
      const newHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeight.current - translationY));
      // Sadece animatedHeight güncelle - setState çağırma
      animatedHeight.setValue(newHeight);
      // currentAnimatedHeight ref'ini de güncelle
      currentAnimatedHeight.current = newHeight;
    }
  };

  const handleStateChange = (event: any) => {
    const { translationY, state } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      setIsDragging(true);
      isDraggingRef.current = true;
      // Drag başlangıcında mevcut height'ı kaydet - currentAnimatedHeight ref'inden al
      dragStartHeight.current = currentAnimatedHeight.current;
      console.log('Drag başladı, başlangıç height:', dragStartHeight.current);
    } else if (state === State.END || state === State.CANCELLED || state === State.FAILED) {
      setIsDragging(false);
      isDraggingRef.current = false;
      
      // Snap point mantığı - bottom sheet gibi
      // currentAnimatedHeight ref'inden mevcut değeri al
      const currentHeight = currentAnimatedHeight.current;
      
      // Drag başlangıç noktasından itibaren ne kadar sürüklendiğini hesapla
      const totalDragDistance = dragStartHeight.current - currentHeight;
      
      console.log('=== SNAP POINT DEBUG ===');
      console.log('Drag Start Height:', dragStartHeight.current);
      console.log('Current Height:', currentHeight);
      console.log('Total Drag Distance:', totalDragDistance);
      console.log('Up Threshold (-50):', -upThreshold);
      console.log('Down Threshold (30):', downThreshold);
      console.log('Yukarı sürükleme için:', totalDragDistance < -upThreshold);
      console.log('Aşağı sürükleme için:', totalDragDistance > downThreshold);
      
      // Snap point kararı - drag başlangıcından itibaren hesaplanan mesafe
      if (totalDragDistance < -upThreshold) {
        // Kullanıcı yukarı doğru 50px'den fazla sürükledi - fullscreen'e snap
        console.log('Yukarı sürükleme 50px geçildi, fullscreen açılıyor');
        console.log('Total Drag Distance:', totalDragDistance, 'Up Threshold:', -upThreshold);
        animateToHeight(maxHeight, 400);
        setSheetHeight(maxHeight);
        setIsExpanded(true);
        // Drag başlangıç noktasını güncelle
        dragStartHeight.current = maxHeight;
      } else if (totalDragDistance > downThreshold) {
        // Kullanıcı aşağı doğru 30px'den fazla sürükledi - minHeight'e snap
        console.log('Aşağı sürükleme 30px geçildi, minHeight\'e snap ediliyor');
        console.log('Total Drag Distance:', totalDragDistance, 'Down Threshold:', downThreshold);
        animateToHeight(minHeight, 300);
        setSheetHeight(minHeight);
        setIsExpanded(false);
        // Drag başlangıç noktasını güncelle
        dragStartHeight.current = minHeight;
      } else {
        // Threshold'lar geçilmedi - mevcut pozisyonda kal
        console.log('Threshold\'lar geçilmedi, mevcut pozisyonda kalınıyor');
        console.log('Total Drag Distance:', totalDragDistance);
        // Mevcut height'ı koru ve drag başlangıç noktasını güncelle
        dragStartHeight.current = currentHeight;
        // Mevcut height'ı state'e de kaydet
        setSheetHeight(currentHeight);
      }
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Mesaj gönderildi:', message);
      setMessage('');
      // Smooth animasyon ile kapanma
      animateToHeight(minHeight, 300);
      setSheetHeight(minHeight);
      setIsExpanded(false);
      // Drag başlangıç noktasını güncelle
      dragStartHeight.current = minHeight;
    }
  };

  const handleAddImage = () => {
    console.log('Görsel ekleme');
  };

  const handleAddEmoji = () => {
    console.log('Emoji ekleme');
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ 
        flex: 1, 
        backgroundColor: isDark ? '#0F172A' : '#F9FAFB' 
      }}>
        {/* Bottom Sheet benzeri mesaj giriş alanı */}
        <PanGestureHandler 
          onGestureEvent={handleGestureEvent}
          onHandlerStateChange={handleStateChange}
        >
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: animatedHeight,
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderTopLeftRadius: isExpanded ? 0 : 20,
              borderTopRightRadius: isExpanded ? 0 : 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 8,
              zIndex: 1000,
            }}
          >
            {/* Sürükleme göstergesi */}
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

            {/* Mesaj giriş alanı */}
            <View style={{ 
              flex: 1, 
              paddingHorizontal: 16,
              paddingTop: 0, // En üstten başla
              paddingBottom: isExpanded ? 20 : 8,
            }}>
              <TextInput
                style={{
                  flex: 1,
                  fontSize: isExpanded ? 18 : 16,
                  color: isDark ? '#F1F5F9' : '#111827',
                  textAlignVertical: 'top',
                  paddingTop: 0, // En üstten başla
                  paddingBottom: 8,
                  lineHeight: isExpanded ? 24 : 20,
                }}
                placeholder="Mesajınızı yazın..."
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
          </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

export default Keyboard;
