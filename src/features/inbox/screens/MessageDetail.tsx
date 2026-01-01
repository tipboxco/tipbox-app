import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Alert, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useAppStore } from '@/src/store/appStore';
import { useSendGift, useCreateSupportRequest, useSendDirectMessage, useThreadMessages } from '../api/hooks';
import { useSocket } from '@/src/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { inboxKeys } from '../api/hooks';
import MessageDetailHeader from '../components/MessageDetailHeader';
import MessageInput from '../components/MessageInput';
import MessageDetailActionButtons from '../components/MessageDetailActionButtons';
import SendTipsBottomSheet from '../components/SendTipsBottomSheet';
import OneOnOneSupportBottomSheet from '../components/OneOnOneSupportBottomSheet';

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
  // Message status indicators
  isRead?: boolean; // Mesaj okundu mu?
  readAt?: string; // Okunma zamanı
}

type MessageDetailScreenNavigationProp = NativeStackNavigationProp<any, 'MessageDetailScreen'>;

interface MessageDetailScreenParams {
  messageId: string;
  recipientUserId?: string; // Mesaj gönderilecek kullanıcı ID'si
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

const MessageDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<MessageDetailScreenNavigationProp>();
  const route = useRoute();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<MessageDetailItem[]>([]);
  const [expandedSupportRequests, setExpandedSupportRequests] = useState<{ [key: string]: boolean }>({});
  // Mesaj görünürlüğü takibi için (okundu işaretleme)
  const visibleMessageIdsRef = useRef<Set<string>>(new Set());

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

  // Safe area and tab bar insets
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Route params'dan gelen verileri al
  const params = (route.params as MessageDetailScreenParams) || {
    messageId: '',
    senderName: 'Unknown',
    senderTitle: '',
    senderAvatar: undefined,
  };

  // Get current user from store
  const { user } = useAppStore();
  const sendGiftMutation = useSendGift();
  const createSupportRequestMutation = useCreateSupportRequest();
  const sendDirectMessageMutation = useSendDirectMessage();
  const queryClient = useQueryClient();
  
  // Socket context
  const {
    isConnected,
    joinThread,
    leaveThread,
    sendMessage: socketSendMessage,
    sendSupportMessage: socketSendSupportMessage,
    startTyping: socketStartTyping,
    stopTyping: socketStopTyping,
    markMessageAsRead: socketMarkMessageAsRead,
    markThreadRead: socketMarkThreadRead,
    on,
    off,
  } = useSocket();

  // Thread ID state
  const [threadId, setThreadId] = useState<string | null>(null);
  // Socket bağlantı durumu state
  const [isSocketReady, setIsSocketReady] = useState(false);
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Klavye yüksekliği state
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Güvenli scroll helper - _tracking hatasını önlemek için
  const safeScrollToEnd = useCallback((animated: boolean = true) => {
    try {
      flatListRef.current?.scrollToEnd({ animated });
    } catch (error) {
      // _tracking hatasını sessizce yakala
      // console.warn('[MessageDetail] Scroll error:', error);
    }
  }, []);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Route params'dan recipientUserId'yi al
  const routeParams = (route.params as MessageDetailScreenParams) || {};
  const recipientUserId = routeParams.recipientUserId || routeParams.messageId;

  // Thread mesajlarını yükle
  const { data: threadMessages, isLoading: isLoadingMessages, refetch: refetchMessages } = useThreadMessages(threadId);

  // Klavye event listener'ları - sadece scroll için (KeyboardAvoidingView otomatik yönetir)
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
        console.log('[MessageDetail] ⌨️ Keyboard opened');
        
