import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource, formatRelativeTime, DEFAULT_USER_AVATAR } from '@/src/utils';
import {
    useMarkNotificationAsRead,
    useDeleteNotification,
} from '../api/hooks';
import type { Notification, NotificationType } from '../api/types';
import { LightBulbIcon } from 'react-native-heroicons/solid';
import { TrophyIcon } from 'react-native-heroicons/outline';
import { notificationService } from '@/src/services/NotificationService';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { LikedUsersBottomSheet } from './LikedUsersBottomSheet';
import { Platform } from 'react-native';
import { useSafeAreaValues } from '@/src/utils';

export interface NotificationCardProps {
    notification: Notification;
    onPress?: () => void;
    onMarkAsRead?: () => void;
    onDelete?: () => void;
}

/**
 * Bildirim tipine ve data objesine göre mesaj oluşturur
 * Dokümana göre: message field'ı yok, tüm bilgiler data objesi içinde
 * Username notification.username alanından alınır
 */
/**
 * Instagram benzeri bildirim mesajı oluşturucu
 * Gruplandırılmış ve tekil bildirimler için optimize edilmiş
 */
const getNotificationMessage = (
    type: NotificationType, 
    username: string, 
    data: any, 
    isGrouped?: boolean, 
    count?: number
): string => {
    // Username direkt notification.username'den gelir
    const displayUsername = username || 'User';
    
    // Gruplandırılmış bildirimler için özel mesaj formatı (Instagram benzeri)
    if (isGrouped && count && count > 1) {
        const otherCount = count - 1;
        switch (type) {
            case 'POST_LIKED':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha gönderini beğendi`;
            case 'POST_COMMENTED':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha yorum yaptı`;
            case 'POST_SHARED':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha paylaştı`;
            case 'POST_FAVORITED':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha favoriledi`;
            case 'COMMENT_LIKED':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha yorumunu beğendi`;
            case 'COMMENT_REPLIED':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha yanıt verdi`;
            case 'NEW_TRUSTER':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha seni takip etmeye başladı`;
            case 'NEW_TRUSTED_BY':
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha seni takip ediyor`;
            default:
                return `${displayUsername} ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha etkileşimde bulundu`;
        }
    }
    
    // Tekil bildirimler için standart mesajlar
    switch (type) {
        // POST INTERACTIONS
        case 'POST_LIKED':
            return `${displayUsername} gönderini beğendi`;
        case 'POST_COMMENTED':
            return `${displayUsername} yorum yaptı`;
        case 'POST_SHARED':
            return `${displayUsername} paylaştı`;
        case 'POST_FAVORITED':
            return `${displayUsername} favoriledi`;
        
        // COMMENT INTERACTIONS
        case 'COMMENT_LIKED':
            return `${displayUsername} yorumunu beğendi`;
        case 'COMMENT_REPLIED':
            return `${displayUsername} yanıt verdi`;
        
        // TRUST/FOLLOW NOTIFICATIONS
        case 'NEW_TRUSTER':
            return `${displayUsername} seni takip etmeye başladı`;
        case 'NEW_TRUSTED_BY':
            return `${displayUsername} seni takip ediyor`;
        
        // MESSAGING NOTIFICATIONS
        case 'DM_REQUEST_RECEIVED':
            // Username varsa göster, yoksa generic mesaj
            return displayUsername && displayUsername !== 'User' 
                ? `${displayUsername} sent a message request`
                : 'User sent a message request';
        case 'DM_REQUEST_ACCEPTED':
            return `${displayUsername} accepted your message request`;
        case 'DM_REQUEST_DECLINED':
            return `${displayUsername} declined your message request`;
        case 'SUPPORT_REQUEST_ACCEPTED':
            const expertName = data?.expertName || displayUsername;
            return `${expertName} accepted your support request`;
        case 'NEW_MESSAGE':
            return `${displayUsername} sent a new message`;
        
        // TIPS NOTIFICATIONS
        case 'TIPS_RECEIVED':
            return `${displayUsername} sent you a tip`;
        case 'TIPS_SENT':
            return `Tip sent to ${displayUsername}`;
        
        // GAMIFICATION NOTIFICATIONS
        case 'NEW_BADGE':
            return 'You earned a new badge!';
        case 'ACHIEVEMENT_UNLOCKED':
            return 'Achievement unlocked!';
        case 'REWARD_EARNED':
            const rewardAmount = data?.amount || 0;
            return `You earned ${rewardAmount} TIPS reward!`;
        
        // EXPERT NOTIFICATIONS
        case 'EXPERT_REQUEST_AVAILABLE':
            return 'New expert question available';
        case 'EXPERT_REQUEST_ANSWERED':
            const expertNameAnswered = data?.expertName || displayUsername;
            return `${expertNameAnswered} answered the question`;
        
        // EVENT NOTIFICATIONS
        case 'EVENT_STARTED':
            return 'Event started!';
        case 'EVENT_ENDING_SOON':
            return 'Event ending soon!';
        case 'EVENT_REWARD_AVAILABLE':
            return 'Event reward available!';
        
        // COLLECTION NOTIFICATIONS
        case 'COLLECTION_POST_ADDED':
            return 'Post added to collection';
        case 'COLLECTION_SHARED':
            return 'Collection shared';
        
        // SYSTEM NOTIFICATIONS
        case 'SYSTEM_ANNOUNCEMENT':
            return 'System announcement';
        
        default:
            return 'New notification';
    }
};

/**
 * Bildirim tipini kategoriye göre gruplar
 */
