import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, Text, Box } from '@gluestack-ui/themed';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import { useUserReviews } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource, DEFAULT_USER_AVATAR, isSameImageSource } from '@/src/utils';
import { ProductInfoType } from '@/src/types/common';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { UpdateCardData } from '@/src/types/UpdateCard';
import type { ProfileReview } from '../../types';

/** Review item'ı Update post ise UpdateCardData'ya çevirir (Experience tab'da type: 'update' için) */
function mapReviewToUpdateCardData(item: ProfileReview & { type: string; relatedPost?: any; content?: string }): UpdateCardData {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = item.user?.avatar ? toImageSource(item.user.avatar)! : DEFAULT_USER_AVATAR;
  const raw = item as any;
  let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
  if (raw.contextType === 'product_group') productInfoType = ProductInfoType.PRODUCT_GROUP;
  else if (raw.contextType === 'sub_category') productInfoType = ProductInfoType.SUB_CATEGORY;

  if (!raw.relatedPost) {
    const productFromContext = raw.contextData?.product ?? raw.contextData ?? raw.relatedPost?.product;
    return {
      id: item.id,
      user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource },
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: productInfoType,
      product: productFromContext ? {
        id: productFromContext.id ?? '',
        name: productFromContext.name ?? '',
        subName: productFromContext.subName ?? '',
        image: toImageSource(productFromContext.image) ?? defaultPostImage,
        isOwned: productFromContext.isOwned ?? false,
      } : { id: '', name: '', subName: '', image: defaultPostImage, isOwned: false },
      content: typeof raw.content === 'string' ? raw.content : '',
      images: Array.isArray(raw.images) ? raw.images.map((img: any) => toImageSource(img)).filter(Boolean) : [],
      relatedPost: undefined,
    };
  }

  const rp = raw.relatedPost;
  const experienceBlocks = rp.experienceContent ?? (Array.isArray(rp.content) ? rp.content : []);
  const relatedPostContent = experienceBlocks
    .filter((c: any) => c != null)
    .map((contentItem: any) => {
      const ratingVal = typeof contentItem?.rating === 'number' ? Math.min(5, Math.max(0, contentItem.rating)) : (Array.isArray(contentItem?.rating) ? contentItem.rating.filter((r: number) => r === 1).length : Math.min(5, Math.max(0, Math.round((contentItem?.rating ?? 0) / 20))));
      const ratingArray: number[] = Array(5).fill(0);
      for (let i = 0; i < ratingVal; i++) ratingArray[i] = 1;
      return {
        tag: { icon: (contentItem?.title?.toLowerCase?.().includes('product') || contentItem?.title?.toLowerCase?.().includes('usage')) ? 'package' as const : 'tag' as const, title: contentItem?.tag?.title ?? contentItem?.title ?? '' },
        text: contentItem?.text ?? contentItem?.content ?? '',
        rating: ratingArray,
      };
    });

  const mappedImages = Array.isArray(raw.images) ? raw.images.map((img: any) => toImageSource(img)).filter((x): x is NonNullable<typeof x> => !!x) : [];
  const relatedPostImages = (rp.images && Array.isArray(rp.images)) ? rp.images.map((img: any) => toImageSource(img)).filter((x): x is NonNullable<typeof x> => !!x) : [];

  return {
    id: item.id,
    user: { id: item.user?.id || '', name: item.user?.name || '', title: item.user?.title || '', avatar: avatarSource },
    stats: item.stats,
    createdAt: item.createdAt,
    contextType: productInfoType,
    product: {
      id: rp.product?.id ?? '',
      name: rp.product?.name ?? '',
      subName: rp.product?.subName ?? '',
      image: toImageSource(rp.product?.image) ?? defaultPostImage,
      isOwned: rp.product?.isOwned ?? false,
    },
    content: typeof raw.content === 'string' ? raw.content : '',
    images: mappedImages,
    relatedPost: {
      id: rp.id ?? item.id,
      product: { id: rp.product?.id ?? '', name: rp.product?.name ?? '', subName: rp.product?.subName ?? '', image: toImageSource(rp.product?.image) ?? defaultPostImage, isOwned: rp.product?.isOwned ?? false },
      content: relatedPostContent,
      tags: Array.isArray(rp.tags) ? rp.tags : [],
      images: relatedPostImages,
    },
  };
}

const mapExperienceToCardData = (item: ProfileReview): ExperiencePostCardData => {
  const avatarSource = item.user?.avatar
    ? toImageSource(item.user.avatar)!
    : DEFAULT_USER_AVATAR;

  // API bazen product bazen contextData döner - ikisini de kontrol et
  const productData = item.product || item.contextData;
  const productImage = productData?.image
    ? toImageSource(productData.image)
    : undefined;

  const content: ExperiencePostCardContentItem[] = item.content?.map((entry) => ({
    tag: {
      icon: (entry.title?.toLowerCase().includes('product') || entry.title?.toLowerCase().includes('usage')) ? 'package' as const : 'tag' as const,
      title: entry.title,
    },
    text: entry.content,
    rating: Array(5)
      .fill(false)
      .map((_, index) => index < (entry.rating || 0)),
  })) ?? [];

  return {
    id: item.id,
    user: {
      id: item.user?.id || '',
      name: item.user?.name || 'Unknown',
      title: item.user?.title || '',
      avatar: avatarSource,
      action: 'Added new product and experiences to inventory!',
    },
    contextData: {
      id: productData?.id || '',
      name: productData?.name || '',
      subName: (productData?.subName && !/^Status:\s*(tested|own)$/i.test(String(productData.subName))) ? productData.subName : '',
      image: productImage,
      isOwned: item.status === 'own' || productData?.isOwned,
    },
    content,
    tags: item.tags?.slice(0, 3) ?? [],
    images: (() => {
      const mapped = item.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
      return mapped.filter((img) => !isSameImageSource(img, productImage));
    })(),
    stats: item.stats,
    createdAt: item.createdAt,
  };
};

const ExperienceTabComponent = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const {
    data: experienceData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useUserReviews(userId, 5);

  const experienceItems = useMemo(() => {
    if (!experienceData?.pages) return [];
    const allItems = experienceData.pages.flatMap((page) => page.items ?? []);
    return allItems.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    );
  }, [experienceData]);

  const isUpdateItem = (item: ProfileReview) => (item as any).type === 'update';

  const isLoadingMoreRef = useRef(false);
  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [experienceItems.length]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasNextPage || isFetchingNextPage) return;
    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      setTimeout(() => { isLoadingMoreRef.current = false; }, 1000);
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, experienceItems.length]);

  const LoadingFooter = React.memo(({ isFetching, isDark }: { isFetching: boolean; isDark: boolean }) => {
    if (!isFetching) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  });

  const renderFooter = useCallback(() => <LoadingFooter isFetching={isFetchingNextPage} isDark={isDark} />, [isFetchingNextPage, isDark]);

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  if (isLoading && !experienceData?.pages?.[0]) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Experience yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Experience yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (experienceItems.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          No experience posts yet.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={experienceItems}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) =>
        isUpdateItem(item) ? (
          <UpdatePostCard data={mapReviewToUpdateCardData(item as ProfileReview & { type: string; relatedPost?: any; content?: string })} />
        ) : (
          <ExperiencePostCard data={mapExperienceToCardData(item)} />
        )
      }
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      removeClippedSubviews={true}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

export const ExperienceTab = React.memo(ExperienceTabComponent);
export default ExperienceTab;
