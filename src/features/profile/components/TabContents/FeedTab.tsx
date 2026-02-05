import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, Text, Box } from '@gluestack-ui/themed';
import PostCard from '@/src/components/PostCards/PostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useUserPosts } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource, DEFAULT_USER_AVATAR, isSameImageSource } from '@/src/utils';
import { CardType, ProductInfoType } from '@/src/types/common';
import type { PostCardData } from '@/src/types/PostCard';
import type { UpdateCardData } from '@/src/types/UpdateCard';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ProfilePost, ProfileReview, ProfileFeedItem } from '../../types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';

// Map Post/Feed to PostCardData
const mapPostToCardData = (post: ProfilePost): PostCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const contextImage = post.contextData?.image
    ? toImageSource(post.contextData.image)
    : undefined;

  // content array ise string'e çevir, değilse direkt kullan
  const contentString = Array.isArray(post.content)
    ? post.content.map((item) => item.content || '').join(' ')
    : (post.content || '');

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  const mappedImages = post.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  
  const images = mappedImages;

  return {
    id: post.id,
    user: {
      id: post.user.id,
      name: post.user.name,
      title: post.user.title,
      avatar: toImageSource(post.user.avatar)!,
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
    contextType: post.contextType,
    contextData: post.contextData
      ? {
          id: post.contextData.id,
          name: post.contextData.name,
          subName: post.contextData.subName,
          image: contextImage || post.contextData.image || defaultPostImage,
          isOwned: post.contextData.isOwned,
        }
      : undefined,
  };
};

