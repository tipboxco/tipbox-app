import React from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Image,
    Pressable,
} from '@gluestack-ui/themed';
import {
    HeartIcon,
    GiftIcon,
    ChatBubbleLeftIcon,
    UserPlusIcon,
    TrophyIcon,
    CalendarIcon,
    BellIcon,
    ArrowTopRightOnSquareIcon,
    BookmarkIcon,
    ChatBubbleLeftRightIcon,
    EnvelopeIcon,
    CheckCircleIcon,
    AcademicCapIcon,
    PaperAirplaneIcon,
    ClockIcon,
} from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { toImageSource, formatRelativeTime, DEFAULT_USER_AVATAR } from '@/src/utils';
import {
    useMarkNotificationAsRead,
    useDeleteNotification,
} from '../api/hooks';
import type { Notification, NotificationType } from '../api/types';
import { LightBulbIcon } from 'react-native-heroicons/solid';
import { notificationService } from '@/src/services/NotificationService';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';

export interface NotificationCardProps {
    notification: Notification;
    onPress?: () => void;
    onMarkAsRead?: () => void;
    onDelete?: () => void;
}

/**
 * Bildirim tipine göre icon component'ini döndürür
 */
const getIconComponent = (type: NotificationType): React.ComponentType<{ width?: number; height?: number; color?: string }> => {
    switch (type) {
        // Post ile ilgili
        case 'POST_LIKED':
            return HeartIcon;
        case 'POST_COMMENTED':
            return ChatBubbleLeftIcon;
        case 'POST_SHARED':
            return ArrowTopRightOnSquareIcon;
        case 'POST_FAVORITED':
            return BookmarkIcon;

        // Yorum ile ilgili
        case 'COMMENT_LIKED':
            return HeartIcon;
        case 'COMMENT_REPLIED':
            return ChatBubbleLeftRightIcon;

        // Trust/Follow ile ilgili
        case 'NEW_TRUSTER':
        case 'NEW_TRUSTED_BY':
            return UserPlusIcon;

        // Mesajlaşma ile ilgili
        case 'NEW_MESSAGE':
            return ChatBubbleLeftIcon;
        case 'DM_REQUEST_RECEIVED':
            return EnvelopeIcon;
        case 'DM_REQUEST_ACCEPTED':
            return CheckCircleIcon;

        // Gamification ile ilgili
        case 'NEW_BADGE':
        case 'ACHIEVEMENT_UNLOCKED':
            return TrophyIcon;
        case 'REWARD_EARNED':
            return GiftIcon;

        // Expert ile ilgili
        case 'EXPERT_REQUEST_AVAILABLE':
        case 'EXPERT_REQUEST_ANSWERED':
            return AcademicCapIcon;

        // Sistem/Tips ile ilgili
        case 'SYSTEM_ANNOUNCEMENT':
            return BellIcon;
        case 'TIPS_RECEIVED':
            return GiftIcon;
        case 'TIPS_SENT':
            return PaperAirplaneIcon;

        // Event ile ilgili
        case 'EVENT_STARTED':
            return CalendarIcon;
        case 'EVENT_ENDING_SOON':
            return ClockIcon;
        case 'EVENT_REWARD_AVAILABLE':
            return GiftIcon;

        default:
            return BellIcon;
    }
};

/**
 * Bildirim tipine ve data objesine göre mesaj oluşturur
 * Dokümana göre: message field'ı yok, tüm bilgiler data objesi içinde
 */
