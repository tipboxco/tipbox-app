import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Alert, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  ButtonText,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalBody,
  Input,
  InputField,
  Pressable,
} from '@gluestack-ui/themed';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
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
import { useThreadMessages, useAcceptSupportRequest, useRejectSupportRequest, useCancelSupportRequest, useCloseSupportRequest, useReportSupportRequest, inboxKeys } from '../api/hooks';
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
    status: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
    requestId?: string; // Support request ID (backend'den gelir)
    threadId?: string | null; // Support thread ID (accepted ise)
    fromUserId?: string; // Request'i oluşturan kullanıcı ID'si
    toUserId?: string; // Request'in gönderildiği kullanıcı ID'si (expert)
  };
  // Message status indicators
  isRead?: boolean; // Mesaj okundu mu?
  readAt?: string; // Okunma zamanı
}

type SupportMessageDetailScreenNavigationProp = NativeStackNavigationProp<any, 'SupportMessageDetail'>;

interface SupportMessageDetailParams {
  expertName?: string;
  expertTitle?: string;
  expertAvatar?: any;
  userName?: string;
  userTitle?: string;
  userAvatar?: any;
  requestId?: string;
  status?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
  threadId?: string | null;
  recipientUserId?: string;
}



const SupportMessageDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SupportMessageDetailScreenNavigationProp>();
  const route = useRoute();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<MessageDetailItem[]>([]);
  const [expandedSupportRequests, setExpandedSupportRequests] = useState<{ [key: string]: boolean }>({});
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const acceptMutation = useAcceptSupportRequest();
  const rejectMutation = useRejectSupportRequest();
  const cancelMutation = useCancelSupportRequest();
  const closeMutation = useCloseSupportRequest();
  const reportMutation = useReportSupportRequest();

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
    expertAvatar: DEFAULT_USER_AVATAR,
    userName: 'Trevor Nace',
    userTitle: 'Technology Enthusiast',
    userAvatar: DEFAULT_USER_AVATAR,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Support request bilgilerini thread mesajlarından al
  const [supportRequestInfo, setSupportRequestInfo] = useState<{
    supportType?: string;
    message?: string;
    amount?: number;
    status?: string;
  } | null>(null);

  // Thread mesajlarını yükle (eğer threadId varsa)
  const { data: threadMessages, isLoading: isLoadingMessages, refetch: refetchMessages } = useThreadMessages(threadId || null);

  // Thread mesajlarını local state'e dönüştür
  useEffect(() => {
    if (threadMessages && threadId) {
      // Support request bilgisini bul (ilk support-request mesajından)
      const supportRequestMsg = threadMessages.find(msg => msg.messageType === 'support-request');
      if (supportRequestMsg) {
        setSupportRequestInfo({
          supportType: supportRequestMsg.supportRequestType || 'GENERAL',
          message: supportRequestMsg.message,
          amount: supportRequestMsg.amount || 0,
          status: supportRequestMsg.supportRequestStatus || 'pending',
        });
      }
      
      const convertedMessages: MessageDetailItem[] = threadMessages
        .filter(msg => msg.messageType === 'message') // Support thread'de sadece mesajlar gösterilir
        .map((msg) => {
          const isSent = msg.senderId === user?.id;
          // Backend'den gelen sender bilgilerini kullan (varsa), yoksa params'dan al
          const senderName = isSent 
            ? undefined 
            : (msg.senderName || params.expertName || 'Unknown');
          const senderAvatar = isSent 
            ? undefined 
            : (msg.senderAvatar ? toImageSource(msg.senderAvatar) : params.expertAvatar);
          
          // Normal mesaj (support thread'de sadece mesajlar var)
          return {
            id: msg.id,
            text: msg.message || '',
            timestamp: new Date(msg.sentAt).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isSent,
            senderName,
            senderAvatar,
            isRead: msg.isRead,
            readAt: msg.readAt,
          };
        });
      
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
  const handleSupportRequestAccepted = useCallback((data: { requestId: string; threadId: string; timestamp?: string }) => {
    console.log('[SupportMessageDetail] ✅ Support request accepted event:', data);
    
    // Local state'te support request'i accepted olarak güncelle
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
          return {
            ...msg,
            supportRequest: {
              ...msg.supportRequest,
              status: 'accepted',
              threadId: data.threadId,
            },
          };
        }
        return msg;
      })
    );
    
    // Inbox listesini invalidate et
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    
    // Eğer bu ekrandaki request ise, threadId'yi güncelle
    if (data.requestId === requestId) {
      console.log('[SupportMessageDetail] Support request accepted, threadId:', data.threadId);
      // Navigate to support chat with threadId
      navigation.setParams({ threadId: data.threadId, status: 'active' });
    }
  }, [requestId, navigation, queryClient]);

  // Support request rejected handler
  const handleSupportRequestRejected = useCallback((data: { requestId: string }) => {
    console.log('[SupportMessageDetail] ❌ Support request rejected event:', data);
    
    // Local state'te support request'i rejected olarak güncelle
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
          return {
            ...msg,
            supportRequest: {
              ...msg.supportRequest,
              status: 'rejected',
            },
          };
        }
        return msg;
      })
    );
    
    // Inbox listesini invalidate et
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
  }, [queryClient]);

  // Support request cancelled handler
  const handleSupportRequestCancelled = useCallback((data: { requestId: string }) => {
    console.log('[SupportMessageDetail] 🚫 Support request cancelled event:', data);
    
    // Local state'te support request'i canceled olarak güncelle
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
          return {
            ...msg,
            supportRequest: {
              ...msg.supportRequest,
              status: 'canceled',
            },
          };
        }
        return msg;
      })
    );
    
    // Inbox listesini invalidate et
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
  }, [queryClient]);

  // Klavye event listener'ları
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const height = event.endCoordinates.height;
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);
        console.log('[SupportMessageDetail] ⌨️ Keyboard opened, height:', height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        console.log('[SupportMessageDetail] ⌨️ Keyboard closed');
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    on('thread_joined', handleThreadJoined);
    on('new_message', handleNewMessage);
    on('user_typing', handleUserTyping);
    on('support_request_accepted', handleSupportRequestAccepted);
    on('support_request_rejected', handleSupportRequestRejected);
    on('support_request_cancelled', handleSupportRequestCancelled);

    return () => {
      off('thread_joined', handleThreadJoined);
      off('new_message', handleNewMessage);
      off('user_typing', handleUserTyping);
      off('support_request_accepted', handleSupportRequestAccepted);
      off('support_request_rejected', handleSupportRequestRejected);
      off('support_request_cancelled', handleSupportRequestCancelled);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (threadId && isConnected) {
        socketStopTyping(threadId);
      }
    };
  }, [isConnected, threadId, on, off, handleThreadJoined, handleNewMessage, handleUserTyping, handleSupportRequestAccepted, handleSupportRequestRejected, handleSupportRequestCancelled, socketStopTyping]);

  // Yeni mesaj gönderme
  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim()) return;
    if (!threadId) {
      Alert.alert('Error', 'Thread ID not found');
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
      Alert.alert('Error', 'Socket connection not available');
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
  const handleAcceptRequest = (acceptRequestId?: string) => {
    const targetRequestId = acceptRequestId || requestId;
    if (!targetRequestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    if (isConnected && isSocketReady) {
      // Socket ile accept et
      console.log('[SupportMessageDetail] ✅ Accepting support request via socket:', targetRequestId);
      socketAcceptSupportRequest(targetRequestId);
    } else {
      // REST API ile accept et
      console.log('[SupportMessageDetail] ✅ Accepting support request via REST API:', targetRequestId);
      acceptMutation.mutate(targetRequestId, {
        onSuccess: (data) => {
          console.log('[SupportMessageDetail] ✅ Support request accepted, threadId:', data.threadId);
          Alert.alert('Success', 'Support request accepted');
          // Inbox listesini invalidate et
          queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
          // Eğer bu ekrandaki request ise, threadId'yi güncelle
          if (targetRequestId === requestId) {
            navigation.setParams({ threadId: data.threadId, status: 'active' });
          }
        },
        onError: (error: any) => {
          console.error('[SupportMessageDetail] ❌ Support request accept error:', error);
          Alert.alert('Error', error.message || 'Support request could not be accepted');
        },
      });
    }
  };

  // Reject support request
  const handleRejectRequest = (rejectRequestId?: string) => {
    const targetRequestId = rejectRequestId || requestId;
    if (!targetRequestId) {
      Alert.alert('Error', 'Request ID not found');
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
            if (isConnected && isSocketReady) {
              // Socket ile reject et
              console.log('[SupportMessageDetail] ❌ Rejecting support request via socket:', targetRequestId);
              socketRejectSupportRequest(targetRequestId);
            } else {
              // REST API ile reject et
              console.log('[SupportMessageDetail] ❌ Rejecting support request via REST API:', targetRequestId);
              rejectMutation.mutate(targetRequestId, {
                onSuccess: () => {
                  console.log('[SupportMessageDetail] ✅ Support request rejected');
                  Alert.alert('Success', 'Support request rejected');
                  // Inbox listesini invalidate et
                  queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
                  queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
                  // Eğer bu ekrandaki request ise, geri dön
                  if (targetRequestId === requestId) {
                    navigation.goBack();
                  }
                },
                onError: (error: any) => {
                  console.error('[SupportMessageDetail] ❌ Support request reject error:', error);
                  Alert.alert('Error', error.message || 'Support request could not be rejected');
                },
              });
            }
          },
        },
      ]
    );
  };

  // Cancel support request (sadece sender yapabilir)
  const handleCancelRequest = (cancelRequestId?: string) => {
    const targetRequestId = cancelRequestId || requestId;
    if (!targetRequestId) {
      Alert.alert('Error', 'Request ID not found');
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
            if (isConnected && isSocketReady) {
              console.log('[SupportMessageDetail] 🚫 Canceling support request via socket:', targetRequestId);
              socketCancelSupportRequest(targetRequestId);
            } else {
              console.log('[SupportMessageDetail] 🚫 Canceling support request via REST API:', targetRequestId);
              cancelMutation.mutate(targetRequestId, {
                onSuccess: () => {
                  console.log('[SupportMessageDetail] ✅ Support request canceled');
                  Alert.alert('Success', 'Support request cancelled');
                  // Inbox listesini invalidate et
                  queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
                  queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
                  // Eğer bu ekrandaki request ise, geri dön
                  if (targetRequestId === requestId) {
                    navigation.goBack();
                  }
                },
                onError: (error: any) => {
                  console.error('[SupportMessageDetail] ❌ Support request cancel error:', error);
                  Alert.alert('Error', error.message || 'Support request could not be cancelled');
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
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    console.log('[SupportMessageDetail] Closing support request with rating:', rating);
    
    closeMutation.mutate(
      {
        requestId: requestId,
        data: {
          rating: rating,
          comment: undefined, // Opsiyonel yorum eklenebilir
        },
      },
      {
        onSuccess: () => {
          console.log('[SupportMessageDetail] ✅ Support request closed successfully');
          Alert.alert('Success', 'Support request closed successfully');
          setIsCloseModalVisible(false);
          
          // Inbox listesini invalidate et
          queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
          
          // Geri dön
          navigation.goBack();
        },
        onError: (error: any) => {
          console.error('[SupportMessageDetail] ❌ Close support request error:', error);
          Alert.alert('Error', error.message || 'An error occurred while closing the support request');
        },
      }
    );
  };

  // Handle cancel close request
  const handleCancelClose = () => {
    setIsCloseModalVisible(false);
  };

  // Handle report button press
  const handleReport = () => {
    setIsReportModalVisible(true);
  };

  // Handle confirm report
  const handleConfirmReport = () => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    if (!reportReason || reportReason.trim().length === 0) {
      Alert.alert('Error', 'Please specify a reason');
      return;
    }

    console.log('[SupportMessageDetail] Reporting support request:', reportReason);
    
    reportMutation.mutate(
      {
        requestId: requestId,
        data: {
          reason: reportReason.trim(),
          description: undefined, // Opsiyonel açıklama eklenebilir
        },
      },
      {
        onSuccess: () => {
          console.log('[SupportMessageDetail] ✅ Support request reported successfully');
          Alert.alert('Success', 'Support request reported successfully');
          setIsReportModalVisible(false);
          setReportReason('');
          
          // Inbox listesini invalidate et
          queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
          
          // Geri dön
          navigation.goBack();
        },
        onError: (error: any) => {
          console.error('[SupportMessageDetail] ❌ Report support request error:', error);
          Alert.alert('Error', error.message || 'An error occurred while reporting the support request');
        },
      }
    );
  };

  // Handle cancel report
  const handleCancelReport = () => {
    setIsReportModalVisible(false);
    setReportReason('');
  };

  // Mesaj öğesi render fonksiyonu
  const renderMessageItem = ({ item }: { item: MessageDetailItem }) => {
    // Support Request render'ı
    if (item.type === 'support_request' && item.supportRequest) {
      const isExpanded = expandedSupportRequests[item.id];
      const isSent = item.isSent;
      const requestStatus = item.supportRequest.status;
      const requestId = item.supportRequest.requestId || item.id;
      const supportThreadId = item.supportRequest.threadId;
      const fromUserId = item.supportRequest.fromUserId;
      const toUserId = item.supportRequest.toUserId;
      
      // Kullanıcı rolleri: Sender (fromUserId) veya Recipient (toUserId/expert)
      const isSender = fromUserId === user?.id;
      const isRecipient = toUserId === user?.id;

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

                  {/* Status Badge */}
                  <VStack space="xs" mt="$2">
                    <Text
                      fontSize={9}
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      Status
                    </Text>
                    <Box
                      bg={
                        requestStatus === 'pending' ? (isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)') :
                        requestStatus === 'accepted' ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)') :
                        requestStatus === 'rejected' ? (isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)') :
                        requestStatus === 'canceled' ? (isDark ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)') :
                        (isDark ? '#2A2A2A' : '#E5E5E5')
                      }
                      borderRadius={8}
                      px="$2"
                      py="$1"
                      alignSelf="flex-start"
                    >
                      <Text
                        fontSize={10}
                        fontWeight="$semibold"
                        color={
                          requestStatus === 'pending' ? '#FFC107' :
                          requestStatus === 'accepted' ? '#4CAF50' :
                          requestStatus === 'rejected' ? '#F44336' :
                          requestStatus === 'canceled' ? '#9E9E9E' :
                          (isDark ? '#FFFFFF' : '#000000')
                        }
                        textTransform="capitalize"
                      >
                        {requestStatus}
                      </Text>
                    </Box>
                  </VStack>

                  {/* Action Buttons - Durum ve kullanıcı rolüne göre */}
                  {requestStatus === 'pending' && (
                    <VStack space="sm" mt="$3">
                      {isSender && (
                        // Sender: Cancel butonu
                          <Button
                            onPress={() => handleCancelRequest(requestId)}
                            bg={isDark ? '#F44336' : '#F44336'}
                            borderRadius={8}
                            py="$2"
                          >
                            <ButtonText color="#FFFFFF" fontSize={12} fontWeight="$semibold">
                              Cancel Request
                            </ButtonText>
                          </Button>
                      )}
                      {isRecipient && (
                        // Recipient (Expert): Accept ve Reject butonları
                        <HStack space="sm">
                          <Button
                            onPress={() => handleAcceptRequest(requestId)}
                            bg={isDark ? '#4CAF50' : '#4CAF50'}
                            borderRadius={8}
                            py="$2"
                            flex={1}
                          >
                            <ButtonText color="#FFFFFF" fontSize={12} fontWeight="$semibold">
                              Accept
                            </ButtonText>
                          </Button>
                          <Button
                            onPress={() => handleRejectRequest(requestId)}
                            bg={isDark ? '#F44336' : '#F44336'}
                            borderRadius={8}
                            py="$2"
                            flex={1}
                          >
                            <ButtonText color="#FFFFFF" fontSize={12} fontWeight="$semibold">
                              Reject
                            </ButtonText>
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                  )}
                  
                  {requestStatus === 'accepted' && supportThreadId && (
                    // Accepted: Support thread'e yönlendirme zaten ekranda (status='active' olduğunda)
                    <VStack space="sm" mt="$3">
                      <Text
                        fontSize={10}
                        fontWeight="$normal"
                        color={isDark ? '#4CAF50' : '#4CAF50'}
                        fontStyle="italic"
                      >
                        Support request has been accepted. Support chat is now active.
                      </Text>
                    </VStack>
                  )}
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
                {requestStatus === 'pending' 
                  ? 'Support request will close automatically in 24 hours if unanswered.'
                  : requestStatus === 'accepted'
                  ? 'Support request has been accepted. Support chat is now active.'
                  : requestStatus === 'rejected'
                  ? 'This support request has been rejected.'
                  : requestStatus === 'canceled'
                  ? 'This support request has been canceled.'
                  : 'Support request status: ' + requestStatus
                }
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
        senderName={params.expertName ?? 'Expert'}
        senderTitle={params.expertTitle ?? ''}
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
                user1Name={params.expertName ?? 'Expert'}
                user1Title={params.expertTitle ?? ''}
                user1Avatar={params.expertAvatar}
                user2Name={params.userName || 'Trevor Nace'}
                user2Title={params.userTitle || 'Technology Enthusiast'}
                user2Avatar={params.userAvatar || DEFAULT_USER_AVATAR }
                supportTitle={supportRequestInfo?.supportType || 'Support Chat'}
                tipsAmount={supportRequestInfo?.amount || 50}
                requestDetails={supportRequestInfo?.message || ''}
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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

      {/* Action Buttons - Görseldeki gibi sohbet içinde, sadece active status'ta göster */}
      {params.status === 'active' && threadId && (
        <SupportMessageDetailActionButtons
          onCloseRequestPress={handleCloseRequest}
          onReportPress={handleReport}
          keyboardHeight={keyboardHeight}
          isKeyboardVisible={isKeyboardVisible}
        />
      )}

      {/* Mesaj Gönderme Alanı - Sadece active status'ta göster */}
      {params.status === 'active' && threadId && (
        <MessageInput
          onSendMessage={handleSendMessage}
          onAddImage={() => console.log('Görsel eklenecek')}
          placeholder="Write a message..."
          threadId={threadId}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
        />
      )}

      {/* Action Buttons - Status'a göre farklı butonlar göster */}
      {params.status === 'pending' && (
        <Box px="$4" py="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <HStack space="sm" justifyContent="space-between">
            <Pressable onPress={() => handleAcceptRequest()}>
              <Box
                flex={1}
                bg="#E8FF6B"
                borderWidth={1}
                borderColor="#D8FF08"
                borderRadius={20}
                px="$4"
                py="$3"
              >
                <Text
                  color="#000000"
                  fontSize={12}
                  fontWeight="$semibold"
                  textAlign="center"
                >
                  Accept
                </Text>
              </Box>
            </Pressable>
            <Pressable onPress={() => handleRejectRequest()}>
              <Box
                flex={1}
                bg={isDark ? '#2A2A2A' : '#F2F2F2'}
                borderWidth={1}
                borderColor={isDark ? '#3A3A3A' : '#E5E5E5'}
                borderRadius={20}
                px="$4"
                py="$3"
              >
                <Text
                  color={isDark ? '#FFFFFF' : '#000000'}
                  fontSize={12}
                  fontWeight="$semibold"
                  textAlign="center"
                >
                  Reddet
                </Text>
              </Box>
            </Pressable>
          </HStack>
        </Box>
      )}


      {/* Pending status'ta sender için Cancel butonu */}
      {params.status === 'pending' && user?.id && (
        <Box px="$4" py="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <Pressable onPress={() => handleCancelRequest()}>
            <Box
              bg={isDark ? '#2A2A2A' : '#F2F2F2'}
              borderWidth={1}
              borderColor={isDark ? '#3A3A3A' : '#E5E5E5'}
              borderRadius={20}
              px="$4"
              py="$3"
            >
              <Text
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={12}
                fontWeight="$semibold"
                textAlign="center"
              >
                Talebi İptal Et
              </Text>
            </Box>
          </Pressable>
        </Box>
      )}

      {/* Close Support Request Modal */}
      <CloseSupportRequestModal
        isVisible={isCloseModalVisible}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
        onReport={handleReport}
        userName={params.expertName ?? 'Expert'}
        userTitle={params.expertTitle ?? ''}
        userAvatar={params.expertAvatar}
      />

      {/* Report Support Request Modal */}
      <Modal isOpen={isReportModalVisible} onClose={handleCancelReport} flex={1}>
        <ModalBackdrop bg="rgba(0, 0, 0, 0.5)" />
        <ModalContent
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
          borderRadius={24}
          maxWidth="90%"
          width="90%"
          mx="$4"
        >
          <ModalBody p="$5">
            <VStack space="md">
              <Text
                fontSize={18}
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
                textAlign="center"
              >
                Raporla
              </Text>

              <Text
                fontSize={14}
                fontWeight="$normal"
                color={isDark ? '#CCCCCC' : '#4B5563'}
                textAlign="center"
                lineHeight={20}
              >
                Bu destek talebini raporlamak için bir neden belirtin:
              </Text>

              <Input
                variant="outline"
                size="md"
                isDisabled={false}
                isInvalid={false}
                isReadOnly={false}
              >
                <InputField
                  placeholder="Reason for reporting..."
                  value={reportReason}
                  onChangeText={setReportReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  color={isDark ? '#FFFFFF' : '#000000'}
                  placeholderTextColor={isDark ? '#8C8C8C' : '#9CA3AF'}
                />
              </Input>

              <HStack space="sm" mt="$2">
                <Button
                  flex={1}
                  variant="outline"
                  onPress={handleCancelReport}
                  bg={isDark ? '#2A2A2A' : '#F3F4F6'}
                  borderColor={isDark ? '#3A3A3A' : '#E5E7EB'}
                >
                  <ButtonText color={isDark ? '#FFFFFF' : '#000000'}>İptal</ButtonText>
                </Button>
                <Button
                  flex={1}
                  onPress={handleConfirmReport}
                  bg="#BC6BFF"
                  isDisabled={!reportReason || reportReason.trim().length === 0}
                >
                  <ButtonText color="#FFFFFF">Raporla</ButtonText>
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
    </SafeAreaView>
  );
};

SupportMessageDetailScreen.displayName = 'SupportMessageDetailScreen';

export default SupportMessageDetailScreen;
