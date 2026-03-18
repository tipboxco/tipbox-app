import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Platform, FlatList, ActivityIndicator, Share, Dimensions, ScrollView, Animated, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Box,
    VStack,
    HStack,
    Text,
    Pressable,
    Image,
    Button,
    ButtonText,
    Modal,
    ModalBackdrop,
    ModalContent,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, useFocusEffect, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { EventStackParamList } from '../EventNavigator';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';
import { Header } from '@/src/components/Header';
import { useQueryClient } from '@tanstack/react-query';
import { eventsKeys } from '../api/hooks';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  UsersIcon,
  PencilSquareIcon,
  TrophyIcon,
  UserPlusIcon,
  ClipboardDocumentListIcon,
} from 'react-native-heroicons/outline';
import { useEventDetail, useEventPosts, useJoinEvent, useLeaveEvent } from '../api/hooks';
    import { toImageSource, useSafeAreaValues, isSameImageSource } from '@/src/utils';
import { CardType, EventStatus } from '@/src/types/common';
import BadgeBottomSheet from '../components/BadgeBottomSheet';
import type { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import type { EventDetailReward } from '../types';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ExperiencePostApiItem } from '@/src/types/ExperienceCard';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import { ProductInfoType } from '@/src/types/common';
import RoastProductInfoCard from '../components/RoastProductInfoCard';
import { useTranslation } from '@/src/hooks/useTranslation';

const { width } = Dimensions.get('window');

// EventDetailScreen artık sadece EventNavigator'dan çağrılır
type EventDetailScreenNavigationProp = NativeStackNavigationProp<EventStackParamList, 'EventDetailScreen'>;
type EventDetailScreenRouteProp = RouteProp<EventStackParamList, 'EventDetailScreen'>;

