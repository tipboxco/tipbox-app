import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

export interface BillingHistoryEntryData {
  id: string;
  planName: string;
  date: string;
  amount: string;
  cardLastFour: string;
  icon?: any; // Image source or icon name
}

interface BillingHistoryEntryProps {
  data: BillingHistoryEntryData;
  onPress?: (entryId: string) => void;
}

export const BillingHistoryEntry: React.FC<BillingHistoryEntryProps> = ({ data, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePress = () => {
    setIsExpanded(!isExpanded);
    if (onPress) {
      onPress(data.id);
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <Box
        bg={isDark ? '#1A1A1A' : '#FFFFFF'}
        borderWidth={1}
        borderColor="#B9B9B9"
        borderRadius={10}
        p="$4"
        mb="$3"
      >
        <HStack alignItems="center" justifyContent="space-between">
          {/* Left: Plan Name and Date */}
          <VStack flex={1} space="xs">
            <Text
              fontSize={11}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              {data.planName}
            </Text>
            <Text
              fontSize={10}
              fontWeight="$normal"
              color="#B9B9B9"
            >
              {data.date}
            </Text>
          </VStack>

          {/* Right: Amount and Chevron */}
          <HStack alignItems="center" space="sm">
            <Text
              fontSize={11}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              {data.amount}
            </Text>
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? '#666666' : '#999999'}
            />
          </HStack>
        </HStack>

        {/* Expanded Content */}
        {isExpanded && (
          <VStack mt="$3" pt="$3" borderTopWidth={1} borderTopColor="#B9B9B9" space="sm">
            <HStack justifyContent="space-between" alignItems="center">
              <Text
                fontSize={10}
                fontWeight="$normal"
                color="#B9B9B9"
              >
                Payment Method
              </Text>
              <HStack alignItems="center" space="xs">
                <Feather
                  name="credit-card"
                  size={12}
                  color={isDark ? '#666666' : '#999999'}
                />
                <Text
                  fontSize={10}
                  fontWeight="$medium"
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  •••• {data.cardLastFour}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        )}
      </Box>
    </Pressable>
  );
};

export default BillingHistoryEntry;
