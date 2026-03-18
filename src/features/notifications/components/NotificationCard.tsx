import React, { useCallback } from 'react';
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
import {
    TrophyIcon,
    BellIcon,
    BellSlashIcon,
    EllipsisVerticalIcon,
    ArrowUpTrayIcon,
    NoSymbolIcon,
    FlagIcon,
    HeartIcon,
    ChatBubbleLeftIcon,
    GiftIcon,
    UserPlusIcon,
    CalendarDaysIcon,
    DocumentTextIcon,
} from 'react-native-heroicons/outline';
import { useMuteUser, useUnmuteUser, useBlockUser, useUnblockUser, useReportUser, useUserProfile, profileKeys } from '@/src/features/profile/api/hooks';
import type { UserReportCategory } from '@/src/features/profile/api/profileApi';
import type { UserProfile } from '@/src/features/profile/types';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { notificationService } from '@/src/services/NotificationService';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { LikedUsersBottomSheet } from './LikedUsersBottomSheet';
import { Platform, Share, Alert } from 'react-native';
import { useSafeAreaValues } from '@/src/utils';
import { Modal, Dimensions } from 'react-native';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
    count?: number,
    t?: any
): string => {
    try {
        // Username direkt notification.username'den gelir
        const displayUsername = username || 'User';

        // Translation function fallback with error handling
        const translate = t || ((key: string, params?: any) => {
            try {
                return key;
            } catch (e) {
                console.error('[getNotificationMessage] Translate error:', e);
                return 'Notification';
            }
        });

    // Gruplandırılmış bildirimler için özel mesaj formatı (Instagram benzeri)
    if (isGrouped && count && count > 1) {
        const otherCount = count - 1;
        const people = otherCount === 1 ? translate('common.person') : translate('common.people');

        switch (type) {
            case 'POST_LIKED':
                return translate('messages.grouped.postLiked', { username: displayUsername, count: otherCount, people });
            case 'POST_COMMENTED':
                return translate('messages.grouped.postCommented', { username: displayUsername, count: otherCount, people });
            case 'POST_SHARED':
                return translate('messages.grouped.postShared', { username: displayUsername, count: otherCount, people });
            case 'POST_FAVORITED':
                return translate('messages.grouped.postFavorited', { username: displayUsername, count: otherCount, people });
            case 'COMMENT_LIKED':
                return translate('messages.grouped.commentLiked', { username: displayUsername, count: otherCount, people });
            case 'COMMENT_REPLIED':
                return translate('messages.grouped.commentReplied', { username: displayUsername, count: otherCount, people });
            case 'NEW_TRUSTER':
                return translate('messages.grouped.newTruster', { username: displayUsername, count: otherCount, people });
            case 'NEW_TRUSTED_BY':
                return translate('messages.grouped.newTrustedBy', { username: displayUsername, count: otherCount, people });
            default:
                return `${displayUsername} ${translate('common.and')} ${otherCount} ${people} ${translate('common.more')}`;
        }
    }

    // Tekil bildirimler için standart mesajlar
    switch (type) {
        // POST INTERACTIONS
        case 'POST_LIKED':
            return translate('messages.single.postLiked', { username: displayUsername });
        case 'POST_COMMENTED':
            return translate('messages.single.postCommented', { username: displayUsername });
        case 'POST_SHARED':
            return translate('messages.single.postShared', { username: displayUsername });
        case 'POST_FAVORITED':
            return translate('messages.single.postFavorited', { username: displayUsername });

        // COMMENT INTERACTIONS
        case 'COMMENT_LIKED':
            return translate('messages.single.commentLiked', { username: displayUsername });
        case 'COMMENT_REPLIED':
            return translate('messages.single.commentReplied', { username: displayUsername });

        // TRUST/FOLLOW NOTIFICATIONS
        case 'NEW_TRUSTER':
            return translate('messages.single.newTruster', { username: displayUsername });
        case 'NEW_TRUSTED_BY':
            return translate('messages.single.newTrustedBy', { username: displayUsername });

        // MESSAGING NOTIFICATIONS
        case 'DM_REQUEST_RECEIVED':
            return translate('messages.single.dmRequestReceived', { username: displayUsername && displayUsername !== 'User' ? displayUsername : 'User' });
        case 'DM_REQUEST_ACCEPTED':
            return translate('messages.single.dmRequestAccepted', { username: displayUsername });
        case 'DM_REQUEST_DECLINED':
            return translate('messages.single.dmRequestDeclined', { username: displayUsername });
        case 'SUPPORT_REQUEST_ACCEPTED':
            const expertName = data?.expertName || displayUsername;
            return translate('messages.single.supportRequestAccepted', { expertName });
        case 'NEW_MESSAGE':
            return translate('messages.single.newMessage', { username: displayUsername });

        // TIPS NOTIFICATIONS
        case 'TIPS_RECEIVED': {
            const senderUsername = data?.senderUsername || data?.senderName || displayUsername;
            const amount = data?.amount ?? data?.tipsAmount ?? data?.tips;
            if (amount != null) return translate('messages.single.tipsReceived', { username: senderUsername, amount });
            return translate('messages.single.tipsReceived', { username: senderUsername, amount: '' });
        }
        case 'TIPS_SENT':
            return translate('messages.single.tipsSent', { username: displayUsername });
        case 'TRANSACTION_CONFIRMED':
            if (data?.actionType === 'DEPOSIT') {
                const title = data?.title || (data as any).notification?.title;
                const msg = data?.message || (data as any).notification?.message;
                if (title) return title;
                if (msg) return msg;
                const amt = data?.amount;
                const from = data?.senderUsername || (data?.fromAddress ? 'External wallet' : null);
                if (amt != null && from) return translate('messages.deposit.from', { from, amount: amt });
                if (amt != null) return translate('messages.deposit.amount', { amount: amt });
                return translate('messages.deposit.received');
            }
            return data?.title || data?.message || 'Transaction confirmed';

        // GAMIFICATION NOTIFICATIONS
        case 'NEW_BADGE': {
            const badgeName = data?.badgeName || data?.title || '';
            if (badgeName) {
                return translate('messages.single.newBadgeNamed', { badgeName });
            }
            return translate('messages.single.newBadge');
        }
        case 'ACHIEVEMENT_UNLOCKED':
            return translate('messages.single.achievementUnlocked');
        case 'REWARD_EARNED':
            const rewardAmount = data?.amount || 0;
            return translate('messages.single.rewardEarned', { amount: rewardAmount });

        // EXPERT NOTIFICATIONS
        case 'EXPERT_REQUEST_AVAILABLE':
            return translate('messages.single.expertRequestAvailable');
        case 'EXPERT_REQUEST_ANSWERED':
            const expertNameAnswered = data?.expertName || displayUsername;
            return translate('messages.single.expertRequestAnswered', { expertName: expertNameAnswered });

        // EVENT NOTIFICATIONS
        case 'EVENT_STARTED':
            return data?.eventName ? translate('messages.single.eventStarted', { eventName: data.eventName }) : translate('messages.single.eventStarted', { eventName: '' });
        case 'EVENT_ENDING_SOON':
            return translate('messages.single.eventEndingSoon');
        case 'EVENT_REWARD_AVAILABLE':
            return translate('messages.single.eventRewardAvailable');

        // COLLECTION NOTIFICATIONS
        case 'COLLECTION_POST_ADDED':
            return translate('messages.single.collectionPostAdded');
        case 'COLLECTION_SHARED':
            return translate('messages.single.collectionShared');

        // SYSTEM NOTIFICATIONS
        case 'SYSTEM_ANNOUNCEMENT':
            return data?.publisherName ? translate('messages.single.systemAnnouncement', { publisherName: data.publisherName }) : translate('messages.single.systemAnnouncement', { publisherName: '' });

        // NFT NOTIFICATIONS
        case 'NFT_PURCHASED': {
            const nftTitle = data?.title || data?.nftTitle || '';
            const nftAmount = data?.amount;
            if (nftTitle && nftAmount != null) {
                return translate('messages.single.nftPurchased', { title: nftTitle, amount: Number(nftAmount).toFixed(2) });
            }
            return translate('messages.single.nftPurchasedGeneric');
        }

        case 'NFT_SENT': {
            const nftName = data?.nftName || data?.title || '';
            const recipientName = data?.recipientName || '';
            if (nftName && recipientName) {
                return translate('messages.single.nftSent', { nftName, recipientName });
            }
            if (nftName) {
                return translate('messages.single.nftSentGeneric', { nftName });
            }
            return translate('messages.single.nftSentDefault');
        }

        default:
            return translate('common.newNotification');
    }
    } catch (error) {
        console.error('[getNotificationMessage] ❌ Error generating message:', error);
        console.error('[getNotificationMessage] Type:', type, 'Username:', username);
        // Fallback to safe default
        return 'New notification';
    }
};