const getNotificationCategory = (type: NotificationType): 'post' | 'comment' | 'trust' | 'message' | 'tips' | 'event' | 'gamification' | 'expert' | 'system' => {
    switch (type) {
        case 'POST_LIKED':
        case 'POST_COMMENTED':
        case 'POST_SHARED':
        case 'POST_FAVORITED':
            return 'post';
        
        case 'COMMENT_LIKED':
        case 'COMMENT_REPLIED':
            return 'comment';
        
        case 'NEW_TRUSTER':
        case 'NEW_TRUSTED_BY':
            return 'trust';
        
        case 'NEW_MESSAGE':
        case 'DM_REQUEST_RECEIVED':
        case 'DM_REQUEST_ACCEPTED':
            return 'message';
        
        case 'TIPS_RECEIVED':
        case 'TIPS_SENT':
            return 'tips';
        
        case 'EVENT_STARTED':
        case 'EVENT_ENDING_SOON':
        case 'EVENT_REWARD_AVAILABLE':
            return 'event';
        
        case 'NEW_BADGE':
        case 'ACHIEVEMENT_UNLOCKED':
        case 'REWARD_EARNED':
            return 'gamification';
        
        case 'EXPERT_REQUEST_AVAILABLE':
        case 'EXPERT_REQUEST_ANSWERED':
            return 'expert';
        
        case 'SYSTEM_ANNOUNCEMENT':
        default:
            return 'system';
    }
};

/**
 * Post Type'ı Türkçe'ye çevirir
 * Backend tag'lerini frontend gösterim değerlerine çevirir
 */
const translatePostType = (postType: string | undefined): string => {
    if (!postType) return 'İpucu';
    
    const mapping: Record<string, string> = {
        'QUESTION': 'Soru',
        'Tips': 'İpucu',
        'TIP': 'İpucu',
        'Review': 'İnceleme',
        'REVIEW': 'İnceleme',
        'Experience': 'Deneyim',
        'EXPERIENCE': 'Deneyim',
        'Update': 'Güncelleme',
        'UPDATE': 'Güncelleme',
        'Benchmark': 'Karşılaştırma',
        'BENCHMARK': 'Karşılaştırma',
        'FREE': 'Genel',
        'PREMIUM': 'Premium',
    };
    
    return mapping[postType] || postType;
};

/**
 * Post Card Component
 * Post ile ilgili bildirimler için özel card tasarımı
 * Görseldeki tasarım: Büyük card, "İpucu" tag'i sol üstte, başlık ve içerik, kategori sağ üstte
 * Image sağ tarafta yer alır
 */
const PostCard: React.FC<{
    notification: Notification;
    isDark: boolean;
    postImage?: any; // Image source
}> = ({ notification, isDark, postImage }) => {
    const data = notification.data || notification.metadata || {};
    const postContent = data.postContent;
    const description = data.description; // POST_COMMENTED için yorum metni
    const postTypeRaw = data.postType;
    const postType = translatePostType(postTypeRaw); // Türkçe'ye çevir
    const categoryName = data.categoryName;

    // Post içeriği yoksa gösterilmez
    if (!postContent) {
        return null;
    }

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={12}
            px="$3"
            py="$3"
            mt={6}
            position="relative"
            minHeight={100}
            alignSelf="stretch"
        >
            <VStack space="sm" width="100%">
                {/* Post tipi badge (İpucu) - Tek satır, full width */}
                {postType && (
                    <HStack
                        bg="#3B82F6"
                        borderRadius={20}
                        px="$2.5"
                        py="$1"
                        alignItems="center"
                        space="xs"
                        alignSelf="flex-start"
                    >
                        <LightBulbIcon width={12} height={12} color="#FFFFFF" />
                        <Text
                            color="#FFFFFF"
                            fontSize="$xs"
                            fontWeight="$semibold"
                        >
                            {postType}
                        </Text>
                    </HStack>
                )}

                {/* Content ve Image - Aynı satırda */}
                <HStack space="md" alignItems="flex-start" flex={1} width="100%">
                    {/* Sol taraf: İçerik */}
                    <VStack flex={1} flexShrink={1} mr={postImage ? "$2" : 0}>
                        {/* Kategori bilgisi - Sağ üstte (image varsa kategoriyi kaldır, yoksa göster) */}
                        {categoryName && !postImage && (
                            <HStack
                                position="absolute"
                                top={0}
                                right={0}
                                alignItems="center"
                                space="xs"
                            >
                                <Text
                                    color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                    fontSize="$xs"
                                    fontWeight="$normal"
                                >
                                    {categoryName}
                                </Text>
                                <Box
                                    width={14}
                                    height={14}
                                    bg={isDark ? '#3A3A3A' : '#E0E0E0'}
                                    borderRadius={4}
                                />
                            </HStack>
                        )}

                        {/* Post içeriği - Truncated */}
                        {postContent && (
                            <Text
                                color={isDark ? '#666666' : '#666666'}
                                fontSize="$sm"
                                fontWeight="$normal"
                                numberOfLines={2}
                                lineHeight={20}
                            >
                               vbsdlkhdhlnkhdlsvbkhldfnkhvnsdksldfkngvsdklvgksdghksjdvfghlskghnglsknldk
                            </Text>
                        )}
                    </VStack>

                    {/* Sağ taraf: Image */}
                    {postImage && (
                        <Box
                            width={50}
                            height={50}
                            borderRadius={8}
                            overflow="hidden"
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#E9E9E9'}
                            flexShrink={0}
                        >
                            <Image
                                source={postImage}
                                alt="Post preview"
                                width={50}
                                height={50}
                                style={{ resizeMode: 'cover' }}
                            />
                        </Box>
                    )}
                </HStack>
            </VStack>
        </Box>
    );
};

/**
 * Tips Card Component
 * Tips bildirimleri için özel buton tasarımı
 * Profili Görüntüle butonu gibi ama içinde +X TIPS yazıyor
 */
