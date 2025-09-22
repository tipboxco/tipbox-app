import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, Animated, Pressable, Modal } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Box, HStack, VStack, Text as GluestackText } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import DraggableKeyboard from '@/src/components/DraggableKeyboard';

interface KeyboardProps {}

interface Comment {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

export const Keyboard: React.FC<KeyboardProps> = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock yorum verileri
  const comments: Comment[] = [
    {
      id: '1',
      user: 'Ahmet Yılmaz',
      message: 'Bu ürün gerçekten harika! Çok memnun kaldım.',
      timestamp: '2 saat önce'
    },
    {
      id: '2',
      user: 'Ayşe Demir',
      message: 'Kalitesi beklediğimden çok daha iyi. Kesinlikle tavsiye ederim.',
      timestamp: '5 saat önce'
    },
    {
      id: '3',
      user: 'Mehmet Kaya',
      message: 'Fiyatına göre çok iyi bir ürün. Tekrar alacağım.',
      timestamp: '1 gün önce'
    },
    {
      id: '4',
      user: 'Fatma Özkan',
      message: 'Hızlı kargo ve güzel paketleme. Teşekkürler!',
      timestamp: '2 gün önce'
    },
    {
      id: '5',
      user: 'Ali Çelik',
      message: 'Bu kadar kaliteli bir ürün bu fiyata bulunmaz.',
      timestamp: '3 gün önce'
    },
    {
      id: '6',
      user: 'Zeynep Arslan',
      message: 'Çok beğendim, arkadaşlarıma da önerdim.',
      timestamp: '1 hafta önce'
    }
  ];

  const handleSendMessage = (message: string) => {
    console.log('Yorum gönderildi:', message);
    // Burada API'ye yorum gönderme işlemi yapılabilir
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
        {/* Ana içerik alanı */}
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20
        }}>
          <GluestackText
            size="xl"
            fontWeight="$bold"
            color={isDark ? '#F1F5F9' : '#111827'}
            textAlign="center"
            marginBottom={20}
          >
            Yorumlar ve Mesajlaşma
          </GluestackText>
          
          <GluestackText
            size="md"
            color={isDark ? '#94A3B8' : '#6B7280'}
            textAlign="center"
            marginBottom={30}
          >
            Yorumları görmek ve yeni yorum eklemek için aşağıdaki butona tıklayın
          </GluestackText>
          
          <Pressable
            onPress={() => setIsModalOpen(true)}
            style={{
              backgroundColor: isDark ? '#6366F1' : '#6366F1',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <GluestackText
              color="white"
              fontWeight="$semibold"
              size="md"
            >
              Yorumları Aç
            </GluestackText>
          </Pressable>
        </View>

        {/* Fullscreen Modal */}
        <Modal
          visible={isModalOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          }}>
            {/* Header */}
            <View style={{ 
              paddingHorizontal: 20, 
              paddingTop: 50,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#334155' : '#E5E7EB',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <GluestackText
                size="lg"
                fontWeight="$bold"
                color={isDark ? '#F1F5F9' : '#111827'}
              >
                Yorumlar ({comments.length})
              </GluestackText>
              
              <Pressable
                onPress={() => setIsModalOpen(false)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#334155' : '#F3F4F6',
                }}
              >
                <GluestackText
                  size="md"
                  color={isDark ? '#F1F5F9' : '#111827'}
                  fontWeight="$semibold"
                >
                  ✕
                </GluestackText>
              </Pressable>
            </View>

            {/* Yorumlar listesi */}
            <ScrollView 
              style={{ 
                flex: 1,
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 160, // DraggableKeyboard için alan bırak
              }}
              showsVerticalScrollIndicator={false}
            >
              {comments.map((comment) => (
                <View
                  key={comment.id}
                  style={{
                    marginBottom: 16,
                    padding: 16,
                    backgroundColor: isDark ? '#334155' : '#F9FAFB',
                    borderRadius: 12,
                  }}
                >
                  <HStack justifyContent="space-between" alignItems="center" marginBottom={8}>
                    <GluestackText
                      size="sm"
                      fontWeight="$semibold"
                      color={isDark ? '#F1F5F9' : '#111827'}
                    >
                      {comment.user}
                    </GluestackText>
                    <GluestackText
                      size="xs"
                      color={isDark ? '#94A3B8' : '#6B7280'}
                    >
                      {comment.timestamp}
                    </GluestackText>
                  </HStack>
                  
                  <GluestackText
                    size="sm"
                    color={isDark ? '#E2E8F0' : '#374151'}
                    lineHeight={20}
                  >
                    {comment.message}
                  </GluestackText>
                </View>
              ))}
            </ScrollView>

            {/* DraggableKeyboard component'i */}
            <View style={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 140, // DraggableKeyboard'un minHeight'i
              zIndex: 1002,
            }}>
              <DraggableKeyboard
                onSendMessage={handleSendMessage}
                onAddImage={handleAddImage}
                onAddEmoji={handleAddEmoji}
                placeholder="Yorumunuzu yazın..."
                minHeight={140}
              />
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

export default Keyboard;
