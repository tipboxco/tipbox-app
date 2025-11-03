import React from 'react';
import { VStack } from '@gluestack-ui/themed';
import { BenchmarkPostCard } from '@/src/components/PostCards/BenchmarkPostCard';
import { mock_benchmark_posts } from '@/src/mock/profile/benchmark';

export const BenchmarksTab = () => {
  return (
    <VStack px={16} py={16}>
      {mock_benchmark_posts.map((post) => (
        <BenchmarkPostCard key={post.id} data={post} />
      ))}
    </VStack>
  );
};
export default BenchmarksTab;