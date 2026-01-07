import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, HStack, VStack, Image } from '@gluestack-ui/themed';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserProfile, useUserPosts, useUserReviews, useUserBenchmarks, useUserTipsAndTricks, useUserReplies, useAddToTrustList, useRemoveFromTrustList, useReportUser } from '../api/hooks';
import { useSendGift, useCreateSupportRequest, useSendDirectMessage } from '@/src/features/inbox/api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { Share } from 'react-native';
import { useAppStore } from '@/src/store/appStore';
import { ProfileStackParamList } from '../navigation';
import { toImageSource, useSafeAreaValues, useBottomOffset } from '@/src/utils';
import { CardType } from '@/src/types/common';
import type { PostCardData } from '@/src/types/PostCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ProfilePost, ProfileReview } from '../types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import PostCard from '@/src/components/PostCards/PostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { LadderTab } from '../components/TabContents';
import { Feather } from '@expo/vector-icons';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  return {
    id: post.id,
    user: {
      id: post.user.id,
      name: post.user.name || '',
      title: post.user.title || '',
      avatar: toImageSource(post.user.avatar)!,
    },
    content: contentString,
    images:
      post.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
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
          image: contextImage || post.contextData.image,
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
    : require('@/assets/avatar/ozan.png');
  
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
  
  const avatarSource = toImageSource(item.user.avatar)!;
  const products: BenchmarkProduct[] = (item?.products || []).map((p) => ({
    id: p?.id || '',
    name: p?.name || '',
    subName: p?.subName || '',
    image: toImageSource(p?.image)!,
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
  
  const avatarSource = toImageSource(item?.user?.avatar)!;
  const product: TipsProduct = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subName: item.contextData.subName || '',
    image: toImageSource(item.contextData.image)!,
  };
  const category: TipsCategory = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subCategory: item.contextData.subName || '',
    image: toImageSource(item.contextData.image)!,
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
  
  const avatarSource = toImageSource(item?.user?.avatar)!;
  const product: QuestionCardProduct = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subName: item.contextData.subName || '',
    image: toImageSource(item.contextData.image)!,
  };
  const category: QuestionCardCategory = {
    id: item.contextData.id,
    name: item.contextData.name || '',
    subCategory: item.contextData.subName || '',
    image: toImageSource(item.contextData.image)!,
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
    isBoosted: item.isBoosted,
    images: item.images
      ?.map((img) => toImageSource(img))
      .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource),
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

// List item type
type ListItem = 
  | { type: 'TAB_BAR' }
  | { type: 'POST'; id: string; data: MappedPost }
  | { type: 'LADDER_CONTENT' };

// TabsBar Component
interface TabsBarProps {
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  isDark: boolean;
}

const TabsBar: React.FC<TabsBarProps> = ({ activeTab, onChangeTab, isDark }) => {
  return (
    <Box
      mb={16}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderBottomColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <HStack space="xs" py={12}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => onChangeTab(tab.key)}
                alignItems="center"
                justifyContent="center"
                pb="$1"
                position="relative"
                minWidth={75}
                flexShrink={0}
                mr={8}
              >
                <Text
                  textAlign="center"
                  fontSize={12}
                  fontWeight={isActive ? '$bold' : '$normal'}
                  color={isActive ? (isDark ? '#FFFFFF' : '#000000') : '#A3A3A3'}
                  numberOfLines={1}
                  flexShrink={0}
                >
                  {tab.title}
                </Text>
                {isActive && (
                  <Box
                    position="absolute"
                    bottom={-1}
                    left="15%"
                    height={2}
                    width="70%"
                    borderRadius={999}
                    bg={isDark ? '#FFFFFF' : '#000000'}
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

const ProfileScreen = ({ route }: ProfileScreenProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAppStore();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const rootNavigation = useNavigation<any>();
  const safeAreaTop = useSafeAreaValues('top');
  const safeAreaBottom = useSafeAreaValues('bottom');
  const insets = useSafeAreaInsets();
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Bottom padding for FlatList content
  const bottomPadding = useBottomOffset({ includeTabBar: true, extraPadding: 16 });
  
  // Route params'tan userId al, yoksa store'daki user.id'yi kullan
  const routeUserId = route.params?.userId;
  const targetUserId = routeUserId || user?.id;
  
  // Profile API hook
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(targetUserId);
  
  // Trust mutations
  const { mutate: trustUser, isPending: isTrusting } = useAddToTrustList();
  const { mutate: untrustUser, isPending: isUntrusting } = useRemoveFromTrustList();
  
  // Inbox mutations
  const sendGiftMutation = useSendGift();
  const createSupportRequestMutation = useCreateSupportRequest();
  const sendDirectMessageMutation = useSendDirectMessage();
  
  // Report mutation
  const { mutate: reportUser, isPending: isReporting } = useReportUser();
  
  // Kullanıcının kendi profiline bakıp bakmadığını kontrol et
  const isOwnProfile = user?.id === targetUserId;
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const listRef = useRef<FlashList<ListItem>>(null);
  
  // API hooks for each tab
  // PERFORMANCE FIX: Only enable queries for the active tab to prevent unnecessary API calls
  // This reduces network overhead and improves performance when switching tabs
  const feedQuery = useUserPosts(targetUserId, 5, { enabled: activeTab === 'feed' });
  const reviewsQuery = useUserReviews(targetUserId, 5, { enabled: activeTab === 'reviews' });
  const benchmarksQuery = useUserBenchmarks(targetUserId, 5, { enabled: activeTab === 'benchmarks' });
  const tipsQuery = useUserTipsAndTricks(targetUserId, 5, { enabled: activeTab === 'tips' });
  const repliesQuery = useUserReplies(targetUserId, 5, { enabled: activeTab === 'replies' });
  
  // Get active tab query
  const activeTabQuery = useMemo(() => {
    switch (activeTab) {
      case 'feed': return feedQuery;
      case 'reviews': return reviewsQuery;
      case 'benchmarks': return benchmarksQuery;
      case 'tips': return tipsQuery;
      case 'replies': return repliesQuery;
      default: return feedQuery;
    }
  }, [activeTab, feedQuery, reviewsQuery, benchmarksQuery, tipsQuery, repliesQuery]);
  
  // Flatten and map posts based on active tab
  const mappedPosts = useMemo(() => {
    if (!activeTabQuery.data?.pages) return [];
    
    const allItems = activeTabQuery.data.pages.flatMap((page) => page?.items ?? []) ?? [];
    const validItems = allItems.filter((item) => item?.id);
    const uniqueItems = validItems.filter((item, index, self) => 
      index === self.findIndex((t) => t?.id === item?.id)
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
  }, [activeTabQuery.data]);
  
  // FlatList data: [TAB_BAR, ...posts] veya [TAB_BAR, LADDER_CONTENT]
  const listData = useMemo<ListItem[]>(() => {
    if (activeTab === 'ladders') {
      return [
        { type: 'TAB_BAR' },
        { type: 'LADDER_CONTENT' },
      ];
    }
    return [
      { type: 'TAB_BAR' },
      ...mappedPosts.map((post) => ({ type: 'POST' as const, id: post.id, data: post })),
    ];
  }, [mappedPosts, activeTab]);
  
  // Render item
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'TAB_BAR') {
      return (
        <TabsBar
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            // TAB_BAR zaten sticky olduğu için scroll yapmaya gerek yok
          }}
          isDark={isDark}
        />
      );
    }
    
    // Render LadderTab content
    if (item.type === 'LADDER_CONTENT') {
      return <LadderTab />;
    }
    
    // Render post card
    if (item.type !== 'POST') return null;
    const postData = item.data;
    
    // Post card'ları padding ile sarmala
    const renderPostCard = () => {
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
    };
    
    return (
      <Box px={16}>
        {renderPostCard()}
      </Box>
    );
  }, [activeTab, isDark, listData]);
  
  // Key extractor
  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.type === 'TAB_BAR') {
      return 'tab-bar';
    }
    if (item.type === 'LADDER_CONTENT') {
      return 'ladder-content';
    }
    return item.id || `post-${index}`;
  }, []);
  
  // Action button handlers
  const handleSendTIPS = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et (TIPS gönderme için)
    navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handle1on1Request = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et (1-on-1 request için)
    navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handleDM = useCallback(() => {
    if (!user?.id || !targetUserId) return;
    // MessageDetail screen'ine navigate et
    navigationService.navigate(ROOT_ROUTES.MESSAGE_DETAIL, {
      messageId: targetUserId,
      threadId: targetUserId,
      recipientUserId: targetUserId,
    });
  }, [user?.id, targetUserId]);

  const handleShare = useCallback(async () => {
    if (!userProfile) return;
    try {
      await Share.share({
        message: `Check out ${userProfile.name}'s profile on Tipbox!`,
        url: `tipboxapp://profile/user/${targetUserId}`,
      });
      setShowActionSheet(false);
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
                description: 'Kullanıcı raporlandı',
              },
            });
            setShowActionSheet(false);
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
            console.log('[ProfileScreen] Block user:', targetUserId);
            setShowActionSheet(false);
            // Navigate back after blocking
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  }, [targetUserId, navigation]);
  
  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (activeTabQuery.hasNextPage && !activeTabQuery.isFetchingNextPage) {
      activeTabQuery.fetchNextPage();
    }
  }, [activeTabQuery]);
  
  // ListHeaderComponent: Banner + Profile Info
  const renderProfileHeader = useCallback(() => {
    if (!userProfile) return null;
    
    return (
      <Box bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Banner */}
        <Box 
          h={140} 
          overflow="hidden" 
          position="relative"
        >
          <Image
            source={toImageSource(userProfile.bannerUrl) || require('@/assets/banner/banner_01.png')}
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
          
          {/* Banner Controls */}
          <Box
            position="absolute"
            top={36}
            left={0}
            right={0}
            flexDirection="row"
            justifyContent="space-between"
            alignItems="flex-start"
            px={16}
            pointerEvents="box-none"
            zIndex={2000}
          >
            <Pressable
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  rootNavigation.navigate('Main' as never);
                }
              }}
              style={{ zIndex: 2000 }}
            >
              <Feather name="chevron-left" size={24} color="#fff" />
            </Pressable>

            <Pressable
              onPress={() => {
                if (isOwnProfile) {
                  rootNavigation.navigate('Settings' as never);
                } else {
                  handleOpenActionSheet();
                }
              }}
              style={{ zIndex: 2000 }}
            >
              <Feather name="more-vertical" size={24} color="#fff" />
            </Pressable>
          </Box>
        </Box>

        {/* Profile Image and Action Buttons Row */}
        <Box px={15} mt={-20}>
          <HStack alignItems="flex-start" justifyContent="space-between" space="md">
            {/* Profile Image */}
            <Box 
              borderRadius={100}
              overflow="hidden"
              w={68}
              h={68}
              borderWidth={2}
              borderColor="$white"
              flexShrink={0}
            >
              <Image
                source={toImageSource(userProfile.avatar) || require('@/assets/avatar/ozan.png')}
                alt={userProfile.name}
                w="100%"
                h="100%"
              />
            </Box>

            {/* Action Buttons */}
            <HStack space="sm" alignItems="center" flexShrink={0} mt={32}>
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
                  <Feather name="edit-2" size={14} color="#000" />
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
                    w={30}
                    h={30}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleSendTIPS}
                  >
                    <Feather name="gift" size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={30}
                    h={30}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handle1on1Request}
                  >
                    <Feather name="headphones" size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={30}
                    h={30}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={handleDM}
                  >
                    <Feather name="message-circle" size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    w={30}
                    h={30}
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    justifyContent="center"
                    alignItems="center"
                    onPress={() => {
                      console.log('[ProfileScreen] Notification pressed');
                    }}
                  >
                    <Feather name="bell" size={14} color="#000" />
                  </Pressable>
                  
                  <Pressable
                    bg="#F7F7F7"
                    borderRadius={200}
                    borderWidth={1}
                    borderColor="#E9E9E9"
                    px={12}
                    py={8}
                    flexDirection="row"
                    alignItems="center"
                    gap={2}
                    onPress={() => {
                      if (!targetUserId) return;
                      if (userProfile.isTrusted) {
                        untrustUser(targetUserId);
                      } else {
                        trustUser(targetUserId);
                      }
                    }}
                    disabled={isTrusting || isUntrusting}
                    opacity={(isTrusting || isUntrusting) ? 0.6 : 1}
                  >
                    <Feather
                      name={userProfile.isTrusted ? "user-minus" : "user-plus"}
                      size={14}
                      color="#000"
                    />
                    <Text
                      color="#000"
                      fontSize={10}
                      fontWeight="$semibold"
                    >
                      {isTrusting ? "Ekleniyor..." : isUntrusting ? "Kaldırılıyor..." : (userProfile.isTrusted ? "Un Trust" : "Trust")}
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
            fontSize={14}
            fontWeight="$bold"
          >
            {userProfile.name}
          </Text>

          {userProfile.biography && (
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
              lineHeight={15}
              mt={2}
            >
              {userProfile.biography}
            </Text>
          )}

          {/* Stats */}
          <HStack space="xs" mt={10}>
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize={10}
              fontWeight="$bold"
            >
              {userProfile.stats.posts}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
            >
              Posts
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
            >
              {" "}•{" "}
            </Text>
            <Pressable
              onPress={() => {
                if (targetUserId) {
                  console.log('[ProfileScreen] Navigating to TrustList with userId:', targetUserId, 'initialTab: trust');
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
                  fontSize={10}
                  fontWeight="$bold"
                >
                  {userProfile.stats.trust}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize={10}
                >
                  Trust
                </Text>
              </HStack>
            </Pressable>
            <Text
              color={isDark ? '$textDark400' : '$textLight600'}
              fontSize={10}
            >
              {" "}•{" "}
            </Text>
            <Pressable
              onPress={() => {
                if (targetUserId) {
                  console.log('[ProfileScreen] Navigating to TrustList with userId:', targetUserId, 'initialTab: truster');
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
                  fontSize={10}
                  fontWeight="$bold"
                >
                  {userProfile.stats.truster > 999 ? `${Math.floor(userProfile.stats.truster / 1000)}K` : userProfile.stats.truster}
                </Text>
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize={10}
                >
                  Truster
                </Text>
              </HStack>
            </Pressable>
          </HStack>
        </Box>

        {/* Inventory Header */}
        <Box mt={20} px={15}>
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
              onPress={() => {
                navigation.navigate('InventoryList', {
                  userId: userProfile.id,
                });
              }}
            >
              <Text
                color="$white"
                fontSize={10}
                fontWeight="$semibold"
                textAlign="center"
              >
                {userProfile.name}'s Inventory
              </Text>
            </Pressable>
          </Box>
        </Box>

        {/* Badge Items */}
        {userProfile.badges && userProfile.badges.length > 0 && (
          <Box mt={6} px={15}>
            <Box
              borderRadius={5}
              p={14}
              h={130}
            >
              <HStack space="md" justifyContent="space-between">
                {userProfile.badges.slice(0, 4).map((badge) => (
                  <VStack key={badge.id} space="xs" alignItems="center">
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
                        source={toImageSource(badge.image) || require('@/assets/badges/badge_01.png')}
                        alt={badge.title}
                        w={60}
                        h={60}
                        resizeMode="contain"
                      />
                    </Box>
                    <Text
                      color={isDark ? '$textDark400' : '#000000'}
                      fontSize={8}
                      fontWeight="$bold"
                      textAlign="center"
                    >
                      {badge.title}
                    </Text>
                  </VStack>
                ))}
              </HStack>
              <Pressable
                onPress={() => {
                  navigation.navigate('Collections');
                }}
              >
                <Text
                  color={isDark ? '$textDark400' : '$textLight600'}
                  fontSize={8}
                  textAlign="center"
                  mt="$4"
                  fontWeight="$regular"
                >
                  See More Collections
                </Text>
              </Pressable>
            </Box>
          </Box>
        )}
      </Box>
    );
  }, [userProfile, isDark, isOwnProfile, targetUserId, trustUser, untrustUser, isTrusting, isUntrusting, rootNavigation, user, navigation, handleShare]);
  
  if (isProfileLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
      </SafeAreaView>
    );
  }
  
  if (profileError || !userProfile) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} justifyContent="center" alignItems="center" px={20}>
          <Text color="#CE4A4A" fontSize="$sm">
            {profileError?.message || 'Profil yüklenirken bir hata oluştu'}
          </Text>
        </Box>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <FlashList
          ref={listRef}
          data={listData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={renderProfileHeader}
          estimatedItemSize={400} // PERFORMANCE FIX: Critical for FlashList performance
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            activeTabQuery.isFetchingNextPage ? (
              <Box py={20} alignItems="center">
                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
              </Box>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          // FlashList automatically handles removeClippedSubviews, initialNumToRender, maxToRenderPerBatch, windowSize
          // These props are not needed for FlashList
        />
      </Box>
    </SafeAreaView>
  );
};

export default ProfileScreen;
