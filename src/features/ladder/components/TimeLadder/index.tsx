import React from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Zap, Timer } from 'lucide-react-native';
import { TimeLadderProps } from '../../types';

export const TimeLadder: React.FC<TimeLadderProps> = ({
  item,
  remainingTime,
  userScore,
  rank,
  topUsers,
  onDetailPress,
  onPress,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  return (
    <Pressable
      onPress={onPress}
    >
      <Box
        borderWidth={1}
        borderColor="$lime500"
        bg={isDark ? '$backgroundDark900' : '$white'}
        borderRadius={10}
        p={12}
      >
      <HStack justifyContent="space-between" alignItems="center" mb={4}>
        {/* Limited Time Badge */}
        <HStack
          bg="$lime500"
          borderRadius={8}
          px={5}
          py={4}
          alignItems="center"
          justifyContent="center"
          space="sm"
        >
          <Zap 
            size={14}
            color={isDark ? '#ffffff' : '#000000'}
            strokeWidth={2}
          />
          <Text 
            color={isDark ? '$textDark50' : '$textLight900'} 
            fontWeight="$600" 
            fontSize={9}
          >
            Limited Time
          </Text>
        </HStack>

        {/* Remaining Time */}
        <HStack alignItems="center" space="sm">
                      <Text color={isDark ? '$textDark50' : '$textLight900'} fontWeight="$600" fontSize="$xs">
              {remainingTime}
            </Text>
            <Timer size={18} color={isDark ? '#686868' : '#686868'} />
        </HStack>
      </HStack>

      {/* Content */}
      <VStack space="md" mt={4}>
        <HStack space="md" alignItems="flex-start">
          <Image
            source={{ uri: item.image }}
            alt="task image"
            width={60}
            height={60}
            borderRadius={5}
          />
          <VStack space="sm" flex={1}>
            <Text 
              color={isDark ? '$textDark50' : '$textLight900'}
              fontWeight="$700" 
              fontSize={12}
            >
              {item.title}
            </Text>
            <Text 
              color={isDark ? '$textDark200' : '$textLight800'} 
              fontSize={9} 
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </VStack>
        </HStack>

        {/* Score Card */}
        <Box 
          bg={isDark ? '$backgroundDark800' : '$backgroundLight100'} 
          borderRadius={4} 
          p={9}
        >
          <HStack space="md" alignItems="center">
            <Image
              source={{ 
                uri: item.userProgress?.avatar || 'https://i.pravatar.cc/100?img=0'
              }}
              alt="user avatar"
              width={34}
              height={34}
              borderRadius={17}
            />
            <VStack>
              <Text 
                color={isDark ? '$textDark400' : '$textLight500'} 
                fontWeight="$600" 
                fontSize={9}
              >
                Your Score
              </Text>
              <Text 
                color={isDark ? '$textDark50' : '$textLight900'} 
                fontWeight="$600" 
                fontSize={11}
              >
                {userScore} Points
              </Text>
            </VStack>
            <Text
              fontWeight="$600"
              fontSize={11}
              position="absolute"
              right={11}
            >
              #{rank}
            </Text>
          </HStack>
        </Box>

        {/* Bottom Actions */}
        <HStack justifyContent="space-between" alignItems="center">
          {/* Top Users */}
          <HStack space="sm">
            {topUsers.map((user, index) => (
              <Box key={user.id} position="relative">
                <Image
                  source={{ uri: user.avatar }}
                  alt={`rank ${index + 1}`}
                  width={26}
                  height={26}
                  borderRadius={13}
                  borderWidth={1}
                  borderColor={
                    index === 0
                      ? '$yellow500'
                      : index === 1
                      ? '$gray400'
                      : '$brown500'
                  }
                />
                <Box
                  position="absolute"
                  bottom={0}
                  right={0}
                  bg={
                    index === 0
                      ? '$yellow500'
                      : index === 1
                      ? '$gray400'
                      : '$brown500'
                  }
                  borderRadius={20}
                  width={11}
                  height={11}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="$white" fontSize={6} fontWeight="$600">
                    {index + 1}
                  </Text>
                </Box>
              </Box>
            ))}
          </HStack>

          {/* View Detail Button */}
          <Pressable
            onPress={onDetailPress}
            bg={isDark ? '$backgroundDark800' : '$backgroundLight100'}
            borderRadius={8}
            px={16}
            py={8}
          >
            <Text 
              color={isDark ? '$textDark50' : '$textLight900'} 
              fontSize={10} 
              fontWeight="$600"
            >
              View Detail
            </Text>
          </Pressable>
        </HStack>
      </VStack>
    </Box>
    </Pressable>
  );
};
