import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MessageDetailHeader from '../components/MessageDetailHeader';
import MessageInput from '../components/MessageInput';
import SupportMessageDetailActionButtons from '../components/SupportMessageDetailActionButtons';
import SupportChatParticipants from '../components/SupportChatParticipants';
import CloseSupportRequestModal from '../components/CloseSupportRequestModal';
import { useSocket } from '@/src/providers/SocketProvider';
import { useAppStore } from '@/src/store/appStore';
import { useThreadMessages, useAcceptSupportRequest, useRejectSupportRequest, useCancelSupportRequest, inboxKeys } from '../api/hooks';
import { useQueryClient } from '@tanstack/react-query';
import type { ThreadMessage } from '../api/messagesApi';

interface MessageDetailItem {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: any;
  type?: 'message' | 'support_request';
  supportRequest?: {
    supportType: string;
    message: string;
    amount: number;
    status: 'pending' | 'accepted' | 'completed' | 'declined';
  };
}

type SupportMessageDetailScreenNavigationProp = NativeStackNavigationProp<any, 'SupportMessageDetail'>;

interface SupportMessageDetailParams {
  expertName: string;
  expertTitle: string;
  expertAvatar: any;
  userName?: string;
  userTitle?: string;
  userAvatar?: any;
  requestId?: string;
  status?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
  threadId?: string | null;
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
  {
    id: '7',
    text: '',
    timestamp: '10:40',
    isSent: false,
    type: 'support_request',
    supportRequest: {
      supportType: 'Product Authentication',
      message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.',
      amount: 150,
      status: 'pending',
    },
  },
];

const SupportMessageDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SupportMessageDetailScreenNavigationProp>();
  const route = useRoute();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<MessageDetailItem[]>([]);
  const [expandedSupportRequests, setExpandedSupportRequests] = useState<{ [key: string]: boolean }>({});
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const acceptMutation = useAcceptSupportRequest();
  const rejectMutation = useRejectSupportRequest();
  const cancelMutation = useCancelSupportRequest();

  // Socket context
  const {
    isConnected,
    joinThread,
    leaveThread,
    sendSupportMessage: socketSendSupportMessage,
    startTyping: socketStartTyping,
    stopTyping: socketStopTyping,
    markThreadRead: socketMarkThreadRead,
    acceptSupportRequest: socketAcceptSupportRequest,
    rejectSupportRequest: socketRejectSupportRequest,
    cancelSupportRequest: socketCancelSupportRequest,
    on,
    off,
  } = useSocket();

  // Route params'dan gelen verileri al
  const params = (route.params as SupportMessageDetailParams) || {
    expertName: 'Mehmet Koç',
    expertTitle: 'Technology Enthusiast',
    expertAvatar: require('@/assets/avatar/ozan.png'),
    userName: 'Trevor Nace',
    userTitle: 'Technology Enthusiast',
    userAvatar: require('@/assets/avatar/ozan.png'),
    requestId: undefined,
    status: 'pending',
    threadId: null,
  };

  const requestId = params.requestId;
  const threadId = params.threadId;
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Thread mesajlarını yükle (eğer threadId varsa)
  const { data: threadMessages, isLoading: isLoadingMessages, refetch: refetchMessages } = useThreadMessages(threadId || null);

  // Thread mesajlarını local state'e dönüştür
  useEffect(() => {
    if (threadMessages && threadId) {
      const convertedMessages: MessageDetailItem[] = threadMessages.map((msg) => ({
        id: msg.id,
        text: msg.message,
        timestamp: new Date(msg.sentAt).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: msg.senderId === user?.id,
        senderName: msg.senderId === user?.id ? undefined : params.expertName,
        senderAvatar: msg.senderId === user?.id ? undefined : params.expertAvatar,
      }));
      setMessages(convertedMessages);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [threadMessages, threadId, user?.id, params.expertName, params.expertAvatar]);

  // Socket bağlantısı ve thread join
  useEffect(() => {
    if (!threadId || !isConnected) return;

    console.log('[SupportMessageDetail] ✅ Socket connected, joining thread:', threadId);
    joinThread(threadId);
    setIsSocketReady(true);

    return () => {
      if (threadId && isConnected) {
        leaveThread(threadId);
      }
    };
  }, [threadId, isConnected, joinThread, leaveThread]);

  // Thread joined handler - mesajları okundu işaretle
  const handleThreadJoined = useCallback((data: { threadId: string }) => {
    if (data.threadId === threadId && isConnected) {
      console.log('[SupportMessageDetail] 📖 Marking thread as read:', threadId);
      socketMarkThreadRead(threadId);
    }
  }, [threadId, isConnected, socketMarkThreadRead]);

  // New message handler
  const handleNewMessage = useCallback((eventData: any) => {
    if (eventData.threadId !== threadId) return;

    if (eventData.messageType === 'message' && eventData.context === 'SUPPORT') {
      const newMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: eventData.message,
        timestamp: new Date(eventData.timestamp).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: eventData.senderId === user?.id,
        senderName: eventData.senderId === user?.id ? undefined : params.expertName,
        senderAvatar: eventData.senderId === user?.id ? undefined : params.expertAvatar,
      };

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === eventData.messageId)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [threadId, user?.id, params.expertName, params.expertAvatar]);

  // User typing handler
  const handleUserTyping = useCallback((data: { userId: string; threadId: string; isTyping: boolean }) => {
    if (data.threadId === threadId) {
      setIsTyping(data.isTyping);
      setTypingUserId(data.isTyping ? data.userId : null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (data.isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingUserId(null);
        }, 3000);
      }
    }
  }, [threadId]);

  // Support request accepted handler
  const handleSupportRequestAccepted = useCallback((data: { requestId: string; threadId: string; timestamp: string }) => {
    if (data.requestId === requestId) {
      console.log('[SupportMessageDetail] Support request accepted, threadId:', data.threadId);
      // Navigate to support chat with threadId
      navigation.setParams({ threadId: data.threadId, status: 'active' });
      queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    }
  }, [requestId, navigation, queryClient]);

  // Socket event listeners
  useEffect(() => {
    if (!isSocketReady || !threadId || !isConnected) return;

    on('thread_joined', handleThreadJoined);
    on('new_message', handleNewMessage);
    on('user_typing', handleUserTyping);
    on('support_request_accepted', handleSupportRequestAccepted);

    return () => {
      off('thread_joined', handleThreadJoined);
      off('new_message', handleNewMessage);
      off('user_typing', handleUserTyping);
      off('support_request_accepted', handleSupportRequestAccepted);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (threadId && isConnected) {
        socketStopTyping(threadId);
      }
    };
  }, [isSocketReady, threadId, isConnected, on, off, handleThreadJoined, handleNewMessage, handleUserTyping, handleSupportRequestAccepted, socketStopTyping]);

  // Yeni mesaj gönderme
  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim()) return;
    if (!threadId) {
      Alert.alert('Hata', 'Thread ID bulunamadı');
      return;
    }

    // Optimistic update
    const optimisticMessageId = `pending-${Date.now()}`;
    const newMessage: MessageDetailItem = {
      id: optimisticMessageId,
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
    };

    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Socket ile mesaj gönder
    if (isConnected && isSocketReady) {
      socketSendSupportMessage(threadId, messageText.trim());
    } else {
      Alert.alert('Hata', 'Socket bağlantısı yok');
      // Optimistic mesajı geri al
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessageId));
    }
  };

  // Typing handlers
  const handleTypingStart = useCallback(() => {
    if (threadId && isConnected && isSocketReady) {
      socketStartTyping(threadId);
    }
  }, [threadId, isConnected, isSocketReady, socketStartTyping]);

  const handleTypingStop = useCallback(() => {
    if (threadId && isConnected && isSocketReady) {
      socketStopTyping(threadId);
    }
  }, [threadId, isConnected, isSocketReady, socketStopTyping]);

  // Accept support request
  const handleAcceptRequest = () => {
    if (!requestId) {
      Alert.alert('Hata', 'Request ID bulunamadı');
      return;
    }

    if (isConnected) {
      // Socket ile accept et
      socketAcceptSupportRequest(requestId);
    } else {
      // REST API ile accept et
      acceptMutation.mutate(requestId, {
        onSuccess: (data) => {
          Alert.alert('Başarılı', 'Destek talebi kabul edildi');
          navigation.setParams({ threadId: data.threadId, status: 'active' });
        },
        onError: (error) => {
          Alert.alert('Hata', error.message || 'Destek talebi kabul edilemedi');
        },
      });
    }
  };

  // Reject support request
  const handleRejectRequest = () => {
    if (!requestId) {
      Alert.alert('Hata', 'Request ID bulunamadı');
      return;
    }

    Alert.alert(
      'Destek Talebini Reddet',
      'Bu destek talebini reddetmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: () => {
            if (isConnected) {
              socketRejectSupportRequest(requestId);
            } else {
              rejectMutation.mutate(requestId, {
                onSuccess: () => {
                  Alert.alert('Başarılı', 'Destek talebi reddedildi');
                  navigation.goBack();
                },
                onError: (error) => {
                  Alert.alert('Hata', error.message || 'Destek talebi reddedilemedi');
                },
              });
            }
          },
        },
      ]
    );
  };

  // Cancel support request (sadece sender yapabilir)
  const handleCancelRequest = () => {
    if (!requestId) {
      Alert.alert('Hata', 'Request ID bulunamadı');
      return;
    }

    Alert.alert(
      'Destek Talebini İptal Et',
      'Bu destek talebini iptal etmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: () => {
            if (isConnected) {
              socketCancelSupportRequest(requestId);
            } else {
              cancelMutation.mutate(requestId, {
                onSuccess: () => {
                  Alert.alert('Başarılı', 'Destek talebi iptal edildi');
                  navigation.goBack();
                },
                onError: (error) => {
                  Alert.alert('Hata', error.message || 'Destek talebi iptal edilemedi');
                },
              });
            }
          },
        },
      ]
    );
  };

  // Toggle support request expansion
  const toggleSupportRequest = (id: string) => {
    const isCurrentlyExpanded = expandedSupportRequests[id];
    
    setExpandedSupportRequests(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

    // Eğer açılıyorsa (şu an kapalı), scroll'u aşağı kaydır
    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Handle close support request button press
  const handleCloseRequest = () => {
    setIsCloseModalVisible(true);
  };

  // Handle confirm close request
  const handleConfirmClose = (rating: number) => {
    console.log('Support Request Closed with rating:', rating);
    setIsCloseModalVisible(false);
    // TODO: Implement close request logic with rating and navigate back
    navigation.goBack();
  };

  // Handle cancel close request
  const handleCancelClose = () => {
    setIsCloseModalVisible(false);
  };

  // Handle report
  const handleReport = () => {
    console.log('Report');
    // TODO: Implement report logic
  };

  // Mesaj öğesi render fonksiyonu
  const renderMessageItem = ({ item }: { item: MessageDetailItem }) => {
    // Support Request render'ı
    if (item.type === 'support_request' && item.supportRequest) {
      const isExpanded = expandedSupportRequests[item.id];
      const isSent = item.isSent;

      return (
        <VStack
          space="xs"
          alignItems={isSent ? 'flex-end' : 'flex-start'}
          px="$4"
          py="$2"
        >
          <Box minWidth={250}>
            <Pressable onPress={() => toggleSupportRequest(item.id)}>
              <Box
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                borderRadius={16}
                borderWidth={1}
                borderColor={isDark ? '#2A2A2A' : '#E5E5E5'}
                py="$1"
                px="$2"
              >
              <HStack space="sm" alignItems="center" justifyContent="space-between">
                <HStack space="sm" alignItems="center" flex={1}>
                  <Box
                    bg={isDark ? 'rgba(226, 255, 70, 0.15)' : 'rgba(226, 255, 70, 0.2)'}
                    p="$2"
                    borderRadius={10}
                  >
                    <Feather
                      name="life-buoy"
                      size={18}
                      color="#E2FF46"
                    />
                  </Box>
                  <Text
                    fontSize={12}
                    fontWeight="$semibold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                  >
                    Support Request Created
                  </Text>
                </HStack>
                <Feather
                  name="chevron-down"
                  size={18}
                  color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  style={{
                    transform: [{ rotate: isExpanded ? '180deg' : '0deg' }]
                  }}
                />
              </HStack>

              {isExpanded && (
                <VStack space="sm" mt="$3">
                  {/* Divider */}
                  <Box
                    height={1}
                    bg={isDark ? '#2A2A2A' : '#E5E5E5'}
                  />

                  {/* Support Type */}
                  <VStack space="xs">
                    <Text
                      fontSize={9}
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      Support Type
                    </Text>
                    <Text
                      fontSize={11}
                      fontWeight="$semibold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.supportType}
                    </Text>
                  </VStack>

                  {/* Message */}
                  <VStack space="xs">
                    <Text
                      fontSize={9}
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      Request Details
                    </Text>
                    <Text
                      fontSize={10}
                      fontWeight="$normal"
                      color={isDark ? '#CCCCCC' : '#666666'}
                      lineHeight={14}
                    >
                      {item.supportRequest.message}
                    </Text>
                  </VStack>

                  {/* TIPS Amount */}
                  <HStack space="xs" alignItems="center">
                    <Feather
                      name="award"
                      size={14}
                      color="#E2FF46"
                    />
                    <Text
                      fontSize={13}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.amount} TIPS
                    </Text>
                  </HStack>
                </VStack>
              )}
              </Box>
            </Pressable>

            {/* Info Message */}
            <HStack
              space="xs"
              alignItems="center"
              mt="$2"
            >
              <Feather
                name="info"
                size={12}
                color={isDark ? '#8C8C8C' : '#999999'}
              />
              <Text
                fontSize={9}
                fontWeight="$normal"
                color={isDark ? '#8C8C8C' : '#999999'}
                flex={1}
              >
                Support request will close automatically in 24 hours if unanswered.
              </Text>
            </HStack>
          </Box>
        </VStack>
      );
    }

    // Normal mesaj render'ı
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
              {item.senderName || params.expertName}
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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Header */}
      <MessageDetailHeader
        senderName={params.expertName}
        senderTitle={params.expertTitle}
        senderAvatar={params.expertAvatar}
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
          ListHeaderComponent={
            params.status === 'active' && threadId ? (
              <SupportChatParticipants
                user1Name={params.expertName}
                user1Title={params.expertTitle}
                user1Avatar={params.expertAvatar}
                user2Name={params.userName || 'Trevor Nace'}
                user2Title={params.userTitle || 'Technology Enthusiast'}
                user2Avatar={params.userAvatar || require('@/assets/avatar/ozan.png')}
                supportTitle="Support Chat"
                tipsAmount={50}
              />
            ) : null
          }
          ListEmptyComponent={
            isLoadingMessages ? (
              <Box py={20} alignItems="center">
                <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>Yükleniyor...</Text>
              </Box>
            ) : (
              <Box py={20} alignItems="center">
                <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>Henüz mesaj yok</Text>
              </Box>
            )
          }
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>

      {/* Typing Indicator */}
      {isTyping && typingUserId && typingUserId !== user?.id && (
        <Box px="$4" py="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <HStack space="xs" alignItems="center">
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={10}
              fontStyle="italic"
            >
              {params.expertName || 'Kullanıcı'} yazıyor
            </Text>
            <HStack space="xs" alignItems="center">
              <Box
                width={6}
                height={6}
                borderRadius={3}
                bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                style={{ opacity: 0.4 }}
              />
              <Box
                width={6}
                height={6}
                borderRadius={3}
                bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                style={{ opacity: 0.6 }}
              />
              <Box
                width={6}
                height={6}
                borderRadius={3}
                bg={isDark ? '#8C8C8C' : '#8C8C8C'}
                style={{ opacity: 0.8 }}
              />
            </HStack>
          </HStack>
        </Box>
      )}

      {/* Mesaj Gönderme Alanı - Sadece active status'ta göster */}
      {params.status === 'active' && threadId && (
        <MessageInput
          onSendMessage={handleSendMessage}
          onAddImage={() => console.log('Görsel eklenecek')}
          placeholder="Mesajınızı yazın..."
          threadId={threadId}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      )}

      {/* Action Buttons - Status'a göre farklı butonlar göster */}
      {params.status === 'pending' && (
        <Box px="$4" py="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <HStack space="sm" justifyContent="space-between">
            <Pressable
              flex={1}
              bg="#E8FF6B"
              borderWidth={1}
              borderColor="#D8FF08"
              borderRadius={20}
              px="$4"
              py="$3"
              onPress={handleAcceptRequest}
            >
              <Text
                color="#000000"
                fontSize={12}
                fontWeight="$semibold"
                textAlign="center"
              >
                Kabul Et
              </Text>
            </Pressable>
            <Pressable
              flex={1}
              bg={isDark ? '#2A2A2A' : '#F2F2F2'}
              borderWidth={1}
              borderColor={isDark ? '#3A3A3A' : '#E5E5E5'}
              borderRadius={20}
              px="$4"
              py="$3"
              onPress={handleRejectRequest}
            >
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={12}
                fontWeight="$semibold"
                textAlign="center"
              >
                Reddet
              </Text>
            </Pressable>
          </HStack>
        </Box>
      )}

      {/* Active status'ta Close & Report butonları */}
      {params.status === 'active' && (
        <SupportMessageDetailActionButtons
          onCloseRequestPress={handleCloseRequest}
          onReportPress={handleReport}
        />
      )}

      {/* Pending status'ta sender için Cancel butonu */}
      {params.status === 'pending' && user?.id && (
        <Box px="$4" py="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <Pressable
            bg={isDark ? '#2A2A2A' : '#F2F2F2'}
            borderWidth={1}
            borderColor={isDark ? '#3A3A3A' : '#E5E5E5'}
            borderRadius={20}
            px="$4"
            py="$3"
            onPress={handleCancelRequest}
          >
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={12}
              fontWeight="$semibold"
              textAlign="center"
            >
              Talebi İptal Et
            </Text>
          </Pressable>
        </Box>
      )}

      {/* Close Support Request Modal */}
      <CloseSupportRequestModal
        isVisible={isCloseModalVisible}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
        userName={params.expertName}
        userTitle={params.expertTitle}
        userAvatar={params.expertAvatar}
      />
    </Box>
    </SafeAreaView>
  );
};

SupportMessageDetailScreen.displayName = 'SupportMessageDetailScreen';

export default SupportMessageDetailScreen;
