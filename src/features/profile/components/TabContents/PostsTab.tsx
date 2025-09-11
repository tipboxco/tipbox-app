import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { PostCard } from '@/src/components/PostCard';
import { mock_post_card } from '@/src/mock/profile/feed';

export const PostsTab = () => {
  return (
    <Box flex={1} px={15}>
      <PostCard data={mock_post_card} />
    </Box>
  );
};