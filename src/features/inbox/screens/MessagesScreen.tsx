import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageCardRow } from '../components/MessageCard/MessageCardRow';
import MessagesFilterGroup from '../components/MessagesFilterGroup/index';
import type { InboxStackParamList } from '../navigation';
import { useSafeAreaValues } from '@/src/utils';
import { useMessages, useMarkThreadAsRead, inboxKeys } from '../api/hooks';
import type { InboxMessage } from '../types';
import type { GetMessagesParams } from '../api/messagesApi';
import { useSocket } from '@/src/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { useAppStore } from '@/src/store/appStore';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { inboxTypingStore } from '../store/typingStore';
import { useTranslation } from '@/src/hooks/useTranslation';

type MessagesScreenNavigationProp = NativeStackNavigationProp<InboxStackParamList>;

interface MessagesScreenProps {
    onDrawerOpen?: () => void;
    isActiveTab?: boolean;
    searchQuery?: string;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ onDrawerOpen, isActiveTab = true, searchQuery = '' }) => {
    const { t } = useTranslation('inbox');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [activeCategory, setActiveCategory] = useState<string>('1');
    const navigation = useNavigation<MessagesScreenNavigationProp>();
    const bottomInset = useSafeAreaValues('bottom');
    
    // Search parametresini useMessages hook'una geçir (username ve son mesaj bazlı arama)
    // ✅ FIX: Sadece DM thread'lerini göster (Support thread'leri MessageDetail'de görünecek)
    const searchParams: GetMessagesParams = {
      threadType: 'DM', // Sadece DM thread'lerini getir
      ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
    };
    const { data: messages, isLoading, error, refetch } = useMessages(true, searchParams);
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    // Özet log (BrandScreen tarzı): mesaj sayısı ve ilk mesaj
    useEffect(() => {
        if (messages != null && !isLoading) {
            const list = Array.isArray(messages) ? messages : [];
            console.log('[MessagesScreen] Messages Count:', list.length);
            if (list.length > 0) {
                console.log('[MessagesScreen] First Message Item:', JSON.stringify({
                    id: list[0].id,
                    senderName: list[0].senderName,
                    lastMessage: list[0].lastMessage?.substring(0, 50),
                    isUnread: list[0].isUnread,
                    unreadCount: list[0].unreadCount,
                }, null, 2));
            }
        }
    }, [messages, isLoading]);
    const queryClient = useQueryClient();
    
  
    const { isConnected, on, off, markThreadRead } = useSocket();
    const { user } = useAppStore();
    const { closeBottomSheet } = useGlobalBottomSheet();
    const markThreadAsReadMutation = useMarkThreadAsRead();
    
    // Typing timeout'ları için ref (cleanup için). Typing state artık inboxTypingStore'da; sadece ilgili row re-render olur.
    const typingTimeoutsRef = useRef<{ [threadId: string]: NodeJS.Timeout }>({});

    // Socket event handler - new_message event
    const handleNewMessage = useCallback((eventData: any) => {
        // Yeni mesaj geldiğinde, eğer kullanıcı inbox listesindeyse (MessageDetail ekranında değilse),
        // thread'i okunmamış olarak işaretle (optimistic update)
        // Not: Eğer kullanıcı MessageDetail ekranındaysa, MessageDetail'deki handleNewMessage mesajı okundu olarak işaretleyecek
        if (eventData.threadId) {
            console.log('[MessagesScreen] 🔄 Updating inbox list with new message:', {
                threadId: eventData.threadId,
                senderId: eventData.senderId,
                currentUserId: user?.id,
            });
            
            // Search param'dan bağımsız TÜM messages cache varyantlarını güncelle
            const baseKey = inboxKeys.messages();
            queryClient.setQueriesData<InboxMessage[]>({ queryKey: baseKey }, (oldData) => {
                if (!oldData) return oldData;
                
                const currentUserId = user?.id;
                const isReceivedMessage = eventData.senderId && eventData.senderId !== currentUserId;
                const threadIndex = oldData.findIndex((msg) => msg.id === eventData.threadId);
                
                console.log('[MessagesScreen] 🔍 Thread search result:', {
                    threadIndex,
                    isReceivedMessage,
                    threadId: eventData.threadId,
                    totalThreads: oldData.length,
                });
                
                if (threadIndex !== -1) {
                    // Thread bulundu: Güncelle ve en üste taşı
                    const thread = oldData[threadIndex];
                    let updated: InboxMessage;
                    
                    // Image / shared-post mesajları için lastMessage özeti
                    const lastMessageText = eventData.messageType === 'image'
                        ? '📷 Bir görsel gönderdi'
                        : eventData.messageType === 'shared-post'
                        ? '📎 Bir gönderi paylaştı'
                        : (eventData.message || eventData.text || eventData.caption || thread.lastMessage);
                    
                    if (isReceivedMessage) {
                        // Alınan mesaj: Okunmamış olarak işaretle
                        updated = {
                            ...thread,
                            isUnread: true,
                            unreadCount: (thread.unreadCount || 0) + 1,
                            lastMessage: lastMessageText,
                            timestamp: eventData.timestamp || eventData.sentAt || new Date().toISOString(),
                        };
                        console.log('[MessagesScreen] ✅ Thread updated (received message):', {
                            threadId: updated.id,
                            isUnread: updated.isUnread,
                            unreadCount: updated.unreadCount,
                            lastMessage: updated.lastMessage,
                        });
                    } else {
                        // Gönderilen mesaj: Sadece lastMessage ve timestamp'i güncelle
                        updated = {
                            ...thread,
                            lastMessage: lastMessageText,
                            timestamp: eventData.timestamp || eventData.sentAt || new Date().toISOString(),
                        };
                        console.log('[MessagesScreen] ✅ Thread updated (sent message):', {
                            threadId: updated.id,
                            lastMessage: updated.lastMessage,
                        });
                    }
                    
                    // Thread'i en üste taşı (yeni mesaj geldiği/gönderildiği için)
                    const newData = [...oldData];
                    newData.splice(threadIndex, 1);
                    newData.unshift(updated);
                    
                    console.log('[MessagesScreen] ✅ Inbox list updated, thread moved to top');
                    return newData;
                } else {
                    // Thread bulunamadı: Yeni thread olabilir, backend'den çekilecek (invalidate ile)
                    console.log('[MessagesScreen] ⚠️ Thread not found in cache, will fetch from backend:', eventData.threadId);
                }
                
                return oldData;
            });
            // Trust optimistic update; no invalidate to avoid cache flicker and redundant network
        }
    }, [queryClient, user?.id]);

    // Socket event handler - thread_read event (thread okundu olarak işaretlendiğinde)
    // ✅ Backend iyileştirmesi: thread_read event'ine unreadCount ve isUnread eklendi
    const handleThreadRead = useCallback((eventData: { 
        threadId: string; 
        readBy: string; 
        timestamp: string;
        unreadCount?: number;  // YENİ - Backend'den gelen unreadCount
        isUnread?: boolean;    // YENİ - Backend'den gelen isUnread
    }) => {
        console.log('[MessagesScreen] 📖 THREAD_READ EVENT ALINDI:', {
            threadId: eventData.threadId,
            readBy: eventData.readBy,
            timestamp: eventData.timestamp,
            unreadCount: eventData.unreadCount,
            isUnread: eventData.isUnread,
        });
        
        // ✅ Backend'den gelen unreadCount ve isUnread değerlerini kullan
        const unreadCount = eventData.unreadCount !== undefined ? eventData.unreadCount : 0;
        const isUnread = eventData.isUnread !== undefined ? eventData.isUnread : false;
        
        // Optimistic update: search query key'inden bağımsız olarak TÜM messages cache'ini güncelle.
        // searchParams'ı key'e dahil etmek, farklı arama sorgusu aktifken gelen olayları orphan bırakıyordu.
        const baseKey = inboxKeys.messages();
        queryClient.setQueriesData<InboxMessage[]>({ queryKey: baseKey }, (oldData) => {
            if (!oldData) return oldData;
            return oldData.map((msg) =>
                msg.id === eventData.threadId ? { ...msg, isUnread, unreadCount } : msg
            );
        });
        // Trust optimistic update; no invalidate to avoid cache flicker and redundant network
    }, [queryClient]);

    // Socket event handler - user_typing event (kullanıcı typing yapıyor)
    // Store kullanıldığı için sadece ilgili MessageCardRow re-render olur, tüm ekran değil
    const handleUserTyping = useCallback((eventData: { userId: string; threadId: string; isTyping: boolean }) => {
        if (__DEV__) {
            console.log('[MessagesScreen] 👤 User typing event received:', {
                userId: eventData.userId,
                threadId: eventData.threadId,
                isTyping: eventData.isTyping,
                currentUserId: user?.id,
            });
        }
        if (eventData.userId === user?.id) return;

        if (eventData.isTyping) {
            if (typingTimeoutsRef.current[eventData.threadId]) {
                clearTimeout(typingTimeoutsRef.current[eventData.threadId]);
                delete typingTimeoutsRef.current[eventData.threadId];
            }
            const messagesArray = Array.isArray(messages) ? messages : [];
            const thread = messagesArray.find((msg) => msg.id === eventData.threadId);
            inboxTypingStore.setTyping(eventData.threadId, {
                userId: eventData.userId,
                userName: thread?.senderName,
            });
            const timeout = setTimeout(() => {
                inboxTypingStore.setTyping(eventData.threadId, null);
                delete typingTimeoutsRef.current[eventData.threadId];
            }, 3000);
            typingTimeoutsRef.current[eventData.threadId] = timeout;
        } else {
            if (typingTimeoutsRef.current[eventData.threadId]) {
                clearTimeout(typingTimeoutsRef.current[eventData.threadId]);
                delete typingTimeoutsRef.current[eventData.threadId];
            }
            inboxTypingStore.setTyping(eventData.threadId, null);
        }
    }, [user?.id, messages]);

    // PERFORMANCE FIX: Socket event listeners only active when screen is focused
    // Prevents inactive screen from processing socket events and causing unnecessary re-renders
    useFocusEffect(
        useCallback(() => {
            if (!isConnected) {
                console.log('[MessagesScreen] ⚠️ Socket not connected, skipping event listeners');
                return;
            }

            console.log('[MessagesScreen] ✅ Screen focused & socket connected, registering event listeners');
            on('new_message', handleNewMessage);
            on('thread_read', handleThreadRead);
            on('user_typing', handleUserTyping);

            return () => {
                console.log('[MessagesScreen] 🔇 Screen blurred, unregistering socket listeners');
                off('new_message', handleNewMessage);
                off('thread_read', handleThreadRead);
                off('user_typing', handleUserTyping);

                // Typing timeout'larını temizle
                Object.values(typingTimeoutsRef.current).forEach((timeout) => {
                    clearTimeout(timeout);
                });
                typingTimeoutsRef.current = {};
            };
        }, [isConnected, on, off, handleNewMessage, handleThreadRead, handleUserTyping])
    );

    // FIX: MessagesScreen focus olduğunda bottom sheet'i kapat (Select Interests bottom sheet hatası)
    // ✅ FIX: Screen focus olduğunda typing state'i temizle
    // NOT: Refetch yapmıyoruz çünkü optimistic update yeterli ve socket event'leri cache'i güncel tutuyor
    useFocusEffect(
        useCallback(() => {
            closeBottomSheet();

            return () => {
                inboxTypingStore.clearAll();
            };
        }, [closeBottomSheet])
    );
    
    const handleMessagePress = (messageId: string) => {
        // CRITICAL FIX: messages array kontrolü
        const messagesArray = Array.isArray(messages) ? messages : [];
        const message = messagesArray.find(m => m.id === messageId);
        if (!message) {
            console.warn('[MessagesScreen] ⚠️ Message not found:', messageId);
            return;
        }

        const threadId = message.id; // message.id = thread ID (DM_THREAD.md'ye göre)
        
        console.log('[MessagesScreen] 🔍 handleMessagePress - Message bulundu:', {
            messageId,
            threadId,
            messageIdMatch: messageId === threadId,
            senderName: message.senderName,
            recipientUserId: message.recipientUserId,
            threadType: message.threadType,
            lastMessage: message.lastMessage?.substring(0, 50),
        });
        
        // 🔍 DEBUG: Mesaja tıklandığında önceki durumu logla
        console.log('[MessagesScreen] ========================================');
        console.log('[MessagesScreen] 🖱️ MESAJ TIKLANDI - ÖNCEKİ DURUM');
        console.log('[MessagesScreen] ========================================');
        console.log(`[MessagesScreen]   Thread ID: ${threadId}`);
        console.log(`[MessagesScreen]   Sender: ${message.senderName || 'Unknown'}`);
        console.log(`[MessagesScreen]   isUnread: ${message.isUnread}`);
        console.log(`[MessagesScreen]   unreadCount: ${message.unreadCount || 0}`);
        
        // 🔍 TÜM MESAJ LİSTESİNİ LOGLA (ÖNCE)
        console.log('[MessagesScreen] 📋 TÜM MESAJ LİSTESİ (ÖNCE - messages state):');
        if (messages && messages.length > 0) {
            messages.forEach((msg, index) => {
                console.log(`[MessagesScreen]   [${index}] Thread ID: ${msg.id}`);
                console.log(`[MessagesScreen]       Sender: ${msg.senderName || 'Unknown'}`);
                console.log(`[MessagesScreen]       isUnread: ${msg.isUnread}`);
                console.log(`[MessagesScreen]       unreadCount: ${msg.unreadCount || 0}`);
                console.log(`[MessagesScreen]       Last Message: ${msg.lastMessage?.substring(0, 30) || 'N/A'}...`);
            });
        } else {
            console.log('[MessagesScreen]   ⚠️ Mesaj listesi boş');
        }
        
        // Tüm messages cache varyantlarını (search params dahil) kapsayan base key kullan
        const baseKey = inboxKeys.messages();
        const currentCacheData = queryClient.getQueriesData<InboxMessage[]>({ queryKey: baseKey })?.[0]?.[1];
        console.log(`[MessagesScreen] 📋 CACHE'DEKİ TÜM MESAJLAR (ÖNCE):`);
        if (currentCacheData && currentCacheData.length > 0) {
            currentCacheData.forEach((msg, index) => {
                console.log(`[MessagesScreen]   [${index}] Thread ID: ${msg.id}`);
                console.log(`[MessagesScreen]       Sender: ${msg.senderName || 'Unknown'}`);
                console.log(`[MessagesScreen]       isUnread: ${msg.isUnread}`);
                console.log(`[MessagesScreen]       unreadCount: ${msg.unreadCount || 0}`);
            });
        } else {
            console.log('[MessagesScreen]   ⚠️ Cache boş');
        }
        
        const cachedMessage = currentCacheData?.find(m => m.id === messageId);
        if (cachedMessage) {
            console.log('[MessagesScreen]   Cache\'deki seçili mesaj durumu:');
            console.log(`[MessagesScreen]     isUnread: ${cachedMessage.isUnread}`);
            console.log(`[MessagesScreen]     unreadCount: ${cachedMessage.unreadCount || 0}`);
        }
        
        // ✅ Backend'den gelen recipientUserId direkt kullanılıyor (geçici çözüm kaldırıldı)
        const recipientUserId = message.recipientUserId;
        
        if (!recipientUserId) {
            console.warn('[MessagesScreen] ⚠️ recipientUserId is missing in message response:', message);
            // Fallback: MessageDetail ekranında thread'den alınacak
        }
        
        // ✅ CRITICAL FIX: Backend otomatik okundu işaretleme yaptığı için her zaman optimistic update yap
        // Backend GET /inbox/:threadId çağrıldığında otomatik olarak thread'i okundu olarak işaretliyor
        // Bu yüzden mesaja tıklandığında hemen optimistic update yapalım (yeşil nokta anında kaybolsun)
        console.log('[MessagesScreen] ========================================');
        console.log('[MessagesScreen] 📖 OPTIMISTIC UPDATE BAŞLIYOR');
        console.log('[MessagesScreen] ========================================');
        console.log('[MessagesScreen]   Thread ID:', threadId);
        console.log('[MessagesScreen]   Message ID:', messageId);
        console.log('[MessagesScreen]   Önceki isUnread:', message.isUnread);
        console.log('[MessagesScreen]   Önceki unreadCount:', message.unreadCount || 0);
        
        // Optimistic update: search param'dan bağımsız TÜM messages cache varyantlarını güncelle
        queryClient.setQueriesData<InboxMessage[]>({ queryKey: baseKey }, (oldData) => {
            if (!oldData) return oldData;
            return oldData.map((msg) =>
                msg.id === messageId ? { ...msg, isUnread: false, unreadCount: 0 } : msg
            );
        });
        
        const currentData = queryClient.getQueriesData<InboxMessage[]>({ queryKey: baseKey })?.[0]?.[1];
        console.log('[MessagesScreen] ========================================');
        console.log('[MessagesScreen] 🔍 CACHE KONTROLÜ - setQueryData SONRASI');
        console.log('[MessagesScreen] ========================================');
        if (currentData && currentData.length > 0) {
            currentData.forEach((msg, index) => {
                const isTarget = msg.id === messageId;
                console.log(`[MessagesScreen]   [${index}] ${isTarget ? '👉 TARGET' : '   '} Thread ID: ${msg.id}`);
                console.log(`[MessagesScreen]       Sender: ${msg.senderName || 'Unknown'}`);
                console.log(`[MessagesScreen]       isUnread: ${msg.isUnread}`);
                console.log(`[MessagesScreen]       unreadCount: ${msg.unreadCount || 0}`);
            });
        } else {
            console.log('[MessagesScreen]   ⚠️ Cache boş');
        }
        
        // ✅ Backend otomatik okundu işaretleme yaptığı için manuel markThreadRead çağırmaya gerek yok
        // Backend GET /inbox/:threadId çağrıldığında otomatik olarak thread'i okundu olarak işaretliyor
        // ve thread_read socket event'i gönderiyor. thread_read event'i geldiğinde zaten güncellenecek.
        // Ancak socket bağlı değilse API ile bildirebiliriz (fallback)
        if (!isConnected) {
            console.log('[MessagesScreen] 📡 Socket not connected, using API to mark thread as read (fallback)');
            markThreadAsReadMutation.mutate(threadId, {
                onError: (error: Error) => {
                    console.error('[MessagesScreen] ❌ Failed to mark thread as read via API:', error);
                    // Hata durumunda optimistic update'i geri al
                    queryClient.setQueriesData<InboxMessage[]>({ queryKey: baseKey }, (oldData) => {
                        if (!oldData) return oldData;
                        return oldData.map((msg) =>
                            msg.id === messageId
                                ? { ...msg, isUnread: message.isUnread, unreadCount: message.unreadCount || 0 }
                                : msg
                        );
                    });
                },
            });
        }
        
        // MessageDetail ekranına git (backend'den gelen recipientUserId ile)
        const navigationParams = {
            messageId: threadId,
            threadId: threadId,
            recipientUserId: recipientUserId, // ✅ Backend'den direkt gelen recipientUserId
            senderName: message.senderName,
            senderTitle: message.senderTitle || '',
            senderAvatar: message.senderAvatar,
        };
        
        console.log('[MessagesScreen] 🔗 Navigating to MessageDetail:', {
            threadId,
            messageId: threadId,
            recipientUserId,
            senderName: message.senderName,
            threadType: message.threadType,
            navigationParams,
        });
        
        navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, navigationParams);
    };

    const handleCategoryPress = (categoryId: string) => {
        setActiveCategory(categoryId);
    };

    const getFilteredMessages = () => {
        // CRITICAL FIX: messages undefined veya array değilse boş array kullan
        let filtered: InboxMessage[] = Array.isArray(messages) ? messages : [];
        
       
        const mergedMessages = new Map<string, InboxMessage>();
        
        filtered.forEach((message) => {
            const recipientUserId = message.recipientUserId;
            
            if (!recipientUserId) {
                // recipientUserId yoksa direkt ekle (birleştirme yapılamaz)
                mergedMessages.set(message.id, message);
                return;
            }
            
            // Aynı recipientUserId'ye sahip thread var mı kontrol et
            const existingMessage = Array.from(mergedMessages.values()).find(
                (msg) => msg.recipientUserId === recipientUserId
            );
            
            if (existingMessage) {
                // Mevcut thread'i güncelle:
                // - En son mesajı ve timestamp'i kullan
                // - Unread count'ları topla
                // - En yeni thread ID'sini kullan (timestamp'e göre)
                const existingTimestamp = new Date(existingMessage.timestamp).getTime();
                const newTimestamp = new Date(message.timestamp).getTime();
                
                if (newTimestamp > existingTimestamp) {
                    // Yeni mesaj daha yeni, mevcut thread'i güncelle
                    mergedMessages.delete(existingMessage.id);
                    mergedMessages.set(message.id, {
                        ...message,
                        // Unread count'ları topla
                        unreadCount: (existingMessage.unreadCount || 0) + (message.unreadCount || 0),
                        // En az bir thread okunmamışsa isUnread true
                        isUnread: existingMessage.isUnread || message.isUnread,
                    });
                } else {
                    // Mevcut thread daha yeni, sadece unread count'u güncelle
                    mergedMessages.set(existingMessage.id, {
                        ...existingMessage,
                        unreadCount: (existingMessage.unreadCount || 0) + (message.unreadCount || 0),
                        isUnread: existingMessage.isUnread || message.isUnread,
                    });
                }
            } else {
                // Yeni thread, direkt ekle
                mergedMessages.set(message.id, message);
            }
        });
        
        // Map'ten array'e çevir ve timestamp'e göre sırala (en yeni başta)
        filtered = Array.from(mergedMessages.values()).sort((a, b) => {
            const timestampA = new Date(a.timestamp).getTime();
            const timestampB = new Date(b.timestamp).getTime();
            return timestampB - timestampA; // En yeni başta
        });

        // CRITICAL FIX: Döndürmeden önce array kontrolü
        return Array.isArray(filtered) ? filtered : [];
    };

    // Drawer açma gesture'ı - sadece sol kenardan başlayan yatay gesture'lar için
    const drawerGesture = useMemo(
        () =>
            Gesture.Pan()
                .activeOffsetX([10, Number.MAX_SAFE_INTEGER]) // Sadece sağa doğru gesture'ları yakala
                .failOffsetX([-10, -1]) // Sola doğru gesture'ları ignore et (PagerView swipe için)
                .failOffsetY([-15, 15]) // Dikey gesture'ları ignore et (FlatList scroll için)
                .onEnd((event) => {
                    'worklet';
                    // Sağa doğru yeterince çekildiyse veya hızlı swipe yapıldıysa drawer'ı aç
                    // Threshold'u düşürdük (15px) - daha kolay açılması için
                    if (event.translationX > 15 || event.velocityX > 150) {
                        if (onDrawerOpen && isActiveTab) {
                            runOnJS(onDrawerOpen)();
                        }
                    }
                })
                .enabled(isActiveTab && !!onDrawerOpen), // Sadece aktif tab'da ve callback varsa aktif
        [isActiveTab, onDrawerOpen]
    );

    return (
        <VStack flex={1} space="xs">
            {/* Sol kenardan drawer açma gesture alanı - PagerView swipe'ını engellememek için küçük alan */}
            {isActiveTab && onDrawerOpen && (
                <GestureDetector gesture={drawerGesture}>
                    <Box
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        width={40}
                        zIndex={10}
                        pointerEvents="box-only"
                    />
                </GestureDetector>
            )}
            {/* Filters */}
            <VStack px="$4" pt="$1" pb="$1">
                {/* Filter Buttons - TODO: API'ye taşındığında categories de buradan gelecek */}
                <MessagesFilterGroup
                    categories={[]}
                    activeCategory={activeCategory}
                    onCategoryPress={handleCategoryPress}
                />
            </VStack>

            {/* Messages List - Full Height */}
            {error ? (
                <Box py={20} alignItems="center">
                    <Text color="#CE4A4A">{t('messages.error', { message: error.message })}</Text>
                </Box>
            ) : isLoading ? (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    data={getFilteredMessages()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <MessageCardRow item={item} onPress={handleMessagePress} />
                    )}
                    keyExtractor={(item, index) => item.id || `message-${index}`}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 0,
                        paddingBottom: bottomInset,
                        flexGrow: getFilteredMessages().length === 0 ? 1 : 0,
                    }}
                    ListEmptyComponent={
                        <Box py={40} alignItems="center" justifyContent="center" flex={1}>
                            <Text color={isDark ? '#8C8C8C' : '#8C8C8C'}>{t('messages.empty')}</Text>
                        </Box>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isManualRefreshing}
                            onRefresh={async () => {
                                setIsManualRefreshing(true);
                                try {
                                    await refetch();
                                } finally {
                                    setIsManualRefreshing(false);
                                }
                            }}
                            tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
                        />
                    }
                />
            )}
        </VStack>
    );
};

MessagesScreen.displayName = 'MessagesScreen';

export default MessagesScreen;
