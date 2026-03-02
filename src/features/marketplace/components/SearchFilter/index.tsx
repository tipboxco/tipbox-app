import React from 'react';
import { HStack, Input, InputField, Pressable, Box } from '@gluestack-ui/themed';
import { FunnelIcon } from 'react-native-heroicons/outline';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

export type NFTType = 'BADGE' | 'COSMETIC' | 'ALL';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType?: NFTType;
  onFilterPress?: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedType = 'ALL',
  onFilterPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Determine if filter is active (not ALL)
  const isFilterActive = selectedType !== 'ALL';

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
      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          p="$2"
          borderRadius="$full"
          bg={isFilterActive ? '$buttonPrimary' : (isDark ? '#1A1A1A' : '#FFFFFF')}
          borderWidth={1}
          borderColor={isFilterActive ? '$buttonPrimary' : '#E9E9E9'}
          position="relative"
        >
          <FunnelIcon
            width={20}
            height={20}
            color={isFilterActive ? '#000000' : (isDark ? '#FFFFFF' : '#000000')}
          />
          {isFilterActive && (
            <Box
              position="absolute"
              top={-2}
              right={-2}
              bg="$error500"
              width={8}
              height={8}
              borderRadius="$full"
            />
          )}
        </Pressable>
      )}
    </HStack>
  );
};
