import React from 'react';
import { FlatList } from 'react-native';
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

  const renderFilterButton = ({ item }: { item: MessageCategory }) => (
    <Pressable onPress={() => onCategoryPress(item.id)}>
      <Box
        bg={activeCategory === item.id ? '#F1F1F1' : 'transparent'}
        borderWidth={1}
        borderColor="#EFEFEF"
        borderRadius={10}
        px="$3"
        minHeight={28}
        justifyContent="center"
        alignItems="center"
      >
        <Text
          color="#000000"
          fontSize={9}
          fontWeight="$semibold"
          textAlign="center"
        >
          {item.name}
        </Text>
      </Box>
    </Pressable>
  );

  return (
    <HStack space="xs" justifyContent="flex-start">
      {categories.map((category) => (
        <Pressable key={category.id} onPress={() => onCategoryPress(category.id)}>
          <Box
            bg={activeCategory === category.id ? '#F1F1F1' : 'transparent'}
            borderWidth={1}
            borderColor="#EFEFEF"
            borderRadius={10}
            px="$3"
            minHeight={28}
            justifyContent="center"
            alignItems="center"
          >
            <Text
              color="#000000"
              fontSize={9}
              fontWeight="$semibold"
              textAlign="center"
            >
              {category.name}
            </Text>
          </Box>
        </Pressable>
      ))}
    </HStack>
  );
};

export default MessagesFilterGroup;
