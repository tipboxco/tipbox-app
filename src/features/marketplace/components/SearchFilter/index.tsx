import React from 'react';
import { HStack, Text, Pressable, Box, Input, InputField } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ searchQuery, onSearchChange }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack
      bg={isDark ? '$backgroundDark800' : '#F2F2F2'}
      borderRadius={20}
      px={14}
      py={6}
      alignItems="center"
      justifyContent="space-between"
    >
      <HStack alignItems="center" space="sm" flex={1}>
        <Feather 
          name="search" 
          size={20} 
          color={isDark ? '#FFFFFF' : '#8C8C8C'} 
        />
        <Input flex={1} borderWidth={0} bg="transparent">
          <InputField
            placeholder="Search by NFT name or description"
            placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
            color={isDark ? '#FFFFFF' : '#000000'}
            fontSize={9}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
        </Input>
      </HStack>
      
      <Box w={0.5} h={20} bg={isDark ? '$backgroundDark200' : '#CDCDCD'} />
      
      <Pressable p={8}>
        <Feather 
          name="filter" 
          size={16} 
          color={isDark ? '#FFFFFF' : '#8C8C8C'} 
        />
      </Pressable>
    </HStack>
  );
};
