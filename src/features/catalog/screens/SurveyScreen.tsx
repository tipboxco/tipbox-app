import React, { useState, useMemo, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, HStack, Text, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CatalogStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { mock_survey_tabs } from '@/src/mock/catalog/brandSurveys';
import SurveyCard from '../components/SurveyCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import PostCard from '@/src/components/PostCards/PostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import EventCard, { type EventCardData } from '../components/EventCard';
import BrandInfoCard from '../components/BrandInfoCard';
import { useSafeAreaValues, toImageSource } from '@/src/utils';
import { useBrandSurveys, useBrandTrends, useBrandEvents } from '../api/hooks';
import type { Survey, BrandFeedPost, Event } from '../types';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { UpdatePost } from '@/src/mock/feed/types';
import type { UpdateCardData } from '@/src/types/UpdateCard';
import { ProductInfoType } from '@/src/types/common';
import { CardType } from '@/src/types/common';
import { navigationService } from '@/src/services/NavigationService';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';

type SurveyScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'SurveyScreen'>;
type SurveyScreenRouteProp = {
  key: string;
  name: string;
  params: {
    brandId: string;
  };
};

const SurveyScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SurveyScreenNavigationProp>();
  const route = useRoute<SurveyScreenRouteProp>();
  const brandId = route.params?.brandId;
  const [activeTab, setActiveTab] = useState('Anketler');
  const bottomInset = useSafeAreaValues('bottom');

  // Surveys API hook
  const {
    data: surveysData,
    fetchNextPage: fetchNextSurveysPage,
    hasNextPage: hasNextSurveysPage,
    isFetchingNextPage: isFetchingNextSurveysPage,
    isLoading: isSurveysLoading,
    error: surveysError,
  } = useBrandSurveys(brandId, 20);

  // Trends API hook
  const {
    data: trendsData,
    fetchNextPage: fetchNextTrendsPage,
    hasNextPage: hasNextTrendsPage,
    isFetchingNextPage: isFetchingNextTrendsPage,
    isLoading: isTrendsLoading,
    error: trendsError,
  } = useBrandTrends(brandId, 5);

  // Events API hook
  const {
    data: eventsData,
    fetchNextPage: fetchNextEventsPage,
    hasNextPage: hasNextEventsPage,
    isFetchingNextPage: isFetchingNextEventsPage,
    isLoading: isEventsLoading,
    error: eventsError,
  } = useBrandEvents(brandId, 20);

  const surveys = useMemo(() => {
    if (!surveysData?.pages) return [];
    const allItems = surveysData.pages.flatMap((page) => page.items ?? []);
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    return uniqueItems;
  }, [surveysData]);

  const trends = useMemo(() => {
    if (!trendsData?.pages) return [];
    const allItems = trendsData.pages.flatMap((page) => page.items ?? []);
    const uniqueItemsMap = new Map<string, BrandFeedPost>();
    for (const item of allItems) {
      if (!uniqueItemsMap.has(item.data.id)) {
        uniqueItemsMap.set(item.data.id, item);
      }
    }
    return Array.from(uniqueItemsMap.values());
  }, [trendsData]);

  const handleLoadMoreSurveys = useCallback(() => {
    if (hasNextSurveysPage && !isFetchingNextSurveysPage) {
      fetchNextSurveysPage();
    }
  }, [hasNextSurveysPage, isFetchingNextSurveysPage, fetchNextSurveysPage]);

  const handleLoadMoreTrends = useCallback(() => {
    if (hasNextTrendsPage && !isFetchingNextTrendsPage) {
      fetchNextTrendsPage();
    }
  }, [hasNextTrendsPage, isFetchingNextTrendsPage, fetchNextTrendsPage]);

  const handleLoadMoreEvents = useCallback(() => {
    if (hasNextEventsPage && !isFetchingNextEventsPage) {
      fetchNextEventsPage();
    }
  }, [hasNextEventsPage, isFetchingNextEventsPage, fetchNextEventsPage]);

  // Format date range from startDate and endDate
  const formatDateRange = useCallback((startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      
      const formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
      };

      return `${formatDate(start)} - ${formatDate(end)}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  }, []);

  // Map API event data to EventCard format
  const mapEventToCardData = useCallback((event: Event): EventCardData => {
    const imageSource = toImageSource(event.image);
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      dateRange: formatDateRange(event.startDate, event.endDate),
      status: event.status as 'joined' | 'join' | 'completed',
      image: imageSource || require('@/assets/events/banner.png'),
    };
  }, [formatDateRange]);

  const events = useMemo(() => {
    if (!eventsData?.pages) return [];
    const allItems = eventsData.pages.flatMap((page) => page.items ?? []);
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    return uniqueItems.map(mapEventToCardData);
  }, [eventsData, mapEventToCardData]);

  // Mapping functions for trends (similar to BrandDetailScreen)
  const mapBrandPostToPostCardData = useCallback((post: BrandFeedPost): PostCardData => {
    // Type guard: post type kontrolü
    if (post.type !== 'post') {
      throw new Error(`Expected post type, got ${post.type}`);
    }
    
    const postData = post.data as import('@/src/features/profile/types').ProfilePost;
    
    // Data validation: postData ve user kontrolü
    if (!postData || !postData.user) {
      console.warn('[mapBrandPostToPostCardData] Missing postData or user:', { post, postData });
      throw new Error('Missing required data: postData or user');
    }
    
    const avatarSource = toImageSource(postData.user.avatar);
    
    return {
      id: postData.id,
      user: {
        id: postData.user.id,
        name: postData.user.name,
        title: postData.user.title,
        avatar: avatarSource || require('@/assets/avatar/default-useravatar.png'),
      },
      content: typeof postData.content === 'string' ? postData.content : '',
      images: postData.images
        ?.map((img: string) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) || [],
      stats: {
        likes: postData.stats.likes,
        comments: postData.stats.comments,
        shares: postData.stats.shares,
        bookmarks: postData.stats.bookmarks,
      },
      createdAt: postData.createdAt,
      contextType: postData.contextType as import('@/src/types/common').ProductInfoType,
      contextData: postData.contextData ? {
        id: postData.contextData.id,
        name: postData.contextData.name,
        subName: postData.contextData.subName,
        image: postData.contextData.image,
        isOwned: postData.contextData.isOwned || false,
      } : undefined,
    };
  }, []);

  const mapExperienceToCardData = useCallback((item: BrandFeedPost): ReviewCardData => {
    // Type guard: experience type kontrolü
    if (item.type !== 'experience') {
      throw new Error(`Expected experience type, got ${item.type}`);
    }
    
    const postData = item.data as import('@/src/types/ReviewsCard').ReviewApiItem;
    
    // Data validation: postData kontrolü
    if (!postData || !postData.user) {
      console.warn('[mapExperienceToCardData] Missing postData or user:', { item, postData });
      throw new Error('Missing required data: postData or user');
    }
    
    const avatarSource = toImageSource(postData.user.avatar)!;
    const productImage = postData.contextData?.image
      ? toImageSource(postData.contextData.image)
      : undefined;

    // Content array'i map et - rating 0-100 arası, 0-5 arasına çevir (her 20 = 1 star)
    const content: ReviewCardContentItem[] = Array.isArray(postData.content) 
      ? postData.content.map((contentItem) => {
          // Rating 0-100 arası, 0-5 arasına çevir (örnek: 46 -> 2.3 -> 2, 68 -> 3.4 -> 3)
          const ratingValue = contentItem.rating || 0;
          const stars = Math.floor(ratingValue / 20); // 0-100 -> 0-5
          
          return {
            tag: {
              icon: 'tag' as const,
              title: contentItem.title || '',
            },
            text: contentItem.content || '',
            rating: Array(5)
              .fill(false)
              .map((_, index) => index < stars),
          };
        })
      : [];

    return {
      id: postData.id,
      user: {
        id: postData.user.id,
        name: postData.user.name,
        title: postData.user.title,
        avatar: avatarSource,
        action: 'wrote a review',
      },
      contextData: {
        id: postData.contextData?.id || '',
        name: postData.contextData?.name || '',
        subName: postData.contextData?.subName || '',
        image: productImage,
        isOwned: postData.contextData?.isOwned,
      },
      content,
      tags: postData.tags || [],
      images: postData.images
        ?.map((img: string) => toImageSource(img))
        .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
      stats: postData.stats,
      createdAt: postData.createdAt,
    };
  }, []);

  const mapBenchmarkToCardData = useCallback((item: BrandFeedPost): BenchmarkCardData => {
    // Type guard: benchmark type kontrolü
    if (item.type !== 'benchmark') {
      throw new Error(`Expected benchmark type, got ${item.type}`);
    }
    
    const postData = item.data as import('@/src/types/BenchmarkCard').BenchmarkApiItem;
    
    // Data validation: postData kontrolü
    if (!postData || !postData.user) {
      console.warn('[mapBenchmarkToCardData] Missing postData or user:', { item, postData });
      throw new Error('Missing required data: postData or user');
    }
    
    const avatarSource = toImageSource(postData.user.avatar)!;

    const products: BenchmarkProduct[] = (postData.products || []).map((p) => ({
      id: p.id,
      name: p.name,
      subName: p.subName,
      image: toImageSource(p.image)!,
      isOwned: p.isOwned,
      choice: p.choice,
    }));

    return {
      id: postData.id,
      user: {
        id: postData.user.id,
        name: postData.user.name,
        title: postData.user.title,
        avatar: avatarSource,
      },
      products,
      content: typeof postData.content === 'string' ? postData.content : '',
      stats: postData.stats,
      createdAt: postData.createdAt,
    };
  }, []);

  const mapTipsToCardData = useCallback((item: BrandFeedPost): TipsCardData => {
    // Type guard: tipsAndTricks type kontrolü
    if (item.type !== 'tipsAndTricks') {
      throw new Error(`Expected tipsAndTricks type, got ${item.type}`);
    }
    
    const postData = item.data as import('@/src/types/TipsAndTricksCard').TipsApiItem;
    
    // Data validation: postData ve contextData kontrolü
    if (!postData || !postData.contextData) {
      // Missing data warning removed for performance
      throw new Error('Missing required data: postData or contextData');
    }
    
    const avatarSource = toImageSource(postData.user?.avatar)!;

    const product: TipsProduct = {
      id: postData.contextData.id || '',
      name: postData.contextData.name || '',
      subName: postData.contextData.subName || '',
      image: toImageSource(postData.contextData.image)!,
    };

    const category: TipsCategory = {
      id: postData.contextData.id || '',
      name: postData.contextData.name || '',
      subCategory: postData.contextData.subName || '',
      image: toImageSource(postData.contextData.image)!,
      product,
    };

    return {
      id: postData.id,
      user: {
        id: postData.user.id,
        name: postData.user.name,
        title: postData.user.title,
        avatar: avatarSource,
      },
      category,
      content: typeof postData.content === 'string' ? postData.content : '',
      images: postData.images
        ?.map((img: string) => toImageSource(img))
        .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource),
      stats: postData.stats,
      tag: postData.tag,
      createdAt: postData.createdAt,
    };
  }, []);

  const mapQuestionToCardData = useCallback((item: BrandFeedPost): QuestionCardData => {
    // Type guard: question type kontrolü
    if (item.type !== 'question') {
      throw new Error(`Expected question type, got ${item.type}`);
    }
    
    const postData = item.data as import('@/src/types/QuestionCard').QuestionApiItem;
    
    // Data validation: postData ve contextData kontrolü
    if (!postData || !postData.contextData) {
      // Missing data warning removed for performance
      throw new Error('Missing required data: postData or contextData');
    }
    
    const avatarSource = toImageSource(postData.user?.avatar)!;

    const product: QuestionCardProduct = {
      id: postData.contextData.id || '',
      name: postData.contextData.name || '',
      subName: postData.contextData.subName || '',
      image: toImageSource(postData.contextData.image)!,
    };

    const category: QuestionCardCategory = {
      id: postData.contextData.id || '',
      name: postData.contextData.name || '',
      subCategory: postData.contextData.subName || '',
      image: toImageSource(postData.contextData.image)!,
      product,
    };

    // images array'i boşsa veya görseller yüklenemediyse default görsel ekle
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const mappedImages = postData.images
      ?.map((img: string) => toImageSource(img))
      .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
    const images = mappedImages.length > 0 ? mappedImages : [defaultPostImage];

    return {
      id: postData.id,
      user: {
        id: postData.user.id,
        name: postData.user.name,
        title: postData.user.title,
        avatar: avatarSource,
      },
      category,
      content: typeof postData.content === 'string' ? postData.content : '',
      isBoosted: postData.isBoosted,
      images,
      stats: postData.stats,
      createdAt: postData.createdAt,
    };
  }, []);

  const mapUpdateToCardData = useCallback((item: BrandFeedPost): UpdateCardData => {
    // Type guard: update type kontrolü
    if (item.type !== 'update') {
      throw new Error(`Expected update type, got ${item.type}`);
    }
    
    const postData = item.data as import('@/src/features/catalog/types').BrandUpdateApiItem;
    
    // Data validation: postData kontrolü
    if (!postData) {
      console.warn('[mapUpdateToCardData] Missing postData:', { item });
      throw new Error('Missing required data: postData');
    }
    
    const avatarSource = toImageSource(postData.user?.avatar);

    // Update type'ında content array olabilir, string'e çevir
    let contentString = '';
    if (Array.isArray(postData.content)) {
      // Content array'inden string oluştur
      contentString = postData.content.map((c: any) => 
        typeof c === 'string' ? c : (c.content || '')
      ).join(' ');
    } else if (typeof postData.content === 'string') {
      contentString = postData.content;
    }

    // Product bilgisini al (product veya contextData'dan)
    const productData = postData.product || postData.contextData;
    
    // contextType'ı ProductInfoType'a çevir (BrandUpdateApiItem'da contextType yoksa default 'product')
    let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
    if (postData.contextType === 'product_group') {
      productInfoType = ProductInfoType.PRODUCT_GROUP;
    } else if (postData.contextType === 'sub_category') {
      productInfoType = ProductInfoType.SUB_CATEGORY;
    }

    // RelatedPost için content array'ini map et
    const relatedPostContent = Array.isArray(postData.content) && postData.content.length > 0
      ? postData.content
          .filter((c: any) => c != null) // null/undefined items'ları filtrele
          .map((c: any) => {
            // Rating 0-100 arası, 0-5 arasına çevir
            const ratingValue = typeof c === 'object' && c.rating ? c.rating : 0;
            const stars = Math.floor(ratingValue / 20);
            
            return {
              tag: {
                icon: 'tag',
                title: (typeof c === 'object' && c.title) ? c.title : 'Update',
              },
              text: typeof c === 'string' ? c : (c.content || ''),
              rating: Array(5)
                .fill(0)
                .map((_, index) => index < stars ? 1 : 0), // number[] formatına çevir
            };
          })
      : [];

    // relatedPost için id gerekli (postData.id kullanılabilir)
    const relatedPostId = postData.id || '';

    // Product data için isOwned kontrolü (BrandUpdateApiItem'da isOwned yok)
    const productIsOwned = (productData as any)?.isOwned || false;

    // relatedPost oluştur (sadece relatedPostContent varsa)
    const relatedPost = (relatedPostContent.length > 0 && productData) ? {
      id: relatedPostId,
      product: {
        id: productData.id || '',
        name: productData.name || '',
        subName: productData.subName || '',
        image: toImageSource(productData.image) || require('@/assets/product/product_01.png'),
        isOwned: productIsOwned,
      },
      content: relatedPostContent,
      tags: postData.tags || [],
      images: postData.images
        ?.map((img: string) => toImageSource(img))
        .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) || [],
    } : undefined;

    return {
      id: postData.id,
      user: {
        id: postData.user?.id || '',
        name: postData.user?.name || '',
        title: postData.user?.title || '',
        avatar: avatarSource || require('@/assets/avatar/default-useravatar.png'),
      },
      contextType: productInfoType,
      product: productData ? {
        id: productData.id || '',
        name: productData.name || '',
        subName: productData.subName || '',
        image: toImageSource(productData.image) || require('@/assets/product/product_01.png'),
        isOwned: productIsOwned,
      } : {
        id: '',
        name: '',
        subName: '',
        image: require('@/assets/product/product_01.png'),
        isOwned: false,
      },
      content: contentString,
      images: postData.images
        ?.map((img: string) => toImageSource(img))
        .filter((imgSource: any): imgSource is NonNullable<typeof imgSource> => !!imgSource) || [],
      stats: postData.stats || {
        likes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
      },
      createdAt: postData.createdAt || '',
      relatedPost, // Optional olarak ekle
    };
  }, []);

  // Render feed item based on type
  const renderTrendItem = useCallback((item: BrandFeedPost) => {
    // Data validation: item ve item.data kontrolü
    if (!item || !item.data) {
      console.warn('[renderTrendItem] Missing item or item.data:', { item });
      return null;
    }
    
    switch (item.type) {
      case CardType.EXPERIENCE:
      case 'experience':
        // Type guard: content array kontrolü
        if ('content' in item.data && Array.isArray(item.data.content)) {
          return (
            <ExperiencePostCard
              data={mapExperienceToCardData(item)}
            />
          );
        }
        return null;
      case CardType.POST:
      case 'post':
        return (
          <PostCard
            data={mapBrandPostToPostCardData(item)}
          />
        );
      case CardType.BENCHMARK:
      case 'benchmark':
        return (
          <BenchmarkPostCard
            data={mapBenchmarkToCardData(item)}
          />
        );
      case CardType.QUESTION:
      case 'question':
        // Type guard: question type özellikleri kontrolü
        if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
          return (
            <QuestionPostCard
              data={mapQuestionToCardData(item)}
            />
          );
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
      case 'tipsAndTricks':
        return (
          <TipsAndTricksPostCard
            data={mapTipsToCardData(item)}
          />
        );
      case CardType.UPDATE:
      case 'update':
        return (
          <UpdatePostCard
            data={mapUpdateToCardData(item)}
          />
        );
      default:
        console.warn(`[renderTrendItem] Unknown item type: ${item.type}`);
        return null;
    }
  }, [mapBrandPostToPostCardData, mapExperienceToCardData, mapBenchmarkToCardData, mapQuestionToCardData, mapTipsToCardData, mapUpdateToCardData]);

  const renderSurveyItem = useCallback(({ item }: { item: Survey }) => {
    return (
      <SurveyCard
        survey={item}
        onPress={() => console.log('Survey action:', item.status)}
      />
    );
  }, []);

  const renderSurveyFooter = useCallback(() => {
    if (!isFetchingNextSurveysPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextSurveysPage, isDark]);

  const renderTrendsFooter = useCallback(() => {
    if (!isFetchingNextTrendsPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextTrendsPage, isDark]);

  const renderEventsFooter = useCallback(() => {
    if (!isFetchingNextEventsPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextEventsPage, isDark]);

  const renderContent = () => {
    switch (activeTab) {
      case 'Trendler':
        if (isTrendsLoading && !trendsData) {
          return (
            <VStack py={20} alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
                Trendler yükleniyor...
              </Text>
            </VStack>
          );
        }

        if (trendsError) {
          return (
            <VStack py={20} alignItems="center">
              <Text color="#CE4A4A" fontSize="$sm">
                Trendler yüklenirken bir hata oluştu: {trendsError.message}
              </Text>
            </VStack>
          );
        }

        if (trends.length === 0) {
          return (
            <VStack py={20} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                No trending content found yet.
              </Text>
            </VStack>
          );
        }

        return (
          <FlatList
            data={trends}
            renderItem={({ item }) => {
              const rendered = renderTrendItem(item);
              return rendered;
            }}
            keyExtractor={(item) => item.data.id}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: bottomInset,
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMoreTrends}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderTrendsFooter}
            removeClippedSubviews={true}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            updateCellsBatchingPeriod={50}
          />
        );
      
      case 'Etkinlikler':
        if (isEventsLoading && !eventsData) {
          return (
            <VStack py={20} alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
                Etkinlikler yükleniyor...
              </Text>
            </VStack>
          );
        }

        if (eventsError) {
          return (
            <VStack py={20} alignItems="center">
              <Text color="#CE4A4A" fontSize="$sm">
                Etkinlikler yüklenirken bir hata oluştu: {eventsError.message}
              </Text>
            </VStack>
          );
        }

        if (events.length === 0) {
          return (
            <VStack py={20} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                Henüz etkinlik bulunmuyor.
              </Text>
            </VStack>
          );
        }

        return (
          <FlatList
            data={events}
            renderItem={({ item }) => (
              <EventCard
                event={item}
                onPress={() => {
                  // EventDetailScreen'e yönlendir (Events tab'ı içinde)
                  navigationService.navigateNested(TAB_ROUTES.EVENTS, 'EventDetail', { eventId: item.id });
                }}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: bottomInset,
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMoreEvents}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderEventsFooter}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
          />
        );
      
      case 'Anketler':
      default:
        if (isSurveysLoading && !surveysData) {
          return (
            <VStack py={20} alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
                Anketler yükleniyor...
              </Text>
            </VStack>
          );
        }

        if (surveysError) {
          return (
            <VStack py={20} alignItems="center">
              <Text color="#CE4A4A" fontSize="$sm">
                Anketler yüklenirken bir hata oluştu: {surveysError.message}
              </Text>
            </VStack>
          );
        }

        if (surveys.length === 0) {
          return (
            <VStack py={20} alignItems="center">
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
                No surveys yet.
              </Text>
            </VStack>
          );
        }

        return (
          <FlatList
            data={surveys}
            renderItem={renderSurveyItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingTop: 8,
              paddingBottom: bottomInset,
            }}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMoreSurveys}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderSurveyFooter}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
          />
        );
    }
  };


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        {/* Header */}
        <Header
          title="Anketler & Oyunlaştırmalar"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        {/* Tab Bar */}
        <VStack pt='$4' bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
          <HStack borderBottomWidth={1} borderColor="#E9E9E9">
            {mock_survey_tabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.name)}
                flex={1}
                alignItems="center"
                pb="$1"
                position="relative"
              >
                <VStack alignItems="center" space="xs">
                  <Text
                    color={activeTab === tab.name ? (isDark ? '#FFFFFF' : '#000000') : '#8C8C8C'}
                    fontSize={12}
                    fontWeight="$bold"
                  >
                    {tab.name}
                  </Text>
                </VStack>
                <Box
                  position="absolute"
                  bottom={-1}
                  left="25%"
                  height={2}
                  width="50%"
                  borderRadius={999}
                  bg={activeTab === tab.name ? (isDark ? '#FFFFFF' : '#000000') : 'transparent'}
                />
              </Pressable>
            ))}
          </HStack>
        </VStack>

        {/* Content */}
        <VStack flex={1}>
          <VStack space="md" p="$4" pb={0}>
            {/* Top Cards */}
            <BrandInfoCard
              onNotificationPress={() => console.log('Notification pressed')}
              onHistoryPress={() => {
                const brandId = route.params?.brandId;
                if (brandId) {
                  navigation.navigate('BrandHistoryScreen', { brandId });
                }
              }}
            />
          </VStack>
          <Box flex={1} px="$4">
            {renderContent()}
          </Box>
        </VStack>
      </VStack>
    </SafeAreaView>
  );
};

export default SurveyScreen;
