import React, { useState } from 'react';
import { HStack, Input, InputField, Pressable, Text, VStack, Box } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

export type NFTType = 'BADGE' | 'COSMETIC' | 'LOOTBOX' | 'ALL';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType?: NFTType;
  onTypeChange?: (type: NFTType) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedType = 'ALL',
  onTypeChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  const nftTypes: { value: NFTType; label: string }[] = [
    { value: 'ALL', label: 'All Types' },
    { value: 'BADGE', label: 'Badge' },
    { value: 'COSMETIC', label: 'Cosmetic' },
    { value: 'LOOTBOX', label: 'Lootbox' },
  ];

  const selectedTypeLabel = nftTypes.find(t => t.value === selectedType)?.label || 'All Types';

  return (
    <VStack space="xs">
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
        {onTypeChange && (
          <Pressable
            onPress={() => setShowTypeFilter(!showTypeFilter)}
            px={12}
            py={6}
            borderRadius={12}
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderWidth={1}
            borderColor="#E9E9E9"
          >
            <HStack alignItems="center" space="xs">
              <Text fontSize="$xs" color={isDark ? '#FFFFFF' : '#000000'}>
                {selectedTypeLabel}
              </Text>
              <Feather
                name={showTypeFilter ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </HStack>
          </Pressable>
        )}
      </HStack>
      
      {showTypeFilter && onTypeChange && (
        <Box
          bg={isDark ? '#2A2A2A' : '#FFFFFF'}
          borderWidth={1}
          borderColor="#E9E9E9"
          borderRadius={12}
          mt={4}
          overflow="hidden"
        >
          {nftTypes.map((type) => (
            <Pressable
              key={type.value}
              onPress={() => {
                onTypeChange(type.value);
                setShowTypeFilter(false);
              }}
              px={16}
              py={12}
              bg={selectedType === type.value ? (isDark ? '#1A1A1A' : '#F2F2F2') : 'transparent'}
            >
              <Text
                fontSize="$sm"
                color={selectedType === type.value ? (isDark ? '#C2E607' : '#000000') : (isDark ? '#FFFFFF' : '#000000')}
                fontWeight={selectedType === type.value ? 'bold' : 'normal'}
              >
                {type.label}
              </Text>
            </Pressable>
          ))}
        </Box>
      )}
    </VStack>
  );
};
