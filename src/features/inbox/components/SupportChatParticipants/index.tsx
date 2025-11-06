import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
} from '@gluestack-ui/themed';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';

interface SupportChatParticipantsProps {
  user1Name: string;
  user1Title: string;
  user1Avatar: any;
  user2Name: string;
  user2Title: string;
  user2Avatar: any;
  supportTitle?: string;
  tipsAmount?: number;
  category?: string;
  requestDetails?: string;
  attachments?: string[];
}

export const SupportChatParticipants: React.FC<SupportChatParticipantsProps> = ({
  user1Name,
  user1Title,
  user1Avatar,
  user2Name,
  user2Title,
  user2Avatar,
  supportTitle = 'Smartwatches',
  tipsAmount = 50,
  category = 'Product Authentication',
  requestDetails = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolorem fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  attachments = ['photo1.jpg', 'photo2.jpg'],
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <VStack
      mx="$4"
      mt="$3"
      mb="$3"
      bg={isDark ? '$backgroundDark900' : '$white'}
      borderRadius="$2xl"
      borderWidth={1}
      borderColor={isDark ? '$borderDark800' : '$borderLight200'}
      sx={{
        shadowColor: '$black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Users Section */}
      <HStack alignItems="center" justifyContent="space-between" px="$3" py="$3">
        {/* Left User */}
        <HStack alignItems="center" space="sm" flex={1}>
          <Image
            source={user1Avatar}
            alt={user1Name}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
            }}
          />
          <VStack flex={1}>
            <Text
              color={isDark ? '$textDark50' : '$textLight950'}
              fontSize={10}
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {user1Name}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={9}
              numberOfLines={1}
            >
              {user1Title}
            </Text>
          </VStack>
        </HStack>

        {/* Center Icon */}
        <Box
          bg={isDark ? '$backgroundDark800' : '#F3F4F6'}
          p="$2"
          borderRadius="$full"
          mx="$2"
        >
          <Feather
            name="repeat"
            size={20}
            color={isDark ? '#A0AEC0' : '#9CA3AF'}
          />
        </Box>

        {/* Right User */}
        <HStack alignItems="center" space="sm" flex={1} justifyContent="flex-end">
          <VStack alignItems="flex-end" flex={1}>
            <Text
              color={isDark ? '$textDark50' : '$textLight950'}
              fontSize={10}
              fontWeight="$semibold"
              numberOfLines={1}
            >
              {user2Name}
            </Text>
            <Text
              color={isDark ? '$textDark400' : '$textLight500'}
              fontSize={9}
              numberOfLines={1}
            >
              {user2Title}
            </Text>
          </VStack>
          <Image
            source={user2Avatar}
            alt={user2Name}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
            }}
          />
        </HStack>
      </HStack>

      <Box height={1} bg={isDark ? '$borderDark800' : '$borderLight200'} width="100%"></Box>

      {/* Support Title and TIPS Amount Section */}
      <Pressable onPress={toggleExpanded}>
        <HStack
          px="$3"
          py="$3"
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Support Title with Icon */}
          <HStack space="xs" alignItems="center" flex={1}>
            <Box
              bg={isDark ? '$backgroundDark800' : '#F3F4F6'}
              p="$2"
              borderRadius="$full"
            >
              <Feather
                name="help-circle"
                size={16}
                color={isDark ? '#A0AEC0' : '#4A5568'}
              />
            </Box>
            <Text
              color={isDark ? '$textDark50' : '$textLight950'}
              fontSize={11}
              fontWeight="$semibold"
            >
              {supportTitle}
            </Text>
          </HStack>

          {/* TIPS Amount */}
          <HStack space="xs" alignItems="center">
            <Text
              color="#000000"
              fontSize={12}
              fontWeight="$bold"
            >
              {tipsAmount} TIPS
            </Text>
            <Feather
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={isDark ? '#A0AEC0' : '#4A5568'}
            />
          </HStack>
        </HStack>
      </Pressable>

      {/* Expanded Details Section */}
      {isExpanded && (
        <VStack px="$3" pb="$3" space="sm">
          {/* Request Details */}
          <VStack space="xs" mt="$1">
            <Text
              fontSize={10}
              fontWeight="$normal"
              color={isDark ? '#CCCCCC' : '#666666'}
              lineHeight={15}
            >
              {requestDetails}
            </Text>
          </VStack>
        </VStack>
      )}
    </VStack>
  );
};

export default SupportChatParticipants;

