import React from 'react';
import { VStack } from '@gluestack-ui/themed';
import { PostCard } from '@/src/components/PostCard';
import { mock_post_cards } from '@/src/mock/profile/feed';

const PostsTab = () => {
  return (
    <VStack flex={1} px={15}>
      {mock_post_cards.map((post) => (
        <PostCard key={post.id} data={post} />
      ))}
    </VStack>
  );
};

export default PostsTab;