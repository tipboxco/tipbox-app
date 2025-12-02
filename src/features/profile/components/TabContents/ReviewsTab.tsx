import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import { useUserReviews } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import { CardType } from '@/src/types/common';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import type { ProfileReview } from '../../types';

const mapReviewToCardData = (review: ProfileReview): ReviewCardData => {
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
    // En fazla 3 tag göster
    tags: review.tags?.slice(0, 3) ?? [],
    images:
      review.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
    stats: review.stats,
    createdAt: review.createdAt,
  };
};

export const ReviewsTab = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const {
    data: reviews,
    isLoading,
    error,
  } = useUserReviews(userId);

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
    <VStack px={16} py={16} flex={1}>
      {isLoading && (
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" mb="$2">
          Reviews yükleniyor...
        </Text>
      )}

      {error && (
        <Text color="#CE4A4A" fontSize="$sm" mb="$2">
          Reviews yüklenirken bir hata oluştu: {error.message}
        </Text>
      )}

      {reviews
        ?.filter((review) => review.type === CardType.EXPERIENCE)
        .map((review) => (
          <ExperiencePostCard key={review.id} data={mapReviewToCardData(review)} />
        ))}
    </VStack>
  );
};
export default ReviewsTab;