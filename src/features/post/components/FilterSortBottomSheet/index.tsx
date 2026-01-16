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
    initialFilters?.sort || 'newest'
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
    setSelectedSort('newest');
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
  const hasFilters = selectedPostType !== 'All' || selectedSort !== 'newest';

  return (
    <BottomSheetScrollView>
      <Box bg={isDark ? '$backgroundDark950' : '#FDFDFB'} width="100%">
        <VStack px="$4" py="$3" pb="$8" space="md">
          {/* Header */}
          <HStack alignItems="center" justifyContent="center" mb="$1">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Filter / Sort
            </Text>
          </HStack>

          {/* Filter Section */}
          <VStack space="sm">
            <Text
              fontSize={14}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              mb="$1"
            >
              Filter
            </Text>

            <VStack space="xs">
              {postTypeOptions.map((option) => {
                const isSelected = selectedPostType === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handlePostTypeSelect(option.value)}
                    py="$1.5"
                  >
                    <HStack alignItems="center" space="md">
                      {/* Radio Button - Seçili: border siyah, merkez siyah, arası beyaz */}
                      {isSelected ? (
                        <Box
                          w={20}
                          h={20}
                          rounded="$full"
                          borderWidth={2}
                          borderColor="#000000"
                          bg="#FFFFFF"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Box
                            w={8}
                            h={8}
                            rounded="$full"
                            bg="#000000"
                          />
                        </Box>
                      ) : (
                        <Box
                          w={20}
                          h={20}
                          rounded="$full"
                          borderWidth={2}
                          borderColor={isDark ? '#666666' : '#D4D4D4'}
                        />
                      )}
                      <Text
                        fontSize={14}
                        fontWeight="$semibold"
                        color={isSelected ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#999999' : '#666666')}
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
          <VStack space="sm">
            <Text
              fontSize={14}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
              mb="$1"
            >
              Sort
            </Text>

            <VStack space="xs">
              {SORT_OPTIONS.map((option) => {
                const isSelected = selectedSort === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSortSelect(option.value)}
                    py="$1.5"
                  >
                    <HStack alignItems="center" space="md">
                      {/* Radio Button - Seçili: border siyah, merkez siyah, arası beyaz */}
                      {isSelected ? (
                        <Box
                          w={20}
                          h={20}
                          rounded="$full"
                          borderWidth={2}
                          borderColor="#000000"
                          bg="#FFFFFF"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Box
                            w={8}
                            h={8}
                            rounded="$full"
                            bg="#000000"
                          />
                        </Box>
                      ) : (
                        <Box
                          w={20}
                          h={20}
                          rounded="$full"
                          borderWidth={2}
                          borderColor={isDark ? '#666666' : '#D4D4D4'}
                        />
                      )}
                      <Text
                        fontSize={14}
                        fontWeight="$semibold"
                        color={isSelected ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#999999' : '#666666')}
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
          <HStack space="md" mt="$2">
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
              bg="#D8FF08"
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
