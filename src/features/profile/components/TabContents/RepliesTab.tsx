import React from 'react';
import { FlatList } from 'react-native';
import { VStack } from '@gluestack-ui/themed';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import { mock_questions } from '@/src/mock/profile/questions';

export const RepliesTab = () => {
  return (
    <FlatList
      data={mock_questions}
      renderItem={({ item }) => <QuestionPostCard data={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEnabled={false}
      removeClippedSubviews={true}
    />
  );
};
export default RepliesTab;