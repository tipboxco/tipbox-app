import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  ScrollView,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  getPostTypeFilterOptions,
  getAllowedPostTypesForContext,
  SORT_OPTIONS,
} from '../../utils/postTypeMapping';

export interface FilterSortState {
  postType?: string; // 'All', 'Generals', 'Tips & Tricks', 'Questions', 'Reviews', 'Benchmarks', 'Updates'
  sort?: 'newest' | 'oldest' | 'popular';
}

interface FilterSortBottomSheetProps {
  contextType: 'sub_category' | 'product_group' | 'product';
  initialFilters?: FilterSortState;
  onFilterChange: (filters: FilterSortState) => void;
  onClose: () => void;
}

export const FilterSortBottomSheet: React.FC<FilterSortBottomSheetProps> = ({
  contextType,
  initialFilters,
  onFilterChange,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // State
  const [selectedPostType, setSelectedPostType] = useState<string>(
    initialFilters?.postType || 'All'
  );
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest' | 'popular' | undefined>(
    initialFilters?.sort
  );

  // Get available post types for context
  const postTypeOptions = useMemo(() => {
    return getPostTypeFilterOptions(contextType);
  }, [contextType]);

  // Handle post type selection (radio button - single selection)
  const handlePostTypeSelect = useCallback((postType: string) => {
    setSelectedPostType(postType);
  }, []);

  // Handle sort selection (radio button - single selection)
  const handleSortSelect = useCallback((sort: 'newest' | 'oldest' | 'popular') => {
    setSelectedSort(selectedSort === sort ? undefined : sort);
  }, [selectedSort]);

  // Handle reset
  const handleReset = useCallback(() => {
    setSelectedPostType('All');
    setSelectedSort(undefined);
  }, []);

  // Handle done
  const handleDone = useCallback(() => {
    onFilterChange({
      postType: selectedPostType === 'All' ? undefined : selectedPostType,
      sort: selectedSort,
    });
    onClose();
  }, [selectedPostType, selectedSort, onFilterChange, onClose]);

  // Check if any filters are applied
  const hasFilters = selectedPostType !== 'All' || selectedSort !== undefined;

  return (
    <BottomSheetScrollView>
      <Box bg={isDark ? '$backgroundDark950' : '#FDFDFB'} minHeight={400} width="100%">
        <VStack px="$4" py="$4" pb="$8" space="lg">
          {/* Header */}
          <HStack alignItems="center" space="md" mb="$2">
            <Pressable onPress={onClose}>
              <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </Pressable>
            <HStack flex={1} justifyContent="center" alignItems="center">
              <Text
                fontSize={16}
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
              >
                Filter / Sort
              </Text>
            </HStack>
            <Box w={24} />
          </HStack>

          {/* Filter Section */}
          <VStack space="md">
            <Text
              fontSize={14}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              mb="$2"
            >
              Filter
            </Text>

            <VStack space="sm">
              {postTypeOptions.map((option) => {
                const isSelected = selectedPostType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handlePostTypeSelect(option.value)}
                    bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                    borderWidth={1}
                    borderColor={isSelected ? '#C2E607' : (isDark ? '#444444' : '#E9E9E9')}
                    rounded={8}
                    px="$4"
                    py="$3"
                  >
                    <HStack alignItems="center" space="md">
                      {/* Radio Button */}
                      <Box
                        w={20}
                        h={20}
                        rounded="$full"
                        borderWidth={2}
                        borderColor={isSelected ? '#C2E607' : (isDark ? '#666666' : '#D4D4D4')}
                        bg={isSelected ? '#C2E607' : 'transparent'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isSelected && (
                          <Box
                            w={8}
                            h={8}
                            rounded="$full"
                            bg={isDark ? '#000000' : '#000000'}
                          />
                        )}
                      </Box>
                      <Text
                        fontSize={14}
                        fontWeight={isSelected ? '$bold' : '$medium'}
                        color={isDark ? '#FFFFFF' : '#000000'}
                      >
                        {option.label}
                      </Text>
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>
          </VStack>

          {/* Sort Section */}
          <VStack space="md">
            <Text
              fontSize={14}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              mb="$2"
            >
              Sort
            </Text>

            <VStack space="sm">
              {SORT_OPTIONS.map((option) => {
                const isSelected = selectedSort === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSortSelect(option.value)}
                    bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                    borderWidth={1}
                    borderColor={isSelected ? '#C2E607' : (isDark ? '#444444' : '#E9E9E9')}
                    rounded={8}
                    px="$4"
                    py="$3"
                  >
                    <HStack alignItems="center" space="md">
                      {/* Radio Button */}
                      <Box
                        w={20}
                        h={20}
                        rounded="$full"
                        borderWidth={2}
                        borderColor={isSelected ? '#C2E607' : (isDark ? '#666666' : '#D4D4D4')}
                        bg={isSelected ? '#C2E607' : 'transparent'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isSelected && (
                          <Box
                            w={8}
                            h={8}
                            rounded="$full"
                            bg={isDark ? '#000000' : '#000000'}
                          />
                        )}
                      </Box>
                      <Text
                        fontSize={14}
                        fontWeight={isSelected ? '$bold' : '$medium'}
                        color={isDark ? '#FFFFFF' : '#000000'}
                      >
                        {option.label}
                      </Text>
                    </HStack>
                  </Pressable>
                );
              })}
            </VStack>
          </VStack>

          {/* Action Buttons */}
          <HStack space="md" mt="$4">
            <Button
              flex={1}
              variant="outline"
              bg={isDark ? 'transparent' : 'transparent'}
              borderWidth={1}
              borderColor={isDark ? '#444444' : '#E9E9E9'}
              onPress={handleReset}
              disabled={!hasFilters}
            >
              <ButtonText
                color={isDark ? (hasFilters ? '#FFFFFF' : '#666666') : (hasFilters ? '#000000' : '#999999')}
                fontSize={14}
                fontWeight="$semibold"
              >
                Reset
              </ButtonText>
            </Button>
            <Button
              flex={1}
              bg="#C2E607"
              onPress={handleDone}
            >
              <ButtonText
                color="#000000"
                fontSize={14}
                fontWeight="$bold"
              >
                Done
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </BottomSheetScrollView>
  );
};
