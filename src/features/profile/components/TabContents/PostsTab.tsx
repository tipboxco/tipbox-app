import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { ReviewCard } from '@/src/components/ReviewCard/ReviewCard';
import { mock_review_card } from '@/src/mock/common';

export const PostsTab = () => {
  return (
    <Box flex={1} px="$4">
      <ReviewCard {...mock_review_card} />
    </Box>
  );
};