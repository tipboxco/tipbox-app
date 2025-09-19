import React from 'react';
import { VStack } from '@gluestack-ui/themed';
import { ExperiencePostCard } from '@/src/components/ExperiencePostCard';
import { mock_post_cards } from '@/src/mock/profile/feed';

export const ReviewsTab = () => {
  return (
    <VStack px={16} py={16} flex={1}>
      {mock_post_cards.map((post) => (
        <ExperiencePostCard key={post.id} data={post} />
      ))}
    </VStack>
  );
};
export default ReviewsTab;