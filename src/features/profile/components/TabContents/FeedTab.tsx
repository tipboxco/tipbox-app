import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import PostCard from '@/src/components/PostCards/PostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import { useUserPosts } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import { CardType } from '@/src/types/common';
import type { PostCardData } from '@/src/types/PostCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ProfilePost, ProfileReview, ProfileFeedItem } from '../../types';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';

// Map Post/Feed to PostCardData
const mapPostToCardData = (post: ProfilePost): PostCardData => {
  const contextImage = post.contextData?.image
    ? toImageSource(post.contextData.image)
    : undefined;

  // content array ise string'e çevir, değilse direkt kullan
  const contentString = Array.isArray(post.content)
    ? post.content.map((item) => item.content || '').join(' ')
    : (post.content || '');

  return {
    id: post.id,
    user: {
      id: post.user.id,
      name: post.user.name,
      title: post.user.title,
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
    contextType: post.contextType,
    contextData: post.contextData
      ? {
          id: post.contextData.id,
          name: post.contextData.name,
          subName: post.contextData.subName,
          image: contextImage || post.contextData.image,
          isOwned: post.contextData.isOwned,
        }
      : undefined,
  };
};

// Map Experience (Review) to ReviewCardData
const mapExperienceToCardData = (review: ProfileReview): ReviewCardData => {
  const avatarSource = review.user?.avatar
    ? toImageSource(review.user.avatar)!
    : require('@/assets/avatar/ozan.png');
  
  const productImage = review.contextData?.image
    ? toImageSource(review.contextData.image)
    : undefined;

  const content: ReviewCardContentItem[] = review.content?.map((item) => ({
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
    images:
      review.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
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

  const product: TipsProduct = {
    id: item.contextData.id,
    name: item.contextData.name,
    subName: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
  };

  const category: TipsCategory = {
    id: item.contextData.id,
    name: item.contextData.name,
    subCategory: item.contextData.subName,
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

// Map Question to QuestionCardData
const mapQuestionToCardData = (item: QuestionApiItem): QuestionCardData => {
  const avatarSource = toImageSource(item.user.avatar)!;

  const product: QuestionCardProduct = {
    id: item.contextData.id,
    name: item.contextData.name,
    subName: item.contextData.subName,
    image: toImageSource(item.contextData.image)!,
  };

  const category: QuestionCardCategory = {
    id: item.contextData.id,
    name: item.contextData.name,
    subCategory: item.contextData.subName,
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

// Render function based on post type
const renderPostItem = (post: ProfileFeedItem) => {
  switch (post.type) {
    case CardType.EXPERIENCE:
      // Experience type için ProfileReview kullan
      if ('contextData' in post && 'content' in post && Array.isArray(post.content)) {
        return (
          <ExperiencePostCard
            key={post.id}
            data={mapExperienceToCardData(post as ProfileReview)}
          />
        );
      }
      return null;
    case CardType.BENCHMARK:
      return (
        <BenchmarkPostCard
          key={post.id}
          data={mapBenchmarkToCardData(post as BenchmarkApiItem)}
        />
      );
    case CardType.TIPS_AND_TRICKS:
      return (
        <TipsAndTricksPostCard
          key={post.id}
          data={mapTipsToCardData(post as TipsApiItem)}
        />
      );
    case CardType.QUESTION:
      if ('contextType' in post && 'contextData' in post && 'isBoosted' in post) {
        return (
          <QuestionPostCard
            key={post.id}
            data={mapQuestionToCardData(post as QuestionApiItem)}
          />
        );
      }
      return null;
    case CardType.POST:
    case CardType.FEED:
    default:
      // Post ve Feed type için ProfilePost kullan
      return (
        <PostCard
          key={post.id}
          data={mapPostToCardData(post as ProfilePost)}
        />
      );
  }
};

export const FeedTab = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const {
    data: posts,
    isLoading,
    error,
  } = useUserPosts(userId);

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  return (
    <VStack px={16} py={16}>
      {isLoading && (
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mb="$2">
          Feed yükleniyor...
        </Text>
      )}

      {error && (
        <Text color="#CE4A4A" fontSize="$sm" mb="$2">
          Feed yüklenirken bir hata oluştu: {error.message}
        </Text>
      )}

      {posts?.map((post) => renderPostItem(post))}
    </VStack>
  );
};
export default FeedTab;