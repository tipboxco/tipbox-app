import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Alert, Keyboard, Dimensions, ActivityIndicator, Share } from 'react-native';
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
import { useSendGift, useCreateSupportRequest, useSendDirectMessage, useThreadMessages, useAcceptSupportRequest, useRejectSupportRequest, useCancelSupportRequest, useMarkThreadAsRead } from '../api/hooks';
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

interface MessageDetailItem {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
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
  // Message status indicators
  isRead?: boolean; // Mesaj okundu mu?
  readAt?: string; // Okunma zamanı
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

// Mock mesaj geçmişi verisi
const mockMessageHistory: MessageDetailItem[] = [
  {
    id: '1',
    text: 'Merhaba! Ürününüz hakkında bilgi almak istiyorum.',
    timestamp: '10:30',
    isSent: false,
    senderName: 'Mehmet Koç',
    senderAvatar: DEFAULT_USER_AVATAR,
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
    senderAvatar: DEFAULT_USER_AVATAR,
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
    senderAvatar: DEFAULT_USER_AVATAR,
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

// Güvenli tarih formatlama fonksiyonu
const formatMessageTime = (dateInput: string | Date | null | undefined): string => {
  try {
    if (!dateInput) {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      console.warn('[MessageDetail] Invalid date:', dateInput);
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('[MessageDetail] Date formatting error:', error, 'Input:', dateInput);
    return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
};

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
  const queryClient = useQueryClient();
  const reportUserMutation = useReportUser();
  const blockUserMutation = useBlockUser();
  
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

  // Güvenli scroll helper - Normal FlatList için scrollToEnd kullan
  // CRITICAL FIX: useCallback yerine normal fonksiyon kullan (dependency loop'u önlemek için)
  const safeScrollToEnd = useCallback((animated: boolean = true) => {
    try {
      // Normal FlatList'te en yeni mesaj en altta, scrollToEnd en alta scroll yapar
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated });
      }
    } catch (error) {
      // Hata durumunda scrollToOffset ile son mesajın offset'ini hesapla
      try {
        // Son mesajın yaklaşık offset'ini hesapla (her mesaj ~100px varsayarak)
        // messages.length yerine ref kullan (dependency loop'u önlemek için)
        const estimatedOffset = 10000; // Büyük bir değer kullan (en alta scroll için)
        flatListRef.current?.scrollToOffset({ offset: estimatedOffset, animated });
      } catch (offsetError) {
        // Sessizce yakala
      }
    }
    // CRITICAL FIX: messages.length dependency'den çıkarıldı - flatListRef.current zaten güncel
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
      
      console.log('[MessageDetail] 📜 Scrolling by message height:', {
        messageLength: messageText.length,
        lines,
        messageHeight,
      });
      
      // Smooth scroll to end (mesaj baloncuğu height'ı kadar yukarı kayar)
      flatListRef.current?.scrollToEnd({ animated: true });
      
      // Ekstra smooth scroll için küçük bir delay ile tekrar scroll
      // Bu sayede mesaj baloncuğu tam görünür olur
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.warn('[MessageDetail] ⚠️ Scroll error, using fallback:', error);
      // Hata durumunda normal scroll yap
      safeScrollToEnd(true);
    }
    // CRITICAL FIX: safeScrollToEnd dependency'den çıkarıldı - flatListRef.current zaten güncel
  }, []);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Thread mesajlarını yükle
  const { data: threadMessages, isLoading: isLoadingMessages, refetch: refetchMessages } = useThreadMessages(threadId);

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
        
        // Klavye açıldığında en son mesaja scroll yap - KeyboardAvoidingView animasyonu tamamlanana kadar bekle
        // iOS'ta animasyon daha uzun sürdüğü için daha fazla bekle
        setTimeout(() => {
          safeScrollToEnd(true);
        }, Platform.OS === 'ios' ? 300 : 200);
        
        // Ek bir scroll daha yap (bazı durumlarda ilk scroll yeterli olmayabilir)
        setTimeout(() => {
          safeScrollToEnd(true);
        }, Platform.OS === 'ios' ? 500 : 400);
        
        // Son bir scroll daha (kesinlik için)
        setTimeout(() => {
          safeScrollToEnd(true);
        }, Platform.OS === 'ios' ? 700 : 600);
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

