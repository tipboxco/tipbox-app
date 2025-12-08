import React, { useMemo } from 'react';
import { FlatList } from 'react-native';
import { VStack, Text } from '@gluestack-ui/themed';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import { useUserReviews } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
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

  const mappedReviews = useMemo(() => {
    if (!reviews) return [];
    return reviews.map(mapReviewToCardData);
  }, [reviews]);

  if (!userId) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Kullanıcı bilgisi bulunamadı.
        </Text>
      </VStack>
    );
  }

  if (isLoading) {
    return (
      <VStack px={16} py={16} flex={1} justifyContent="center" alignItems="center">
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Reviews yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Reviews yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedReviews.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Henüz review bulunmuyor.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedReviews}
      renderItem={({ item }) => <ExperiencePostCard data={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      removeClippedSubviews={true}
    />
  );
};
export default ReviewsTab;