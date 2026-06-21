import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from '@/src/components/ui';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFeed, useFeedFiltered } from '../api/hooks';
import { getFeed, getFilteredFeed } from '../api/feedApi';
import type { FeedApiItem, FeedFilterParams } from '../api/feedApi';
import { CardType, ProductInfoType } from '@/src/types/common';
import { toImageSource, isSameImageSource } from '@/src/utils';
import { ScrollRegistry } from '@/src/services/ScrollRegistry';
import { useQueryClient } from '@tanstack/react-query';
import { feedKeys } from '../api/hooks';
import { FeedSkeleton } from '@/src/components/Skeletons';
import { FeedEmptyCta } from './FeedEmptyCta';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import type { ProfilePost } from '@/src/features/profile/types';
import type { BenchmarkApiItem, BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsApiItem, TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem, QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ExperiencePostApiItem, ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import type { PostCardData } from '@/src/types/PostCard';

interface FeedTabListProps {
  filterParams?: FeedFilterParams;
  tabKey: string;
  enabled?: boolean;
  /** Triggers the post-create flow when the feed is empty */
  onCreatePress?: () => void;
}

const FeedTabListComponent: React.FC<FeedTabListProps> = ({ filterParams, tabKey, enabled = true, onCreatePress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('feed');
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const [lastSeenPostId, setLastSeenPostId] = useState<string | undefined>(undefined);

  const hasFilters = !!filterParams && Object.keys(filterParams).length > 0;
  const normalFeedQuery = useFeed(10);
  const filteredFeedQuery = useFeedFiltered(10, filterParams, undefined, undefined, hasFilters && enabled);
  const feedQuery = hasFilters ? filteredFeedQuery : normalFeedQuery;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch, isRefetching } = feedQuery;

  const feedItems = useMemo(() => {
    if (!data?.pages || !Array.isArray(data.pages)) return [];
    const uniqueItemsMap = new Map<string, FeedApiItem>();
    for (const page of data.pages) {
      if (!page || typeof page !== 'object' || !('items' in page)) continue;
      const pageItems = page.items;
      if (!Array.isArray(pageItems)) continue;
      for (const item of pageItems) {
        if (!item || typeof item !== 'object' || !('data' in item)) continue;
        const itemData = item.data;
        if (itemData && typeof itemData === 'object' && 'id' in itemData && itemData.id) {
          uniqueItemsMap.set(String(itemData.id), item);
        }
      }
    }
    return Array.from(uniqueItemsMap.values());
  }, [data?.pages]);

  useEffect(() => {
    if (feedItems.length > 0) {
      const lastItem = feedItems[feedItems.length - 1];
      if (lastItem?.data?.id) {
        setLastSeenPostId(String(lastItem.data.id));
      }
    }
  }, [feedItems.length]);

  // ---- Mapping functions (need t() for translations) ----

  const mapFeedToCardData = useCallback((item: ProfilePost): PostCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const contentString = Array.isArray(item.content)
      ? item.content.filter((c) => c != null).map((c) => c?.content || '').join(' ')
      : (item.content || '');
    const mappedImages = Array.isArray(item.images)
      ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
      : [];
    const contextImage = item.contextData?.image
      ? (toImageSource(item.contextData.image) || defaultPostImage)
      : defaultPostImage;
    const contextData = item.contextData ? { ...item.contextData, image: contextImage } : undefined;
    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png'),
      },
      content: contentString,
      images: mappedImages,
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: item.contextType,
      contextData,
    };
  }, []);

  const mapExperienceToCardData = useCallback((item: ExperiencePostApiItem & { type: 'experience' }): ExperiencePostCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const defaultAvatar = require('@/assets/avatar/default-useravatar.png');
    const avatarSource = toImageSource(item.user?.avatar) || defaultAvatar;
    const ctx = item.contextData as { product?: { id?: string; name?: string; image?: string | null; subName?: string; isOwned?: boolean } } | undefined;
    const rawProduct = ctx?.product ?? item.contextData ?? item.product;
    const productImage = rawProduct?.image ? toImageSource(rawProduct.image) : defaultPostImage;
    const contentBlocks = item.experienceContent ?? (Array.isArray(item.content) ? item.content : []);
    const titleTranslations: Record<string, string> = {
      'Price and Shopping Experience': t('post:create.experience.step3.priceAndShopping'),
      'Product and Usage Experience': t('post:create.experience.step3.productAndUsage'),
    };
    const content: ExperiencePostCardContentItem[] = Array.isArray(contentBlocks)
      ? contentBlocks.filter((c) => c != null).map((c) => {
          const rawTitle = c?.title || '';
          const title = titleTranslations[rawTitle] || rawTitle;
          const icon: 'tag' | 'package' = (rawTitle.toLowerCase().includes('product') || rawTitle.toLowerCase().includes('usage')) ? 'package' : 'tag';
          return { tag: { icon, title }, text: c?.content || '', rating: Array(5).fill(false).map((_, i) => i < (c?.rating || 0)) };
        })
      : [];
    const mappedImages = Array.isArray(item.images)
      ? item.images.map((img) => toImageSource(img)).filter((i): i is NonNullable<typeof i> => !!i)
      : [];
    const images = mappedImages.filter((img) => !isSameImageSource(img, productImage));
    const isOwned = item.status === 'own' || rawProduct?.isOwned || false;
    const subNameRaw = rawProduct?.subName ?? '';
    const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
    const translateTag = (tag: string) => {
      const key = `post:create.experience.step1.optionNames.${tag}`;
      const translated = t(key);
      return translated === key ? tag : translated;
    };
    const tagsFromApi = Array.isArray(item.tags) ? item.tags : [];
    const rawTags = tagsFromApi.length >= 3 ? tagsFromApi : [item.durationName, item.locationName, item.purposeName].filter((s): s is string => !!s);
    const tags = rawTags.map(translateTag);
    return {
      id: item.id || '',
      user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource, action: t('post:card.addedToInventory') },
      contextData: { id: rawProduct?.id || '', name: rawProduct?.name || '', subName, image: productImage || defaultPostImage, isOwned },
      content, tags, images, stats: item.stats, createdAt: item.createdAt,
    };
  }, [t]);

  const mapBenchmarkToCardData = useCallback((item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
    const products: BenchmarkProduct[] = (item.products && Array.isArray(item.products))
      ? item.products.filter((p) => p != null).map((p) => ({
          id: p?.id || '', name: p?.name || '', subName: p?.subName || '',
          image: toImageSource(p?.image) || require('@/assets/inventory/product_01.png'),
          isOwned: p?.isOwned || false, choice: p?.choice || false,
        }))
      : [];
    return { id: item.id || '', user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource }, products, content: item.content || '', stats: item.stats, createdAt: item.createdAt };
  }, []);

  const mapTipsToCardData = useCallback((item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
    const emptyCategory = { id: '', name: '', subCategory: '', image: require('@/assets/inventory/product_01.png'), product: { id: '', name: '', subName: '', image: require('@/assets/inventory/product_01.png') } };
    const mappedImages = Array.isArray(item.images) ? item.images.map((img) => toImageSource(img)).filter((i): i is NonNullable<typeof i> => !!i) : [];
    if (!item.contextData) return { id: item.id || '', user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource }, category: emptyCategory, content: item.content || '', images: mappedImages, stats: item.stats, tag: item.tag, createdAt: item.createdAt };
    const contextImage = toImageSource(item.contextData.image) || require('@/assets/inventory/product_01.png');
    let category: TipsCategory;
    if (item.contextType === 'sub_category') {
      category = { id: item.contextData.id || '', name: item.contextData.name || '', subCategory: item.contextData.subName || '', image: contextImage };
    } else {
      const product: TipsProduct = { id: item.contextData.id || '', name: item.contextData.name || '', subName: item.contextData.subName || '', image: contextImage, isOwned: item.contextData.isOwned };
      category = { id: item.contextData.id || '', name: item.contextData.name || '', subCategory: item.contextData.subName || '', image: contextImage, product };
    }
    return { id: item.id || '', user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource }, category, content: item.content || '', images: mappedImages, stats: item.stats, tag: item.tag, createdAt: item.createdAt };
  }, []);

  const mapQuestionToCardData = useCallback((item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');
    const emptyCategory = { id: '', name: '', subCategory: '', image: require('@/assets/inventory/product_01.png'), product: { id: '', name: '', subName: '', image: require('@/assets/inventory/product_01.png') } };
    const mappedImages = Array.isArray(item.images) ? item.images.map((img) => toImageSource(img)).filter((i): i is NonNullable<typeof i> => !!i) : [];
    if (!item.contextData) return { id: item.id || '', user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource }, category: emptyCategory, content: item.content || '', isBoosted: item.isBoosted || false, images: mappedImages, stats: item.stats, createdAt: item.createdAt };
    const contextImage = toImageSource(item.contextData.image) || require('@/assets/inventory/product_01.png');
    let category: QuestionCardCategory;
    if (item.contextType === 'sub_category') {
      category = { id: item.contextData.id || '', name: item.contextData.name || '', subCategory: item.contextData.subName || '', image: contextImage };
    } else {
      const product: QuestionCardProduct = { id: item.contextData.id || '', name: item.contextData.name || '', subName: item.contextData.subName || '', image: contextImage, isOwned: item.contextData.isOwned };
      category = { id: item.contextData.id || '', name: item.contextData.name || '', subCategory: item.contextData.subName || '', image: contextImage, product };
    }
    return { id: item.id || '', user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource }, category, content: item.content || '', isBoosted: item.isBoosted || false, boostedUntil: item.boostedUntil, boostPrice: item.boostPrice, images: mappedImages, stats: item.stats, createdAt: item.createdAt };
  }, []);

  const mapUpdateToCardData = useCallback((item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
    const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');
    let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
    if (item.contextType === 'product_group') productInfoType = ProductInfoType.PRODUCT_GROUP;
    else if (item.contextType === 'sub_category') productInfoType = ProductInfoType.SUB_CATEGORY;
    const mappedImages = Array.isArray(item.images) ? item.images.map((img) => toImageSource(img)).filter((i): i is NonNullable<typeof i> => !!i) : [];
    if (!item.relatedPost) {
      return { id: item.id, user: { id: item.user.id, name: item.user.name, title: item.user.title, avatar: avatarSource }, stats: item.stats, createdAt: item.createdAt, contextType: productInfoType, product: { id: '', name: '', subName: '', image: require('@/assets/inventory/product_01.png'), isOwned: false }, content: item.content || '', images: mappedImages, relatedPost: undefined };
    }
    const relatedPostContent = (item.relatedPost?.content && Array.isArray(item.relatedPost.content))
      ? item.relatedPost.content.filter((c) => c != null).map((c) => {
          const ratingArray: number[] = Array(5).fill(0);
          const ratingValue = Math.min(Math.max(Math.round((c?.rating || 0) / 20), 0), 5);
          for (let i = 0; i < ratingValue; i++) ratingArray[i] = 1;
          return { tag: { icon: 'tag', title: c?.title || '' }, text: c?.content || '', rating: ratingArray };
        })
      : [];
    return {
      id: item.id || '',
      user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource },
      stats: item.stats, createdAt: item.createdAt, contextType: productInfoType,
      product: { id: item.relatedPost?.product?.id || '', name: item.relatedPost?.product?.name || '', subName: item.relatedPost?.product?.subName || '', image: toImageSource(item.relatedPost?.product?.image) || require('@/assets/inventory/product_01.png'), isOwned: item.relatedPost?.product?.isOwned || false },
      content: item.content || '', images: mappedImages,
      relatedPost: { id: item.relatedPost.id || '', product: { id: item.relatedPost.product?.id || '', name: item.relatedPost.product?.name || '', subName: item.relatedPost.product?.subName || '', image: toImageSource(item.relatedPost.product?.image) || require('@/assets/inventory/product_01.png'), isOwned: item.relatedPost.product?.isOwned || false }, content: relatedPostContent, tags: Array.isArray(item.relatedPost.tags) ? item.relatedPost.tags : [], images: Array.isArray(item.relatedPost.images) ? item.relatedPost.images.map((img) => toImageSource(img)).filter((i): i is NonNullable<typeof i> => !!i) : [] },
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderFeedItem = useCallback(({ item }: { item: FeedApiItem }) => {
    if (!item || !item.data || !item.data.id) return null;
    const itemId = item.data.id;
    const card = (() => {
    switch (item.type) {
      case CardType.EXPERIENCE:
      case 'experience':
        if (('contextData' in item.data || 'product' in item.data) && ('experienceContent' in item.data || 'content' in item.data)) {
          return <ExperiencePostCard key={itemId} data={mapExperienceToCardData(item.data as ExperiencePostApiItem & { type: 'experience' })} />;
        }
        return null;
      case CardType.POST:
      case 'post':
        if ((item.data as any)?.relatedPost != null) {
          return <UpdatePostCard key={itemId} data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })} />;
        }
        return <PostCard key={itemId} data={mapFeedToCardData(item.data as ProfilePost)} />;
      case CardType.BENCHMARK:
      case 'benchmark':
        return <BenchmarkPostCard key={itemId} data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })} />;
      case CardType.QUESTION:
      case 'question':
        if ('contextType' in item.data && 'contextData' in item.data) {
          return <QuestionPostCard key={itemId} data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })} />;
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
      case 'tipsAndTricks':
        return <TipsAndTricksPostCard key={itemId} data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })} />;
      case CardType.UPDATE:
      case 'update':
        if ((item.data as any)?.relatedPost != null) {
          return <UpdatePostCard key={itemId} data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })} />;
        }
        return null;
      default:
        return null;
    }
    })();
    // Yatay boşluk artık liste container'ında (margin gibi) değil, her item view'ında padding olarak
    // uygulanıyor — feed detaydaki kartın padding'li View ile sarılması ile aynı yaklaşım.
    if (!card) return null;
    return <View style={{ paddingHorizontal: 16 }}>{card}</View>;
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return <View style={{ paddingVertical: 20, alignItems: 'center' }}><ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} /></View>;
  }, [isFetchingNextPage, isDark]);

  const handleRefresh = useCallback(async () => {
    if (!lastSeenPostId) { await refetch(); return; }
    try {
      const newData = hasFilters
        ? await getFilteredFeed(lastSeenPostId, 10, filterParams)
        : await getFeed(lastSeenPostId, 10);
      if (newData.items.length > 0) {
        const queryKey = hasFilters
          ? feedKeys.filtered(undefined, 10, filterParams)
          : feedKeys.feed(undefined, 10);
        queryClient.setQueryData(queryKey, { pages: [newData], pageParams: [undefined] });
        const lastItem = newData.items[newData.items.length - 1];
        if (lastItem?.data?.id) setLastSeenPostId(String(lastItem.data.id));
      }
    } catch {
      await refetch();
    }
  }, [lastSeenPostId, hasFilters, filterParams, queryClient, refetch]);

  const keyExtractor = useCallback((item: FeedApiItem, index: number) => {
    if (item?.data?.id) return String(item.data.id);
    return `${tabKey}-feed-item-${index}`;
  }, [tabKey]);

  const contentContainerStyle = useMemo(() => ({ paddingTop: 8, paddingBottom: tabBarHeight }), [tabBarHeight]);

  if (isLoading && feedItems.length === 0) return <FeedSkeleton count={5} />;

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
        <Text color="#CE4A4A" fontSize="$md" fontWeight="$bold">{t('errors.failedToLoad')}</Text>
      </View>
    );
  }

  if (feedItems.length === 0) {
    return (
      <FeedEmptyCta
        tabKey={tabKey}
        onCreatePress={onCreatePress ?? (() => {})}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        bottomPadding={tabBarHeight}
      />
    );
  }

  return (
    <Animated.FlatList<FeedApiItem>
      data={feedItems}
      renderItem={renderFeedItem}
      keyExtractor={keyExtractor}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.1}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      ListFooterComponent={renderFooter}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={false}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      extraData={feedItems.length}
      refreshing={isRefetching}
      onRefresh={handleRefresh}
    />
  );
};

export const FeedTabList = React.memo(FeedTabListComponent);