  // Thread mesajlarını local state'e dönüştür
  useEffect(() => {
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
            const isSent = msg.senderId === user?.id;
            // Backend'den gelen sender bilgilerini kullan (varsa), yoksa params'dan al
            const senderName = isSent 
              ? undefined 
              : (msg.senderName || currentParams.senderName || 'Unknown');
            const senderAvatar = isSent 
              ? undefined 
              : (msg.senderAvatar ? toImageSource(msg.senderAvatar) : currentParams.senderAvatar);
            
            // Mesaj tipini belirle
            let messageType: 'message' | 'image' | 'support_request' | 'tips' = 'message';
            if (msg.messageType === 'support-request') {
              messageType = 'support_request';
            } else if (msg.messageType === 'send-tips') {
              messageType = 'tips';
            } else if (msg.messageType === 'image' || msg.mediaUrl) {
              messageType = 'image';
            }

            return {
              id: msg.id,
              text: msg.message || msg.caption || '', // ✅ Görsel mesajlarda caption kullanılabilir
              timestamp: formatMessageTime(msg.sentAt),
              isSent,
              senderName,
              senderAvatar,
              isRead: msg.isRead,
              readAt: msg.readAt,
              type: messageType,
              // ✅ Image message fields - Görsel mesajlar için
              mediaUrl: msg.mediaUrl,
              mediaType: msg.mediaUrl ? 'image' : undefined,
              thumbnailUrl: msg.thumbnailUrl,
              // TIPS mesajı için amount
              tipsAmount: msg.messageType === 'send-tips' ? (msg.amount || 0) : undefined,
              // Support request için özel alanlar
              supportRequest: msg.messageType === 'support-request' ? {
                supportType: msg.supportRequestType || 'GENERAL',
                message: msg.message,
                amount: msg.amount || 0,
                status: (msg.supportRequestStatus || 'pending') as 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported',
                requestId: msg.id, // Support request ID = message ID
                threadId: msg.threadId || null, // Support thread ID (accepted ise)
                fromUserId: msg.fromUserId, // Request'i oluşturan kullanıcı
                toUserId: msg.toUserId, // Request'in gönderildiği kullanıcı (expert)
              } : undefined,
            };
          });
          // Normal sırada tut - en eski mesaj index 0'da, en yeni mesaj sonda
        
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
          
