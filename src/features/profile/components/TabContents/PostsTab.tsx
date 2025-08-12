import React from 'react';
import { ScrollView } from '@gluestack-ui/themed';
import { ReviewCard } from '@/src/components/ReviewCard/ReviewCard';
import { mock_review_card } from '@/src/mock/common';

export const PostsTab = () => {
  return (
    <ScrollView flex={1} px="$4">
      <ReviewCard {...mock_review_card} />
    </ScrollView>
  );
};