        // Klavye açıldığında en son mesaja scroll yap
        setTimeout(() => {
          safeScrollToEnd(true);
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        console.log('[MessageDetail] ⌨️ Keyboard closed');
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [safeScrollToEnd]);

  // Thread mesajlarını local state'e dönüştür
  useEffect(() => {
    if (threadMessages) {
      if (threadMessages.length > 0) {
        console.log('[MessageDetail] 📥 Thread messages loaded:', threadMessages.length);
        const convertedMessages: MessageDetailItem[] = threadMessages.map((msg) => ({
          id: msg.id,
          text: msg.message,
          timestamp: new Date(msg.sentAt).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isSent: msg.senderId === user?.id,
          senderName: msg.senderId === user?.id ? undefined : params.senderName,
          senderAvatar: msg.senderId === user?.id ? undefined : params.senderAvatar,
          isRead: msg.isRead,
          readAt: msg.readAt,
        }));
        setMessages(convertedMessages);
        
        // Scroll to bottom
        setTimeout(() => {
          safeScrollToEnd(false);
        }, 100);
      } else {
        console.log('[MessageDetail] 📭 No messages in thread yet');
        setMessages([]);
      }
    } else if (!isLoadingMessages) {
      console.log('[MessageDetail] ⚠️ Thread messages is null/undefined');
    }
  }, [threadMessages, isLoadingMessages, user?.id, params.senderName, params.senderAvatar]);

  // 4️⃣ CHAT EKRANI AÇILDIĞINDA - Thread ID kontrolü, socket bağlantısı, thread join, event listener'lar
  useEffect(() => {
    if (!recipientUserId || !user?.id) {
      return;
    }

    let currentThreadId: string | null = null;

    const initializeChat = async () => {
      try {
        // 1. Thread ID kontrolü
        // Thread ID yoksa → REST API: POST /messages/threads
        const { getOrCreateThread } = await import('../api/messagesApi');
        let thread;
        try {
          thread = await getOrCreateThread(recipientUserId);
          currentThreadId = thread.id;
          setThreadId(thread.id);
        } catch (error: any) {
          // 404 hatası: Thread endpoint backend'de henüz implement edilmemiş
          if (error?.response?.status === 404 || error?.isThreadEndpointNotFound) {
            console.info('[MessageDetail] Thread endpoint not available, using recipientUserId as threadId (fallback mode)');
            currentThreadId = recipientUserId;
            setThreadId(recipientUserId);
          } else {
            throw error;
          }
        }

        // 2. Socket bağlantısı kontrolü ve thread join
        if (isConnected && currentThreadId) {
          console.log('[MessageDetail] ✅ Socket connected, joining thread:', currentThreadId);
          joinThread(currentThreadId);
          setIsSocketReady(true);
          
          // Thread'e katıldıktan sonra mesajları okundu işaretle
          // thread_joined event'inde yapılacak
        } else {
          console.log('[MessageDetail] ⚠️ Socket not connected, will join when connected');
          setIsSocketReady(false);
        }

        // 5. Mesaj geçmişini yükle (REST API)
        // useThreadMessages hook'u otomatik olarak yükleyecek
        if (currentThreadId) {
          console.log('[MessageDetail] 🔄 Refetching thread messages for thread:', currentThreadId);
          refetchMessages();
        }
      } catch (error: any) {
        console.error('[MessageDetail] Chat initialization error:', error);
        // Fallback: recipientUserId'yi threadId olarak kullan
        setThreadId(recipientUserId);
      }
    };

    initializeChat();

    // Cleanup (unmount):
    return () => {
      if (currentThreadId && isConnected) {
        console.log('[MessageDetail] 🔌 Leaving thread on unmount:', currentThreadId);
        leaveThread(currentThreadId);
      }
    };
  }, [recipientUserId, user?.id, isConnected, joinThread, leaveThread]);

  // Socket bağlantısı hazır olduğunda thread'e join et
  useEffect(() => {
    if (isConnected && threadId && !isSocketReady) {
      console.log('[MessageDetail] ✅ Socket connected, joining thread:', threadId);
      joinThread(threadId);
      setIsSocketReady(true);
    }
  }, [isConnected, threadId, isSocketReady, joinThread]);

  // 9️⃣ SOCKET EVENT'LERİ ALINIR - new_message event handler
  const handleNewMessage = useCallback((eventData: any) => {
    console.log('[MessageDetail] 📨 New message received:', eventData);

    const currentUserId = user?.id;
    const currentThreadId = threadId;

    // Bu mesaj bu thread'e ait mi kontrol et
    if (!currentThreadId || eventData.threadId !== currentThreadId) {
      return;
    }

    // Mesaj tipine göre işle
    if (eventData.messageType === 'message') {
      // Normal mesaj
      const newMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: eventData.message,
        timestamp: new Date(eventData.timestamp).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: eventData.senderId === currentUserId,
        senderName: eventData.senderId === currentUserId ? undefined : params.senderName,
        senderAvatar: eventData.senderId === currentUserId ? undefined : params.senderAvatar,
        isRead: false, // Yeni mesaj henüz okunmadı
      };

      setMessages((prev) => {
        // Duplicate kontrolü
        if (prev.some((msg) => msg.id === eventData.messageId)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      // Scroll to bottom
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    } else if (eventData.messageType === 'send-tips') {
      // TIPS mesajı - şu an için sadece log
      console.log('[MessageDetail] TIPS message received:', eventData);
      // TODO: TIPS mesajını UI'da göster
    } else if (eventData.messageType === 'support-request') {
      // Support request mesajı - şu an için sadece log
      console.log('[MessageDetail] Support request received:', eventData);
      // TODO: Support request mesajını UI'da göster
    }

    // Mesaj listesini invalidate et (inbox listesini güncelle)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
  }, [user?.id, threadId, params.senderName, params.senderAvatar, queryClient]);

  // 9️⃣ SOCKET EVENT'LERİ ALINIR - message_sent event handler (gönderici onayı)
  const handleMessageSent = useCallback((eventData: any) => {
    console.log('[MessageDetail] ✅ Message sent confirmation:', eventData);
    
    // Thread ID kontrolü
    if (eventData.threadId !== threadId) {
      return;
    }

    // Optimistic update'teki mesajı gerçek mesaj ID'si ile güncelle
    setMessages((prev) =>
      prev.map((msg) => {
        // Eğer bu mesaj henüz ID'si yoksa (optimistic update) ve içerik eşleşiyorsa
        if (msg.text === eventData.message && msg.isSent && msg.id.startsWith('pending-')) {
          return {
            ...msg,
            id: eventData.messageId,
          };
        }
        return msg;
      })
    );
  }, [threadId]);

  // Thread event handlers
  const handleThreadJoined = useCallback((data: { threadId: string }) => {
    console.log('[MessageDetail] ========================================');
    console.log('[MessageDetail] ✅ THREAD JOINED EVENT RECEIVED');
    console.log('[MessageDetail] ========================================');
    console.log('[MessageDetail]    - Thread ID:', data.threadId);
    console.log('[MessageDetail]    - Current Thread ID:', threadId);
    console.log('[MessageDetail]    - Match:', data.threadId === threadId ? '✅' : '❌');
    
    // Thread'e katıldıktan sonra tüm mesajları okundu işaretle
    if (data.threadId === threadId && isConnected) {
      console.log('[MessageDetail] 📖 Marking thread as read:', threadId);
      socketMarkThreadRead(threadId);
    }
  }, [threadId, isConnected, socketMarkThreadRead]);

  const handleThreadLeft = useCallback((data: { threadId: string }) => {
    console.log('[MessageDetail] Thread left:', data.threadId);
  }, []);

  const handleThreadJoinError = useCallback((error: { threadId: string; reason: string }) => {
    console.error('[MessageDetail] Thread join error:', error.reason);
    Alert.alert('Hata', `Thread'e katılamadı: ${error.reason}`);
  }, []);

  const handleMessageSendError = useCallback((error: { reason: string }) => {
    console.error('[MessageDetail] Message send error:', error.reason);
    Alert.alert('Hata', `Mesaj gönderilemedi: ${error.reason}`);
  }, []);

  // Typing indicator handler
  const handleUserTyping = useCallback((data: { userId: string; threadId: string; isTyping: boolean }) => {
    if (data.threadId === threadId) {
      setIsTyping(data.isTyping);
      setTypingUserId(data.isTyping ? data.userId : null);

      // Typing indicator'ı 3 saniye sonra otomatik kapat
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

  // Message read handler
  const handleMessageRead = useCallback((data: { messageId: string; threadId: string; readBy: string; timestamp: string }) => {
    if (data.threadId === threadId) {
      // Mesajı okundu olarak işaretle
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === data.messageId) {
            return {
              ...msg,
              isRead: true,
              readAt: data.timestamp,
            };
          }
          return msg;
        })
      );
    }
  }, [threadId]);

  // Mesaj okundu işaretleme - Basit implementasyon (Reanimated kullanmadan)
  // onViewableItemsChanged kaldırıldı (_tracking hatası nedeniyle)
  // Mesajlar scroll edildiğinde otomatik olarak okundu sayılacak

  // Socket event listeners effect
  useEffect(() => {
    if (!isSocketReady || !threadId || !isConnected) {
      return;
    }

    console.log('[MessageDetail] 📡 Adding socket event listeners for thread:', threadId);

    // Event listener'ları ekle
    on('new_message', handleNewMessage);
    on('message_sent', handleMessageSent);
    on('thread_joined', handleThreadJoined);
    on('thread_left', handleThreadLeft);
    on('thread_join_error', handleThreadJoinError);
    on('message_send_error', handleMessageSendError);
    on('user_typing', handleUserTyping);
    on('message_read', handleMessageRead);

    return () => {
      console.log('[MessageDetail] 🧹 Removing socket event listeners');
      off('new_message', handleNewMessage);
      off('message_sent', handleMessageSent);
      off('thread_joined', handleThreadJoined);
      off('thread_left', handleThreadLeft);
      off('thread_join_error', handleThreadJoinError);
      off('message_send_error', handleMessageSendError);
      off('user_typing', handleUserTyping);
      off('message_read', handleMessageRead);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (threadId && isConnected) {
        socketStopTyping(threadId);
      }

      if (threadId && isConnected) {
        leaveThread(threadId);
      }
    };
  }, [isSocketReady, threadId, isConnected, on, off, handleNewMessage, handleMessageSent, handleThreadJoined, handleThreadLeft, handleThreadJoinError, handleMessageSendError, handleUserTyping, handleMessageRead, socketStopTyping, leaveThread]);

  // Handle Send TIPS
  const handleSendTips = useCallback((amount: number, message?: string) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    const routeParams = (route.params as MessageDetailScreenParams) || {};
    const recipientUserId = routeParams.recipientUserId || routeParams.messageId; // Fallback to messageId if recipientUserId not provided

    if (!recipientUserId) {
      Alert.alert('Hata', 'Alıcı kullanıcı bilgisi bulunamadı');
      return;
    }

    sendGiftMutation.mutate(
      {
        senderUserId: user.id,
        recipientUserId: recipientUserId,
        message: message || '',
        amount: amount,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          Alert.alert('Başarılı', 'TIPS başarıyla gönderildi');
          closeBottomSheet();
        },
        onError: (error) => {
          Alert.alert('Hata', error.message || 'TIPS gönderilirken bir hata oluştu');
        },
      }
    );
  }, [user, route, sendGiftMutation, closeBottomSheet]);