/**
 * Figma: Bildirim tipine göre sağda gösterilecek küçük gri ikon
 */
const getNotificationTypeIcon = (type: NotificationType): React.ComponentType<{ width?: number; height?: number; color?: string }> => {
    switch (type) {
        case 'POST_LIKED':
        case 'COMMENT_LIKED':
        case 'POST_FAVORITED':
            return HeartIcon;
        case 'TIPS_RECEIVED':
        case 'TIPS_SENT':
        case 'TRANSACTION_CONFIRMED':
        case 'NFT_PURCHASED':
        case 'NFT_SENT':
            return GiftIcon;
        case 'POST_COMMENTED':
        case 'COMMENT_REPLIED':
        case 'NEW_MESSAGE':
        case 'DM_REQUEST_RECEIVED':
        case 'DM_REQUEST_ACCEPTED':
        case 'DM_REQUEST_DECLINED':
        case 'SUPPORT_REQUEST_ACCEPTED':
        case 'EXPERT_REQUEST_AVAILABLE':
        case 'EXPERT_REQUEST_ANSWERED':
            return ChatBubbleLeftIcon;
        case 'NEW_TRUSTER':
        case 'NEW_TRUSTED_BY':
            return UserPlusIcon;
        case 'NEW_BADGE':
        case 'ACHIEVEMENT_UNLOCKED':
        case 'REWARD_EARNED':
            return TrophyIcon;
        case 'EVENT_STARTED':
        case 'EVENT_ENDING_SOON':
        case 'EVENT_REWARD_AVAILABLE':
            return CalendarDaysIcon;
        case 'SYSTEM_ANNOUNCEMENT':
        case 'COLLECTION_POST_ADDED':
        case 'COLLECTION_SHARED':
            return DocumentTextIcon;
        default:
            return BellIcon;
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
        case 'DM_REQUEST_DECLINED':
            return 'message';
        
        case 'TIPS_RECEIVED':
        case 'TIPS_SENT':
        case 'TRANSACTION_CONFIRMED':
        case 'NFT_PURCHASED':
        case 'NFT_SENT':
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
 * Image 2'deki tasarım: Gri kutu içinde post içeriği, Lorem ipsum text gösterir
 */
const PostCard: React.FC<{
    notification: Notification;
    isDark: boolean;
    postImage?: any; // Image source
}> = ({ notification, isDark, postImage }) => {
    const data = notification.data || notification.metadata || {};
    const postContent = data.postContent;

    if (!postContent) {
        return null;
    }

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={10}
            px={10}
            py={8}
            alignSelf="stretch"
        >
            <Text
                color={isDark ? '#666666' : '#666666'}
                fontSize={12}
                fontWeight="$normal"
                numberOfLines={3}
                lineHeight={16}
            >
                {postContent}
            </Text>
        </Box>
    );
};

/**
 * Tips Card Component
 * Image 2: Sarı badge "+50 TIPS" gösterir
 */
const TipsCard: React.FC<{
    notification: Notification;
    onPress?: () => void;
}> = ({ notification, onPress }) => {
    const data = notification.data || notification.metadata || {};
    const tipsAmount = data.amount ?? data.tipsAmount ?? data.tips;

    if (tipsAmount == null) return null;

    return (
        <Pressable
            bg="#E8FF6B"
            borderRadius={16}
            px={12}
            py={5}
            alignSelf="flex-start"
            onPress={onPress}
        >
            <Text
                color="#000000"
                fontSize={11}
                fontWeight="$semibold"
            >
                +{Number(tipsAmount).toFixed(2)} TIPS
            </Text>
        </Pressable>
    );
};

/**
 * Trust Card Component
 * Image 2: Sarı "Profili Görüntüle" butonu
 */
const TrustCard: React.FC<{
    notification: Notification;
    onPress?: () => void;
    t: any;
}> = ({ notification, onPress, t }) => {
    return (
        <Pressable
            bg="#E8FF6B"
            borderRadius={16}
            px={12}
            py={5}
            alignSelf="flex-start"
            onPress={onPress}
        >
            <Text
                color="#000000"
                fontSize={11}
                fontWeight="$semibold"
            >
                {t('buttons.viewProfile')}
            </Text>
        </Pressable>
    );
};

/**
 * Chat Button Component
 * Image 2: Sarı "Görüntüle" butonu
 */
const ChatButton: React.FC<{
    notification: Notification;
    onPress?: () => void;
    t: any;
}> = ({ notification, onPress, t }) => {
    return (
        <Pressable
            bg="#E8FF6B"
            borderRadius={16}
            px={12}
            py={5}
            alignSelf="flex-start"
            onPress={onPress}
        >
            <Text
                color="#000000"
                fontSize={11}
                fontWeight="$semibold"
            >
                {t('buttons.view')}
            </Text>
        </Pressable>
    );
};

/**
 * Comment/Message Card Component
 * Image 2: Gri kutu içinde yorum/mesaj önizlemesi
 */
const CommentCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    const commentContent = notification.type === 'POST_COMMENTED'
        ? data.description
        : data.message;

    if (!commentContent) return null;

    return (
        <Box
            alignSelf="stretch"
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={10}
            px={10}
            py={8}
        >
            <Text
                color={isDark ? '#666666' : '#666666'}
                fontSize={12}
                fontWeight="$normal"
                numberOfLines={3}
                lineHeight={16}
            >
                {commentContent}
            </Text>
        </Box>
    );
};

