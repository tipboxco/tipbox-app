import React, { useCallback } from 'react';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { mock_ladder_details } from '@/src/mock/profile/laddersDetail';

interface LadderDetailProps {
  ladderId: string;
  onClose: () => void;
}

const LadderDetail: React.FC<LadderDetailProps> = ({ ladderId, onClose }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const ladderDetail = mock_ladder_details[ladderId];

  if (!ladderDetail) {
    return null;
  }

  return (
    <VStack space="lg" p={15}>
      <HStack alignItems="center" mb={20}>
        <Pressable
          onPress={onClose}
          hitSlop={20}
        >
          <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </Pressable>
        <Text
          flex={1}
          textAlign="center"
          fontSize={16}
          fontWeight="$bold"
          color={isDark ? '$textDark50' : '#000'}
          mr={24}
        >
          {ladderDetail.title}
        </Text>
      </HStack>

      <Box
        borderWidth={1}
        borderColor={isDark ? '$borderDark700' : '#E5E5E5'}
        borderRadius={8}
        p={15}
      >
        <HStack space="md" alignItems="center">
          <Box borderRadius={5}>
            <Image
              source={ladderDetail.image}
              alt="Ladder"
              w={80}
              h={80}
              resizeMode="contain"
            />
          </Box>
          <VStack flex={1} space="xs">
            <Text color={isDark ? '$textDark400' : '#666666'} fontSize={12}>
              Description
            </Text>
            <Text color={isDark ? '$textDark200' : '#333333'} fontSize={12} lineHeight={16}>
              {ladderDetail.description}
            </Text>
          </VStack>
        </HStack>
      </Box>

      <HStack space="md">
        {ladderDetail.statistics.map((stat, index) => (
          <Box
            key={index}
            flex={1}
            bg={isDark ? '$backgroundDark900' : '$white'}
            borderWidth={1}
            borderColor="#E2E2E2"
            borderRadius={10}
            p={12}
          >
            <HStack alignItems="center" space="sm">
              <Box
                w={28}
                h={28}
                borderWidth={1}
                borderColor="#B9B9B9"
                borderRadius={20}
                justifyContent="center"
                alignItems="center"
              >
                <stat.icon size={16} color="#B9B9B9" />
              </Box>
              <Text fontSize={11} fontWeight="$bold">
                {stat.title}
              </Text>
            </HStack>
            <Box h={1} bg="#D9D9D9" my={10}  />
              <HStack alignItems="flex-end" space="xs">
                <Text fontSize={24} fontWeight="$bold" color={isDark ? '$textDark50' : '#000'}>
                  {stat.value}
                </Text>
                <VStack mb={1} ml={5}>
                  <Text fontSize={11} fontWeight="$bold">
                    Complete
                  </Text>
                  <Text fontSize={10} color={isDark ? '$textDark400' : '#666666'}>
                    of {stat.description}
                  </Text>
                </VStack>
              </HStack>
          </Box>
        ))}

        {ladderDetail.rewards.map((reward, index) => (
          <Box
            key={index}
            flex={1}
            bg={isDark ? '$backgroundDark900' : '$white'}
            borderWidth={1}
            borderColor="#E2E2E2"
            borderRadius={10}
            p={12}
          >
            <HStack alignItems="center" space="sm">
              <Box
                w={28}
                h={28}
                borderWidth={1}
                borderColor="#B9B9B9"
                borderRadius={20}
                justifyContent="center"
                alignItems="center"
              >
                <reward.icon size={16} color="#B9B9B9" />
              </Box>
              <Text fontSize={11} fontWeight="$bold">
                Rewards
              </Text>
            </HStack>
            <Box h={1} bg="#D9D9D9" my={10} />
            <HStack alignItems="center" space="sm">
              <Image source={reward.image} alt={reward.title} w={40} h={40} />
              <Text fontSize={10} fontWeight="$semibold">
                {reward.title}
              </Text>
            </HStack>
          </Box>
        ))}
      </HStack>

      <VStack space="md">
        <Text color="#8A8A8A" fontSize={12} fontWeight="$bold">
          Tasks
        </Text>
        {ladderDetail.tasks.map((task) => (
          <Box
            key={task.id}
            bg={isDark ? '$backgroundDark900' : '$white'}
            borderWidth={1}
            borderColor="#E2E2E2"
            p={12}
          >
            <HStack space="md" alignItems="center">
              <Box w={36} h={36} bg="#B9B9B9" borderRadius={4} />
              <VStack flex={1} space="sm">
                <Text fontSize={10} fontWeight="$semibold">
                  {task.title}
                </Text>
                <Box w="100%" h={6} bg="#F7F7F7" borderRadius={10} overflow="hidden">
                  <Box
                    w={`${(task.progress.current / task.progress.total) * 100}%`}
                    h="100%"
                    bg="#686868"
                  />
                </Box>
              </VStack>
              {task.isCompleted && (
                <Box w={14} h={14} borderRadius={7} bg="#686868" />
              )}
            </HStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
};

export default LadderDetail;
