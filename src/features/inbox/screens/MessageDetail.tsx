import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Alert, Keyboard, Dimensions, ActivityIndicator, Share, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useAppStore } from '@/src/store/appStore';
import { toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useSendGift, useCreateSupportRequest, useSendDirectMessage, useThreadMessages, useAcceptSupportRequest, useRejectSupportRequest, useCancelSupportRequest, useMarkThreadAsRead, useAddReaction, useRemoveReaction, useDeleteMessage, useMuteThread, useUnmuteThread, useMessages } from '../api/hooks';
import { getThreadMessages } from '../api/messagesApi';
import type { ThreadMessage } from '../api/messagesApi';
import { useSocket } from '@/src/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { inboxKeys } from '../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useReportUser, useBlockUser } from '@/src/features/profile/api/hooks';
import MessageDetailHeader from '../components/MessageDetailHeader';
import MessageInput from '../components/MessageInput';
import MessageDetailActionButtons from '../components/MessageDetailActionButtons';
import SendTipsBottomSheet from '../components/SendTipsBottomSheet';
import OneOnOneSupportBottomSheet from '../components/OneOnOneSupportBottomSheet';
import { ImageMessage } from '../components/MessageItem/ImageMessage';
import { MessageItem } from '../components/MessageItem';

interface MessageDetailItem {
  id: string;
  text: string;
  timestamp: string;
  sentAt: string; // CRITICAL: Sıralama için ISO timestamp (backend'den gelen sentAt)
  isSent: boolean;
  senderId?: string; // ✅ WhatsApp Engine: Mesaj gruplama için gerekli
  senderName?: string;
  senderAvatar?: any;
  type?: 'message' | 'support_request' | 'tips' | 'image';
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
  tipsAmount?: number; // TIPS mesajı için amount
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  thumbnailUrl?: string | null | undefined;
  uploadStatus?: 'uploading' | 'uploaded' | 'failed';
  uploadProgress?: number;
  // Image dimensions (backend'den gelebilir)
  dimensions?: {
    width: number;
    height: number;
  };
  // Message status indicators
  isRead?: boolean; // Mesaj okundu mu?
  readAt?: string; // Okunma zamanı
  // Reactions
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  // Message deletion status
  isDeleted?: boolean;
}

type MessageDetailScreenNavigationProp = NativeStackNavigationProp<any, 'MessageDetailScreen'>;

interface MessageDetailScreenParams {
  messageId: string;
  threadId?: string; // Thread ID (opsiyonel)
  recipientUserId?: string; // Mesaj gönderilecek kullanıcı ID'si (opsiyonel, thread'den de alınabilir)
  senderName: string;
  senderTitle: string;
  senderAvatar: any;
  openSendTips?: boolean; // Send tips bottom sheet'i açılsın mı? (root.types.ts ile uyumlu)
}



// Güvenli tarih formatlama fonksiyonu
const formatMessageTime = (dateInput: string | Date | null | undefined): string => {
  try {
    if (!dateInput) {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
};

// Date header formatting function (Yesterday, or date) - English
const formatDateHeader = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const day = date.getDate();
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    }
  } catch (error) {
    return '';
  }
};

// İki tarihin aynı güne ait olup olmadığını kontrol eden helper fonksiyon
const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch (error) {
    return false;
  }
};

// ✅ OPTIMIZE: İki mesaj arasında 5 dakikadan az fark var mı kontrol et (mesaj gruplama için)
const isWithin5Minutes = (date1: string | Date, date2: string | Date): boolean => {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    
    const diff = Math.abs(d1.getTime() - d2.getTime());
    return diff <= 5 * 60 * 1000; // 5 dakika = 300000 ms
  } catch (error) {
    return false;
  }
};

// ✅ WhatsApp Engine: Yeni mesajı doğru pozisyona ekle (descending order - inverted FlashList için)
// Inverted FlashList: index 0 = en yeni mesaj (ekranın altında), index length-1 = en eski mesaj (ekranın üstünde)
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
  // Inverted FlashList için: Yeni mesajı başa ekle (unshift) - en yeni mesaj index 0'da olmalı
  const newSentAt = new Date(newMessage.sentAt).getTime();
  
  // En yeni mesajdan başlayarak kontrol et (descending order için)
  // Yeni mesaj daha yeni ise, buraya ekle (bu mesajdan önce, yani başa)
  for (let i = 0; i < messages.length; i++) {
    const currentSentAt = new Date(messages[i].sentAt).getTime();
    
    // Yeni mesaj daha yeni ise, buraya ekle (başa, index 0'a yakın)
    if (newSentAt > currentSentAt) {
      const updated = [...messages];
      updated.splice(i, 0, newMessage);
      return updated;
    }
  }
  
  // Tüm mesajlardan daha eski veya eşit ise, sona ekle (en eski mesaj olarak)
  return [...messages, newMessage];
};

// ✅ WhatsApp Engine: Mesaj gruplama pre-processor (isFirst, isMiddle, isLast flag'leri)
// Not: Şu an renderItem içinde hesaplanıyor, performans için useMemo ile pre-process edilebilir
// Şimdilik renderItem içindeki hesaplama yeterli (her mesaj için sadece bir önceki mesajı kontrol ediyor)
// Gelecekte: useMemo ile tüm mesajları bir kerede process edip groupInfo eklenebilir

const MessageDetailScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<MessageDetailScreenNavigationProp>();
  const route = useRoute();
  const flatListRef = useRef<FlatList<MessageDetailItem>>(null);
  const [messages, setMessages] = useState<MessageDetailItem[]>([]);
  const [expandedSupportRequests, setExpandedSupportRequests] = useState<{ [key: string]: boolean }>({});
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  // Seçilen görsel state'i (caption için)
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    type: string;
    name: string;
    fileSize?: number;
  } | null>(null);
  // Emoji picker state for each message
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<{ [key: string]: boolean }>({});
  const emojiPickerAnimations = useRef<{ [key: string]: { width: Animated.Value; opacity: Animated.Value } }>({}).current;
  // Mesaj görünürlüğü takibi için (okundu işaretleme)
  const visibleMessageIdsRef = useRef<Set<string>>(new Set());
  // Component mount durumunu takip et (unmount olduktan sonra okundu işaretleme yapılmasın)
  const isMountedRef = useRef(true);

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

  // Safe area insets
  // Not: MessageDetail artık GlobalStackGroup'ta (Root seviyesinde), Tab Navigator içinde değil
  // Bu yüzden useBottomTabBarHeight() kullanılamaz - tab bar yok
  const insets = useSafeAreaInsets();
  const tabBarHeight = 0; // GlobalStackGroup ekranlarında tab bar yok

  // Route params'dan gelen verileri al
  const params = (route.params as MessageDetailScreenParams) || {
    messageId: '',
    senderName: 'Unknown',
    senderTitle: '',
    senderAvatar: undefined,
    openSendTips: false,
  };

  // CRITICAL FIX: params değerlerini useRef ile sakla (dependency array'deki infinite loop'u önlemek için)
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params.senderName, params.senderTitle, params.senderAvatar, params.messageId, params.recipientUserId, params.threadId]);

  // Route params'dan recipientUserId'yi al
  const routeParams = (route.params as MessageDetailScreenParams) || {};
  const recipientUserId = routeParams.recipientUserId;
  const initialThreadId = routeParams.threadId || routeParams.messageId;
  
  // DEBUG: Route params'ı logla
  console.log('[MessageDetail] 🔍 Route params:', {
    threadId: routeParams.threadId,
    messageId: routeParams.messageId,
    recipientUserId: routeParams.recipientUserId,
    initialThreadId,
    allParams: routeParams,
  });

  // Helper: Thread'den diğer kullanıcıyı bul (DM_THREAD.md'ye göre)
  const getOtherUserIdFromThread = useCallback((thread: { userOneId: string; userTwoId: string }, currentUserId: string): string | null => {
    if (thread.userOneId === currentUserId) {
      return thread.userTwoId;
    } else if (thread.userTwoId === currentUserId) {
      return thread.userOneId;
    }
    return null;
  }, []);

  // Get current user from store
  const { user } = useAppStore();
  const sendGiftMutation = useSendGift();
  const createSupportRequestMutation = useCreateSupportRequest();
  const sendDirectMessageMutation = useSendDirectMessage();
  const acceptSupportRequestMutation = useAcceptSupportRequest();
  const rejectSupportRequestMutation = useRejectSupportRequest();
  const cancelSupportRequestMutation = useCancelSupportRequest();
  const markThreadAsReadMutation = useMarkThreadAsRead();
  const addReactionMutation = useAddReaction();
  const removeReactionMutation = useRemoveReaction();
  const deleteMessageMutation = useDeleteMessage();
  const queryClient = useQueryClient();
  const reportUserMutation = useReportUser();
  const blockUserMutation = useBlockUser();
  const muteThreadMutation = useMuteThread();
  const unmuteThreadMutation = useUnmuteThread();
  
  // Thread'in muted durumunu almak için messages listesini kontrol et
  const { data: messagesList } = useMessages({ threadType: 'ALL' });
  const currentThread = messagesList?.find(msg => msg.id === threadId);
  const isMuted = currentThread?.isMuted ?? false;
  
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
    acceptSupportRequest: socketAcceptSupportRequest,
    rejectSupportRequest: socketRejectSupportRequest,
    cancelSupportRequest: socketCancelSupportRequest,
    on,
    off,
  } = useSocket();

  // Thread ID state
  const [threadId, setThreadId] = useState<string | null>(null);
  
  // AppStore'dan aktif thread ID set etme fonksiyonunu al
  const { setActiveThreadId } = useAppStore();
  // Socket bağlantı durumu state
  const [isSocketReady, setIsSocketReady] = useState(false);
  // recipientUserId state (thread'den alınabilir)
  const [effectiveRecipientUserId, setEffectiveRecipientUserId] = useState<string | undefined>(recipientUserId);
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  // Typing timeout ref
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Klavye yüksekliği state
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightRef = useRef(0);

  // FlatList content size ref (scroll logic için)
  const contentSizeRef = useRef({ width: 0, height: 0 });
  const layoutSizeRef = useRef({ width: 0, height: 0 });

  // ✅ WhatsApp Engine: Güvenli scroll helper - Inverted FlatList için scrollToEnd kullan
  // Inverted FlatList: index 0 = en yeni mesaj (ekranın altında), scrollToEnd en yeni mesaja scroll yapar
  const safeScrollToEnd = useCallback((animated: boolean = true) => {
    try {
      // Inverted FlatList'te en yeni mesaj index 0'da, scrollToEnd en yeni mesaja scroll yapar
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated });
      }
    } catch (error) {
      // Hata durumunda scrollToOffset ile en yeni mesajın offset'ini hesapla
      try {
        // Inverted list'te offset 0 = en yeni mesaj (index 0)
        flatListRef.current?.scrollToOffset({ offset: 0, animated });
      } catch (offsetError) {
        // Sessizce yakala
      }
    }
  }, []);

  // Mesaj baloncuğu height'ı kadar yukarı scroll (smooth)
  const scrollByMessageHeight = useCallback((messageText: string) => {
    try {
      // Mesaj baloncuğu height'ını tahmin et
      // Text padding: px="$3" py="$2" = ~12px top/bottom = 24px total
      // Font size: 11, line height: ~16px
      // Her satır ~20px, minimum ~40px (padding dahil)
      // Max width: 80% of screen, average ~30 karakter/satır
      const lines = Math.ceil(messageText.length / 30); // Ortalama 30 karakter/satır
      const textHeight = Math.max(20, lines * 20); // Minimum 20px (tek satır)
      const messageHeight = textHeight + 24; // Padding (12px top + 12px bottom)
      
     
      
      // ✅ WhatsApp Engine: Inverted FlatList'te scrollToEnd en yeni mesaja scroll yapar
      flatListRef.current?.scrollToEnd({ animated: true });
      
      // Ekstra smooth scroll için küçük bir delay ile tekrar scroll
      // Bu sayede mesaj baloncuğu tam görünür olur
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    } catch (error) {
      if (__DEV__) {
        console.warn('[MessageDetail] ⚠️ Scroll error, using fallback:', error);
      }
      // Hata durumunda normal scroll yap
      safeScrollToEnd(true);
    }
    // CRITICAL FIX: safeScrollToEnd dependency'den çıkarıldı - flatListRef.current zaten güncel
  }, []);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Thread mesajlarını yükle
  // Pagination state
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState<string | undefined>(undefined);
  
  // Thread messages query - İlk yüklemede en yeni mesajları getir (limit: 50)
  const { data: threadMessages, isLoading: isLoadingMessages, refetch: refetchMessages } = useThreadMessages(
    threadId,
    { limit: 50 } // İlk yüklemede 50 mesaj getir
  );
  
  // DEBUG: ThreadId ve query durumunu logla
  useEffect(() => {
    console.log('[MessageDetail] 🔍 Query durumu kontrolü:', {
      threadId,
      queryEnabled: !!threadId,
      isLoadingMessages,
      isFetching: queryClient.getQueryState([...inboxKeys.threadMessages(threadId || ''), { limit: 50 }])?.fetchStatus,
      threadMessagesLength: threadMessages?.length || 0,
      hasThreadMessages: !!threadMessages,
      threadMessagesType: Array.isArray(threadMessages) ? 'array' : typeof threadMessages,
    });
    
    // Query durumunu kontrol et
    if (threadId) {
      const queryKey = [...inboxKeys.threadMessages(threadId), { limit: 50 }];
      const queryState = queryClient.getQueryState(queryKey);
      const queryData = queryClient.getQueryData<ThreadMessage[]>(queryKey);
      
      console.log('[MessageDetail] 🔍 React Query state:', {
        queryKey: queryKey.join('/'),
        status: queryState?.status,
        fetchStatus: queryState?.fetchStatus,
        dataUpdatedAt: queryState?.dataUpdatedAt ? new Date(queryState.dataUpdatedAt).toISOString() : null,
        errorUpdatedAt: queryState?.errorUpdatedAt ? new Date(queryState.errorUpdatedAt).toISOString() : null,
        error: queryState?.error?.message,
        hasCachedData: !!queryData,
        cachedDataLength: queryData?.length || 0,
      });
    } else {
      console.log('[MessageDetail] ⚠️ ThreadId yok, query disabled');
    }
  }, [threadId, isLoadingMessages, threadMessages?.length, queryClient]);

  // Klavye event listener'ları - scroll ve buton pozisyonu için
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const height = event.endCoordinates.height;
        setKeyboardHeight(height);
        keyboardHeightRef.current = height;
        setIsKeyboardVisible(true);
        console.log('[MessageDetail] ⌨️ Keyboard opened, height:', height);
        
        // ✅ Normal FlatList kullanıldığı için klavye açıldığında en son mesaja scroll yap
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
        console.log('[MessageDetail] ⌨️ Keyboard closed');
        
        // Klavye kapandığında: Eğer content tüm ekranı kaplıyorsa en alta scroll yap
        // Yoksa mevcut pozisyonda kalsın
        setTimeout(() => {
          const contentHeight = contentSizeRef.current.height;
          const layoutHeight = layoutSizeRef.current.height;
          
          // Eğer content height layout height'tan büyükse (tüm ekranı kaplıyorsa)
          if (contentHeight > layoutHeight && messages.length > 0) {
            console.log('[MessageDetail] 📜 Content fills screen, scrolling to end');
            safeScrollToEnd(true);
          } else {
            console.log('[MessageDetail] 📜 Content does not fill screen, keeping position');
          }
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [safeScrollToEnd]);

  // Pagination: Eski mesajları yükle (yukarı scroll yapıldığında)
  const loadOlderMessages = useCallback(async () => {
    if (!threadId || !hasMoreMessages || isLoadingMoreMessages || !oldestMessageId) {
      return;
    }
    
    setIsLoadingMoreMessages(true);
    try {
      const olderMessages = await getThreadMessages(threadId, {
        limit: 50,
        beforeMessageId: oldestMessageId,
      });
      
      // Pagination bilgisini kontrol et
      const paginationInfo = (olderMessages as any).__pagination;
      if (olderMessages.length === 0 || (paginationInfo && !paginationInfo.hasMore)) {
        setHasMoreMessages(false);
        setIsLoadingMoreMessages(false);
        return;
      }
      
      // Eğer mesaj sayısı limit'ten azsa, daha fazla mesaj yok demektir
      if (olderMessages.length < 50) {
        setHasMoreMessages(false);
      }
      
      // Eski mesajları mevcut mesajların başına ekle
      setMessages((prev) => {
        const currentParams = paramsRef.current;
        const convertedOlderMessages: MessageDetailItem[] = olderMessages.map((msg) => {
          // ✅ FIX: isSent hesaplaması - String karşılaştırması yap (tip uyumsuzluğu olabilir)
          // user?.id kontrolü ekle - eğer user henüz yüklenmemişse false döndür
          const isSent = user?.id ? String(msg.senderId) === String(user.id) : false;
          
          // ✅ DEBUG: isSent hesaplamasını kontrol et
          if (__DEV__) {
            console.log('[MessageDetail] 🔍 isSent hesaplaması (older messages):', {
              messageId: msg.id,
              senderId: msg.senderId,
              userId: user?.id,
              isSent,
              hasUser: !!user,
            });
          }
          const senderName = isSent 
            ? undefined 
            : (msg.senderName || currentParams.senderName || 'Unknown');
          const senderAvatar = isSent 
            ? undefined 
            : (msg.senderAvatar ? toImageSource(msg.senderAvatar) : currentParams.senderAvatar);
          
          let messageType: 'message' | 'image' | 'support_request' | 'tips' = 'message';
          if (msg.messageType === 'support-request' || msg.supportRequestType) {
            messageType = 'support_request';
          } else if (msg.messageType === 'send-tips' || (msg.amount && !msg.supportRequestType && !msg.mediaUrl)) {
            // ✅ FIX: amount var ama supportRequestType yoksa ve mediaUrl yoksa -> TIPS mesajı
            messageType = 'tips';
          } else if (msg.messageType === 'image' || msg.mediaUrl) {
            messageType = 'image';
          }
          
          return {
            id: msg.id,
            text: msg.message || msg.caption || '',
            timestamp: formatMessageTime(msg.sentAt),
            sentAt: msg.sentAt,
            isSent,
            senderName,
            senderAvatar,
            type: messageType,
            mediaUrl: msg.mediaUrl,
            mediaType: msg.mediaUrl ? 'image' : undefined,
            thumbnailUrl: msg.thumbnailUrl,
            // ✅ Image dimensions (backend'den gelebilir)
            dimensions: msg.dimensions || (msg as any).content?.dimensions,
            tipsAmount: (msg.messageType === 'send-tips' || (msg.amount && !msg.supportRequestType && !msg.mediaUrl)) ? (msg.amount || 0) : undefined,
            supportRequest: (msg.messageType === 'support-request' || msg.supportRequestType) ? {
              supportType: msg.supportRequestType || 'GENERAL',
              message: msg.message,
              amount: msg.amount || 0,
              status: (msg.supportRequestStatus || 'pending') as 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported',
              requestId: msg.requestId || msg.id, // Backend'den gelen requestId kullan, yoksa message ID kullan
              threadId: msg.threadId || null,
              fromUserId: msg.fromUserId,
              toUserId: msg.toUserId,
            } : undefined,
            // Reactions (backend'den gelebilir)
            reactions: (msg as any).reactions || undefined,
          };
        });
        
        // ✅ WhatsApp Engine: Inverted FlashList için - Eski mesajları sona ekle (en yeni başta, en eski sonda)
        const merged = [...prev, ...convertedOlderMessages];
        merged.sort((a, b) => {
          const timeA = new Date(a.sentAt).getTime();
          const timeB = new Date(b.sentAt).getTime();
          return timeB - timeA; // Descending (en yeni başta, en eski sonda) - inverted FlashList için
        });
        
          // ✅ WhatsApp Engine: En eski mesaj ID'sini güncelle (inverted FlashList'te en eski mesaj dizinin sonunda)
          if (merged.length > 0) {
            setOldestMessageId(merged[merged.length - 1].id);
          }
        
        return merged;
      });
    } catch (error) {
      console.error('[MessageDetail] ❌ Error loading older messages:', error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  }, [threadId, hasMoreMessages, isLoadingMoreMessages, oldestMessageId, user?.id]);

  // ThreadId değiştiğinde pagination state'ini reset et ve eski thread cache'ini temizle
  const prevThreadIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (threadId) {
      // ✅ FIX: Thread değiştiğinde eski thread'in cache'ini temizle
      if (prevThreadIdRef.current && prevThreadIdRef.current !== threadId) {
        console.log('[MessageDetail] 🔄 Thread değişti, eski thread cache temizleniyor:', {
          oldThreadId: prevThreadIdRef.current,
          newThreadId: threadId,
        });
        
        // Eski thread'in tüm cache'ini temizle (tüm params kombinasyonları için)
        queryClient.removeQueries({ 
          queryKey: inboxKeys.threadMessages(prevThreadIdRef.current),
        });
        
        // Local state'i temizle (pending mesajlar hariç)
        setMessages((prev) => prev.filter(msg => msg.id.startsWith('pending-')));
      }
      
      setHasMoreMessages(true);
      setOldestMessageId(undefined);
      prevThreadIdRef.current = threadId;
    }
  }, [threadId, queryClient]);

  // Thread mesajlarını local state'e dönüştür
  useEffect(() => {
    // ✅ FIX: Thread ID kontrolü - Eğer mesajlar başka bir thread'e aitse, göz ardı et
    if (threadMessages && Array.isArray(threadMessages) && threadMessages.length > 0 && threadId) {
      // Backend'den gelen mesajların thread ID'sini kontrol et
      // ThreadMessage interface'inde threadId property'si var
      const firstMessage = threadMessages[0];
      const messageThreadId = firstMessage.threadId;
      
      // Eğer mesajlar mevcut thread'e ait değilse, göz ardı et
      if (messageThreadId && messageThreadId !== threadId) {
        console.log('[MessageDetail] ⚠️ Thread ID eşleşmiyor, mesajlar göz ardı ediliyor:', {
          currentThreadId: threadId,
          messageThreadId,
          messageCount: threadMessages.length,
          firstMessageId: firstMessage.id,
        });
        // Cache'i temizle ve mesajları sıfırla
        queryClient.removeQueries({ 
          queryKey: inboxKeys.threadMessages(threadId),
        });
        setMessages([]);
        return;
      }
    }
    
    if (threadMessages && Array.isArray(threadMessages)) {
      if (threadMessages.length > 0) {
        console.log('[MessageDetail] 📥 Thread messages loaded:', threadMessages.length);
        console.log('[MessageDetail] 📥 Sample message:', JSON.stringify(threadMessages[0], null, 2));
        console.log('[MessageDetail] 📥 Params:', { senderName: params.senderName, hasAvatar: !!params.senderAvatar });
        
        // ✅ Backend iyileştirmesi: GET /inbox/:threadId çağrıldığında backend otomatik olarak
        // tüm okunmamış mesajları isRead: true yapıyor ve thread_read socket event'i gönderiyor.
        // Bu yüzden frontend'de manuel olarak markThreadRead çağırmaya gerek yok.
        // thread_read event'i geldiğinde inbox listesi otomatik güncellenecek.
        console.log('[MessageDetail] ✅ Thread messages loaded. Backend automatically marks messages as read when GET /inbox/:threadId is called.');
        
        // Normal FlatList için mesajları normal sırada tut (en eski başta, en yeni sonda)
        const currentParams = paramsRef.current;
        const convertedMessages: MessageDetailItem[] = threadMessages
          .map((msg) => {
            // ✅ DEBUG: TIPS mesajları için özel log
            if (msg.messageType === 'send-tips' || (msg.amount && !msg.supportRequestType && !msg.mediaUrl)) {
              console.log('[MessageDetail] 💰 TIPS mesajı parse ediliyor:', {
                messageId: msg.id,
                messageType: msg.messageType,
                amount: msg.amount,
                message: msg.message,
                supportRequestType: msg.supportRequestType,
                mediaUrl: msg.mediaUrl,
                senderId: msg.senderId,
              });
            }
            
            // ✅ FIX: isSent hesaplaması - String karşılaştırması yap (tip uyumsuzluğu olabilir)
            // user?.id kontrolü ekle - eğer user henüz yüklenmemişse false döndür
            const isSent = user?.id ? String(msg.senderId) === String(user.id) : false;
            
            // ✅ DEBUG: isSent hesaplamasını kontrol et (her zaman logla)
            if (__DEV__) {
              console.log('[MessageDetail] 🔍 isSent hesaplaması (thread messages):', {
                messageId: msg.id,
                senderId: msg.senderId,
                userId: user?.id,
                isSent,
                senderIdType: typeof msg.senderId,
                userIdType: typeof user?.id,
                areEqual: user?.id ? String(msg.senderId) === String(user.id) : false,
                hasUser: !!user,
              });
            }
            // Backend'den gelen sender bilgilerini kullan (varsa), yoksa params'dan al
            const senderName = isSent 
              ? undefined 
              : (msg.senderName || currentParams.senderName || 'Unknown');
            const senderAvatar = isSent 
              ? undefined 
              : (msg.senderAvatar ? toImageSource(msg.senderAvatar) : currentParams.senderAvatar);
            
            // Mesaj tipini belirle
            let messageType: 'message' | 'image' | 'support_request' | 'tips' = 'message';
            if (msg.messageType === 'support-request' || msg.supportRequestType) {
              messageType = 'support_request';
            } else if (msg.messageType === 'send-tips' || (msg.amount && !msg.supportRequestType && !msg.mediaUrl)) {
              // ✅ FIX: amount var ama supportRequestType yoksa ve mediaUrl yoksa -> TIPS mesajı
              messageType = 'tips';
              // ✅ DEBUG: TIPS mesajı tespit edildi
              if (__DEV__) {
                console.log('[MessageDetail] 💰 TIPS mesajı tespit edildi:', {
                  messageId: msg.id,
                  messageType: msg.messageType,
                  amount: msg.amount,
                  message: msg.message,
                  supportRequestType: msg.supportRequestType,
                  mediaUrl: msg.mediaUrl,
                  finalMessageType: messageType,
                });
              }
            } else if (msg.messageType === 'image' || msg.mediaUrl) {
              messageType = 'image';
            }

            const convertedMessage: MessageDetailItem = {
              id: msg.id,
              text: msg.message || msg.caption || '', // ✅ Görsel mesajlarda caption kullanılabilir
              timestamp: formatMessageTime(msg.sentAt),
              sentAt: msg.sentAt, // CRITICAL: Sıralama için ISO timestamp
              isSent,
              senderId: msg.senderId, // ✅ WhatsApp Engine: Mesaj gruplama için gerekli
              senderName,
              senderAvatar,
              isRead: msg.isRead,
              readAt: msg.readAt,
              type: messageType,
              // ✅ Image message fields - Görsel mesajlar için
              mediaUrl: msg.mediaUrl,
              mediaType: msg.mediaUrl ? 'image' : undefined,
              thumbnailUrl: msg.thumbnailUrl,
              // ✅ Image dimensions (backend'den gelebilir)
              dimensions: msg.dimensions || (msg as any).content?.dimensions,
              // TIPS mesajı için amount
              tipsAmount: (msg.messageType === 'send-tips' || (msg.amount && !msg.supportRequestType && !msg.mediaUrl)) ? (msg.amount || 0) : undefined,
              // Support request için özel alanlar
              supportRequest: (msg.messageType === 'support-request' || msg.supportRequestType) ? (() => {
                // ✅ Backend'den gelen status bilgisini al (data.status -> supportRequestStatus olarak map ediliyor)
                const backendStatus = msg.supportRequestStatus;
                // ✅ Status bilgisi yoksa veya geçersizse 'pending' kullan
                const validStatuses: Array<'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported'> = 
                  ['pending', 'accepted', 'rejected', 'canceled', 'awaiting_completion', 'completed', 'reported'];
                const finalStatus = (backendStatus && validStatuses.includes(backendStatus as any)) 
                  ? backendStatus as 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported'
                  : 'pending';
                
                if (__DEV__) {
                  console.log('[MessageDetail] 🔍 Support Request Status Debug:', {
                    messageId: msg.id,
                    messageType: msg.messageType,
                    supportRequestType: msg.supportRequestType,
                    backendStatus,
                    finalStatus,
                    requestId: msg.requestId,
                    threadId: msg.threadId,
                    fromUserId: msg.fromUserId,
                    toUserId: msg.toUserId,
                  });
                }
                
                return {
                  supportType: msg.supportRequestType || 'GENERAL',
                  message: msg.message,
                  amount: msg.amount || 0,
                  status: finalStatus, // ✅ Backend'den gelen status kullanılıyor (accepted, rejected, canceled, pending, vb.)
                  requestId: msg.requestId || msg.id, // Backend'den gelen requestId kullan, yoksa message ID kullan
                  threadId: msg.threadId || null, // Support thread ID (accepted ise)
                  fromUserId: msg.fromUserId, // Request'i oluşturan kullanıcı
                  toUserId: msg.toUserId, // Request'in gönderildiği kullanıcı (expert)
                };
              })() : undefined,
            };
            
            // ✅ DEBUG: TIPS mesajları için convert sonrası log
            if (messageType === 'tips') {
              console.log('[MessageDetail] 💰 TIPS mesajı convert edildi:', {
                messageId: convertedMessage.id,
                type: convertedMessage.type,
                tipsAmount: convertedMessage.tipsAmount,
                text: convertedMessage.text,
                isSent: convertedMessage.isSent,
                senderId: convertedMessage.senderId,
              });
            }
            
            return convertedMessage;
          });
          // ✅ FIX: Normal FlatList için normal sırada tut - en eski mesaj index 0'da, en yeni mesaj sonda
        
        // Optimistic mesajları koru (pending- ile başlayan mesajlar)
        // Backend'den gelen mesajlarla merge yap
        setMessages((prev) => {
          // Pending mesajları al (henüz backend'den gelmemiş olanlar)
          const pendingMessages = prev.filter(msg => msg.id.startsWith('pending-'));
          
          // Backend'den gelen mesajlarla pending mesajları birleştir
          // Eğer pending mesaj backend'de varsa, backend versiyonunu kullan
          const pendingMessagesToKeep = pendingMessages.filter(pendingMsg => {
            // CRITICAL FIX: convertedMessages array kontrolü
            if (!convertedMessages || !Array.isArray(convertedMessages)) {
              return true; // convertedMessages geçerli değilse, pending mesajı koru
            }
            // Backend'de bu mesaj var mı kontrol et (içerik ve timestamp'e göre)
            // Daha geniş tolerans: 30 saniye (mesaj gönderildikten sonra backend'e kaydedilmesi zaman alabilir)
            const existsInBackend = convertedMessages.some(backendMsg => {
              const textMatch = backendMsg.text === pendingMsg.text;
              const timeDiff = Math.abs((new Date(backendMsg.timestamp).getTime() || 0) - (new Date(pendingMsg.timestamp).getTime() || 0));
              const timeMatch = timeDiff < 30000; // 30 saniye tolerans
              return textMatch && timeMatch;
            });
            
            if (existsInBackend) {
              console.log('[MessageDetail] 📥 Pending message found in backend, will use backend version:', pendingMsg.text);
            } else {
              console.log('[MessageDetail] 📥 Pending message not found in backend, keeping optimistic:', pendingMsg.text);
            }
            
            return !existsInBackend; // Backend'de yoksa koru
          });
          
          // Backend mesajları + henüz backend'e gitmemiş pending mesajlar
          const merged = [...convertedMessages, ...pendingMessagesToKeep];
          
          // ✅ WhatsApp Engine: Timestamp'e göre sırala (descending - en yeni başta, en eski sonda)
          // Inverted FlashList için: index 0 = en yeni mesaj (ekranın altında)
          // CRITICAL FIX: sentAt kullan (ISO timestamp, formatMessageTime string'i değil)
          merged.sort((a, b) => {
            const timeA = new Date(a.sentAt).getTime();
            const timeB = new Date(b.sentAt).getTime();
            return timeB - timeA; // Descending (en yeni başta, en eski sonda) - inverted FlashList için
          });
          
          console.log('[MessageDetail] 📥 Merged messages:', {
            backend: convertedMessages.length,
            pending: pendingMessages.length,
            kept: pendingMessagesToKeep.length,
            total: merged.length,
          });
          
          // ✅ WhatsApp Engine: En eski mesaj ID'sini kaydet (pagination için - inverted FlashList'te en eski mesaj dizinin sonunda)
          if (merged.length > 0) {
            setOldestMessageId(merged[merged.length - 1].id);
          }
          
          // Backend'den gelen pagination bilgisini kontrol et (hasMore)
          // getThreadMessages response'unda __pagination property'si var
          const paginationInfo = (threadMessages as any).__pagination;
          if (paginationInfo) {
            setHasMoreMessages(paginationInfo.hasMore || false);
          } else {
            // Fallback: Mesaj sayısı limit'e eşitse daha fazla mesaj olabilir
            setHasMoreMessages(convertedMessages.length >= 50);
          }
          
          return merged;
        });
        
        // ✅ Normal FlatList kullanıldığı için en yeni mesajlara scroll yap
        // Manuel scroll mantığına gerek yok - inverted prop otomatik hallediyor
      } else {
        console.log('[MessageDetail] 📭 No messages in thread yet');
        // Pending mesajları koru (henüz backend'e gitmemiş olanlar)
        setMessages((prev) => prev.filter(msg => msg.id.startsWith('pending-')));
      }
    } else if (!isLoadingMessages) {
      console.log('[MessageDetail] ⚠️ Thread messages is null/undefined');
      // Pending mesajları koru
      setMessages((prev) => prev.filter(msg => msg.id.startsWith('pending-')));
    }
    // CRITICAL FIX: params değerleri paramsRef.current üzerinden kullanılıyor, dependency'den çıkarıldı
    // queryClient stable olduğu için dependency'den çıkarıldı
    // safeScrollToEnd dependency'den çıkarıldı - flatListRef.current zaten güncel
  }, [threadMessages, isLoadingMessages, user?.id, threadId, isConnected, queryClient]);

  // 4️⃣ CHAT EKRANI AÇILDIĞINDA - Thread ID kontrolü, socket bağlantısı, thread join, event listener'lar
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    
    // recipientUserId yoksa, initialThreadId'den thread oluşturulup recipient bilgisi alınabilir
    // effectiveRecipientUserId state'i güncellenmiş olabilir (thread'den alınmış)
    const currentRecipientUserId = effectiveRecipientUserId || recipientUserId || initialThreadId;
    
    if (!currentRecipientUserId) {
      if (__DEV__) {
        console.warn('[MessageDetail] No recipientUserId or threadId found');
      }
      return;
    }

    let currentThreadId: string | null = null;

    const initializeChat = async () => {
      try {
        // 1. Thread ID kontrolü
        // Eğer initialThreadId varsa ve geçerli bir UUID formatındaysa, direkt threadId olarak kullan
        // (Inbox listesinden gelen threadId'yi kullan)
        if (initialThreadId && initialThreadId !== currentRecipientUserId && initialThreadId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // Thread ID zaten var (inbox listesinden geldi), direkt kullan
          console.log('[MessageDetail] ✅ Using existing threadId from inbox:', {
            initialThreadId,
            currentRecipientUserId,
            threadIdMatch: initialThreadId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? 'valid UUID' : 'invalid UUID',
          });
          currentThreadId = initialThreadId;
          setThreadId(initialThreadId);
          // AppStore'a aktif thread ID'sini kaydet (notification kontrolü için)
          setActiveThreadId(initialThreadId);
        } else {
          // Thread ID yoksa → REST API: POST /messages/threads ile oluştur/getir
          const { getOrCreateThread } = await import('../api/messagesApi');
          let thread;
          try {
            thread = await getOrCreateThread(currentRecipientUserId);
            currentThreadId = thread.id;
            console.log('[MessageDetail] ✅ Thread oluşturuldu/getirildi:', {
              threadId: thread.id,
              userOneId: thread.userOneId,
              userTwoId: thread.userTwoId,
              isSupportThread: thread.isSupportThread,
            });
            setThreadId(thread.id);
            // AppStore'a aktif thread ID'sini kaydet (notification kontrolü için)
            setActiveThreadId(thread.id);
            
            // recipientUserId yoksa, thread'den recipient bilgisi al (DM_THREAD.md'ye göre)
            // thread.userOneId ve thread.userTwoId'den current user olmayanı recipient olarak kullan
            if (!recipientUserId && thread && user?.id) {
              const otherUserId = getOtherUserIdFromThread(thread, user.id);
              if (otherUserId) {
                setEffectiveRecipientUserId(otherUserId);
                console.log('[MessageDetail] Extracted recipientUserId from thread:', otherUserId);
              }
            }
          } catch (error: any) {
            // 404 hatası: Thread endpoint backend'de henüz implement edilmemiş
            if (error?.response?.status === 404 || error?.isThreadEndpointNotFound) {
              console.info('[MessageDetail] Thread endpoint not available, using currentRecipientUserId as threadId (fallback mode)');
              currentThreadId = currentRecipientUserId;
              setThreadId(currentRecipientUserId);
              // AppStore'a aktif thread ID'sini kaydet (notification kontrolü için)
              setActiveThreadId(currentRecipientUserId);
            } else if (error?.response?.status === 500) {
              // 500 hatası: Backend hatası, fallback olarak currentRecipientUserId'yi threadId olarak kullan
              console.error('[MessageDetail] ⚠️ Backend error (500) when creating/getting thread, using fallback:', error?.response?.data);
              currentThreadId = currentRecipientUserId;
              setThreadId(currentRecipientUserId);
              // AppStore'a aktif thread ID'sini kaydet (notification kontrolü için)
              setActiveThreadId(currentRecipientUserId);
            } else {
              // Diğer hatalar için throw et
              throw error;
            }
          }
        }

        // 2. Socket bağlantısı kontrolü ve thread join
        if (isConnected && currentThreadId) {
          console.log('[MessageDetail] ✅ Socket connected, joining thread:', currentThreadId);
          joinThread(currentThreadId);
          setIsSocketReady(true);
          
          // ✅ Backend iyileştirmesi: GET /inbox/:threadId çağrıldığında backend otomatik olarak
          // tüm okunmamış mesajları isRead: true yapıyor ve thread_read socket event'i gönderiyor.
          // Bu yüzden frontend'de manuel olarak markThreadRead çağırmaya gerek yok.
          // thread_read event'i geldiğinde inbox listesi otomatik güncellenecek.
        } else {
          console.log('[MessageDetail] ⚠️ Socket not connected, will join when connected');
          setIsSocketReady(false);
        }
        
        // ✅ Backend otomatik okundu işaretleme yaptığı için inbox listesini optimistic update ile güncelle
        // Thread messages yüklendiğinde backend otomatik olarak thread'i okundu olarak işaretliyor
        // Bu yüzden inbox listesinde de optimistic update yapalım (yeşil tik anında kaybolsun)
        const queryKey = [...inboxKeys.messages(), undefined];
        
        console.log('[MessageDetail] 📥 THREAD MESSAGES YÜKLENDİ - Inbox listesi güncelleniyor');
        console.log(`[MessageDetail]   Thread ID: ${currentThreadId}`);
        console.log(`[MessageDetail]   Yüklenen mesaj sayısı: ${threadMessages?.length || 0}`);
        
        queryClient.setQueryData(queryKey, (oldData: any[] | undefined) => {
          if (!oldData) {
            console.log('[MessageDetail]   ⚠️ Inbox cache boş, güncelleme yapılamıyor');
            return oldData;
          }
          
          const threadBefore = oldData.find((m: any) => m.id === currentThreadId);
          if (threadBefore) {
            console.log('[MessageDetail]   Thread önceki durumu:');
            console.log(`[MessageDetail]     Thread ID: ${threadBefore.id}`);
            console.log(`[MessageDetail]     Sender: ${threadBefore.senderName || 'Unknown'}`);
            console.log(`[MessageDetail]     isUnread: ${threadBefore.isUnread}`);
            console.log(`[MessageDetail]     unreadCount: ${threadBefore.unreadCount || 0}`);
          }
          
          const updatedData = oldData.map((msg: any) => 
            msg.id === currentThreadId 
              ? { ...msg, isUnread: false, unreadCount: 0 }
              : msg
          );
          
          const threadAfter = updatedData.find((m: any) => m.id === currentThreadId);
          if (threadAfter) {
            console.log('[MessageDetail]   Thread sonraki durumu:');
            console.log(`[MessageDetail]     isUnread: ${threadAfter.isUnread} (ÖNCE: ${threadBefore?.isUnread})`);
            console.log(`[MessageDetail]     unreadCount: ${threadAfter.unreadCount || 0} (ÖNCE: ${threadBefore?.unreadCount || 0})`);
          }
          
          console.log('[MessageDetail] ✅ Inbox listesi güncellendi');
          return updatedData;
        });
        
        // Cache'i invalidate et (backend'den gelen yeni veri ile güncellenecek)
        queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });

        // 5. Mesaj geçmişini yükle (REST API)
        // useThreadMessages hook'u otomatik olarak yükleyecek
        if (currentThreadId) {
          console.log('[MessageDetail] 🔄 Refetching thread messages for thread:', currentThreadId);
          try {
            await refetchMessages();
          } catch (error: any) {
            // Thread mesajları yüklenemezse, sadece log'la ama ekranı açmaya devam et
            console.error('[MessageDetail] ⚠️ Failed to load thread messages:', {
              status: error?.response?.status,
              data: error?.response?.data,
              threadId: currentThreadId,
            });
            // Ekran açık kalır, sadece mesajlar yüklenmez (kullanıcı yeni mesaj gönderebilir)
          }
        }
      } catch (error: any) {
        console.error('[MessageDetail] Chat initialization error:', error);
        console.error('[MessageDetail] Error details:', {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          recipientUserId: currentRecipientUserId,
          initialThreadId,
        });
        
        // Fallback: currentRecipientUserId'yi threadId olarak kullan
        // Bu sayede en azından mesaj gönderme çalışabilir
        if (currentRecipientUserId) {
          if (__DEV__) {
            console.warn('[MessageDetail] Using fallback threadId:', currentRecipientUserId);
          }
          currentThreadId = currentRecipientUserId;
          setThreadId(currentRecipientUserId);
          // AppStore'a aktif thread ID'sini kaydet (notification kontrolü için)
          setActiveThreadId(currentRecipientUserId);
        } else {
          Alert.alert('Error', 'Failed to start chat. Please try again.');
        }
      }
    };

    initializeChat();

    // Cleanup (unmount):
    return () => {
      // Component unmount olduğunu işaretle (okundu işaretleme durdurulsun)
      isMountedRef.current = false;
      
      // AppStore'dan aktif thread ID'sini temizle (notification kontrolü için)
      setActiveThreadId(null);
      
      if (currentThreadId && isConnected) {
        console.log('[MessageDetail] 🔌 Leaving thread on unmount:', currentThreadId);
        leaveThread(currentThreadId);
      }
    };
  }, [recipientUserId, initialThreadId, user?.id, isConnected, joinThread, leaveThread, effectiveRecipientUserId, socketMarkThreadRead, getOtherUserIdFromThread, setActiveThreadId]);

  // Socket bağlantısı hazır olduğunda thread'e join et
  useEffect(() => {
    if (isConnected && threadId && !isSocketReady) {
      console.log('[MessageDetail] ✅ Socket connected, joining thread:', threadId);
      joinThread(threadId);
      setIsSocketReady(true);
      // AppStore'a aktif thread ID'sini kaydet (notification kontrolü için)
      setActiveThreadId(threadId);
    }
  }, [isConnected, threadId, isSocketReady, joinThread, setActiveThreadId]);

  // 9️⃣ SOCKET EVENT'LERİ ALINIR - new_message event handler
  const handleNewMessage = useCallback((eventData: any) => {
    console.log('[MessageDetail] 📨 New message received:', {
      threadId: eventData.threadId,
      currentThreadId: threadId,
      messageId: eventData.messageId,
      messageType: eventData.messageType,
      senderId: eventData.senderId,
    });

    const currentUserId = user?.id;
    const currentThreadId = threadId;

    // Bu mesaj bu thread'e ait mi kontrol et
    if (!currentThreadId) {
      console.log('[MessageDetail] ⚠️ No threadId yet, ignoring message');
      return;
    }

    if (eventData.threadId !== currentThreadId) {
      console.log('[MessageDetail] ⚠️ Thread ID mismatch, ignoring message:', {
        eventThreadId: eventData.threadId,
        currentThreadId,
      });
      return;
    }
    
    console.log('[MessageDetail] ✅ Processing message for current thread');

    // Mesaj tipine göre işle
    if (eventData.messageType === 'message') {
      // Normal mesaj
      // ✅ FIX: isSent hesaplaması - String karşılaştırması yap (tip uyumsuzluğu olabilir)
      const isSent = String(eventData.senderId) === String(currentUserId);
      const currentParams = paramsRef.current;
      console.log('[MessageDetail] 📨 New message event data:', {
        messageId: eventData.messageId,
        message: eventData.message,
        senderId: eventData.senderId,
        currentUserId,
        isSent,
        senderName: currentParams.senderName,
        hasAvatar: !!currentParams.senderAvatar,
      });
      const newMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: eventData.message || eventData.text || '', // Fallback için birden fazla field kontrol et
        timestamp: formatMessageTime(eventData.timestamp || eventData.sentAt),
        sentAt: eventData.timestamp || eventData.sentAt || new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
        isSent,
        senderId: eventData.senderId, // ✅ FIX: senderId ekle - isSent yeniden hesaplaması için gerekli
        senderName: isSent ? undefined : (currentParams.senderName || 'Unknown'),
        senderAvatar: isSent ? undefined : currentParams.senderAvatar,
        isRead: false, // Yeni mesaj henüz okunmadı
      };
      console.log('[MessageDetail] 📨 Created message item:', {
        id: newMessage.id,
        text: newMessage.text,
        isSent: newMessage.isSent,
        senderName: newMessage.senderName,
        hasAvatar: !!newMessage.senderAvatar,
      });

      setMessages((prev) => {
        // ✅ OPTIMIZE: Optimize format mantığı ile mesajı doğru pozisyona ekle
        // Duplicate kontrolü - eğer mesaj zaten varsa (gerçek ID ile), optimistic mesajı (pending- ile başlayan) gerçek mesajla değiştir
        const existingMessage = prev.find((msg) => msg.id === eventData.messageId);
        if (existingMessage) {
          console.log('[MessageDetail] 📨 Message already exists, skipping duplicate');
          return prev;
        }
        
        // Optimistic mesajı (pending- ile başlayan) gerçek mesajla değiştir
        const optimisticMessageIndex = prev.findIndex(
          (msg) => msg.id.startsWith('pending-') && 
                   msg.text === newMessage.text && 
                   msg.isSent === newMessage.isSent
        );
        
        if (optimisticMessageIndex !== -1) {
          console.log('[MessageDetail] 📨 Replacing optimistic message with real message:', {
            optimisticId: prev[optimisticMessageIndex].id,
            realId: eventData.messageId,
          });
          // Optimistic mesajı gerçek mesajla değiştir ve doğru pozisyona taşı
          const updated = prev.filter((_, idx) => idx !== optimisticMessageIndex);
          return insertMessageInOrder(updated, newMessage);
        }
        
        // ✅ OPTIMIZE: Yeni mesajı sentAt'a göre doğru pozisyona ekle (tarih gruplama ve mesaj gruplama mantığı)
        return insertMessageInOrder(prev, newMessage);
      });

      // Mesaj geldiğinde anında okundu işaretle (eğer kullanıcı ekrandaysa ve mesaj alıcı tarafından gönderildiyse)
      // Not: Gönderilen mesajlar zaten isSent=true, alınan mesajlar isSent=false
      if (!isSent && isSocketReady && threadId && isMountedRef.current) {
        // Alınan mesaj anında okundu işaretlenmeli (kullanıcı ekranda olduğu için)
        console.log('[MessageDetail] 📖 Marking received message as read immediately:', eventData.messageId);
        socketMarkMessageAsRead(eventData.messageId);
        
        // Optimistic update: Local state'te mesajı okundu olarak işaretle (sadece component mount ise)
        if (isMountedRef.current) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === eventData.messageId) {
                return {
                  ...msg,
                  isRead: true,
                  readAt: new Date().toISOString(),
                };
              }
              return msg;
            })
          );
        }
      }

      // ✅ WhatsApp Engine: Inverted FlashList'te scrollToIndex(0) = en yeni mesajlara scroll (altta)
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    } else if (eventData.messageType === 'image' || eventData.messageType === 'video' || eventData.messageType === 'audio' || eventData.messageType === 'file') {
      // Image/Video/Audio/File mesajı - Backend'den gelen new_message event'i
      // ✅ FIX: isSent hesaplaması - String karşılaştırması yap (tip uyumsuzluğu olabilir)
      const isSent = String(eventData.senderId) === String(currentUserId);
      console.log('[MessageDetail] 📷 Media message received:', {
        messageId: eventData.messageId,
        messageType: eventData.messageType,
        mediaUrl: eventData.mediaUrl,
        senderId: eventData.senderId,
        currentUserId,
        isSent,
      });
      
      const currentParams = paramsRef.current;
      const newMediaMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: eventData.message || eventData.caption || '', // Caption varsa
        timestamp: formatMessageTime(eventData.timestamp || eventData.sentAt),
        sentAt: eventData.timestamp || eventData.sentAt || new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
        isSent,
        senderId: eventData.senderId, // ✅ FIX: senderId ekle - isSent yeniden hesaplaması için gerekli
        senderName: isSent ? undefined : (currentParams.senderName || 'Unknown'),
        senderAvatar: isSent ? undefined : currentParams.senderAvatar,
        type: eventData.messageType === 'image' ? 'image' : 'message',
        mediaUrl: eventData.mediaUrl,
        mediaType: eventData.messageType,
        thumbnailUrl: eventData.thumbnailUrl,
        // ✅ Image dimensions (backend'den gelebilir)
        dimensions: eventData.dimensions || eventData.content?.dimensions,
        isRead: false,
      };
      
      setMessages((prev) => {
        // ✅ OPTIMIZE: Optimize format mantığı ile mesajı doğru pozisyona ekle
        // Duplicate kontrolü
        const existingMessage = prev.find((msg) => msg.id === eventData.messageId);
        if (existingMessage) {
          console.log('[MessageDetail] 📷 Media message already exists, skipping duplicate');
          return prev;
        }
        
        // Optimistic mesajı (pending-image- ile başlayan) gerçek mesajla değiştir
        const optimisticMessageIndex = prev.findIndex(
          (msg) => msg.id.startsWith('pending-image-') && 
                   msg.isSent === isSent &&
                   msg.type === 'image'
        );
        
        if (optimisticMessageIndex !== -1) {
          console.log('[MessageDetail] 📷 Replacing optimistic image message with real message:', {
            optimisticId: prev[optimisticMessageIndex].id,
            realId: eventData.messageId,
          });
          // ✅ FIX: Optimistic mesajı gerçek mesajla değiştir, pozisyonu koru
          // Sadece optimistic mesajı gerçek mesajla değiştir, tüm listeyi yeniden sıralama
          const updated = [...prev];
          updated[optimisticMessageIndex] = {
            ...updated[optimisticMessageIndex],
            id: eventData.messageId,
            mediaUrl: eventData.mediaUrl || updated[optimisticMessageIndex].mediaUrl,
            thumbnailUrl: eventData.thumbnailUrl || updated[optimisticMessageIndex].thumbnailUrl,
            uploadStatus: 'uploaded',
            uploadProgress: 100,
            sentAt: eventData.timestamp || eventData.sentAt || updated[optimisticMessageIndex].sentAt,
          };
          return updated;
        }
        
        // ✅ OPTIMIZE: Yeni mesajı sentAt'a göre doğru pozisyona ekle
        return insertMessageInOrder(prev, newMediaMessage);
      });
      
      // Mesaj geldiğinde anında okundu işaretle
      if (!isSent && isSocketReady && threadId && isMountedRef.current) {
        console.log('[MessageDetail] 📖 Marking received media message as read immediately:', eventData.messageId);
        socketMarkMessageAsRead(eventData.messageId);
        
        if (isMountedRef.current) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === eventData.messageId) {
                return {
                  ...msg,
                  isRead: true,
                  readAt: new Date().toISOString(),
                };
              }
              return msg;
            })
          );
        }
      }
      
      // ✅ WhatsApp Engine: Inverted FlashList'te scrollToIndex(0) = en yeni mesajlara scroll (altta)
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    } else if (eventData.messageType === 'send-tips') {
      // TIPS mesajı - anında local state'e ekle
      // ✅ FIX: isSent hesaplaması - String karşılaştırması yap (tip uyumsuzluğu olabilir)
      const isSent = String(eventData.senderId) === String(currentUserId);
      console.log('[MessageDetail] 💰 TIPS message received:', {
        messageId: eventData.messageId,
        amount: eventData.amount,
        message: eventData.message,
        senderId: eventData.senderId,
        currentUserId,
        isSent,
      });
      
      // TIPS mesajını formatla
      const tipsAmount = eventData.amount || 0;
      const tipsMessageText = eventData.message || '';
      
      const currentParams = paramsRef.current;
      const newTipsMessage: MessageDetailItem = {
        id: eventData.messageId,
        text: tipsMessageText,
        timestamp: formatMessageTime(eventData.timestamp || eventData.sentAt),
        sentAt: eventData.timestamp || eventData.sentAt || new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
        isSent,
        senderId: eventData.senderId, // ✅ FIX: senderId ekle - isSent yeniden hesaplaması için gerekli
        senderName: isSent ? undefined : (currentParams.senderName || 'Unknown'),
        senderAvatar: isSent ? undefined : currentParams.senderAvatar,
        type: 'tips',
        tipsAmount: tipsAmount,
        isRead: false,
      };
      
      setMessages((prev) => {
        // ✅ OPTIMIZE: Optimize format mantığı ile mesajı doğru pozisyona ekle
        // Duplicate kontrolü
        const existingMessage = prev.find((msg) => msg.id === eventData.messageId);
        if (existingMessage) {
          console.log('[MessageDetail] 💰 TIPS message already exists, skipping duplicate');
          return prev;
        }
        
        // Optimistic mesajı (pending-tips- ile başlayan) gerçek mesajla değiştir
        // TIPS mesajları için amount ve text'e göre eşleştir
        const optimisticMessageIndex = prev.findIndex(
          (msg) => msg.id.startsWith('pending-tips-') && 
                   msg.isSent === isSent &&
                   msg.type === 'tips' &&
                   Math.abs((msg.tipsAmount || 0) - tipsAmount) < 0.01 // Amount eşleşiyor mu (float karşılaştırması)
        );
        
        if (optimisticMessageIndex !== -1) {
          console.log('[MessageDetail] 💰 Replacing optimistic TIPS message with real message:', {
            optimisticId: prev[optimisticMessageIndex].id,
            realId: eventData.messageId,
            optimisticAmount: prev[optimisticMessageIndex].tipsAmount,
            realAmount: tipsAmount,
            optimisticText: prev[optimisticMessageIndex].text,
            realText: tipsMessageText,
          });
          // Optimistic mesajı gerçek mesajla değiştir ve doğru pozisyona taşı
          const updated = prev.filter((_, idx) => idx !== optimisticMessageIndex);
          const finalMessages = insertMessageInOrder(updated, newTipsMessage);
          
          // ✅ TIPS sonrası detaylı log - Socket event geldiğinde
          console.log('[MessageDetail] 💰 TIPS SOCKET EVENT - Full Details:', {
            eventData: eventData,
            messageId: eventData.messageId,
            amount: tipsAmount,
            message: tipsMessageText,
            senderId: eventData.senderId,
            currentUserId: currentUserId,
            isSent: isSent,
            threadId: eventData.threadId,
            currentThreadId: currentThreadId,
            timestamp: eventData.timestamp || eventData.sentAt,
            optimisticMessageIndex: optimisticMessageIndex,
            optimisticMessageId: prev[optimisticMessageIndex]?.id,
            messagesCountBefore: prev.length,
            messagesCountAfter: finalMessages.length,
            optimisticMessageReplaced: true,
          });
          
          return finalMessages;
        }
        
        // ✅ OPTIMIZE: Yeni mesajı sentAt'a göre doğru pozisyona ekle
        const finalMessages = insertMessageInOrder(prev, newTipsMessage);
        
        // ✅ TIPS sonrası detaylı log - Socket event geldiğinde (optimistic mesaj bulunamadı)
        console.log('[MessageDetail] 💰 TIPS SOCKET EVENT - Full Details (No Optimistic):', {
          eventData: eventData,
          messageId: eventData.messageId,
          amount: tipsAmount,
          message: tipsMessageText,
          senderId: eventData.senderId,
          currentUserId: currentUserId,
          isSent: isSent,
          threadId: eventData.threadId,
          currentThreadId: currentThreadId,
          timestamp: eventData.timestamp || eventData.sentAt,
          messagesCountBefore: prev.length,
          messagesCountAfter: finalMessages.length,
          optimisticMessageReplaced: false,
        });
        
        return finalMessages;
      });
      
      // Mesaj geldiğinde anında okundu işaretle (eğer kullanıcı ekrandaysa ve mesaj alıcı tarafından gönderildiyse)
      if (!isSent && isSocketReady && threadId && isMountedRef.current) {
        console.log('[MessageDetail] 📖 Marking received TIPS message as read immediately:', eventData.messageId);
        socketMarkMessageAsRead(eventData.messageId);
        
        if (isMountedRef.current) {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === eventData.messageId) {
                return {
                  ...msg,
                  isRead: true,
                  readAt: new Date().toISOString(),
                };
              }
              return msg;
            })
          );
        }
      }
      
      // ✅ WhatsApp Engine: Inverted FlashList'te scrollToIndex(0) = en yeni mesajlara scroll (altta)
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    } else if (eventData.messageType === 'support-request') {
      // Support request mesajı - şu an için sadece log
      console.log('[MessageDetail] Support request received:', eventData);
      // TODO: Support request mesajını UI'da göster
    }

    // Mesaj listesini invalidate et (inbox listesini güncelle)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    
    // Thread mesajlarını da invalidate et (refetch otomatik olarak yapılacak)
    if (currentThreadId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(currentThreadId) });
    }
    // CRITICAL FIX: refetchMessages dependency'den çıkarıldı - queryClient.invalidateQueries yeterli
  }, [user?.id, threadId, isSocketReady]);

  // 9️⃣ SOCKET EVENT'LERİ ALINIR - message_sent event handler (gönderici onayı)
  const handleMessageSent = useCallback((eventData: any) => {
    console.log('[MessageDetail] ✅ Message sent confirmation:', eventData);
    
    // Thread ID kontrolü - eventData'da threadId yoksa recipientId ile kontrol et
    const eventThreadId = eventData.threadId;
    if (eventThreadId && eventThreadId !== threadId) {
      return;
    }

    const messageText = eventData.message || eventData.text || '';
    const messageId = eventData.messageId;
    const messageType = eventData.messageType; // TIPS mesajları için 'send-tips'
    const tipsAmount = eventData.amount || 0;
    
    if (!messageId) {
      if (__DEV__) {
        console.warn('[MessageDetail] ⚠️ message_sent event missing messageId');
      }
      return;
    }

    // ✅ FIX: TIPS mesajları için özel işlem
    if (messageType === 'send-tips') {
      console.log('[MessageDetail] 💰 TIPS message_sent event received:', {
        messageId,
        amount: tipsAmount,
        message: messageText,
      });
      
      setMessages((prev) => {
        if (!prev || !Array.isArray(prev)) {
          return prev || [];
        }
        
        // Eğer mesaj zaten gerçek ID ile varsa (new_message event'i önce gelmiş), hiçbir şey yapma
        const alreadyExists = prev.some(msg => msg.id === messageId);
        if (alreadyExists) {
          console.log('[MessageDetail] ✅ TIPS message already exists with real ID, skipping update');
          return prev;
        }

        // Optimistic TIPS mesajını bul (pending-tips- ile başlayan, amount eşleşen, gönderilen mesaj)
        const optimisticIndex = prev.findIndex(
          (msg) => 
            msg.id.startsWith('pending-tips-') && 
            msg.isSent &&
            msg.type === 'tips' &&
            Math.abs((msg.tipsAmount || 0) - tipsAmount) < 0.01 // Amount eşleşiyor mu (float karşılaştırması)
        );

        if (optimisticIndex !== -1) {
          console.log('[MessageDetail] ✅ Updating optimistic TIPS message with real ID:', messageId);
          const updated = [...prev];
          updated[optimisticIndex] = {
            ...updated[optimisticIndex],
            id: messageId,
          };
          return updated;
        }

        // Optimistic mesaj bulunamadı, yeni TIPS mesajı ekle
        console.log('[MessageDetail] ⚠️ Optimistic TIPS message not found, adding new TIPS message');
        const newTipsMessage: MessageDetailItem = {
          id: messageId,
          text: messageText,
          timestamp: formatMessageTime(eventData.timestamp || new Date()),
          sentAt: eventData.timestamp || new Date().toISOString(),
          isSent: true,
          senderId: user?.id, // ✅ FIX: senderId ekle
          type: 'tips',
          tipsAmount: tipsAmount,
          isRead: false,
        };
        return insertMessageInOrder(prev, newTipsMessage);
      });
      
      // Inbox listesini invalidate et
      queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
      if (threadId) {
        queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
      }
      return;
    }

    // Normal text mesajları için mevcut mantık
    // Optimistic update'teki mesajı gerçek mesaj ID'si ile güncelle
    setMessages((prev) => {
      // CRITICAL FIX: prev array kontrolü
      if (!prev || !Array.isArray(prev)) {
        return prev || [];
      }
      // Eğer mesaj zaten gerçek ID ile varsa (new_message event'i önce gelmiş), hiçbir şey yapma
      const alreadyExists = prev.some(msg => msg.id === messageId);
      if (alreadyExists) {
        console.log('[MessageDetail] ✅ Message already exists with real ID, skipping update');
        return prev;
      }

      // Optimistic mesajı bul (pending- ile başlayan, içerik eşleşen, gönderilen mesaj)
      const optimisticIndex = prev.findIndex(
        (msg) => 
          msg.id.startsWith('pending-') && 
          !msg.id.startsWith('pending-tips-') && // TIPS mesajlarını hariç tut
          msg.text === messageText && 
          msg.isSent
      );

      if (optimisticIndex !== -1) {
        console.log('[MessageDetail] ✅ Updating optimistic message with real ID:', messageId);
        // ✅ FIX: Sadece ID'yi güncelle, pozisyonu koru (zaten doğru pozisyonda)
        // Optimistic mesaj zaten insertMessageInOrder ile doğru pozisyona eklenmişti
        const updated = [...prev];
        updated[optimisticIndex] = {
          ...updated[optimisticIndex],
          id: messageId,
        };
        
        // Gönderilen mesaj için anında okundu işaretleme (eğer alıcı ekrandaysa backend'den message_read event'i gelecek)
        // Şimdilik optimistic update yapmıyoruz çünkü alıcının ekranda olup olmadığını bilmiyoruz
        // Backend'den message_read event'i geldiğinde handleMessageRead'de işaretlenecek
        
        return updated;
      }

      // Optimistic mesaj bulunamadı (new_message event'i önce gelmiş olabilir veya başka bir sorun)
      // Eğer mesaj zaten yoksa, ekle (güvenlik için)
      // CRITICAL FIX: prev array kontrolü (yukarıda zaten yapıldı ama yine de güvenli olmak için)
      const messageExists = Array.isArray(prev) && prev.some(msg => msg.text === messageText && msg.isSent);
      if (!messageExists && messageText) {
        console.log('[MessageDetail] ⚠️ Optimistic message not found, adding new message');
        const newMessage: MessageDetailItem = {
          id: messageId,
          text: messageText,
          timestamp: formatMessageTime(eventData.timestamp || new Date()),
          sentAt: eventData.timestamp || new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
          isSent: true,
          isRead: false,
        };
        // ✅ FIX: Yeni mesajı doğru pozisyona ekle (sentAt'a göre sıralı)
        return insertMessageInOrder(prev, newMessage);
      }

      return prev;
    });

    // Inbox listesini invalidate et (mesaj listesini güncelle)
              queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    
    // Thread mesajlarını da invalidate et (yeniden yüklensin)
    // Bu sayede kullanıcı ekrandan çıkıp geri girdiğinde mesajlar görünür
    if (threadId) {
      queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(threadId) });
    }
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
  }, [threadId, user?.id]);

  // Thread event handlers
  const handleThreadJoined = useCallback((data: { threadId: string }) => {
    console.log('[MessageDetail] ========================================');
    console.log('[MessageDetail] ✅ THREAD JOINED EVENT RECEIVED');
    console.log('[MessageDetail] ========================================');
    console.log('[MessageDetail]    - Thread ID:', data.threadId);
    console.log('[MessageDetail]    - Current Thread ID:', threadId);
    console.log('[MessageDetail]    - Match:', data.threadId === threadId ? '✅' : '❌');
    
    // ✅ Backend iyileştirmesi: GET /inbox/:threadId çağrıldığında backend otomatik olarak
    // tüm okunmamış mesajları isRead: true yapıyor ve thread_read socket event'i gönderiyor.
    // Bu yüzden frontend'de manuel olarak markThreadRead çağırmaya gerek yok.
    // thread_read event'i geldiğinde inbox listesi otomatik güncellenecek.
    if (data.threadId === threadId) {
      console.log('[MessageDetail] ✅ Thread joined. Backend automatically marks messages as read when GET /inbox/:threadId is called.');
      console.log('[MessageDetail] 🔄 Waiting for thread_read event to update inbox list...');
    }
    // CRITICAL FIX: queryClient, socketMarkThreadRead, markThreadAsReadMutation stable olduğu için dependency'den çıkarıldı
  }, [threadId]);

  const handleThreadLeft = useCallback((data: { threadId: string }) => {
    console.log('[MessageDetail] Thread left:', data.threadId);
  }, []);

  const handleThreadJoinError = useCallback((error: { threadId: string; reason: string }) => {
    console.error('[MessageDetail] Thread join error:', error.reason);
    Alert.alert('Error', `Failed to join thread: ${error.reason}`);
  }, []);

  const handleMessageSendError = useCallback((error: { reason: string }) => {
    console.error('[MessageDetail] Message send error:', error.reason);
    Alert.alert('Error', `Failed to send message: ${error.reason}`);
  }, []);

  // Typing indicator handler
  const handleUserTyping = useCallback((data: { userId: string; threadId: string; isTyping: boolean }) => {
    // Component unmount olduysa işlem yapma
    if (!isMountedRef.current) {
          return;
        }
        
    console.log('[MessageDetail] 👤 User typing event received:', {
      userId: data.userId,
      threadId: data.threadId,
      currentThreadId: threadId,
      isTyping: data.isTyping,
      currentUserId: user?.id,
    });
    
    // Thread ID kontrolü
    if (data.threadId !== threadId) {
      console.log('[MessageDetail] ⚠️ Thread ID mismatch, ignoring typing event');
      return;
    }
    
    // Sadece karşı kullanıcının typing durumunu göster (kendi typing durumumuzu gösterme)
    if (data.userId === user?.id) {
      console.log('[MessageDetail] ⚠️ Ignoring own typing event');
      return;
    }
    
    // Typing durumunu güncelle
    if (isMountedRef.current) {
      setIsTyping(data.isTyping);
      setTypingUserId(data.isTyping ? data.userId : null);
    }

    // Typing indicator'ı 3 saniye sonra otomatik kapat
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (data.isTyping && isMountedRef.current) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setIsTyping(false);
          setTypingUserId(null);
        }
      }, 3000);
    }
  }, [threadId, user?.id]);

  // Message read handler
  // Thread read event handler - thread okundu olarak işaretlendiğinde
  // ✅ Backend iyileştirmesi: thread_read event'ine unreadCount ve isUnread eklendi
  const handleThreadRead = useCallback((data: { 
    threadId: string; 
    readBy: string; 
    timestamp: string;
    unreadCount?: number;  // YENİ - Backend'den gelen unreadCount
    isUnread?: boolean;    // YENİ - Backend'den gelen isUnread
  }) => {
    console.log('[MessageDetail] 📖 THREAD_READ EVENT ALINDI:', {
      eventThreadId: data.threadId,
      currentThreadId: threadId,
      readBy: data.readBy,
      timestamp: data.timestamp,
      unreadCount: data.unreadCount,
      isUnread: data.isUnread,
      matches: data.threadId === threadId,
      isMounted: isMountedRef.current,
    });
    
    // Thread ID kontrolü
    if (data.threadId !== threadId) {
      console.log('[MessageDetail] ⚠️ Thread ID mismatch, ignoring event');
      return;
    }
    
    console.log('[MessageDetail] ✅ Thread ID matches, processing thread_read event');
    
    // ✅ Backend'den gelen unreadCount ve isUnread değerlerini kullan
    const unreadCount = data.unreadCount !== undefined ? data.unreadCount : 0;
    const isUnread = data.isUnread !== undefined ? data.isUnread : false;
    
    // CRITICAL FIX: Component unmount olsa bile inbox listesini güncelle
    // Kullanıcı mesaj detayından çıktığında inbox listesinde yeşil tik görünmemeli
    // ✅ FIX: Tüm olası query key'leri güncelle (searchParams farklı olabilir)
    // MessagesScreen'de farklı searchParams ile çağrılabilir, bu yüzden tüm kombinasyonları güncelle
    const allQueryKeys = queryClient.getQueryCache().findAll({
      queryKey: inboxKeys.messages(),
    });
    
    console.log('[MessageDetail] 🔑 Found query keys for thread_read event:', allQueryKeys.map(q => q.queryKey));
    
    // Tüm query key'leri güncelle
    allQueryKeys.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (oldData: any[] | undefined) => {
      console.log('[MessageDetail] 📊 THREAD_READ UPDATE - Önceki durum:', oldData?.map((m: any) => ({ id: m.id, isUnread: m.isUnread, unreadCount: m.unreadCount })));
      if (!oldData) {
        if (__DEV__) {
          console.warn('[MessageDetail] ⚠️ Old data is null/undefined in thread_read handler');
        }
        return oldData;
      }
      
      const threadBefore = oldData.find((m: any) => m.id === data.threadId);
      if (threadBefore) {
        console.log('[MessageDetail]   Thread önceki durumu:');
        console.log(`[MessageDetail]     Thread ID: ${threadBefore.id}`);
        console.log(`[MessageDetail]     Sender: ${threadBefore.senderName || 'Unknown'}`);
        console.log(`[MessageDetail]     isUnread: ${threadBefore.isUnread}`);
        console.log(`[MessageDetail]     unreadCount: ${threadBefore.unreadCount || 0}`);
      }
      
      // ✅ Backend'den gelen değerleri kullan
      const updatedData = oldData.map((msg: any) => 
        msg.id === data.threadId 
          ? { ...msg, isUnread, unreadCount }
          : msg
      );
      
      const threadAfter = updatedData.find((m: any) => m.id === data.threadId);
      if (threadAfter) {
        console.log(`[MessageDetail]   Thread sonraki durumu (Backend'den gelen değerler):`);
        console.log(`[MessageDetail]     isUnread: ${threadAfter.isUnread} (ÖNCE: ${threadBefore?.isUnread}, Backend: ${isUnread})`);
        console.log(`[MessageDetail]     unreadCount: ${threadAfter.unreadCount || 0} (ÖNCE: ${threadBefore?.unreadCount || 0}, Backend: ${unreadCount})`);
      }
      
        console.log('[MessageDetail] ✅ THREAD_READ UPDATE - Sonraki durum:', updatedData.map((m: any) => ({ id: m.id, isUnread: m.isUnread, unreadCount: m.unreadCount })));
        return updatedData;
      });
    });
    
    // ✅ FIX: Tüm messages query'lerini invalidate et ki UI güncellensin
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    
    // ✅ Backend iyileştirmesi: invalidateQueries kaldırıldı
    // Backend'den gelen unreadCount ve isUnread değerleri zaten setQueryData ile cache'e yazıldı
    // invalidateQueries gereksiz refetch yapıp performansı düşürüyor
    // Sadece kontrollü cache güncellemesi yeterli
    
    // Local state'teki mesajları okundu olarak işaretle (sadece component mount ise)
    if (isMountedRef.current) {
      setMessages((prev) =>
        prev.map((msg) => ({
          ...msg,
          isRead: true,
        }))
      );
    }
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
  }, [threadId]);

  const handleMessageRead = useCallback((data: { messageId: string; threadId: string; readBy: string; timestamp: string }) => {
    // Component unmount olduysa işlem yapma
    if (!isMountedRef.current) {
      return;
    }
    
    if (data.threadId === threadId) {
      // Mesajı okundu olarak işaretle (sadece component mount ise)
      if (isMountedRef.current) {
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
    }
    // CRITICAL FIX: threadId dependency olarak yeterli
  }, [threadId]);

  // Handle Go to Support Chat (accepted request'ler için)
  // Bu fonksiyon handleSupportRequestAccepted'tan önce tanımlanmalı
  const handleGoToSupportChat = useCallback((supportThreadId: string, requestId: string) => {
    if (!supportThreadId) {
      Alert.alert('Error', 'Support thread ID not found');
      return;
    }

    // SupportMessageDetail ekranı için gerekli parametreleri hazırla
    // expertName, expertTitle, expertAvatar: Karşı tarafın (recipient) bilgileri
    // userName, userTitle, userAvatar: Mevcut kullanıcının bilgileri
    const currentUserId = user?.id;
    const finalRecipientUserId = effectiveRecipientUserId || routeParams.recipientUserId;
    
    // Eğer current user sender ise, expert = recipient
    // Eğer current user recipient ise, expert = sender
    // Şimdilik params'dan gelen bilgileri kullanıyoruz
    const expertName = params.senderName || 'Unknown';
    const expertTitle = params.senderTitle || '';
    const expertAvatar = params.senderAvatar || DEFAULT_USER_AVATAR;
    
    // Mevcut kullanıcının bilgileri (user store'dan alınabilir)
    const userName = user?.fullName || 'You';
    const userTitle = ''; // User interface'inde title yok
    const userAvatar = user?.avatar ? toImageSource(user.avatar) : DEFAULT_USER_AVATAR;

    console.log('[MessageDetail] 🔗 Navigating to support chat:', { 
      threadId: supportThreadId, 
      requestId,
      expertName,
      expertTitle,
      userName,
      userTitle,
    });
    
    navigateToSharedScreenWithPruning(ROOT_ROUTES.SUPPORT_MESSAGE_DETAIL, {
      threadId: supportThreadId,
      requestId: requestId,
      expertName: expertName,
      expertTitle: expertTitle,
      expertAvatar: expertAvatar,
      userName: userName,
      userTitle: userTitle,
      userAvatar: userAvatar,
      status: 'active', // Support thread aktif olduğu için
    });
  }, [user, effectiveRecipientUserId, routeParams, params.senderName, params.senderTitle, params.senderAvatar]);

  // Support Request Event Handlers
  const handleSupportRequestAccepted = useCallback((data: { requestId: string; threadId: string }) => {
    console.log('[MessageDetail] ✅ Support request accepted event:', data);
    
    // Local state'te support request'i accepted olarak güncelle
    if (isMountedRef.current) {
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
    }
    
    // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
    
    // Support thread'e yönlendir (eğer kullanıcı recipient ise)
    if (data.threadId) {
      setTimeout(() => {
        handleGoToSupportChat(data.threadId, data.requestId);
      }, 500);
    }
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
  }, [handleGoToSupportChat, queryClient]);

  const handleSupportRequestRejected = useCallback((data: { requestId: string }) => {
    console.log('[MessageDetail] ❌ Support request rejected event:', data);
    
    // Local state'te support request'i rejected olarak güncelle
    if (isMountedRef.current) {
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
    }
    
    // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
  }, [queryClient]);

  const handleSupportRequestCancelled = useCallback((data: { requestId: string }) => {
    console.log('[MessageDetail] 🚫 Support request cancelled event:', data);
    
    // Local state'te support request'i canceled olarak güncelle
    if (isMountedRef.current) {
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
    }
    
    // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et (realtime güncelleme için)
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
    queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
  }, [queryClient]);

  // Handle Message Deleted (socket event)
  const handleMessageDeleted = useCallback((eventData: { messageId: string; threadId?: string }) => {
    console.log('[MessageDetail] 🗑️ Message deleted event:', eventData);
    
    const currentThreadId = threadId;
    
    // Thread ID kontrolü
    if (eventData.threadId && eventData.threadId !== currentThreadId) {
      return;
    }
    
    // Local state'ten mesajı kaldır
    if (isMountedRef.current) {
      setMessages((prev) => prev.filter((msg) => msg.id !== eventData.messageId));
    }
    
    // ✅ FIX: Query invalidation kaldırıldı - socket event'leri zaten state'i güncelledi
  }, [threadId]);

  // Handle Message Reaction Event (from socket)
  const handleMessageReaction = useCallback((eventData: { messageId: string; emoji: string; userId: string; count?: number; users?: string[] }) => {
    console.log('[MessageDetail] 😀 Message reaction event:', eventData);
    
    if (!eventData.messageId || !eventData.emoji) {
      return;
    }

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === eventData.messageId) {
          const existingReactions = msg.reactions || [];
          const reactionIndex = existingReactions.findIndex((r) => r.emoji === eventData.emoji);
          
          let updatedReactions: typeof existingReactions;
          if (reactionIndex !== -1) {
            // Reaction already exists, update count
            updatedReactions = [...existingReactions];
            updatedReactions[reactionIndex] = {
              ...updatedReactions[reactionIndex],
              count: eventData.count || updatedReactions[reactionIndex].count + 1,
              users: eventData.users || [...(updatedReactions[reactionIndex].users || []), eventData.userId],
            };
          } else {
            // New reaction
            updatedReactions = [
              ...existingReactions,
              {
                emoji: eventData.emoji,
                count: eventData.count || 1,
                users: eventData.users || [eventData.userId],
              },
            ];
          }
          
          return {
            ...msg,
            reactions: updatedReactions,
          };
        }
        return msg;
      })
    );
  }, []);

  // Mesaj okundu işaretleme - Mesaj görünür olduğunda otomatik okundu işaretle
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // Mesajın %50'si görünür olduğunda
    minimumViewTime: 100, // En az 100ms görünür olmalı
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: any[] }) => {
      // Component unmount olduysa okundu işaretleme yapma
      if (!isMountedRef.current) {
        return;
      }
      
      // Görünür olan mesajları okundu olarak işaretle (sadece gönderilen mesajlar için)
      viewableItems.forEach(({ item }) => {
        if (item.isSent && !item.isRead && item.id && !item.id.startsWith('pending-')) {
          // Component hala mount mu kontrol et
          if (!isMountedRef.current) {
            return;
          }
          
          console.log('[MessageDetail] 👁️ Marking message as read:', item.id);
          // Local state'i güncelle
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id === item.id && msg.isSent && !msg.isRead) {
                return {
                  ...msg,
                  isRead: true,
                  readAt: new Date().toISOString(),
                };
              }
              return msg;
            })
          );
          
          // Socket ile backend'e bildir (eğer threadId varsa ve component hala mount)
          if (threadId && socketMarkMessageAsRead && isMountedRef.current) {
            socketMarkMessageAsRead(item.id);
          }
        }
      });
    },
    [threadId, socketMarkMessageAsRead]
  );

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  // Component mount/unmount lifecycle yönetimi
  useEffect(() => {
    // Component mount olduğunda isMountedRef'i true yap
    isMountedRef.current = true;
    
    return () => {
      // Component unmount olduğunda isMountedRef'i false yap (okundu işaretleme durdurulsun)
      isMountedRef.current = false;
    };
  }, []);

  // Open tips modal if requested from route params
  useEffect(() => {
    if (params.openSendTips && params.senderName) {
      // Kısa bir delay ile modalı aç (ekran render olana kadar bekle)
      const timer = setTimeout(() => {
        handleSendTipsPress();
      }, 300);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.openSendTips, params.senderName]);

  // Socket event listeners effect
  // Event listener'ları socket bağlantısı hazır olduğunda hemen ekle (isSocketReady kontrolü kaldırıldı)
  // Thread ID yoksa bile genel event'leri dinle (thread ID geldiğinde zaten thread'e özel event'ler çalışacak)
  useEffect(() => {
    if (!isConnected) {
      console.log('[MessageDetail] ⚠️ Socket not connected, skipping event listeners');
      return;
    }

    console.log('[MessageDetail] 📡 Adding socket event listeners (threadId:', threadId, 'isSocketReady:', isSocketReady, ')');

    // Event listener'ları ekle (threadId yoksa bile ekle, threadId geldiğinde zaten çalışacak)
    on('new_message', handleNewMessage);
    on('message_sent', handleMessageSent);
    on('thread_joined', handleThreadJoined);
    on('thread_left', handleThreadLeft);
    on('thread_join_error', handleThreadJoinError);
    on('message_send_error', handleMessageSendError);
    on('user_typing', handleUserTyping);
    on('message_read', handleMessageRead);
    on('thread_read', handleThreadRead);
    // Message reaction event
    on('message_reaction', handleMessageReaction);
    // Support request event'leri
    on('support_request_accepted', handleSupportRequestAccepted);
    on('support_request_rejected', handleSupportRequestRejected);
    on('support_request_cancelled', handleSupportRequestCancelled);
    // Message deleted event
    on('message_deleted', handleMessageDeleted);

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
      off('thread_read', handleThreadRead);
      // Message reaction event
      off('message_reaction', handleMessageReaction);
      // Support request event'leri
      off('support_request_accepted', handleSupportRequestAccepted);
      off('support_request_rejected', handleSupportRequestRejected);
      off('support_request_cancelled', handleSupportRequestCancelled);
      // Message deleted event
      off('message_deleted', handleMessageDeleted);

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
    // CRITICAL FIX: Socket fonksiyonları (on, off, socketStopTyping, leaveThread) stable olduğu için dependency array'den çıkarıldı
    // Sadece handler callback'leri ve threadId, isConnected gibi değişken değerleri dependency olarak kalmalı
  }, [isConnected, threadId, handleNewMessage, handleMessageSent, handleThreadJoined, handleThreadLeft, handleThreadJoinError, handleMessageSendError, handleUserTyping, handleMessageRead, handleThreadRead, handleMessageReaction, handleSupportRequestAccepted, handleSupportRequestRejected, handleSupportRequestCancelled, handleMessageDeleted]);

  // Handle Share
  const handleShare = useCallback(async () => {
    if (!effectiveRecipientUserId || !params.senderName) return;
    try {
      await Share.share({
        message: `Check out ${params.senderName}'s profile on Tipbox!`,
        url: `tipboxapp://profile/user/${effectiveRecipientUserId}`,
      });
    } catch (error) {
      console.error('[MessageDetail] Share error:', error);
    }
  }, [effectiveRecipientUserId, params.senderName]);

  // Handle Report
  const handleReport = useCallback(() => {
    if (!user?.id || !effectiveRecipientUserId) return;
    
    Alert.alert(
      'Report User',
      'Are you sure you want to report this user?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            reportUserMutation.mutate({
              userId: user.id,
              targetUserId: effectiveRecipientUserId,
              data: {
                category: 'OTHER',
                description: 'User reported from message detail',
              },
            }, {
              onSuccess: () => {
                Alert.alert('Success', 'User reported');
              },
              onError: (error) => {
                Alert.alert('Error', error.message || 'An error occurred while reporting the user');
              },
            });
          },
        },
      ]
    );
  }, [user?.id, effectiveRecipientUserId, reportUserMutation]);

  // Handle Block
  const handleMute = useCallback(() => {
    if (!threadId) return;
    
    muteThreadMutation.mutate(threadId, {
      onSuccess: () => {
        Alert.alert('Success', 'Notifications for this conversation have been muted');
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.message || 'Failed to mute notifications');
      },
    });
  }, [threadId, muteThreadMutation]);

  const handleUnmute = useCallback(() => {
    if (!threadId) return;
    
    unmuteThreadMutation.mutate(threadId, {
      onSuccess: () => {
        Alert.alert('Success', 'Notifications for this conversation have been unmuted');
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.message || 'Failed to unmute notifications');
      },
    });
  }, [threadId, unmuteThreadMutation]);

  const handleBlock = useCallback(() => {
    if (!user?.id || !effectiveRecipientUserId) return;
    
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${params.senderName}? You will no longer receive messages from this user.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUserMutation.mutate({
              userId: user.id,
              targetUserId: effectiveRecipientUserId,
            }, {
              onSuccess: () => {
                Alert.alert('Success', 'User blocked', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              },
              onError: (error) => {
                Alert.alert('Error', error.message || 'An error occurred while blocking the user');
              },
            });
          },
        },
      ]
    );
  }, [user?.id, effectiveRecipientUserId, params.senderName, blockUserMutation, navigation]);

  // Handle Send TIPS
  const handleSendTips = useCallback((amount: number, message?: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not found');
      return;
    }

    // effectiveRecipientUserId state'i güncellenmiş olabilir (thread'den alınmış)
    // Eğer hala yoksa, route params'tan al
    const routeParams = (route.params as MessageDetailScreenParams) || {};
    const finalRecipientUserId = effectiveRecipientUserId || routeParams.recipientUserId;

    if (!finalRecipientUserId) {
      Alert.alert('Error', 'Recipient user information not found. Please try again from message detail.');
      console.error('[MessageDetail] recipientUserId not found for send tips:', { routeParams, effectiveRecipientUserId });
      return;
    }

    // Amount validation (minimum 0.01)
    if (amount <= 0 || amount < 0.01) {
      Alert.alert('Error', 'TIPS amount must be at least 0.01');
      return;
    }

    // Message validation (boş string olamaz)
    const finalMessage = message?.trim() || '';
    if (finalMessage.length === 0) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }

    const requestData = {
      senderUserId: user.id,
      recipientUserId: finalRecipientUserId,
      message: finalMessage,
      amount: amount,
      timestamp: new Date().toISOString(),
    };

    console.log('[MessageDetail] 📤 Sending TIPS Request:', {
      ...requestData,
      messagePreview: finalMessage.substring(0, 50) + '...',
      amountType: typeof amount,
      amountValue: amount,
      timestampISO: requestData.timestamp,
    });

    // Thread ID yoksa finalRecipientUserId'yi kullan (fallback)
    const effectiveThreadId = threadId || finalRecipientUserId;

    // Optimistic UI Update - TIPS mesajını anında local state'e ekle
    const optimisticMessageId = `pending-tips-${Date.now()}`;
    const optimisticTipsMessage: MessageDetailItem = {
      id: optimisticMessageId,
      text: finalMessage,
      timestamp: formatMessageTime(new Date()),
      sentAt: new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
      isSent: true,
      senderId: user.id, // ✅ FIX: senderId ekle - isSent yeniden hesaplaması için gerekli
      type: 'tips',
      tipsAmount: amount,
      isRead: false,
    };

    // ✅ WhatsApp Engine: Inverted FlatList - Yeni mesajı başa ekle (en yeni mesaj index 0'da)
    setMessages((prev) => [optimisticTipsMessage, ...prev]);

    // Mesaj baloncuğu height'ı kadar yukarı scroll (smooth animasyon)
    setTimeout(() => {
      scrollByMessageHeight(finalMessage);
    }, 50);

    sendGiftMutation.mutate(
      requestData,
      {
        onSuccess: () => {
          console.log('[MessageDetail] ✅ TIPS sent successfully:', {
            amount: amount,
            message: finalMessage.substring(0, 50),
            recipientUserId: finalRecipientUserId,
            timestamp: new Date().toISOString(),
          });
          
          // ✅ TIPS sonrası detaylı log
          const currentMessages = messages; // State'i capture et
          console.log('[MessageDetail] 💰 TIPS SENT - Full Details:', {
            optimisticMessageId: optimisticMessageId,
            amount: amount,
            message: finalMessage,
            messageLength: finalMessage.length,
            recipientUserId: finalRecipientUserId,
            threadId: effectiveThreadId,
            currentThreadId: threadId,
            timestamp: new Date().toISOString(),
            messagesCount: Array.isArray(currentMessages) ? currentMessages.length : 0,
            optimisticMessageExists: Array.isArray(currentMessages) ? currentMessages.some(msg => msg.id === optimisticMessageId) : false,
            socketConnected: isConnected,
            socketReady: isSocketReady,
          });
          
          Alert.alert(
            'Success', 
            `${amount} TIPS sent successfully!`,
            [{ text: 'OK' }]
          );
          closeBottomSheet();
          
          // ✅ FIX: Query invalidation'ı kaldır - socket event'i geldiğinde handleNewMessage zaten mesajı ekleyecek
          // Query invalidation yapmak optimistic mesajın kaybolmasına neden oluyor
          // Socket event'i (new_message veya message_sent) geldiğinde optimistic mesaj gerçek mesajla değiştirilecek
          // queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          // if (effectiveThreadId) {
          //   queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(effectiveThreadId) });
          // }
        },
        onError: (error: any) => {
          console.error('[MessageDetail] ❌ TIPS send error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            statusText: error.response?.statusText,
            requestData: {
              ...requestData,
              messagePreview: finalMessage.substring(0, 50),
            },
            errorStack: error.stack,
          });
          
          // Hata durumunda optimistic mesajı geri al
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessageId));
          
          const errorMessage = error.response?.data?.message || error.message || 'An error occurred while sending TIPS';
          Alert.alert(
            'Error', 
            errorMessage,
            [{ text: 'OK' }]
          );
        },
      }
    );
    // CRITICAL FIX: scrollByMessageHeight, queryClient dependency'den çıkarıldı
  }, [user, route, sendGiftMutation, closeBottomSheet, effectiveRecipientUserId, threadId]);

  // Handle Send TIPS button press
  const handleSendTipsPress = () => {
    // 1. Klavye açıksa kapat
    Keyboard.dismiss();
    
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
        animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : tabBarHeight + 8,
        keyboardBehavior: 'interactive', // Klavye açıldığında bottom sheet yukarı kayar
        keyboardBlurBehavior: 'restore',
        android_keyboardInputMode: 'adjustResize',
      }
    );
  };

  // Handle Send Support Request
  const handleSendSupport = useCallback((supportType: string, message: string, amount: number) => {
    if (!user?.id) {
      Alert.alert('Error', 'User information not found');
      return;
    }

    // effectiveRecipientUserId state'i güncellenmiş olabilir (thread'den alınmış)
    // Eğer hala yoksa, route params'tan al
    const routeParams = (route.params as MessageDetailScreenParams) || {};
    const finalRecipientUserId = effectiveRecipientUserId || routeParams.recipientUserId;

    if (!finalRecipientUserId) {
      Alert.alert('Error', 'Recipient user information not found. Please try again from message detail.');
      console.error('[MessageDetail] recipientUserId not found:', { routeParams, effectiveRecipientUserId });
      return;
    }

    // Map supportType to API format
    // OneOnOneSupportBottomSheet'teki supportType'lar:
    // - 'Collection Management' → GENERAL
    // - 'Product Authentication' → PRODUCT
    // - 'Marketplace Help' → GENERAL
    // - 'Trading Advice' → GENERAL
    // - 'Other' → GENERAL
    const apiSupportType = supportType === 'Product Authentication' ? 'PRODUCT' : 'GENERAL';

    // Amount validation
    if (amount <= 0) {
      Alert.alert('Error', 'TIPS amount must be greater than 0');
      return;
    }

    // Message validation
    if (!message || message.trim().length === 0) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }

    console.log('[MessageDetail] Creating support request:', {
      senderUserId: user.id,
      recipientUserId: finalRecipientUserId,
      type: apiSupportType,
      message: message.substring(0, 50) + '...',
      amount: amount.toString(),
      timestamp: new Date().toISOString(),
    });

    createSupportRequestMutation.mutate(
      {
        senderUserId: user.id,
        recipientUserId: finalRecipientUserId,
        type: apiSupportType as 'GENERAL' | 'TECHNICAL' | 'PRODUCT',
        message: message.trim(),
        amount: amount.toFixed(2), // String formatında, 2 decimal place
        status: 'pending',
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          // Local state'e ekle (socket event'ten sonra gerçek mesaj gelecek)
          const newSupportRequest: MessageDetailItem = {
            id: Date.now().toString(),
            text: '',
            timestamp: formatMessageTime(new Date()),
      sentAt: new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
            isSent: true,
            type: 'support_request',
            supportRequest: {
              supportType: supportType,
              message: message,
              amount: amount,
              status: 'pending',
            },
          };

          // Normal FlatList: Yeni mesajı sona ekle (en yeni mesaj en altta)
          setMessages((prev) => [...prev, newSupportRequest]);

          setTimeout(() => {
            safeScrollToEnd(true);
          }, 100);

          Alert.alert('Success', 'Support request sent successfully');
          closeBottomSheet();
        },
        onError: (error) => {
          Alert.alert('Error', error.message || 'An error occurred while sending the support request');
        },
      }
    );
  }, [user, route, createSupportRequestMutation, closeBottomSheet, effectiveRecipientUserId]);

  // Handle Request 1-on-1 Support button press
  const handleRequestSupportPress = () => {
    // 1. Klavye açıksa kapat
    Keyboard.dismiss();
    
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
        enableDynamicSizing: true, // Content boyutuna göre dinamik height
        detached: true, // Detached mod - bottom sheet daha yukarıda açılır
        bottomInset: 0, // Alt boşluk yok - ekranın altına yapışık
        animateOnMount: true, // PERFORMANCE FIX: Disabled for instant opening
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 8,
        keyboardBehavior: 'interactive', // Klavye açıldığında bottom sheet yukarı kayar (klavye üzerinde)
        keyboardBlurBehavior: 'restore', // Klavye kapandığında eski haline döner
        android_keyboardInputMode: 'adjustResize',
        style: {
          marginHorizontal: 0, // Full width - yan boşluk yok
          width: '100%', // Tam genişlik
        },
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
      Alert.alert('Error', 'User information not found');
      return;
    }

    // effectiveRecipientUserId state'i güncellenmiş olabilir (thread'den alınmış)
    // Eğer hala yoksa, route params'tan al
    const routeParams = (route.params as MessageDetailScreenParams) || {};
    const finalRecipientUserId = effectiveRecipientUserId || routeParams.recipientUserId;
    
    // Thread ID yoksa finalRecipientUserId'yi kullan (fallback)
    const effectiveThreadId = threadId || finalRecipientUserId;
    
    if (!effectiveThreadId || !finalRecipientUserId) {
      Alert.alert('Error', 'Recipient user information not found.');
      return;
    }

    // 2. Optimistic UI Update - local state'e ekle (pending durumu)
    const optimisticMessageId = `pending-${Date.now()}`;
    const newMessage: MessageDetailItem = {
      id: optimisticMessageId,
      text: messageText.trim(),
      timestamp: formatMessageTime(new Date()),
      sentAt: new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
      isSent: true,
      senderId: user.id, // ✅ FIX: senderId ekle - isSent yeniden hesaplaması için gerekli
      isRead: false, // Henüz okunmadı
    };

    // ✅ FIX: Optimistic mesajı doğru pozisyona ekle (sentAt'a göre sıralı)
    // Bu sayede flicker olmaz - mesaj zaten doğru pozisyonda görünür
    setMessages((prev) => insertMessageInOrder(prev, newMessage));

    // Mesaj baloncuğu height'ı kadar yukarı scroll (smooth animasyon)
    // State update tamamlandıktan sonra scroll yap
    setTimeout(() => {
      scrollByMessageHeight(messageText.trim());
    }, 50);

    // 3. Socket bağlantısı kontrolü - Socket bağlıysa socket ile gönder
    // Dokümana göre: send_message event'i recipientId bekliyor (threadId değil)
    if (isConnected && isSocketReady && finalRecipientUserId) {
      console.log('[MessageDetail] 📤 Sending message via socket:', {
        message: messageText.trim(),
        recipientId: finalRecipientUserId,
        threadId: effectiveThreadId,
        optimisticId: optimisticMessageId,
      });
      socketSendMessage(finalRecipientUserId, messageText.trim());
      
      // Thread mesajlarını invalidate et (mesaj backend'e kaydedildikten sonra refetch yapılsın)
      // message_sent ve new_message event'leri geldiğinde de invalidate edilecek ama burada da yapıyoruz güvenlik için
      if (effectiveThreadId) {
        // Biraz gecikme ile invalidate et (backend'in mesajı kaydetmesi için zaman tanı)
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(effectiveThreadId) });
          refetchMessages();
        }, 1000);
      }
    } else {
      // Fallback: REST API ile mesaj gönder
      if (__DEV__) {
        console.warn('[MessageDetail] ⚠️ Socket not ready, using REST API fallback');
      }
      if (finalRecipientUserId) {
        sendDirectMessageMutation.mutate(
          {
            recipientUserId: finalRecipientUserId,
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
              Alert.alert('Error', error.message || 'An error occurred while sending the message');
            },
          }
        );
      } else {
        // finalRecipientUserId yoksa optimistic mesajı geri al
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessageId));
        Alert.alert('Error', 'Recipient user information not found');
      }
    }
    // CRITICAL FIX: scrollByMessageHeight, queryClient, refetchMessages dependency'den çıkarıldı
  }, [user?.id, threadId, effectiveRecipientUserId, route, isConnected, isSocketReady, socketSendMessage, sendDirectMessageMutation]);

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

    // Eğer açılıyorsa (şu an kapalı), scroll'u aşağı kaydır (normal FlatList için end)
    if (!isCurrentlyExpanded) {
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    }
  };

  // Handle Accept Support Request
  const handleAcceptSupportRequest = useCallback((requestId: string) => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    // ✅ CRITICAL FIX: Optimistic update - Hemen accepted olarak işaretle
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.type === 'support_request' && msg.supportRequest && (msg.supportRequest.requestId === requestId || msg.id === requestId)) {
          return {
            ...msg,
            supportRequest: {
              ...msg.supportRequest,
              status: 'accepted' as const,
            },
          };
        }
        return msg;
      })
    );

    if (isConnected && isSocketReady) {
      // Socket ile accept et
      console.log('[MessageDetail] ✅ Accepting support request via socket:', requestId);
      socketAcceptSupportRequest(requestId);
    } else {
      // REST API ile accept et
      console.log('[MessageDetail] ✅ Accepting support request via REST API:', requestId);
      acceptSupportRequestMutation.mutate(requestId, {
        onSuccess: (data) => {
          console.log('[MessageDetail] ✅ Support request accepted, threadId:', data.threadId);
          
          // ✅ CRITICAL FIX: ThreadId'yi optimistic update'e ekle
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.type === 'support_request' && msg.supportRequest && (msg.supportRequest.requestId === requestId || msg.id === requestId)) {
                return {
                  ...msg,
                  supportRequest: {
                    ...msg.supportRequest,
                    status: 'accepted' as const,
                    threadId: data.threadId,
                  },
                };
              }
              return msg;
            })
          );
          
          // ✅ CRITICAL FIX: Tüm ilgili cache'leri invalidate et
          queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
          queryClient.invalidateQueries({ queryKey: [...inboxKeys.all, 'thread-messages'] });
          
          // Support thread'e yönlendir
          if (data.threadId) {
            handleGoToSupportChat(data.threadId, requestId);
          }
        },
        onError: (error: any) => {
          console.error('[MessageDetail] ❌ Support request accept error:', error);
          
          // ✅ CRITICAL FIX: Hata durumunda optimistic update'i geri al
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.type === 'support_request' && msg.supportRequest && (msg.supportRequest.requestId === requestId || msg.id === requestId)) {
                return {
                  ...msg,
                  supportRequest: {
                    ...msg.supportRequest,
                    status: 'pending' as const,
                  },
                };
              }
              return msg;
            })
          );
          
          Alert.alert('Error', error.message || 'Support request could not be accepted');
        },
      });
    }
  }, [isConnected, isSocketReady, socketAcceptSupportRequest, acceptSupportRequestMutation, queryClient, handleGoToSupportChat]);

  // Handle Reject Support Request
  const handleRejectSupportRequest = useCallback((requestId: string) => {
    if (!requestId) {
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
              console.log('[MessageDetail] ❌ Rejecting support request via socket:', requestId);
              socketRejectSupportRequest(requestId);
            } else {
              // REST API ile reject et
              console.log('[MessageDetail] ❌ Rejecting support request via REST API:', requestId);
              rejectSupportRequestMutation.mutate(requestId, {
                onSuccess: () => {
                  console.log('[MessageDetail] ✅ Support request rejected');
                  Alert.alert('Success', 'Support request rejected');
                },
                onError: (error: any) => {
                  console.error('[MessageDetail] ❌ Support request reject error:', error);
                  Alert.alert('Error', error.message || 'Support request could not be rejected');
                },
              });
            }
          },
        },
      ]
    );
  }, [isConnected, isSocketReady, socketRejectSupportRequest, rejectSupportRequestMutation]);

  // Handle Cancel Support Request
  const handleCancelSupportRequest = useCallback((requestId: string) => {
    if (!requestId) {
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    Alert.alert(
      'Cancel Support Request',
      'Are you sure you want to cancel this support request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            // Optimistic update: Local state'te hemen canceled olarak işaretle
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.type === 'support_request' && msg.supportRequest && (msg.supportRequest.requestId === requestId || msg.id === requestId)) {
                  return {
                    ...msg,
                    supportRequest: {
                      supportType: msg.supportRequest.supportType,
                      message: msg.supportRequest.message,
                      amount: msg.supportRequest.amount,
                      status: 'canceled' as const,
                      requestId: msg.supportRequest.requestId,
                      threadId: msg.supportRequest.threadId,
                      fromUserId: msg.supportRequest.fromUserId,
                      toUserId: msg.supportRequest.toUserId,
                    },
                  };
                }
                return msg;
              })
            );

            if (isConnected && isSocketReady) {
              // Socket ile cancel et
              console.log('[MessageDetail] 🚫 Canceling support request via socket:', requestId);
              socketCancelSupportRequest(requestId);
            } else {
              // REST API ile cancel et
              console.log('[MessageDetail] 🚫 Canceling support request via REST API:', requestId);
              cancelSupportRequestMutation.mutate(requestId, {
                onSuccess: () => {
                  console.log('[MessageDetail] ✅ Support request canceled');
                  // Local state zaten güncellendi (optimistic update)
                  // Inbox listesini invalidate et
                  queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
                  queryClient.invalidateQueries({ queryKey: inboxKeys.supportRequests() });
                },
                onError: (error: any) => {
                  console.error('[MessageDetail] ❌ Support request cancel error:', error);
                  // Hata durumunda optimistic update'i geri al
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.type === 'support_request' && msg.supportRequest && (msg.supportRequest.requestId === requestId || msg.id === requestId)) {
                        return {
                          ...msg,
                          supportRequest: {
                            supportType: msg.supportRequest.supportType,
                            message: msg.supportRequest.message,
                            amount: msg.supportRequest.amount,
                            status: 'pending' as const,
                            requestId: msg.supportRequest.requestId,
                            threadId: msg.supportRequest.threadId,
                            fromUserId: msg.supportRequest.fromUserId,
                            toUserId: msg.supportRequest.toUserId,
                          },
                        };
                      }
                      return msg;
                    })
                  );
                  Alert.alert('Error', error.message || 'Support request could not be cancelled');
                },
              });
            }
          },
        },
      ]
    );
  }, [isConnected, isSocketReady, socketCancelSupportRequest, cancelSupportRequestMutation, queryClient]);

  // Handle Delete Message
  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!messageId) {
      Alert.alert('Error', 'Message ID not found');
      return;
    }

    const message = messages.find((msg) => msg.id === messageId);
    if (!message) {
      Alert.alert('Error', 'Message not found');
      return;
    }

    // Optimistic update: Mesajı silme işlemi başladı olarak işaretle (isDeleting: true)
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            isDeleting: true, // ✅ Optimistic delete state - pressable disable için
          };
        }
        return msg;
      })
    );

    // API'ye silme isteği gönder
    deleteMessageMutation.mutate(messageId, {
      onSuccess: () => {
        console.log('[MessageDetail] ✅ Message deleted successfully:', messageId);
        // ✅ FIX: Silinen mesajı ekrandan tamamen kaldır (silindi olarak gösterme)
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        // ✅ FIX: Query invalidation kaldırıldı - socket event'leri zaten state'i güncelleyecek
        // Socket event'i (message_deleted) geldiğinde mesaj tamamen kaldırılacak
      },
      onError: (error: any) => {
        console.error('[MessageDetail] ❌ Message delete error:', error);
        // Hata durumunda optimistic update'i geri al
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...message,
                isDeleting: false, // Silme işlemi başarısız, geri al
              };
            }
            return msg;
          })
        );
        Alert.alert('Error', error.message || 'Failed to delete message');
      },
    });
  }, [messages, deleteMessageMutation]);

  // Handle React to Message (user action)
  const handleReact = useCallback((messageId: string, emoji: string) => {
    if (!messageId || !emoji) {
      return;
    }

    // Check if user already reacted with this emoji
    const message = messages.find((msg) => msg.id === messageId);
    if (message?.reactions) {
      const existingReaction = message.reactions.find((r) => r.emoji === emoji);
      const userReacted = existingReaction?.users?.includes(user?.id || '');
      
      if (userReacted && existingReaction) {
        // Remove reaction - find reactionId from backend
        // For now, we'll just call the API and let backend handle it
        // TODO: Get reactionId from message reactions
        console.log('[MessageDetail] Removing reaction:', { messageId, emoji });
        // Optimistic update
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.reactions) {
              const updatedReactions = msg.reactions.map((r) => {
                if (r.emoji === emoji) {
                  const updatedUsers = r.users.filter((uid) => uid !== user?.id);
                  return {
                    ...r,
                    count: Math.max(0, r.count - 1),
                    users: updatedUsers,
                  };
                }
                return r;
              }).filter((r) => r.count > 0);
              
              return {
                ...msg,
                reactions: updatedReactions,
              };
            }
            return msg;
          })
        );
        
        // Call API to remove reaction
        // Note: We need reactionId, but for simplicity, we'll use a workaround
        // Backend should handle removing reaction by messageId + userId + emoji
        removeReactionMutation.mutate(
          { messageId, reactionId: 'temp' }, // Backend should handle this
          {
            onError: () => {
              // Revert optimistic update on error
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === messageId) {
                    // Restore previous reactions
                    return message;
                  }
                  return msg;
                })
              );
            },
          }
        );
      } else {
        // Add reaction
        console.log('[MessageDetail] Adding reaction:', { messageId, emoji });
        
        // Optimistic update
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              const existingReactions = msg.reactions || [];
              const reactionIndex = existingReactions.findIndex((r) => r.emoji === emoji);
              
              if (reactionIndex !== -1) {
                // Update existing reaction
                const updatedReactions = [...existingReactions];
                updatedReactions[reactionIndex] = {
                  ...updatedReactions[reactionIndex],
                  count: updatedReactions[reactionIndex].count + 1,
                  users: [...(updatedReactions[reactionIndex].users || []), user?.id || ''],
                };
                return {
                  ...msg,
                  reactions: updatedReactions,
                };
              } else {
                // Add new reaction
                return {
                  ...msg,
                  reactions: [
                    ...existingReactions,
                    {
                      emoji,
                      count: 1,
                      users: [user?.id || ''],
                    },
                  ],
                };
              }
            }
            return msg;
          })
        );
        
        addReactionMutation.mutate(
          { messageId, emoji },
          {
            onError: () => {
              // Revert optimistic update on error
              setMessages((prev) =>
                prev.map((msg) => {
                  if (msg.id === messageId) {
                    return message;
                  }
                  return msg;
                })
              );
            },
          }
        );
      }
    } else {
      // No existing reactions, add new one
      addReactionMutation.mutate({ messageId, emoji });
    }
  }, [messages, user?.id, addReactionMutation, removeReactionMutation]);

  // Handle Add Image - Galeriyi aç ve görseli seç (caption için)
  const handleAddImage = useCallback(async () => {
    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        console.log('[MessageDetail] 📷 Image selected:', result.asset.uri);
        
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
          Alert.alert('Error', typeof result.error === 'string' ? result.error : 'An error occurred while selecting image');
        }
      }
    } catch (error: any) {
      console.error('[MessageDetail] ❌ Image picker error:', error);
      Alert.alert('Error', 'An error occurred while selecting image');
    }
  }, []);
  
  // Handle Send Image - Görsel + caption gönder
  const handleSendImage = useCallback(async (image: { uri: string; type: string; name: string; fileSize?: number }, caption: string) => {
    if (!threadId || !effectiveRecipientUserId) {
      Alert.alert('Error', 'Thread ID or recipient user not found');
      return;
    }

    try {
      // Görseli FormData ile backend'e gönder
      const formData = new FormData();
      
      // FormData'ya görseli ekle
      const mediaFile = {
        uri: image.uri,
        type: image.type,
        name: image.name,
      } as any;
      
      formData.append('media', mediaFile);
      formData.append('mediaType', 'image');
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      if (image.fileSize) {
        formData.append('fileSize', image.fileSize.toString());
      }
        
        // 🔍 REQUEST YAPISI LOG'U
        console.log('[MessageDetail] 📤 BACKEND REQUEST YAPISI:', {
          endpoint: `POST /inbox/threads/${threadId}/media`,
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer <token>', // Token otomatik ekleniyor
          },
          formData: {
            media: {
              uri: image.uri,
              type: image.type,
              name: image.name,
              fileSize: image.fileSize,
            },
            mediaType: 'image',
            caption: caption.trim() || undefined,
            fileSize: image.fileSize?.toString(),
          },
          threadId,
          recipientUserId: effectiveRecipientUserId,
        });
        
        // Optimistic update: Görsel mesajını anında local state'e ekle
        const optimisticMessageId = `pending-image-${Date.now()}`;
        const optimisticImageMessage: MessageDetailItem = {
          id: optimisticMessageId,
          text: caption.trim() || '',
          timestamp: formatMessageTime(new Date()),
          sentAt: new Date().toISOString(), // CRITICAL: Sıralama için ISO timestamp
          isSent: true,
          type: 'image',
          mediaUrl: image.uri,
          mediaType: 'image',
          uploadStatus: 'uploading',
          uploadProgress: 0,
          isRead: false,
        };
        
        console.log('[MessageDetail] 📝 Optimistic image message oluşturuluyor:', {
          id: optimisticMessageId,
          type: optimisticImageMessage.type,
          mediaUrl: optimisticImageMessage.mediaUrl,
          caption: caption.trim(),
          uploadStatus: optimisticImageMessage.uploadStatus,
        });
        
        // ✅ FIX: Optimistic görsel mesajını doğru pozisyona ekle (sentAt'a göre sıralı)
        setMessages((prev) => {
          const newMessages = insertMessageInOrder(prev, optimisticImageMessage);
          console.log('[MessageDetail] 📋 Messages state güncellendi:', {
            prevLength: prev.length,
            newLength: newMessages.length,
            lastMessage: newMessages[newMessages.length - 1],
            optimisticId: optimisticMessageId,
          });
          return newMessages;
        });
        setTimeout(() => safeScrollToEnd(true), 100);
        
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
              console.log('[MessageDetail] 📊 Upload progress:', progress + '%');
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
        
        console.log('[MessageDetail] ✅ Image upload response:', {
          status: response.status,
          data: response.data,
          messageId: response.data?.messageId,
          mediaUrl: response.data?.mediaUrl,
          thumbnailUrl: response.data?.thumbnailUrl,
          caption: response.data?.caption,
        });
        
        // Optimistic mesajı gerçek mesajla değiştir
        if (response.data?.messageId) {
          console.log('[MessageDetail] 🔄 Optimistic mesaj gerçek mesajla değiştiriliyor:', {
            optimisticId: optimisticMessageId,
            realId: response.data.messageId,
            mediaUrl: response.data.mediaUrl,
            caption: response.data?.caption || caption.trim(),
          });
          
          setMessages((prev) => {
            // ✅ FIX: Duplicate kontrolü - eğer mesaj zaten varsa (new_message event'i önce gelmiş), sadece optimistic mesajı kaldır
            const existingMessage = prev.find((msg) => msg.id === response.data.messageId);
            if (existingMessage) {
              console.log('[MessageDetail] ✅ Message already exists (from new_message event), removing optimistic message only');
              return prev.filter((msg) => msg.id !== optimisticMessageId);
            }
            
            // ✅ FIX: Optimistic mesajı gerçek mesajla değiştir
            // Backend'den gelen timestamp'i kullan (eğer varsa) ve pozisyonu güncelle
            const optimisticIndex = prev.findIndex((msg) => msg.id === optimisticMessageId);
            if (optimisticIndex === -1) {
              if (__DEV__) {
                console.warn('[MessageDetail] ⚠️ Optimistic message not found');
              }
              return prev;
            }
            
            const optimisticMsg = prev[optimisticIndex];
            const backendTimestamp = response.data.timestamp || response.data.sentAt;
            const backendCaption = response.data.caption || caption.trim() || '';
            const updatedMessage: MessageDetailItem = {
              ...optimisticMsg,
              id: response.data.messageId,
              text: backendCaption,
              mediaUrl: response.data.mediaUrl || response.data.imageUrl,
              thumbnailUrl: response.data.thumbnailUrl,
              uploadStatus: 'uploaded',
              uploadProgress: 100,
              // ✅ FIX: Backend'den gelen timestamp'i kullan (eğer varsa)
              sentAt: backendTimestamp || optimisticMsg.sentAt,
              timestamp: backendTimestamp ? formatMessageTime(backendTimestamp) : optimisticMsg.timestamp,
            };
            
            // ✅ FIX: Eğer timestamp değiştiyse, mesajı doğru pozisyona taşı
            if (backendTimestamp && backendTimestamp !== optimisticMsg.sentAt) {
              console.log('[MessageDetail] 🔄 Timestamp changed, repositioning message:', {
                oldSentAt: optimisticMsg.sentAt,
                newSentAt: backendTimestamp,
              });
              // Optimistic mesajı kaldır ve yeni pozisyona ekle
              const withoutOptimistic = prev.filter((msg) => msg.id !== optimisticMessageId);
              return insertMessageInOrder(withoutOptimistic, updatedMessage);
            }
            
            // Timestamp değişmediyse, sadece güncelle
            return prev.map((msg) =>
              msg.id === optimisticMessageId ? updatedMessage : msg
            );
          });
        } else {
          if (__DEV__) {
            console.warn('[MessageDetail] ⚠️ Response\'da messageId yok!', response.data);
          }
        }
      } catch (error: any) {
        console.error('[MessageDetail] ❌ Image upload error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          error: error,
        });
        
        // ✅ FIX: Optimistic mesajı direkt kaldır (failed olarak işaretlemek yerine)
        // Gönderilemeyen mesajlar ekranda görünmemeli
        setMessages((prev) =>
          prev.filter((msg) => !msg.id.startsWith('pending-image-'))
        );
        
        // Seçilen görseli geri yükle (hata durumunda)
        setSelectedImage(image);
        
        const errorMessage = error.response?.data?.error?.message || 
                            error.response?.data?.message || 
                            error.message || 
                            'An error occurred while uploading image';
        
        console.error('[MessageDetail] ❌ Image upload failed, showing alert:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    }, [threadId, effectiveRecipientUserId, safeScrollToEnd]);



  // Mesaj öğesi render fonksiyonu
  // ✅ FIX: useCallback ile memoize et - flicker'ı önlemek için
  // Initialize animation for message if not exists
  const getOrCreateAnimation = useCallback((messageId: string) => {
    if (!emojiPickerAnimations[messageId]) {
      emojiPickerAnimations[messageId] = {
        width: new Animated.Value(24),
        opacity: new Animated.Value(0),
      };
    }
    return emojiPickerAnimations[messageId];
  }, []);

  const openEmojiPicker = useCallback((messageId: string) => {
    const anim = getOrCreateAnimation(messageId);
    setEmojiPickerOpen((prev) => ({ ...prev, [messageId]: true }));
    Animated.parallel([
      Animated.timing(anim.width, {
        toValue: 200,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(anim.opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [getOrCreateAnimation]);

  const closeEmojiPicker = useCallback((messageId: string) => {
    const anim = getOrCreateAnimation(messageId);
    Animated.parallel([
      Animated.timing(anim.width, {
        toValue: 24,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(anim.opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setEmojiPickerOpen((prev) => {
        const newState = { ...prev };
        delete newState[messageId];
        return newState;
      });
    });
  }, [getOrCreateAnimation]);

  const handleEmojiSelect = useCallback((messageId: string, emoji: string) => {
    handleReact(messageId, emoji);
    closeEmojiPicker(messageId);
  }, [handleReact, closeEmojiPicker]);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  // ✅ FIX: Silinen ve gönderilemeyen mesajları filtrele - ekrandan tamamen kaldır
  const visibleMessages = useMemo(() => {
    return messages.filter(msg => {
      // Silinen mesajları kaldır
      if (msg.isDeleted) return false;
      // Gönderilemeyen (failed) mesajları kaldır
      if (msg.uploadStatus === 'failed') return false;
      return true;
    });
  }, [messages]);

  const renderMessageItem = useCallback(({ item, index }: { item: MessageDetailItem; index: number }) => {
    
    // Date header check: Show header if not the same day as next message (older message above)
    // CRITICAL FIX: Always use sentAt (ISO timestamp) for date comparison, not timestamp (formatted time string)
    // ✅ WhatsApp Engine: Inverted FlatList kullanılıyor: index 0 = newest message (visually at bottom), index length-1 = oldest message (visually at top)
    const showDateHeader = (() => {
      // CRITICAL: Always use sentAt for date comparison (ISO timestamp with full date info)
      const currentDate = item.sentAt;
      
      if (!currentDate) {
        if (__DEV__) {
          console.warn('[MessageDetail] ⚠️ Missing sentAt for current message:', { 
            currentId: item.id,
          });
        }
        return false;
      }
      
      // ✅ WhatsApp Engine: Inverted FlatList'te index 0 = en yeni mesaj (görsel olarak en altta)
      // En son mesajsa (index length-1, en eski mesaj) veya bir sonraki mesaj (index + 1, görsel olarak üstteki, daha eski) farklı gündeyse tarih başlığı göster
      const isLastMessage = index === visibleMessages.length - 1;
      if (isLastMessage) {
        // En son mesaj (en eski) - her zaman tarih başlığı göster
        return true;
      }
      
      const nextItem = visibleMessages[index + 1]; // Next message in array = older message visually (above current in inverted list)
      
      if (!nextItem) {
        return true;
      }
      
      const nextDate = nextItem.sentAt;
      
      // If sentAt is missing, skip date header (shouldn't happen but safety check)
      if (!nextDate) {
        if (__DEV__) {
          console.warn('[MessageDetail] ⚠️ Missing sentAt for next message:', { 
            nextId: nextItem.id,
          });
        }
        return false;
      }
      
      // ✅ WhatsApp Engine: Tarih başlığı göster - eğer mevcut mesaj ile bir sonraki mesaj (görsel olarak üstteki, daha eski) farklı günlerdeyse
      // Inverted FlatList: index 0 = en yeni, index artarken eskiye gidiyor
      const isDifferentDay = !isSameDay(currentDate, nextDate);
      
    
      
      return isDifferentDay;
    })();
    
    // Date header render with divider line (WhatsApp style)
    const DateHeader = showDateHeader ? (
      <Box py="$4" alignItems="center" justifyContent="center" width="100%">
        <HStack 
          alignItems="center" 
          justifyContent="center" 
          width="100%"
          space="sm"
        >
          {/* Left divider line */}
          <Box 
            flex={1} 
            height={1} 
            bg={isDark ? '#2A2A2A' : '#E5E5E5'} 
          />
          
          {/* Date text */}
          <Box
            bg={isDark ? '#1A1A1A' : '#F2F2F2'}
            px="$3"
            py="$1.5"
            borderRadius="$full"
          >
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$xs"
              fontWeight="$medium"
            >
              {formatDateHeader(item.sentAt)}
            </Text>
          </Box>
          
          {/* Right divider line */}
          <Box 
            flex={1} 
            height={1} 
            bg={isDark ? '#2A2A2A' : '#E5E5E5'} 
          />
        </HStack>
      </Box>
    ) : null;
    
    // ✅ Görsel mesaj render'ı
    if (item.type === 'image' && item.mediaUrl) {
    // ✅ WhatsApp Engine: isFirstInGroup hesapla (5 dakika içinde aynı kullanıcıdan text mesaj varsa grup)
    // Backend güncellemesi: Sadece type: 'message' olan mesajlar gruplanıyor
    // Inverted FlatList: index 0 = en yeni mesaj, index - 1 = daha yeni mesaj (görsel olarak aşağıda)
    const prevMessage = index > 0 ? visibleMessages[index - 1] : null; // Daha yeni mesaj (inverted'da aşağıda)
    
    // ✅ Backend güncellemesi: Sadece text mesajları gruplanıyor
    // Eğer mevcut mesaj text değilse (image, tips, support_request), her zaman isFirstInGroup = true
    // type undefined ise text mesaj kabul et (backward compatibility)
    const isTextMessage = item.type === undefined || (item.type !== 'image' && item.type !== 'support_request' && item.type !== 'tips');
    const isPrevTextMessage = prevMessage ? (prevMessage.type === undefined || (prevMessage.type !== 'image' && prevMessage.type !== 'support_request' && prevMessage.type !== 'tips')) : false;
    
    // Eğer mevcut mesaj text değilse veya önceki mesaj text değilse, grup sıfırlanır
    const isFirstInGroup = !prevMessage || 
      !isTextMessage || // Mevcut mesaj text değilse
      !isPrevTextMessage || // Önceki mesaj text değilse (grup sıfırlanır)
      prevMessage.isSent !== item.isSent || 
      !isSameDay(prevMessage.sentAt, item.sentAt) ||
      !isWithin5Minutes(prevMessage.sentAt, item.sentAt);
      
      return (
        <VStack space="xs">
          {DateHeader}
          <ImageMessage
            item={item}
            isDark={isDark}
            params={params}
            isFirstInGroup={isFirstInGroup}
            onDelete={handleDeleteMessage}
          />
        </VStack>
      );
    }
    
    // TIPS mesajı render'ı
    if (item.type === 'tips') {
      const isSent = item.isSent;
      const tipsAmount = item.tipsAmount || 0;
      
      // ✅ OPTIMIZE: isFirstInGroup hesapla (5 dakika içinde aynı kullanıcıdan mesaj varsa grup)
      const prevMessage = index > 0 ? messages[index - 1] : null;
      const isFirstInGroup = !prevMessage || 
        prevMessage.isSent !== item.isSent || 
        !isSameDay(prevMessage.sentAt, item.sentAt) ||
        !isWithin5Minutes(prevMessage.sentAt, item.sentAt);

      return (
        <VStack space="xs">
          {DateHeader}
          <VStack
            space="xs"
            alignItems={isSent ? 'flex-end' : 'flex-start'}
            px="$4"
            py="$2"
          >
          {!isSent && isFirstInGroup && (
            <HStack space="sm" alignItems="center" mb="$1">
              <Image
                source={
                  toImageSource(item.senderAvatar || params.senderAvatar) ||
                  DEFAULT_USER_AVATAR
                }
                alt={item.senderName || params.senderName || 'User'}
                width={32}
                height={32}
                borderRadius={16}
              />
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$sm"
                fontWeight="$medium"
              >
                {item.senderName || params.senderName || 'Unknown User'}
              </Text>
            </HStack>
          )}

          <HStack
            space="sm"
            alignItems="flex-end"
            maxWidth="80%"
            flexDirection="row"
            justifyContent={isSent ? 'flex-end' : 'flex-start'}
          >
            <Box
              bg={isSent ? (isDark ? '#6366F1' : '#6366F1') : (isDark ? '#1A1A1A' : '#F2F2F2')}
              px="$3"
              py="$2"
              borderRadius={16}
              borderTopLeftRadius={isSent ? 16 : (isFirstInGroup ? 16 : 4)}
              borderTopRightRadius={isSent ? (isFirstInGroup ? 16 : 4) : 16}
            >
              <VStack space="xs">
                {/* TIPS Amount */}
                <HStack space="xs" alignItems="center">
                  <Feather
                    name="award"
                    size={16}
                    color={isSent ? '#E2FF46' : '#E2FF46'}
                  />
                  <Text
                    color={isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
                    fontSize="$sm"
                    fontWeight="$bold"
                  >
                    {tipsAmount} TIPS
                  </Text>
                </HStack>
                {/* Message Text */}
                {item.text && (
                  <Text
                    color={isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
                    fontSize="$sm"
                    fontWeight="$normal"
                  >
                    {item.text}
                  </Text>
                )}
              </VStack>
            </Box>

            <VStack space="xs" alignItems={isSent ? 'flex-start' : 'flex-start'}>
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$2xs"
                fontWeight="$normal"
              >
                {item.timestamp}
              </Text>
              {/* Read receipt (görüldü) - sadece gönderilen mesajlarda */}
              {isSent && (
                <Box position="relative" width={16} height={14} alignItems="center" justifyContent="center">
                  {item.isRead ? (
                    // Çift yeşil tik (WhatsApp stili)
                    <>
                      <Feather
                        name="check"
                        size={14}
                        color="#4CAF50"
                        style={{ position: 'absolute', left: 0, top: 0 }}
                      />
                      <Feather
                        name="check"
                        size={14}
                        color="#4CAF50"
                        style={{ position: 'absolute', left: 4, top: 0 }}
                      />
                    </>
                  ) : (
                    // Tek gri tik (gönderildi ama okunmadı)
                    <Feather
                      name="check"
                      size={12}
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    />
                  )}
                </Box>
              )}
            </VStack>
          </HStack>
          </VStack>
        </VStack>
      );
    }

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
        <VStack space="xs">
          {DateHeader}
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
                    bg={item.supportRequest.status === 'pending' ? (isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)') : item.supportRequest.status === 'accepted' ? (isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)') : item.supportRequest.status === 'rejected' ? (isDark ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)') : item.supportRequest.status === 'canceled' ? (isDark ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)') : (isDark ? 'rgba(226, 255, 70, 0.15)' : 'rgba(226, 255, 70, 0.2)')}
                    p="$2"
                    borderRadius={10}
                  >
                    <Feather
                      name={item.supportRequest.status === 'pending' ? 'clock' : item.supportRequest.status === 'accepted' ? 'check-circle' : item.supportRequest.status === 'rejected' ? 'x-circle' : item.supportRequest.status === 'canceled' ? 'x-circle' : 'life-buoy'}
                      size={18}
                      color={item.supportRequest.status === 'pending' ? '#FFC107' : item.supportRequest.status === 'accepted' ? '#4CAF50' : item.supportRequest.status === 'rejected' ? '#F44336' : item.supportRequest.status === 'canceled' ? '#9E9E9E' : '#E2FF46'}
                    />
                  </Box>
                  <Text
                    fontSize="$sm"
                    fontWeight="$semibold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                  >
                    Support Request{item.supportRequest.status === 'pending' ? ' Created' : item.supportRequest.status === 'accepted' ? ' Accepted' : item.supportRequest.status === 'rejected' ? ' Rejected' : item.supportRequest.status === 'canceled' ? ' Canceled' : ''}
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
                      fontSize="$sm"
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      Support Type
                    </Text>
                    <Text
                      fontSize="$sm"
                      fontWeight="$semibold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.supportType}
                    </Text>
                  </VStack>

                  {/* Message */}
                  <VStack space="xs">
                    <Text
                      fontSize="$sm"
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      Request Details
                    </Text>
                    <Text
                      fontSize="$sm"
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
                      size={14}
                      color="#E2FF46"
                    />
                    <Text
                      fontSize="$sm"
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.amount} TIPS
                    </Text>
                  </HStack>

                  {/* Status Badge */}
                  <VStack space="xs" mt="$2">
                    <Text
                      fontSize="$sm"
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
                        fontSize="$sm"
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
                          onPress={() => handleCancelSupportRequest(requestId)}
                          bg={isDark ? '#F44336' : '#F44336'}
                          borderRadius={8}
                          py="$2"
                        >
                          <ButtonText color="#FFFFFF" fontSize="$xs" fontWeight="$semibold">
                            Cancel Request
                          </ButtonText>
                        </Button>
                      )}
                      {isRecipient && (
                        // Recipient (Expert): Accept ve Reject butonları
                        <HStack space="sm">
                          <Button
                            onPress={() => handleAcceptSupportRequest(requestId)}
                            bg={isDark ? '#4CAF50' : '#4CAF50'}
                            borderRadius={8}
                            py="$2"
                            flex={1}
                          >
                            <ButtonText color="#FFFFFF" fontSize="$xs" fontWeight="$semibold">
                              Accept
                            </ButtonText>
                          </Button>
                          <Button
                            onPress={() => handleRejectSupportRequest(requestId)}
                            bg={isDark ? '#F44336' : '#F44336'}
                            borderRadius={8}
                            py="$2"
                            flex={1}
                          >
                            <ButtonText color="#FFFFFF" fontSize="$xs" fontWeight="$semibold">
                              Reject
                            </ButtonText>
                          </Button>
                        </HStack>
                      )}
                    </VStack>
                  )}
                  
                  {requestStatus === 'accepted' && supportThreadId && (
                    // Accepted: Go to Support Chat butonu
                    <VStack space="sm" mt="$3">
                      <Button
                        onPress={() => handleGoToSupportChat(supportThreadId, requestId)}
                        bg={isDark ? '#E2FF46' : '#E2FF46'}
                        borderRadius={8}
                        py="$2"
                      >
                        <ButtonText color="#000000" fontSize="$xs" fontWeight="$semibold">
                          Go to Support Chat
                        </ButtonText>
                      </Button>
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
                fontSize="$xs"
                lineHeight={14}
                fontWeight="$normal"
                color={isDark ? '#8C8C8C' : '#999999'}
                flex={1}
              >
                {requestStatus === 'pending' 
                  ? 'Support request will close automatically in 24 hours if unanswered.'
                  : requestStatus === 'accepted'
                  ? 'Click "Go to Support Chat" to start.'
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
        </VStack>
      );
    }

    // Normal mesaj render'ı - MessageItem component'ini kullan
    return (
      <VStack space="xs">
        {DateHeader}
        <MessageItem
          item={item}
          index={index}
          messages={visibleMessages} // ✅ FIX: Silinen mesajları filtrele
          isDark={isDark}
          params={params}
          onDelete={handleDeleteMessage}
          onEdit={undefined}
          onReply={undefined}
          onReact={handleReact}
          expandedSupportRequests={expandedSupportRequests}
          onToggleSupportRequest={toggleSupportRequest}
          onAcceptSupportRequest={handleAcceptSupportRequest}
          onRejectSupportRequest={handleRejectSupportRequest}
          onCancelSupportRequest={handleCancelSupportRequest}
          onGoToSupportChat={handleGoToSupportChat}
          currentUserId={user?.id}
          onContextMenuStateChange={(isOpen: boolean) => setIsContextMenuOpen(isOpen)}
        />
      </VStack>
    );
  }, [visibleMessages, isDark, params.senderName, params.senderTitle, params.senderAvatar, user?.id, threadId, handleAcceptSupportRequest, handleRejectSupportRequest, handleCancelSupportRequest, handleReport, handleBlock, handleReact, handleMessageReaction, handleDeleteMessage, emojiPickerOpen, getOrCreateAnimation, openEmojiPicker, closeEmojiPicker, handleEmojiSelect, emojis, expandedSupportRequests, toggleSupportRequest, handleGoToSupportChat]);

  // CRITICAL FIX: SafeAreaView kullanmıyoruz, flicker önlemek için manuel insets kullanıyoruz
  // Üstte top inset kadar, altta bottom inset kadar view kullan
  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      {/* Top inset view - Status bar için */}
      <Box 
        height={insets.top} 
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0: 0}
        enabled={true}
      >
        {/* Header */}
        <MessageDetailHeader
          senderName={params.senderName}
          senderTitle={params.senderTitle}
          senderAvatar={params.senderAvatar}
          onBackPress={() => navigation.goBack()}
          onMenuPress={() => {}}
          onShare={handleShare}
          onReport={handleReport}
          onBlock={handleBlock}
          onMute={handleMute}
          onUnmute={handleUnmute}
          isMuted={isMuted}
          recipientUserId={effectiveRecipientUserId}
        />

          {/* ✅ WhatsApp Engine: Inverted FlashList - En yeni mesajlar altta, yukarı scroll yapınca eski mesajlar gelir */}
          <Box flex={1}>
            {isLoadingMessages && messages.length === 0 ? (
              // Loading state - Mesajlar yüklenene kadar göster
              <Box flex={1} justifyContent="center" alignItems="center">
                <VStack space="md" alignItems="center">
                  <ActivityIndicator 
                    size="large" 
                    color={isDark ? '#6366F1' : '#6366F1'} 
                  />
                  <Text 
                    color={isDark ? '#8C8C8C' : '#8C8C8C'} 
                    fontSize="$sm"
                  >
                    Loading messages...
                  </Text>
                </VStack>
              </Box>
            ) : (
              <FlatList<MessageDetailItem>
                ref={flatListRef}
                data={visibleMessages} // ✅ FIX: Silinen mesajları filtrele
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                // ✅ WhatsApp Engine: Inverted mode - En yeni mesajlar altta, yukarı scroll yapınca eski mesajlar gelir
                inverted={true}
                scrollEnabled={!isContextMenuOpen}
                // ✅ WhatsApp Engine: Performance optimizations (FlashList benzeri)
                removeClippedSubviews={true}
                windowSize={10}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={15}
                // ✅ WhatsApp Engine: Content container style
                contentContainerStyle={{ 
                  // ✅ Inverted FlatList: paddingTop = en yeni mesajların (ekranın altındaki) altına padding ekler
                  // En yeni mesajın altından 20px yukarıda sonlanması için paddingTop: 20
                  paddingTop:isKeyboardVisible ? 80 : 120,
                  // CRITICAL FIX: Butonların üstüne 10px ekstra padding ekle
                  // Butonlar: bottom={isKeyboardVisible ? keyboardHeight + 60 : 60 + insets.bottom}
                  // Buton yüksekliği: ~100px (2 buton + space="sm")
                  // Mesajlar butonların 10px üzerine kadar gelebilir
                  paddingBottom: isKeyboardVisible 
                    ? keyboardHeight + 0  // Klavye + Input (~60px) + Butonlar (~100px) + 10px ekstra
                    : 0 , // Input (~60px) + Bottom inset + Butonlar (~100px) + 10px ekstra
                  // Empty state için: Mesaj yoksa ekranın tamamını kapla ve ortala
                  flexGrow: visibleMessages.length === 0 ? 1 : 0,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                style={{ flex: 1 }}
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
                // ✅ WhatsApp Engine: Pagination - Inverted FlatList'te yukarı scroll yapıldığında (listenin sonuna gelince) eski mesajları getir
                // Inverted FlatList: onEndReached = listenin sonuna gelince (yukarı scroll yapınca) tetiklenir
                onEndReached={() => {
                  if (hasMoreMessages && !isLoadingMoreMessages && oldestMessageId) {
                    loadOlderMessages();
                  }
                }}
                onEndReachedThreshold={0.5}
                // ✅ WhatsApp Engine: Loading indicator - Eski mesajlar yüklenirken göster (inverted FlatList'te footer üstte görünür)
                ListFooterComponent={
                  isLoadingMoreMessages ? (
                    <Box py="$4" alignItems="center">
                      <ActivityIndicator size="small" color={isDark ? '#6366F1' : '#6366F1'} />
                      <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} fontSize="$xs" mt="$2">
                        Loading older messages...
                      </Text>
                    </Box>
                  ) : null
                }
                ListEmptyComponent={
                  !isLoadingMessages ? (
                    <Box flex={1} alignItems="center" justifyContent="center">
                      <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} fontSize="$md">
                        No messages yet
                      </Text>
                    </Box>
                  ) : null
                }
                onContentSizeChange={(width, height) => {
                  // Content size'ı kaydet (viewability için)
                  contentSizeRef.current = { width, height };
                }}
                onLayout={(event) => {
                  // Layout size'ı kaydet (viewability için)
                  const { width, height } = event.nativeEvent.layout;
                  layoutSizeRef.current = { width, height };
                }}
              />
            )}
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
                  fontSize="$xs"
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

          {/* Action Buttons - Klavye ve input üstünde görünmeli */}
          {/* CRITICAL FIX: Bottom inset artık ayrı view olarak eklendi, burada sadece input height + bottom inset ekle */}
          <Box
            position="absolute"
            bottom={isKeyboardVisible 
              ? keyboardHeight + 60
              : 60 + insets.bottom}
            right={16}
            zIndex={1003}
            elevation={1003}
          >
            <MessageDetailActionButtons
              onSendTipsPress={handleSendTipsPress}
              onRequestSupportPress={handleRequestSupportPress}
              keyboardHeight={keyboardHeight}
              isKeyboardVisible={isKeyboardVisible}
              keyboardAnim={null}
            />
          </Box>

          {/* Mesaj Input - Klavye üstünde görünmeli */}
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
              placeholder="Type your message..."
              threadId={threadId}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
              selectedImage={selectedImage}
              onClearSelectedImage={() => setSelectedImage(null)}
            />
          </Box>

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

MessageDetailScreen.displayName = 'MessageDetailScreen';

export default MessageDetailScreen;