/**
 * Request Card Component
 * Image 2: Gri kutu içinde request bilgileri
 */
const RequestCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    const requestMessage = data.message;

    if (!requestMessage) return null;

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={10}
            px={10}
            py={8}
            alignSelf="stretch"
        >
            <Text
                color={isDark ? '#666666' : '#666666'}
                fontSize={12}
                fontWeight="$normal"
                numberOfLines={3}
                lineHeight={16}
            >
                {requestMessage}
            </Text>
        </Box>
    );
};

/**
 * Event Card Component
 * Image 2: Event bilgileri için gri kutu
 */
const EventCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    const eventDescription = data.description || data.message;

    if (!eventDescription) return null;

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={10}
            px={10}
            py={8}
            alignSelf="stretch"
        >
            <Text
                color={isDark ? '#666666' : '#666666'}
                fontSize={12}
                fontWeight="$normal"
                numberOfLines={3}
                lineHeight={16}
            >
                {eventDescription}
            </Text>
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
            px={10}
            py={6}
            mt={4}
        >
            <HStack space="sm" alignItems="center">
                <TrophyIcon width={18} height={18} color="#E8FF6B" />
                <VStack flex={1}>
                    {/* Mesaj getNotificationMessage ile oluşturuluyor, burada gösterilmez */}
                </VStack>
                <Box
                    bg="#E8FF6B"
                    borderRadius={10}
                    px={6}
                    py={2}
                >
                    <Text
                        color="#000000"
                        fontSize={11}
                        fontWeight="$bold"
                    >
                        +{Number(rewardAmount).toFixed(2)}
                    </Text>
                </Box>
            </HStack>
        </Box>
    );
};

/**
 * Truncate wallet address for display (e.g. 0x1234...abcd)
 */
const truncateAddress = (address: string | undefined, start = 6, end = 4): string => {
    if (!address || typeof address !== 'string') return '';
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * Deposit Card Component
 * Image 2: TIPS deposit bilgileri için gri kutu
 */
const DepositCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    const amount = data.amount;
    const senderUsername = data.senderUsername;
    const message = data.message || notification.message;

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={10}
            px={10}
            py={8}
            alignSelf="stretch"
        >
            <VStack space="xs">
                {message && (
                    <Text
                        color={isDark ? '#666666' : '#666666'}
                        fontSize={12}
                        fontWeight="$normal"
                        numberOfLines={2}
                        lineHeight={16}
                    >
                        {message}
                    </Text>
                )}
                {amount != null && (
                    <HStack alignItems="center" justifyContent="space-between" mt={2}>
                        {senderUsername && (
                            <Text
                                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                                fontSize={11}
                                fontWeight="$medium"
                            >
                                {senderUsername}
                            </Text>
                        )}
                        <Box bg="#E8FF6B" borderRadius={8} px={6} py={2}>
                            <Text color="#000000" fontSize={11} fontWeight="$bold">
                                +{Number(amount).toFixed(2)} TIPS
                            </Text>
                        </Box>
                    </HStack>
                )}
            </VStack>
        </Box>
    );
};

/**
 * Main Notification Card Component
 * Tüm bildirim tipleri için tek bir component
 */
