import React from 'react';
import { VStack } from '@gluestack-ui/themed';
import TipsAndTricksPostCard from '@/src/components/TipsAndTricksPostCard';
import { mock_tips_and_tricks_posts } from '@/src/mock/profile/tipsAndTricks';

export const TipsTab = () => {
  return (
    <VStack space="md" px={16} py={16}>
      {mock_tips_and_tricks_posts.map((post) => (
        <TipsAndTricksPostCard key={post.id} data={post} />
      ))}
    </VStack>
  );
};
export default TipsTab;