const TipsCard: React.FC<{
    notification: Notification;
    onPress?: () => void;
}> = ({ notification, onPress }) => {
    const data = notification.data || notification.metadata || {};
    // Dokümana göre: TIPS_RECEIVED ve TIPS_SENT için data.amount kullanılır
    const tipsAmount = data.amount;

    // Amount yoksa buton gösterilmez
    if (!tipsAmount) return null;

    return (
        <Pressable
            bg="#E8FF6B"
            borderRadius={20}
            px="$4"
            py="$2"
            alignSelf="flex-start"
            onPress={onPress}
            mt={4}
        >
            <Text
                color="#000000"
                fontSize="$xs"
                fontWeight="$semibold"
            >
                +{tipsAmount} TIPS
            </Text>
        </Pressable>
    );
};

/**
 * Trust Card Component
 * Trust bildirimleri için özel buton tasarımı
 */
const TrustCard: React.FC<{
    notification: Notification;
    onPress?: () => void;
}> = ({ notification, onPress }) => {
    return (
        <Pressable
            bg="#E8FF6B"
            borderRadius={20}
            px="$4"
            py="$2"
            alignSelf="flex-start"
            onPress={onPress}
        >
            <Text
                color="#000000"
                fontSize="$xs"
                fontWeight="$semibold"
            >
                View Profile
            </Text>
        </Pressable>
    );
};

/**
 * Chat Button Component
 * Mesaj isteği kabul edildi bildirimleri için özel buton tasarımı
 */
const ChatButton: React.FC<{
    notification: Notification;
    onPress?: () => void;
}> = ({ notification, onPress }) => {
    return (
        <Pressable
            bg="#E8FF6B"
            borderRadius={20}
            px="$4"
            py="$2"
            alignSelf="flex-start"
            onPress={onPress}
        >
            <Text
                color="#000000"
                fontSize="$xs"
                fontWeight="$semibold"
            >
                Go to Chat
            </Text>
        </Pressable>
    );
};

/**
 * Comment/Message Card Component
 * Yorum ve mesaj bildirimleri için özel metin önizlemesi
 * POST_COMMENTED için description, DM_REQUEST için message kullanılır
 */
const CommentCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    // POST_COMMENTED için description, DM_REQUEST_RECEIVED için message kullanılır
    const commentContent = notification.type === 'POST_COMMENTED' 
        ? data.description 
        : data.message;

    if (!commentContent) return null;

    return (
        <Box mt={4} flex={1} alignSelf="stretch">
            <Text
                color={isDark ? '#B9B9B9' : '#666666'}
                fontSize="$xs"
                fontWeight="$normal"
                numberOfLines={2}
            >
                {commentContent}
            </Text>
        </Box>
    );
};

/**
 * Request Card Component
 * Support request bildirimleri için özel card tasarımı
 * username, message, type ve amount gösterir
 */
const RequestCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    const requestMessage = data.message;
    const requestType = data.requestType || data.type; // GENERAL | TECHNICAL | PRODUCT
    const requestAmount = data.amount; // String formatında
    const requestStatus = data.requestStatus || data.status; // pending | accepted | declined | completed
    const senderUsername = notification.username || data.senderName || data.userName || 'User';

    if (!requestMessage && !requestType && !requestAmount) return null;

    // Request type'ı Türkçe'ye çevir
    const getRequestTypeLabel = (type?: string): string => {
        switch (type) {
            case 'GENERAL':
                return 'Genel';
            case 'TECHNICAL':
                return 'Teknik';
            case 'PRODUCT':
                return 'Ürün';
            default:
                return type || 'Bilinmeyen';
        }
    };

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={12}
            px="$3"
            py="$3"
            mt={6}
            alignSelf="stretch"
        >
            <VStack space="sm">
                {/* Username */}
                {senderUsername && (
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
                        fontWeight="$bold"
                    >
                        {senderUsername}
                    </Text>
                )}

                {/* Message */}
                {requestMessage && (
                    <Text
                        color={isDark ? '#666666' : '#666666'}
                        fontSize="$sm"
                        fontWeight="$normal"
                        numberOfLines={3}
                        lineHeight={20}
                    >
                        {requestMessage}
                    </Text>
                )}

                {/* Type and Amount */}
                <HStack space="sm" alignItems="center" flexWrap="wrap">
                    {/* Request Type */}
                    {requestType && (
                        <Box
                            bg={isDark ? '#3A3A3A' : '#E0E0E0'}
                            borderRadius={8}
                            px="$2"
                            py="$1"
                        >
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize="$xs"
                                fontWeight="$semibold"
                            >
                                {getRequestTypeLabel(requestType)}
                            </Text>
                        </Box>
                    )}

                    {/* Amount */}
                    {requestAmount && (
                        <Box
                            bg="#3B82F6"
                            borderRadius={8}
                            px="$2"
                            py="$1"
                        >
                            <Text
                                color="#FFFFFF"
                                fontSize="$xs"
                                fontWeight="$bold"
                            >
                                {typeof requestAmount === 'string' ? requestAmount : requestAmount.toFixed(2)} TIPS
                            </Text>
                        </Box>
                    )}
                </HStack>
            </VStack>
        </Box>
    );
};

/**
 * Event Card Component
 * Event bildirimleri için özel card tasarımı
 * eventName, eventId ve description gösterir
 * Görsel item'in sağında gösterilir (EventCard içinde değil)
 */
const EventCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    const eventName = data.eventName;
    const eventId = data.eventId;
    const eventDescription = data.description || data.message;

    if (!eventName && !eventId && !eventDescription) return null;

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={12}
            px="$3"
            py="$3"
            mt={6}
            alignSelf="stretch"
        >
            <VStack space="sm">
                {/* Event Name */}
                {eventName && (
                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize="$sm"
                        fontWeight="$bold"
                    >
                        {eventName}
                    </Text>
                )}

                {/* Event Description */}
                {eventDescription && (
                    <Text
                        color={isDark ? '#666666' : '#666666'}
                        fontSize="$sm"
                        fontWeight="$normal"
                        numberOfLines={3}
                        lineHeight={20}
                    >
                        {eventDescription}
                    </Text>
                )}
            </VStack>
        </Box>
    );
};

