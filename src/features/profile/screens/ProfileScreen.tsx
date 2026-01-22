import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Alert, Dimensions, RefreshControl, Pressable as RNPressable, View, Modal as RNModal, Text as RNText } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, HStack, VStack, Image, Modal, ModalBackdrop, ModalContent } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserProfile, useUserPosts, useUserReviews, useUserBenchmarks, useUserTipsAndTricks, useUserReplies, useAddToTrustList, useRemoveFromTrustList, useReportUser, useMuteUser, useUnmuteUser, useTrustList, useTrusterList, profileKeys } from '../api/hooks';
import { useSendGift, useCreateSupportRequest, useSendDirectMessage } from '@/src/features/inbox/api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { navigateToSharedScreenWithPruning } from '@/src/utils/navigation/sharedScreenNavigation';
import { Share, Keyboard, Platform } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { ProfileStackParamList } from '../navigation';
import { toImageSource, useSafeAreaValues, useBottomOffset } from '@/src/utils';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import SendTipsBottomSheet from '@/src/features/inbox/components/SendTipsBottomSheet';
import { CardType } from '@/src/types/common';
import type { PostCardData } from '@/src/types/PostCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ProfilePost, ProfileReview, UserProfile } from '../types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import PostCard from '@/src/components/PostCards/PostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { LadderTab } from '../components/TabContents';
import {
  ArrowUpTrayIcon,
  FlagIcon,
  NoSymbolIcon,
  ChevronLeftIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  GiftIcon,
  PhoneIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  BellSlashIcon,
  UserMinusIcon,
  UserPlusIcon,
} from 'react-native-heroicons/outline';
import { FeedSkeleton } from '@/src/components/Skeletons';
import BadgeBottomSheet from '@/src/features/events/components/BadgeBottomSheet';
import type { SeeAllReward } from '@/src/mock/events/communityEvents/types';
import type { Badge } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = [
  { key: 'feed',        title: 'Feed' },
  { key: 'reviews',     title: 'Reviews' },
  { key: 'benchmarks',  title: 'Benchmarks' },
  { key: 'tips',        title: 'Tips & Tricks' },
  { key: 'replies',     title: 'Questions' },
  { key: 'ladders',     title: 'Ladders' },
] as const;

type TabKey = typeof TABS[number]['key'];

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