const EventDetailScreen: React.FC = () => {
    const { t } = useTranslation('events');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<EventDetailScreenNavigationProp>();
    const route = useRoute<EventDetailScreenRouteProp>();
    const queryClient = useQueryClient();

    // EventDetailScreen artık sadece EventNavigator'dan çağrılır
    const eventId = route.params?.eventId;

    const handleGoBack = useCallback(() => {
        // EventDetailScreen is the initial screen in EventNavigator.
        // goBack() action bubbles: EventNavigator → RootStack → pops Event screen.
        // Try scoped navigation first, then parent, then root ref as final fallback.
        if (navigation.canGoBack()) {
            navigation.goBack();
            return;
        }
        const parent = navigation.getParent();
        if (parent?.canGoBack()) {
            parent.goBack();
            return;
        }
        // Final fallback: root navigation ref
        navigationService.goBack();
    }, [navigation]);

    // Validate eventId
    if (!eventId) {
        return (
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} pt={insets.top}>
                <Header
                    title={t('details.eventNotFound')}
                    showBackButton={true}
                    onBackPress={handleGoBack}
                />
                <Box flex={1} alignItems="center" justifyContent="center">
                    <Text color={isDark ? '#FFFFFF' : '#000000'}>
                        {t('details.eventIdNotFound')}
                    </Text>
                </Box>
            </Box>
        );
    }

    // Fetch event detail from API
    const { data: event, isLoading, error, refetch: refetchEvent } = useEventDetail(eventId);
    
    // Ekran focus olduğunda event detail ve posts'u yeniden yükle (Collections'dan geri dönünce)
    useFocusEffect(
        useCallback(() => {
            if (eventId) {
                refetchEvent();
                refetchPosts();
            }
        }, [eventId, refetchEvent, refetchPosts])
    );
    
    // YENİ: Event posts endpoint kullan (Yeni Backend yapısı)
    // NOT: Backend artık ContentPost tablosunu kullanıyor, /events/{eventId}/posts endpoint'i ile!
    const {
        data: postsData,
        fetchNextPage: fetchNextPostsPage,
        hasNextPage: hasNextPostsPage,
        isFetchingNextPage: isFetchingNextPostsPage,
        isLoading: isPostsLoading,
        error: postsError,
        refetch: refetchPosts, // Pull-to-refresh için
        isRefetching: isRefetchingPosts, // Refresh durumu
    } = useEventPosts(eventId, 20);
    
    // Join/Leave Event mutations
    const joinEventMutation = useJoinEvent();
    const leaveEventMutation = useLeaveEvent();
    
    // Flatten all pages into a single array
    // Backend'den dönen post listesi artık normal Feed formatında (FeedApiItem)
    const eventPosts = useMemo(() => {
        if (!postsData?.pages) return [];
        return postsData.pages.flatMap((page) => 
            (page.items && Array.isArray(page.items)) ? page.items : []
        );
    }, [postsData?.pages]);
    
    // Local state for join button (synced with API's isJoined)
    const [isJoined, setIsJoined] = useState(false);
    
    // Badge modal state
    const [selectedBadge, setSelectedBadge] = useState<SeeAllReward | null>(null);
    const bottomInset = useSafeAreaValues('bottom');

    // Format date range from startDate and endDate
    const formatDateRange = (startDate: string, endDate: string): string => {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

            const formatDate = (date: Date): string => {
                const day = date.getDate().toString().padStart(2, '0');
                const month = t(`details.months.${monthKeys[date.getMonth()]}`);
                const year = date.getFullYear();
                return `${day} ${month} ${year}`;
            };

            return `${formatDate(start)} - ${formatDate(end)}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    // Sync isJoined with API response
    React.useEffect(() => {
        if (event?.isJoined !== undefined) {
            setIsJoined(event.isJoined);
        }
    }, [event?.isJoined]);

    // Handle join/leave button press
    const handleJoinPress = useCallback(() => {
        if (!eventId) return;
        
        // Optimistic update
        const newIsJoined = !isJoined;
        setIsJoined(newIsJoined);
        
        // Call appropriate API based on current state
        if (isJoined) {
            // User is leaving the event
            leaveEventMutation.mutate(eventId, {
                onError: (error) => {
                    // Revert optimistic update on error
                    setIsJoined(isJoined);
                    console.error('[EventDetailScreen] Leave event error:', error);
                },
                onSuccess: (data) => {
                    // Update state with API response
                    if (data?.isJoined !== undefined) {
                        setIsJoined(data.isJoined);
                    }
                },
            });
        } else {
            // User is joining the event
            joinEventMutation.mutate(eventId, {
                onError: (error) => {
                    // Revert optimistic update on error
                    setIsJoined(isJoined);
                    console.error('[EventDetailScreen] Join event error:', error);
                },
                onSuccess: (data) => {
                    // Update state with API response
                    if (data?.isJoined !== undefined) {
                        setIsJoined(data.isJoined);
                    }
                },
            });
        }
    }, [eventId, isJoined, joinEventMutation, leaveEventMutation]);

    // Map Feed/Post to PostCardData (from FeedScreen)
    const mapFeedToCardData = (item: ProfilePost): PostCardData => {
        // content array ise string'e çevir, değilse direkt kullan
        const contentString = Array.isArray(item.content)
            ? item.content.map((contentItem) => contentItem.content || '').join(' ')
            : (item.content || '');

        // images array'i - mock image ekleme
        const images = item.images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img) ?? [];

        // contextData.image için fallback
        const contextImage = item.contextData?.image
            ? toImageSource(item.contextData.image)
            : undefined;
        const contextData = item.contextData
            ? {
                ...item.contextData,
                image: contextImage || item.contextData.image,
              }
            : undefined;

        // contextType'ı enum'a map et (backend uppercase, enum lowercase)
        let mappedContextType: ProductInfoType | undefined = undefined;
        if (item.contextType) {
            const contextTypeUpper = typeof item.contextType === 'string' 
                ? item.contextType.toUpperCase() 
                : '';
            
            switch (contextTypeUpper) {
                case 'PRODUCT':
                    mappedContextType = ProductInfoType.PRODUCT;
                    break;
                case 'PRODUCT_GROUP':
                    mappedContextType = ProductInfoType.PRODUCT_GROUP;
                    break;
                case 'SUB_CATEGORY':
                    mappedContextType = ProductInfoType.SUB_CATEGORY;
                    break;
                default:
                    mappedContextType = item.contextType as ProductInfoType;
            }
        }

        return {
            id: item.id,
            user: {
                id: item.user.id,
                name: item.user.name,
                title: item.user.title,
                avatar: toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png'),
                action: event?.title ? `📤 ${t('details.postedIn', { eventTitle: event.title })}` : undefined,
            },
            content: contentString,
            images,
            stats: {
                ...item.stats,
                upvotes: item.stats.upvotes || 0, // Event posts için upvote sayısı
            },
            createdAt: item.createdAt,
            contextType: mappedContextType,
            contextData,
            eventId: eventId,
            isLiked: item.isLiked,
            isUpvoted: item.isUpvoted ?? item.hasUpvoted, // Backend hasUpvoted olarak gönderir
        };
    };

    // Map Benchmark to BenchmarkCardData (from FeedScreen)
    const mapBenchmarkToCardData = (item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
        const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');

        const products: BenchmarkProduct[] = (item.products && Array.isArray(item.products))
            ? item.products.map((p) => ({
                id: p.id,
                name: p.name,
                subName: p.subName,
                image: toImageSource(p?.image) || require('@/assets/inventory/product_01.png'),
                isOwned: p.isOwned,
                choice: p.choice,
            }))
            : [];

        return {
            id: item.id,
            user: {
                id: item.user.id,
                name: item.user.name,
                title: item.user.title,
                avatar: avatarSource,
            },
            products,
            content: item.content,
            stats: item.stats,
            createdAt: item.createdAt,
        };
    };

    // Map Experience (ExperiencePostApiItem) to ExperiencePostCardData
    const mapExperienceToCardData = (item: ExperiencePostApiItem & { type: 'experience' }): ExperiencePostCardData => {
        const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');
        const ctx = item.contextData as { product?: { id?: string; name?: string; image?: string | null; subName?: string } } | undefined;
        const rawProduct = ctx?.product ?? item.contextData ?? item.product;
        const productImage = rawProduct?.image ? toImageSource(rawProduct.image) : undefined;

        const trimTrailingParen = (s: string) => (s || '').replace(/\s*\(\s*$/, '').trim();
        const contentBlocks = item.experienceContent ?? (Array.isArray(item.content) ? item.content : []);
        const content: ExperiencePostCardContentItem[] = Array.isArray(contentBlocks)
            ? contentBlocks.map((contentItem) => ({
                tag: {
                    icon: (contentItem.title?.toLowerCase?.().includes('product') || contentItem.title?.toLowerCase?.().includes('usage')) ? 'package' as const : 'tag' as const,
                    title: contentItem.title || 'Review',
                },
                text: trimTrailingParen(contentItem.content ?? ''),
                rating: Array(5)
                    .fill(false)
                    .map((_, index) => index < (contentItem.rating || 0)),
            }))
            : (typeof item.content === 'string' && (item.content as string).trim())
                ? [{
                    tag: { icon: 'tag' as const, title: 'Review' },
                    text: item.content,
                    rating: Array(5).fill(false),
                }]
                : [];

        const isOwned = item.status === 'own' || rawProduct?.isOwned || false;
        const subNameRaw = rawProduct?.subName ?? '';
        const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
        const tagsFromApi = Array.isArray(item.tags) ? item.tags : [];
        const tags =
          tagsFromApi.length >= 3
            ? tagsFromApi
            : [item.durationName, item.locationName, item.purposeName].filter((s): s is string => !!s);

        return {
            id: item.id,
            user: {
                id: item.user.id,
                name: item.user.name,
                title: item.user.title,
                avatar: avatarSource,
                action: t('post:card.addedToInventory'),
            },
            contextData: {
                id: rawProduct?.id || '',
                name: rawProduct?.name || '',
                subName,
                image: productImage,
                isOwned,
            },
            content,
            tags,
            images: (() => {
                const mapped = item.images
                    ?.map((img) => toImageSource(img))
                    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
                return productImage ? mapped.filter((img) => !isSameImageSource(img, productImage)) : mapped;
            })(),
            stats: item.stats,
            createdAt: item.createdAt,
        };
    };

    // Map Tips to TipsCardData (from FeedScreen)
    const mapTipsToCardData = (item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
        const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');
        const contextImage = toImageSource(item.contextData?.image) || require('@/assets/inventory/product_01.png');

        let category: TipsCategory;
        if (item.contextType === 'sub_category') {
            category = {
                id: item.contextData.id,
                name: item.contextData.name,
                subCategory: item.contextData.subName,
                image: contextImage,
            };
        } else {
            const product: TipsProduct = {
                id: item.contextData.id,
                name: item.contextData.name,
                subName: item.contextData.subName,
                image: contextImage,
                isOwned: item.contextData.isOwned,
            };
            category = {
                id: item.contextData.id,
                name: item.contextData.name,
                subCategory: item.contextData.subName,
                image: contextImage,
                product,
            };
        }

        return {
            id: item.id,
            user: {
                id: item.user.id,
                name: item.user.name,
                title: item.user.title,
                avatar: avatarSource,
            },
            category,
            content: item.content,
            images: item.images
                ?.map((img) => toImageSource(img))
                .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
            stats: item.stats,
            tag: item.tag,
    benefitCategory: item.benefitCategory,
            createdAt: item.createdAt,
        };
    };

    // Map Question to QuestionCardData (from FeedScreen)
    const mapQuestionToCardData = (item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
        const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');
        const contextImage = toImageSource(item.contextData?.image) || require('@/assets/inventory/product_01.png');

        let category: QuestionCardCategory;
        if (item.contextType === 'sub_category') {
            category = {
                id: item.contextData.id,
                name: item.contextData.name,
                subCategory: item.contextData.subName,
                image: contextImage,
            };
        } else {
            const product: QuestionCardProduct = {
                id: item.contextData.id,
                name: item.contextData.name,
                subName: item.contextData.subName,
                image: contextImage,
                isOwned: item.contextData.isOwned,
            };
            category = {
                id: item.contextData.id,
                name: item.contextData.name,
                subCategory: item.contextData.subName,
                image: contextImage,
                product,
            };
        }

        // images array'i - mock image ekleme
        const images = item.images
            ?.map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];

        return {
            id: item.id,
            user: {
                id: item.user.id,
                name: item.user.name,
                title: item.user.title,
                avatar: avatarSource,
            },
            category,
            content: item.content,
            isBoosted: item.isBoosted,
            boostedUntil: item.boostedUntil,
            boostPrice: item.boostPrice,
            images,
            stats: item.stats,
            createdAt: item.createdAt,
        };
    };

    // Map Update to UpdateCardData (from FeedScreen)
    const mapUpdateToCardData = (item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
        const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');
        
        // ContextType'ı ProductInfoType'a çevir
        let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
        if (item.contextType === 'product_group') {
            productInfoType = ProductInfoType.PRODUCT_GROUP;
        } else if (item.contextType === 'sub_category') {
            productInfoType = ProductInfoType.SUB_CATEGORY;
        }

        // relatedPost null check - eğer yoksa relatedPost olmadan döndür
        if (!item.relatedPost) {
            console.warn('[mapUpdateToCardData] Missing relatedPost for item:', item.id);
            // images array'i - mock image ekleme
            const images = Array.isArray(item.images)
                ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
                : [];

            // Return a safe default structure without relatedPost
            return {
                id: item.id,
                user: {
                    id: item.user.id,
                    name: item.user.name,
                    title: item.user.title,
                    avatar: avatarSource,
                },
                stats: item.stats,
                createdAt: item.createdAt,
                contextType: productInfoType,
                product: {
                    id: '',
                    name: '',
                    subName: '',
                    image: require('@/assets/inventory/product_01.png'),
                    isOwned: false,
                },
                content: item.content || '',
                images,
                relatedPost: undefined, // relatedPost olmadığında undefined döndür
            };
        }

        // relatedPost.content formatını component'in beklediği formata çevir
        const relatedPostContent = (item.relatedPost?.content && Array.isArray(item.relatedPost.content))
            ? item.relatedPost.content
                .filter((contentItem) => contentItem != null) // Filter out null/undefined items
                .map((contentItem) => {
                    // Rating'i number'dan number[]'e çevir (5 yıldız için)
                    const ratingArray: number[] = Array(5).fill(0);
                    const ratingValue = Math.min(Math.max(Math.round((contentItem?.rating || 0) / 20), 0), 5); // 0-100'den 0-5'e çevir
                    for (let i = 0; i < ratingValue; i++) {
                        ratingArray[i] = 1;
                    }

                    return {
                        tag: {
                            icon: 'tag',
                            title: contentItem?.title || '',
                        },
                        text: contentItem?.content || '',
                        rating: ratingArray,
                    };
                })
            : [];

        // images array'i - mock image ekleme
        const images = Array.isArray(item.images)
            ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
            : [];

        return {
            id: item.id || '',
            user: {
                id: item.user?.id || '',
                name: item.user?.name || '',
                title: item.user?.title || '',
                avatar: avatarSource,
            },
            stats: item.stats,
            createdAt: item.createdAt,
            contextType: productInfoType,
            product: {
                id: item.relatedPost?.product?.id || '',
                name: item.relatedPost?.product?.name || '',
                subName: item.relatedPost?.product?.subName || '',
                image: toImageSource(item.relatedPost?.product?.image) || require('@/assets/inventory/product_01.png'),
                isOwned: item.relatedPost?.product?.isOwned || false,
            },
            content: item.content || '',
            images,
            relatedPost: item.relatedPost ? {
                id: item.relatedPost.id || '',
                product: {
                    id: item.relatedPost.product?.id || '',
                    name: item.relatedPost.product?.name || '',
                    subName: item.relatedPost.product?.subName || '',
                    image: toImageSource(item.relatedPost.product?.image) || require('@/assets/inventory/product_01.png'),
                    isOwned: item.relatedPost.product?.isOwned || false,
                },
                content: relatedPostContent,
                tags: (item.relatedPost.tags && Array.isArray(item.relatedPost.tags)) ? item.relatedPost.tags : [],
                images: (item.relatedPost?.images && Array.isArray(item.relatedPost.images))
                    ? item.relatedPost.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
                    : [],
            } : undefined,
        };
    };

    // Render feed item based on type (from FeedScreen)
    const renderFeedItem = (item: FeedApiItem) => {
        switch (item.type) {
            case CardType.EXPERIENCE:
                // Experience type için ExperiencePostApiItem kullan ve ExperiencePostCard render et
                if ('contextData' in item.data && 'content' in item.data) {
                    return (
                        <ExperiencePostCard
                            key={item.data.id}
                            data={mapExperienceToCardData(item.data as ExperiencePostApiItem & { type: 'experience' })}
                        />
                    );
                }
                return null;
            case CardType.POST:
                return (
                    <PostCard
                        key={item.data.id}
                        data={mapFeedToCardData(item.data as ProfilePost)}
                    />
                );
            case CardType.BENCHMARK:
                return (
                    <BenchmarkPostCard
                        key={item.data.id}
                        data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
                    />
                );
            case CardType.QUESTION:
                if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
                    return (
                        <QuestionPostCard
                            key={item.data.id}
                            data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
                        />
                    );
                }
                return null;
            case CardType.TIPS_AND_TRICKS:
                return (
                    <TipsAndTricksPostCard
                        key={item.data.id}
                        data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
                    />
                );
            case CardType.UPDATE:
                // Update type için UpdateApiItem kullan ve UpdatePostCard render et
                if ('relatedPost' in item.data && 'contextType' in item.data) {
                    return (
                        <UpdatePostCard
                            key={item.data.id}
                            data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
                        />
                    );
                }
                return null;
            default:
                return null;
        }
    };

    // Handle load more posts
    const handleLoadMore = useCallback(() => {
        if (hasNextPostsPage && !isFetchingNextPostsPage) {
            fetchNextPostsPage();
        }
    }, [hasNextPostsPage, isFetchingNextPostsPage, fetchNextPostsPage]);

    // Handle share with loading state to prevent double sharing
    const [isSharing, setIsSharing] = useState(false);
    const handleShare = useCallback(async () => {
        if (!event || isSharing) return;
        setIsSharing(true);
        try {
            await Share.share({
                message: t('details.shareMessage', { eventTitle: event.title }),
                url: `tipboxapp://events/event/${eventId}`,
            });
        } catch (error) {
            console.error('[EventDetailScreen] Share error:', error);
        } finally {
            setIsSharing(false);
        }
    }, [event, eventId, isSharing]);

    // Map EventDetailReward to SeeAllReward format for BadgeBottomSheet
    const mapRewardToSeeAllReward = useCallback((reward: EventDetailReward): SeeAllReward => {
        const imageSource = reward.image ? toImageSource(reward.image) : require('@/assets/defaultImages/default-badge.png');
        
        return {
            id: reward.id,
            title: reward.title,
            image: imageSource,
            description: `"${reward.title}" rozetini kazanmak için event'e katıl ve gönderiler paylaş.`,
            category: 'event',
            isUnlocked: false, // EventDetailReward'da bu bilgi yok, default false
            completed: 0,
            task: 1,
        };
    }, []);

    // Handle badge press - open modal
    const handleBadgePress = useCallback((reward: EventDetailReward) => {
        // Badge'e tıklandığında RewardsBadgesScreen'e yönlendir (aynı stack içinde)
        // RewardsBadgesScreen artık EventNavigator stack'inde, direkt navigate edebiliriz
        navigation.navigate('RewardsBadgesScreen', { eventId: eventId });
    }, [eventId, navigation]);

    // Handle modal close
    const handleCloseModal = useCallback(() => {
        setSelectedBadge(null);
    }, []);

    // Banner yüksekliği
    const BANNER_HEIGHT = 250;
    
    // Parallax ayarları
    const PARALLAX_BACKGROUND_SCROLL_SPEED = 0.5; // Banner'ın scroll'dan daha yavaş hareket etmesi için (0-1 arası)
    const PARALLAX_SCALE_FACTOR = 1.2; // Banner'ın scale efekti için
    
    // Parallax header için animated value
    const scrollY = useRef(new Animated.Value(0)).current;
    
    // Header opacity - scroll pozisyonuna göre 0'dan 1'e animate olacak
    // Banner'ın yarısına gelince header görünür olacak
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, BANNER_HEIGHT * 0.3, BANNER_HEIGHT * 0.7, BANNER_HEIGHT],
        outputRange: [0, 0.3, 0.8, 1],
        extrapolate: 'clamp',
    });
    
    // Header background color - transparent'dan solid'e geçiş
    const headerBackgroundOpacity = scrollY.interpolate({
        inputRange: [0, BANNER_HEIGHT * 0.5, BANNER_HEIGHT],
        outputRange: [0, 0.7, 1],
        extrapolate: 'clamp',
    });
    
    // Banner parallax translateY - scroll'dan daha yavaş hareket edecek
    // Scroll 100px aşağı inerse, banner sadece 50px yukarı kayar (PARALLAX_BACKGROUND_SCROLL_SPEED = 0.5)
    const bannerTranslateY = scrollY.interpolate({
        inputRange: [0, BANNER_HEIGHT],
        outputRange: [0, -BANNER_HEIGHT * PARALLAX_BACKGROUND_SCROLL_SPEED],
        extrapolate: 'clamp',
    });
    
    // Banner scale efekti - scroll yapınca zoom out olacak
    const bannerScale = scrollY.interpolate({
        inputRange: [-BANNER_HEIGHT, 0, BANNER_HEIGHT],
        outputRange: [PARALLAX_SCALE_FACTOR, 1, 0.95],
        extrapolate: 'clamp',
    });
    
    // Banner opacity - scroll yapınca kaybolacak
    const bannerOpacity = scrollY.interpolate({
        inputRange: [0, BANNER_HEIGHT * 0.5, BANNER_HEIGHT * 0.8, BANNER_HEIGHT],
        outputRange: [1, 0.7, 0.2, 0],
        extrapolate: 'clamp',
    });
    
    // Overlay opacity - banner ile birlikte kaybolacak
    const overlayOpacity = scrollY.interpolate({
        inputRange: [0, BANNER_HEIGHT * 0.5, BANNER_HEIGHT],
        outputRange: [0.6, 0.4, 0],
        extrapolate: 'clamp',
    });
    
    // Banner overlay header opacity - banner görünürken header görünecek, scroll yapınca kaybolacak
    const bannerHeaderOpacity = scrollY.interpolate({
        inputRange: [0, BANNER_HEIGHT * 0.3, BANNER_HEIGHT * 0.7, BANNER_HEIGHT],
        outputRange: [1, 0.8, 0.2, 0],
        extrapolate: 'clamp',
    });
    
    // Scroll handler
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
    );

    // Pull-to-Refresh handler - Event Feed'i cache'siz fresh data ile yenile
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const isRefreshing = isRefetchingPosts || isManualRefreshing;
    const handleRefresh = useCallback(async () => {
        // CRITICAL: Event Feed cache'ini tamamen temizle ve ilk sayfadan yeniden çek
        // Bu sayede pull-to-refresh yapıldığında cache'ten değil network'ten fresh data gelir
        const postsQueryKeyPrefix = ['events', 'posts', eventId] as const;
        setIsManualRefreshing(true);
        try {
            await queryClient.cancelQueries({ queryKey: postsQueryKeyPrefix });
            queryClient.removeQueries({ queryKey: postsQueryKeyPrefix, exact: false });
            await refetchPosts();
        } finally {
            setIsManualRefreshing(false);
        }
    }, [queryClient, eventId, refetchPosts]);

    // Loading state
    if (isLoading) {
        return (
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} pt={insets.top}>
                <Header
                    title={t('details.loading')}
                    showBackButton={true}
                    onBackPress={handleGoBack}
                />
                <Box flex={1} alignItems="center" justifyContent="center">
                    <Text color={isDark ? '#FFFFFF' : '#000000'}>{t('details.loading')}</Text>
                </Box>
            </Box>
        );
    }

    // Error state
    if (error || !event) {
        return (
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} pt={insets.top}>
                <Header
                    title={t('details.eventNotFound')}
                    showBackButton={true}
                    onBackPress={handleGoBack}
                />
                <Box flex={1} alignItems="center" justifyContent="center">
                    <Text color={isDark ? '#FFFFFF' : '#000000'}>
                        {error ? t('details.eventLoadError') : t('details.eventNotFoundError')}
                    </Text>
                </Box>
            </Box>
        );
    }

    const dateRange = formatDateRange(event.startDate, event.endDate);
    // Banner için önce banner field'ını kullan (API'den gelen), yoksa image kullan (EventsScreen'de görünen)
    const bannerImageSource = event.banner 
        ? toImageSource(event.banner) 
        : (event.image ? toImageSource(event.image) : require('@/assets/defaultImages/default-event.png'));
    const participantAvatars = event.participants?.map(p => p.avatar) || [];
    const isRoastsEvent = String(event.eventType ?? '').toLowerCase() === 'roasts';
    const roastProductImageSource = event.product?.image ? toImageSource(event.product.image) : undefined;
    const roastProductDescription =
        event.product?.shortDescription ?? event.product?.description ?? '';

    return (
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            {/* ScrollView */}
            <Animated.ScrollView
                style={{
                    flex: 1,
                }}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: insets.bottom + 80,
                }}
                bounces={false}
                overScrollMode="never"
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={isDark ? '#E2FF46' : '#8B5CF6'}
                        // iOS için progressViewOffset ekle (banner altından başlaması için)
                        progressViewOffset={Platform.OS === 'ios' ? 0 : undefined}
                    />
                }
                onMomentumScrollEnd={(event) => {
                    // Infinite scroll için scroll pozisyonunu kontrol et
                    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                    const paddingToBottom = 20;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
                    
                    if (isCloseToBottom && hasNextPostsPage && !isFetchingNextPostsPage) {
                        handleLoadMore();
                    }
                }}
            >
                {/* Banner - Parallax efekt ile */}
                <Box
                    width="100%"
                    height={BANNER_HEIGHT}
                    overflow="hidden"
                >
                    <Animated.Image
                        source={bannerImageSource}
                        style={{
                            width: '100%',
                            height: BANNER_HEIGHT * (1 + PARALLAX_SCALE_FACTOR * 0.3), // Scale için ekstra yükseklik
                            transform: [
                                { translateY: bannerTranslateY },
                                { scale: bannerScale },
                            ],
                            opacity: bannerOpacity,
                        }}
                        resizeMode="cover"
                    />
                    {/* Overlay - banner ile birlikte kaybolacak */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            opacity: overlayOpacity,
                        }}
                    />
                </Box>

                {/* Content */}
                <VStack
                    bg={isDark ? '#000000' : '#FAFAFA'}
                    borderTopLeftRadius={20}
                    borderTopRightRadius={20}
                    flex={1}
                    px={15}
                    pt={15}
                    style={{
                        backgroundColor: isDark ? '#000000' : '#FAFAFA',
                        minHeight: '100%',
                    }}
                >
                    {/* Event Type Badge */}
                    <Box mb="$2">
                        <Box
                            bg="rgba(144, 8, 255, 0.8)"
                            borderWidth={1}
                            borderColor="#CA88FF"
                            borderRadius={10}
                            px="$2"
                            py="$1"
                            alignSelf="flex-start"
                        >
                            <Text
                                color="#FFFFFF"
                                fontSize={9}
                                fontWeight="$bold"
                            >
                                {event.eventType}
                            </Text>
                        </Box>
                    </Box>

                    <HStack justifyContent="space-between" alignItems="center" mb="$2" space="sm">
                        {/* Event Title */}
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={16}
                            fontWeight="$bold"
                            flex={0.8}
                            numberOfLines={2}
                            mr="$2"
                        >
                            {event.title}
                        </Text>
                        <Button
                            bg={isJoined ? '#D9D9D9' : '#C2E607'}
                            borderRadius={5}
                            h={36}
                            px="$3"
                            isDisabled={event.status === EventStatus.UPCOMING || joinEventMutation.isPending || leaveEventMutation.isPending}
                            onPress={handleJoinPress}
                            flex={0.2}
                        >
                            <HStack alignItems="center" space="xs">
                                {!isJoined && <UserPlusIcon width={16} height={16} color="#000000" />}
                                <ButtonText
                                    color="#000000"
                                    fontSize={14}
                                    fontWeight="$bold"
                                    textAlign="center"
                                >
                                    {(joinEventMutation.isPending || leaveEventMutation.isPending)
                                        ? '...'
                                        : (isJoined ? t('details.joined') : t('details.join'))
                                    }
                                </ButtonText>
                            </HStack>
                        </Button>
                    </HStack>

                    {/* Event Description */}
                    <Text
                        color={isDark ? '#FFFFFF' : '#343434'}
                        fontSize={12}
                        lineHeight={16}
                        mb="$3"
                    >
                        {event.description}
                    </Text>

                    {/* Roast Product Info (eventType: Roasts) */}
                    {isRoastsEvent && event.product?.name ? (
                        <VStack space="xs" mb="$3">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                {t('details.product')}
                            </Text>

                            <RoastProductInfoCard
                                name={event.product.name}
                                description={roastProductDescription}
                                imageSource={roastProductImageSource}
                            />
                        </VStack>
                    ) : null}

                    {/* Details Section - 3 Column Grid */}
                    <VStack space="xs" mb="$3">
                        <Text
                            color={isDark ? '#FFFFFF' : '#000000'}
                            fontSize={12}
                            fontWeight="$bold"
                        >
                            {t('details.description')}
                        </Text>

                        <Box
                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                            borderWidth={1}
                            borderColor="#E9E9E9"
                            borderRadius={5}
                            px="$3"
                            py="$4"
                        >
                            <HStack justifyContent="space-around" alignItems="flex-start">
                                {/* End Date */}
                                <VStack alignItems="center" space="xs" flex={1}>
                                    <Box
                                        width={40}
                                        height={40}
                                        borderRadius={20}
                                        borderWidth={1}
                                        borderColor="#D9D9D9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <CalendarIcon width={20} height={20} color="#B9B9B9" />
                                    </Box>
                                    <Text
                                        color="#B9B9B9"
                                        fontSize={11}
                                        fontWeight="$medium"
                                        textAlign="center"
                                    >
                                        {t('details.endDate')}
                                    </Text>
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={12}
                                        fontWeight="$bold"
                                        textAlign="center"
                                    >
                                        {(() => {
                                            try {
                                                const end = new Date(event.endDate);
                                                const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                                                return `${end.getDate()} ${t(`details.months.${monthKeys[end.getMonth()]}`)}`;
                                            } catch { return ''; }
                                        })()}
                                    </Text>
                                </VStack>

                                {/* Participants */}
                                <VStack alignItems="center" space="xs" flex={1}>
                                    <Box
                                        width={40}
                                        height={40}
                                        borderRadius={20}
                                        borderWidth={1}
                                        borderColor="#D9D9D9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <UsersIcon width={20} height={20} color="#B9B9B9" />
                                    </Box>
                                    <Text
                                        color="#B9B9B9"
                                        fontSize={11}
                                        fontWeight="$medium"
                                        textAlign="center"
                                    >
                                        {t('details.participants')}
                                    </Text>
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={12}
                                        fontWeight="$bold"
                                        textAlign="center"
                                    >
                                        {event.interaction}
                                    </Text>
                                </VStack>

                                {/* Winners */}
                                <VStack alignItems="center" space="xs" flex={1}>
                                    <Box
                                        width={40}
                                        height={40}
                                        borderRadius={20}
                                        borderWidth={1}
                                        borderColor="#D9D9D9"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <TrophyIcon width={20} height={20} color="#B9B9B9" />
                                    </Box>
                                    <Text
                                        color="#B9B9B9"
                                        fontSize={11}
                                        fontWeight="$medium"
                                        textAlign="center"
                                    >
                                        {t('details.winners')}
                                    </Text>
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize={12}
                                        fontWeight="$bold"
                                        textAlign="center"
                                    >
                                        {event.winners || `Top ${event.rewards?.length || 0}`}
                                    </Text>
                                </VStack>
                            </HStack>
                        </Box>
                    </VStack>

                    {/* Rewards & Badges Section - EVENT_GUIDE.MD Section 2.4 */}
                    <VStack space="xs" mb="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                {t('details.rewardsAndBadges')}
                            </Text>
                            {/* See All Button */}
                            {event.rewards && event.rewards.length > 0 && (
                                <Pressable onPress={() => {
                                    // RewardsBadgesScreen'e yönlendir - aynı stack içinde
                                    // RewardsBadgesScreen artık EventNavigator stack'inde
                                    navigation.navigate('RewardsBadgesScreen', { eventId: eventId });
                                }}>
                                    <Text
                                        color={isDark ? '#FFFFFF' : '#000000'}
                                        fontSize="$sm"
                                        fontWeight="$medium"
                                        textDecorationLine="underline"
                                    >
                                        {t('details.seeAll')}
                                    </Text>
                                </Pressable>
                            )}
                        </HStack>

                        {/* Badge Cards - 3 Column Grid */}
                        {event.rewards && event.rewards.length > 0 ? (
                            <HStack flexWrap="wrap" mx={-4}>
                                {event.rewards.slice(0, 6).map((item) => {
                                    const imageSource = item.image ? toImageSource(item.image) : undefined;
                                    return (
                                        <Box key={item.id} width="33.33%" p={4}>
                                            <Pressable
                                                onPress={() => handleBadgePress(item)}
                                            >
                                                <Box
                                                    bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                                    borderWidth={1}
                                                    borderColor="#E9E9E9"
                                                    borderRadius={5}
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    p="$3"
                                                    py="$4"
                                                >
                                                    {imageSource ? (
                                                        <Image
                                                            source={imageSource}
                                                            alt={item.title}
                                                            width={62}
                                                            height={62}
                                                            borderRadius={5}
                                                            mb="$2"
                                                            resizeMode="contain"
                                                        />
                                                    ) : (
                                                        <Box
                                                            width={62}
                                                            height={62}
                                                            bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                                            borderRadius={5}
                                                            mb="$2"
                                                            alignItems="center"
                                                            justifyContent="center"
                                                        >
                                                            <TrophyIcon width={24} height={24} color={isDark ? '#666' : '#999'} />
                                                        </Box>
                                                    )}
                                                    <Text
                                                        color={isDark ? '#FFFFFF' : '#000000'}
                                                        fontSize={10}
                                                        fontWeight="$bold"
                                                        textAlign="center"
                                                        numberOfLines={2}
                                                    >
                                                        {item.title}
                                                    </Text>
                                                </Box>
                                            </Pressable>
                                        </Box>
                                    );
                                })}
                            </HStack>
                        ) : (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize={12}>
                                    {t('details.noRewards')}
                                </Text>
                            </Box>
                        )}
                    </VStack>

                    {/* Surveys Section */}
                    {event.surveys && event.surveys.length > 0 && (
                        <VStack space="xs" mb="$3">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                {t('survey.title')}
                            </Text>
                            <VStack space="sm">
                                {event.surveys.map((survey) => (
                                    <Pressable
                                        key={survey.id}
                                        onPress={() => {
                                            navigation.navigate('SurveyScreen', {
                                                brandId: survey.brandId,
                                                surveyId: survey.id,
                                                title: survey.title,
                                            });
                                        }}
                                    >
                                        <Box
                                            bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                                            borderWidth={1}
                                            borderColor="#E9E9E9"
                                            borderRadius={8}
                                            px="$3"
                                            py="$3"
                                        >
                                            <HStack alignItems="center" justifyContent="space-between">
                                                <HStack alignItems="center" space="sm" flex={1}>
                                                    <Box
                                                        width={36}
                                                        height={36}
                                                        borderRadius={18}
                                                        bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <ClipboardDocumentListIcon
                                                            width={18}
                                                            height={18}
                                                            color={isDark ? '#E2FF46' : '#8B5CF6'}
                                                        />
                                                    </Box>
                                                    <Text
                                                        color={isDark ? '#FFFFFF' : '#000000'}
                                                        fontSize={14}
                                                        fontWeight="$medium"
                                                        flex={1}
                                                        numberOfLines={1}
                                                    >
                                                        {survey.title}
                                                    </Text>
                                                </HStack>
                                                <ChevronRightIcon
                                                    width={18}
                                                    height={18}
                                                    color={isDark ? '#666' : '#999'}
                                                />
                                            </HStack>
                                        </Box>
                                    </Pressable>
                                ))}
                            </VStack>
                        </VStack>
                    )}

                    {/* Event Feed Section */}
                    <VStack space="xs" mt="$3">
                        <HStack justifyContent="space-between" alignItems="center">
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize={12}
                                fontWeight="$bold"
                            >
                                {t('details.eventFeed')}
                            </Text>
                            <Text
                                color={isDark ? '#FFFFFF' : '#000000'}
                                fontSize="$sm"
                                fontWeight="$bold"
                                underline
                            >
                                {t('details.latest')}
                            </Text>
                        </HStack>

                        {/* Event Feed Cards - Normal Feed Item'ları render et */}
                        {isPostsLoading && eventPosts.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                            </Box>
                        ) : postsError ? (
                            <Box py="$4" alignItems="center">
                                <Text color="#CE4A4A" fontSize={12}>
                                    {t('details.postsLoadError')}
                                </Text>
                            </Box>
                        ) : eventPosts.length === 0 ? (
                            <Box py="$4" alignItems="center">
                                <Text color={isDark ? '#FFFFFF' : '#B9B9B9'} fontSize={12}>
                                    {t('details.noPosts')}
                                </Text>
                            </Box>
                        ) : (
                            <VStack space="sm">
                                {eventPosts.map((item) => renderFeedItem(item))}
                                {isFetchingNextPostsPage && (
                                    <Box py="$4" alignItems="center">
                                        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </VStack>
                </VStack>
            </Animated.ScrollView>

            {/* Banner Overlay Header - Banner görünürken üstte görünecek, scroll yapınca kaybolacak */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 999,
                    paddingTop: insets.top,
                    paddingBottom: 10,
                    paddingHorizontal: 16,
                    opacity: bannerHeaderOpacity,
                }}
                pointerEvents="box-none"
            >
                <HStack justifyContent="space-between" alignItems="center">
                    <Pressable
                        onPress={handleGoBack}
                        width={36}
                        height={36}
                        borderRadius={18}
                        bg="rgba(0, 0, 0, 0.3)"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <ChevronLeftIcon width={20} height={20} color="#FFFFFF" />
                    </Pressable>

                    <Pressable
                        onPress={handleShare}
                        disabled={isSharing}
                        opacity={isSharing ? 0.5 : 1}
                        width={36}
                        height={36}
                        borderRadius={18}
                        bg="rgba(0, 0, 0, 0.3)"
                        alignItems="center"
                        justifyContent="center"
                    >
                        {isSharing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <ArrowTopRightOnSquareIcon width={20} height={20} color="#FFFFFF" />
                        )}
                    </Pressable>
                </HStack>
            </Animated.View>

            {/* Header - Parallax efekt ile scroll yapınca görünecek */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    paddingTop: insets.top,
                    paddingBottom: 10,
                    paddingHorizontal: 16,
                    opacity: headerOpacity,
                }}
                pointerEvents="box-none"
            >
                {/* Header background - dinamik opacity ile */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: isDark ? '#000000' : '#FFFFFF',
                        opacity: headerBackgroundOpacity,
                    }}
                />
                
                {/* Header content */}
                <HStack justifyContent="space-between" alignItems="center" style={{ zIndex: 1 }}>
                    <Pressable
                        onPress={handleGoBack}
                        width={36}
                        height={36}
                        borderRadius={18}
                        bg="rgba(0, 0, 0, 0.1)"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <ChevronLeftIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                    </Pressable>

                    <Text
                        color={isDark ? '#FFFFFF' : '#000000'}
                        fontSize={16}
                        fontWeight="$bold"
                        flex={1}
                        textAlign="center"
                        mx={16}
                    >
                        {event.title}
                    </Text>

                    <Pressable
                        onPress={handleShare}
                        disabled={isSharing}
                        opacity={isSharing ? 0.5 : 1}
                        width={36}
                        height={36}
                        borderRadius={18}
                        bg="rgba(0, 0, 0, 0.1)"
                        alignItems="center"
                        justifyContent="center"
                    >
                        {isSharing ? (
                            <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                        ) : (
                            <ArrowTopRightOnSquareIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                        )}
                    </Pressable>
                </HStack>
            </Animated.View>

            {/* Badge Detail Modal */}
            <Modal
                isOpen={!!selectedBadge}
                onClose={handleCloseModal}
                size="lg"
                closeOnOverlayClick={true}
            >
                <ModalBackdrop onPress={handleCloseModal} />
                {selectedBadge ? (
                    <ModalContent
                        bg={isDark ? '#1A1A1A' : '#FDFDFB'}
                        borderRadius={20}
                        marginHorizontal={24}
                        marginBottom={bottomInset + 24}
                        maxHeight="80%"
                    >
                        <BadgeBottomSheet
                            data={selectedBadge}
                            onClose={handleCloseModal}
                            eventId={eventId}
                            badgeId={selectedBadge?.id}
                        />
                    </ModalContent>
                ) : null}
            </Modal>

            {/* Floating Action Button - EVENT_GUIDE.MD Section 2.1 */}
            {/* FAB sadece isJoined: true ise görünsün */}
            {isJoined && event?.status === EventStatus.ACTIVE && (
                <Box
                    position="absolute"
                    bottom={insets.bottom + (Platform.OS === 'ios' ? 34 + 8 : 8)}
                    right={16}
                    zIndex={1000}
                >
                    <Pressable
                        bg="#E8FF6B"
                        borderRadius={30}
                        width={56}
                        height={56}
                        alignItems="center"
                        justifyContent="center"
                        shadowColor="#000"
                        shadowOffset={{ width: 0, height: 4 }}
                        shadowOpacity={0.3}
                        shadowRadius={4.65}
                        elevation={8}
                        onPress={() => {
                            const isRoastsEvent = String(event.eventType ?? '').toLowerCase() === 'roasts';

                            // eventType === 'product' ise product prop'u gönder, değilse undefined
                            // EventProduct tipine uygun hale getir (image field'ı ekle)
                            const product = event.eventType === 'product' && event.product
                                ? {
                                    id: event.product.id,
                                    name: event.product.name,
                                    image: null, // API'den image gelmiyor, null olarak gönder
                                    category: undefined,
                                }
                                : undefined;
                            
                            // eventType'ı EventType enum'una map et
                            // 'default' -> undefined (EventCreatePost'da seçilecek)
                            // 'product' -> EventType.TYPE2 (product event)
                            const eventTypeForNav = event.eventType === 'product' 
                                ? 'Type2' as any // EventType.TYPE2
                                : undefined;
                            
                            // EventDetailScreen EventNavigator stack'inde olduğu için
                            // Aynı stack içindeki EventCreatePost'a direkt navigate edebiliriz
                            console.log('🚀 [EventDetailScreen] Navigating to EventCreatePost with eventId:', eventId);
                            navigation.navigate('EventCreatePost', {
                                eventId: eventId,
                                eventType: eventTypeForNav,
                                product: product,
                                eventTypeRaw: event.eventType,
                                roastProduct: isRoastsEvent ? event.product : undefined,
                            });
                        }}
                    >
                        <PencilSquareIcon width={24} height={24} color="#000000" />
                    </Pressable>
                </Box>
            )}
        </Box>
    );
};

export default EventDetailScreen;
