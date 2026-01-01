import React, { useState, useEffect } from 'react';
import { ScrollView, Pressable, Alert, TextInput } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { socketService } from '@/src/services/SocketService';
import { TokenService } from '@/src/services/TokenService';
import { getOrCreateThread } from '@/src/features/inbox/api/messagesApi';

/**
 * Socket Test Screen
 * Socket bağlantısını adım adım test etmek için basit bir ekran
 */
const SocketTestScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [threadId, setThreadId] = useState<string>('');
  const [recipientUserId, setRecipientUserId] = useState<string>('');
  const [isThreadJoined, setIsThreadJoined] = useState(false);
  const [messageText, setMessageText] = useState<string>('');

  // Socket durumunu kontrol et
  useEffect(() => {
    const checkConnection = () => {
      const connected = socketService.isConnected();
      setIsConnected(connected);
      const socket = socketService.getSocket();
      setSocketId(socket?.id || null);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    addLog('🔌 Bağlantı başlatılıyor...');
    
    try {
      const token = await TokenService.getAccessToken();
      if (!token) {
        addLog('❌ Token bulunamadı! Lütfen önce giriş yapın.');
        Alert.alert('Hata', 'Token bulunamadı! Lütfen önce giriş yapın.');
        setIsConnecting(false);
        return;
      }

      addLog('✅ Token bulundu');
      addLog('📡 Socket.IO bağlantısı kuruluyor...');

      await socketService.connect();
      
      const connected = socketService.isConnected();
      const socket = socketService.getSocket();
      
      setIsConnected(connected);
      setSocketId(socket?.id || null);

      if (connected) {
        addLog('✅ Bağlantı başarılı!');
        addLog(`📋 Socket ID: ${socket?.id}`);
      } else {
        addLog('⚠️ Bağlantı tamamlandı ancak bağlı değil');
      }
    } catch (error: any) {
      addLog(`❌ Bağlantı hatası: ${error?.message || error}`);
      Alert.alert('Bağlantı Hatası', error?.message || 'Bilinmeyen hata');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    addLog('🔌 Bağlantı kapatılıyor...');
    if (threadId && isThreadJoined) {
      socketService.leaveThread(threadId);
      addLog(`📤 Thread'den ayrıldı: ${threadId}`);
    }
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(null);
    setIsThreadJoined(false);
    setThreadId('');
    addLog('✅ Bağlantı kapatıldı');
  };

  const handleTestEvent = () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Önce socket bağlantısı kurun!');
      return;
    }

    addLog('📤 Test event gönderiliyor...');
    socketService.emit('test_event', { message: 'Test mesajı', timestamp: Date.now() });
    addLog('✅ Test event gönderildi');
  };

  // Backend event listener'larını test et
  useEffect(() => {
    if (!isConnected) return;

    addLog('👂 Backend event listener\'ları dinleniyor...');

    // Connected event
    const handleConnected = (data: { message: string; userId: string; userEmail: string }) => {
      addLog(`✅ Backend connected event: ${data.message}`);
      addLog(`   User ID: ${data.userId}`);
      addLog(`   User Email: ${data.userEmail}`);
    };

    // New message event
    const handleNewMessage = (data: any) => {
      addLog(`📨 New message event alındı:`);
      addLog(`   Message ID: ${data.messageId || 'N/A'}`);
      addLog(`   Thread ID: ${data.threadId || 'N/A'}`);
      addLog(`   Sender ID: ${data.senderId || 'N/A'}`);
      addLog(`   Recipient ID: ${data.recipientId || 'N/A'}`);
      addLog(`   Message: ${data.message || 'N/A'}`);
      addLog(`   Timestamp: ${data.timestamp || 'N/A'}`);
    };

    // Message sent event
    const handleMessageSent = (data: any) => {
      addLog(`✅ Message sent event alındı:`);
      addLog(`   Message ID: ${data.messageId || 'N/A'}`);
    };

    // Thread joined event
    const handleThreadJoined = (data: { threadId: string }) => {
      addLog(`✅ Thread joined event: ${data.threadId}`);
    };

    // User typing event
    const handleUserTyping = (data: { userId: string; threadId: string; isTyping: boolean }) => {
      addLog(`⌨️ User typing event: ${data.isTyping ? 'Yazıyor' : 'Durdu'}`);
      addLog(`   User ID: ${data.userId}`);
      addLog(`   Thread ID: ${data.threadId}`);
    };

    // Message read event
    const handleMessageRead = (data: { messageId: string; threadId: string; readBy: string; timestamp: string }) => {
      addLog(`👁️ Message read event:`);
      addLog(`   Message ID: ${data.messageId}`);
      addLog(`   Read by: ${data.readBy}`);
    };

    // Event listener'ları ekle
    socketService.onConnected(handleConnected);
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageSent(handleMessageSent);
    socketService.onThreadJoined(handleThreadJoined);
    socketService.onUserTyping(handleUserTyping);
    socketService.onMessageRead(handleMessageRead);

    // Cleanup
    return () => {
      socketService.off('connect', handleConnected);
      socketService.off('new_message', handleNewMessage);
      socketService.off('message_sent', handleMessageSent);
      socketService.off('thread_joined', handleThreadJoined);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('message_read', handleMessageRead);
    };
  }, [isConnected]);

  const clearLogs = () => {
    setLogs([]);
  };

  const handleCreateOrGetThread = async () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Önce socket bağlantısı kurun!');
      return;
    }

    if (!recipientUserId.trim()) {
      Alert.alert('Hata', 'Lütfen alıcı kullanıcı ID\'si girin!');
      return;
    }

    try {
      addLog(`📥 Thread oluşturuluyor/alınıyor: ${recipientUserId}`);
      const thread = await getOrCreateThread(recipientUserId);
      setThreadId(thread.id);
      addLog(`✅ Thread ID: ${thread.id}`);
      setIsThreadJoined(false); // Thread değişti, join durumunu sıfırla
    } catch (error: any) {
      addLog(`❌ Thread oluşturma hatası: ${error?.message || error}`);
      Alert.alert('Hata', error?.message || 'Thread oluşturulamadı');
    }
  };

  const handleJoinThread = () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Önce socket bağlantısı kurun!');
      return;
    }

    if (!threadId.trim()) {
      Alert.alert('Hata', 'Önce thread oluşturun veya thread ID girin!');
      return;
    }

    addLog(`📥 Thread'e katılıyor: ${threadId}`);
    
    socketService.joinThread(
      threadId,
      (data) => {
        addLog(`✅ Thread'e katıldı: ${data.threadId}`);
        setIsThreadJoined(true);
      },
      (error) => {
        addLog(`❌ Thread katılım hatası: ${error.reason}`);
        setIsThreadJoined(false);
        Alert.alert('Hata', error.reason);
      }
    );
  };

  const handleSendMessage = () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Önce socket bağlantısı kurun!');
      return;
    }

    if (!threadId.trim()) {
      Alert.alert('Hata', 'Önce thread oluşturun veya thread ID girin!');
      return;
    }

    if (!isThreadJoined) {
      Alert.alert('Hata', 'Önce thread\'e katılın!');
      return;
    }

    const message = messageText.trim() || `Test mesajı ${Date.now()}`;
    
    if (!message) {
      Alert.alert('Hata', 'Mesaj boş olamaz!');
      return;
    }

    addLog(`📤 Mesaj gönderiliyor: ${message}`);
    addLog(`   Thread ID: ${threadId}`);

    socketService.sendMessage(
      threadId,
      message,
      (data) => {
        addLog(`✅ Mesaj gönderildi:`);
        addLog(`   Message ID: ${data.messageId || 'N/A'}`);
        addLog(`   Thread ID: ${data.threadId || 'N/A'}`);
        setMessageText(''); // Mesaj gönderildikten sonra input'u temizle
      },
      (error) => {
        addLog(`❌ Mesaj gönderme hatası: ${error.reason}`);
        Alert.alert('Hata', error.reason);
      }
    );
  };

  const handleStartTyping = () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Önce socket bağlantısı kurun!');
      return;
    }

    if (!threadId.trim()) {
      Alert.alert('Hata', 'Önce thread oluşturun veya thread ID girin!');
      return;
    }

    if (!isThreadJoined) {
      Alert.alert('Hata', 'Önce thread\'e katılın!');
      return;
    }

    addLog(`⌨️ Typing başlatılıyor: ${threadId}`);
    socketService.startTyping(threadId);
  };

  const handleStopTyping = () => {
    if (!isConnected) {
      Alert.alert('Hata', 'Önce socket bağlantısı kurun!');
      return;
    }

    if (!threadId.trim()) {
      Alert.alert('Hata', 'Önce thread oluşturun veya thread ID girin!');
      return;
    }

    if (!isThreadJoined) {
      Alert.alert('Hata', 'Önce thread\'e katılın!');
      return;
    }

    addLog(`⌨️ Typing durduruluyor: ${threadId}`);
    socketService.stopTyping(threadId);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
      <Box p="$4">
        <VStack space="md">
          <Text fontSize="$2xl" fontWeight="bold" color={isDark ? '$white' : '$black'}>
            Socket.IO Test Ekranı
          </Text>

          {/* Durum Kartı */}
          <Box
            p="$4"
            borderRadius="$lg"
            bg={isDark ? '$gray800' : '$gray100'}
          >
            <VStack space="sm">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$lg" fontWeight="semibold" color={isDark ? '$white' : '$black'}>
                  Bağlantı Durumu
                </Text>
                <Box
                  px="$3"
                  py="$1"
                  borderRadius="$full"
                  bg={isConnected ? '$green500' : '$red500'}
                >
                  <Text color="$white" fontSize="$xs" fontWeight="bold">
                    {isConnected ? 'BAĞLI' : 'BAĞLI DEĞİL'}
                  </Text>
                </Box>
              </HStack>

              {socketId && (
                <Text fontSize="$sm" color={isDark ? '$gray400' : '$gray600'}>
                  Socket ID: {socketId}
                </Text>
              )}

              {isConnecting && (
                <Text fontSize="$sm" color="$blue500">
                  ⏳ Bağlanıyor...
                </Text>
              )}
            </VStack>
          </Box>

          {/* Butonlar */}
          <VStack space="sm">
            <Button
              onPress={handleConnect}
              isDisabled={isConnecting || isConnected}
              bg={isConnected ? '$gray400' : '$blue500'}
            >
              <ButtonText>Bağlan</ButtonText>
            </Button>

            <Button
              onPress={handleDisconnect}
              isDisabled={!isConnected}
              bg={isConnected ? '$red500' : '$gray400'}
            >
              <ButtonText>Bağlantıyı Kes</ButtonText>
            </Button>

            <Button
              onPress={handleTestEvent}
              isDisabled={!isConnected}
              bg={isConnected ? '$green500' : '$gray400'}
              variant="outline"
            >
              <ButtonText>Test Event Gönder</ButtonText>
            </Button>

            {/* Thread Management */}
            <Box
              p="$3"
              borderRadius="$lg"
              bg={isDark ? '$gray800' : '$gray100'}
              mb="$2"
            >
              <VStack space="sm">
                <Text fontSize="$sm" fontWeight="semibold" color={isDark ? '$white' : '$black'}>
                  Thread Yönetimi
                </Text>
                
                <Input>
                  <InputField
                    placeholder="Alıcı Kullanıcı ID"
                    value={recipientUserId}
                    onChangeText={setRecipientUserId}
                    color={isDark ? '$white' : '$black'}
                  />
                </Input>

                <Button
                  onPress={handleCreateOrGetThread}
                  isDisabled={!isConnected || !recipientUserId.trim()}
                  bg={isConnected && recipientUserId.trim() ? '$blue500' : '$gray400'}
                  size="sm"
                >
                  <ButtonText>Thread Oluştur/Al</ButtonText>
                </Button>

                {threadId && (
                  <Text fontSize="$xs" color={isDark ? '$gray400' : '$gray600'}>
                    Thread ID: {threadId}
                  </Text>
                )}

                <Button
                  onPress={handleJoinThread}
                  isDisabled={!isConnected || !threadId.trim()}
                  bg={isConnected && threadId.trim() ? '$purple500' : '$gray400'}
                  variant="outline"
                  size="sm"
                >
                  <ButtonText>
                    {isThreadJoined ? '✅ Thread\'e Katıldı' : 'Thread\'e Katıl'}
                  </ButtonText>
                </Button>
              </VStack>
            </Box>

            {/* Message Input */}
            <Box
              p="$3"
              borderRadius="$lg"
              bg={isDark ? '$gray800' : '$gray100'}
              mb="$2"
            >
              <VStack space="sm">
                <Text fontSize="$sm" fontWeight="semibold" color={isDark ? '$white' : '$black'}>
                  Mesaj Gönder
                </Text>
                
                <Input>
                  <InputField
                    placeholder="Mesaj yazın..."
                    value={messageText}
                    onChangeText={setMessageText}
                    color={isDark ? '$white' : '$black'}
                    multiline
                  />
                </Input>
              </VStack>
            </Box>

            <Button
              onPress={handleSendMessage}
              isDisabled={!isConnected || !threadId.trim() || !isThreadJoined}
              bg={isConnected && threadId.trim() && isThreadJoined ? '$orange500' : '$gray400'}
              variant="outline"
            >
              <ButtonText>Mesaj Gönder</ButtonText>
            </Button>

            <HStack space="sm">
              <Button
                onPress={handleStartTyping}
                isDisabled={!isConnected || !threadId.trim() || !isThreadJoined}
                bg={isConnected && threadId.trim() && isThreadJoined ? '$yellow500' : '$gray400'}
                variant="outline"
                flex={1}
              >
                <ButtonText>Typing Başlat</ButtonText>
              </Button>

              <Button
                onPress={handleStopTyping}
                isDisabled={!isConnected || !threadId.trim() || !isThreadJoined}
                bg={isConnected && threadId.trim() && isThreadJoined ? '$yellow600' : '$gray400'}
                variant="outline"
                flex={1}
              >
                <ButtonText>Typing Durdur</ButtonText>
              </Button>
            </HStack>

            <Button
              onPress={clearLogs}
              bg="$gray500"
              variant="outline"
            >
              <ButtonText>Logları Temizle</ButtonText>
            </Button>
          </VStack>

          {/* Loglar */}
          <Box
            p="$4"
            borderRadius="$lg"
            bg={isDark ? '$gray900' : '$gray50'}
            minHeight={300}
          >
            <Text fontSize="$lg" fontWeight="semibold" color={isDark ? '$white' : '$black'} mb="$2">
              Loglar
            </Text>
            <VStack space="xs">
              {logs.length === 0 ? (
                <Text fontSize="$sm" color={isDark ? '$gray500' : '$gray400'}>
                  Henüz log yok...
                </Text>
              ) : (
                logs.map((log, index) => (
                  <Text
                    key={index}
                    fontSize="$xs"
                    color={isDark ? '$gray300' : '$gray700'}
                    fontFamily="$mono"
                  >
                    {log}
                  </Text>
                ))
              )}
            </VStack>
          </Box>
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default SocketTestScreen;

