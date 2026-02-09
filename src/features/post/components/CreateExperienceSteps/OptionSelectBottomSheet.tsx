import React from 'react';
import { Box, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export interface OptionSelectBottomSheetOption {
  label: string;
  value: string;
}

interface OptionSelectBottomSheetProps {
  title: string;
  options: OptionSelectBottomSheetOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

/**
 * Single-option select bottom sheet, same style as FilterSortBottomSheet.
 * Tap an option to select and close.
 */
export const OptionSelectBottomSheet: React.FC<OptionSelectBottomSheetProps> = ({
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Box bg={isDark ? '$backgroundDark950' : '#FDFDFB'} width="100%">
      <VStack px="$4" py="$3" pb="$8" space="md">
        <HStack alignItems="center" justifyContent="center" mb="$1">
          <Text
            fontSize={16}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            {title}
          </Text>
        </HStack>

        <VStack space="xs">
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                py="$2"
              >
                <HStack alignItems="center" space="md">
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
    </Box>
  );
};
