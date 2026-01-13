import React, { useCallback } from 'react';
import { Box, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { ChevronLeftIcon } from 'react-native-heroicons/outline';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface NFTFilterBottomSheetProps {
  onClose: () => void;
  onApply: (selectedTypes: string[]) => void;
  availableTypes: string[];
  selectedTypes: string[];
}

export const NFTFilterBottomSheet: React.FC<NFTFilterBottomSheetProps> = ({
  onClose,
  onApply,
  availableTypes,
  selectedTypes,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handleTypeToggle = useCallback((type: string) => {
    const newSelectedTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    onApply(newSelectedTypes);
    onClose();
  }, [selectedTypes, onApply, onClose]);

  const handleReset = useCallback(() => {
    onApply([]);
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
              Type Filter
            </Text>
          </HStack>
          <Box w={24} />
        </HStack>

        {/* Filter Section - Type */}
        <VStack space="sm">
          {availableTypes.map((type) => {
            const isSelected = selectedTypes.includes(type);
            return (
              <Pressable
                key={type}
                onPress={() => handleTypeToggle(type)}
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
                  <Text
                    fontSize={14}
                    fontWeight="$semibold"
                    color="$textLight900"
                    $dark-color="$textDark50"
                  >
                    {type}
                  </Text>
                </HStack>
              </Pressable>
            );
          })}
        </VStack>

        {/* Reset Button */}
        {selectedTypes.length > 0 && (
          <Pressable
            onPress={handleReset}
            bg="#F5F5F5"
            $dark-bg="$backgroundDark700"
            borderWidth={1}
            borderColor="#E9E9E9"
            $dark-borderColor="$borderDark600"
            rounded={8}
            py="$3"
            mt="$2"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize={14} fontWeight="$bold" color="#9E9E9E" $dark-color="$textDark400" textAlign="center">
              Reset
            </Text>
          </Pressable>
        )}
      </VStack>
    </BottomSheetScrollView>
  );
};