/**
 * Gamification Card Component
 * Badge ve achievement bildirimleri için özel tasarım
 */
const GamificationCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    // Minimal yapı: badgeName, message field'ları kaldırıldı (mesaj getNotificationMessage ile oluşturuluyor)
    // achievementId kaldırıldı, sadece badgeId ve amount var
    const rewardAmount = data.amount || data.rewardAmount;

    // Sadece reward amount varsa göster
    if (!rewardAmount) {
        return null;
    }

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={8}
            p="$3"
            mt={12}
        >
            <HStack space="sm" alignItems="center">
                <TrophyIcon width={24} height={24} color="#E8FF6B" />
                <VStack flex={1}>
                    {/* Mesaj getNotificationMessage ile oluşturuluyor, burada gösterilmez */}
                </VStack>
                <Box
                    bg="#E8FF6B"
                    borderRadius={12}
                    px="$2"
                    py="$1"
                >
                    <Text
                        color="#000000"
                        fontSize="$xs"
                        fontWeight="$bold"
                    >
                        +{rewardAmount}
                    </Text>
                </Box>
            </HStack>
        </Box>
    );
};

/**
 * Main Notification Card Component
 * Tüm bildirim tipleri için tek bir component
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
    notification,
    onPress,
    onMarkAsRead,
    onDelete,
}) => {
    // Log bildirim verisi
    React.useEffect(() => {
        console.log('[NotificationCard] 📨 Bildirim verisi:', JSON.stringify(notification, null, 2));
    }, [notification]);

    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const markAsReadMutation = useMarkNotificationAsRead();
    const deleteMutation = useDeleteNotification();
    
    // Global bottom sheet hook
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const safeAreaValues = useSafeAreaValues();
    const bottomInset = typeof safeAreaValues.bottom === 'number' ? safeAreaValues.bottom : 0;
    
    // Backend'den gelen gruplandırma bilgileri (Instagram benzeri)
    // CRITICAL FIX: primaryUser veya otherUsers varsa otomatik olarak isGrouped: true yap
    // Backend'den isGrouped field'ı gelmeyebilir ama primaryUser/otherUsers varsa gruplandırılmış bildirimdir
    const hasPrimaryUser = notification.primaryUser && notification.primaryUser.id;
    const hasOtherUsers = Array.isArray(notification.otherUsers) && notification.otherUsers.length > 0;
    // CRITICAL FIX: isGrouped boolean olarak hesapla
    const isGrouped = !!(notification.isGrouped === true || hasPrimaryUser || hasOtherUsers);
    // Count hesapla: backend'den geliyorsa kullan, yoksa primaryUser + otherUsers sayısından hesapla
    const otherUsersArray = Array.isArray(notification.otherUsers) ? notification.otherUsers : [];
    const groupedCount = notification.count || (hasPrimaryUser && hasOtherUsers ? otherUsersArray.length + 1 : 0);
    const primaryUser = notification.primaryUser;
    const otherUsers = Array.isArray(notification.otherUsers) ? notification.otherUsers : [];
    
    // CRITICAL FIX: Liked users bottom sheet açma handler'ı
    // Worklet hatası önlemek için useCallback ile wrap et ve değerleri güvenli hale getir
    const handleLikedUsersPress = React.useCallback(() => {
        // Güvenli değerleri hazırla
        const safePrimaryUser = primaryUser || undefined;
        const safeOtherUsers = Array.isArray(otherUsers) ? otherUsers : [];
        
        // CRITICAL FIX: Worklet hatası önlemek için değerleri kontrol et
        if (!safePrimaryUser && safeOtherUsers.length === 0) {
            console.warn('[NotificationCard] Cannot open bottom sheet: no users available');
            return;
        }
        
        // Bottom sheet'i aç
        openBottomSheet(
            <LikedUsersBottomSheet
                primaryUser={safePrimaryUser}
                otherUsers={safeOtherUsers}
                onClose={closeBottomSheet}
            />,
            {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableHandlePanningGesture: true,
                enableContentPanningGesture: true,
                enableDynamicSizing: true,
                animateOnMount: true,
                paddingBottom: Platform.OS === 'ios' ? bottomInset + 8 : 8,
            }
        );
    }, [primaryUser, otherUsers, openBottomSheet, closeBottomSheet, bottomInset]);

    const handlePress = () => {
        // Mark as read
        if (!notification.read && onMarkAsRead) {
            markAsReadMutation.mutate(notification.id, {
                onSuccess: () => {
                    onMarkAsRead();
                },
            });
        }

        // CRITICAL: Tips, Sohbeti Görüntüle ve Profili Görüntüle butonları olan bildirimlerde
        // item'e tıklanınca navigation yapılmasın, sadece butonlara tıklanınca yapılsın
        const type = notification.type;
        if (type === 'TIPS_RECEIVED' || type === 'TIPS_SENT' || 
            type === 'DM_REQUEST_ACCEPTED' || 
            type === 'NEW_TRUSTER' || type === 'NEW_TRUSTED_BY') {
            // Bu bildirimlerde sadece butonlara tıklanınca navigation yapılacak
            return;
        }

        // Navigation based on notification type (dokümana göre güncellendi)
        try {
            const data = notification.data || notification.metadata || {};

            // 1. Post Etkileşimleri → PostDetailScreen (postId ile)
            if (type === 'POST_LIKED' || type === 'POST_COMMENTED' || type === 'POST_SHARED' || type === 'POST_FAVORITED') {
                if (data.postId) {
                    navigationService.navigate(ROOT_ROUTES.POST, {
                        screen: 'PostDetailScreen',
                        params: {
                            postData: { id: data.postId },
                            postId: data.postId,
                            type: 'post',
                        },
                    }, {
                        priority: 'high',
                        force: false,
                    });
                    return;
                }
            }

            // 2. Yorum Etkileşimleri → PostDetailScreen (postId + commentId ile, yorumu highlight et)
            if (type === 'COMMENT_LIKED' || type === 'COMMENT_REPLIED') {
                if (data.postId) {
                    navigationService.navigate(ROOT_ROUTES.POST, {
                        screen: 'PostDetailScreen',
                        params: {
                            postData: { id: data.postId },
                            postId: data.postId,
                            type: 'post',
                            // commentId PostStackParamList'e eklendi (yorumu highlight etmek için)
                            commentId: data.commentId,
                        },
                    }, {
                        priority: 'high',
                        force: false,
                    });
                    return;
                }
            }

            // 3. Trust & Follow → ProfileScreen (userId root seviyede)
            // NOT: NEW_TRUSTER ve NEW_TRUSTED_BY handlePress başında return edildiği için buraya gelmez
            // Navigation sadece butonlara tıklanınca yapılacak

            // 4. Mesajlaşma Bildirimleri → MessageDetail veya SupportMessageDetail
            if (type === 'DM_REQUEST_RECEIVED') {
                if (data.threadId) {
                    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
                        messageId: data.threadId,
                        threadId: data.threadId,
                        recipientUserId: notification.userId,
                    });
                    return;
                }
            }

            // DM_REQUEST_DECLINED → Özel ekrana yönlendirme gerekmez (dokümana göre)
            if (type === 'DM_REQUEST_DECLINED') {
                // Bildirim gösterilir, özel bir ekrana yönlendirme gerekmez
                if (onPress) onPress();
                return;
            }

            // SUPPORT_REQUEST_ACCEPTED → SupportMessageDetail (threadId ile)
            // CRITICAL: Backend'den requestId de gelmeli (SupportMessageDetail için gerekli)
            if (type === 'SUPPORT_REQUEST_ACCEPTED') {
                if (data.threadId) {
                    // SupportMessageDetail için gerekli parametreleri hazırla
                    // Backend'den threadId geliyor, requestId de gelmeli (eksik field)
                    navigateToSharedScreenWithPruning(ROOT_ROUTES.SUPPORT_MESSAGE_DETAIL, {
                        requestId: data.requestId || data.threadId, // requestId backend'den gelmeli
                        threadId: data.threadId,
                        expertName: notification.userId ? 'Expert' : 'User', // Backend'den gelmeli
                        expertTitle: '',
                        expertAvatar: notification.avatar || null,
                        recipientUserId: notification.userId,
                        status: 'active',
                    });
                    return;
                }
            }

            // 5. Gamification (Badge & Achievement) → Profile → Collections (badgeId ile)
            if (type === 'NEW_BADGE' || type === 'ACHIEVEMENT_UNLOCKED') {
                if (data.badgeId) {
                    // Profile → Collections ekranına yönlendir (badge detayı burada gösterilir)
                    navigationService.navigate(ROOT_ROUTES.PROFILE, {
                        screen: 'Collections',
                    }, {
                        priority: 'high',
                        force: false,
                    });
                    return;
                }
            }

            // REWARD_EARNED → WalletScreen
            if (type === 'REWARD_EARNED') {
                navigationService.navigate(ROOT_ROUTES.WALLET, {
                    screen: 'WalletScreen',
                }, {
                    priority: 'high',
                    force: false,
                });
                return;
            }

            // 6. Event Bildirimleri → EventDetailScreen (eventId ile)
            if (type === 'EVENT_STARTED' || type === 'EVENT_ENDING_SOON' || type === 'EVENT_REWARD_AVAILABLE') {
                if (data.eventId) {
                    navigationService.navigate(ROOT_ROUTES.EVENT, {
                        screen: 'EventDetailScreen',
                        params: { eventId: data.eventId },
                    }, {
                        priority: 'high',
                        force: false,
                    });
                    return;
                }
            }

            // 7. Expert Bildirimleri → SupportMessageDetail (requestId ile)
            // CRITICAL: Backend'den expertName, expertTitle, expertAvatar gelmeli (eksik field'lar)
            if (type === 'EXPERT_REQUEST_AVAILABLE' || type === 'EXPERT_REQUEST_ANSWERED') {
                if (data.requestId) {
                    navigateToSharedScreenWithPruning(ROOT_ROUTES.SUPPORT_MESSAGE_DETAIL, {
                        requestId: data.requestId,
                        threadId: data.threadId || null, // EXPERT_REQUEST_ANSWERED için threadId gelmeli
                        expertName: data.expertName || notification.userId ? 'Expert' : 'User', // Backend'den gelmeli
                        expertTitle: data.expertTitle || '', // Backend'den gelmeli
                        expertAvatar: data.expertAvatar || notification.avatar || null, // Backend'den gelmeli
                        recipientUserId: notification.userId,
                        status: type === 'EXPERT_REQUEST_ANSWERED' ? 'active' : 'pending',
                    });
                    return;
                }
            }

            // 8. Collection Bildirimleri → Profile → Collections (collectionId ile)
            if (type === 'COLLECTION_POST_ADDED' || type === 'COLLECTION_SHARED') {
                if (data.collectionId) {
                    // CollectionsScreen'e yönlendir (collectionId ile detay gösterilebilir)
                    navigationService.navigate(ROOT_ROUTES.PROFILE, {
                        screen: 'Collections',
                    }, {
                        priority: 'high',
                        force: false,
                    });
                    return;
                }
            }

            // 9. Tips Bildirimleri → WalletScreen
            // NOT: TIPS_RECEIVED ve TIPS_SENT handlePress başında return edildiği için buraya gelmez
            // Navigation sadece butonlara tıklanınca yapılacak

            // Fallback: NotificationService kullan (eski sistem)
            const action = notificationService.getNavigationAction(notification);
            if (action) {
                const { route, params } = action;
                const rootRouteValues = Object.values(ROOT_ROUTES) as string[];
                
                if (rootRouteValues.includes(route)) {
                    navigationService.navigate(route as any, params, {
                        priority: 'high',
                        force: false,
                    });
                } else {
                    const tabRouteValues = Object.values(TAB_ROUTES) as string[];
                    if (tabRouteValues.includes(route)) {
                        const tabRoute = route as keyof typeof TAB_ROUTES;
                        const screenName = params?.screen || 'FeedScreen';
                        const screenParams = params?.params || {};
                        
                        navigationService.navigateNested(tabRoute as any, screenName as any, {
                            params: screenParams,
                            priority: 'high',
                            force: false,
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[NotificationCard] Navigation error:', error);
        }

        // Callback
        if (onPress) {
            onPress();
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            deleteMutation.mutate(notification.id, {
                onSuccess: () => {
                    onDelete();
                },
            });
        }
    };

    const handleAvatarPress = () => {
        // CRITICAL FIX: Gruplandırılmış bildirimlerde primaryUser.id kullan, yoksa normal userId
        // Backend'den gruplandırılmış bildirimlerde userId root seviyede yok, primaryUser.id var
        let targetUserId: string | undefined;
        
        if (isGrouped && primaryUser?.id) {
            targetUserId = primaryUser.id;
        } else if (notification.userId) {
            targetUserId = notification.userId;
        }
        
        // CRITICAL FIX: userId validasyonunu güçlendir
        // userId undefined, null, boş string veya geçersiz olmamalı
        if (!targetUserId) {
            console.warn('[NotificationCard] Avatar press: userId is missing', {
                isGrouped,
                primaryUserId: primaryUser?.id,
                notificationUserId: notification.userId,
                notificationId: notification.id,
                notificationType: notification.type,
            });
            return;
        }
        
        // String'e çevir ve trim yap (boş string kontrolü için)
        const userIdString = String(targetUserId).trim();
        
        // Boş string kontrolü
        if (!userIdString || userIdString.length === 0) {
            console.warn('[NotificationCard] Avatar press: userId is empty after conversion', {
                originalUserId: targetUserId,
                notification,
            });
            return;
        }
        
        try {
            console.log('[NotificationCard] Navigating to profile with userId:', userIdString);
            navigationService.navigate(ROOT_ROUTES.PROFILE, {
                screen: 'ProfileMain',
                params: { userId: userIdString },
            }, {
                priority: 'high',
                force: false,
            });
        } catch (error) {
            console.error('[NotificationCard] Avatar navigation error:', error);
            console.error('[NotificationCard] Notification data:', notification);
        }
    };

    // Handle Tips button press - Navigate to Wallet
    const handleTipsPress = () => {
        try {
            navigationService.navigate(ROOT_ROUTES.WALLET, {
                screen: 'WalletScreen',
            }, {
                priority: 'high',
                force: false,
            });
        } catch (error) {
            console.error('[NotificationCard] Tips navigation error:', error);
        }
    };

    // Handle Trust button press - Navigate to Profile
    const handleTrustPress = () => {
        const userId = notification.userId;
        
        // CRITICAL FIX: userId validasyonunu güçlendir
        if (!userId) {
            console.warn('[NotificationCard] Trust press: userId is missing', notification);
            return;
        }
        
        // String'e çevir ve trim yap (boş string kontrolü için)
        const userIdString = String(userId).trim();
        
        // Boş string kontrolü
        if (!userIdString || userIdString.length === 0) {
            console.warn('[NotificationCard] Trust press: userId is empty after conversion', {
                originalUserId: userId,
                notification,
            });
            return;
        }
        
        try {
            navigationService.navigate(ROOT_ROUTES.PROFILE, {
                screen: 'ProfileMain',
                params: { userId: userIdString },
            }, {
                priority: 'high',
                force: false,
            });
        } catch (error) {
            console.error('[NotificationCard] Trust navigation error:', error);
            console.error('[NotificationCard] Notification data:', notification);
        }
    };

    // Handle Chat button press - Navigate to MessageDetail with threadId
    const handleChatPress = () => {
        const data = notification.data || notification.metadata || {};
        if (data.threadId) {
            try {
                navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
                    messageId: data.threadId,
                    threadId: data.threadId,
                    recipientUserId: notification.userId,
                });
            } catch (error) {
                console.error('[NotificationCard] Chat navigation error:', error);
            }
        }
    };

    // DEBUG: Gruplandırma bilgilerini logla
    React.useEffect(() => {
        if (__DEV__) {
            console.log('[NotificationCard] 📊 Gruplandırma bilgileri:', {
                isGrouped,
                groupedCount,
                primaryUser: primaryUser ? {
                    id: primaryUser.id,
                    username: primaryUser.username,
                    hasAvatar: !!primaryUser.avatar,
                } : null,
                otherUsersCount: otherUsers.length,
                otherUsers: otherUsers.slice(0, 2).map(u => ({
                    id: u.id,
                    username: u.username,
                    hasAvatar: !!u.avatar,
                })),
                notificationId: notification.id,
                notificationType: notification.type,
                notificationUsername: notification.username,
                notificationAvatar: notification.avatar,
            });
        }
    }, [isGrouped, groupedCount, primaryUser, otherUsers.length, notification.id, notification.type, notification.username, notification.avatar]);
    
    // Avatar ve kullanıcı bilgileri
    // CRITICAL FIX: Gruplandırılmış bildirimlerde primaryUser.avatar öncelikli
    // Backend'den gruplandırılmış bildirimlerde avatar root seviyede yok, primaryUser.avatar var
    let primaryAvatar = DEFAULT_USER_AVATAR;
    if (isGrouped && primaryUser?.avatar) {
        const avatarSource = toImageSource(primaryUser.avatar);
        primaryAvatar = avatarSource || DEFAULT_USER_AVATAR;
    } else if (notification.avatar) {
        const avatarSource = toImageSource(notification.avatar);
        primaryAvatar = avatarSource || DEFAULT_USER_AVATAR;
    }
    
    // DEBUG: Avatar kontrolü
    if (__DEV__ && primaryAvatar === DEFAULT_USER_AVATAR) {
        console.warn('[NotificationCard] ⚠️ Default avatar kullanıldı:', {
            isGrouped,
            primaryUserAvatar: primaryUser?.avatar,
            notificationAvatar: notification.avatar,
            notificationId: notification.id,
        });
    }
    
    // Minimal yapı: userName field'ları kaldırıldı (mesajda zaten var)
    const category = getNotificationCategory(notification.type);
    
    // Data extraction - dokümana göre güncellendi
    const data = notification.data || notification.metadata || {};
    // Dokümana göre: TIPS_RECEIVED ve TIPS_SENT için data.amount kullanılır
    const tipsAmount = data.amount;
    const commentContent = data.description || data.message; // POST_COMMENTED için description, DM_REQUEST için message
    const postId = data.postId; // CRITICAL FIX: postId sadece data içinden alınmalı
    const eventId = data.eventId;
    // Minimal yapı: userId root seviyede zaten var, data içinde duplicate yok
    const userId = notification.userId;
    
    // CRITICAL FIX: Post preview image sadece data içinden alınmalı (root seviyede imageUrl olmamalı)
    const postImageUrl = data.imageUrl; // Root seviyedeki notification.imageUrl kaldırıldı
    const postImage = postImageUrl ? toImageSource(postImageUrl) : null;
    
    // Event image - Event bildirimleri için
    const eventImageUrl = (notification.type === 'EVENT_STARTED' || notification.type === 'EVENT_ENDING_SOON' || notification.type === 'EVENT_REWARD_AVAILABLE') ? data.imageUrl : null;
    const eventImage = eventImageUrl ? toImageSource(eventImageUrl) : null;

    // Category-based content rendering - Instagram benzeri tasarım
    const showTipsButton = category === 'tips' && tipsAmount; // Tips bildirimlerinde buton gösterilecek
    const showTrustButton = category === 'trust';
    const showCommentText = ((category === 'post' && notification.type === 'POST_COMMENTED') || category === 'message') && commentContent; // POST_COMMENTED ve DM_REQUEST için
    const showChatButton = notification.type === 'DM_REQUEST_ACCEPTED'; // Mesaj isteği kabul edildi bildirimi için
    const showPostCard = (category === 'post' || category === 'comment') && postId && data.postContent; // Post bildirimlerinde post içeriği varsa PostCard gösterilecek (görsel YOK)
    // Request card gösterimi - Support request ve DM request bildirimleri için
    const showRequestCard = (
        notification.type === 'SUPPORT_REQUEST_ACCEPTED' || 
        notification.type === 'EXPERT_REQUEST_AVAILABLE' || 
        notification.type === 'EXPERT_REQUEST_ANSWERED' ||
        notification.type === 'DM_REQUEST_RECEIVED'
    ) && (data.message || data.requestType || data.type || data.amount);
    
    // Event card gösterimi - Event bildirimleri için
    const showEventCard = (
        notification.type === 'EVENT_STARTED' || 
        notification.type === 'EVENT_ENDING_SOON' || 
        notification.type === 'EVENT_REWARD_AVAILABLE'
    ) && (data.eventName || data.eventId || data.description || data.message);

    return (
        <Pressable 
            onPress={handlePress}
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            p="$3"
            position="relative"
            borderBottomWidth={1}
            borderBottomColor={isDark ? '#333' : '#E9E9E9'}
            minHeight={showPostCard ? undefined : 80}
            height={showPostCard ? undefined : 80}
        >
            <HStack space="md" alignItems="flex-start" flex={1}>

                    {/* Avatar - Sadece primary avatar */}
                    <Pressable onPress={handleAvatarPress}>
                        <Box
                            width={48}
                            height={48}
                            justifyContent="center"
                            alignItems="center"
                        >
                            {/* Primary Avatar */}
                            <Box
                                width={48}
                                height={48}
                                borderRadius={24}
                                borderWidth={2}
                                borderColor={isDark ? '#333' : '#E9E9E9'}
                                justifyContent="center"
                                alignItems="center"
                                bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                overflow="hidden"
                            >
                                <Image
                                    source={primaryAvatar}
                                    alt="User avatar"
                                    width={44}
                                    height={44}
                                    borderRadius={22}
                                />
                            </Box>
                        </Box>
                    </Pressable>

                    {/* Content - Ortada */}
                    <VStack flex={1} space="xs" justifyContent="flex-start" alignSelf="stretch">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$sm"
                            fontWeight="$normal"
                            lineHeight={18}
                            numberOfLines={2}
                        >
                            {(() => {
                                // CRITICAL FIX: Username fallback sırası
                                // 1. Gruplandırılmış bildirimlerde primaryUser.username
                                // 2. Normal bildirimlerde notification.username
                                // 3. Data objesinden fallback (likerName, userName, commenterName, senderName)
                                let username = 'User';
                                
                                if (isGrouped && primaryUser?.username) {
                                    // Gruplandırılmış bildirimlerde primaryUser.username öncelikli
                                    username = primaryUser.username;
                                } else if (notification.username) {
                                    // Normal bildirimlerde notification.username
                                    username = notification.username;
                                } else {
                                    // Fallback: data objesinden username al
                                    const notificationData = notification.data || notification.metadata || {};
                                    if (notification.type === 'POST_LIKED' && notificationData.likerName) {
                                        username = notificationData.likerName;
                                    } else if (notification.type === 'COMMENT_LIKED' && notificationData.commenterName) {
                                        username = notificationData.commenterName;
                                    } else if (notification.type === 'POST_COMMENTED' && notificationData.commenterName) {
                                        username = notificationData.commenterName;
                                    } else if (notificationData.userName) {
                                        username = notificationData.userName;
                                    } else if (notificationData.senderName) {
                                        username = notificationData.senderName;
                                    }
                                }
                                
                              
                                
                                // Dokümana göre: message field'ı yok, type, username ve data'ya göre mesaj oluştur
                                const message = getNotificationMessage(
                                    notification.type, 
                                    username, 
                                    data, 
                                    isGrouped, // Explicit boolean conversion
                                    groupedCount
                                );
                                
                                // Gruplandırılmış bildirimlerde "ve X kişi daha" kısmını tıklanabilir yap (Instagram benzeri)
                                if (isGrouped && groupedCount > 1 && otherUsers.length > 0) {
                                    // Mesaj formatı: "username ve X kişi daha gönderini beğendi"
                                    const otherCount = groupedCount - 1;
                                    const otherText = `ve ${otherCount} ${otherCount === 1 ? 'kişi' : 'kişi'} daha`;
                                    
                                    if (message.includes(otherText)) {
                                        const parts = message.split(otherText);
                                        const beforeOther = parts[0]; // "username " (username + space)
                                        const afterOther = parts[1] || ''; // " gönderini beğendi"
                                        
                                        // Username'i bold yap, "ve X kişi daha" kısmını tıklanabilir yap
                                        const usernamePart = beforeOther.trim();
                                        
                                        // Tüm mesajı tek bir Text içinde render et (nested Text kullanarak inline hizalama)
                                        // CRITICAL FIX: onPress handler'ını useCallback ile wrap edilmiş handleLikedUsersPress kullan
                                        return (
                                            <Text fontSize="$sm">
                                                <Text fontSize="$sm" fontWeight="$semibold">{usernamePart}</Text>
                                                {' '}
                                                <Text 
                                                    fontWeight="$semibold"
                                                    fontSize="$sm"
                                                    color={isDark ? '#3B82F6' : '#000000'}
                                                    onPress={handleLikedUsersPress}
                                                    suppressHighlighting={true} // iOS'ta highlight'ı kaldır
                                                >
                                                    {otherText}
                                                </Text>
                                                {afterOther}
                                            </Text>
                                        );
                                    }
                                }
                                
                                // Username'i bold yap (aynı font size, sadece bold) - tekil bildirimler için
                                if (username && message.includes(username)) {
                                    const parts = message.split(username);
                                    return (
                                        <>
                                            {parts[0]}
                                            <Text fontWeight="semibold" fontSize="$sm">{username}</Text>
                                            {parts[1]}
                                        </>
                                    );
                                }
                                return message;
                            })()}
                        </Text>

                        {/* Content altında listelenecek yapılar */}
                        {/* Yorum metni (POST_COMMENTED için) - PostCard'dan önce */}
                        {showCommentText && notification.type === 'POST_COMMENTED' && (
                            <Box mt={4} flex={1} alignSelf="stretch">
                                <CommentCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {/* Request Card - Support request ve DM request içeriği */}
                        {showRequestCard && (
                            <Box flex={1} alignSelf="stretch">
                                <RequestCard 
                                    notification={notification} 
                                    isDark={isDark}
                                />
                            </Box>
                        )}

                        {/* Event Card - Event içeriği */}
                        {showEventCard && (
                            <Box flex={1} alignSelf="stretch">
                                <EventCard 
                                    notification={notification} 
                                    isDark={isDark}
                                />
                            </Box>
                        )}

                        {/* Post Card - Post içeriği (görsel dahil) */}
                        {showPostCard && (
                            <Box flex={1} alignSelf="stretch">
                                <PostCard 
                                    notification={notification} 
                                    isDark={isDark} 
                                    postImage={postImage || undefined}
                                />
                            </Box>
                        )}

                        {/* Butonlar */}
                        {(showTipsButton || showChatButton || showTrustButton) && (
                            <HStack space="xs" mt={4} flexWrap="wrap">
                                {showTipsButton && (
                                    <TipsCard 
                                        notification={notification} 
                                        onPress={handleTipsPress}
                                    />
                                )}
                                {showChatButton && (
                                    <ChatButton 
                                        notification={notification} 
                                        onPress={handleChatPress}
                                    />
                                )}
                                {showTrustButton && (
                                    <TrustCard notification={notification} onPress={handleTrustPress} />
                                )}
                            </HStack>
                        )}
                    </VStack>

                    {/* Event Preview Image - Sağ tarafta (Event bildirimleri için) */}
                    {eventImage && (notification.type === 'EVENT_STARTED' || notification.type === 'EVENT_ENDING_SOON' || notification.type === 'EVENT_REWARD_AVAILABLE') && (
                        <Pressable onPress={handlePress}>
                            <Box
                                width={50}
                                height={50}
                                borderRadius={8}
                                overflow="hidden"
                                borderWidth={1}
                                borderColor={isDark ? '#333' : '#E9E9E9'}
                                flexShrink={0}
                            >
                                <Image
                                    source={eventImage}
                                    alt="Event preview"
                                    width={50}
                                    height={50}
                                    style={{ resizeMode: 'cover' }}
                                />
                            </Box>
                        </Pressable>
                    )}
            </HStack>

                {/* Timestamp and Unread Badge - Position Absolute (MessageCard ile aynı) */}
                <HStack
                    position="absolute"
                    top="$3"
                    right="$3"
                    space="xs"
                    alignItems="center"
                >
                    <Text
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontSize="$xs"
                        fontWeight="$medium"
                    >
                        {formatRelativeTime(notification.createdAt)}
                    </Text>
                    {!notification.read && (
                        <Box
                            width={8}
                            height={8}
                            borderRadius={4}
                            bg="#E8FF6B"
                            alignItems="center"
                            justifyContent="center"
                        />
                    )}
                </HStack>
        </Pressable>
    );
};

export default NotificationCard;
