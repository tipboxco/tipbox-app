import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Alert, Keyboard, StatusBar, Modal, View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  ButtonText,
  Input,
  InputField,
  Pressable,
} from '@gluestack-ui/themed';
import { toImageSource, DEFAULT_USER_AVATAR, toMediaUrl } from '@/src/utils';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MessageDetailHeader from '../components/MessageDetailHeader';
import MessageInput from '../components/MessageInput';
import SupportMessageDetailActionButtons from '../components/SupportMessageDetailActionButtons';
import SupportChatParticipants from '../components/SupportChatParticipants';
import StarRating from '../components/StarRating';
import { useSocket } from '@/src/providers/SocketProvider';
import { useAppStore } from '@/src/store/appStore';
import { useDrawerStore } from '@/src/store/drawerStore';
import { useThreadMessages, useAcceptSupportRequest, useRejectSupportRequest, useCancelSupportRequest, useCloseSupportRequest, useFinalizeSupportRequest, useReportSupportRequest, inboxKeys } from '../api/hooks';
import { apiService } from '@/src/services/ApiService';
import type { GetThreadMessagesResponse } from '../api/messagesApi';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useReportUser, useBlockUser } from '@/src/features/profile/api/hooks';
import { Share, Alert as RNAlert } from 'react-native';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import type { ThreadMessage } from '../api/messagesApi';
import { MessageItem } from '../components/MessageItem';
import { formatMessageTime } from '../utils/messageHelpers';
import { useTranslation } from '@/src/hooks/useTranslation';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';

