import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text, VStack, HStack, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { WishlistItem } from '../../types';

interface WishlistCardProps {
  item: WishlistItem;
  onPress?: () => void;
}

export const WishlistCard: React.FC<WishlistCardProps> = ({ item, onPress }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable onPress={onPress}>
      <Box
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
        borderWidth={1}
        borderColor={isDark ? '$borderDark900' : '$borderLight200'}
        borderRadius="$lg"
      >
        <HStack p="$3" space="md">
          {/* Image */}
          <Box
            width={100}
            height={100}
            borderRadius="$lg"
            overflow="hidden"
            borderWidth={1}
            borderColor={isDark ? '$borderDark100' : '$borderLight200'}
          >
            <Image
              source={item.image}
              alt={item.title}
              width={100}
              height={100}
              resizeMode="cover"
            />
          </Box>

          {/* Content */}
          <VStack flex={1} space="xs">
            <HStack justifyContent="space-between" alignItems="flex-start">
              <VStack flex={1} space="sm">
                <Text
                  fontSize={8}
                  color={isDark ? '$textDark400' : '$textLight500'}
                >
                  {item.date} - {item.itemCount} Item
                </Text>
                <Text
                  fontSize={14}
                  fontWeight="$bold"
                  color={isDark ? '$textDark50' : '$textLight900'}
                >
                  {item.title}
                </Text>
                <Text
                  fontSize={9}
                  color={isDark ? '$textDark400' : '$textLight500'}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              </VStack>
              <Pressable>
                <Box p="$1">
                  <Feather
                    name="more-horizontal"
                    size={18}
                    color={isDark ? '#666666' : '#B0B0B0'}
                  />
                </Box>
              </Pressable>
            </HStack>

            <Box
              bg={item.badgeColor}
              borderWidth={1}
              borderColor={item.badgeBorderColor}
              borderRadius="$lg"
              px="$2"
              py="$1"
              alignSelf="flex-start"
              mt="$2"
            >
              <Text fontSize={8} color="#000000">
                {item.itemCount} Item
              </Text>
            </Box>
          </VStack>
        </HStack>
      </Box>
    </Pressable>
  );
};