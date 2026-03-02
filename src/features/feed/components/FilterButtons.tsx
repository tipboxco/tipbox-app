/**
 * FilterButtons - Simple filter buttons for FeedScreen
 * Opens GlobalBottomSheet with filter options
 */

import React from 'react';
import { Pressable } from 'react-native';
import { HStack, Box, Text } from '@/src/components/ui';
import { ChevronDownIcon } from 'react-native-heroicons/outline';
import type { FeedFilterParams } from '../api/feedApi';

interface FilterButtonsProps {
  filters: FeedFilterParams;
  onFilterPress: (filterId: 'interest' | 'tag' | 'category' | 'sort') => void;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({ filters, onFilterPress }) => {
  // Get filter count
  const getFilterCount = (filterId: string) => {
    switch (filterId) {
      case 'interest':
        return filters.interests?.length || 0;
      case 'tag':
        return filters.tags?.length || 0;
      case 'category':
        return filters.category ? 1 : 0;
      case 'sort':
        return filters.sort ? 1 : 0;
      default:
        return 0;
    }
  };

  // Render filter button
  const renderFilterButton = (
    filterId: 'interest' | 'tag' | 'category' | 'sort',
    label: string
  ) => {
    const count = getFilterCount(filterId);
    const isActive = count > 0;

    return (
      <Pressable onPress={() => onFilterPress(filterId)}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          gap={5}
          px="$3"
          bg={isActive ? '#E2FF46' : '#FDFDFD'}
          borderWidth={1}
          borderColor={isActive ? '#E2FF46' : '#E9E9E9'}
          borderRadius={10}
          height={26}
        >
          <HStack alignItems="center" space="xs">
            <Text color={isActive ? '#000000' : '#000000'} fontSize="$xs" fontWeight="$semibold">
              {label}
            </Text>
            {count > 0 && (
              <Box
                bg={isActive ? '#000000' : '#E2FF46'}
                borderRadius={9}
                px={6}
                minWidth={18}
                height={18}
                alignItems="center"
                justifyContent="center"
              >
                <Text color={isActive ? '#FFFFFF' : '#000000'} fontSize="$xs" fontWeight="$semibold">
                  {count}
                </Text>
              </Box>
            )}
          </HStack>
          <Box width={12} height={12} alignItems="center" justifyContent="center">
            <ChevronDownIcon width={9} height={9} color={isActive ? '#000000' : '#000000'} />
          </Box>
        </Box>
      </Pressable>
    );
  };

  return (
    <Box px="$4" pb="$2" mt="$2">
      <HStack justifyContent="space-between" alignItems="center">
        <HStack space="sm" alignItems="center">
          {renderFilterButton('interest', 'Interests')}
          {renderFilterButton('tag', 'Tags')}
          {renderFilterButton('category', 'Category')}
        </HStack>
        <Box>{renderFilterButton('sort', 'Sort')}</Box>
      </HStack>
    </Box>
  );
};
