import React, { useState, useRef, useMemo, useCallback } from 'react';
import { FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import MessageDetailHeader from '../components/MessageDetailHeader';
import MessageInput from '../components/MessageInput';
import MessageDetailActionButtons from '../components/MessageDetailActionButtons';
import SendTipsBottomSheet from '../components/SendTipsBottomSheet';

interface MessageDetailItem {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: any;
}

type MessageDetailScreenNavigationProp = NativeStackNavigationProp<any, 'MessageDetailScreen'>;

interface MessageDetailScreenParams {
  messageId: string;
  senderName: string;
  senderTitle: string;
  senderAvatar: any;
}

// Mock mesaj geçmişi verisi
const mockMessageHistory: MessageDetailItem[] = [
  {
    id: '1',
    text: 'Merhaba! Ürününüz hakkında bilgi almak istiyorum.',
    timestamp: '10:30',
    isSent: false,
    senderName: 'Mehmet Koç',
    senderAvatar: require('@/assets/avatar/ozan.png'),
  },
  {
    id: '2',
    text: 'Tabii ki! Hangi konuda yardımcı olabilirim?',
    timestamp: '10:32',
    isSent: true,
  },
  {
    id: '3',
    text: 'Ürünün teknik özelliklerini ve garantisini öğrenmek istiyorum.',
    timestamp: '10:33',
    isSent: false,
    senderName: 'Mehmet Koç',
    senderAvatar: require('@/assets/avatar/ozan.png'),
  },
  {
    id: '4',
    text: 'Ürünümüzün teknik özellikleri şunlardır:\n\n• İşlemci: Intel Core i7\n• RAM: 16GB DDR4\n• Depolama: 512GB SSD\n• Garanti: 2 yıl\n\nDaha fazla bilgi için web sitemizi ziyaret edebilirsiniz.',
    timestamp: '10:35',
    isSent: true,
  },
  {
    id: '5',
    text: 'Teşekkürler! Fiyat bilgisi de alabilir miyim?',
    timestamp: '10:36',
    isSent: false,
    senderName: 'Mehmet Koç',
    senderAvatar: require('@/assets/avatar/ozan.png'),
  },
  {
    id: '6',
    text: 'Tabii! Fiyat bilgisi için özel mesaj gönderebilirim.',
    timestamp: '10:37',
    isSent: true,
  },
];

const MessageDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<MessageDetailScreenNavigationProp>();
  const route = useRoute();
  const flatListRef = useRef<FlatList>(null);
  const sendTipsBottomSheetRef = useRef<BottomSheet>(null);
  const [messages, setMessages] = useState<MessageDetailItem[]>(mockMessageHistory);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  // Bottom sheet snap points
  const sendTipsSnapPoints = useMemo(() => ['70%'], []);

  // Handle Send TIPS button press
  const handleSendTipsPress = useCallback(() => {
    sendTipsBottomSheetRef.current?.expand();
  }, []);

  // Handle Send TIPS
  const handleSendTips = useCallback((amount: number) => {
    console.log('Send TIPS:', amount);
    // TODO: Implement send tips logic
    sendTipsBottomSheetRef.current?.close();
  }, []);

  // Handle bottom sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    setIsBottomSheetOpen(index >= 0);
  }, []);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  // Route params'dan gelen verileri al
  const params = (route.params as MessageDetailScreenParams) || {
    messageId: '1',
    senderName: 'Mehmet Koç',
    senderTitle: 'Technology Enthusiast',
    senderAvatar: require('@/assets/avatar/ozan.png'),
  };

  // Yeni mesaj gönderme
  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim()) return;

    const newMessage: MessageDetailItem = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Mesaj listesini en alta kaydır
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Mesaj öğesi render fonksiyonu
  const renderMessageItem = ({ item }: { item: MessageDetailItem }) => {
    const isSent = item.isSent;

    return (
      <VStack
        space="xs"
        alignItems={isSent ? 'flex-end' : 'flex-start'}
        px="$4"
        py="$2"
      >
        {!isSent && (
          <HStack space="sm" alignItems="center" mb="$1">
            {item.senderAvatar && (
              <Image
                source={item.senderAvatar}
                alt={item.senderName || 'User'}
                width={24}
                height={24}
                borderRadius={12}
              />
            )}
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={9}
              fontWeight="$medium"
            >
              {item.senderName || params.senderName}
            </Text>
          </HStack>
        )}

        <HStack
          space="sm"
          alignItems="flex-end"
          maxWidth="80%"
          flexDirection={isSent ? 'row-reverse' : 'row'}
        >
          <Box
            bg={isSent ? (isDark ? '#6366F1' : '#6366F1') : (isDark ? '#1A1A1A' : '#F2F2F2')}
            px="$3"
            py="$2"
            borderRadius={16}
            borderTopLeftRadius={isSent ? 16 : 4}
            borderTopRightRadius={isSent ? 4 : 16}
          >
            <Text
              color={isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
              fontSize={11}
              fontWeight="$normal"
            >
              {item.text}
            </Text>
          </Box>

          <Text
            color={isDark ? '#8C8C8C' : '#8C8C8C'}
            fontSize={8}
            fontWeight="$normal"
            mb="$1"
          >
            {item.timestamp}
          </Text>
        </HStack>
      </VStack>
    );
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <MessageDetailHeader
        senderName={params.senderName}
        senderTitle={params.senderTitle}
        senderAvatar={params.senderAvatar}
        onBackPress={() => navigation.goBack()}
        onMenuPress={() => console.log('Menü tıklandı')}
      />

      {/* Mesaj Geçmişi */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />
      </KeyboardAvoidingView>

      {/* Mesaj Gönderme Alanı */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onAddImage={() => console.log('Görsel eklenecek')}
        placeholder="Mesajınızı yazın..."
      />

      {/* Action Buttons - BottomSheet açıkken gizle */}
      {!isBottomSheetOpen && (
        <MessageDetailActionButtons
          onSendTipsPress={handleSendTipsPress}
          onRequestSupportPress={() => console.log('Request 1-on-1 tıklandı')}
        />
      )}

      {/* Send TIPS BottomSheet */}
      <BottomSheet
        ref={sendTipsBottomSheetRef}
        snapPoints={sendTipsSnapPoints}
        index={-1}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#8C8C8C' : '#E9E9E9',
        }}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <SendTipsBottomSheet
            senderName={params.senderName}
            senderTitle={params.senderTitle}
            senderAvatar={params.senderAvatar}
            onClose={() => sendTipsBottomSheetRef.current?.close()}
            onSend={handleSendTips}
          />
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
};

MessageDetailScreen.displayName = 'MessageDetailScreen';

export default MessageDetailScreen;

