import React from 'react';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { ChevronLeft } from 'lucide-react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { Badge, BadgeRarity } from '@/src/mock/profile/badges/types';

interface BadgeDetailProps {
  badge: Badge;
  onClose: () => void;
  hideHeader?: boolean;
}

const getRarityColor = (rarity: BadgeRarity): string => {
  switch (rarity) {
    case 'Usual':
      return '#6B7280';
    case 'Rare':
      return '#EC4899';
    case 'Epic':
      return '#8B5CF6';
    case 'Legendary':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
};

const getBadgeDescription = (badge: Badge): string => {
  // Mock descriptions for badges
  const descriptions: { [key: string]: string } = {
    'Everyday Consumer': 'Awarded to users who consistently make purchases and engage with the marketplace regularly.',
    'Premium Shopper': 'Exclusive badge for users who have made high-value purchases and support premium sellers.',
    'Collector': 'Given to users who have built an impressive collection of verified items.',
    'Wishmaker': 'For users who actively share their wishlists and help others discover new items.',
    'Hardware Expert': 'Recognized experts in hardware authentication and verification.',
    'Early Tech Adopter': 'For users who are always first to discover and collect new tech items.',
    'Community Builder': 'Awarded to users who actively contribute to building the community.',
    'Network Guru': 'For users who have successfully bridged connections between multiple platforms.',
  };
  return descriptions[badge.title] || 'A special badge for outstanding achievement.';
};

const BadgeDetail: React.FC<BadgeDetailProps> = ({ badge, onClose, hideHeader = false }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <VStack space="lg" p={15}>
      {/* Header - Conditionally Rendered */}
      {!hideHeader && (
      <HStack alignItems="center" mb={10}>
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
          {badge.title}
        </Text>
      </HStack>
      )}

      {/* Large Badge Icon */}
      <VStack space="md" alignItems="center" mb={10}>
        <Box
          width={250}
          height={250}
          justifyContent="center"
          alignItems="center"
        >
          <Image
            source={badge.icon}
            alt="Badge"
            style={{
              width: 250,
              height: 250,
            }}
            resizeMode="contain"
          />
        </Box>

        {/* Claim NFT Button */}
        <Pressable
          bg="#E8FF6B"
          px="$8"
          py="$3"
          borderRadius="$full"
        >
          <Text
            fontSize={16}
            fontWeight="$bold"
            color="#000000"
          >
            Claim NFT
          </Text>
        </Pressable>
      </VStack>

      {/* Details Section */}
      <VStack space="sm">
        <Text
          fontSize={14}
          fontWeight="$bold"
          color={isDark ? '$textDark200' : '#000000'}
        >
          Details
        </Text>

        {/* Details Card */}
        <Box
          bg="#F7F7F7"
          borderRadius={8}
          overflow="hidden"
        >
          {/* Kazanma Tarihi */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$3"
            borderBottomWidth={1}
            borderBottomColor="#EBEBEB"
          >
            <Text fontSize={13} color="#8A8A8A">
              Kazanma Tarihi
            </Text>
            <Text fontSize={13} fontWeight="$semibold" color="#000000">
              11 July 2025
            </Text>
          </HStack>

          {/* Enderlik */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$3"
            borderBottomWidth={1}
            borderBottomColor="#EBEBEB"
          >
            <Text fontSize={13} color="#8A8A8A">
              Enderlik
            </Text>
            <HStack space="xs" alignItems="center">
              <Text fontSize={13} color="#000000">
                ◆
              </Text>
              <Text fontSize={13} fontWeight="$semibold" color="#000000">
                {badge.rarity}
              </Text>
            </HStack>
          </HStack>

          {/* Sahip */}
          <HStack
            justifyContent="space-between"
            alignItems="center"
            px="$4"
            py="$3"
          >
            <Text fontSize={13} color="#8A8A8A">
              Sahip
            </Text>
            <Text fontSize={13} fontWeight="$semibold" color="#000000">
              11049
            </Text>
          </HStack>
        </Box>
      </VStack>

      {/* Tasks Section */}
      <VStack space="md">
        <Text color="#8A8A8A" fontSize={12} fontWeight="$bold">
          Tasks
        </Text>
        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderWidth={1}
          borderColor="#E2E2E2"
          p={12}
        >
          <HStack space="md" alignItems="center">
            <Box w={36} h={36} bg="#B9B9B9" borderRadius={4} />
            <VStack flex={1} space="sm">
              <Text fontSize={10} fontWeight="$semibold">
                150 Yorum Yap
              </Text>
              <Box w="100%" h={6} bg="#F7F7F7" borderRadius={10} overflow="hidden">
                <Box
                  w="100%"
                  h="100%"
                  bg="#686868"
                />
              </Box>
            </VStack>
            <Box w={14} h={14} borderRadius={7} bg="#686868" />
          </HStack>
        </Box>
        
        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderWidth={1}
          borderColor="#E2E2E2"
          p={12}
        >
          <HStack space="md" alignItems="center">
            <Box w={36} h={36} bg="#B9B9B9" borderRadius={4} />
            <VStack flex={1} space="sm">
              <Text fontSize={10} fontWeight="$semibold">
                20 Deneyim Paylaş
              </Text>
              <Box w="100%" h={6} bg="#F7F7F7" borderRadius={10} overflow="hidden">
                <Box
                  w="100%"
                  h="100%"
                  bg="#686868"
                />
              </Box>
            </VStack>
            <Box w={14} h={14} borderRadius={7} bg="#686868" />
          </HStack>
        </Box>

        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderWidth={1}
          borderColor="#E2E2E2"
          p={12}
        >
          <HStack space="md" alignItems="center">
            <Box w={36} h={36} bg="#B9B9B9" borderRadius={4} />
            <VStack flex={1} space="sm">
              <Text fontSize={10} fontWeight="$semibold">
                Şunu Yap
              </Text>
              <Box w="100%" h={6} bg="#F7F7F7" borderRadius={10} overflow="hidden">
                <Box
                  w="100%"
                  h="100%"
                  bg="#686868"
                />
              </Box>
            </VStack>
            <Box w={14} h={14} borderRadius={7} bg="#686868" />
          </HStack>
        </Box>

        <Box
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderWidth={1}
          borderColor="#E2E2E2"
          p={12}
        >
          <HStack space="md" alignItems="center">
            <Box w={36} h={36} bg="#B9B9B9" borderRadius={4} />
            <VStack flex={1} space="sm">
              <Text fontSize={10} fontWeight="$semibold">
                Şunu Yap
              </Text>
              <Box w="100%" h={6} bg="#F7F7F7" borderRadius={10} overflow="hidden">
                <Box
                  w="60%"
                  h="100%"
                  bg="#686868"
                />
              </Box>
            </VStack>
          </HStack>
        </Box>
      </VStack>
    </VStack>
  );
};

export default BadgeDetail;

