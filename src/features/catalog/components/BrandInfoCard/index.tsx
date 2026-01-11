import React from 'react';
import { HStack, VStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BellIcon } from 'react-native-heroicons/outline';

interface BrandInfoCardProps {
  onNotificationPress?: () => void;
  onHistoryPress?: () => void;
  showPoints?: boolean;
  points?: number;
}

const BrandInfoCard: React.FC<BrandInfoCardProps> = ({
  onNotificationPress,
  onHistoryPress,
  showPoints = false,
  points = 0,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack space="md">
      {/* Product Info Card */}
      <Box
        flex={1}
        bg={isDark ? '#1A1A1A' : '#FDFDFD'}
        borderWidth={1}
        borderColor="#E9E9E9"
        borderRadius={10}
        p="$3"
      >
        <HStack alignItems="center">
          <Box
            width={52}
            height={52}
            borderRadius={5}
            bg="rgba(0, 0, 0, 0.2)"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            <Image
              source={require('@/assets/events/card-icon.png')}
              alt="Apple Logo"
              style={{ width: 52, height: 52 }}
              resizeMode="cover"
            />
          </Box>

          <VStack flex={1} ml="$3">
            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={12}
              fontWeight="$bold"
            >
              Apple
            </Text>
            <Text
              color="#9B9B9B"
              fontSize={12}
              fontWeight="$semibold"
            >
              Technology
            </Text>
          </VStack>

          <Pressable
            onPress={onNotificationPress}
            p="$2"
          >
            <BellIcon width={24} height={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </HStack>
      </Box>

      {/* Brand History Card */}
      <Pressable
        onPress={onHistoryPress}
      >
        <Box
          width={78}
          bg={isDark ? '#1A1A1A' : '#FDFDFD'}
          borderWidth={1}
          borderColor="#E9E9E9"
          borderRadius={10}
          p="$3"
          alignItems="center"
        >
          <VStack alignItems="center" space="xs">
            <Box
              width={26}
              height={26}
              borderRadius={13}
              bg="#DDDDDD"
              borderWidth={2}
              borderColor="#FFFFFF"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
            >
              <Image
                source={require('@/assets/avatar/default-useravatar.png')}
                alt="User Avatar"
                style={{ width: 26, height: 26 }}
                resizeMode="cover"
              />
            </Box>

            <Text
              color={isDark ? '#FFFFFF' : '#000000'}
              fontSize={10}
              fontWeight="$bold"
              textAlign="center"
              numberOfLines={2}
            >
              {showPoints ? `${points}\nPoints` : 'Marka\nGeçmişim'}
            </Text>
          </VStack>
        </Box>
      </Pressable>
    </HStack>
  );
};

export default BrandInfoCard;
