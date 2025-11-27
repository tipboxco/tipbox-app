import React from 'react';
import { VStack, Text } from '@gluestack-ui/themed';
import { BenchmarkPostCard } from '@/src/components/PostCards/BenchmarkPostCard';
import { useUserBenchmarks } from '../../api/hooks';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useCurrentUserIdOrLogout, toImageSource } from '@/src/utils';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { ProfileBenchmark } from '../../types';

const mapBenchmarkToCardData = (item: ProfileBenchmark): BenchmarkCardData => {
  const avatarSource = toImageSource(item.user.avatarUrl)!;

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
          Benchmarks yükleniyor...
        </Text>
      )}

      {error && (
        <Text color="#CE4A4A" fontSize="$sm" mb="$2">
          Benchmarks yüklenirken bir hata oluştu: {error.message}
        </Text>
      )}

      {benchmarks?.map((item) => (
        <BenchmarkPostCard key={item.id} data={mapBenchmarkToCardData(item)} />
      ))}
    </VStack>
  );
};
export default BenchmarksTab;