// Mapping functions (FeedTab'tan alındı)
const mapPostToCardData = (post: ProfilePost): PostCardData | null => {
  if (!post?.id || !post?.user?.id) {
    return null;
  }
  
  const contextImage = post?.contextData?.image
    ? toImageSource(post.contextData.image)
    : undefined;

  const contentString = Array.isArray(post?.content)
    ? post.content.map((item) => item?.content || '').join(' ')
    : (post?.content || '');

  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = toImageSource(post.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

  // images array'i boşsa veya görseller yüklenemediyse default görsel ekle
  const mappedImages = post.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

  return {
    id: post.id,
    user: {
      id: post.user.id,
      name: post.user.name || '',
      title: post.user.title || '',
      avatar: avatarSource,
    },
    content: contentString,
    images,
    stats: {
      likes: post.stats.likes,
      comments: post.stats.comments || 0,
      shares: post.stats.shares,
      bookmarks: post.stats.bookmarks,
    },
    createdAt: post.createdAt,
    contextType: post?.contextType,
    contextData: post?.contextData
      ? {
          id: post.contextData.id,
          name: post.contextData.name || '',
          subName: post.contextData.subName || '',
          image: contextImage || post.contextData?.image || require('@/assets/defaultImages/default-post.png'),
          isOwned: post.contextData.isOwned,
        }
      : undefined,
  };
};

const mapExperienceToCardData = (review: ProfileReview): ReviewCardData | null => {
  if (!review?.id || !review?.user?.id) {
    return null;
  }
  
  const avatarSource = review.user?.avatar
    ? toImageSource(review.user.avatar)!
      : require('@/assets/avatar/default-useravatar.png');
  
  const productImage = review.contextData?.image
    ? toImageSource(review.contextData.image)
    : undefined;

  const content: ReviewCardContentItem[] = review.content?.map((item) => ({
    tag: {
      icon: 'tag',
      title: item?.title || '',
    },
    text: item?.content || '',
    rating: Array(5)
      .fill(false)
      .map((_, index) => index < (item?.rating || 0)),
  })) ?? [];

  return {
    id: review.id,
    user: {
      id: review.user.id,
      name: review.user.name || 'Unknown',
      title: review.user.title || '',
      avatar: avatarSource,
      action: 'wrote a review',
    },
    contextData: {
      id: review.contextData?.id || '',
      name: review.contextData?.name || '',
      subName: review.contextData?.subName || '',
      image: productImage,
      isOwned: review.contextData?.isOwned,
    },
    content,
    tags: review.tags?.slice(0, 3) ?? [],
    images:
      review.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
    stats: review.stats,
    createdAt: review.createdAt,
  };
};

const mapBenchmarkToCardData = (item: BenchmarkApiItem): BenchmarkCardData | null => {
  if (!item?.id || !item?.user?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');
  const products: BenchmarkProduct[] = (item?.products || [])
    .filter((p) => p?.id) // Filter out invalid products
    .map((p) => ({
      id: p.id || '',
      name: p?.name || '',
      subName: p?.subName || '',
      image: toImageSource(p?.image) || require('@/assets/inventory/product_01.png'),
      isOwned: p?.isOwned || false,
      choice: p?.choice || false,
    }));

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

const mapTipsToCardData = (item: TipsApiItem): TipsCardData | null => {
  if (!item?.contextData?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(item?.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
  const contextImage = toImageSource(item.contextData?.image) || require('@/assets/inventory/product_01.png');
  const product: TipsProduct = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subName: item.contextData.subName || '',
    image: contextImage,
  };
  const category: TipsCategory = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subCategory: item.contextData.subName || '',
    image: contextImage,
    product,
  };

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
    createdAt: item.createdAt,
  };
};

const mapQuestionToCardData = (item: QuestionApiItem): QuestionCardData | null => {
  if (!item?.contextData?.id) {
    return null;
  }
  
  const avatarSource = toImageSource(item?.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
  const contextImage = toImageSource(item.contextData?.image) || require('@/assets/inventory/product_01.png');
  const product: QuestionCardProduct = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subName: item.contextData.subName || '',
    image: contextImage,
  };
  const category: QuestionCardCategory = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subCategory: item.contextData.subName || '',
    image: contextImage,
    product,
  };

  // images array'i boşsa veya görseller yüklenemediyse default görsel ekle
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

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
    images,
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

// Mapped post type
type MappedPost = 
  | { type: 'post'; id: string; data: PostCardData }
  | { type: 'experience'; id: string; data: ReviewCardData }
  | { type: 'benchmark'; id: string; data: BenchmarkCardData }
  | { type: 'tips'; id: string; data: TipsCardData }
  | { type: 'question'; id: string; data: QuestionCardData };

// Tab content props
interface TabContentProps {
  tabKey: TabKey;
  targetUserId: string;
  isDark: boolean;
  onQueryRef?: (tabKey: TabKey, query: any) => void;
}

// TabsBar Component - Basitleştirilmiş versiyon (sadece tab seçimi)
interface TabsBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  isDark: boolean;
}

const TabsBar: React.FC<TabsBarProps> = ({ activeTab, onChangeTab, isDark }) => {
  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';

  return (
    <Box
      mb={0}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderBottomColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 16,
        }}
        scrollEnabled={true}
        bounces={false}
      >
        <HStack
          borderBottomWidth={1}
          borderColor="#E9E9E9"
          p={0}
          mb={0}
          position="relative"
          space="md"
        >
          {TABS.map((tab, index) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onChangeTab(tab.key)}
                alignItems="center"
                py="$1"
                px="$2"
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: isActive ? activeColor : inactiveColor,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.title}
                  </Text>
                </VStack>
                {/* Active indicator */}
                {isActive && (
                  <Box
                    position="absolute"
                    bottom={0}
                    left="50%"
                    height={2}
                    width={40}
                    backgroundColor={isDark ? '#FFFFFF' : '#000000'}
                    style={{
                      transform: [{ translateX: -15 }],
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </HStack>
      </ScrollView>
    </Box>
  );
};

// Tab Content Component - Sadece içeriği render eder (FlatList yok)
const TabContent: React.FC<TabContentProps> = ({ tabKey, targetUserId, isDark, onQueryRef }) => {
  // API hooks for each tab - sadece aktif tab'ın query'sini enable et
  const feedQuery = useUserPosts(targetUserId, 5, { enabled: tabKey === 'feed' });
  const reviewsQuery = useUserReviews(targetUserId, 5, { enabled: tabKey === 'reviews' });
  const benchmarksQuery = useUserBenchmarks(targetUserId, 5, { enabled: tabKey === 'benchmarks' });
  const tipsQuery = useUserTipsAndTricks(targetUserId, 5, { enabled: tabKey === 'tips' });
  const repliesQuery = useUserReplies(targetUserId, 5, { enabled: tabKey === 'replies' });
  
  // Get active tab query
  const activeTabQuery = useMemo(() => {
    switch (tabKey) {
      case 'feed': return feedQuery;
      case 'reviews': return reviewsQuery;
      case 'benchmarks': return benchmarksQuery;
      case 'tips': return tipsQuery;
      case 'replies': return repliesQuery;
      default: return feedQuery;
    }
  }, [tabKey, feedQuery, reviewsQuery, benchmarksQuery, tipsQuery, repliesQuery]) as typeof feedQuery;
  
  // Query ref'ini parent'a gönder
  useEffect(() => {
    if (onQueryRef && activeTabQuery) {
      onQueryRef(tabKey, activeTabQuery);
    }
  }, [tabKey, activeTabQuery, onQueryRef]);
  
  // Flatten and map posts based on active tab
  const mappedPosts = useMemo(() => {
    if (tabKey === 'ladders') return [];
    
    const queryData = activeTabQuery.data as any;
    if (!queryData?.pages) return [];
    
    const allItems = queryData.pages.flatMap((page: any) => page?.items ?? []) ?? [];
    const validItems = allItems.filter((item: any) => item?.id);
    const uniqueItems = validItems.filter((item: any, index: number, self: any[]) => 
      index === self.findIndex((t: any) => t?.id === item?.id)
    );
    
    const mapped: MappedPost[] = [];
    
    for (const item of uniqueItems) {
      let mappedItem: MappedPost | null = null;
      
      switch (item.type) {
        case CardType.EXPERIENCE:
          if (item?.contextData && Array.isArray(item?.content)) {
            const experienceData = mapExperienceToCardData(item as ProfileReview);
            if (experienceData) {
              mappedItem = { type: 'experience', id: item.id, data: experienceData };
            }
          }
          break;
        case CardType.BENCHMARK:
          const benchmarkData = mapBenchmarkToCardData(item as BenchmarkApiItem);
          if (benchmarkData) {
            mappedItem = { type: 'benchmark', id: item.id, data: benchmarkData };
          }
          break;
        case CardType.TIPS_AND_TRICKS:
          if (item?.contextData?.id) {
            const tipsData = mapTipsToCardData(item as TipsApiItem);
            if (tipsData) {
              mappedItem = { type: 'tips', id: item.id, data: tipsData };
            }
          }
          break;
        case CardType.QUESTION:
          if (item?.contextData?.id && 'isBoosted' in item) {
            const questionData = mapQuestionToCardData(item as QuestionApiItem);
            if (questionData) {
              mappedItem = { type: 'question', id: item.id, data: questionData };
            }
          }
          break;
        case CardType.POST:
        default:
          const postData = mapPostToCardData(item as ProfilePost);
          if (postData) {
            mappedItem = { type: 'post', id: item.id, data: postData };
          }
          break;
      }
      
      if (mappedItem) {
        mapped.push(mappedItem);
      }
    }
    
    return mapped;
  }, [activeTabQuery.data, tabKey]);
  
  // Render post card
  const renderPostCard = useCallback((postData: MappedPost) => {
    switch (postData.type) {
      case 'experience':
        return <ExperiencePostCard data={postData.data} />;
      case 'benchmark':
        return <BenchmarkPostCard data={postData.data} />;
      case 'tips':
        return <TipsAndTricksPostCard data={postData.data} />;
      case 'question':
        return <QuestionPostCard data={postData.data} />;
      case 'post':
      default:
        return <PostCard data={postData.data} />;
    }
  }, []);
  
  // Render LadderTab
  if (tabKey === 'ladders') {
    return (
      <Box>
        <LadderTab 
          onQueryRef={(query) => {
            if (onQueryRef) {
              onQueryRef(tabKey, query);
            }
          }}
        />
      </Box>
    );
  }

  // Loading state
  if (activeTabQuery.isLoading && !((activeTabQuery.data as any)?.pages?.[0])) {
    return (
      <Box py={20}>
        <FeedSkeleton count={3} />
      </Box>
    );
  }

  // Empty state
  if (mappedPosts.length === 0) {
    return (
      <Box py={20} alignItems="center">
        <Text color={isDark ? '$textLight400' : '$textDark400'} fontSize="$sm">
          No content found yet.
        </Text>
      </Box>
    );
  }

  // Render posts
  return (
    <Box px={16} pt={8}>
      {mappedPosts.map((item) => (
        <Box key={item.id} mb={16}>
          {renderPostCard(item)}
        </Box>
      ))}
      {activeTabQuery.isFetchingNextPage && (
        <Box py={20} alignItems="center">
          <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
      )}
    </Box>
  );
};

const ProfileScreen = ({ route }: ProfileScreenProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const rootNavigation = useNavigation<any>();
  const safeAreaTop = useSafeAreaValues('top');
  const safeAreaBottom = useSafeAreaValues('bottom');
  
  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: false, extraPadding: 16 });
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Safe area insets for bottom sheet
  const insets = useSafeAreaValues();
  
  // Route params'tan userId al, yoksa store'daki user.id'yi kullan
  // CRITICAL FIX: userId validasyonu - boş string veya geçersiz değer kontrolü
  const routeUserId = route.params?.userId;
  const rawTargetUserId = routeUserId || user?.id;
  
  // userId geçerli mi kontrol et (undefined, null, boş string kontrolü)
  const targetUserId = rawTargetUserId && 
    typeof rawTargetUserId === 'string' && 
    rawTargetUserId.trim().length > 0 
    ? rawTargetUserId.trim() 
    : undefined;
  
  // Query client for manual refetch
  const queryClient = useQueryClient();
  
  // Profile API hook
  const profileQueryResult = useUserProfile(targetUserId);
  const userProfile = profileQueryResult.data as UserProfile | undefined;
  const isProfileLoading = profileQueryResult.isLoading;
  const profileError = profileQueryResult.error;
  const refetchProfile = profileQueryResult.refetch;
  
  // CRITICAL FIX: Trust ve Truster sayılarını liste uzunluklarından al
  // DrawerContent ve Trust_TrusterListScreen ile aynı veriyi kullan (liste uzunluğu = gerçek sayı)
  const { data: trustListData, isLoading: isTrustListLoading, error: trustListError } = useTrustList(targetUserId || '', undefined);
  const { data: trusterListData, isLoading: isTrusterListLoading, error: trusterListError } = useTrusterList(targetUserId || '', undefined, undefined);
  
  // DEBUG: Truster list verilerini logla
  useEffect(() => {
    if (__DEV__ && targetUserId) {
      console.log('[ProfileScreen] Truster List Debug:', {
        targetUserId,
        trusterListData,
        trusterListLength: trusterListData?.length ?? 0,
        isTrusterListLoading,
        trusterListError: trusterListError?.message,
        userProfileStats: userProfile?.stats,
      });
    }
  }, [targetUserId, trusterListData, isTrusterListLoading, trusterListError, userProfile?.stats]);
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Focus'ta otomatik refresh state - yeni gönderi oluşturulduktan sonra ekrana yönlendirildiğinde gösterilecek
  const [isRefreshingOnFocus, setIsRefreshingOnFocus] = useState(false);
  
  // Badge modal state
  const [selectedBadge, setSelectedBadge] = useState<SeeAllReward | null>(null);
  
  // ARCHITECTURE FIX: Ekran focus olduğunda mevcut kullanıcının tüm profil verilerini refetch et
  // Yeni gönderi oluşturulduktan sonra ProfileScreen'e dönüldüğünde yeni gönderi görünsün
  useFocusEffect(
    useCallback(() => {
      // Sadece kendi profilimizdeysek (targetUserId === user?.id) refetch et
      if (targetUserId && user?.id && targetUserId === user.id) {
        // Activity indicator göster
        setIsRefreshingOnFocus(true);
        
        // Tüm profil verilerini invalidate et ve backend'den yeni veriyi çek
        // CreatePostScreen'lerde zaten invalidate yapılıyor ama burada da yapıyoruz
        // çünkü diğer yerlerden de ProfileScreen'e yönlendirilebilir
        Promise.all([
          // Cache'i invalidate et - yeni gönderi için cache'i temizle
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.userPosts(targetUserId),
            exact: false 
          }),
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.profile(targetUserId),
            exact: false 
          }),
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.userReviews(targetUserId),
            exact: false 
          }),
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.userBenchmarks(targetUserId),
            exact: false 
          }),
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.userTipsAndTricks(targetUserId),
            exact: false 
          }),
          queryClient.invalidateQueries({ 
            queryKey: profileKeys.userReplies(targetUserId),
            exact: false 
          }),
        ]).then(() => {
          // Cache invalidate edildikten sonra backend'den yeni veriyi çek
          return Promise.all([
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userPosts(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.profile(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userReviews(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userBenchmarks(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userTipsAndTricks(targetUserId),
              exact: false 
            }),
            queryClient.refetchQueries({ 
              queryKey: profileKeys.userReplies(targetUserId),
              exact: false 
            }),
          ]);
        }).then(() => {
          // Refetch tamamlandıktan sonra activity indicator'ı kapat
          setIsRefreshingOnFocus(false);
        }).catch((error) => {
          setIsRefreshingOnFocus(false);
        });
      }
    }, [targetUserId, user?.id, queryClient])
  );
  
  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    if (!targetUserId) return;
    
    setRefreshing(true);
    try {
      // Tüm profil verilerini backend'den yeniden çek
      await Promise.all([
        // Profile bilgilerini refresh et
        refetchProfile(),
        // Tüm tab query'lerini refresh et
        queryClient.refetchQueries({
          queryKey: profileKeys.userPosts(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userReviews(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userBenchmarks(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userTipsAndTricks(targetUserId),
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: profileKeys.userReplies(targetUserId),
          exact: false,
        }),
      ]);
    } catch (error) {
      // Error handled silently
    } finally {
      setRefreshing(false);
    }
  }, [targetUserId, refetchProfile, queryClient]);
  
  
  // Trust mutations
  const { mutate: trustUser, isPending: isTrusting } = useAddToTrustList();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  
  // Inbox mutations
  const sendGiftMutation = useSendGift();
  const createSupportRequestMutation = useCreateSupportRequest();
  const sendDirectMessageMutation = useSendDirectMessage();
  
  // Report mutation
  const { mutate: reportUser, isPending: isReporting } = useReportUser();
  
  // Mute/Unmute mutations
  const { mutate: muteUser, isPending: isMuting } = useMuteUser();
  const { mutate: unmuteUser, isPending: isUnmuting } = useUnmuteUser();
  
  // Toast hook
  const toast = useToast();
  
  // Kullanıcının kendi profiline bakıp bakmadığını kontrol et
  const isOwnProfile = user?.id === targetUserId;
  
  // Context menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerViewRef = useRef<View>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Tab değiştiğinde scroll pozisyonunu sıfırla
  const handleTabChange = useCallback((tabKey: TabKey) => {
    setActiveTab(tabKey);
    
    // Tab değiştiğinde scroll pozisyonunu en üste al
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, []);
  
  // Handle Send TIPS - Bottom sheet aç
  const handleSendTips = useCallback((amount: number, message?: string) => {
    if (!user?.id || !targetUserId) {
      Alert.alert('Error', 'User information not found');
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
      recipientUserId: targetUserId,
      message: finalMessage,
      amount: amount,
      timestamp: new Date().toISOString(),
    };

    console.log('[ProfileScreen] 📤 Sending TIPS Request:', {
      ...requestData,
      messagePreview: finalMessage.substring(0, 50) + '...',
      amountType: typeof amount,
      amountValue: amount,
    });

    // Send gift mutation
    sendGiftMutation.mutate(
      {
        senderUserId: user.id,
        recipientUserId: targetUserId,
        amount: amount,
        message: finalMessage,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: (response) => {
          console.log('[ProfileScreen] ✅ TIPS sent successfully:', response);
          showCustomToast(toast, {
            title: 'TIPS Sent',
            description: `${amount} TIPS has been sent successfully`,
            action: 'success',
          });
        },
        onError: (error: any) => {
          console.error('[ProfileScreen] ❌ TIPS send failed:', error);
          const errorMessage = error.response?.data?.message || error.message || 'An error occurred while sending TIPS';
          Alert.alert('Error', errorMessage);
        },
      }
    );
  }, [user?.id, targetUserId, sendGiftMutation, toast]);

  // Action button handlers
  const handleSendTIPS = useCallback(() => {
    if (!user?.id || !targetUserId || !userProfile) return;
    
    // Klavye açıksa kapat
    Keyboard.dismiss();
    
    // SendTipsBottomSheet'i modal olarak aç
    // requestAnimationFrame kullanarak bir sonraki frame'de aç - klavye kapanma işlemi tamamlansın
    requestAnimationFrame(() => {
      openBottomSheet(
        <SendTipsBottomSheet
          senderName={userProfile.name || 'Unknown'}
          senderTitle={userProfile.titles && userProfile.titles.length > 0 ? userProfile.titles[0] : ''}
          senderAvatar={userProfile.avatar ? (toImageSource(userProfile.avatar) || require('@/assets/avatar/default-useravatar.png')) : require('@/assets/avatar/default-useravatar.png')}
          onClose={closeBottomSheet}
          onSend={handleSendTips}
        />,
        {
          enablePanDownToClose: true,
          enableOverDrag: false,
          enableHandlePanningGesture: true,
          enableContentPanningGesture: true,
          enableDynamicSizing: true,
          animateOnMount: true,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom + 8 : 8,
          keyboardBehavior: 'interactive',
          keyboardBlurBehavior: 'restore',
          android_keyboardInputMode: 'adjustResize',
        }
      );
    });
  }, [user?.id, targetUserId, userProfile, openBottomSheet, closeBottomSheet, handleSendTips, insets.bottom]);

  const handle1on1Request = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et (1-on-1 request için)
    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handleDM = useCallback(() => {
    if (!user?.id || !targetUserId || !userProfile) return;
    // MessageDetail screen'ine navigate et
    navigateToSharedScreenWithPruning(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
      senderName: userProfile.name || 'Unknown',
      senderTitle: userProfile.titles && userProfile.titles.length > 0 ? userProfile.titles[0] : '',
      senderAvatar: userProfile.avatar ? (toImageSource(userProfile.avatar) || require('@/assets/avatar/default-useravatar.png')) : require('@/assets/avatar/default-useravatar.png'),
    });
  }, [user?.id, targetUserId, userProfile]);

  const handleShare = useCallback(async () => {
    if (!userProfile) return;
    try {
      await Share.share({
        message: `Check out ${userProfile.name}'s profile on Tipbox!`,
        url: `tipboxapp://profile/user/${targetUserId}`,
      });
    } catch (error) {
      console.error('[ProfileScreen] Share error:', error);
    }
  }, [userProfile, targetUserId]);

  const handleReport = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    
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
            reportUser({
              userId: user.id,
              targetUserId,
              data: {
                category: 'OTHER',
                description: 'User reported',
              },
            });
          },
        },
      ]
    );
  }, [user?.id, targetUserId, reportUser]);

  const handleBlock = useCallback(() => {
    Alert.alert(
      'Kullanıcıyı Engelle',
      'Bu kullanıcıyı engellemek istediğinizden emin misiniz? Engellediğiniz kullanıcı sizinle etkileşime geçemez.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Engelle',
          style: 'destructive',
          onPress: () => {
            // TODO: Block user API endpoint eklendiğinde buraya entegre edilecek
            // Navigate back after blocking
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [targetUserId, navigation]);

  // Calculate menu position - butona tıklandığında pozisyonu hesapla
  const handleMenuOpen = useCallback(() => {
    console.log('handleMenuOpen called, ref:', triggerViewRef.current);
    
    // InteractionManager kullanarak UI thread'inde çalıştır
    const InteractionManager = require('react-native').InteractionManager;
    
    InteractionManager.runAfterInteractions(() => {
      const tryMeasure = (attempts = 0) => {
        if (triggerViewRef.current) {
          triggerViewRef.current.measureInWindow((wx, wy, w, h) => {
            console.log('handleMenuOpen - measureInWindow:', { wx, wy, w, h });
            if (w > 0 && h > 0) {
              const screenWidth = Dimensions.get('window').width;
              const menuWidth = 200;
              const top = wy + h + 8;
              const left = Math.max(16, wx - menuWidth);
              console.log('handleMenuOpen - Menu position calculated:', { top, left });
              setMenuPosition({ top, left });
              setIsMenuOpen(true);
            } else {
              setIsMenuOpen(true);
            }
          });
        } else if (attempts < 10) {
          // Ref henüz hazır değil, 100ms sonra tekrar dene
          console.log(`handleMenuOpen - ref null, retrying... (attempt ${attempts + 1})`);
          setTimeout(() => tryMeasure(attempts + 1), 100);
        } else {
          console.log('handleMenuOpen - ref still null after 10 attempts, opening modal anyway');
          setIsMenuOpen(true);
        }
      };
      
      tryMeasure();
    });
  }, []);

  const handleMute = useCallback(() => {
    if (!user?.id || !targetUserId) {
      if (__DEV__) {
        console.warn('[ProfileScreen] handleMute: Missing required data', {
          hasUserId: !!user?.id,
          hasTargetUserId: !!targetUserId,
        });
      }
      return;
    }
    
    // Mutation zaten devam ediyorsa işlem yapma
    if (isMuting || isUnmuting) {
      if (__DEV__) {
        console.log('[ProfileScreen] handleMute: Mutation already in progress, skipping');
      }
      return;
    }
    
    // Cache'den güncel profile'ı al (optimistic update sonrası güncel değeri görmek için)
    const queryKey = profileKeys.profile(targetUserId);
    const cachedProfile = queryClient.getQueryData<UserProfile>(queryKey);
    const currentProfile = cachedProfile || userProfile;
    
    if (!currentProfile) {
      if (__DEV__) {
        console.warn('[ProfileScreen] handleMute: No profile data available');
      }
      return;
    }
    
    // isMuted değerini güvenilir şekilde kontrol et (undefined/null ise false kabul et)
    const isMuted = currentProfile.isMuted === true;
    
    if (__DEV__) {
      console.log('[ProfileScreen] handleMute called:', {
        userId: user.id,
        targetUserId,
        isMuted,
        isMutedRaw: currentProfile.isMuted,
        userName: currentProfile.name,
        fromCache: !!cachedProfile,
      });
    }
    
    if (isMuted) {
      if (__DEV__) {
        console.log('[ProfileScreen] Unmuting user...');
      }
      unmuteUser(
        { userId: user.id, targetUserId },
        {
          onSuccess: () => {
            if (__DEV__) {
              console.log('[ProfileScreen] ✅ User unmuted successfully');
            }
            showCustomToast(toast, {
              title: 'Unmuted',
              description: `${currentProfile.name} can now send notifications`,
              action: 'success',
            });
          },
          onError: (error) => {
            if (__DEV__) {
              console.error('[ProfileScreen] ❌ Unmute error:', error);
            }
            showCustomToast(toast, {
              title: 'Error',
              description: 'An error occurred while unmuting',
              action: 'error',
            });
          },
        }
      );
    } else {
      if (__DEV__) {
        console.log('[ProfileScreen] Muting user...');
      }
      muteUser(
        { userId: user.id, targetUserId },
        {
          onSuccess: () => {
            if (__DEV__) {
              console.log('[ProfileScreen] ✅ User muted successfully');
            }
            showCustomToast(toast, {
              title: 'User Muted',
              description: `${currentProfile.name} will no longer send notifications`,
              action: 'info',
            });
          },
          onError: (error) => {
            if (__DEV__) {
              console.error('[ProfileScreen] ❌ Mute error:', error);
            }
            showCustomToast(toast, {
              title: 'Error',
              description: 'An error occurred while muting user',
              action: 'error',
            });
          },
        }
      );
    }
  }, [targetUserId, user?.id, userProfile, muteUser, unmuteUser, toast, isMuting, isUnmuting, queryClient]);

  // Map Badge to SeeAllReward format for BadgeBottomSheet
  const mapBadgeToSeeAllReward = useCallback((badge: Badge): SeeAllReward => {
    const imageSource = badge.image ? toImageSource(badge.image) : require('@/assets/defaultImages/default-badge.png');
    
    return {
      id: badge.id,
      title: badge.title,
      image: imageSource,
      description: `You earned the "${badge.title}" badge!`,
      category: 'achievement',
      isUnlocked: true, // Profile'da gösterilen badge'ler zaten kazanılmış
      completed: 1,
      task: 1,
    };
  }, []);

  // Handle badge press - open modal
  const handleBadgePress = useCallback((badge: Badge) => {
    const badgeData = mapBadgeToSeeAllReward(badge);
    setSelectedBadge(badgeData);
  }, [mapBadgeToSeeAllReward]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setSelectedBadge(null);
  }, []);

  
  // ListHeaderComponent: Banner + Profile Info
  const renderProfileHeader = useCallback((activeTab: TabKey, onChangeTab: (tab: TabKey) => void, isLoading: boolean): React.ReactElement | null => {
    if (!userProfile && !isLoading) return null;
    if (!userProfile) return null;
    
    // TypeScript için: userProfile bu noktada kesinlikle tanımlı
    const profile = userProfile;
    
    // CRITICAL FIX: Avatar source'u DrawerContent ile aynı mantıkla hesapla
    // Önce userProfile'dan avatar al (API'den gelen güncel veri)
    // Yoksa store'dan avatar al (persist edilmiş veri)
    let avatarSource: any = null;
    if (userProfile?.avatar) {
      const profileAvatar = toImageSource(userProfile.avatar);
      if (profileAvatar) {
        avatarSource = profileAvatar;
      }
    } else if (user?.avatar) {
      // Yoksa store'dan avatar al (persist edilmiş veri)
      const storeAvatar = toImageSource(user.avatar);
      if (storeAvatar) {
        avatarSource = storeAvatar;
      }
    }
    
    return (
      <Box bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Banner */}
        <Box 
          h={180} 
          overflow="hidden" 
          position="relative"
        >
          <Image
            source={toImageSource(profile.bannerUrl) || require('@/assets/banner/banner_01.png')}
            alt="Profile Banner"
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="rgba(0, 0, 0, 0.5)"
          />
          
          {/* Pull to Refresh Loading Overlay - Banner'ın üstünde */}
          {(refreshing || isRefreshingOnFocus) && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="rgba(0, 0, 0, 0.3)"
              justifyContent="center"
              alignItems="center"
              zIndex={3000}
            >
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#FFFFFF'} />
            </Box>
          )}
          
          {/* Banner Controls */}
          <Box
            position="absolute"
            top={50}
            left={0}
            right={0}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="flex-start"
            px={16}
            zIndex={2000}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  rootNavigation.navigate('Main' as never);
                }
              }}
            >
              <ChevronLeftIcon size={24} color="#fff" />
            </Pressable>

            {isOwnProfile ? (
              <Pressable
                onPress={() => {
                  navigationService.navigate(ROOT_ROUTES.SETTINGS);
                }}
              >
                <EllipsisVerticalIcon size={24} color="#fff" />
              </Pressable>
            ) : (
              <View 
                ref={triggerViewRef}
                collapsable={false}
                style={{ position: 'relative', zIndex: 2001 }}
              >
                <Pressable onPress={handleMenuOpen}>
                  <EllipsisVerticalIcon size={24} color="#fff" />
                </Pressable>
              </View>
            )}
          </Box>
        </Box>

        {/* Profile Image and Action Buttons Row */}
        <Box px={15} mt={-45}>
          <HStack alignItems="flex-start" justifyContent="space-between" space="md">
            {/* Profile Image */}
            <Box 
              borderRadius={100}
              overflow="hidden"
              w={100}
              h={100}
              borderWidth={4}
              borderColor="$white"
              flexShrink={0}
              position="relative"
              bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
            >
              {/* Default avatar - her zaman arka planda */}
              <Image
                source={require('@/assets/avatar/default-useravatar.png')}
                alt="Default Avatar"
                position="absolute"
                w="100%"
                h="100%"
                resizeMode="cover"
              />
              {/* Kullanıcı avatar'ı - varsa üstte göster */}
              {/* CRITICAL FIX: DrawerContent ile aynı mantık - önce userProfile, sonra user store */}
              {avatarSource && (
                <Image
                  source={avatarSource}
                  alt={profile.name}
                  position="absolute"
                  w="100%"
                  h="100%"
                  resizeMode="cover"
                />
              )}
            </Box>

            {/* Action Buttons */}
            <HStack space="sm" alignItems="center" flexShrink={0} mt={60}>
              {isOwnProfile ? (
                <Pressable
                  bg="#F7F7F7"
                  borderRadius={200}
                  borderWidth={1}
                  borderColor="#E9E9E9"
                  px={12}
                  py={8}
                  flexDirection="row"
                  alignItems="center"
                  gap={6}
                  onPress={() => {
                    navigation.navigate('ProfileEdit');
                  }}
                >
                  <PencilIcon size={14} color="#000" />
                  <Text
                    color="#000"
                    fontSize={10}
                    fontWeight="$semibold"
                  >
                    Edit Profile
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleSendTIPS}
                  >
                    <GiftIcon size={16} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handle1on1Request}
                  >
                    <PhoneIcon size={16} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleDM}
                  >
                    <ChatBubbleLeftIcon size={16} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={34}
                    h={34}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleMute}
                    disabled={isMuting || isUnmuting}
                    opacity={(isMuting || isUnmuting) ? 0.6 : 1}
                  >
                    {userProfile?.isMuted ? (
                      <Box position="relative" justifyContent="center" alignItems="center">
                        <BellIcon size={16} color="#000" />
                        <Box
                          position="absolute"
                          width={20}
                          height={1}
                          bg="#000"
                          style={{
                            transform: [{ rotate: '-45deg' }],
                          }}
                        />
                      </Box>
                    ) : (
                      <BellIcon size={16} color="#000" />
                    )}
                  </Pressable>
                  
                  <Pressable
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    px={14}
                    py={10}
                    flexDirection="row"
                    alignItems="center"
                    gap={2}
                    onPress={() => {
                      if (!targetUserId) return;
                      if (profile.isTrusted) {
                        untrustUser(targetUserId);
                      } else {
                        trustUser(targetUserId);
                      }
                    }}
                    disabled={isTrusting || isUntrusting}
                    opacity={(isTrusting || isUntrusting) ? 0.6 : 1}
                  >
                    {profile.isTrusted ? (
                      <UserMinusIcon size={16} color="#000" />
                    ) : (
                      <UserPlusIcon size={16} color="#000" />
                    )}
                    <Text
                      color="#000"
                      fontSize={10}
                      fontWeight="$semibold"
                    >
                      {isTrusting ? "Ekleniyor..." : isUntrusting ? "Kaldırılıyor..." : (profile.isTrusted ? "Un Trust" : "Trust")}
                    </Text>
                  </Pressable>
                </>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Profile Info */}
        <Box px={15} mt={10}>
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontSize={18}
            fontWeight="$bold"
          >
            {profile.name}
          </Text>

          {profile.biography && (
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$sm"
              lineHeight={18}
              mt={2}
            >
              {profile.biography}
            </Text>
          )}

          {/* Stats */}
          <HStack space="xs" mt={10}>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$xs"
              fontWeight="$bold"
            >
              {profile.stats?.posts ?? 0}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
            >
              Posts
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
            >
              {" "}•{" "}
            </Text>
            <Pressable
              onPress={() => {
                if (targetUserId) {
                  navigation.navigate('TrustList', {
                    userId: targetUserId,
                    initialTab: 'trust',
                  });
                }
              }}
            >
              <HStack alignItems="center" space="xs">
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize="$xs"
                  fontWeight="$bold"
                >
                  {trustListData?.length ?? 0}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize="$xs"
                >
                  Trust
                </Text>
              </HStack>
            </Pressable>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize="$xs"
            >
              {" "}•{" "}
            </Text>
            <Pressable
              onPress={() => {
                if (targetUserId) {
                  navigation.navigate('TrustList', {
                    userId: targetUserId,
                    initialTab: 'truster',
                  });
                }
              }}
            >
              <HStack alignItems="center" space="xs">
                <Text
                  color={isDark ? '$textDark50' : '$textLight900'}
                  fontSize="$xs"
                  fontWeight="$bold"
                >
                  {(trusterListData?.length ?? 0) > 999 ? `${Math.floor((trusterListData?.length ?? 0) / 1000)}K` : (trusterListData?.length ?? 0)}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize="$xs"
                >
                  Truster
                </Text>
              </HStack>
            </Pressable>
          </HStack>
        </Box>

        {/* Inventory Header - Her zaman göster (kendi ve başkasının profili için) */}
        <Box mt={20} px={15} zIndex={1}>
          <Box
            w="100%"
            h={34}
            position="relative"
            overflow="hidden"
            borderRadius={4}
          >
            <Image
              source={require('@/assets/button/button_background_01.png')}
              alt="Button Background"
              position="absolute"
              w="100%"
              h="100%"
              resizeMode="cover"
            />
            <Pressable
              position="absolute"
              w="100%"
              h="100%"
              justifyContent="center"
              alignItems="center"
              zIndex={2}
              onPress={() => {
                navigation.navigate('InventoryList', {
                  userId: profile.id,
                });
              }}
            >
              <Text
                color="$white"
                fontSize="$xs"
                fontWeight="$semibold"
                textAlign="center"
              >
                {profile.name}'s Inventory
              </Text>
            </Pressable>
          </Box>
        </Box>

        {/* Badge Items */}
        {isProfileLoading ? (
          <Box mt={6} px={15} pb={16}>
            <Box
              borderRadius={5}
              p={14}
              h={130}
            >
              <HStack space="md" justifyContent="flex-start">
                {[0, 1, 2, 3].map((index) => (
                  <VStack key={index} space="xs" alignItems="center">
                    <Box
                      w={70}
                      h={70}
                      borderRadius={5}
                      bg={isDark ? '#404040' : '#E9E9E9'}
                    />
                    <Box
                      w={50}
                      h={10}
                      borderRadius={3}
                      bg={isDark ? '#404040' : '#E9E9E9'}
                    />
                  </VStack>
                ))}
              </HStack>
              <Box
                w={120}
                h={12}
                borderRadius={3}
                bg={isDark ? '#404040' : '#E9E9E9'}
                alignSelf="center"
                mt="$4"
              />
            </Box>
          </Box>
        ) : (
          <Box mt={6} px={15} pb={8}>
            <Box
              borderRadius={5}
              p={profile.badges && profile.badges.length > 0 ? 14 : 8}
            >
              {profile.badges && profile.badges.length > 0 ? (
                <HStack space="md" justifyContent="flex-start" alignItems="center" flex={1}>
                  {profile.badges.slice(0, 4).map((badge) => (
                    <Pressable
                      key={badge.id}
                      onPress={() => handleBadgePress(badge)}
                    >
                      <VStack space="xs" alignItems="center">
                        <Box
                          w={70}
                          h={70}
                          borderRadius={5}
                          borderWidth={0}
                          overflow="hidden"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Image
                            source={toImageSource(badge.image) || require('@/assets/defaultImages/default-badge.png')}
                            alt={badge.title}
                            w={60}
                            h={60}
                            resizeMode="contain"
                          />
                        </Box>
                        <Text
                          color={isDark ? '$textDark400' : '#000000'}
                          fontSize="$2xs"
                          fontWeight="$bold"
                          textAlign="center"
                        >
                          {badge.title}
                        </Text>
                      </VStack>
                    </Pressable>
                  ))}
                </HStack>
              ) : (
                <Box position="relative" flex={1} height={70}>
                  {/* 1 tane dashed badge placeholder - solda */}
                  <Box
                    w={70}
                    h={70}
                    borderRadius={5}
                    borderWidth={2}
                    borderColor={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                    borderStyle="dashed"
                    justifyContent="center"
                    alignItems="center"
                    bg={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}
                  />
                  {/* "Henüz badge yok" text - ortada (absolute position) */}
                  <Box
                    position="absolute"
                    left={0}
                    right={0}
                    top={0}
                    bottom={0}
                    justifyContent="center"
                    alignItems="center"
                    pointerEvents="none"
                  >
                    <Text
                      color={isDark ? '$textDark400' : '$textLight600'}
                      fontSize="$xs"
                      fontWeight="$regular"
                      textAlign="center"
                    >
                      Henüz badge yok
                    </Text>
                  </Box>
                </Box>
              )}
              {profile.badges && profile.badges.length > 0 && (
                <Pressable
                  onPress={() => {
                    navigation.navigate('Collections');
                  }}
                >
                  <Text
                    color={isDark ? '$textDark400' : '$textLight600'}
                    fontSize="$xs"
                    textAlign="center"
                    mt="$4"
                    fontWeight="$regular"
                  >
                    See More Collections
                  </Text>
                </Pressable>
              )}
            </Box>
          </Box>
        )}
      </Box>
    );
  }, [userProfile, isDark, isOwnProfile, targetUserId, trustUser, untrustUser, isTrusting, isUntrusting, rootNavigation, user, navigation, handleShare, handleReport, handleBlock, handleBadgePress, refreshing, isRefreshingOnFocus]);
  
  // Profile header'ı memoize et - CRITICAL: Early return'lerden ÖNCE çağrılmalı (Rules of Hooks)
  // userProfile undefined olsa bile hook çağrılmalı (Rules of Hooks)
  const profileHeader = useMemo(() => {
    return renderProfileHeader(activeTab, handleTabChange, isProfileLoading);
  }, [renderProfileHeader, activeTab, handleTabChange, isProfileLoading, refreshing]);
  
  // Tab query refs - load more için
  const tabQueriesRef = useRef<{ [key: string]: any }>({});
  
  // Tab query'yi kaydet
  const handleTabQueryRef = useCallback((tabKey: TabKey, query: any) => {
    tabQueriesRef.current[tabKey] = query;
  }, []);
  
  // Scroll handler - load more için
  const handleScroll = useCallback((event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 200; // 200px kala load more yap
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    
    if (isCloseToBottom) {
      // Aktif tab'ın query'sine load more yap
      const activeQuery = tabQueriesRef.current[activeTab];
      if (activeQuery && activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
        activeQuery.fetchNextPage();
      }
    }
  }, [activeTab]);
  
  if (profileError || !userProfile) {
    return (
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center" px={20}>
        <Text color="#CE4A4A" fontSize="$sm">
          {profileError?.message || 'Profil yüklenirken bir hata oluştu'}
        </Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <StatusBar style="light" />
      {/* Tüm ekran scroll edilebilir - Banner, Header, Tab Bar ve Content hepsi içinde */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        refreshControl={
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#FFFFFF' : '#000000'}
            colors={isDark ? ['#FFFFFF'] : ['#000000']}
          />
        }
        contentContainerStyle={{
          paddingBottom: bottomPadding,
        }}
      >
        {/* Profile Header - Scroll edilebilir */}
        <Box>
          {profileHeader}
        </Box>

        {/* Tab Bar - Scroll edilebilir */}
        <TabsBar 
          activeTab={activeTab} 
          onChangeTab={handleTabChange} 
          isDark={isDark}
        />

        {/* Tab Content - Scroll edilebilir */}
        <TabContent
          tabKey={activeTab}
          targetUserId={targetUserId || ''}
          isDark={isDark}
          onQueryRef={handleTabQueryRef}
        />
      </ScrollView>


      {/* Profile Menu Modal - React Native Modal */}
      {!isOwnProfile && (
        <RNModal
          visible={isMenuOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <RNPressable 
            style={styles.overlay} 
            onPress={() => setIsMenuOpen(false)} 
          >
            <View 
              style={[
                styles.menuContent, 
                { 
                  top: menuPosition.top, 
                  left: menuPosition.left,
                  backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' 
                }
              ]}
              onLayout={(event) => {
                const { x, y, width, height } = event.nativeEvent.layout;
                console.log('Modal menu opened at position:', {
                  styleTop: menuPosition.top,
                  styleLeft: menuPosition.left,
                  actualLayout: { x, y, width, height },
                  screenWidth: Dimensions.get('window').width,
                  screenHeight: Dimensions.get('window').height,
                });
              }}
            >
              {/* Paylaş */}
              <RNPressable 
                onPress={() => {
                  setIsMenuOpen(false);
                  handleShare();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? (isDark ? '#333333' : '#F5F5F5') : 'transparent' }
                ]}
              >
                <HStack alignItems="center" space="md">
                  <ArrowUpTrayIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$md"
                    fontWeight="$medium"
                  >
                    Paylaş
                  </Text>
                </HStack>
              </RNPressable>

              <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E9E9E9' }]} />

              {/* Sessize Al / Sessizliği Kaldır */}
              <RNPressable 
                onPress={() => {
                  if (!isMuting && !isUnmuting) {
                    setIsMenuOpen(false);
                    handleMute();
                  }
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  { 
                    backgroundColor: pressed ? (isDark ? '#333333' : '#F5F5F5') : 'transparent',
                    opacity: (isMuting || isUnmuting) ? 0.6 : 1,
                  }
                ]}
                disabled={isMuting || isUnmuting}
              >
                <HStack alignItems="center" space="md">
                  {userProfile?.isMuted ? (
                    <Box position="relative" justifyContent="center" alignItems="center">
                      <BellIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                      <Box
                        position="absolute"
                        width={24}
                        height={1}
                        bg={isDark ? '#FFFFFF' : '#000000'}
                        style={{
                          transform: [{ rotate: '-45deg' }],
                        }}
                      />
                    </Box>
                  ) : (
                    <BellSlashIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                  )}
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$md"
                    fontWeight="$medium"
                  >
                    {(isMuting || isUnmuting) 
                      ? (userProfile?.isMuted ? 'Sessizlik kaldırılıyor...' : 'Sessize alınıyor...')
                      : (userProfile?.isMuted ? 'Sessizliği Kaldır' : 'Sessize Al')}
                  </Text>
                </HStack>
              </RNPressable>

              <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E9E9E9' }]} />

              {/* Şikayet Et */}
              <RNPressable 
                onPress={() => {
                  setIsMenuOpen(false);
                  handleReport();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? (isDark ? '#333333' : '#F5F5F5') : 'transparent' }
                ]}
              >
                <HStack alignItems="center" space="md">
                  <FlagIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize="$md"
                    fontWeight="$medium"
                  >
                    Şikayet Et
                  </Text>
                </HStack>
              </RNPressable>

              <View style={[styles.divider, { backgroundColor: isDark ? '#333333' : '#E9E9E9' }]} />

              {/* Engelle */}
              <RNPressable 
                onPress={() => {
                  setIsMenuOpen(false);
                  handleBlock();
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? (isDark ? '#333333' : '#F5F5F5') : 'transparent' }
                ]}
              >
                <HStack alignItems="center" space="md">
                  <NoSymbolIcon width={20} height={20} color="#FF3040" />
                  <Text
                    color="#FF3040"
                    fontSize="$md"
                    fontWeight="$medium"
                  >
                    Engelle
                  </Text>
                </HStack>
              </RNPressable>
            </View>
          </RNPressable>
        </RNModal>
      )}

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
            marginBottom={safeAreaBottom + 24}
            maxHeight="80%"
          >
            <BadgeBottomSheet
              data={selectedBadge}
              onClose={handleCloseModal}
              hideFollowLadder={isOwnProfile}
              eventId="" // Profile badge'leri event'e bağlı değil
            />
          </ModalContent>
        ) : null}
      </Modal>
    </Box>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContent: {
    position: 'absolute',
    width: 200,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
