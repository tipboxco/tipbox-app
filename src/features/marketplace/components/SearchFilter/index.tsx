import React from 'react';
import { HStack, Input, InputField } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack
      alignItems="center"
      bg={isDark ? '#2A2A2A' : '#F2F2F2'}
      borderWidth={1}
      borderColor="#E9E9E9"
      borderRadius={20}
      px={14}
      space="sm"
    >
      <Feather
        name="search"
        size={24}
        color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'}
      />
      <Input flex={1} borderWidth={0} bg="transparent">
        <InputField
          placeholder="Search by NFT name or description"
          placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
          color={isDark ? '#000' : '#000'}
          fontSize="$xs"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </Input>
    </HStack>
  );
};
