import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
  Image,
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
        bg={isDark ? '$backgroundDark0' : '#F7F7F7'}
        borderRadius={10}
        p="$4"
      >
        <HStack alignItems="center" justifyContent="space-between" space="md">
          {/* Left: Icon */}
          <Box
            w={40}
            h={40}
            bg={isDark ? '$backgroundDark700' : '$backgroundLight100'}
            borderRadius={8}
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            {data.icon ? (
              typeof data.icon === 'string' ? (
                <Feather
                  name={data.icon as any}
                  size={20}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              ) : (
                <Image
                  source={data.icon}
                  alt="Plan Icon"
                  style={{ width: 40, height: 40 }}
                  resizeMode="cover"
                />
              )
            ) : (
              <Feather
                name="credit-card"
                size={20}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            )}
          </Box>

          {/* Center: Plan Name and Date */}
          <VStack flex={1} space="xs">
            <Text
              fontSize={12}
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              {data.planName}
            </Text>
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '$textLight500'}
            >
              {data.date}
            </Text>
          </VStack>

          {/* Right: Amount and Chevron */}
          <HStack alignItems="center" space="sm">
            <Text
              fontSize={12}
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              {data.amount}
            </Text>
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={isDark ? '#8C8C8C' : '#9CA3AF'}
            />
          </HStack>
        </HStack>

        {/* Expanded Content */}
        {isExpanded && (
          <VStack mt="$3" pt="$3" borderTopWidth={1} borderTopColor={isDark ? '$borderDark600' : '$borderLight200'} space="sm">
            <HStack justifyContent="space-between" alignItems="center">
              <Text
                fontSize={10}
                color={isDark ? '$textDark400' : '$textLight500'}
              >
                Payment Method
              </Text>
              <HStack alignItems="center" space="xs">
                <Feather
                  name="credit-card"
                  size={12}
                  color={isDark ? '#8C8C8C' : '#9CA3AF'}
                />
                <Text
                  fontSize={10}
                  fontWeight="$medium"
                  color={isDark ? '$textDark50' : '$textLight900'}
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

