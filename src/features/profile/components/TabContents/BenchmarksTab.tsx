import React, { useMemo } from 'react';
import { FlatList } from 'react-native';
import { VStack, Text } from '@gluestack-ui/themed';
import { BenchmarkPostCard } from '@/src/components/PostCards/BenchmarkPostCard';
import { useUserBenchmarks } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { ProfileBenchmark } from '../../types';

const mapBenchmarkToCardData = (item: ProfileBenchmark): BenchmarkCardData => {
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

export const BenchmarksTab = () => {
  const userId = useCurrentUserIdOrLogout();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const {
    data: benchmarks,
    isLoading,
    error,
  } = useUserBenchmarks(userId);

  const mappedBenchmarks = useMemo(() => {
    if (!benchmarks) return [];
    return benchmarks.map(mapBenchmarkToCardData);
  }, [benchmarks]);

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
          Benchmarks yükleniyor...
        </Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack px={16} py={16}>
        <Text color="#CE4A4A" fontSize="$sm">
          Benchmarks yüklenirken bir hata oluştu: {error.message}
        </Text>
      </VStack>
    );
  }

  if (mappedBenchmarks.length === 0) {
    return (
      <VStack px={16} py={16}>
        <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
          Henüz benchmark bulunmuyor.
        </Text>
      </VStack>
    );
  }

  return (
    <FlatList
      data={mappedBenchmarks}
      renderItem={({ item }) => <BenchmarkPostCard data={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      removeClippedSubviews={true}
    />
  );
};
export default BenchmarksTab;