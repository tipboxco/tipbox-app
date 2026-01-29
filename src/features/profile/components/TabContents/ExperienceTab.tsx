import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { FlatList, ActivityIndicator } from 'react-native';
import { VStack, Text, Box } from '@gluestack-ui/themed';
import { ExperiencePostCard } from '@/src/components/PostCards/ExperiencePostCard';
import { useUserReviews } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import type { ProfileReview } from '../../types';

const mapExperienceToCardData = (item: ProfileReview): ExperiencePostCardData => {
  const avatarSource = item.user?.avatar
    ? toImageSource(item.user.avatar)!
    : DEFAULT_USER_AVATAR;

  const productImage = item.contextData?.image
    ? toImageSource(item.contextData.image)
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
      action: item.status === 'own' ? 'Added new product and experiences to inventory!' : undefined,
    },
    contextData: {
      id: item.contextData?.id || '',
      name: item.contextData?.name || '',
      subName: (item.contextData?.subName && !/^Status:\s*(tested|own)$/i.test(String(item.contextData.subName))) ? item.contextData.subName : '',
      image: productImage,
      isOwned: item.status === 'own' || item.contextData?.isOwned,
    },
    content,
    tags: item.tags?.slice(0, 3) ?? [],
    images:
      item.images
        ?.map((img) => toImageSource(img))
        .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource) ?? [],
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

  const mappedExperience = useMemo(() => experienceItems.map(mapExperienceToCardData), [experienceItems]);

  const isLoadingMoreRef = useRef(false);
  useEffect(() => {
    isLoadingMoreRef.current = false;
  }, [mappedExperience.length]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMoreRef.current || !hasNextPage || isFetchingNextPage) return;
    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      setTimeout(() => { isLoadingMoreRef.current = false; }, 1000);
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, mappedExperience.length]);

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

  if (mappedExperience.length === 0) {
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
      data={mappedExperience}
      renderItem={({ item }) => <ExperiencePostCard data={item} />}
      keyExtractor={(item) => item.id}
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
