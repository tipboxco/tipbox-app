import React from 'react';
import { VStack } from '@gluestack-ui/themed';
import QuestionPostCard from '@/src/components/QuestionPostCard';
import { mock_questions } from '@/src/mock/profile/questions';

const RepliesTab = () => {
  return (
    <VStack px={16} py={16}>
      {mock_questions.map((question) => (
        <QuestionPostCard key={question.id} data={question} />
      ))}
    </VStack>
  );
};

export default RepliesTab;