          // Timestamp'e göre sırala (en eski başta, en yeni sonda - normal FlatList için)
          merged.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB; // Ascending (en eski başta, en yeni sonda)
          });
          
          console.log('[MessageDetail] 📥 Merged messages:', {
            backend: convertedMessages.length,
            pending: pendingMessages.length,
            kept: pendingMessagesToKeep.length,
            total: merged.length,
          });
          
          return merged;
        });
        
        // Normal FlatList'te scroll to end = en alta scroll
        setTimeout(() => {
          safeScrollToEnd(false);
        }, 100);
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
    // queryClient, socketMarkThreadRead, markThreadAsReadMutation stable olduğu için dependency'den çıkarıldı
    // safeScrollToEnd dependency'den çıkarıldı - flatListRef.current zaten güncel
  }, [threadMessages, isLoadingMessages, user?.id, threadId, isConnected]);

  // 4️⃣ CHAT EKRANI AÇILDIĞINDA - Thread ID kontrolü, socket bağlantısı, thread join, event listener'lar
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    
    // recipientUserId yoksa, initialThreadId'den thread oluşturulup recipient bilgisi alınabilir
    // effectiveRecipientUserId state'i güncellenmiş olabilir (thread'den alınmış)
    const currentRecipientUserId = effectiveRecipientUserId || recipientUserId || initialThreadId;
    
    if (!currentRecipientUserId) {
      console.warn('[MessageDetail] No recipientUserId or threadId found');
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
          console.log('[MessageDetail] Using existing threadId from inbox:', initialThreadId);
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
          console.warn('[MessageDetail] Using fallback threadId:', currentRecipientUserId);
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
      const isSent = eventData.senderId === currentUserId;
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
        isSent,
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
          // Optimistic mesajı gerçek mesajla değiştir
          const updated = [...prev];
          updated[optimisticMessageIndex] = newMessage;
          return updated;
        }
        
      // Normal FlatList: Yeni mesajı sona ekle (en yeni mesaj en altta)
      return [...prev, newMessage];
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

      // Normal FlatList'te scroll to end = en alta scroll
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    } else if (eventData.messageType === 'image' || eventData.messageType === 'video' || eventData.messageType === 'audio' || eventData.messageType === 'file') {
      // Image/Video/Audio/File mesajı - Backend'den gelen new_message event'i
      const isSent = eventData.senderId === currentUserId;
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
        isSent,
        senderName: isSent ? undefined : (currentParams.senderName || 'Unknown'),
        senderAvatar: isSent ? undefined : currentParams.senderAvatar,
        type: eventData.messageType === 'image' ? 'image' : 'message',
        mediaUrl: eventData.mediaUrl,
        mediaType: eventData.messageType,
        thumbnailUrl: eventData.thumbnailUrl,
        isRead: false,
      };
      
      setMessages((prev) => {
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
          const updated = [...prev];
          updated[optimisticMessageIndex] = newMediaMessage;
          return updated;
        }
        
        // Normal FlatList: Yeni mesajı sona ekle
        return [...prev, newMediaMessage];
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
      
      // Normal FlatList'te scroll to end = en alta scroll
      setTimeout(() => {
        safeScrollToEnd(true);
      }, 100);
    } else if (eventData.messageType === 'send-tips') {
      // TIPS mesajı - anında local state'e ekle
      const isSent = eventData.senderId === currentUserId;
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
        isSent,
        senderName: isSent ? undefined : (currentParams.senderName || 'Unknown'),
        senderAvatar: isSent ? undefined : currentParams.senderAvatar,
        type: 'tips',
        tipsAmount: tipsAmount,
        isRead: false,
      };
      
      setMessages((prev) => {
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
          });
          const updated = [...prev];
          updated[optimisticMessageIndex] = newTipsMessage;
          return updated;
        }
        
        // Normal FlatList: Yeni mesajı sona ekle
        return [...prev, newTipsMessage];
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
      
      // Normal FlatList'te scroll to end = en alta scroll
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
    
    if (!messageId) {
      console.warn('[MessageDetail] ⚠️ message_sent event missing messageId');
      return;
    }

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
          msg.text === messageText && 
          msg.isSent
      );

      if (optimisticIndex !== -1) {
        console.log('[MessageDetail] ✅ Updating optimistic message with real ID:', messageId);
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
      isSent: true,
      isRead: false,
        };
        // Normal FlatList: Yeni mesajı sona ekle (en yeni mesaj en altta)
        return [...prev, newMessage];
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
  }, [threadId]);

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
    // Optimistic update: Local state'te thread'i okundu olarak işaretle (hemen UI'da göster)
    const queryKey = [...inboxKeys.messages(), undefined];
    console.log('[MessageDetail] 🔑 Query key for thread_read event:', queryKey);
    
    queryClient.setQueryData(queryKey, (oldData: any[] | undefined) => {
      console.log('[MessageDetail] 📊 THREAD_READ UPDATE - Önceki durum:', oldData?.map((m: any) => ({ id: m.id, isUnread: m.isUnread, unreadCount: m.unreadCount })));
      if (!oldData) {
        console.warn('[MessageDetail] ⚠️ Old data is null/undefined in thread_read handler');
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
    
    // Query data'yı tekrar kontrol et
    const currentData = queryClient.getQueryData<any[]>(queryKey);
    console.log('[MessageDetail] 🔍 Cache kontrolü - thread_read setQueryData sonrası:', currentData?.map((m: any) => ({ id: m.id, isUnread: m.isUnread, unreadCount: m.unreadCount })));
    
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
    
    // Inbox listesini invalidate et
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    
    // Support thread'e yönlendir (eğer kullanıcı recipient ise)
    if (data.threadId) {
      setTimeout(() => {
        handleGoToSupportChat(data.threadId, data.requestId);
      }, 500);
    }
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
  }, [handleGoToSupportChat]);

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
    
    // Inbox listesini invalidate et
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
  }, []);

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
    
    // Inbox listesini invalidate et
    queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
    // CRITICAL FIX: queryClient stable olduğu için dependency'den çıkarıldı
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
    // Support request event'leri
    on('support_request_accepted', handleSupportRequestAccepted);
    on('support_request_rejected', handleSupportRequestRejected);
    on('support_request_cancelled', handleSupportRequestCancelled);

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
      // Support request event'leri
      off('support_request_accepted', handleSupportRequestAccepted);
      off('support_request_rejected', handleSupportRequestRejected);
      off('support_request_cancelled', handleSupportRequestCancelled);

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
  }, [isConnected, threadId, handleNewMessage, handleMessageSent, handleThreadJoined, handleThreadLeft, handleThreadJoinError, handleMessageSendError, handleUserTyping, handleMessageRead, handleThreadRead, handleSupportRequestAccepted, handleSupportRequestRejected, handleSupportRequestCancelled]);

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
      'Kullanıcıyı Raporla',
      'Bu kullanıcıyı raporlamak istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Raporla',
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
                Alert.alert('Başarılı', 'Kullanıcı raporlandı');
              },
              onError: (error) => {
                Alert.alert('Hata', error.message || 'Kullanıcı raporlanırken bir hata oluştu');
              },
            });
          },
        },
      ]
    );
  }, [user?.id, effectiveRecipientUserId, reportUserMutation]);

  // Handle Block
  const handleBlock = useCallback(() => {
    if (!user?.id || !effectiveRecipientUserId) return;
    
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${params.senderName} kullanıcısını engellemek istediğinizden emin misiniz? Bu kullanıcıdan artık mesaj alamayacaksınız.`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            blockUserMutation.mutate({
              userId: user.id,
              targetUserId: effectiveRecipientUserId,
            }, {
              onSuccess: () => {
                Alert.alert('Başarılı', 'Kullanıcı engellendi', [
                  {
                    text: 'Tamam',
                    onPress: () => navigation.goBack(),
                  },
                ]);
              },
              onError: (error) => {
                Alert.alert('Hata', error.message || 'Kullanıcı engellenirken bir hata oluştu');
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
      isSent: true,
      type: 'tips',
      tipsAmount: amount,
      isRead: false,
    };

    // Normal FlatList: Yeni mesajı sona ekle (en yeni mesaj en altta)
    setMessages((prev) => [...prev, optimisticTipsMessage]);

    // Mesaj baloncuğu height'ı kadar yukarı scroll (smooth animasyon)
    setTimeout(() => {
      scrollByMessageHeight(finalMessage);
    }, 50);

    sendGiftMutation.mutate(
      requestData,
      {
        onSuccess: () => {
          console.log('[MessageDetail] ✅ TIPS sent successfully');
          Alert.alert('Success', 'TIPS sent successfully');
          closeBottomSheet();
          
          // Mesaj listesini invalidate et (socket event'i geldiğinde optimistic mesaj gerçek mesajla değiştirilecek)
          queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
          
          // Thread mesajlarını da invalidate et (socket event'i geldiğinde güncellenecek)
          if (effectiveThreadId) {
            queryClient.invalidateQueries({ queryKey: inboxKeys.threadMessages(effectiveThreadId) });
          }
        },
        onError: (error: any) => {
          console.error('[MessageDetail] ❌ TIPS send error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            requestData,
          });
          
          // Hata durumunda optimistic mesajı geri al
          setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessageId));
          
          const errorMessage = error.response?.data?.message || error.message || 'An error occurred while sending TIPS';
          Alert.alert('Error', errorMessage);
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
        bottomInset: 20, // Detached mod için bottom inset
        animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 8,
        keyboardBehavior: 'interactive', // Klavye açıldığında bottom sheet yukarı kayar (klavye üzerinde)
        keyboardBlurBehavior: 'restore', // Klavye kapandığında eski haline döner
        android_keyboardInputMode: 'adjustResize',
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
      isSent: true,
      isRead: false, // Henüz okunmadı
    };

    // Normal FlatList: Yeni mesajı sona ekle (en yeni mesaj en altta)
    setMessages((prev) => [...prev, newMessage]);

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
      console.warn('[MessageDetail] ⚠️ Socket not ready, using REST API fallback');
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
          Alert.alert('Success', 'Support request accepted');
          // Support thread'e yönlendir
          if (data.threadId) {
            handleGoToSupportChat(data.threadId, requestId);
          }
        },
        onError: (error: any) => {
          console.error('[MessageDetail] ❌ Support request accept error:', error);
          Alert.alert('Error', error.message || 'Support request could not be accepted');
        },
      });
    }
  }, [isConnected, isSocketReady, socketAcceptSupportRequest, acceptSupportRequestMutation]);

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
      'Destek Talebini İptal Et',
      'Bu destek talebini iptal etmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: () => {
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
                  Alert.alert('Success', 'Support request cancelled');
                },
                onError: (error: any) => {
                  console.error('[MessageDetail] ❌ Support request cancel error:', error);
                  Alert.alert('Error', error.message || 'Support request could not be cancelled');
                },
              });
            }
          },
        },
      ]
    );
  }, [isConnected, isSocketReady, socketCancelSupportRequest, cancelSupportRequestMutation]);

  // Handle Add Image - Galeriyi aç ve görseli mesaj olarak gönder
  const handleAddImage = useCallback(async () => {
    if (!threadId || !effectiveRecipientUserId) {
      Alert.alert('Error', 'Thread ID or recipient user not found');
      return;
    }

    try {
      const result = await imagePickerService.pickFromGallery();
      
      if (result.success && result.asset) {
        console.log('[MessageDetail] 📷 Image selected:', result.asset.uri);
        
        // Görseli FormData ile backend'e gönder
        const formData = new FormData();
        
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
        
        // FormData'ya görseli ekle
        const mediaFile = {
          uri: result.asset.uri,
          type: mimeType,
          name: `image_${Date.now()}.${fileExtension}`,
        } as any;
        
        formData.append('media', mediaFile);
        formData.append('mediaType', 'image');
        if (result.asset.fileSize) {
          formData.append('fileSize', result.asset.fileSize.toString());
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
              uri: result.asset.uri,
              type: mimeType,
              name: mediaFile.name,
              fileSize: result.asset.fileSize,
            },
            mediaType: 'image',
            fileSize: result.asset.fileSize?.toString(),
          },
          threadId,
          recipientUserId: effectiveRecipientUserId,
        });
        
        // Optimistic update: Görsel mesajını anında local state'e ekle
        const optimisticMessageId = `pending-image-${Date.now()}`;
        const optimisticImageMessage: MessageDetailItem = {
          id: optimisticMessageId,
          text: '',
          timestamp: formatMessageTime(new Date()),
          isSent: true,
          type: 'image',
          mediaUrl: result.asset.uri,
          mediaType: 'image',
          uploadStatus: 'uploading',
          uploadProgress: 0,
          isRead: false,
        };
        
        console.log('[MessageDetail] 📝 Optimistic image message oluşturuluyor:', {
          id: optimisticMessageId,
          type: optimisticImageMessage.type,
          mediaUrl: optimisticImageMessage.mediaUrl,
          uploadStatus: optimisticImageMessage.uploadStatus,
        });
        
        setMessages((prev) => {
          const newMessages = [...prev, optimisticImageMessage];
          console.log('[MessageDetail] 📋 Messages state güncellendi:', {
            prevLength: prev.length,
            newLength: newMessages.length,
            lastMessage: newMessages[newMessages.length - 1],
          });
          return newMessages;
        });
        setTimeout(() => safeScrollToEnd(true), 100);
        
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
        });
        
        // Optimistic mesajı gerçek mesajla değiştir
        if (response.data?.messageId) {
          console.log('[MessageDetail] 🔄 Optimistic mesaj gerçek mesajla değiştiriliyor:', {
            optimisticId: optimisticMessageId,
            realId: response.data.messageId,
            mediaUrl: response.data.mediaUrl,
          });
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === optimisticMessageId
                ? {
                    ...msg,
                    id: response.data.messageId,
                    mediaUrl: response.data.mediaUrl || response.data.imageUrl,
                    thumbnailUrl: response.data.thumbnailUrl,
                    uploadStatus: 'uploaded',
                    uploadProgress: 100,
                  }
                : msg
            )
          );
        } else {
          console.warn('[MessageDetail] ⚠️ Response\'da messageId yok!', response.data);
        }
      } else {
        if (result.error) {
          Alert.alert('Error', result.error);
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
      
      // Optimistic mesajı kaldır veya hata durumuna geçir
      // Tüm pending-image- ile başlayan mesajları hata durumuna geçir
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith('pending-image-')
            ? { ...msg, uploadStatus: 'failed' }
            : msg
        )
      );
      
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'An error occurred while uploading image';
      
      console.error('[MessageDetail] ❌ Image upload failed, showing alert:', errorMessage);
      Alert.alert('Error', errorMessage);
    }
  }, [threadId, effectiveRecipientUserId, safeScrollToEnd]);



  // Mesaj öğesi render fonksiyonu
  const renderMessageItem = ({ item }: { item: MessageDetailItem }) => {
    // TIPS mesajı render'ı
    if (item.type === 'tips') {
      const isSent = item.isSent;
      const tipsAmount = item.tipsAmount || 0;

      return (
        <VStack
          space="xs"
          alignItems={isSent ? 'flex-end' : 'flex-start'}
          px="$4"
          py="$2"
        >
          {!isSent && (
            <HStack space="sm" alignItems="center" mb="$1">
              <Image
                source={
                  toImageSource(item.senderAvatar || params.senderAvatar) ||
                  DEFAULT_USER_AVATAR
                }
                alt={item.senderName || params.senderName || 'User'}
                width={24}
                height={24}
                borderRadius={12}
              />
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$xs"
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
                    fontSize="$xs"
                    fontWeight="$bold"
                  >
                    {tipsAmount} TIPS
                  </Text>
                </HStack>
                {/* Message Text */}
                {item.text && (
                  <Text
                    color={isSent ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000')}
                    fontSize="$xs"
                    fontWeight="$normal"
                  >
                    {item.text}
                  </Text>
                )}
              </VStack>
            </Box>

            <VStack space="xs" alignItems={isSent ? 'flex-end' : 'flex-start'}>
              <Text
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                fontSize="$xs"
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
                    fontSize="$xs"
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
                      fontSize="$xs"
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      Support Type
                    </Text>
                    <Text
                      fontSize="$xs"
                      fontWeight="$semibold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.supportType}
                    </Text>
                  </VStack>

                  {/* Message */}
                  <VStack space="xs">
                    <Text
                      fontSize="$xs"
                      fontWeight="$medium"
                      color={isDark ? '#8C8C8C' : '#8C8C8C'}
                    >
                      Request Details
                    </Text>
                    <Text
                      fontSize="$xs"
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
                      fontSize="$xs"
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      {item.supportRequest.amount} TIPS
                    </Text>
                  </HStack>

                  {/* Status Badge */}
                  <VStack space="xs" mt="$2">
                    <Text
                      fontSize="$xs"
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
                        fontSize="$xs"
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
                fontWeight="$normal"
                color={isDark ? '#8C8C8C' : '#999999'}
                flex={1}
              >
                {requestStatus === 'pending' 
                  ? 'Support request will close automatically in 24 hours if unanswered.'
                  : requestStatus === 'accepted'
                  ? 'Support request has been accepted. Click "Go to Support Chat" to start the conversation.'
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
            <Image
              source={
                toImageSource(item.senderAvatar || params.senderAvatar) ||
                DEFAULT_USER_AVATAR
              }
              alt={item.senderName || params.senderName || 'User'}
              width={24}
              height={24}
              borderRadius={12}
            />
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$xs"
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
              fontSize="$xs"
              fontWeight="$normal"
            >
              {item.text || '(Mesaj içeriği yok)'}
            </Text>
          </Box>

          <VStack space="xs" alignItems={isSent ? 'flex-end' : 'flex-start'}>
            <Text
              color={isDark ? '#8C8C8C' : '#8C8C8C'}
              fontSize="$xs"
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
    );
  };

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
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
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
          recipientUserId={effectiveRecipientUserId}
        />

          {/* Mesaj Geçmişi - WhatsApp Stili Normal FlatList */}
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
                    Mesajlar yükleniyor...
                  </Text>
                </VStack>
              </Box>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                inverted={false} // Normal FlatList: En eski mesajlar üstte, en yeni mesajlar altta
                contentContainerStyle={{ 
                  paddingTop: 16,
                  paddingBottom: isKeyboardVisible 
                    ? keyboardHeight + 60  // Klavye + Input (~60px: height + minimal padding)
                    : 16,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                style={{ flex: 1 }}
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
                ListEmptyComponent={
                  !isLoadingMessages ? (
                    <Box py={40} alignItems="center" justifyContent="center">
                      <Text color={isDark ? '#8C8C8C' : '#8C8C8C'} fontSize="$sm">
                        Henüz mesaj yok
                      </Text>
                    </Box>
                  ) : null
                }
                onContentSizeChange={(width, height) => {
                  // Content size'ı kaydet
                  contentSizeRef.current = { width, height };
                  
                  // İçerik değiştiğinde (yeni mesaj eklendiğinde) en alta scroll
                  // Sadece klavye açıksa scroll yap (gönder butonu zaten scroll yapıyor)
                  if (messages.length > 0 && isKeyboardVisible) {
                    const delay = Platform.OS === 'ios' ? 200 : 150;
                    setTimeout(() => {
                      safeScrollToEnd(true);
                    }, delay);
                  }
                }}
                onLayout={(event) => {
                  // Layout size'ı kaydet
                  const { width, height } = event.nativeEvent.layout;
                  layoutSizeRef.current = { width, height };
                  
                  // İlk render'da en alta scroll yap
                  if (messages.length > 0) {
                    setTimeout(() => {
                      safeScrollToEnd(false);
                    }, 100);
                  }
                }}
                onScrollToIndexFailed={(info) => {
                  // Index bulunamazsa scrollToEnd kullan
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 100);
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
              placeholder="Type your message..."
              threadId={threadId}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
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

