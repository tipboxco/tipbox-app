import React from 'react';
import { VStack } from '@gluestack-ui/themed';
import { PostCard } from '../components/PostCard';

export const FeedScreen = () => {
  return (
    <VStack space="md" p="$4">
      <PostCard />
      <PostCard />
      <PostCard />
    </VStack>
  );
};
