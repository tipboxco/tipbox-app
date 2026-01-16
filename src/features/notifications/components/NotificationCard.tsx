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
            
            {/* İpucu Badge */}
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
                        İpucu
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
 * Tips bildirimleri için özel badge tasarımı
 */
const TipsCard: React.FC<{
    notification: Notification;
}> = ({ notification }) => {
    const data = notification.data || notification.metadata || {};
    const tipsAmount = data.amount || data.rewardAmount;

    if (!tipsAmount) return null;

    return (
        <Box mt={4}>
            <Box
                bg="#E8FF6B"
                borderRadius={20}
                px="$3"
                py="$1"
                alignSelf="flex-start"
            >
                <Text
                    color="#000000"
                    fontSize="$xs"
                    fontWeight="$bold"
                >
                    +{tipsAmount} TIPS
                </Text>
            </Box>
        </Box>
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
                Profili Görüntüle
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

        // Navigation based on notification type (dokümana göre güncellendi)
        try {
            const data = notification.data || notification.metadata || {};
            const type = notification.type;

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
            if (type === 'NEW_TRUSTER' || type === 'NEW_TRUSTED_BY') {
                if (notification.userId) {
                    navigationService.navigate(ROOT_ROUTES.PROFILE, {
                        screen: 'ProfileMain',
                        params: { userId: notification.userId },
                    }, {
                        priority: 'high',
                        force: false,
                    });
                    return;
                }
            }

            // 4. Mesajlaşma Bildirimleri → MessageDetail veya SupportMessageDetail
            if (type === 'DM_REQUEST_RECEIVED' || type === 'DM_REQUEST_ACCEPTED') {
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
            if (type === 'TIPS_RECEIVED' || type === 'TIPS_SENT') {
                navigationService.navigate(ROOT_ROUTES.WALLET, {
                    screen: 'WalletScreen',
                }, {
                    priority: 'high',
                    force: false,
                });
                return;
            }

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

    // Avatar ve kullanıcı bilgileri
    const userAvatar = notification.avatar 
        ? toImageSource(notification.avatar)
        : DEFAULT_USER_AVATAR;
    
    // Minimal yapı: userName field'ları kaldırıldı (mesajda zaten var)
    const IconComponent = getIconComponent(notification.type);
    const category = getNotificationCategory(notification.type);
    
    // Data extraction - minimal yapıya göre güncellendi
    const data = notification.data || notification.metadata || {};
    const tipsAmount = data.amount; // rewardAmount kaldırıldı
    const commentContent = data.message; // DM_REQUEST için, diğerleri için yok
    const postId = data.postId;
    const eventId = data.eventId;
    // Minimal yapı: imageUrl sadece gerekli yerlerde var (post, event, badge)
    const imageUrl = data.imageUrl;
    
    // Minimal yapı: userId root seviyede zaten var, data içinde duplicate yok
    const userId = notification.userId;

    // Category-based content rendering - minimal yapıya göre
    const showPostCard = category === 'post' && (postId || imageUrl);
    const showTipsBadge = category === 'tips' && tipsAmount;
    const showTrustButton = category === 'trust';
    const showCommentText = (category === 'message') && commentContent; // Sadece DM_REQUEST için
    const showEventInfo = category === 'event' && (eventId || imageUrl); // eventName kaldırıldı
    const showGamificationCard = category === 'gamification' && (data.badgeId || imageUrl || tipsAmount);

    return (
        <Pressable 
            onPress={handlePress}
            py={8}
            px={16}
            borderBottomWidth={1}
            borderBottomColor={isDark ? '#333' : '#E9E9E9'}
        >
            <VStack alignItems="flex-start" justifyContent="flex-start">
                
                {/* Main Notification Row */}

                <HStack space="sm" alignItems="flex-start" justifyContent="flex-start">

                    {/* Avatar - Mor/pembe border ile */}
                    {/* CRITICAL FIX: Event ve badge bildirimlerinde avatar gösterilmez */}
                    {!(showEventInfo || showGamificationCard) && (
                        <Pressable onPress={handleAvatarPress}>
                            <Box  position="relative">
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
                    )}

                    {/* Content - Ortada */}
                    <VStack flex={1} mr="$2" borderRadius={8} px="$2" py="$1" alignSelf="flex-start" space="xs">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize="$sm"
                            fontWeight="$normal"
                            lineHeight={18}
                        >
                            {notification.message}
                        </Text>

                        {/* Content altında listelenecek yapılar */}
                        {showTipsBadge && (
                            <Box>
                                <TipsCard notification={notification} />
                            </Box>
                        )}

                        {showCommentText && (
                            <Box>
                                <CommentCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {showPostCard && (
                            <Box>
                                <PostCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {showEventInfo && (
                            <Box>
                                <EventCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {showGamificationCard && (
                            <Box>
                                <GamificationCard notification={notification} isDark={isDark} />
                            </Box>
                        )}

                        {showTrustButton && (
                            <Box>
                                <TrustCard notification={notification} onPress={onPress} />
                            </Box>
                        )}
                    </VStack>

                    {/* Time and Icon - Sağda */}
                    <VStack alignItems="flex-end" space="xs" justifyContent="flex-start">
                        <Text
                            color="#8C8C8C"
                            fontSize="$xs"
                            fontWeight="$medium"
                        >
                            {formatRelativeTime(notification.createdAt)}
                        </Text>
                        <IconComponent width={20} height={20} color="#7D7D7D" />
                    </VStack>
                </HStack>
            </VStack>
        </Pressable>
    );
};

export default NotificationCard;
