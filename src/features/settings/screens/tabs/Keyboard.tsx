import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Dimensions } from 'react-native';
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
  const [sheetHeight, setSheetHeight] = useState(80); // Başlangıç height'i artırıldı
  const [isDragging, setIsDragging] = useState(false);
  
  const { height: screenHeight } = Dimensions.get('window');
  const minHeight = 80; // Minimum height de artırıldı
  const maxHeight = screenHeight; // Fullscreen için
  const threshold = 100; // Sadece 100px sürükleme yeterli

  const handleGestureEvent = (event: any) => {
    const { translationY, state } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      setIsDragging(true);
    } else if (state === State.ACTIVE) {
      // Daha hassas sürükleme - parmak hareketi ile eş zamanlı
      const newHeight = Math.max(minHeight, Math.min(maxHeight, minHeight - translationY));
      setSheetHeight(newHeight);
    } else if (state === State.END) {
      setIsDragging(false);
      
      if (sheetHeight > threshold) {
        // Kullanıcı yukarı sürükledi ve threshold'u geçti
        setSheetHeight(maxHeight);
        setIsExpanded(true);
      } else {
        // Kullanıcı yeterince yukarı sürüklemedi
        setSheetHeight(minHeight);
        setIsExpanded(false);
      }
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log('Mesaj gönderildi:', message);
      setMessage('');
      setSheetHeight(minHeight);
      setIsExpanded(false);
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
        <PanGestureHandler onGestureEvent={handleGestureEvent}>
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: sheetHeight,
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
          </View>
        </PanGestureHandler>
      </View>
    </GestureHandlerRootView>
  );
};

export default Keyboard;
