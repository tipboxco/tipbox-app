import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FlatList, RefreshControl } from 'react-native';
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
import MessageCard from '../components/MessageCard/index';
import MessagesFilterGroup from '../components/MessagesFilterGroup/index';
import type { InboxStackParamList } from '../navigation';
import { useSafeAreaValues } from '@/src/utils';
import { useMessages, inboxKeys } from '../api/hooks';
import type { InboxMessage } from '../types';
import { useSocket } from '@/src/providers/SocketProvider';
import { useQueryClient } from '@tanstack/react-query';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useAppStore } from '@/src/store/appStore';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { MessageSkeleton } from '@/src/components/Skeletons';

type MessagesScreenNavigationProp = NativeStackNavigationProp<InboxStackParamList>;

interface MessagesScreenProps {
    onDrawerOpen?: () => void;
    isActiveTab?: boolean;
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ onDrawerOpen, isActiveTab = true }) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const [activeCategory, setActiveCategory] = useState<string>('1');
    const navigation = useNavigation<MessagesScreenNavigationProp>();
    const bottomInset = useSafeAreaValues('bottom');
    
    const { data: messages, isLoading, error, refetch, isRefetching } = useMessages();
    const queryClient = useQueryClient();
    const { isConnected, on, off, markThreadRead } = useSocket();
    const { user } = useAppStore();
    const { closeBottomSheet } = useGlobalBottomSheet();
    
    // Typing state: Hangi thread'de hangi kullanıcı typing yapıyor?
    // Format: { [threadId]: { userId: string, userName?: string } }
    const [typingUsers, setTypingUsers] = useState<{ [threadId: string]: { userId: string; userName?: string } }>({});
    // Typing timeout'ları için ref (cleanup için)
    const typingTimeoutsRef = useRef<{ [threadId: string]: NodeJS.Timeout }>({});

    // Socket event handler - new_message event
    const handleNewMessage = useCallback((eventData: any) => {
        console.log('[MessagesScreen] 📨 New message received:', {
            threadId: eventData.threadId,
            messageId: eventData.messageId,
            senderId: eventData.senderId,
            message: eventData.message || eventData.text,
        });
        
        // Yeni mesaj geldiğinde, eğer kullanıcı inbox listesindeyse (MessageDetail ekranında değilse),
        // thread'i okunmamış olarak işaretle (optimistic update)
        // Not: Eğer kullanıcı MessageDetail ekranındaysa, MessageDetail'deki handleNewMessage mesajı okundu olarak işaretleyecek
        if (eventData.threadId) {
            queryClient.setQueryData(inboxKeys.messages(), (oldData: InboxMessage[] | undefined) => {
                if (!oldData) {
                    // Eğer data yoksa, backend'den çekilecek (invalidate ile)
                    return oldData;
                }
                
                const currentUserId = user?.id;
                const isReceivedMessage = eventData.senderId && eventData.senderId !== currentUserId;
                const threadIndex = oldData.findIndex((msg) => msg.id === eventData.threadId);
                
                if (threadIndex !== -1) {
                    // Thread bulundu: Güncelle ve en üste taşı
                    const thread = oldData[threadIndex];
                    let updated: InboxMessage;
                    
                    if (isReceivedMessage) {
                        // Alınan mesaj: Okunmamış olarak işaretle
                        updated = {
                            ...thread,
                            isUnread: true,
                            unreadCount: (thread.unreadCount || 0) + 1,
                            lastMessage: eventData.message || eventData.text || thread.lastMessage,
                            timestamp: eventData.timestamp || new Date().toISOString(),
                        };
                    } else {
                        // Gönderilen mesaj: Sadece lastMessage ve timestamp'i güncelle
                        updated = {
                            ...thread,
                            lastMessage: eventData.message || eventData.text || thread.lastMessage,
                            timestamp: eventData.timestamp || new Date().toISOString(),
                        };
                    }
                    
                    // Thread'i en üste taşı (yeni mesaj geldiği/gönderildiği için)
                    const newData = [...oldData];
                    newData.splice(threadIndex, 1);
                    newData.unshift(updated);
                    return newData;
                } else {
                    // Thread bulunamadı: Yeni thread olabilir, backend'den çekilecek (invalidate ile)
                    console.log('[MessagesScreen] ⚠️ Thread not found in cache, will fetch from backend:', eventData.threadId);
                }
                
                return oldData;
            });
        }
        
        // Backend'den güncel veri çek (invalidate + refetch)
        // Not: Optimistic update zaten yapıldı, bu sadece backend'den güncel veriyi çekmek için
        queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
        // Refetch yap (invalidate yeterli olmayabilir, özellikle yeni thread'ler için)
        setTimeout(() => {
            queryClient.refetchQueries({ queryKey: inboxKeys.messages() });
        }, 300);
    }, [queryClient, user?.id]);

    // Socket event handler - thread_read event (thread okundu olarak işaretlendiğinde)
    const handleThreadRead = useCallback((eventData: { threadId: string; readBy: string; timestamp: string }) => {
        console.log('[MessagesScreen] 📖 Thread read event received:', eventData);
        
        // Optimistic update: Local state'te thread'i okundu olarak işaretle (hemen UI'da göster)
        queryClient.setQueryData(inboxKeys.messages(), (oldData: InboxMessage[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map((msg) => 
                msg.id === eventData.threadId 
                    ? { ...msg, isUnread: false, unreadCount: 0 }
                    : msg
            );
        });
        
        // Invalidate messages query to refresh the list (backend'den güncel veri çek)
        queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
        // Refetch yap (invalidate yeterli olmayabilir)
        setTimeout(() => {
            queryClient.refetchQueries({ queryKey: inboxKeys.messages() });
        }, 100);
    }, [queryClient]);

    // Socket event handler - user_typing event (kullanıcı typing yapıyor)
    const handleUserTyping = useCallback((eventData: { userId: string; threadId: string; isTyping: boolean }) => {
        console.log('[MessagesScreen] 👤 User typing event received:', {
            userId: eventData.userId,
            threadId: eventData.threadId,
            isTyping: eventData.isTyping,
            currentUserId: user?.id,
        });
        
        // Kendi typing durumumuzu gösterme (sadece karşı kullanıcının typing durumunu göster)
        if (eventData.userId === user?.id) {
            return;
        }
        
        // Typing state'i güncelle
        setTypingUsers((prev) => {
            if (eventData.isTyping) {
                // Typing başladı: Mevcut timeout'u temizle
                if (typingTimeoutsRef.current[eventData.threadId]) {
                    clearTimeout(typingTimeoutsRef.current[eventData.threadId]);
                    delete typingTimeoutsRef.current[eventData.threadId];
                }
                
                // Thread'deki kullanıcıyı bul ve typing state'e ekle
                const thread = messages?.find((msg) => msg.id === eventData.threadId);
                const typingUserName = thread?.senderName;
                
                // 3 saniye sonra otomatik olarak typing'i durdur (güvenlik için)
                const timeout = setTimeout(() => {
                    setTypingUsers((prevState) => {
                        const newState = { ...prevState };
                        delete newState[eventData.threadId];
                        return newState;
                    });
                    delete typingTimeoutsRef.current[eventData.threadId];
                }, 3000);
                typingTimeoutsRef.current[eventData.threadId] = timeout;
                
                return {
                    ...prev,
                    [eventData.threadId]: {
                        userId: eventData.userId,
                        userName: typingUserName,
                    },
                };
            } else {
                // Typing durdu: Mevcut timeout'u temizle ve typing state'i kaldır
                if (typingTimeoutsRef.current[eventData.threadId]) {
                    clearTimeout(typingTimeoutsRef.current[eventData.threadId]);
                    delete typingTimeoutsRef.current[eventData.threadId];
                }
                
                const newState = { ...prev };
                delete newState[eventData.threadId];
                return newState;
            }
        });
    }, [user?.id, messages]);

    // Socket event listeners
    useEffect(() => {
        if (!isConnected) return;

        on('new_message', handleNewMessage);
        on('thread_read', handleThreadRead);
        on('user_typing', handleUserTyping);

        return () => {
            off('new_message', handleNewMessage);
            off('thread_read', handleThreadRead);
            off('user_typing', handleUserTyping);
            
            // Typing timeout'larını temizle
            Object.values(typingTimeoutsRef.current).forEach((timeout) => {
                clearTimeout(timeout);
            });
            typingTimeoutsRef.current = {};
        };
    }, [isConnected, on, off, handleNewMessage, handleThreadRead, handleUserTyping]);

    // PERFORMANCE FIX: useFocusEffect kaldırıldı
    // Tab'a geçildiğinde otomatik refetch yapılmıyor
    // Mesajlar socket event'leri ile otomatik güncelleniyor (handleNewMessage, handleThreadRead)
    // Kullanıcı manuel olarak pull to refresh yapabilir
    
    // FIX: MessagesScreen focus olduğunda bottom sheet'i kapat (Select Interests bottom sheet hatası)
    useFocusEffect(
        useCallback(() => {
            // Screen focus olduğunda bottom sheet'i kapat
            closeBottomSheet();
        }, [closeBottomSheet])
    );
    
    const handleMessagePress = (messageId: string) => {
        const message = (messages || []).find(m => m.id === messageId);
        if (!message) return;

        const threadId = message.id; // message.id = thread ID (DM_THREAD.md'ye göre)
        
        // ✅ Backend'den gelen recipientUserId direkt kullanılıyor (geçici çözüm kaldırıldı)
        const recipientUserId = message.recipientUserId;
        
        if (!recipientUserId) {
            console.warn('[MessagesScreen] ⚠️ recipientUserId is missing in message response:', message);
            // Fallback: MessageDetail ekranında thread'den alınacak
        }
        
        // Okunmamış mesaj ise thread'i okundu olarak işaretle
        if (message.isUnread || message.unreadCount > 0) {
            console.log('[MessagesScreen] 📖 Marking thread as read:', threadId);
            
            // Optimistic update: Local state'i güncelle (hemen UI'da göster)
            queryClient.setQueryData(inboxKeys.messages(), (oldData: InboxMessage[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.map((msg) => 
                    msg.id === messageId 
                        ? { ...msg, isUnread: false, unreadCount: 0 }
                        : msg
                );
            });
            
            // Backend'e bildir: Socket bağlıysa socket ile, değilse API ile
            if (isConnected) {
                // Socket ile bildir
                markThreadRead(threadId);
            } else {
                // Socket bağlı değilse API ile bildir (eğer endpoint varsa)
                // Not: Backend'de thread okundu işaretleme için API endpoint'i olmayabilir
                // Bu durumda socket bağlantısı kurulduğunda otomatik olarak işaretlenecek
                console.warn('[MessagesScreen] ⚠️ Socket not connected, thread read status will be updated when socket connects');
            }
            
            // Query'i invalidate et ve refetch yap ki backend'den güncel veri çekilsin
            // thread_read event'i geldiğinde de invalidate edilecek ama burada da yapıyoruz
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: inboxKeys.messages() });
                queryClient.refetchQueries({ queryKey: inboxKeys.messages() });
            }, 500);
        }
        
        // MessageDetail ekranına git (backend'den gelen recipientUserId ile)
        navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
            messageId: threadId,
            threadId: threadId,
            recipientUserId: recipientUserId, // ✅ Backend'den direkt gelen recipientUserId
            senderName: message.senderName,
            senderTitle: message.senderTitle || '',
            senderAvatar: message.senderAvatar,
        });
    };

    const handleCategoryPress = (categoryId: string) => {
        setActiveCategory(categoryId);
    };

    const getFilteredMessages = () => {
        let filtered: InboxMessage[] = messages || [];

        // Aynı recipientUserId'ye sahip thread'leri birleştir
        // Aynı kullanıcıdan gelen mesajlar tek bir thread'de gösterilmeli
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

        return filtered;
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
        <VStack flex={1} space="md">
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
            <VStack px="$4" space="md">
                {/* Filter Buttons - TODO: API'ye taşındığında categories de buradan gelecek */}
                <MessagesFilterGroup
                    categories={[]}
                    activeCategory={activeCategory}
                    onCategoryPress={handleCategoryPress}
                />
            </VStack>

            {/* Messages List - Full Height */}
            {isLoading && !messages ? (
                <MessageSkeleton count={5} />
            ) : error ? (
                <Box py={20} alignItems="center">
                    <Text color="#CE4A4A">Hata: {error.message}</Text>
                </Box>
            ) : (
                <FlatList
                    data={getFilteredMessages()}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const typingInfo = typingUsers[item.id];
                        const isTyping = !!typingInfo;
                        const typingUserName = typingInfo?.userName;
                        
                        return (
                            <MessageCard
                                data={item}
                                onPress={handleMessagePress}
                                isTyping={isTyping}
                                typingUserName={typingUserName}
                            />
                        );
                    }}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomInset }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={() => refetch()}
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
