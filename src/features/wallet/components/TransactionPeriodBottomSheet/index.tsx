import React from 'react';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { VStack, HStack, Text, Pressable, Box } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

export type TransactionPeriodValue = 'all' | 'today' | 'yesterday' | 'lastWeek' | 'lastMonth';

interface TransactionPeriodBottomSheetProps {
  value: TransactionPeriodValue;
  onChange: (value: TransactionPeriodValue) => void;
  onClose: () => void;
}

const OPTIONS: Array<{ value: TransactionPeriodValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'lastMonth', label: 'Last Month' },
];

export const TransactionPeriodBottomSheet: React.FC<TransactionPeriodBottomSheetProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const borderColor = isDark ? '$borderDark600' : '$borderLight200';
  const cardBg = isDark ? '$backgroundDark900' : '$backgroundLight0';

  return (
    <BottomSheetScrollView>
      <VStack px="$4" py="$4" pb="$8" space="md">
        <HStack alignItems="center" justifyContent="space-between">
          <Box w={24} />
          <Text fontSize={16} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            Time Range
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>

        <VStack space="sm" mt="$2">
          {OPTIONS.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  onChange(opt.value);
                  onClose();
                }}
              >
                <Box
                  bg={cardBg}
                  $dark-bg={cardBg}
                  borderWidth={1}
                  borderColor={borderColor}
                  $dark-borderColor={borderColor}
                  rounded={10}
                  px="$4"
                  py="$3"
                >
                  <HStack alignItems="center" justifyContent="space-between">
                    <Text
                      fontSize={14}
                      fontWeight={isSelected ? '$bold' : '$medium'}
                      color="$textLight900"
                      $dark-color="$textDark50"
                    >
                      {opt.label}
                    </Text>
                    {isSelected ? (
                      <Feather name="check" size={18} color={isDark ? '#D8FF08' : '#111111'} />
                    ) : (
                      <Box w={18} h={18} />
                    )}
                  </HStack>
                </Box>
              </Pressable>
            );
          })}
        </VStack>
      </VStack>
    </BottomSheetScrollView>
  );
};