interface MessageDetailItem {
  id: string;
  text: string;
  timestamp: string;
  sentAt: string; // CRITICAL: Sıralama için ISO timestamp
  isSent: boolean;
  senderId?: string; // ✅ WhatsApp Engine: Mesaj gruplama için gerekli
  senderName?: string;
  senderAvatar?: any;
  type?: 'message' | 'support_request' | 'image';
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
  // Image message fields
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  thumbnailUrl?: string | null | undefined;
  dimensions?: {
    width: number;
    height: number;
  };
  uploadStatus?: 'uploading' | 'uploaded' | 'failed';
  uploadProgress?: number;
  // Message status indicators
  isRead?: boolean; // Mesaj okundu mu?
  readAt?: string; // Okunma zamanı
  // Message deletion status
  isDeleted?: boolean;
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

// ✅ WhatsApp Engine: Yeni mesajı doğru pozisyona ekle (descending order - inverted FlashList için)
const insertMessageInOrder = (
  messages: MessageDetailItem[],
  newMessage: MessageDetailItem
): MessageDetailItem[] => {
  // Eğer mesaj zaten varsa, güncelle
  const existingIndex = messages.findIndex(msg => msg.id === newMessage.id);
  if (existingIndex !== -1) {
    const updated = [...messages];
    updated[existingIndex] = newMessage;
    return updated;
  }
  
  // ✅ WhatsApp Engine: Descending order (en yeni başta, en eski sonda)
  const newSentAt = new Date(newMessage.sentAt).getTime();
  
  // En yeni mesajdan başlayarak kontrol et (descending order için)
  for (let i = 0; i < messages.length; i++) {
    const currentSentAt = new Date(messages[i].sentAt).getTime();
    
    // Yeni mesaj daha yeni ise, buraya ekle
    if (newSentAt > currentSentAt) {
      const updated = [...messages];
      updated.splice(i, 0, newMessage);
      return updated;
    }
  }
  
  // Tüm mesajlardan daha eski veya eşit ise, sona ekle
  return [...messages, newMessage];
};



const SupportMessageDetailScreen: React.FC = () => {
  const { t } = useTranslation('inbox');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SupportMessageDetailScreenNavigationProp>();
  const route = useRoute();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<MessageDetailItem[]>([]);
  const [expandedSupportRequests, setExpandedSupportRequests] = useState<{ [key: string]: boolean }>({});
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [closedByCurrentUser, setClosedByCurrentUser] = useState(false);
  const [isCloseModalVisible, setIsCloseModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState(''); // Dropdown seçimi
  const [reportDescription, setReportDescription] = useState(''); // Text area
  const [showReportReasonDropdown, setShowReportReasonDropdown] = useState(false);
  const [closeModalRating, setCloseModalRating] = useState(0);
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  // CRITICAL: Drawer gesture'ı disable et (input tıklanınca gesture çakışmasını önle)
  const setGestureEnabled = useDrawerStore((state) => state.setGestureEnabled);

  useFocusEffect(
    useCallback(() => {
      // Ekran focus aldığında drawer gesture'ı disable et
      setGestureEnabled(false);
      return () => {
        // Ekran blur olduğunda drawer gesture'ı tekrar enable et
        setGestureEnabled(true);
      };
    }, [setGestureEnabled])
  );
  const acceptMutation = useAcceptSupportRequest();
  const rejectMutation = useRejectSupportRequest();
  const cancelMutation = useCancelSupportRequest();
  const closeMutation = useCloseSupportRequest();
  const finalizeMutation = useFinalizeSupportRequest();
  const reportMutation = useReportSupportRequest();
  const reportUserMutation = useReportUser();
  const blockUserMutation = useBlockUser();

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
  const isMountedRef = useRef(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightRef = useRef(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Seçilen görsel state'i (caption için)
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    type: string;
    name: string;
    fileSize?: number;
  } | null>(null);
  
  // Support request bilgilerini thread mesajlarından al
  const [supportRequestInfo, setSupportRequestInfo] = useState<{
    supportType?: string;
    message?: string;
    amount?: number;
    status?: string;
  } | null>(null);
  
  // ✅ FIX: Support request'ten fromUserId ve toUserId'yi al (header için)
  const [supportRequestUserIds, setSupportRequestUserIds] = useState<{
    fromUserId?: string;
    toUserId?: string;
  }>({});
  
  // ✅ FIX: Backend'den gelen güncel kullanıcı bilgilerini sakla (header için)
  const [participantInfo, setParticipantInfo] = useState<{
    expertName?: string;
    expertTitle?: string;
    expertAvatar?: any;
    userName?: string;
    userTitle?: string;
    userAvatar?: any;
  }>({});

  // Thread mesajlarını yükle (eğer threadId varsa)
  const { data: threadMessages, isLoading: isLoadingMessages, refetch: refetchMessages } = useThreadMessages(threadId || null);
  
  // ✅ FIX: Backend'den participants bilgisini al (header için güncel kullanıcı bilgileri)
  const { data: participantsData } = useQuery<GetThreadMessagesResponse>({
    queryKey: [...inboxKeys.threadMessages(threadId || ''), 'participants'],
    queryFn: async () => {
      if (!threadId) throw new Error('Thread ID is required');
      const response = await apiService.getClient().get<GetThreadMessagesResponse>(`/inbox/${threadId}`);
      return response.data;
    },
    enabled: !!threadId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Thread mesajlarını local state'e dönüştür
  useEffect(() => {
    // ✅ FIX: threadId yoksa mesajları temizleme, sadece return et
    if (!threadId) {
      return;
    }
    
    // ✅ FIX: threadMessages undefined, null veya boş array ise, mevcut mesajları koru (close/finalize sonrası geçici olarak boş gelebilir)
    // Eğer threadMessages undefined/null ise ve mevcut mesajlar varsa, mevcut mesajları koru
    if (!threadMessages && messages.length > 0) {
      console.log('[SupportMessageDetail] ⚠️ ThreadMessages undefined/null ama mevcut mesajlar var, korunuyor');
      return; // Mevcut mesajları koru, hiçbir şey yapma
    }
    
    // ✅ FIX: threadMessages boş array ise ve mevcut mesajlar varsa, mevcut mesajları koru
    if (Array.isArray(threadMessages) && threadMessages.length === 0 && messages.length > 0) {
      console.log('[SupportMessageDetail] ⚠️ ThreadMessages boş array ama mevcut mesajlar var, korunuyor');
      return; // Mevcut mesajları koru, hiçbir şey yapma
    }
    
    // ✅ FIX: Sadece threadMessages varsa ve içinde mesaj varsa işle
    if (threadMessages && Array.isArray(threadMessages) && threadMessages.length > 0) {
      // Support request bilgisini bul (ilk support-request mesajından)
      const supportRequestMsg = threadMessages.find(msg => msg.messageType === 'support-request');
      if (supportRequestMsg) {
        setSupportRequestInfo({
          supportType: supportRequestMsg.supportRequestType || 'GENERAL',
          message: supportRequestMsg.message,
          amount: supportRequestMsg.amount || 0,
          status: supportRequestMsg.supportRequestStatus || 'pending',
        });
        // ✅ FIX: fromUserId ve toUserId'yi kaydet (header için)
        setSupportRequestUserIds({
          fromUserId: supportRequestMsg.fromUserId,
          toUserId: supportRequestMsg.toUserId,
        });
      }
      
      // ✅ FIX: Backend'den gelen participants bilgisini kullan (header için güncel kullanıcı bilgileri)
      // Backend response: { participants: { userOne: {...}, userTwo: {...} } }
      // Birebir field kullan: userOne → userName, userTwo → expertName
      const participants = participantsData?.participants;
      if (participants && 'userOne' in participants && 'userTwo' in participants) {
        const userOne = participants.userOne;
        const userTwo = participants.userTwo;
        
        if (userOne && userTwo) {
          // Backend'den gelen field'ları birebir kullan (fallback yok)
          setParticipantInfo({
            userName: userOne.name,
            userTitle: userOne.title || '',
            userAvatar: userOne.avatar ? toImageSource(userOne.avatar) : undefined,
            expertName: userTwo.name,
            expertTitle: userTwo.title || '',
            expertAvatar: userTwo.avatar ? toImageSource(userTwo.avatar) : undefined,
          });
        }
      } else if (participants && typeof participants === 'object' && participants !== null && !('userOne' in participants)) {
        // Yeni format (userId key'leri ile) - fromUserId ve toUserId'ye göre
        const participantsObj = participants as { [userId: string]: { id: string; name: string; title?: string; avatar: string | null } };
        const fromUserId = supportRequestMsg?.fromUserId;
        const toUserId = supportRequestMsg?.toUserId;
        
        if (fromUserId && toUserId && participantsObj[fromUserId] && participantsObj[toUserId]) {
          const fromUser = participantsObj[fromUserId];
          const toUser = participantsObj[toUserId];
          
          setParticipantInfo({
            userName: fromUser.name,
            userTitle: fromUser.title || '',
            userAvatar: fromUser.avatar ? toImageSource(fromUser.avatar) : undefined,
            expertName: toUser.name,
            expertTitle: toUser.title || '',
            expertAvatar: toUser.avatar ? toImageSource(toUser.avatar) : undefined,
          });
        }
      }
      
      const convertedMessages: MessageDetailItem[] = threadMessages
        .filter(msg => msg.messageType === 'message' || msg.messageType === 'image') // Support thread'de mesajlar ve görseller gösterilir
        .map((msg) => {
          const isSent = msg.senderId === user?.id;
          // Backend'den gelen sender bilgilerini kullan (varsa), yoksa params'dan al
          const senderName = isSent 
            ? undefined 
            : (msg.senderName || params.expertName || t('messageDetail.fallback.unknown'));
          const senderAvatar = isSent 
            ? undefined 
            : (msg.senderAvatar ? toImageSource(msg.senderAvatar) : params.expertAvatar);
          
          // Mesaj tipini belirle
          let messageType: 'message' | 'image' = 'message';
          if (msg.messageType === 'image' || msg.mediaUrl) {
            messageType = 'image';
          }
          
          // ✅ DEBUG: Mesaj parse edilirken log
          if (__DEV__) {
            console.log('[SupportMessageDetail] 📨 Parsing message:', {
              id: msg.id,
              message: msg.message,
              caption: msg.caption,
              messageType: msg.messageType,
            });
          }
          
          return {
            id: msg.id,
            text: msg.message || msg.caption || '', // ✅ FIX: Ana mesajın text'i buradan geliyor
            timestamp: formatMessageTime(msg.sentAt),
            sentAt: msg.sentAt, // CRITICAL: Sıralama için ISO timestamp
            isSent,
            senderId: msg.senderId, // ✅ WhatsApp Engine: Mesaj gruplama için gerekli
            senderName,
            senderAvatar,
            type: messageType,
            // Image message fields
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaUrl ? 'image' : undefined,
            thumbnailUrl: msg.thumbnailUrl,
            dimensions: msg.dimensions,
            isRead: msg.isRead,
            readAt: msg.readAt,
          };
        });
      
      // ✅ FIX: Duplicate kontrolü - Mevcut mesajları koru, sadece yeni mesajları ekle
      setMessages((prev) => {
        // ✅ FIX: Eğer threadMessages boşsa (close/finalize sonrası geçici olarak boş gelebilir), mevcut mesajları koru
        if (convertedMessages.length === 0 && prev.length > 0) {
          console.log('[SupportMessageDetail] ⚠️ ThreadMessages boş ama mevcut mesajlar var, korunuyor');
          return prev; // Mevcut mesajları koru
        }
        
        // Eğer prev boşsa, direkt convertedMessages'ı kullan
        if (prev.length === 0) {
          return convertedMessages;
        }
        
        // Mevcut mesajları koru, yeni mesajları ekle (duplicate önle)
        const existingIds = new Set(prev.map(msg => msg.id));
        const newMessages = convertedMessages.filter(msg => !existingIds.has(msg.id));
        
        if (newMessages.length === 0) {
          // Yeni mesaj yoksa, mevcut mesajları güncelle (isRead gibi field'lar güncellenebilir)
          const updated = prev.map(prevMsg => {
            const convertedMsg = convertedMessages.find(msg => msg.id === prevMsg.id);
            return convertedMsg || prevMsg;
          });
          return updated;
        }
        
        // Yeni mesajları tek tek ekle (insertMessageInOrder her seferinde bir mesaj alır)
        let result = prev;
        newMessages.forEach(newMsg => {
          result = insertMessageInOrder(result, newMsg);
        });
        return result;
      });
      
      // ✅ WhatsApp Engine: Inverted FlatList - Scroll to end (en yeni mesajlar görünür)
      setTimeout(() => {
        if (flatListRef.current && convertedMessages.length > 0) {
          // Inverted FlatList'te scrollToEnd en yeni mesajları gösterir
          flatListRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
    }
    // ✅ FIX: messages dependency'si eklenmedi - sadece threadMessages değiştiğinde çalışmalı
    // messages state'i bu useEffect içinde güncelleniyor, bu yüzden dependency'ye eklememeliyiz (infinite loop önleme)
  }, [threadMessages, threadId, user?.id, params.expertName, params.expertAvatar, participantsData]);

  // Socket bağlantısı ve thread join
  useEffect(() => {
    // Pending request'lerde threadId yok, bu durumda socket kullanılamaz
    if (!threadId) {
      setIsSocketReady(false);
      return;
    }

    if (!isConnected) {
      setIsSocketReady(false);
      return;
    }

    console.log('[SupportMessageDetail] ✅ Socket connected, joining thread:', threadId);
    joinThread(threadId);
    setIsSocketReady(true);

    return () => {
      if (threadId && isConnected) {
        leaveThread(threadId);
      }
      setIsSocketReady(false);
    };
  }, [threadId, isConnected, joinThread, leaveThread]);

  // Thread joined handler
  const handleThreadJoined = useCallback((data: { threadId: string }) => {
    // ✅ Backend iyileştirmesi: GET /inbox/:threadId çağrıldığında backend otomatik olarak
    // tüm okunmamış mesajları isRead: true yapıyor ve thread_read socket event'i gönderiyor.
    // Bu yüzden frontend'de manuel olarak markThreadRead çağırmaya gerek yok.
    // thread_read event'i geldiğinde inbox listesi otomatik güncellenecek.
    if (data.threadId === threadId && isConnected) {
      console.log('[SupportMessageDetail] ✅ Thread joined. Backend automatically marks messages as read when GET /inbox/:threadId is called.');
    }
  }, [threadId, isConnected]);

  // New message handler (hem new_message hem message_sent event'leri için)
  const handleNewMessage = useCallback((eventData: any) => {
    // ✅ DEBUG: Tüm gelen event'leri logla
    if (__DEV__) {
      console.log('[SupportMessageDetail] 📨 Socket event received:', {
        eventType: 'new_message/message_sent',
        threadId: eventData.threadId,
        currentThreadId: threadId,
        messageId: eventData.messageId,
        messageType: eventData.messageType,
        context: eventData.context,
        message: eventData.message,
        senderId: eventData.senderId,
      });
    }
    
    if (!threadId) {
      if (__DEV__) {
        console.log('[SupportMessageDetail] ⚠️ No threadId, ignoring message');
      }
      return;
    }
    
    if (eventData.threadId !== threadId) {
      if (__DEV__) {
        console.log('[SupportMessageDetail] ⚠️ Thread ID mismatch, ignoring message:', {
          eventThreadId: eventData.threadId,
          currentThreadId: threadId,
        });
      }
      return;
    }

    // Normal mesaj veya image/video/audio/file mesajı
    // context === 'SUPPORT' kontrolü yapılıyor, ama backend'den gelen mesajlarda context olmayabilir
    // Bu yüzden context kontrolünü kaldırıyoruz veya opsiyonel yapıyoruz
    if (eventData.messageType === 'message' || 
        eventData.messageType === 'image' || 
        eventData.messageType === 'video' || 
        eventData.messageType === 'audio' || 
        eventData.messageType === 'file') {
      
      if (__DEV__) {
        console.log('[SupportMessageDetail] ✅ Processing message for support thread');
      }
      
      const isSent = eventData.senderId === user?.id;
      const messageType: 'message' | 'image' = eventData.messageType === 'image' ? 'image' : 'message';
      const newMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: eventData.message || eventData.caption || '',
        timestamp: formatMessageTime(eventData.timestamp || eventData.sentAt),
        sentAt: eventData.timestamp || eventData.sentAt || new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
        isSent,
        senderId: eventData.senderId, // ✅ WhatsApp Engine: Mesaj gruplama için gerekli
        senderName: isSent ? undefined : params.expertName,
        senderAvatar: isSent ? undefined : params.expertAvatar,
        type: messageType,
        mediaUrl: eventData.mediaUrl,
        mediaType: eventData.messageType === 'image' || eventData.messageType === 'video' || eventData.messageType === 'audio' || eventData.messageType === 'file' 
          ? eventData.messageType 
          : undefined,
        thumbnailUrl: eventData.thumbnailUrl,
        dimensions: eventData.dimensions,
        isRead: false,
      };

      setMessages((prev) => {
        // ✅ FIX: Duplicate kontrolü - Eğer mesaj zaten varsa, güncelle
        const existingIndex = prev.findIndex((msg) => msg.id === eventData.messageId);
        if (existingIndex !== -1) {
          // Mesaj zaten varsa, güncelle (duplicate önle)
          const updated = [...prev];
          updated[existingIndex] = newMessage;
          return updated;
        }
        
        // ✅ FIX: Optimistic mesajları gerçek mesajla değiştir (hem text hem image için)
        const optimisticIndex = prev.findIndex(
          (msg) => 
            (msg.id.startsWith('pending-') || msg.id.startsWith('pending-image-')) && 
            msg.isSent === isSent &&
            (messageType === 'image' ? msg.type === 'image' : msg.type === 'message' || !msg.type)
        );
        
        if (optimisticIndex !== -1) {
          // Optimistic mesajı gerçek mesajla değiştir
          const updated = [...prev];
          updated[optimisticIndex] = newMessage;
          // ✅ FIX: insertMessageInOrder ile doğru pozisyona taşı
          return insertMessageInOrder(updated.filter((_, idx) => idx !== optimisticIndex), newMessage);
        }
        
        // Yeni mesaj - doğru pozisyona ekle
        return insertMessageInOrder(prev, newMessage);
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
    
    // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
    
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
    
    // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
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
    
    // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
  }, [queryClient]);

  // Support request closed handler (awaiting_completion durumuna geçer)
  const handleSupportRequestClosed = useCallback((data: { requestId: string; timestamp?: string }) => {
    console.log('[SupportMessageDetail] ✅ Support request closed event (awaiting_completion):', data);
    
    // Local state'te support request'i awaiting_completion olarak güncelle
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
          return {
            ...msg,
            supportRequest: {
              ...msg.supportRequest,
              status: 'awaiting_completion',
            },
          };
        }
        return msg;
      })
    );
    
    // Navigation params'ı güncelle (awaiting_completion status'e çek)
    navigation.setParams({ status: 'awaiting_completion' });
    
    // Local state'te support request status'ünü güncelle
    setSupportRequestInfo((prev) => {
      if (prev) {
        return {
          ...prev,
          status: 'awaiting_completion',
        };
      }
      return prev;
    });
    
    // ✅ CRITICAL FIX: Sadece supportRequests'i invalidate et (messages invalidate etme - threadMessages kaybolmasın)
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    
    // ✅ Optimistic update - SupportRequestsScreen'deki listeyi anında güncelle
    queryClient.setQueryData(inboxKeys.supportRequests(), (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;
      
      return oldData.map((request: any) => {
        if (request.id === data.requestId) {
          return {
            ...request,
            status: 'awaiting_completion',
          };
        }
        return request;
      });
    });
  }, [queryClient, navigation]);

  // Support request finalized handler (completed durumuna geçer - diğer taraf finalize ettiğinde)
  const handleSupportRequestFinalized = useCallback((data: { requestId: string; timestamp?: string }) => {
    console.log('[SupportMessageDetail] ✅ Support request finalized event (completed):', data);

    // Navigation params'ı güncelle (completed status'e çek)
    navigation.setParams({ status: 'completed' });

    // Local state'te support request status'ünü güncelle
    setSupportRequestInfo((prev) => {
      if (prev) {
        return {
          ...prev,
          status: 'completed',
        };
      }
      return prev;
    });

    // Mesajlar state'inde support request mesajının status'ünü güncelle
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type === 'support_request' && msg.supportRequest?.requestId === data.requestId) {
          return {
            ...msg,
            supportRequest: {
              ...msg.supportRequest,
              status: 'completed',
            },
          };
        }
        return msg;
      })
    );

    // Sadece supportRequests'i invalidate et
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });

    // Optimistic update - SupportRequestsScreen'deki listeyi anında güncelle
    queryClient.setQueryData(inboxKeys.supportRequests(), (oldData: any) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;

      return oldData.map((request: any) => {
        if (request.id === data.requestId) {
          return {
            ...request,
            status: 'completed',
          };
        }
        return request;
      });
    });
  }, [queryClient, navigation]);

  // ✅ WhatsApp Engine: Güvenli scroll helper - Inverted FlatList için scrollToEnd kullan
  const safeScrollToEnd = useCallback((animated: boolean = true) => {
    // Component unmount olduysa scroll yapma
    if (!isMountedRef.current) {
      return;
    }

    try {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated });
      }
    } catch (error) {
      try {
        flatListRef.current?.scrollToOffset({ offset: 0, animated });
      } catch (offsetError) {
        // Sessizce yakala
      }
    }
  }, []);

  // Klavye event listener'ları - scroll ve buton pozisyonu için
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const height = event.endCoordinates.height;
        setKeyboardHeight(height);
        keyboardHeightRef.current = height;
        setIsKeyboardVisible(true);
        console.log('[SupportMessageDetail] ⌨️ Keyboard opened, height:', height);
        
        // ✅ Inverted FlatList - Klavye açıldığında en yeni mesaja scroll yap
        setTimeout(() => {
          safeScrollToEnd(true);
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        keyboardHeightRef.current = 0;
        setIsKeyboardVisible(false);
        console.log('[SupportMessageDetail] ⌨️ Keyboard closed');
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [safeScrollToEnd]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    on('thread_joined', handleThreadJoined);
    on('new_message', handleNewMessage);
    on('message_sent', handleNewMessage); // ✅ FIX: message_sent event'ini de dinle (backend'den gelen mesajlar için)
    on('user_typing', handleUserTyping);
    on('support_request_accepted', handleSupportRequestAccepted);
    on('support_request_rejected', handleSupportRequestRejected);
    on('support_request_cancelled', handleSupportRequestCancelled);
    on('support_request_closed', handleSupportRequestClosed); // ✅ FIX: Close request event'ini dinle (awaiting_completion)
    on('support_request_finalized', handleSupportRequestFinalized); // ✅ Finalize event'ini dinle (completed)

    return () => {
      off('thread_joined', handleThreadJoined);
      off('new_message', handleNewMessage);
      off('message_sent', handleNewMessage); // ✅ FIX: message_sent event listener'ını temizle
      off('user_typing', handleUserTyping);
      off('support_request_accepted', handleSupportRequestAccepted);
      off('support_request_rejected', handleSupportRequestRejected);
      off('support_request_cancelled', handleSupportRequestCancelled);
      off('support_request_closed', handleSupportRequestClosed); // ✅ FIX: Close request event listener'ını temizle
      off('support_request_finalized', handleSupportRequestFinalized); // ✅ Finalize event listener'ını temizle

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (threadId && isConnected) {
        socketStopTyping(threadId);
      }

      // Component unmount olduğunu işaretle
      isMountedRef.current = false;
    };
  }, [isConnected, threadId, on, off, handleThreadJoined, handleNewMessage, handleUserTyping, handleSupportRequestAccepted, handleSupportRequestRejected, handleSupportRequestCancelled, handleSupportRequestFinalized, socketStopTyping]);

  // Yeni mesaj gönderme
  const handleSendMessage = (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Pending request'lerde threadId yok, mesaj gönderilemez
    if (!threadId) {
      Alert.alert(
        t('supportMessageDetail.alerts.cannotSendMessage'),
        t('supportMessageDetail.alerts.pendingNotAccepted')
      );
      return;
    }

    // Optimistic update
    const optimisticMessageId = `pending-${Date.now()}`;
    const now = new Date();
    const newMessage: MessageDetailItem = {
      id: optimisticMessageId,
      text: messageText.trim(),
      timestamp: formatMessageTime(now),
      sentAt: now.toISOString(), // CRITICAL: Sıralama için ISO timestamp
      isSent: true,
      senderId: user?.id, // ✅ WhatsApp Engine: Mesaj gruplama için gerekli
      isRead: false,
    };

    setMessages((prev) => insertMessageInOrder(prev, newMessage));

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Socket ile mesaj gönder
    if (isConnected && isSocketReady && threadId) {
      try {
        socketSendSupportMessage(threadId, messageText.trim());
      } catch (error) {
        console.error('[SupportMessageDetail] Socket send error:', error);
        Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.failedToSendMessage'));
        // Optimistic mesajı geri al
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessageId));
      }
    } else {
      // Socket bağlantısı yoksa veya threadId yoksa
      const errorMessage = !threadId
        ? t('supportMessageDetail.alerts.threadIdNotFoundMessage')
        : !isConnected
        ? t('supportMessageDetail.alerts.socketNotAvailable')
        : t('supportMessageDetail.alerts.socketNotReady');

      Alert.alert(t('supportMessageDetail.alerts.cannotSendMessage'), errorMessage);
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
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.requestIdNotFound'));
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
          Alert.alert(t('common:labels.success'), t('supportMessageDetail.success.requestAccepted'));
          // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
          queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
          queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
          // Eğer bu ekrandaki request ise, threadId'yi güncelle
          if (targetRequestId === requestId) {
            navigation.setParams({ threadId: data.threadId, status: 'active' });
          }
        },
        onError: (error: any) => {
          console.error('[SupportMessageDetail] ❌ Support request accept error:', error);
          Alert.alert(t('common:labels.error'), error.message || t('supportMessageDetail.errors.errorAcceptingRequest'));
        },
      });
    }
  };

  // Reject support request
  const handleRejectRequest = (rejectRequestId?: string) => {
    const targetRequestId = rejectRequestId || requestId;
    if (!targetRequestId) {
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.requestIdNotFound'));
      return;
    }

    Alert.alert(
      t('supportMessageDetail.alerts.rejectTitle'),
      t('supportMessageDetail.alerts.rejectMessage'),
      [
        { text: t('supportMessageDetail.buttons.cancel'), style: 'cancel' },
        {
          text: t('supportMessageDetail.buttons.reject'),
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
                  Alert.alert(t('common:labels.success'), t('supportMessageDetail.success.requestRejected'));
                  // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
                  queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
                  queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
                  queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
                  // Eğer bu ekrandaki request ise, geri dön
                  if (targetRequestId === requestId) {
                    navigation.goBack();
                  }
                },
                onError: (error: any) => {
                  console.error('[SupportMessageDetail] ❌ Support request reject error:', error);
                  Alert.alert(t('common:labels.error'), error.message || t('supportMessageDetail.errors.errorRejectingRequest'));
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
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.requestIdNotFound'));
      return;
    }

    Alert.alert(
      t('supportMessageDetail.alerts.cancelTitle'),
      t('supportMessageDetail.alerts.cancelMessage'),
      [
        { text: t('supportMessageDetail.buttons.cancel'), style: 'cancel' },
        {
          text: t('supportMessageDetail.buttons.cancel'),
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
                  Alert.alert(t('common:labels.success'), t('supportMessageDetail.success.requestCancelled'));
                  // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
                  queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
                  queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
                  queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
                  // Eğer bu ekrandaki request ise, geri dön
                  if (targetRequestId === requestId) {
                    navigation.goBack();
                  }
                },
                onError: (error: any) => {
                  console.error('[SupportMessageDetail] ❌ Support request cancel error:', error);
                  Alert.alert(t('common:labels.error'), error.message || t('supportMessageDetail.errors.errorCancellingRequest'));
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

  // ✅ FIX: Modal'ın close mu finalize mi olduğunu takip et
  const [isFinalizeModal, setIsFinalizeModal] = useState(false);

  // Handle close support request button press
  const handleCloseRequest = () => {
    setIsFinalizeModal(false);
    setIsCloseModalVisible(true);
  };

  // ✅ FIX: Handle finalize support request button press
  const handleFinalizeRequest = () => {
    setIsFinalizeModal(true);
    setIsCloseModalVisible(true);
  };

  // Handle confirm close request
  const handleConfirmClose = (rating: number) => {
    if (!requestId) {
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.requestIdNotFound'));
      return;
    }

    // ✅ FIX: Eğer finalize modal'ı açıksa, finalize işlemi yap
    if (isFinalizeModal) {
      console.log('[SupportMessageDetail] Finalizing support request with rating:', rating);
      
      finalizeMutation.mutate(
        {
          requestId: requestId,
          data: {
            rating: rating,
            comment: undefined, // Opsiyonel yorum eklenebilir
          },
        },
        {
          onSuccess: () => {
            console.log('[SupportMessageDetail] ✅ Support request finalized successfully');
            Alert.alert(t('common:labels.success'), t('supportMessageDetail.success.requestFinalized'));
            setCloseModalRating(0); // Reset rating
            setIsCloseModalVisible(false);
            setIsFinalizeModal(false);
            
            // ✅ FIX: Sadece supportRequests'i invalidate et (messages invalidate etme - threadMessages kaybolmasın)
            queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
            // ❌ messages invalidate etme - threadMessages query'si etkilenmesin, mesajlar görünmeye devam etsin
            
            // ✅ FIX: Optimistic update - Request'i completed status'e çek
            queryClient.setQueryData(inboxKeys.supportRequests(), (oldData: any) => {
              if (!oldData || !Array.isArray(oldData)) return oldData;
              
              return oldData.map((request: any) => {
                if (request.id === requestId) {
                  return {
                    ...request,
                    status: 'completed', // ✅ Finalize yapıldığında completed olur
                  };
                }
                return request;
              });
            });
            
            // ✅ FIX: Navigation params'ı güncelle (completed status'e çek)
            navigation.setParams({ status: 'completed' });
            
            // ✅ FIX: Local state'te support request status'ünü güncelle (mesajlar görünmeye devam etsin)
            setSupportRequestInfo((prev) => {
              if (prev) {
                return {
                  ...prev,
                  status: 'completed',
                };
              }
              return prev;
            });
            
            // ✅ FIX: Mesajlar state'inde support request mesajının status'ünü güncelle
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.type === 'support_request' && msg.supportRequest?.requestId === requestId) {
                  return {
                    ...msg,
                    supportRequest: {
                      ...msg.supportRequest,
                      status: 'completed',
                    },
                  };
                }
                return msg;
              })
            );
            
            // ✅ FIX: Finalize sonrası ekran kapanmamalı - completed durumunda mesajlar görüntülenebilir
            // navigation.goBack() kaldırıldı
          },
          onError: (error: any) => {
            console.error('[SupportMessageDetail] ❌ Finalize support request error:', error);
            Alert.alert(t('common:labels.error'), error.response?.data?.error || error.message || t('supportMessageDetail.errors.errorFinalizingSupport'));
          },
        }
      );
      return;
    }

    // Normal close işlemi
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
          Alert.alert(t('common:labels.success'), t('supportMessageDetail.success.requestClosed'));
          setCloseModalRating(0); // Reset rating
          setIsCloseModalVisible(false);
          setIsFinalizeModal(false);
          setClosedByCurrentUser(true); // ✅ Track that current user initiated the close

          // ✅ FIX: Sadece supportRequests'i invalidate et (messages invalidate etme - threadMessages kaybolmasın)
          // Bu sayede SupportRequestsScreen otomatik olarak güncellenecek
          queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
          // ❌ messages invalidate etme - threadMessages query'si etkilenmesin, mesajlar görünmeye devam etsin

          // ✅ FIX: Optimistic update - SupportRequestsScreen'deki listeyi anında güncelle
          // Request'i awaiting_completion status'e çek (close yapıldığında awaiting_completion olur)
          queryClient.setQueryData(inboxKeys.supportRequests(), (oldData: any) => {
            if (!oldData || !Array.isArray(oldData)) return oldData;
            
            return oldData.map((request: any) => {
              if (request.id === requestId) {
                return {
                  ...request,
                  status: 'awaiting_completion', // ✅ FIX: Close yapıldığında awaiting_completion olur
                };
              }
              return request;
            });
          });
          
          // ✅ FIX: Navigation params'ı güncelle (awaiting_completion status'e çek)
          navigation.setParams({ status: 'awaiting_completion' });
          
          // ✅ FIX: Local state'te support request status'ünü güncelle (mesajlar görünmeye devam etsin)
          setSupportRequestInfo((prev) => {
            if (prev) {
              return {
                ...prev,
                status: 'awaiting_completion',
              };
            }
            return prev;
          });
          
          // ✅ FIX: Mesajlar state'inde support request mesajının status'ünü güncelle
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.type === 'support_request' && msg.supportRequest?.requestId === requestId) {
                return {
                  ...msg,
                  supportRequest: {
                    ...msg.supportRequest,
                    status: 'awaiting_completion',
                  },
                };
              }
              return msg;
            })
          );
          
          // ✅ FIX: Ekran kapanmamalı - awaiting_completion durumunda finalize butonu gösterilecek
          // navigation.goBack() kaldırıldı
        },
        onError: (error: any) => {
          console.error('[SupportMessageDetail] ❌ Close support request error:', error);
          Alert.alert(t('common:labels.error'), error.response?.data?.error || error.message || t('supportMessageDetail.errors.errorClosingSupport'));
        },
      }
    );
  };

  // Handle cancel close request
  const handleCancelClose = () => {
    setCloseModalRating(0); // Reset rating
    setIsCloseModalVisible(false);
    setIsFinalizeModal(false);
  };

  // Handle report button press
  const handleReport = () => {
    setIsReportModalVisible(true);
    setReportReason('');
    setReportDescription('');
    setShowReportReasonDropdown(false);
  };

  // Handle cancel report
  const handleCancelReport = () => {
    setIsReportModalVisible(false);
    setReportReason('');
    setReportDescription('');
    setShowReportReasonDropdown(false);
  };

  // Rapor sebepleri
  const reportReasons: Array<'SPAM' | 'INAPPROPRIATE' | 'HARASSMENT' | 'SCAM' | 'OTHER'> = [
    'SPAM',
    'INAPPROPRIATE',
    'HARASSMENT',
    'SCAM',
    'OTHER',
  ];

  const getReportReasonLabel = (reason: 'SPAM' | 'INAPPROPRIATE' | 'HARASSMENT' | 'SCAM' | 'OTHER' | '') => {
    switch (reason) {
      case 'SPAM':
        return t('supportMessageDetail.reportModal.reasons.spam');
      case 'INAPPROPRIATE':
        return t('supportMessageDetail.reportModal.reasons.inappropriate');
      case 'HARASSMENT':
        return t('supportMessageDetail.reportModal.reasons.harassment');
      case 'SCAM':
        return t('supportMessageDetail.reportModal.reasons.scam');
      case 'OTHER':
        return t('supportMessageDetail.reportModal.reasons.other');
      default:
        return t('supportMessageDetail.reportModal.reasonPlaceholder');
    }
  };

  // Handle confirm report
  const handleConfirmReport = () => {
    if (!requestId) {
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.requestIdNotFound'));
      return;
    }

    if (!reportReason || reportReason.trim().length === 0) {
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.reportReasonRequired'));
      return;
    }

    console.log('[SupportMessageDetail] Reporting support request:', { reason: reportReason, description: reportDescription });
    
    reportMutation.mutate(
      {
        requestId: requestId,
        data: {
          reason: reportReason.trim(),
          description: reportDescription.trim() || undefined, // Opsiyonel açıklama
        },
      },
      {
        onSuccess: () => {
          console.log('[SupportMessageDetail] ✅ Support request reported successfully');
          Alert.alert(t('common:labels.success'), t('supportMessageDetail.success.requestReported'));
          setIsReportModalVisible(false);
          setReportReason('');
          setReportDescription('');
          setShowReportReasonDropdown(false);
          
          // Inbox listesini invalidate et
          queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
          
          // Geri dön
          navigation.goBack();
        },
        onError: (error: any) => {
          console.error('[SupportMessageDetail] ❌ Report support request error:', error);
          Alert.alert(t('common:labels.error'), error.response?.data?.error || error.message || t('supportMessageDetail.errors.errorReportingUser'));
        },
      }
    );
  };

  // Format message time helper
  const formatMessageTime = (timestamp: string | Date): string => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  // Handle Add Image - Galeriyi aç ve görseli seç (caption için)
  const handleAddImage = useCallback(async () => {
    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        console.log('[SupportMessageDetail] 📷 Image selected:', result.asset.uri);
        
        // File extension ve mime type belirle
        let fileExtension = 'jpg';
        let mimeType = 'image/jpeg';
        const uriLower = result.asset.uri.toLowerCase();
        if (uriLower.includes('.')) {
          const ext = result.asset.uri.split('.').pop()?.toLowerCase();
          if (ext === 'png') {
            fileExtension = 'png';
            mimeType = 'image/png';
          } else if (ext === 'jpg' || ext === 'jpeg') {
            fileExtension = 'jpg';
            mimeType = 'image/jpeg';
          }
        }
        
        // Görseli state'e kaydet (caption için)
        setSelectedImage({
          uri: result.asset.uri,
          type: mimeType,
          name: `image_${Date.now()}.${fileExtension}`,
          fileSize: result.asset.fileSize,
        });
      } else {
        if (result.error) {
          Alert.alert(t('common:labels.error'), typeof result.error === 'string' ? result.error : t('supportMessageDetail.errors.errorSelectingImage'));
        }
      }
    } catch (error: any) {
      console.error('[SupportMessageDetail] ❌ Image picker error:', error);
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.errorSelectingImage'));
    }
  }, []);
  
  // Handle Send Image - Görsel + caption gönder
  const handleSendImage = useCallback(async (image: { uri: string; type: string; name: string; fileSize?: number }, caption: string) => {
    if (!threadId) {
      Alert.alert(t('common:labels.error'), t('supportMessageDetail.errors.threadIdNotFound'));
      return;
    }

    try {
      // Görseli FormData ile backend'e gönder
      const formData = new FormData();
      
      // FormData'ya görseli ekle
      formData.append('media', {
        uri: image.uri,
        type: image.type,
        name: image.name,
      } as any);
      formData.append('mediaType', 'image');
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      if (image.fileSize) {
        formData.append('fileSize', image.fileSize.toString());
      }
        
      // Optimistic update: Görsel mesajını anında local state'e ekle
      const optimisticMessageId = `pending-image-${Date.now()}`;
      const now = new Date();
      const optimisticImageMessage: MessageDetailItem = {
        id: optimisticMessageId,
        text: caption.trim() || '',
        timestamp: formatMessageTime(now),
        sentAt: now.toISOString(), // CRITICAL: Sıralama için ISO timestamp
        isSent: true,
        senderId: user?.id, // ✅ WhatsApp Engine: Mesaj gruplama için gerekli
        type: 'image',
        mediaUrl: image.uri,
        mediaType: 'image',
        uploadStatus: 'uploading',
        uploadProgress: 0,
        isRead: false,
      };
      
      setMessages((prev) => insertMessageInOrder(prev, optimisticImageMessage));
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Seçilen görseli temizle
      setSelectedImage(null);
      
      // Backend'e görseli yükle
      const apiClient = (await import('@/src/services/ApiService')).apiService.getClient();
      const response = await apiClient.post(`/inbox/threads/${threadId}/media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === optimisticMessageId
                  ? { ...msg, uploadProgress: progress }
                  : msg
              )
            );
          }
        },
      });
      
      // Optimistic mesajı gerçek mesajla değiştir
      if (response.data.messageId) {
        setMessages((prev) => {
          // Optimistic mesajı bul
          const optimisticIndex = prev.findIndex(msg => msg.id === optimisticMessageId);
          if (optimisticIndex === -1) {
            // Optimistic mesaj bulunamadı, yeni mesaj ekle
            const backendCaption = response.data.caption || caption.trim() || '';
            const newMessage: MessageDetailItem = {
              id: response.data.messageId,
              text: backendCaption,
              timestamp: formatMessageTime(new Date()),
              sentAt: new Date().toISOString(),
              isSent: true,
              senderId: user?.id,
              type: 'image',
              mediaUrl: response.data.mediaUrl,
              mediaType: 'image',
              thumbnailUrl: response.data.thumbnailUrl,
              uploadStatus: 'uploaded',
              uploadProgress: 100,
              isRead: false,
            };
            return insertMessageInOrder(prev, newMessage);
          }
          
          // Optimistic mesajı gerçek mesajla değiştir
          const backendCaption = response.data.caption || caption.trim() || '';
          const updated = [...prev];
          updated[optimisticIndex] = {
            ...updated[optimisticIndex],
            id: response.data.messageId,
            text: backendCaption,
            mediaUrl: response.data.mediaUrl,
            thumbnailUrl: response.data.thumbnailUrl,
            uploadStatus: 'uploaded',
            uploadProgress: 100,
          };
          // ✅ FIX: insertMessageInOrder ile doğru pozisyona taşı
          return insertMessageInOrder(updated.filter((_, idx) => idx !== optimisticIndex), updated[optimisticIndex]);
        });
      }
      
      // Debug: Backend'den gelen ve çözümlenmiş URL'leri kontrol et
      console.log('[SupportMessageDetail] ✅ Image uploaded successfully:', {
        originalMediaUrl: response.data.mediaUrl,
        resolvedMediaUrl: toMediaUrl(response.data.mediaUrl),
        thumbnailUrl: response.data.thumbnailUrl,
        messageId: response.data.messageId,
      });
    } catch (error: any) {
      console.error('[SupportMessageDetail] ❌ Image upload error:', error);
      
      // ✅ FIX: Optimistic mesajı direkt kaldır (failed olarak işaretlemek yerine)
      // Gönderilemeyen mesajlar ekranda görünmemeli
      setMessages((prev) =>
        prev.filter((msg) => !msg.id.startsWith('pending-image-'))
      );
      
      // Seçilen görseli geri yükle (hata durumunda)
      setSelectedImage(image);
      
      Alert.alert(t('common:labels.error'), error.response?.data?.error || error.message || t('supportMessageDetail.errors.errorUploadingImage'));
    }
  }, [threadId, user?.id, params.status]);

  // Mesaj öğesi render fonksiyonu
  const renderMessageItem = ({ item, index }: { item: MessageDetailItem; index: number }) => {
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
          py="$1"
        >
          <Box minWidth={250} maxWidth="85%">
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
                    fontSize={14}
                    fontWeight="$semibold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                  >
                    {t('supportRequest.statusLabels.created')}
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
                      fontSize={11}
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      {t('supportRequest.labels.supportType')}
                    </Text>
                    <Text
                      fontSize={13}
                      fontWeight="$semibold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.supportType}
                    </Text>
                  </VStack>

                  {/* Message */}
                  <VStack space="xs">
                    <Text
                      fontSize={11}
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      {t('supportRequest.labels.requestDetails')}
                    </Text>
                    <Text
                      fontSize={12}
                      fontWeight="$normal"
                      color={isDark ? '#CCCCCC' : '#666666'}
                      lineHeight={16}
                    >
                      {item.supportRequest.message}
                    </Text>
                  </VStack>

                  {/* TIPS Amount */}
                  <HStack space="xs" alignItems="center">
                    <Feather
                      name="award"
                      size={16}
                      color="#E2FF46"
                    />
                    <Text
                      fontSize={15}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.amount} TIPS
                    </Text>
                  </HStack>

                  {/* Status Badge */}
                  <VStack space="xs" mt="$2">
                    <Text
                      fontSize={11}
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      {t('supportRequest.labels.status')}
                    </Text>
                    <Box
                      bg={
                        requestStatus === 'pending' ? (isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)') :
                        requestStatus === 'accepted' ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)') :
                        requestStatus === 'rejected' ? (isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)') :
                        requestStatus === 'canceled' ? (isDark ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)') :
                        requestStatus === 'awaiting_completion' ? (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') :
                        requestStatus === 'completed' ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)') :
                        (isDark ? '#2A2A2A' : '#E5E5E5')
                      }
                      borderRadius={8}
                      px="$2"
                      py="$1"
                      alignSelf="flex-start"
                    >
                      <Text
                        fontSize={12}
                        fontWeight="$semibold"
                        color={
                          requestStatus === 'pending' ? '#FFC107' :
                          requestStatus === 'accepted' ? '#4CAF50' :
                          requestStatus === 'rejected' ? '#F44336' :
                          requestStatus === 'canceled' ? '#9E9E9E' :
                          requestStatus === 'awaiting_completion' ? '#6366F1' :
                          requestStatus === 'completed' ? '#4CAF50' :
                          (isDark ? '#FFFFFF' : '#000000')
                        }
                        textTransform="capitalize"
                      >
                        {t(`supportRequest.statusBadges.${requestStatus === 'awaiting_completion' ? 'awaitingCompletion' : requestStatus}` as any, { defaultValue: requestStatus })}
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
                            <ButtonText color="#FFFFFF" fontSize={14} fontWeight="$semibold">
                              {t('supportRequest.buttons.cancelRequest')}
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
                            <ButtonText color="#FFFFFF" fontSize={14} fontWeight="$semibold">
                              {t('supportRequest.buttons.accept')}
                            </ButtonText>
                          </Button>
                          <Button
                            onPress={() => handleRejectRequest(requestId)}
                            bg={isDark ? '#F44336' : '#F44336'}
                            borderRadius={8}
                            py="$2"
                            flex={1}
                          >
                            <ButtonText color="#FFFFFF" fontSize={14} fontWeight="$semibold">
                              {t('supportRequest.buttons.reject')}
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
                        {t('supportRequest.statusMessages.acceptedActive')}
                      </Text>
                    </VStack>
                  )}

                  {/* ✅ FIX: Awaiting Completion - Finalize butonu (support request mesaj item'ında) */}
                  {requestStatus === 'awaiting_completion' && (
                    <VStack space="sm" mt="$3">
                      <Text
                        fontSize={10}
                        fontWeight="$normal"
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontStyle="italic"
                        mb="$2"
                      >
                        {t('supportRequest.statusMessages.awaitingCompletion')}
                      </Text>
                      <Button
                        onPress={handleFinalizeRequest}
                        bg={isDark ? '#6366F1' : '#6366F1'}
                        borderRadius={8}
                        py="$2"
                      >
                        <ButtonText color="#FFFFFF" fontSize={12} fontWeight="$semibold">
                          {t('supportRequest.buttons.finalize')}
                        </ButtonText>
                      </Button>
                    </VStack>
                  )}

                  {/* ✅ FIX: Completed - Sadece bilgi mesajı */}
                  {requestStatus === 'completed' && (
                    <VStack space="sm" mt="$3">
                      <Text
                        fontSize={10}
                        fontWeight="$normal"
                        color={isDark ? '#4CAF50' : '#4CAF50'}
                        fontStyle="italic"
                      >
                        {t('supportRequest.statusMessages.completed')}
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
                  ? t('supportMessageDetail.status.pendingAutoClose')
                  : requestStatus === 'accepted'
                  ? t('supportMessageDetail.status.accepted')
                  : requestStatus === 'rejected'
                  ? t('supportMessageDetail.status.rejected')
                  : requestStatus === 'canceled'
                  ? t('supportMessageDetail.status.canceled')
                  : t('supportMessageDetail.status.statusPrefix', { status: requestStatus })
                }
              </Text>
            </HStack>

            {/* Timestamp below */}
            <HStack
              space="xs"
              alignItems="center"
              mt={2}
              alignSelf={isSent ? 'flex-end' : 'flex-start'}
            >
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize={10}
                fontWeight="$normal"
              >
                {formatMessageTime(item.timestamp)}
              </Text>
              {isSent && (
                <View style={{ width: 16, height: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {item.isRead ? (
                    <>
                      <Feather
                        name="check"
                        size={12}
                        color="#4CAF50"
                        style={{ position: 'absolute', left: 0, top: 0 }}
                      />
                      <Feather
                        name="check"
                        size={12}
                        color="#4CAF50"
                        style={{ position: 'absolute', left: 4, top: 0 }}
                      />
                    </>
                  ) : (
                    <Feather
                      name="check"
                      size={11}
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    />
                  )}
                </View>
              )}
            </HStack>
          </Box>
        </VStack>
      );
    }

    // Normal mesaj render'ı - MessageItem component'ini kullan
    return (
      <MessageItem
        item={item}
        index={index}
        messages={messages}
        isDark={isDark}
        params={{
          senderName: params.expertName || t('messageDetail.fallback.unknown'),
          senderTitle: params.expertTitle || '',
          senderAvatar: params.expertAvatar,
        }}
        onContextMenuStateChange={(isOpen) => {
          setIsContextMenuOpen(isOpen);
        }}
        currentUserId={user?.id}
      />
    );
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Top inset view - Status bar için */}
      <Box 
        height={insets.top} 
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      />
      
      {/* Header */}
      <MessageDetailHeader
        senderName={params.expertName || t('supportRequest.title')}
        senderTitle={params.expertTitle || ''}
        senderAvatar={params.expertAvatar}
        onBackPress={() => navigation.goBack()}
        onAvatarPress={params.recipientUserId ? () => {
          navigationService.navigate(ROOT_ROUTES.PROFILE as any, {
            screen: 'ProfileMain',
            params: { userId: params.recipientUserId },
          });
        } : undefined}
        onMenuPress={() => {}}
        onShare={async () => {
          if (!params.userName) return;
          try {
            await Share.share({
              message: t('supportMessageDetail.alerts.shareMessage', { userName: params.userName || '' }),
              url: `tipboxapp://profile/user/${params.recipientUserId || ''}`,
            });
          } catch (error) {
            console.error('[SupportMessageDetail] Share error:', error);
          }
        }}
        onReport={() => {
          if (!user?.id || !params.recipientUserId) return;
          RNAlert.alert(
            t('supportMessageDetail.alerts.reportUserTitle'),
            t('supportMessageDetail.alerts.reportUserMessage'),
            [
              { text: t('supportMessageDetail.buttons.cancel'), style: 'cancel' },
              {
                text: t('supportMessageDetail.buttons.report'),
                style: 'destructive',
                onPress: () => {
                  reportUserMutation.mutate({
                    userId: user.id,
                    targetUserId: params.recipientUserId!,
                    data: { category: 'OTHER', description: 'User reported from support message detail' },
                  }, {
                    onSuccess: () => RNAlert.alert(t('common:labels.success'), t('supportMessageDetail.success.userReported')),
                    onError: (error) => RNAlert.alert(t('common:labels.error'), error.message || t('supportMessageDetail.errors.errorReportingUser')),
                  });
                },
              },
            ]
          );
        }}
        onBlock={() => {
          if (!user?.id || !params.recipientUserId) return;
          RNAlert.alert(
            t('supportMessageDetail.alerts.blockUserTitle'),
            t('supportMessageDetail.alerts.blockUserMessage', { userName: params.userName || t('messageDetail.fallback.unknown') }),
            [
              { text: t('supportMessageDetail.buttons.cancel'), style: 'cancel' },
              {
                text: t('supportMessageDetail.buttons.block'),
                style: 'destructive',
                onPress: () => {
                  blockUserMutation.mutate({
                    userId: user.id,
                    targetUserId: params.recipientUserId!,
                  }, {
                    onSuccess: () => {
                      RNAlert.alert(t('common:labels.success'), t('supportMessageDetail.success.userBlocked'), [
                        { text: t('common:buttons.ok'), onPress: () => navigation.goBack() },
                      ]);
                    },
                    onError: (error) => RNAlert.alert(t('common:labels.error'), error.message || t('supportMessageDetail.errors.errorBlockingUser')),
                  });
                },
              },
            ]
          );
        }}
        recipientUserId={params.recipientUserId}
      />

      {/* Support Chat Participants - Header'ın altında, FlatList'in üstünde sabit */}
      {/* ✅ FIX: Backend'den gelen participants.userOne ve participants.userTwo direkt kullanılacak */}
      {/* ✅ FIX: awaiting_completion durumunda da participants gösterilmeli (mesajlar görünmeye devam etsin) */}
      {(params.status === 'active' || params.status === 'completed' || params.status === 'awaiting_completion') && threadId && participantsData?.participants && (
        <SupportChatParticipants
          user1Name={(() => {
            // user1: Backend'den gelen userOne (kullanıcının kendi bilgileri)
            const userOne = (participantsData.participants as any)?.userOne;
            if (userOne && 'name' in userOne) {
              return userOne.name || t('messageDetail.fallback.unknown');
            }
            return participantInfo.userName ?? params.userName ?? t('messageDetail.fallback.unknown');
          })()}
          user1Title={(() => {
            const userOne = (participantsData.participants as any)?.userOne;
            if (userOne && 'title' in userOne) {
              return userOne.title || '';
            }
            return participantInfo.userTitle ?? params.userTitle ?? '';
          })()}
          user1Avatar={(() => {
            const userOne = (participantsData.participants as any)?.userOne;
            if (userOne && 'avatar' in userOne && userOne.avatar) {
              return toImageSource(userOne.avatar);
            }
            return participantInfo.userAvatar ?? params.userAvatar ?? DEFAULT_USER_AVATAR;
          })()}
          user2Name={(() => {
            // user2: Backend'den gelen userTwo (2. kullanıcının bilgileri)
            const userTwo = (participantsData.participants as any)?.userTwo;
            if (userTwo && 'name' in userTwo) {
              return userTwo.name || t('messageDetail.fallback.unknown');
            }
            return participantInfo.expertName ?? params.expertName ?? t('messageDetail.fallback.unknown');
          })()}
          user2Title={(() => {
            const userTwo = (participantsData.participants as any)?.userTwo;
            if (userTwo && 'title' in userTwo) {
              return userTwo.title || '';
            }
            return participantInfo.expertTitle ?? params.expertTitle ?? '';
          })()}
          user2Avatar={(() => {
            const userTwo = (participantsData.participants as any)?.userTwo;
            if (userTwo && 'avatar' in userTwo && userTwo.avatar) {
              return toImageSource(userTwo.avatar);
            }
            return participantInfo.expertAvatar ?? params.expertAvatar ?? DEFAULT_USER_AVATAR;
          })()}
          supportTitle={supportRequestInfo?.supportType || t('supportMessageDetail.supportChat')}
          tipsAmount={supportRequestInfo?.amount || 0}
          requestDetails={supportRequestInfo?.message || ''}
          // ✅ YENİ: Response formatından gelen bilgiler
          totalTipsAmount={participantsData?.totalTipsAmount}
          supportRequestMessages={participantsData?.supportRequestMessages}
          supportRequestType={participantsData?.supportRequestType}
          supportRequestAmount={participantsData?.supportRequestAmount}
        />
      )}

      {/* Mesaj Geçmişi */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={true}
      >
        <Box flex={1}>
          <FlatList
            ref={flatListRef}
            data={useMemo(() => {
              // ✅ FIX: Silinen ve gönderilemeyen mesajları filtrele - ekrandan tamamen kaldır
              const filteredMessages = messages.filter(msg => {
                // Silinen mesajları kaldır
                if (msg.isDeleted) return false;
                // Gönderilemeyen (failed) mesajları kaldır
                if (msg.uploadStatus === 'failed') return false;
                return true;
              });
              
              // ✅ WhatsApp Engine: Inverted FlatList için mesajları ters sırala (en yeni başta)
              // sentAt'a göre descending order (en yeni başta, en eski sonda)
              return [...filteredMessages].sort((a, b) => {
                const timeA = new Date(a.sentAt || a.timestamp).getTime();
                const timeB = new Date(b.sentAt || b.timestamp).getTime();
                return timeB - timeA; // Descending (en yeni başta)
              });
            }, [messages])}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            inverted={true}
            ListEmptyComponent={
              isLoadingMessages ? (
                <Box flex={1} justifyContent="center" alignItems="center">
                  <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('supportMessageDetail.loading')}</Text>
                </Box>
              ) : (
                <Box flex={1} justifyContent="center" alignItems="center">
                  <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('supportMessageDetail.empty')}</Text>
                </Box>
              )
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              // ✅ Inverted FlatList: paddingTop = en yeni mesajların (ekranın altındaki) altına padding ekler
              paddingTop: isKeyboardVisible ? 80 : 120,
              // CRITICAL FIX: Butonların üstüne padding ekle
              paddingBottom: isKeyboardVisible
                ? keyboardHeight + 0  // Klavye + Input (~60px) + Butonlar (~100px)
                : 0, // Input (~60px) + Bottom inset + Butonlar (~100px)
              // Empty state için: Mesaj yoksa ekranın tamamını kapla ve ortala
              flexGrow: messages.length === 0 ? 1 : 0,
              justifyContent: messages.length === 0 ? 'center' : 'flex-start',
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            // ✅ WhatsApp Engine: Performance optimizations
            removeClippedSubviews={true}
            windowSize={10}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={15}
          />
        </Box>

      {/* Typing Indicator */}
      {isTyping && typingUserId && typingUserId !== user?.id && (
        <Box 
          px="$4" 
          py="$2" 
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
          zIndex={1002}
          elevation={1002}
        >
          <HStack space="xs" alignItems="center">
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize={12}
              fontStyle="italic"
            >
              {t('supportMessageDetail.typing', { name: params.expertName || t('messageDetail.fallback.unknown') })}
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

      {/* Action Buttons - Klavye ve input üstünde görünmeli */}
      {/* Active: Close + Report buttons | Awaiting (other party closed): Finalize + Report buttons */}
      {(params.status === 'active' || (params.status === 'awaiting_completion' && !closedByCurrentUser)) && threadId && (
        <Box
          position="absolute"
          bottom={isKeyboardVisible
            ? keyboardHeight + 60
            : 60 + insets.bottom}
          right={16}
          zIndex={1003}
          elevation={1003}
        >
          <SupportMessageDetailActionButtons
            onCloseRequestPress={handleCloseRequest}
            onReportPress={handleReport}
            keyboardHeight={keyboardHeight}
            isKeyboardVisible={isKeyboardVisible}
            isFinalize={params.status === 'awaiting_completion'}
            onFinalizePress={handleFinalizeRequest}
          />
        </Box>
      )}

      {/* Mesaj Gönderme Alanı - active ve awaiting_completion'da göster (completed'da kapalı) */}
      {(params.status === 'active' || params.status === 'awaiting_completion') && threadId && (
        <Box 
          pb={isKeyboardVisible 
            ? (Platform.OS === 'ios' ? 4 : 0) 
            : 0}
          zIndex={1004}
          elevation={1004}
          position="relative"
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        >
          <MessageInput
            onSendMessage={handleSendMessage}
            onAddImage={handleAddImage}
            onSendImage={handleSendImage}
            placeholder={t('supportMessageDetail.placeholder')}
            threadId={threadId}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            selectedImage={selectedImage}
            onClearSelectedImage={() => setSelectedImage(null)}
          />
        </Box>
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
                  fontSize={14}
                  fontWeight="$semibold"
                  textAlign="center"
                >
                  {t('supportRequest.buttons.accept')}
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
                  fontSize={14}
                  fontWeight="$semibold"
                  textAlign="center"
                >
                  {t('supportRequest.buttons.reject')}
                </Text>
              </Box>
            </Pressable>
          </HStack>
        </Box>
      )}


      {/* Awaiting Completion Status - Current user closed: show waiting banner */}
      {params.status === 'awaiting_completion' && closedByCurrentUser && (
        <Box px="$4" py="$2" bg={isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)'}>
          <HStack space="sm" alignItems="center" justifyContent="center">
            <Feather name="clock" size={14} color="#6366F1" />
            <Text
              color="#6366F1"
              fontSize={13}
              fontWeight="$medium"
              textAlign="center"
              flex={1}
            >
              {t('supportRequest.statusMessages.awaitingOtherParty')}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Completed Status - Sadece görüntüleme */}
      {params.status === 'completed' && (
        <Box px="$4" py="$2" bg={isDark ? '#1A1A1A' : '#FFFFFF'}>
          <VStack space="sm" alignItems="center">
            <Text
              color={isDark ? '#4CAF50' : '#4CAF50'}
              fontSize={14}
              fontWeight="$semibold"
              textAlign="center"
            >
              {t('supportRequest.statusMessages.completed')}
            </Text>
          </VStack>
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
                fontSize={14}
                fontWeight="$semibold"
                textAlign="center"
              >
                {t('supportRequest.buttons.cancelRequest')}
              </Text>
            </Box>
          </Pressable>
        </Box>
      )}

      {/* Close/Finalize Support Request Modal - React Native Modal */}
      <Modal
        visible={isCloseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelClose}
      >
        <TouchableWithoutFeedback onPress={handleCancelClose}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TouchableWithoutFeedback>
              <View style={{
                backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                borderRadius: 24,
                maxWidth: '90%',
                minWidth: 280,
                maxHeight: '80%',
                width: '90%',
                overflow: 'hidden',
              }}>
                <VStack px={24} py={16} space="md" style={{ width: '100%' }}>
                  {/* User Profile Section */}
                  <VStack space="sm" alignItems="center">
                    {/* User Avatar - Mor/macenta border */}
                    <Image
                      source={(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertAvatar ?? params.expertAvatar ?? DEFAULT_USER_AVATAR;
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userAvatar ?? params.userAvatar ?? DEFAULT_USER_AVATAR;
                        }
                        return params.expertAvatar ?? params.userAvatar ?? DEFAULT_USER_AVATAR;
                      })()}
                      alt={(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertName ?? params.expertName ?? t('messageDetail.fallback.unknown');
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userName ?? params.userName ?? t('messageDetail.fallback.unknown');
                        }
                        return params.expertName ?? params.userName ?? t('messageDetail.fallback.unknown');
                      })()}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 55,
                        borderWidth: 4,
                        borderColor: '#C026D3', // Mor/macenta border
                      }}
                    />

                    {/* User Name */}
                    <Text
                      fontSize={18}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                      textAlign="center"
                    >
                      {(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertName ?? params.expertName ?? t('messageDetail.fallback.unknown');
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userName ?? params.userName ?? t('messageDetail.fallback.unknown');
                        }
                        return params.expertName ?? params.userName ?? t('messageDetail.fallback.unknown');
                      })()}
                    </Text>

                    {/* User Title */}
                    <Text
                      fontSize={13}
                      fontWeight="$normal"
                      color="#6B7280"
                      textAlign="center"
                      numberOfLines={2}
                    >
                      {(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertTitle ?? params.expertTitle ?? '';
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userTitle ?? params.userTitle ?? '';
                        }
                        return params.expertTitle ?? params.userTitle ?? '';
                      })()}
                    </Text>
                  </VStack>

                  {/* Divider */}
                  <Box height={1} bg="#E5E7EB" width="100%" my="$1" />

                  {/* Description Text */}
                  <VStack space="xs" alignItems="center">
                    {isFinalizeModal ? (
                      <>
                        <Text
                          fontSize={14}
                          fontWeight="$normal"
                          color="#4B5563"
                          textAlign="center"
                          lineHeight={20}
                        >
                          You are about to finalize the one-on-one
                        </Text>
                        <Text
                          fontSize={14}
                          fontWeight="$normal"
                          color="#4B5563"
                          textAlign="center"
                          lineHeight={20}
                        >
                          support request with the user.
                        </Text>
                        <Text
                          fontSize={15}
                          fontWeight="$semibold"
                          color={isDark ? '#FFFFFF' : '#000000'}
                          textAlign="center"
                          mt="$1"
                        >
                          Please rate the process!
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text
                          fontSize={14}
                          fontWeight="$normal"
                          color="#4B5563"
                          textAlign="center"
                          lineHeight={20}
                        >
                          You are about to close the one-on-one
                        </Text>
                        <Text
                          fontSize={14}
                          fontWeight="$normal"
                          color="#4B5563"
                          textAlign="center"
                          lineHeight={20}
                        >
                          support request with the user.
                        </Text>
                        <Text
                          fontSize={15}
                          fontWeight="$semibold"
                          color={isDark ? '#FFFFFF' : '#000000'}
                          textAlign="center"
                          mt="$1"
                        >
                          Please rate the process!
                        </Text>
                      </>
                    )}
                  </VStack>

                  {/* Star Rating */}
                  <Box py="$2" alignItems="center">
                    <StarRating
                      rating={closeModalRating}
                      onRatingChange={setCloseModalRating}
                      size={36}
                      color="#FFD700"
                      outlineColor="#9CA3AF"
                      showOutline={true}
                    />
                  </Box>

                  {/* Action Buttons */}
                  <VStack space="sm" mt="$2">
                    {/* Close Support Request ve Flag Butonları - Yan yana */}
                    <HStack space="sm" width="100%">
                      {/* Close Support Request Button */}
                      <Box flex={1}>
                        <Pressable 
                          onPress={() => {
                            if (closeModalRating > 0) {
                              handleConfirmClose(closeModalRating);
                              setCloseModalRating(0);
                            }
                          }} 
                          disabled={closeModalRating === 0}
                        >
                          <Box
                            bg={closeModalRating > 0 ? '#E8FF6B' : '#F3F4F6'}
                            borderRadius={16}
                            py="$2.5"
                            alignItems="center"
                            borderWidth={1}
                            borderColor={closeModalRating > 0 ? '#D8FF08' : '#E5E7EB'}
                            opacity={closeModalRating === 0 ? 0.6 : 1}
                          >
                            <Text
                              fontSize={15}
                              fontWeight="$semibold"
                              color="#000000"
                            >
                              {isFinalizeModal ? t('supportMessageDetail.buttons.finalizeSupportRequest') : t('supportMessageDetail.buttons.closeSupportRequest')}
                            </Text>
                          </Box>
                        </Pressable>
                      </Box>

                      {/* Flag Button */}
                      <Pressable onPress={handleReport}>
                        <Box
                          bg="#F3F4F6"
                          borderRadius={16}
                          py="$2.5"
                          px="$4"
                          alignItems="center"
                          justifyContent="center"
                          borderWidth={1}
                          borderColor="#E5E7EB"
                          minWidth={56}
                        >
                          <Feather
                            name="flag"
                            size={20}
                            color={isDark ? '#FFFFFF' : '#000000'}
                          />
                        </Box>
                      </Pressable>
                    </HStack>

                    {/* Cancel Button */}
                    <Pressable onPress={handleCancelClose}>
                      <Box
                        bg="#F3F4F6"
                        borderRadius={16}
                        py="$2.5"
                        alignItems="center"
                        borderWidth={1}
                        borderColor="#E5E7EB"
                      >
                        <Text
                          fontSize={15}
                          fontWeight="$semibold"
                          color={isDark ? '#FFFFFF' : '#000000'}
                        >
                          {t('supportMessageDetail.buttons.cancel')}
                        </Text>
                      </Box>
                    </Pressable>
                  </VStack>
                </VStack>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Report Modal - Ayrı Modal component'i */}
      <Modal
        visible={isReportModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelReport}
      >
        <TouchableWithoutFeedback onPress={handleCancelReport}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <TouchableWithoutFeedback>
              <View style={{
                backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
                borderRadius: 24,
                maxWidth: '90%',
                width: '90%',
                padding: 24,
                maxHeight: '90%',
              }}>
                <VStack space="md">
                  {/* Report Başlığı */}
                  <HStack alignItems="center" justifyContent="space-between" mb="$2">
                    <Text
                      fontSize={18}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                      textAlign="center"
                      flex={1}
                    >
                      {t('supportMessageDetail.reportModal.title')}
                    </Text>
                    <Pressable onPress={handleCancelReport}>
                      <Feather
                        name="x"
                        size={24}
                        color={isDark ? '#FFFFFF' : '#000000'}
                      />
                    </Pressable>
                  </HStack>

                  {/* User Profile Section */}
                  <VStack space="sm" alignItems="center">
                    {/* User Avatar - Mor/macenta border */}
                    <Image
                      source={(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertAvatar ?? params.expertAvatar ?? DEFAULT_USER_AVATAR;
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userAvatar ?? params.userAvatar ?? DEFAULT_USER_AVATAR;
                        }
                        return params.expertAvatar ?? params.userAvatar ?? DEFAULT_USER_AVATAR;
                      })()}
                      alt={(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertName ?? params.expertName ?? t('messageDetail.fallback.unknown');
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userName ?? params.userName ?? t('messageDetail.fallback.unknown');
                        }
                        return params.expertName ?? params.userName ?? t('messageDetail.fallback.unknown');
                      })()}
                      style={{
                        width: 110,
                        height: 110,
                        borderRadius: 55,
                        borderWidth: 4,
                        borderColor: '#C026D3', // Mor/macenta border
                      }}
                    />

                    {/* User Name */}
                    <Text
                      fontSize={18}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                      textAlign="center"
                    >
                      {(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertName ?? params.expertName ?? t('messageDetail.fallback.unknown');
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userName ?? params.userName ?? t('messageDetail.fallback.unknown');
                        }
                        return params.expertName ?? params.userName ?? t('messageDetail.fallback.unknown');
                      })()}
                    </Text>

                    {/* User Title */}
                    <Text
                      fontSize={13}
                      fontWeight="$normal"
                      color="#6B7280"
                      textAlign="center"
                      numberOfLines={2}
                    >
                      {(() => {
                        if (supportRequestUserIds.fromUserId === user?.id) {
                          return participantInfo.expertTitle ?? params.expertTitle ?? '';
                        } else if (supportRequestUserIds.toUserId === user?.id) {
                          return participantInfo.userTitle ?? params.userTitle ?? '';
                        }
                        return params.expertTitle ?? params.userTitle ?? '';
                      })()}
                    </Text>
                  </VStack>

                  {/* Reason for report Section */}
                  <VStack space="xs">
                    <Text
                      fontSize={14}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {t('supportMessageDetail.reportModal.reasonTitle')}
                    </Text>
                    
                    {/* Custom Dropdown */}
                    <VStack space="xs" position="relative">
                      <Pressable onPress={() => setShowReportReasonDropdown((v) => !v)}>
                        <Box
                          bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                          borderWidth={1}
                          borderColor={isDark ? '#333' : '#E9E9E9'}
                          borderTopLeftRadius={12}
                          borderTopRightRadius={12}
                          borderBottomLeftRadius={showReportReasonDropdown ? 0 : 12}
                          borderBottomRightRadius={showReportReasonDropdown ? 0 : 12}
                          height={48}
                          px="$4"
                          justifyContent="center"
                        >
                          <HStack
                            flex={1}
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Text
                              color={
                                reportReason
                                  ? (isDark ? '#FFFFFF' : '#000000')
                                  : (isDark ? '#8C8C8C' : '#8C8C8C')
                              }
                              fontSize={13}
                              fontWeight="$normal"
                              flex={1}
                            >
                              {getReportReasonLabel(reportReason as 'SPAM' | 'INAPPROPRIATE' | 'HARASSMENT' | 'SCAM' | 'OTHER' | '')}
                            </Text>
                            <Feather
                              name={showReportReasonDropdown ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={isDark ? '#FFFFFF' : '#000000'}
                            />
                          </HStack>
                        </Box>
                      </Pressable>

                      {showReportReasonDropdown && (
                        <Box
                          bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                          borderWidth={1}
                          borderColor={isDark ? '#333' : '#E9E9E9'}
                          borderTopWidth={0}
                          borderTopLeftRadius={0}
                          borderTopRightRadius={0}
                          borderBottomLeftRadius={12}
                          borderBottomRightRadius={12}
                          overflow="hidden"
                        >
                          <VStack>
                            {reportReasons.map((reason, index) => (
                              <React.Fragment key={reason}>
                                {index > 0 && (
                                  <Box height={1} bg={isDark ? '#333' : '#E9E9E9'} width="100%" />
                                )}
                                <Pressable
                                  onPress={() => {
                                    setReportReason(reason);
                                    setShowReportReasonDropdown(false);
                                  }}
                                >
                                  <HStack px="$4" py="$3" alignItems="center">
                                    <Text
                                      color={isDark ? '#FFFFFF' : '#2F2F2F'}
                                      fontSize={13}
                                      fontWeight="$normal"
                                    >
                                      {getReportReasonLabel(reason)}
                                    </Text>
                                  </HStack>
                                </Pressable>
                              </React.Fragment>
                            ))}
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </VStack>

                  {/* Description Section */}
                  <VStack space="xs">
                    <Text
                      fontSize={14}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {t('supportMessageDetail.reportModal.descriptionTitle')}
                    </Text>
                    
                    <Input
                      variant="outline"
                      size="md"
                      isDisabled={false}
                      isInvalid={false}
                      isReadOnly={false}
                    >
                      <InputField
                        placeholder={t('support.placeholders.describeIssue')}
                        value={reportDescription}
                        onChangeText={setReportDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        color={isDark ? '#FFFFFF' : '#000000'}
                        placeholderTextColor={isDark ? '#8C8C8C' : '#9CA3AF'}
                      />
                    </Input>
                  </VStack>

                  {/* Report Button */}
                  <Pressable
                    onPress={handleConfirmReport}
                    disabled={!reportReason || reportReason.trim().length === 0}
                  >
                    <Box
                      bg={reportReason ? '#E8FF6B' : '#F3F4F6'}
                      borderRadius={16}
                      py="$2.5"
                      alignItems="center"
                      borderWidth={1}
                      borderColor={reportReason ? '#D8FF08' : '#E5E7EB'}
                      opacity={!reportReason ? 0.6 : 1}
                    >
                      <Text
                        fontSize={15}
                        fontWeight="$semibold"
                        color="#000000"
                      >
                        {t('supportMessageDetail.buttons.report')}
                      </Text>
                    </Box>
                  </Pressable>
                </VStack>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      </KeyboardAvoidingView>
      
      {/* Bottom inset view - Home indicator için (klavye kapalıyken) */}
      {!isKeyboardVisible && (
        <Box 
          height={insets.bottom} 
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        />
      )}

    </Box>
  );
};

SupportMessageDetailScreen.displayName = 'SupportMessageDetailScreen';

export default SupportMessageDetailScreen;
