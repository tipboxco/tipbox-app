import React from 'react';
import { VStack } from '@gluestack-ui/themed';
import PostCard from '@/src/components/PostCard';
import { mock_posts } from '@/src/mock/profile/posts';

export const FeedTab = () => {
  return (
    <VStack px={16} py={16}>
      {mock_posts.map((post) => (
        <PostCard key={post.id} data={post} />
      ))}
    </VStack>
  );
};