  // Handle Send TIPS button press
  const handleSendTipsPress = () => {
    const routeParams = (route.params as MessageDetailScreenParams) || {
      messageId: '',
      senderName: 'Unknown',
      senderTitle: '',
      senderAvatar: undefined,
    };
    
    openBottomSheet(
      <SendTipsBottomSheet
        senderName={routeParams.senderName}
        senderTitle={routeParams.senderTitle}
        senderAvatar={routeParams.senderAvatar}
        onClose={closeBottomSheet}
        onSend={handleSendTips}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : tabBarHeight + 8,
      }
    );
  };

  // Handle Send Support Request
  const handleSendSupport = useCallback((supportType: string, message: string, amount: number) => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    const routeParams = (route.params as MessageDetailScreenParams) || {};
    const recipientUserId = routeParams.recipientUserId || routeParams.messageId; // Fallback to messageId if recipientUserId not provided

    if (!recipientUserId) {
      Alert.alert('Hata', 'Alıcı kullanıcı bilgisi bulunamadı');
      return;
    }

    // Map supportType to API format
    const apiSupportType = supportType === 'Product Authentication' ? 'PRODUCT' : 
                          supportType === 'Technical Support' ? 'TECHNICAL' : 'GENERAL';

    createSupportRequestMutation.mutate(
      {
        senderUserId: user.id,
        recipientUserId: recipientUserId,
        type: apiSupportType as 'GENERAL' | 'TECHNICAL' | 'PRODUCT',
        message: message,
        amount: amount.toString(),
        status: 'pending',
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          // Local state'e ekle (socket event'ten sonra gerçek mesaj gelecek)
          const newSupportRequest: MessageDetailItem = {
            id: Date.now().toString(),
            text: '',
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            isSent: true,
            type: 'support_request',
            supportRequest: {
              supportType: supportType,
              message: message,
              amount: amount,
              status: 'pending',
            },
          };

          setMessages((prev) => [...prev, newSupportRequest]);

          setTimeout(() => {
            safeScrollToEnd(true);
          }, 100);

          Alert.alert('Başarılı', 'Destek talebi başarıyla gönderildi');
          closeBottomSheet();
        },
        onError: (error) => {
          Alert.alert('Hata', error.message || 'Destek talebi gönderilirken bir hata oluştu');
        },
      }
    );
  }, [user, route, createSupportRequestMutation, closeBottomSheet]);

  // Handle Request 1-on-1 Support button press
  const handleRequestSupportPress = () => {
    const routeParams = (route.params as MessageDetailScreenParams) || {
      messageId: '',
      senderName: 'Unknown',
      senderTitle: '',
      senderAvatar: undefined,
    };
    
    openBottomSheet(
      <OneOnOneSupportBottomSheet
        expertName={routeParams.senderName}
        expertTitle={routeParams.senderTitle}
        expertAvatar={routeParams.senderAvatar}
        onClose={closeBottomSheet}
        onSend={handleSendSupport}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : tabBarHeight + 8,
      }
    );
  };



  // 6️⃣ KULLANICI MESAJ GÖNDERİR - Socket üzerinden mesaj gönder
  const handleSendMessage = useCallback((messageText: string) => {
    // 1. Validasyon
    if (!messageText.trim()) {
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    // Thread ID yoksa recipientUserId'yi kullan (fallback)
    const effectiveThreadId = threadId || recipientUserId;
    
    if (!effectiveThreadId) {
      Alert.alert('Hata', 'Alıcı kullanıcı bilgisi bulunamadı.');
      return;
    }

    // 2. Optimistic UI Update - local state'e ekle (pending durumu)
    const optimisticMessageId = `pending-${Date.now()}`;
    const newMessage: MessageDetailItem = {
      id: optimisticMessageId,
      text: messageText.trim(),
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isSent: true,
      isRead: false, // Henüz okunmadı
    };

    setMessages((prev) => [...prev, newMessage]);

    // Mesaj listesini en alta kaydır
    setTimeout(() => {
      safeScrollToEnd(true);
    }, 100);

    // 3. Socket bağlantısı kontrolü - Socket bağlıysa socket ile gönder
    if (isConnected && isSocketReady && effectiveThreadId) {
      console.log('[MessageDetail] 📤 Sending message via socket:', messageText.trim());
      socketSendMessage(effectiveThreadId, messageText.trim());
    } else {
      // Fallback: REST API ile mesaj gönder
      console.warn('[MessageDetail] ⚠️ Socket not ready, using REST API fallback');
      if (recipientUserId) {
        sendDirectMessageMutation.mutate(
          {
            recipientUserId: recipientUserId,
            message: messageText.trim(),
          },
          {
            onSuccess: () => {
              console.log('[MessageDetail] ✅ Message sent via REST API, refetching...');
              // Mesaj listesini invalidate et ve refetch yap
              queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
              queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(effectiveThreadId) });
              refetchMessages();
            },
            onError: (error) => {
              console.error('[MessageDetail] ❌ Message send error:', error);
              // Hata durumunda mesajı geri al
              setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessageId));
              Alert.alert('Hata', error.message || 'Mesaj gönderilirken bir hata oluştu');
            },
          }
        );
      } else {
        // recipientUserId yoksa optimistic mesajı geri al
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessageId));
        Alert.alert('Hata', 'Alıcı kullanıcı bilgisi bulunamadı');
      }
    }
  }, [user?.id, threadId, recipientUserId, isConnected, isSocketReady, socketSendMessage, sendDirectMessageMutation, queryClient, refetchMessages]);

  // Typing indicator handlers
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
        safeScrollToEnd(true);
      }, 100);
    }
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

          <VStack space="xs" alignItems={isSent ? 'flex-end' : 'flex-start'}>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={8}
              fontWeight="$normal"
            >
              {item.timestamp}
            </Text>
            {/* Read receipt (görüldü) - sadece gönderilen mesajlarda */}
            {isSent && (
              <HStack space="xs" alignItems="center">
                {item.isRead ? (
                  <>
                    <Feather
                      name="check"
                      size={12}
                      color={isDark ? '#4CAF50' : '#4CAF50'}
                    />
                    <Text
                      color={isDark ? '#4CAF50' : '#4CAF50'}
                      fontSize={7}
                      fontWeight="$normal"
                    >
                      Görüldü
                    </Text>
                  </>
                ) : (
                  <Feather
                    name="check"
                    size={12}
                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  />
                )}
              </HStack>
            )}
          </VStack>
        </HStack>
      </VStack>
    );
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
          <Box flex={1}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ 
                paddingTop: 16, 
                paddingBottom: 16,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              style={{ flex: 1 }}
            />
          </Box>

          {/* Typing Indicator */}
          {isTyping && typingUserId && typingUserId !== user?.id && (
            <Box px="$4" py="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
              <HStack space="xs" alignItems="center">
                <Text
                  color={isDark ? '#8C8C8C' : '#8C8C8C'}
                  fontSize={10}
                  fontStyle="italic"
                >
                  {params.senderName || 'Kullanıcı'} yazıyor
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

          {/* Mesaj Input - KeyboardAvoidingView ile otomatik yönetilir */}
          <MessageInput
            onSendMessage={handleSendMessage}
            onAddImage={() => console.log('Görsel eklenecek')}
            placeholder="Mesajınızı yazın..."
            threadId={threadId}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
          />

          {/* Action Buttons */}
          <MessageDetailActionButtons
            onSendTipsPress={handleSendTipsPress}
            onRequestSupportPress={handleRequestSupportPress}
            keyboardHeight={0}
            isKeyboardVisible={false}
            keyboardAnim={null}
          />
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

MessageDetailScreen.displayName = 'MessageDetailScreen';

export default MessageDetailScreen;