const NotificationCardInner: React.FC<NotificationCardProps> = ({
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
    const { user } = useAppStore();
    const queryClient = useQueryClient();
    const toast = useToast();

    // CRITICAL FIX: Safe translation with error handling
    const { t: rawT, ready } = useTranslation('notifications');

    // Safe wrapper around t() to prevent crashes from missing translations
    const t = React.useCallback((key: string, params?: any) => {
        try {
            if (!ready) {
                console.warn('[NotificationCard] Translation not ready, using key:', key);
                return key;
            }
            const result = rawT(key, params);
            // If translation returns the key itself, it means translation is missing
            if (result === key) {
                console.warn('[NotificationCard] Missing translation for key:', key);
            }
            return result;
        } catch (error) {
            console.error('[NotificationCard] Translation error:', error, 'key:', key);
            // Fallback to key itself
            return key;
        }
    }, [rawT, ready]);
    
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
    
    // Mute/Unmute için kullanıcı ID'sini belirle
    const targetUserId = isGrouped && primaryUser?.id 
        ? primaryUser.id 
        : notification.userId;
    
    // Kullanıcının mute durumunu kontrol et
    const profileQuery = useUserProfile(targetUserId);
    const userProfile = profileQuery.data as UserProfile | undefined;
    const isMuted = userProfile?.isMuted === true;
    
    // Mute/Unmute mutations
    const { mutate: muteUser, isPending: isMuting } = useMuteUser();
    const { mutate: unmuteUser, isPending: isUnmuting } = useUnmuteUser();
    
    // Block/Unblock mutations
    const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
    const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
    
    // Report mutation
    const { mutate: reportUser, isPending: isReporting } = useReportUser();
    
    // Context menu state
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const menuTriggerRef = React.useRef<View>(null);
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });

    // Context menü konumu: long-press event'inden veya fallback
    const handleMenuOpen = React.useCallback((event?: any) => {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        const menuWidth = 180;
        const menuHeight = 180;
        if (event?.nativeEvent?.pageX != null && event?.nativeEvent?.pageY != null) {
            const x = event.nativeEvent.pageX;
            const y = event.nativeEvent.pageY;
            const left = Math.max(12, Math.min(x, screenWidth - menuWidth - 12));
            const top = Math.max(12, Math.min(y - 8, screenHeight - menuHeight - 12));
            setMenuPosition({ top, left });
            setIsMenuOpen(true);
        } else if (menuTriggerRef.current) {
            menuTriggerRef.current.measureInWindow((x, y) => {
                const left = Math.max(12, Math.min(x - menuWidth + 10, screenWidth - menuWidth - 12));
                const top = Math.max(12, y - 8);
                setMenuPosition({ top, left });
                setIsMenuOpen(true);
            });
        } else {
            setMenuPosition({ top: 80, left: screenWidth - menuWidth - 12 });
            setIsMenuOpen(true);
        }
    }, []);
    
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

        const type = notification.type;
        const data = notification.data || notification.metadata || {};
        const transactionId = data.transactionId;

        // TIPS_RECEIVED / TRANSACTION_CONFIRMED (deposit) / NFT_PURCHASED: card press → Wallet (optional transactionId)
        if (type === 'TIPS_RECEIVED' || type === 'NFT_PURCHASED' || (type === 'TRANSACTION_CONFIRMED' && data.actionType === 'DEPOSIT')) {
            navigationService.navigate(ROOT_ROUTES.WALLET, {
                screen: 'WalletScreen',
                params: transactionId ? { transactionId } : undefined,
            }, { priority: 'high', force: false });
            if (onPress) onPress();
            return;
        }

        // Sohbeti Görüntüle ve Profili Görüntüle butonları olan bildirimlerde sadece butonlara tıklanınca navigation
        // NEW_BADGE ve ACHIEVEMENT_UNLOCKED: collectionId varsa CollectionDetail'e git, yoksa bir şey yapma
        if (type === 'TIPS_SENT' || type === 'DM_REQUEST_ACCEPTED' ||
            type === 'NEW_TRUSTER' || type === 'NEW_TRUSTED_BY') {
            return;
        }
        if ((type === 'NEW_BADGE' || type === 'ACHIEVEMENT_UNLOCKED') &&
            !(notification.data?.collectionId || notification.metadata?.collectionId)) {
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
                // Yeni yapıda threadId root seviyede veya data içinde olabilir
                const threadId = notification.threadId || data.threadId;
                
                if (threadId && notification.userId) {
                    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
                        messageId: threadId,
                        threadId: threadId,
                        recipientUserId: notification.userId,
                    });
                    return;
                } else if (notification.userId) {
                    // Fallback: threadId yoksa userId ile thread oluşturulabilir
                    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
                        messageId: notification.userId,
                        threadId: notification.userId,
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

            // 5. Gamification (Badge & Achievement) → CollectionDetail (collectionId varsa)
            if (type === 'NEW_BADGE' || type === 'ACHIEVEMENT_UNLOCKED') {
                const collectionId = data.collectionId;
                if (collectionId) {
                    // CollectionDetail ekranına yönlendir - /api/events/collections/{collectionId} çağrılacak
                    navigationService.navigate(ROOT_ROUTES.COLLECTION_DETAIL, {
                        collectionId,
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

            // 8. Collection Bildirimleri → CollectionDetail (collectionId ile)
            if (type === 'COLLECTION_POST_ADDED' || type === 'COLLECTION_SHARED') {
                if (data.collectionId) {
                    // CollectionDetail ekranına yönlendir - /api/events/collections/{collectionId} çağrılacak
                    navigationService.navigate(ROOT_ROUTES.COLLECTION_DETAIL, {
                        collectionId: data.collectionId,
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

    // Handle Chat button press
    const handleChatPress = () => {
        try {
            if (notification.type === 'DM_REQUEST_ACCEPTED') {
                // DM_REQUEST_ACCEPTED: Kabul edilen mesaj thread'ine yönlendir
                const threadId = notification.data?.threadId || notification.threadId || notification.data?.requestId;
                if (threadId) {
                    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
                        threadId,
                        recipientUserId: notification.userId,
                    });
                } else {
                    // threadId yoksa Inbox'a yönlendir
                    navigationService.navigateNested(TAB_ROUTES.INBOX, 'InboxScreen', {
                        params: { initialTab: 0 },
                        priority: 'high',
                        force: false,
                    });
                }
            } else {
                // DM_REQUEST_RECEIVED: SupportRequestsScreen'e yönlendir
                navigationService.navigateNested(TAB_ROUTES.INBOX, 'InboxScreen', {
                    params: {
                        initialTab: 1, // Support Requests tab index
                    },
                    priority: 'high',
                    force: false,
                });
            }
        } catch (error) {
            console.error('[NotificationCard] Chat navigation error:', error);
        }
    };

    // Handle Mute/Unmute
    const handleMute = useCallback(() => {
        if (!user?.id || !targetUserId) {
            if (__DEV__) {
                console.warn('[NotificationCard] handleMute: Missing required data', {
                    hasUserId: !!user?.id,
                    hasTargetUserId: !!targetUserId,
                });
            }
            return;
        }
        
        // Mutation zaten devam ediyorsa işlem yapma
        if (isMuting || isUnmuting) {
            if (__DEV__) {
                console.log('[NotificationCard] handleMute: Mutation already in progress, skipping');
            }
            return;
        }
        
        // Cache'den güncel profile'ı al
        const queryKey = profileKeys.profile(targetUserId);
        const cachedProfile = queryClient.getQueryData<any>(queryKey);
        const currentProfile = cachedProfile || userProfile;
        
        if (!currentProfile) {
            if (__DEV__) {
                console.warn('[NotificationCard] handleMute: No profile data available');
            }
            return;
        }
        
        // isMuted değerini güvenilir şekilde kontrol et
        const currentIsMuted = currentProfile.isMuted === true;
        
        if (__DEV__) {
            console.log('[NotificationCard] handleMute called:', {
                userId: user.id,
                targetUserId,
                isMuted: currentIsMuted,
                userName: currentProfile.name || notification.username,
            });
        }
        
        if (currentIsMuted) {
            // Unmute
            if (__DEV__) {
                console.log('[NotificationCard] Unmuting user...');
            }
            unmuteUser(
                { userId: user.id, targetUserId },
                {
                    onSuccess: (result) => {
                        if (__DEV__) {
                            console.log('[NotificationCard] ✅ User unmuted successfully', { result });
                        }
                        if (result === false) {
                            showCustomToast(toast, {
                                title: t('titles.info'),
                                description: t('actions.mute.alreadyMuted', { name: currentProfile.name || notification.username || 'User' }),
                                action: 'info',
                            });
                        } else {
                            showCustomToast(toast, {
                                title: t('titles.unmuted'),
                                description: t('actions.mute.success', { name: currentProfile.name || notification.username || 'User' }),
                                action: 'success',
                            });
                        }
                    },
                    onError: (error: any) => {
                        if (__DEV__) {
                            console.error('[NotificationCard] ❌ Unmute error:', error);
                        }
                        const errorMessage = error?.response?.data?.message || error?.message || t('actions.mute.error');
                        showCustomToast(toast, {
                            title: t('titles.error'),
                            description: errorMessage,
                            action: 'error',
                        });
                    },
                }
            );
        } else {
            // Mute
            if (__DEV__) {
                console.log('[NotificationCard] Muting user...');
            }
            muteUser(
                { userId: user.id, targetUserId },
                {
                    onSuccess: () => {
                        if (__DEV__) {
                            console.log('[NotificationCard] ✅ User muted successfully');
                        }
                        showCustomToast(toast, {
                            title: t('titles.userMuted'),
                            description: t('actions.mute.muteSuccess', { name: currentProfile.name || notification.username || 'User' }),
                            action: 'info',
                        });
                    },
                    onError: (error: any) => {
                        if (__DEV__) {
                            console.error('[NotificationCard] ❌ Mute error:', error);
                        }
                        const errorMessage = error?.response?.data?.message || error?.message || t('actions.mute.error');
                        showCustomToast(toast, {
                            title: t('titles.error'),
                            description: errorMessage,
                            action: 'error',
                        });
                    },
                }
            );
        }
    }, [targetUserId, user?.id, userProfile, muteUser, unmuteUser, toast, isMuting, isUnmuting, queryClient, notification.username]);

    // Handle Share
    const handleShare = useCallback(async () => {
        if (!targetUserId) return;
        
        try {
            const username = notification.username || userProfile?.name || 'User';
            await Share.share({
                message: rawT('common:messages.checkOutProfile', { name: username }),
                url: `tipboxapp://profile/user/${targetUserId}`,
            });
        } catch (error) {
            console.error('[NotificationCard] Share error:', error);
        }
    }, [targetUserId, notification.username, userProfile?.name]);

    // Handle Block/Unblock
    const handleBlock = useCallback(() => {
        if (!user?.id || !targetUserId) {
            if (__DEV__) {
                console.warn('[NotificationCard] handleBlock: Missing required data', {
                    hasUserId: !!user?.id,
                    hasTargetUserId: !!targetUserId,
                });
            }
            return;
        }
        
        // Mutation zaten devam ediyorsa işlem yapma
        if (isBlocking || isUnblocking) {
            if (__DEV__) {
                console.log('[NotificationCard] handleBlock: Mutation already in progress, skipping');
            }
            return;
        }
        
        // Cache'den güncel profile'ı al
        const queryKey = profileKeys.profile(targetUserId);
        const cachedProfile = queryClient.getQueryData<UserProfile>(queryKey);
        const currentProfile = cachedProfile || userProfile;
        
        if (!currentProfile) {
            if (__DEV__) {
                console.warn('[NotificationCard] handleBlock: No profile data available');
            }
            return;
        }
        
        // isBlocked değerini güvenilir şekilde kontrol et
        const isBlocked = currentProfile.isBlocked === true;
        const username = currentProfile.name || notification.username || 'User';
        
        if (isBlocked) {
            // Unblock
            Alert.alert(
                'Unblock User',
                `Are you sure you want to unblock ${username}?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Unblock',
                        onPress: () => {
                            unblockUser(
                                { userId: user.id, targetUserId },
                                {
                                    onSuccess: (result) => {
                                        if (__DEV__) {
                                            console.log('[NotificationCard] ✅ User unblocked successfully', { result });
                                        }
                                        if (result === false) {
                                            showCustomToast(toast, {
                                                title: t('titles.info'),
                                                description: t('actions.block.notBlocked', { username }),
                                                action: 'info',
                                            });
                                        } else {
                                            showCustomToast(toast, {
                                                title: t('titles.userUnblocked'),
                                                description: t('actions.block.unblockSuccess', { username }),
                                                action: 'success',
                                            });
                                        }
                                    },
                                    onError: (error: any) => {
                                        if (__DEV__) {
                                            console.error('[NotificationCard] ❌ Unblock error:', error);
                                        }
                                        const errorMessage = error?.response?.data?.message || error?.message || t('actions.block.error');
                                        showCustomToast(toast, {
                                            title: t('titles.error'),
                                            description: errorMessage,
                                            action: 'error',
                                        });
                                    },
                                }
                            );
                        },
                    },
                ]
            );
        } else {
            // Block
            Alert.alert(
                'Block User',
                `Are you sure you want to block ${username}? Blocked users cannot interact with you.`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Block',
                        style: 'destructive',
                        onPress: () => {
                            blockUser(
                                { userId: user.id, targetUserId },
                                {
                                    onSuccess: () => {
                                        if (__DEV__) {
                                            console.log('[NotificationCard] ✅ User blocked successfully');
                                        }
                                        showCustomToast(toast, {
                                            title: t('titles.userBlocked'),
                                            description: t('actions.block.blockSuccess', { username }),
                                            action: 'info',
                                        });
                                        // Navigate back after blocking - goBack will handle if it can go back
                                        try {
                                            navigationService.goBack();
                                        } catch (error) {
                                            // Ignore if cannot go back
                                        }
                                    },
                                    onError: (error: any) => {
                                        if (__DEV__) {
                                            console.error('[NotificationCard] ❌ Block error:', error);
                                        }
                                        const errorMessage = error?.response?.data?.message || error?.message || t('actions.block.error');
                                        showCustomToast(toast, {
                                            title: t('titles.error'),
                                            description: errorMessage,
                                            action: 'error',
                                        });
                                    },
                                }
                            );
                        },
                    },
                ]
            );
        }
    }, [targetUserId, user?.id, userProfile, blockUser, unblockUser, toast, isBlocking, isUnblocking, queryClient, notification.username]);

    // Report categories with labels - memoized
    const reportCategories = React.useMemo<Array<{ value: UserReportCategory; label: string }>>(() => [
        { value: 'SPAM', label: 'Spam' },
        { value: 'HARASSMENT', label: 'Harassment' },
        { value: 'SCAM', label: 'Scam' },
        { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content' },
        { value: 'FAKE_ACCOUNT', label: 'Fake Account' },
        { value: 'OTHER', label: 'Other' },
    ], []);

    // Handle Report
    const handleReport = useCallback(() => {
        if (!user?.id || !targetUserId) {
            if (__DEV__) {
                console.warn('[NotificationCard] handleReport: Missing required data', {
                    hasUserId: !!user?.id,
                    hasTargetUserId: !!targetUserId,
                });
            }
            return;
        }
        
        // Mutation zaten devam ediyorsa işlem yapma
        if (isReporting) {
            if (__DEV__) {
                console.log('[NotificationCard] handleReport: Mutation already in progress, skipping');
            }
            return;
        }
        
        const username = userProfile?.name || notification.username || 'User';
        
        // Report category seçimi için alert
        Alert.alert(
            'Report User',
            `Why are you reporting ${username}?`,
            [
                ...reportCategories.map((category) => ({
                    text: category.label,
                    onPress: () => {
                        // Seçilen kategori ile raporla
                        reportUser(
                            {
                                userId: user.id,
                                targetUserId,
                                data: {
                                    category: category.value,
                                    description: `Reported for: ${category.label}`,
                                },
                            },
                            {
                                onSuccess: () => {
                                    if (__DEV__) {
                                        console.log('[NotificationCard] ✅ User reported successfully');
                                    }
                                    showCustomToast(toast, {
                                        title: t('titles.userReported'),
                                        description: t('actions.report.success'),
                                        action: 'success',
                                    });
                                },
                                onError: (error: any) => {
                                    if (__DEV__) {
                                        console.error('[NotificationCard] ❌ Report error:', error);
                                    }
                                    const errorMessage = error?.response?.data?.message || error?.message || t('actions.report.error');
                                    showCustomToast(toast, {
                                        title: t('titles.error'),
                                        description: errorMessage,
                                        action: 'error',
                                    });
                                },
                            }
                        );
                    },
                })),
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    }, [targetUserId, user?.id, userProfile, notification.username, reportUser, toast, isReporting]);

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
    const tipsAmount = data.amount ?? data.tipsAmount ?? data.tips;
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
    
    // NFT image - NFT_SENT bildirimleri için
    const isNftSentNotification = notification.type === 'NFT_SENT';
    const nftImageUrl = isNftSentNotification ? (data.imageUrl || null) : null;
    const nftImage = nftImageUrl ? toImageSource(nftImageUrl) : null;

    // Badge image - Badge bildirimleri için (null ise default placeholder kullan)
    const isBadgeNotification = notification.type === 'NEW_BADGE' || notification.type === 'ACHIEVEMENT_UNLOCKED';
    // CRITICAL FIX: badgeUrl birden fazla yerde olabilir - tüm olası konumları kontrol et
    const rawNotif = notification as any;
    const badgeImageUrl = isBadgeNotification
        ? (data.badgeUrl || data.imageUrl || data.badge_url
            || rawNotif.badgeUrl || rawNotif.badge_url || rawNotif.badgeImage || rawNotif.imageUrl
            || null)
        : null;

    if (__DEV__ && isBadgeNotification) {
        console.log('[NotificationCard] 🏅 Badge render debug:', {
            id: notification.id,
            resolvedUrl: badgeImageUrl,
            'data.badgeUrl': data.badgeUrl,
            'data.imageUrl': data.imageUrl,
            dataKeys: Object.keys(data),
            notifKeys: Object.keys(notification),
            fullData: JSON.stringify(data).substring(0, 500),
        });
    }

    const badgeImage = isBadgeNotification
        ? (badgeImageUrl ? toImageSource(badgeImageUrl) : require('@/assets/defaultImages/default-badge.png'))
        : null;
    
    // Avatar sadece user bildirimlerinde gösterilecek (event, badge ve NFT bildirimlerinde gösterilmeyecek)
    const shouldShowAvatar = !eventImage && !badgeImage && !nftImage && (category === 'post' || category === 'comment' || category === 'trust' || category === 'message' || category === 'tips' || category === 'expert');

    // Right-side thumbnail for post-related notifications only
    const hasRightThumbnail = !!(postImage && !isBadgeNotification && !eventImage && (category === 'post' || category === 'comment'));

    // Category-based content rendering - Instagram benzeri tasarım
    const showTipsButton = category === 'tips' && tipsAmount != null; // Tips bildirimlerinde buton gösterilecek
    const showTrustButton = category === 'trust';
    const showCommentText = ((category === 'post' && notification.type === 'POST_COMMENTED') || category === 'message') && commentContent; // POST_COMMENTED ve DM_REQUEST için
    const showChatButton = notification.type === 'DM_REQUEST_ACCEPTED' || notification.type === 'DM_REQUEST_RECEIVED'; // Mesaj isteği kabul edildi ve alındı bildirimleri için
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

    // Deposit card – TRANSACTION_CONFIRMED with actionType DEPOSIT
    const showDepositCard = notification.type === 'TRANSACTION_CONFIRMED' && data.actionType === 'DEPOSIT';

    // Figma: sağda zaman + tip ikonu (küçük gri)
    const TypeIcon = getNotificationTypeIcon(notification.type);
    const iconColor = '#8C8C8C';
    const avatarBorderColor = '#8B5CF6'; // Figma mor çerçeve

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={targetUserId && user?.id && targetUserId !== user.id ? (e) => handleMenuOpen(e) : undefined}
            delayLongPress={400}
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            p="$3"
            position="relative"
            borderBottomWidth={1}
            borderBottomColor={isDark ? '#333' : '#E9E9E9'}
            {...(isBadgeNotification && { minHeight: 72, py: '$3.5' })}
        >
            <HStack space="md" alignItems={isBadgeNotification ? 'center' : 'flex-start'} flex={1}>

                    {/* Avatar - Sol tarafta gradient/mor border ile */}
                    {shouldShowAvatar ? (
                        <Pressable onPress={handleAvatarPress}>
                            <Box
                                width={40}
                                height={40}
                                borderRadius={20}
                                borderWidth={notification.read ? 0 : 1.5}
                                borderColor={notification.read ? 'transparent' : '#8B5CF6'}
                                bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                overflow="hidden"
                                justifyContent="center"
                                alignItems="center"
                                flexShrink={0}
                            >
                                <Image
                                    source={primaryAvatar}
                                    alt="User avatar"
                                    width={40}
                                    height={40}
                                    borderRadius={20}
                                />
                            </Box>
                        </Pressable>
                    ) : eventImage ? (
                        <Pressable onPress={handlePress}>
                            <Box
                                width={40}
                                height={40}
                                borderRadius={8}
                                overflow="hidden"
                                borderWidth={1}
                                borderColor={isDark ? '#333' : '#E9E9E9'}
                                flexShrink={0}
                            >
                                <Image
                                    source={eventImage}
                                    alt="Event preview"
                                    width={40}
                                    height={40}
                                    style={{ resizeMode: 'cover' }}
                                />
                            </Box>
                        </Pressable>
                    ) : badgeImage ? (
                        <Pressable onPress={handlePress}>
                            <Box
                                width={52}
                                height={52}
                                borderRadius={10}
                                overflow="hidden"
                                borderWidth={1}
                                borderColor={isDark ? '#333' : '#E9E9E9'}
                                bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                flexShrink={0}
                            >
                                <Image
                                    source={badgeImage}
                                    alt="Badge preview"
                                    width={52}
                                    height={52}
                                    style={{ resizeMode: 'cover' }}
                                />
                            </Box>
                        </Pressable>
                    ) : nftImage ? (
                        <Pressable onPress={handlePress}>
                            <Box
                                width={44}
                                height={44}
                                borderRadius={10}
                                overflow="hidden"
                                borderWidth={1}
                                borderColor={isDark ? '#333' : '#E9E9E9'}
                                bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                flexShrink={0}
                            >
                                <Image
                                    source={nftImage}
                                    alt="NFT preview"
                                    width={44}
                                    height={44}
                                    style={{ resizeMode: 'cover' }}
                                />
                            </Box>
                        </Pressable>
                    ) : null}

                    {/* Content - Ortada */}
                    <VStack flex={1} space="xs" justifyContent="flex-start" pr={hasRightThumbnail ? 60 : "$10"}>
                        {/* Başlık ve açıklama */}
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={13}
                            fontWeight="$normal"
                            lineHeight={18}
                        >
                            {(() => {
                                // Username'i belirle - data-level alanlar notification.username'den öncelikli
                                let username = 'User';
                                const notificationData = notification.data || notification.metadata || {};

                                if (isGrouped && primaryUser?.username) {
                                    username = primaryUser.username;
                                } else if (notification.type === 'TIPS_RECEIVED' || notification.type === 'TIPS_SENT' || notification.type === 'TRANSACTION_CONFIRMED') {
                                    // Tips bildirimleri: data'daki sender bilgisi öncelikli
                                    username = notificationData.senderUsername || notificationData.senderName || notification.username || 'User';
                                } else if (notification.type === 'POST_LIKED' && notificationData.likerName) {
                                    username = notificationData.likerName;
                                } else if ((notification.type === 'COMMENT_LIKED' || notification.type === 'POST_COMMENTED') && notificationData.commenterName) {
                                    username = notificationData.commenterName;
                                } else if (notificationData.userName) {
                                    username = notificationData.userName;
                                } else if (notificationData.username) {
                                    username = notificationData.username;
                                } else if (notificationData.senderName) {
                                    username = notificationData.senderName;
                                } else if (notificationData.senderUsername) {
                                    username = notificationData.senderUsername;
                                } else if (notification.username) {
                                    username = notification.username;
                                }

                                // Mesajı oluştur
                                const message = getNotificationMessage(
                                    notification.type,
                                    username,
                                    data,
                                    isGrouped,
                                    groupedCount,
                                    t
                                );

                                // Gruplandırılmış bildirimlerde "and X people more" tıklanabilir
                                if (isGrouped && groupedCount > 1 && otherUsers.length > 0) {
                                    const otherCount = groupedCount - 1;
                                    const otherText = `${t('common.and')} ${otherCount} ${otherCount === 1 ? t('common.person') : t('common.people')} ${t('common.more')}`;

                                    if (message.includes(otherText)) {
                                        const parts = message.split(otherText);
                                        const beforeOther = parts[0];
                                        const afterOther = parts[1] || '';
                                        const usernamePart = beforeOther.trim();

                                        return (
                                            <Text fontSize={13}>
                                                <Text fontSize={13} fontWeight="$semibold" color={isDark ? '#FFFFFF' : '#000000'}>{usernamePart}</Text>
                                                {' '}
                                                <Text
                                                    fontWeight="$semibold"
                                                    fontSize={13}
                                                    color={isDark ? '#FFFFFF' : '#000000'}
                                                    onPress={handleLikedUsersPress}
                                                    suppressHighlighting={true}
                                                >
                                                    {otherText}
                                                </Text>
                                                <Text fontSize={13} color={isDark ? '#FFFFFF' : '#000000'}>{afterOther}</Text>
                                            </Text>
                                        );
                                    }
                                }

                                // Username'i bold yap
                                if (username && message.includes(username)) {
                                    const parts = message.split(username);
                                    const handleUsernamePress = () => {
                                        let targetUserId: string | undefined;

                                        if (isGrouped && primaryUser?.id) {
                                            targetUserId = primaryUser.id;
                                        } else if (notification.userId) {
                                            targetUserId = notification.userId;
                                        }

                                        if (!targetUserId) {
                                            console.warn('[NotificationCard] Username press: userId is missing');
                                            return;
                                        }

                                        const userIdString = String(targetUserId).trim();

                                        if (!userIdString || userIdString.length === 0) {
                                            console.warn('[NotificationCard] Username press: userId is empty');
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
                                            console.error('[NotificationCard] Username navigation error:', error);
                                        }
                                    };

                                    return (
                                        <Text fontSize={13}>
                                            <Text fontSize={13} fontWeight="$semibold" color={isDark ? '#FFFFFF' : '#000000'} onPress={handleUsernamePress} suppressHighlighting={true}>{username}</Text>
                                            <Text fontSize={13} color={isDark ? '#FFFFFF' : '#000000'}>{parts[1]}</Text>
                                        </Text>
                                    );
                                }
                                return <Text fontSize={13} color={isDark ? '#FFFFFF' : '#000000'}>{message}</Text>;
                            })()}
                        </Text>

                        {/* Yorum metni (POST_COMMENTED için) */}
                        {showCommentText && notification.type === 'POST_COMMENTED' && (
                            <Box mt={4} alignSelf="stretch">
                                <CommentCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {/* Request Card */}
                        {showRequestCard && (
                            <Box mt={4} alignSelf="stretch">
                                <RequestCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {/* Event Card */}
                        {showEventCard && (
                            <Box mt={4} alignSelf="stretch">
                                <EventCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {/* Deposit Card */}
                        {showDepositCard && (
                            <Box mt={4} alignSelf="stretch">
                                <DepositCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {/* Post Card - Post içeriği */}
                        {showPostCard && (
                            <Box mt={4} alignSelf="stretch">
                                <PostCard
                                    notification={notification}
                                    isDark={isDark}
                                    postImage={postImage || undefined}
                                />
                            </Box>
                        )}

                        {/* Action Butonları */}
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
                                        t={t}
                                    />
                                )}
                                {showTrustButton && (
                                    <TrustCard notification={notification} onPress={handleTrustPress} t={t} />
                                )}
                            </HStack>
                        )}
                    </VStack>
            </HStack>

                {/* Sağ üst köşe - Zaman ve ikon */}
                <HStack
                    position="absolute"
                    top="$3"
                    right={12}
                    space="xs"
                    alignItems="center"
                >
                    <Text
                        color={isDark ? '#8C8C8C' : '#8C8C8C'}
                        fontSize={11}
                        fontWeight="$medium"
                    >
                        {formatRelativeTime(notification.createdAt)}
                    </Text>
                    <TypeIcon width={14} height={14} color={isDark ? '#8C8C8C' : '#8C8C8C'} />
                </HStack>

                {/* Right thumbnail - post image, tarihin altında sağda */}
                {hasRightThumbnail && postImage && (
                    <Pressable
                        onPress={handlePress}
                        position="absolute"
                        top={32}
                        right={12}
                    >
                        <Box
                            width={44}
                            height={44}
                            borderRadius={8}
                            overflow="hidden"
                            borderWidth={1}
                            borderColor={isDark ? '#333' : '#E9E9E9'}
                        >
                            <Image
                                source={postImage}
                                alt="Content preview"
                                width={44}
                                height={44}
                                style={{ resizeMode: 'cover' }}
                            />
                        </Box>
                    </Pressable>
                )}

                {/* Context Menu - long-press ile açılır, Modal aynı kalır */}
                {targetUserId && user?.id && targetUserId !== user.id && (
                    <Box position="relative" zIndex={2001} pointerEvents="box-none">
                        <View ref={menuTriggerRef} collapsable={false} style={{ position: 'absolute', width: 0, height: 0 }} />
                        <Modal
                            visible={isMenuOpen}
                            transparent={true}
                            animationType="fade"
                            onRequestClose={() => setIsMenuOpen(false)}
                        >
                            <Pressable
                                style={{ flex: 1 }}
                                onPress={() => setIsMenuOpen(false)}
                            />
                            <Box
                                position="absolute"
                                top={menuPosition.top}
                                left={menuPosition.left}
                                width={180}
                                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                                borderRadius={16}
                                shadowColor="#000"
                                shadowOffset={{ width: 0, height: 2 }}
                                shadowOpacity={0.25}
                                shadowRadius={8}
                                elevation={8}
                                overflow="hidden"
                            >
                                <Pressable
                                    onPress={() => {
                                        setIsMenuOpen(false);
                                        handleShare();
                                    }}
                                    px={16}
                                    py={12}
                                >
                                    <HStack alignItems="center" space="md">
                                        <ArrowUpTrayIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                        <Text
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                            fontSize="$md"
                                            fontWeight="$medium"
                                        >
                                            Share
                                        </Text>
                                    </HStack>
                                </Pressable>
                                <Box h={1} bg={isDark ? '#333333' : '#E9E9E9'} />
                                <Pressable
                                    onPress={() => {
                                        if (!isReporting) {
                                            setIsMenuOpen(false);
                                            handleReport();
                                        }
                                    }}
                                    px={16}
                                    py={12}
                                    opacity={isReporting ? 0.6 : 1}
                                >
                                    <HStack alignItems="center" space="md">
                                        <FlagIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                                        <Text
                                            color={isDark ? '#FFFFFF' : '#000000'}
                                            fontSize="$md"
                                            fontWeight="$medium"
                                        >
                                            {isReporting ? 'Reporting...' : 'Report'}
                                        </Text>
                                    </HStack>
                                </Pressable>
                                <Box h={1} bg={isDark ? '#333333' : '#E9E9E9'} />
                                <Pressable
                                    onPress={() => {
                                        if (!isBlocking && !isUnblocking) {
                                            setIsMenuOpen(false);
                                            handleBlock();
                                        }
                                    }}
                                    px={16}
                                    py={12}
                                    opacity={(isBlocking || isUnblocking) ? 0.6 : 1}
                                >
                                    <HStack alignItems="center" space="md">
                                        <NoSymbolIcon width={20} height={20} color={userProfile?.isBlocked ? (isDark ? '#FFFFFF' : '#000000') : '#FF3040'} />
                                        <Text
                                            color={userProfile?.isBlocked ? (isDark ? '#FFFFFF' : '#000000') : '#FF3040'}
                                            fontSize="$md"
                                            fontWeight="$medium"
                                        >
                                            {(isBlocking || isUnblocking)
                                                ? (userProfile?.isBlocked ? 'Unblocking...' : 'Blocking...')
                                                : (userProfile?.isBlocked ? 'Unblock' : 'Block')}
                                        </Text>
                                    </HStack>
                                </Pressable>
                            </Box>
                        </Modal>
                    </Box>
                )}
                
        </Pressable>
    );
};

/**
 * Error Boundary Wrapper for NotificationCard
 * CRITICAL FIX: Prevents app crashes from notification rendering errors
 */
export const NotificationCard: React.FC<NotificationCardProps> = (props) => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    try {
        return <NotificationCardInner {...props} />;
    } catch (error) {
        console.error('[NotificationCard] ❌ Render error:', error);
        console.error('[NotificationCard] Notification data:', props.notification);

        // Fallback UI - crash yerine basit bir error card göster
        return (
            <Box
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                p="$3"
                borderBottomWidth={1}
                borderBottomColor={isDark ? '#333' : '#E9E9E9'}
            >
                <Text
                    color={isDark ? '#666666' : '#999999'}
                    fontSize={12}
                    fontStyle="italic"
                >
                    Unable to display notification
                </Text>
            </Box>
        );
    }
};

export default NotificationCard;
