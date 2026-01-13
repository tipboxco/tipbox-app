import React, { useCallback } from 'react';
import { Box, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

export type SortOption = 'rarity_asc' | 'rarity_desc';

interface SortOptionItem {
  value: SortOption;
  label: string;
  description: string;
}

const SORT_OPTIONS: SortOptionItem[] = [
  {
    value: 'rarity_desc',
    label: 'Rarity: High to Low',
    description: 'Rare items first',
  },
  {
    value: 'rarity_asc',
    label: 'Rarity: Low to High',
    description: 'Common items first',
  },
];

interface NFTSortBottomSheetProps {
  onClose: () => void;
  onApply: (sortOption: SortOption) => void;
  sortOption: SortOption;
}

export const NFTSortBottomSheet: React.FC<NFTSortBottomSheetProps> = ({
  onClose,
  onApply,
  sortOption,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handleSortSelect = useCallback((newSortOption: SortOption) => {
    onApply(newSortOption);
    onClose();
  }, [onApply, onClose]);

  return (
    <BottomSheetScrollView>
      <VStack px="$4" py="$4" pb="$8" space="lg">
        {/* Header */}
        <HStack alignItems="center" space="md" mb="$2">
          <Pressable onPress={onClose}>
            <ChevronLeftIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
          <HStack flex={1} justifyContent="center" alignItems="center">
            <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
              Sort By Rarity
            </Text>
          </HStack>
          <Box w={24} />
        </HStack>

        {/* Sort Options */}
        <VStack space="sm">
          {SORT_OPTIONS.map((option) => {
            const isSelected = sortOption === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSortSelect(option.value)}
                bg="$backgroundLight0"
                $dark-bg="$backgroundDark800"
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                rounded={8}
                px="$4"
                py="$3"
              >
                <HStack alignItems="center" space="md">
                  {/* Radio Button */}
                  <Box
                    w={24}
                    h={24}
                    rounded="$full"
                    borderWidth={2}
                    borderColor={isSelected ? '#000000' : '#D4D4D4'}
                    $dark-borderColor={isSelected ? '#FFFFFF' : '#666666'}
                    bg={isSelected ? '#000000' : 'transparent'}
                    $dark-bg={isSelected ? '#FFFFFF' : 'transparent'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isSelected && (
                      <Box
                        w={10}
                        h={10}
                        rounded="$full"
                        bg="#FFFFFF"
                        $dark-bg="#000000"
                      />
                    )}
                  </Box>
                  <VStack space="xs" flex={1}>
                    <Text
                      fontSize={14}
                      fontWeight="$semibold"
                      color="$textLight900"
                      $dark-color="$textDark50"
                    >
                      {option.label}
                    </Text>
                    <Text
                      fontSize={11}
                      fontWeight="$normal"
                      color="#9D9D9D"
                      $dark-color="$textDark400"
                    >
                      {option.description}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
            );
          })}
        </VStack>
      </VStack>
    </BottomSheetScrollView>
  );
};
