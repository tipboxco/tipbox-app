import React from 'react';
import { Box, HStack, VStack, Text, Pressable } from '@gluestack-ui/themed';
import { DocumentDuplicateIcon } from 'react-native-heroicons/outline';

interface HistoryCardProps {
  type: string;
  description: string;
  amount: string;
  amountColor?: string;
  date?: string;
  icon?: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  onCopyPress?: () => void;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  type,
  description,
  amount,
  amountColor = '#3CA241',
  date,
  icon,
  onCopyPress,
}) => {
  return (
    <Box
      bg="$backgroundLight0"
      $dark-bg="$backgroundDark900"
      borderWidth={1}
      borderColor="$borderLight200"
      $dark-borderColor="$borderDark600"
      rounded={5}
      p="$4"
    >
      <HStack alignItems="center" space="md">
        <Box w={42} h={42} rounded={6} bg="$backgroundLight200" />
        <VStack flex={1}>
          <Text fontSize={12} fontWeight="$bold" color="$textLight900" $dark-color="$textDark50">
            {type}
          </Text>
          <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
            {description}
          </Text>
          {date && (
            <HStack space="sm" alignItems="center" mt="$1">
              <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
                İşlem Tarihi:
              </Text>
              <Text fontSize={9} color="$textLight500" $dark-color="$textDark400">
                {date}
              </Text>
            </HStack>
          )}
        </VStack>
        <VStack alignItems="flex-end" space="xs">
          <Text fontSize={12} fontWeight="$bold" color={amountColor}>
            {amount}
          </Text>
          {onCopyPress && (
            <Pressable onPress={onCopyPress}>
              <DocumentDuplicateIcon width={12} height={12} color="#000000" />
            </Pressable>
          )}
        </VStack>
      </HStack>
    </Box>
  );
};