// Map Experience to ExperiencePostCardData
const mapExperienceToCardData = (review: ProfileReview): ExperiencePostCardData => {
  const avatarSource = review.user?.avatar
    ? toImageSource(review.user.avatar)!
    : DEFAULT_USER_AVATAR;
  
  const productImage = review.contextData?.image
    ? toImageSource(review.contextData.image)
    : undefined;

  const content: ExperiencePostCardContentItem[] = review.content?.map((item) => ({
    tag: {
      icon: 'tag',
      title: item.title,
    },
    text: item.content,
    rating: Array(5)
      .fill(false)
      .map((_, index) => index < (item.rating || 0)),
  })) ?? [];

  return {
    id: review.id,
    user: {
      id: review.user?.id || '',
      name: review.user?.name || 'Unknown',
      title: review.user?.title || '',
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
    images: (() => {
      const mapped = review.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
      return mapped.filter((img) => !isSameImageSource(img, productImage));
    })(),
    stats: review.stats,
    createdAt: review.createdAt,
  };
};

// Map Benchmark to BenchmarkCardData
const mapBenchmarkToCardData = (item: BenchmarkApiItem): BenchmarkCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;

  const products: BenchmarkProduct[] = item.products.map((p) => ({
    id: p.id,
    name: p.name,
    subName: p.subName,
    image: toImageSource(p.image)!,
    isOwned: p.isOwned,
    choice: p.choice,
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

// Map Tips to TipsCardData
const mapTipsToCardData = (item: TipsApiItem): TipsCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;
  const contextImage = toImageSource(item.contextData.image)!;

  // CRITICAL: contextType'a göre product veya category mapping yap
  let category: TipsCategory;
  
  if (item.contextType === 'sub_category') {
    // SubCategory: sadece category bilgisi, product YOK
    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      // product undefined bırak
    };
  } else {
    // Product veya ProductGroup: category.product dolu
    const product: TipsProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: contextImage,
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

// Map Question to QuestionCardData
const mapQuestionToCardData = (item: QuestionApiItem): QuestionCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;
  const contextImage = toImageSource(item.contextData.image)!;

  // CRITICAL: contextType'a göre product veya category mapping yap
  let category: QuestionCardCategory;
  
  if (item.contextType === 'sub_category') {
    // SubCategory: category dolu, product YOK
    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      // product undefined bırak
    };
  } else {
    // Product veya ProductGroup: category.product dolu
    const product: QuestionCardProduct = {
      id: item.contextData.id,
      name: item.contextData.name,
      subName: item.contextData.subName,
      image: contextImage,
    };

    category = {
      id: item.contextData.id,
      name: item.contextData.name,
      subCategory: item.contextData.subName,
      image: contextImage,
      product,
    };
  }

  // images array'i boşsa veya görseller yüklenemediyse boş array döndür (görsel alanı gösterilmez)
  const mappedImages = item.images
    ?.map((img) => toImageSource(img))
    .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [];
  const images = mappedImages;

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

// Map Update (feed post type 'update') to UpdateCardData
const mapUpdateToCardData = (post: ProfilePost & { relatedPost?: any }): UpdateCardData => {
  const defaultPostImage = require('@/assets/defaultImages/default-post.png');
  const avatarSource = post.user?.avatar ? toImageSource(post.user.avatar)! : DEFAULT_USER_AVATAR;
  const raw = post as any;
  let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
  if (raw.contextType === 'product_group') productInfoType = ProductInfoType.PRODUCT_GROUP;
  else if (raw.contextType === 'sub_category') productInfoType = ProductInfoType.SUB_CATEGORY;

  if (!raw.relatedPost) {
    const productFromContext = raw.contextData ?? raw.relatedPost?.product;
    return {
      id: post.id,
      user: { id: post.user?.id || '', name: post.user?.name || '', title: post.user?.title || '', avatar: avatarSource },
      stats: post.stats,
      createdAt: post.createdAt,
      contextType: productInfoType,
      product: productFromContext ? {
        id: productFromContext.id ?? '',
        name: productFromContext.name ?? '',
        subName: productFromContext.subName ?? '',
        image: toImageSource(productFromContext.image) ?? defaultPostImage,
        isOwned: productFromContext.isOwned ?? false,
      } : { id: '', name: '', subName: '', image: defaultPostImage, isOwned: false },
      content: typeof raw.content === 'string' ? raw.content : (Array.isArray(raw.content) ? (raw.content.map((c: any) => c?.content ?? '').join(' ')) : ''),
      images: Array.isArray(raw.images) ? raw.images.map((img: any) => toImageSource(img)).filter(Boolean) : [],
      relatedPost: undefined,
    };
  }

  const rp = raw.relatedPost;
  const relatedPostContent = (rp.content && Array.isArray(rp.content))
    ? rp.content.filter((c: any) => c != null).map((contentItem: any) => {
        const ratingVal = typeof contentItem?.rating === 'number' ? contentItem.rating : (Array.isArray(contentItem?.rating) ? contentItem.rating.filter((r: number) => r === 1).length : 0);
        const stars = contentItem?.rating != null && Array.isArray(contentItem.rating) ? contentItem.rating.filter((r: number) => r === 1).length : Math.min(5, Math.max(0, Math.round((contentItem?.rating ?? 0) / 20)));
        const ratingArray: number[] = Array(5).fill(0);
        for (let i = 0; i < stars; i++) ratingArray[i] = 1;
        return { tag: { icon: 'tag' as const, title: contentItem?.tag?.title ?? contentItem?.title ?? '' }, text: contentItem?.text ?? contentItem?.content ?? '', rating: ratingArray };
      })
    : [];

  const mappedImages = Array.isArray(raw.images) ? raw.images.map((img: any) => toImageSource(img)).filter((x): x is NonNullable<typeof x> => !!x) : [];
  const relatedPostImages = (rp.images && Array.isArray(rp.images)) ? rp.images.map((img: any) => toImageSource(img)).filter((x): x is NonNullable<typeof x> => !!x) : [];

  return {
    id: post.id,
    user: { id: post.user?.id || '', name: post.user?.name || '', title: post.user?.title || '', avatar: avatarSource },
    stats: post.stats,
    createdAt: post.createdAt,
    contextType: productInfoType,
    product: {
      id: rp.product?.id ?? '',
      name: rp.product?.name ?? '',
      subName: rp.product?.subName ?? '',
      image: toImageSource(rp.product?.image) ?? defaultPostImage,
      isOwned: rp.product?.isOwned ?? false,
    },
    content: typeof raw.content === 'string' ? raw.content : (Array.isArray(raw.content) ? (raw.content.map((c: any) => c?.content ?? '').join(' ')) : ''),
    images: mappedImages,
    relatedPost: {
      id: rp.id ?? post.id,
      product: { id: rp.product?.id ?? '', name: rp.product?.name ?? '', subName: rp.product?.subName ?? '', image: toImageSource(rp.product?.image) ?? defaultPostImage, isOwned: rp.product?.isOwned ?? false },
      content: relatedPostContent,
      tags: Array.isArray(rp.tags) ? rp.tags : [],
      images: relatedPostImages,
    },
  };
};

// Mapped post type
type MappedPost = 
  | { type: 'post'; id: string; data: PostCardData }
  | { type: 'update'; id: string; data: UpdateCardData }
  | { type: 'experience'; id: string; data: ExperiencePostCardData }
  | { type: 'benchmark'; id: string; data: BenchmarkCardData }
  | { type: 'tips'; id: string; data: TipsCardData }
  | { type: 'question'; id: string; data: QuestionCardData };

const FeedTabComponent = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // User Posts API hook with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isPending,
    error,
  } = useUserPosts(userId, 5);

  // Flatten all pages into a single array - useMemo ile memoize et
  // Duplicate ID'leri filtrele (backend cursor desteklemiyorsa aynı item'lar tekrar gelebilir)
  // Mapping sonuçlarını da cache'le - böylece React.memo düzgün çalışır
  const posts = useMemo(() => {
    const allItems = data?.pages.flatMap((page) => page.items) ?? [];
    
    // ID'ye göre unique item'ları filtrele
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex((t) => t.id === item.id)
    );
    
    return uniqueItems;
  }, [data]);

  // Mapping sonuçlarını cache'le - her item için bir kez hesapla
  // Bu sayede React.memo düzgün çalışır (aynı referanslar)
  const mappedPosts = useMemo(() => {
    const mapped = posts.map((post) => {
      switch (post.type) {
        case CardType.UPDATE:
        case 'update':
          return {
            type: 'update' as const,
            id: post.id,
            data: mapUpdateToCardData(post as ProfilePost & { relatedPost?: any }),
          };
        case CardType.EXPERIENCE:
          if ('contextData' in post && 'content' in post && Array.isArray(post.content)) {
            return {
              type: 'experience' as const,
              id: post.id,
              data: mapExperienceToCardData(post as ProfileReview),
            };
          }
          return null;
        case CardType.BENCHMARK:
          return {
            type: 'benchmark' as const,
            id: post.id,
            data: mapBenchmarkToCardData(post as BenchmarkApiItem),
          };
        case CardType.TIPS_AND_TRICKS:
          return {
            type: 'tips' as const,
            id: post.id,
            data: mapTipsToCardData(post as TipsApiItem),
          };
        case CardType.QUESTION:
          if ('contextType' in post && 'contextData' in post && 'isBoosted' in post) {
            return {
              type: 'question' as const,
              id: post.id,
              data: mapQuestionToCardData(post as QuestionApiItem),
            };
          }
          return null;
        case CardType.POST:
        default:
          // relatedPost varsa update post olarak göster (UPDATE tag + See Related Post)
          if ((post as any).relatedPost != null) {
            return {
              type: 'update' as const,
              id: post.id,
              data: mapUpdateToCardData(post as ProfilePost & { relatedPost?: any }),
            };
          }
          return {
            type: 'post' as const,
            id: post.id,
            data: mapPostToCardData(post as ProfilePost),
          };
      }
    }).filter((item): item is NonNullable<typeof item> => item !== null);
    
    return mapped;
  }, [posts]);

  // Duplicate key'leri önlemek için unique key oluştur
  const getItemKey = useCallback((item: MappedPost) => {
    return item.id;
  }, []);

  // onEndReached loop'unu önlemek için ref
  const isLoadingMoreRef = useRef(false);
  const lastItemsCountRef = useRef(0);

  // mappedPosts.length değiştiğinde lastItemsCountRef'i güncelle
  useEffect(() => {
    lastItemsCountRef.current = mappedPosts.length;
  }, [mappedPosts.length]);

  const handleLoadMore = useCallback(() => {
    // Eğer zaten yükleme yapılıyorsa veya item sayısı değişmediyse, tekrar tetikleme
    if (isLoadingMoreRef.current) {
      return;
    }

    // Eğer hasNextPage false ise veya zaten fetch yapılıyorsa, işlem yapma
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    // Flag'i set et
    isLoadingMoreRef.current = true;

    fetchNextPage()
      .finally(() => {
        // Fetch tamamlandığında flag'i reset et
        // Kısa bir delay ekle ki onEndReached tekrar tetiklenmesin
        setTimeout(() => {
          isLoadingMoreRef.current = false;
        }, 1000);
      });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, mappedPosts.length]);

  // Footer component'ini memoize et - isFetchingNextPage değişiklikleri render tetiklemez
  // ama footer'ı göstermek için değeri kullanabiliriz
  const LoadingFooter = React.memo(({ isFetching, isDark }: { isFetching: boolean; isDark: boolean }) => {
    if (!isFetching) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  });

  const renderFooter = useCallback(() => {
    return <LoadingFooter isFetching={isFetchingNextPage} isDark={isDark} />;
  }, [isFetchingNextPage, isDark]);

  // Render item - artık mapping yapmıyoruz, sadece render ediyoruz
  // Mapping sonuçları zaten cache'lenmiş durumda
  const renderItem = useCallback(({ item }: { item: MappedPost }) => {
    switch (item.type) {
      case 'update':
        return <UpdatePostCard data={item.data} />;
      case 'experience':
        return <ExperiencePostCard data={item.data} />;
      case 'benchmark':
        return <BenchmarkPostCard data={item.data} />;
      case 'tips':
        return <TipsAndTricksPostCard data={item.data} />;
      case 'question':
        return <QuestionPostCard data={item.data} />;
      case 'post':
      default:
        return <PostCard data={item.data} />;
    }
  }, []);

  // contentContainerStyle'ı memoize et - her render'da yeni obje oluşturulmasını önle
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: 16, paddingVertical: 8 }),
    []
  );

  // extraData için mappedPosts array'inin length'ini kullan
  // Array değiştiğinde length de değişir, bu yeterli
  // useMemo ile memoize et ki gereksiz re-render olmasın
  // ÖNEMLİ: Tüm hook'lar koşullu return'lerden ÖNCE çağrılmalı
  const flatListExtraData = useMemo(() => mappedPosts.length, [mappedPosts.length]);

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  // isPending kontrolü - sadece ilk yükleme için (data yoksa)
  if (isPending && !data) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mt="$2">
          Feed yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Feed yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedPosts.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          No feed content found yet.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedPosts}
      renderItem={renderItem}
      keyExtractor={getItemKey}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      // Performance optimizations
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      updateCellsBatchingPeriod={50}
      // extraData: mappedPosts değiştiğinde re-render et
      // Hash kullanarak sadece gerçekten değiştiğinde re-render olur
      extraData={flatListExtraData}
    />
  );
};
export const FeedTab = React.memo(FeedTabComponent);
export default FeedTab;