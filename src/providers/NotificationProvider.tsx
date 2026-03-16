import React, { createContext, useContext, useEffect, useRef } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/src/services/ExpoNotificationService';
import { notificationService as domainNotificationService } from '@/src/services/NotificationService';
import { socketService } from '@/src/services/SocketService';
import { notificationEventService } from '@/src/services/NotificationEventService';
import { notificationGroupingService } from '@/src/services/NotificationGroupingService';
import { deepLinkService } from '@/src/services/DeepLinkService';
import { notificationAnalytics } from '@/src/services/NotificationAnalytics';
import { notificationStateSync } from '@/src/services/NotificationStateSync';
import { useAppStore } from '@/src/store/appStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useAuth } from './AuthProvider';
import { useAppState } from './AppStateProvider';
import { notificationKeys, useUnreadCount } from '@/src/features/notifications/api/hooks';
import { useNotificationSettingsCheck } from '@/src/features/settings/hooks/useNotificationSettingsCheck';
import * as Notifications from 'expo-notifications';
import type { Notification, NotificationMetadata } from '@/src/features/notifications/api/types';
import type { NotificationPayload } from '@/src/types/notification';
// Toast kaldırıldı - Expo bildirimleri kullanılıyor

/**
 * Navigation ref - DEPRECATED
 * 
 * @deprecated Use NavigationService instead
 * Bu ref backward compatibility için korunuyor.
 * Yeni kod için: import { navigationService } from '@/src/services/NavigationService';
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

/**
 * Navigation helper function - DEPRECATED
 * 
 * @deprecated Use NavigationService.navigate() instead
 * 
 * Örnek:
 * ```typescript
 * import { navigationService } from '@/src/services/NavigationService';
 * import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
 * 
 * navigationService.navigate(ROOT_ROUTES.POST, { screen: 'PostDetailScreen', params: { ... } });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export function navigate(name: string, params?: any) {
  console.warn(
    '[NotificationProvider] ⚠️ navigate() is deprecated. Use NavigationService.navigate() instead.'
  );
  // Deprecated function - using any to bypass type checking
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  (navigationRef.current as any)?.navigate(name, params);
}

/**
 * Notification Context Type
 */
interface NotificationContextType {
  isInitialized: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  expoPushToken?: string;
}

/**
 * Notification Context
 */
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Notification Provider Props
 */
interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification Provider Component
 * Tüm uygulamada notification sistemini yönetir
 * - Expo Push Notifications setup
 * - Socket.IO notification listener
 * - Notification navigation handling
 * 
 * Kritik: Auth hazır olmadan başlamaz!
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAppStore();
  const { isAuthReady } = useAuth();
  const { isForeground } = useAppState();
  const [state, setState] = React.useState<NotificationContextType>({
    isInitialized: false,
    permissionStatus: 'undetermined',
  });
  
  // Unread count için query - badge sync için
  // Sadece authenticated olduğunda çalışır (logout durumunda API isteği yapılmaz)
  const { data: unreadCountData, error: unreadCountError } = useUnreadCount(isAuthenticated && isAuthReady);
  const unreadCount = unreadCountData?.data?.count ?? unreadCountData?.count ?? 0;
  
  // Bildirim ayarları kontrolü için hook
  const { canSendNotification } = useNotificationSettingsCheck();
  
  // Store'daki unread count cache'ini API'den gelen değerle sync et
  // ÖNEMLİ: Sadece store null ise veya çok büyük fark varsa güncelle (optimistic update'i override etme)
  useEffect(() => {
    const resolvedCount = unreadCountData?.data?.count ?? unreadCountData?.count;
    if (resolvedCount !== undefined && isAuthenticated && isAuthReady) {
      const notificationStore = useNotificationStore.getState();
      const storeCount = notificationStore.unreadCountCache;
      const apiCount = resolvedCount;
      
      // Store count null ise API count'u kullan (ilk yükleme)
      if (storeCount === null) {
        notificationStore.setUnreadCountCache(apiCount);
        if (__DEV__) {
          console.log('[NotificationProvider] 🔄 Initial store unread count from API:', apiCount);
        }
      } else {
        // Store count ile API count arasında çok büyük fark varsa (10'dan fazla) API'yi kullan
        // Bu durumda muhtemelen başka bir cihazdan bildirim okundu veya sync sorunu var
        const diff = Math.abs(storeCount - apiCount);
        if (diff > 10) {
          notificationStore.setUnreadCountCache(apiCount);
          if (__DEV__) {
            console.log('[NotificationProvider] 🔄 Large diff detected, syncing store from API:', {
              storeCount,
              apiCount,
              diff,
            });
          }
        }
        // Küçük farklar için store count'u koru (optimistic update'i override etme)
        // Örnek: Store 94, API 93 → Store'u koru (yeni bildirim geldi, henüz API sync olmadı)
      }
    }
  }, [unreadCountData?.data?.count, unreadCountData?.count, isAuthenticated, isAuthReady]);
  
  // Hata durumunda log (ama uygulamayı durdurma)
  // ÖNEMLİ: Sadece authenticated olduğunda hata logla (login ekranında hata göstermemek için)
  // CRITICAL FIX: 404 hatası için log gösterme (endpoint henüz implement edilmemiş)
  const errorRef = useRef<boolean>(false);
  useEffect(() => {
    if (unreadCountError && isAuthenticated && isAuthReady && !errorRef.current) {
      const status = (unreadCountError as any)?.response?.status;
      // 404 hatası için log gösterme (endpoint henüz implement edilmemiş)
      if (status !== 404) {
        errorRef.current = true; // Sadece bir kez log göster
        console.warn('[NotificationProvider] ⚠️ Unread count error (using default 0):', {
          status,
          message: (unreadCountError as any)?.response?.data?.message || (unreadCountError as any)?.message,
        });
      }
    }
  }, [unreadCountError, isAuthenticated, isAuthReady]);
  
  // Toast kaldırıldı - Expo bildirimleri kullanılıyor

  // Notification service initialization
  // ⚠️ Auth hazır olmadan başlamaz!
  // ⚠️ Login olmadan token kaydetme yapılmaz!
  useEffect(() => {
    if (!isAuthReady) {
      // Login ekranında hata göstermemek için sessizce return et
      return;
    }

    // Authenticated değilse hiçbir şey yapma (login ekranında hata göstermemek için)
    if (!isAuthenticated) {
      // Login ekranında hata göstermemek için sessizce return et
      return;
    }

    const initializeNotifications = async () => {
      try {
        // İlk aşama: Permission ve token alma (login olmadan yapılabilir)
        const notificationState = await notificationService.initialize();
        
        setState({
          isInitialized: notificationState.isInitialized,
          permissionStatus: notificationState.permissionStatus,
          expoPushToken: notificationState.expoPushToken,
        });

        // İkinci aşama: Token'ı backend'e kaydet (sadece authenticated olduğunda)
        // Bu işlem login kontrolü olmadan yapılmamalı
        await notificationService.registerPushTokenToBackend();

        // Pending token varsa tekrar dene
        await notificationService.retryPendingPushToken();
      } catch (error: any) {
        // CRITICAL FIX: 404 hatası için log gösterme (endpoint henüz implement edilmemiş)
        if (error?.response?.status !== 404) {
          console.error('[NotificationProvider] ❌ Failed to initialize notification service:', error);
        }
      }
    };

    initializeNotifications();
  }, [isAuthReady, isAuthenticated]);

  // Token refresh - App foreground'a geldiğinde token'ı kontrol et
  useEffect(() => {
    if (!state.isInitialized || !isAuthenticated || !isForeground) {
      return;
    }

    // App foreground'a geldiğinde token'ı refresh et
    const refreshToken = async () => {
      try {
        const newToken = await notificationService.refreshPushToken();
        if (newToken && newToken !== state.expoPushToken) {
          setState(prev => ({ ...prev, expoPushToken: newToken }));
          // Token değiştiyse backend'e kaydet (authenticated kontrolü NotificationProvider'da yapılıyor)
          await notificationService.registerPushTokenToBackend();
        }
      } catch (error) {
        console.error('[NotificationProvider] ❌ Error refreshing push token:', error);
      }
    };

    // Foreground'a geldikten 2 saniye sonra refresh et (network bağlantısı kurulması için)
    const timeout = setTimeout(refreshToken, 2000);
    return () => clearTimeout(timeout);
  }, [isForeground, state.isInitialized, isAuthenticated, state.expoPushToken]);

  // Notification State Sync initialization
  useEffect(() => {
    if (!isAuthenticated || !state.isInitialized) {
      return;
    }

    // State sync servisini initialize et
    notificationStateSync.initialize(queryClient);

    return () => {
      notificationStateSync.cleanup();
    };
  }, [isAuthenticated, state.isInitialized, queryClient]);

  // Logout durumunda notification query'lerini temizle
  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      // Logout durumunda tüm notification query'lerini temizle
      queryClient.removeQueries({ queryKey: notificationKeys.all });
      // Notification store'u da temizle
      const notificationStore = useNotificationStore.getState();
      notificationStore.clearRealtimeNotifications();
      notificationStore.clearAllGroupedNotifications();
      notificationStore.clearUnreadCountCache();
    }
  }, [isAuthenticated, isAuthReady, queryClient]);

  // Socket.IO notification listener with Event-Driven Architecture
  useEffect(() => {
    if (!isAuthenticated || !state.isInitialized) {
      // Login ekranında hata göstermemek için sessizce return et
      // Log kaldırıldı - bu normal bir durum, hata değil
      return;
    }

    // Socket bağlantı durumunu kontrol et
    const socket = socketService.getSocket();
    const isSocketConnected = socketService.isConnected();
    
    console.log('[NotificationProvider] 🔌 Socket connection check:', {
      isSocketConnected,
      hasSocket: !!socket,
      isAuthenticated,
      isInitialized: state.isInitialized,
    });
    
    if (!isSocketConnected || !socket) {
      // Socket bağlı değilse listener ekleme (socket bağlandığında tekrar denenecek)
      console.log('[NotificationProvider] ⚠️ Socket not connected, skipping notification listener');
      return;
    }
    
    console.log('[NotificationProvider] ✅ Socket connected, setting up notification listeners');

    const handleSocketNotification = async (notification: Notification) => {

      // Analytics: Notification received tracking
      await notificationAnalytics.trackReceived(
        notification.id,
        notification.type,
        { source: 'socket' }
      );

      // Mesaj bildirimleri için özel kontrol: Eğer kullanıcı MessageDetail ekranındaysa ve aynı thread'deyse notification gösterilmemeli
      const isMessageNotification = ['NEW_MESSAGE', 'DM_REQUEST_RECEIVED', 'DM_REQUEST_ACCEPTED'].includes(notification.type);
      let shouldShowNotification = true;

      if (isMessageNotification && isForeground) {
        try {
          // AppStore'dan aktif thread ID'sini kontrol et (MessageDetail ekranında set edilir)
          const { useAppStore } = await import('@/src/store/appStore');
          const activeThreadId = useAppStore.getState().activeThreadId;
          
          // Notification'dan thread ID'sini al
          const notificationThreadId = notification.metadata?.threadId || notification.metadata?.messageId || notification.metadata?.requestId;
          
          // Eğer aktif thread ID varsa ve notification thread ID ile eşleşiyorsa notification gösterilmemeli
          if (activeThreadId && notificationThreadId && activeThreadId === notificationThreadId) {
            shouldShowNotification = false;
          } else {
            // Fallback: NavigationService'den aktif route'u kontrol et (eski yöntem)
            const { navigationService } = await import('@/src/services/NavigationService');
            const currentRoute = navigationService.getCurrentRoute();
            
            // Eğer MessageDetail ekranındaysa ve threadId eşleşiyorsa notification gösterilmemeli
            if (currentRoute?.name === 'MessageDetail' || currentRoute?.params?.screen === 'MessageDetailScreen') {
              const currentThreadId = currentRoute?.params?.threadId || currentRoute?.params?.messageId;
              
              if (notificationThreadId && currentThreadId && notificationThreadId === currentThreadId) {
                shouldShowNotification = false;
              }
            }
          }
        } catch (error) {
          console.warn('[NotificationProvider] ⚠️ Error checking active thread:', error);
        }
      }

      // Foreground'da local notification göster (OS push notification olarak)
      // Background'da backend'den push notification gelir, burada sadece foreground için local notification gösteriyoruz
      // Bildirim ayarlarını kontrol et
      const canSendPush = canSendNotification(notification.type, 'push');
      
      if (shouldShowNotification && state.permissionStatus === 'granted' && canSendPush) {
        try {
          // Farklı bildirim tipleri için farklı image/icon belirle
          const getNotificationImage = (notif: Notification): string | undefined => {
            const data = notif.data || notif.metadata || {};
            
            switch (notif.type) {
              // Post bildirimleri: Post image göster
              case 'POST_LIKED':
              case 'POST_COMMENTED':
              case 'POST_SHARED':
              case 'POST_FAVORITED':
              case 'COMMENT_LIKED':
              case 'COMMENT_REPLIED':
                return data.imageUrl || data.postImageUrl;
              
              // Mesaj bildirimleri: Kullanıcı avatar'ı göster
              case 'NEW_MESSAGE':
              case 'DM_REQUEST_RECEIVED':
              case 'DM_REQUEST_ACCEPTED':
              case 'DM_REQUEST_DECLINED':
                return notif.avatar || data.avatar || data.senderAvatar;
              
              // Trust bildirimleri: Kullanıcı avatar'ı göster
              case 'NEW_TRUSTER':
              case 'NEW_TRUSTED_BY':
                return notif.avatar || data.avatar || data.userAvatar;
              
              // Event bildirimleri: Event banner/image göster
              case 'EVENT_STARTED':
              case 'EVENT_ENDING_SOON':
              case 'EVENT_REWARD_AVAILABLE':
                return data.imageUrl || data.eventImageUrl || data.bannerUrl;
              
              // Badge bildirimleri: Badge image göster
              case 'NEW_BADGE':
              case 'ACHIEVEMENT_UNLOCKED':
                return data.imageUrl || data.badgeImageUrl;
              
              // Collection bildirimleri: Post image göster
              case 'COLLECTION_POST_ADDED':
                return data.imageUrl || data.postImageUrl;
              
              // Diğer bildirimler: Varsa avatar, yoksa undefined
              default:
                return notif.avatar || data.avatar || data.imageUrl;
            }
          };
          
          const notificationImage = getNotificationImage(notification);
          
          // Foreground'da OS notification göster (üstten banner olarak)
          await notificationService.sendLocalNotification({
            title: notification.title || 'Yeni Bildirim',
            body: notification.message || '',
            data: {
              notificationId: notification.id,
              type: notification.type,
              metadata: notification.metadata || notification.data || {},
              navigation: notification.navigation,
            },
            // Large icon/image: Farklı bildirim tipleri için farklı görseller
            largeIcon: notificationImage,
            imageUrl: notificationImage,
            // Foreground'da da OS notification göster
            priority: 'high',
            sound: true,
            vibrate: true,
          });
        } catch (error) {
          console.error('[NotificationProvider] ❌ Error sending local notification:', error);
        }
      }

      // ✅ CRITICAL FIX: Mesaj bildirimleri için state'e ekleme (notifications listesine düşmesin)
      // Sadece OS notification göster, notifications listesine ekleme
      // isMessageNotification zaten 268. satırda tanımlanmış
      if (!isMessageNotification) {
        // Mesaj bildirimi değilse normal akışı takip et (notifications listesine ekle)
        // State Sync: Zustand store'a ekle (instant UI update için)
        // ÖNEMLİ: Bu optimistic update yapıyor, bildirim anında görünecek
        // addNotification içinde zaten debounce ile invalidateQueries yapılıyor, burada tekrar yapmaya gerek yok
        notificationStateSync.addNotification(notification);

        // Domain Service'e yönlendir (EventService → NotificationService)
        // Bu katmanlı mimari: Transport → Domain → State + Navigation
        const { eventService } = await import('@/src/services/EventService');
        
        eventService.handleSocketEvent(
          {
            type: 'notification',
            payload: notification,
          },
          {
            isForeground,
            shouldNavigate: false, // Socket notification'da otomatik navigate yok, kullanıcı tıklayınca olur
          }
        );
      } else {
        // Mesaj bildirimi: Sadece OS notification göster, notifications listesine ekleme
        // Inbox ekranı zaten new_message event'i ile güncelleniyor (MessagesScreen.tsx)
        console.log('[NotificationProvider] 📨 Message notification - OS notification shown, skipping notifications list');
      }

      // NOT: React Query cache invalidate işlemi NotificationStateSync.addNotification içinde
      // debounce ile yapılıyor (500ms). Burada tekrar invalidate etmeye gerek yok çünkü:
      // 1. Optimistic update zaten yapıldı (store + cache)
      // 2. Debounce ile API sync yapılacak
      // 3. Çift invalidate flickering'e neden olur
    };

    // Register socket notification listener
    socketService.onNotification(handleSocketNotification);

    // ✅ CRITICAL FIX: new_message event'ini de dinle ve notification oluştur
    // Backend'den new_message event'i geldiğinde, eğer kullanıcı o thread'de değilse notification göster
    const handleNewMessage = async (eventData: any) => {
      console.log('[NotificationProvider] 📨 new_message event received:', {
        threadId: eventData.threadId,
        messageId: eventData.messageId,
        senderId: eventData.senderId,
        messageType: eventData.messageType,
      });
      
      // Sadece alınan mesajlar için notification göster (kendi gönderdiğimiz mesajlar için değil)
      const { useAppStore } = await import('@/src/store/appStore');
      const currentUser = useAppStore.getState().user;
      
      if (!currentUser || eventData.senderId === currentUser.id) {
        // Kendi gönderdiğimiz mesaj için notification gösterme
        console.log('[NotificationProvider] ⏭️ Skipping notification - own message');
        return;
      }

      // Eğer kullanıcı o thread'deyse (MessageDetail ekranında) notification gösterme
      const activeThreadId = useAppStore.getState().activeThreadId;
      if (activeThreadId && eventData.threadId === activeThreadId) {
        // Kullanıcı o thread'de, notification gösterme
        return;
      }

      // NavigationService'den aktif route'u kontrol et (fallback)
      try {
        const { navigationService } = await import('@/src/services/NavigationService');
        const currentRoute = navigationService.getCurrentRoute();
        
        if (currentRoute?.name === 'MessageDetail' || currentRoute?.params?.screen === 'MessageDetailScreen') {
          const currentThreadId = currentRoute?.params?.threadId || currentRoute?.params?.messageId;
          if (eventData.threadId === currentThreadId) {
            // Kullanıcı o thread'de, notification gösterme
            return;
          }
        }
      } catch (error) {
        console.warn('[NotificationProvider] ⚠️ Error checking current route:', error);
      }

      // Gönderen adını belirle - farklı field'ları dene
      const senderDisplayName =
        eventData.senderName ||
        eventData.senderFullName ||
        (eventData.sender?.name) ||
        (eventData.sender?.fullName) ||
        (eventData.senderFirstName && eventData.senderLastName
          ? `${eventData.senderFirstName} ${eventData.senderLastName}`
          : null) ||
        (eventData.sender?.firstName && eventData.sender?.lastName
          ? `${eventData.sender.firstName} ${eventData.sender.lastName}`
          : null) ||
        eventData.senderFirstName ||
        eventData.sender?.firstName ||
        'Yeni Mesaj';

      // Notification oluştur
      const notification: Notification = {
        id: `new_message_${eventData.messageId}_${Date.now()}`,
        type: 'NEW_MESSAGE',
        title: senderDisplayName,
        message: eventData.messageType === 'image' 
          ? '📷 Bir görsel gönderdi' 
          : (eventData.message || eventData.text || 'Yeni mesaj'),
        timestamp: new Date(eventData.timestamp || eventData.sentAt || Date.now()).toISOString(),
        isRead: false,
        avatar: eventData.senderAvatar,
        metadata: {
          threadId: eventData.threadId,
          messageId: eventData.messageId,
          senderId: eventData.senderId,
          messageType: eventData.messageType,
        },
        navigation: {
          screen: 'MessageDetail',
          params: {
            threadId: eventData.threadId,
            messageId: eventData.threadId,
            recipientUserId: eventData.senderId,
            senderName: senderDisplayName !== 'Yeni Mesaj' ? senderDisplayName : 'Unknown',
            senderTitle: eventData.senderTitle || '',
            senderAvatar: eventData.senderAvatar,
          },
        },
      };

      // Notification'ı handle et (aynı handler'ı kullan)
      console.log('[NotificationProvider] 📬 Creating notification for new message:', {
        notificationId: notification.id,
        title: notification.title,
        message: notification.message,
      });
      await handleSocketNotification(notification);
    };

    // new_message event'ini dinle
    console.log('[NotificationProvider] 👂 Registering new_message listener');
    socketService.on('new_message', handleNewMessage);

    // DEBUG: Tüm socket event'lerini dinle (sadece development için)
    if (__DEV__ && socket) {
      // Bilinen event'leri log'la (Socket.IO'da onAny yok, bu yüzden manuel dinliyoruz)
      const debugEvents = ['notification', 'new_notification', 'notifications', 'message', 'new_message'];
      debugEvents.forEach((eventName) => {
        socket.on(eventName, (data: any) => {
          console.log(`[NotificationProvider] 🔍 Socket event received: ${eventName}`, {
            data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
          });
        });
      });
    }

    return () => {
      socketService.off('notification', handleSocketNotification);
      socketService.off('new_message', handleNewMessage);
    };
  }, [isAuthenticated, state.isInitialized, isForeground, queryClient]);

  // Expo Push notification handlers
  useEffect(() => {
    if (!state.isInitialized) {
      return;
    }

    const handleNotificationReceived = async (expoNotification: Notifications.Notification) => {
      // CRITICAL FIX: Expo listener Notifications.Notification tipinde gönderir
      // Data notification.request.content.data altındadır, notification.data değil!
      const notificationData = expoNotification.request.content.data as Record<string, any> | undefined;
      const notificationType = notificationData?.type as string;
      const isMessageNotification = ['NEW_MESSAGE', 'DM_REQUEST_RECEIVED', 'DM_REQUEST_ACCEPTED'].includes(notificationType);

      // Socket.IO handler tarafından gönderilmiş local notification ise, count zaten artırıldı
      // notificationId alanı varsa bu bizim local notification'ımızdır (double increment önleme)
      const isFromSocketHandler = !!notificationData?.notificationId;

      if (__DEV__) {
        console.log('[NotificationProvider] 🔔 Push notification received:', {
          type: notificationType,
          isMessageNotification,
          isFromSocketHandler,
          title: expoNotification.request.content.title,
          dataKeys: notificationData ? Object.keys(notificationData) : [],
        });
      }
      
      if (isMessageNotification && isForeground) {
        try {
          // AppStore'dan aktif thread ID'sini kontrol et (MessageDetail ekranında set edilir)
          const { useAppStore } = await import('@/src/store/appStore');
          const activeThreadId = useAppStore.getState().activeThreadId;
          
          // CRITICAL FIX: MessageDetail ekranındayken (activeThreadId varsa) tüm mesaj bildirimlerini engelle
          // Sadece aynı thread değil, herhangi bir MessageDetail ekranındayken tüm mesaj bildirimleri gösterilmemeli
          if (activeThreadId) {
            console.log('[NotificationProvider] 📱 MessageDetail ekranındayken mesaj bildirimi engellendi:', {
              activeThreadId,
              notificationType,
            });
            // Query'leri yine de refresh et (state update için)
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
            return;
          }
          
          // Fallback: NavigationService'den aktif route'u kontrol et
          const { navigationService } = await import('@/src/services/NavigationService');
          const currentRoute = navigationService.getCurrentRoute();
          
          // Eğer MessageDetail ekranındaysa tüm mesaj bildirimlerini engelle
          if (currentRoute?.name === 'MessageDetailScreen' || 
              currentRoute?.params?.screen === 'MessageDetailScreen' ||
              (currentRoute?.params && 'threadId' in currentRoute.params)) {
            console.log('[NotificationProvider] 📱 MessageDetail ekranındayken mesaj bildirimi engellendi (fallback):', {
              routeName: currentRoute?.name,
              notificationType,
            });
            // Query'leri yine de refresh et (state update için)
            queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
            return;
          }
        } catch (error) {
          console.warn('[NotificationProvider] ⚠️ Error checking active thread for push notification:', error);
        }
      }
      
      // Foreground'da notification geldiğinde unread count'u artır ve query'leri refresh et
      // CRITICAL FIX: Socket handler zaten count artırdıysa tekrar artırma (double increment önleme)
      if (!isMessageNotification && !isFromSocketHandler) {
        useNotificationStore.getState().incrementUnreadCount();
        if (__DEV__) {
          console.log('[NotificationProvider] 📊 Unread count incremented (push notification)');
        }
      }
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    };

    const handleNotificationResponse = async (response: Notifications.NotificationResponse) => {
      // CRITICAL FIX: Expo listener NotificationResponse tipinde gönderir
      // Data response.notification.request.content.data altındadır
      const responseData = response.notification.request.content.data as Record<string, any> | undefined;
      const notificationId = responseData?.notificationId as string;
      const notificationType = responseData?.type as string;

      // Analytics: Notification opened tracking
      if (notificationId && notificationType) {
        await notificationAnalytics.trackOpened(
          notificationId,
          notificationType,
          { source: 'push' }
        );
      }

      // Domain Service'e yönlendir (NotificationService)
      // Push notification → Domain Service → Navigation kararı
      // Push payload'ını domain modeline map et
      const content = response.notification.request.content;
      const domainNotification: Notification = {
        id: notificationId || `push-${Date.now()}`,
        type: (notificationType as Notification['type']) || 'SYSTEM_ANNOUNCEMENT',
        title: (responseData?.title as string) || content.title || '',
        message: (responseData?.body as string) || content.body || '',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: responseData?.metadata || responseData || {},
        navigation: responseData?.navigation as any,
      };

      // NotificationService handle et (State + Navigation kararı)
      domainNotificationService.handleNotification(domainNotification, {
        isForeground: true, // Push notification'a tıklandığında foreground'dayız
        shouldNavigate: true, // Push notification'a tıklandığında navigate et
      });

      // Mark notification as read if notificationId is provided
      if (notificationId) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      }
    };

    // Set notification handlers
    notificationService.setNotificationHandler({
      onNotificationReceived: handleNotificationReceived,
      onNotificationResponseReceived: handleNotificationResponse,
    });

    return () => {
      notificationService.cleanup();
    };
  }, [state.isInitialized, queryClient]);

  // Badge sync - Unread count ile badge count'u sync et
  useEffect(() => {
    if (!state.isInitialized || state.permissionStatus !== 'granted') {
      return;
    }

    const syncBadge = async () => {
      try {
        await notificationService.setBadgeCount(unreadCount);
      } catch (error) {
        console.error('[NotificationProvider] ❌ Error syncing badge count:', error);
      }
    };

    syncBadge();
  }, [unreadCount, state.isInitialized, state.permissionStatus]);

  const value: NotificationContextType = {
    isInitialized: state.isInitialized,
    permissionStatus: state.permissionStatus,
    expoPushToken: state.expoPushToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * useNotificationContext Hook
 * Notification context'ini kullanmak için hook
 */
export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationContext hook must be used within NotificationProvider');
  }
  
  return context;
};

