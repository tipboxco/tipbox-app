import React from 'react';
import {
  Box,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { MessageCategory } from '@/src/mock/inbox/messages/types';

interface MessagesFilterGroupProps {
  categories: MessageCategory[];
  activeCategory: string;
  onCategoryPress: (categoryId: string) => void;
}

export const MessagesFilterGroup: React.FC<MessagesFilterGroupProps> = ({
  categories,
  activeCategory,
  onCategoryPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Sol grup: All Messages ve Unread
  const leftGroup = categories.filter(category => category.id === '1' || category.id === '2');
  // Sağ grup: Message Requests
  const rightGroup = categories.filter(category => category.id === '3');

  const renderFilterButton = (category: MessageCategory) => (
    <Pressable key={category.id} onPress={() => onCategoryPress(category.id)}>
      <Box
        bg={activeCategory === category.id ? '#F1F1F1' : 'transparent'}
        borderWidth={1}
        borderColor="#EFEFEF"
        borderRadius={10}
        px="$3"
        py="$1"
        minHeight={28}
        justifyContent="center"
        alignItems="center"
      >
        <Text
          color="#000000"
          fontSize="$xs"
          fontWeight="$semibold"
          textAlign="center"
        >
          {category.name}
        </Text>
      </Box>
    </Pressable>
  );

  return (
    <HStack space="xs" justifyContent="space-between" alignItems="center">
      {/* Sol grup: All Messages ve Unread */}
      <HStack space="xs">
        {leftGroup.map((category) => renderFilterButton(category))}
      </HStack>

      {/* Sağ grup: Message Requests */}
      <HStack space="xs">
        {rightGroup.map((category) => renderFilterButton(category))}
      </HStack>
    </HStack>
  );
};

export default MessagesFilterGroup;