const getNotificationMessage = (type: NotificationType, data: any): string => {
    const username = data?.username || data?.userName || data?.senderName || data?.likerName || data?.commenterName || data?.expertName || 'User';
    
    switch (type) {
        // POST INTERACTIONS
        case 'POST_LIKED':
            return `${username} liked`;
        case 'POST_COMMENTED':
            return `${username} commented`;
        case 'POST_SHARED':
            return `${username} shared`;
        case 'POST_FAVORITED':
            return `${username} favorited`;
        
        // COMMENT INTERACTIONS
        case 'COMMENT_LIKED':
            return `${username} liked your comment`;
        case 'COMMENT_REPLIED':
            return `${username} replied`;
        
        // TRUST/FOLLOW NOTIFICATIONS
        case 'NEW_TRUSTER':
            return `${username} started following you`;
        case 'NEW_TRUSTED_BY':
            return `${username} is following you`;
        
        // MESSAGING NOTIFICATIONS
        case 'DM_REQUEST_RECEIVED':
            return `${username} sent a message request`;
        case 'DM_REQUEST_ACCEPTED':
            return `${username} accepted your message request`;
        case 'DM_REQUEST_DECLINED':
            return `${username} declined your message request`;
        case 'SUPPORT_REQUEST_ACCEPTED':
            const expertName = data?.expertName || username;
            return `${expertName} accepted your support request`;
        case 'NEW_MESSAGE':
            return `${username} sent a new message`;
        
        // TIPS NOTIFICATIONS
        case 'TIPS_RECEIVED':
            return `${username} sent you a tip`;
        case 'TIPS_SENT':
            return `Tip sent to ${username}`;
        
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
            const expertNameAnswered = data?.expertName || username;
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
 * Post Card Component
 * Post ile ilgili bildirimler için özel card tasarımı
 */
const PostCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    // Minimal yapı: sadece imageUrl var (dokümana göre)
    const imageUrl = data.imageUrl;
    // title field'ı kaldırıldı, sadece message var
    const postContent = data.postContent || data.content || notification.message;

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={8}
            p="$3"
            mt={12}
        >
            {imageUrl && (
                <Image
                    source={toImageSource(imageUrl)}
                    alt="Post image"
                    style={{ width: '100%' }}
                    height={120}
                    borderRadius={8}
                    mb="$2"
                    resizeMode="cover"
                />
            )}
            
            {/* Tip Badge */}
            <HStack space="sm" alignItems="center" mb="$2">
                <HStack
                    bg="#3B82F6"
                    borderRadius={20}
                    px="$3"
                    py="$1"
                    alignItems="center"
                    space="xs"
                >
                    <LightBulbIcon width={14} height={14} color="#FFFFFF" />
                    <Text
                        color="#FFFFFF"
                        fontSize="$xs"
                        fontWeight="$semibold"
                    >
                        Tip
                    </Text>
                </HStack>
                {data.categoryName && (
                    <HStack alignItems="center" space="xs">
                        <Text
                            color={isDark ? '#B9B9B9' : '#666666'}
                            fontSize="$xs"
                            fontWeight="$normal"
                        >
                            {data.categoryName}
                        </Text>
                        <Box
                            width={16}
                            height={16}
                            bg={isDark ? '#3A3A3A' : '#E0E0E0'}
                            borderRadius={4}
                        />
                    </HStack>
                )}
            </HStack>

            {postContent && (
                <Text
                    color={isDark ? '#B9B9B9' : '#666666'}
                    fontSize="$xs"
                    fontWeight="$normal"
                    numberOfLines={3}
                >
                    {postContent}
                </Text>
            )}
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
 */
const CommentCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    // Minimal yapı: Sadece DM_REQUEST_RECEIVED için data.message var
    // Diğer comment bildirimlerinde message preview yok
    const commentContent = data.message;

    if (!commentContent) return null;

    return (
        <Box mt={4} mr="$2">
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
 * Event Card Component
 * Event bildirimleri için özel card tasarımı
 */
const EventCard: React.FC<{
    notification: Notification;
    isDark: boolean;
}> = ({ notification, isDark }) => {
    const data = notification.data || notification.metadata || {};
    // Minimal yapı: eventName kaldırıldı, sadece eventId ve imageUrl var
    const imageUrl = data.imageUrl;
    // title field'ı kaldırıldı, sadece message var
    const eventDescription = notification.message;

    return (
        <Box
            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
            borderRadius={8}
            p="$3"
            mt={12}
        >
            {imageUrl && (
                <Image
                    source={toImageSource(imageUrl)}
                    alt="Event image"
                    style={{ width: '100%' }}
                    height={120}
                    borderRadius={8}
                    mb="$2"
                    resizeMode="cover"
                />
            )}
            
            {eventDescription && (
                <Text
                    color={isDark ? '#B9B9B9' : '#666666'}
                    fontSize="$xs"
                    fontWeight="$normal"
                    numberOfLines={2}
                >
                    {eventDescription}
                </Text>
            )}
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
    // Minimal yapı: badgeName kaldırıldı (mesajda zaten var), achievementId kaldırıldı
    // Sadece badgeId, imageUrl ve amount var
    const rewardAmount = data.amount || data.rewardAmount;

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
                    {notification.message && (
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$sm"
                            fontWeight="$bold"
                        >
                            {notification.message}
                        </Text>
                    )}
                </VStack>
                {rewardAmount && (
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
                )}
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
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const markAsReadMutation = useMarkNotificationAsRead();
    const deleteMutation = useDeleteNotification();

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
                    navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
                        messageId: data.threadId,
                        threadId: data.threadId,
                        recipientUserId: notification.userId,
                    }, {
                        priority: 'high',
                        force: false,
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
                    navigationService.navigate(ROOT_ROUTES.SUPPORT_MESSAGE_DETAIL, {
                        requestId: data.requestId || data.threadId, // requestId backend'den gelmeli
                        threadId: data.threadId,
                        expertName: notification.userId ? 'Expert' : 'User', // Backend'den gelmeli
                        expertTitle: '',
                        expertAvatar: notification.avatar || null,
                        recipientUserId: notification.userId,
                        status: 'active',
                    }, {
                        priority: 'high',
                        force: false,
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
                    navigationService.navigate(ROOT_ROUTES.SUPPORT_MESSAGE_DETAIL, {
                        requestId: data.requestId,
                        threadId: data.threadId || null, // EXPERT_REQUEST_ANSWERED için threadId gelmeli
                        expertName: data.expertName || notification.userId ? 'Expert' : 'User', // Backend'den gelmeli
                        expertTitle: data.expertTitle || '', // Backend'den gelmeli
                        expertAvatar: data.expertAvatar || notification.avatar || null, // Backend'den gelmeli
                        recipientUserId: notification.userId,
                        status: type === 'EXPERT_REQUEST_ANSWERED' ? 'active' : 'pending',
                    }, {
                        priority: 'high',
                        force: false,
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
        // Minimal yapı: userId root seviyede zaten var (avatar ile eşleşir)
        // Data içinde duplicate userId field'ları kaldırıldı
        if (notification.userId) {
            try {
                navigationService.navigate(ROOT_ROUTES.PROFILE, {
                    screen: 'ProfileMain',
                    params: { userId: notification.userId },
                }, {
                    priority: 'high',
                    force: false,
                });
            } catch (error) {
                console.error('[NotificationCard] Avatar navigation error:', error);
            }
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
        if (notification.userId) {
            try {
                navigationService.navigate(ROOT_ROUTES.PROFILE, {
                    screen: 'ProfileMain',
                    params: { userId: notification.userId },
                }, {
                    priority: 'high',
                    force: false,
                });
            } catch (error) {
                console.error('[NotificationCard] Trust navigation error:', error);
            }
        }
    };

    // Handle Chat button press - Navigate to MessageDetail with threadId
    const handleChatPress = () => {
        const data = notification.data || notification.metadata || {};
        if (data.threadId) {
            try {
                navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
                    messageId: data.threadId,
                    threadId: data.threadId,
                    recipientUserId: notification.userId,
                }, {
                    priority: 'high',
                    force: false,
                });
            } catch (error) {
                console.error('[NotificationCard] Chat navigation error:', error);
            }
        }
    };

    // Avatar ve kullanıcı bilgileri
    const userAvatar = notification.avatar 
        ? toImageSource(notification.avatar)
        : DEFAULT_USER_AVATAR;
    
    // Minimal yapı: userName field'ları kaldırıldı (mesajda zaten var)
    const IconComponent = getIconComponent(notification.type);
    const category = getNotificationCategory(notification.type);
    
    // Data extraction - dokümana göre güncellendi
    const data = notification.data || notification.metadata || {};
    // Dokümana göre: TIPS_RECEIVED ve TIPS_SENT için data.amount kullanılır
    const tipsAmount = data.amount;
    const commentContent = data.message; // DM_REQUEST için, diğerleri için yok
    const postId = data.postId;
    const eventId = data.eventId;
    // Dokümana göre: imageUrl data objesi içinde (post, event, badge için)
    const imageUrl = data.imageUrl || notification.imageUrl;
    
    // Minimal yapı: userId root seviyede zaten var, data içinde duplicate yok
    const userId = notification.userId;

    // Category-based content rendering - Instagram benzeri tasarım
    const showTipsButton = category === 'tips' && tipsAmount; // Tips bildirimlerinde buton gösterilecek
    const showTrustButton = category === 'trust';
    const showCommentText = (category === 'message') && commentContent; // Sadece DM_REQUEST için
    const showChatButton = notification.type === 'DM_REQUEST_ACCEPTED'; // Mesaj isteği kabul edildi bildirimi için
    const showEventImage = category === 'event' && imageUrl; // Event bildirimlerinde görsel mesajın altında gösterilecek
    const showPostImage = (category === 'post' || category === 'comment') && postId && data.imageUrl; // Post bildirimlerinde data.imageUrl varsa sağda küçük görsel gösterilecek

    return (
        <Pressable 
            onPress={handlePress}
            py={4}
            px={16}
            borderBottomWidth={1}
            borderBottomColor={isDark ? '#333' : '#E9E9E9'}
        >
            <VStack alignItems="flex-start" justifyContent="flex-start">
                
                {/* Main Notification Row */}

                <HStack space="sm" alignItems="flex-start" justifyContent="flex-start">

                    {/* Avatar - Mor/pembe border ile */}
                    {/* Dokümana göre: Gamification/Event/Expert bildirimlerinde avatar = null */}
                    {notification.avatar ? (
                        <Pressable onPress={handleAvatarPress}>
                            <Box position="relative">
                                <Box
                                    width={48}
                                    height={48}
                                    borderRadius={24}
                                    borderWidth={2.5}
                                    borderColor="#C084FC"
                                    justifyContent="center"
                                    alignItems="center"
                                >
                                    <Image
                                        source={userAvatar}
                                        alt="User avatar"
                                        width={44}
                                        height={44}
                                        borderRadius={22}
                                    />
                                </Box>
                                {!notification.read && (
                                    <Box
                                        position="absolute"
                                        top={-2}
                                        right={-2}
                                        width={12}
                                        height={12}
                                        borderRadius={6}
                                        bg="#E8FF6B"
                                        borderWidth={2}
                                        borderColor={isDark ? '#000000' : '#FFFFFF'}
                                    />
                                )}
                            </Box>
                        </Pressable>
                    ) : (
                        // Gamification/Event/Expert bildirimlerinde avatar yok, placeholder göster
                        <Box
                            width={48}
                            height={48}
                            borderRadius={24}
                            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                            justifyContent="center"
                            alignItems="center"
                        >
                            <IconComponent width={24} height={24} color={isDark ? '#B9B9B9' : '#666666'} />
                        </Box>
                    )}

                    {/* Content - Ortada */}
                    <VStack flex={1} mr="$2" borderRadius={8} px="$2" py="$1" alignSelf="flex-start" space="xs">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$sm"
                            fontWeight="$normal"
                            lineHeight={18}
                        >
                            {(() => {
                                // Dokümana göre: message field'ı yok, type ve data'ya göre mesaj oluştur
                                const message = getNotificationMessage(notification.type, data);
                                const username = data?.username || data?.userName || data?.senderName || data?.likerName || data?.commenterName || data?.expertName;
                                
                                // Username'i bold yap (Instagram benzeri) - font size küçük
                                if (username && message.includes(username)) {
                                    const parts = message.split(username);
                                    return (
                                        <>
                                            {parts[0]}
                                            <Text fontWeight="$bold" fontSize="$sm">{username}</Text>
                                            {parts[1]}
                                        </>
                                    );
                                }
                                return message;
                            })()}
                        </Text>

                        {/* Content altında listelenecek yapılar */}
                        {showCommentText && (
                            <Box>
                                <CommentCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {showTipsButton && (
                            <Box>
                                <TipsCard 
                                    notification={notification} 
                                    onPress={handleTipsPress}
                                />
                            </Box>
                        )}

                        {showChatButton && (
                            <Box>
                                <ChatButton 
                                    notification={notification} 
                                    onPress={handleChatPress}
                                />
                            </Box>
                        )}

                        {showTrustButton && (
                            <Box>
                                <TrustCard notification={notification} onPress={handleTrustPress} />
                            </Box>
                        )}

                        {/* Event görseli - mesajın altında, dikey olarak */}
                        {showEventImage && (
                            <Box mt={8} width="100%">
                                <Image
                                    source={toImageSource(imageUrl)}
                                    alt="Event image"
                                    style={{ width: '100%', height: 200 }}
                                    borderRadius={8}
                                    resizeMode="cover"
                                />
                            </Box>
                        )}
                    </VStack>

                    {/* Image Thumbnail, Time - Sağda (Instagram benzeri) */}
                    {/* Event bildirimlerinde görsel mesajın altında olduğu için sağda gösterilmez */}
                    <HStack alignItems="flex-end" space="xs" justifyContent="flex-start">
                        {/* Post görseli - sağda küçük (Instagram benzeri) - sadece data.imageUrl varsa göster */}
                        {/* Event görseli mesajın altında gösterildiği için burada gösterilmez */}
                        {showPostImage && (
                            <Image
                                source={toImageSource(data.imageUrl)}
                                alt="Post image"
                                width={40}
                                height={40}
                                borderRadius={4}
                                resizeMode="cover"
                            />
                        )}
                        {/* Badge görseli - post değilse ve event değilse göster */}
                        {!showPostImage && !showEventImage && imageUrl && (
                            <Image
                                source={toImageSource(imageUrl)}
                                alt="Content image"
                                width={40}
                                height={40}
                                borderRadius={4}
                                resizeMode="cover"
                            />
                        )}
                        <Text
                            color="#8C8C8C"
                            fontSize="$xs"
                            fontWeight="$medium"
                        >
                            {formatRelativeTime(notification.createdAt)}
                        </Text>
                    </HStack>
                </HStack>
            </VStack>
        </Pressable>
    );
};

export default NotificationCard;
