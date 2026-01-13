import React from 'react';
import { VStack, HStack, Text, Pressable, Box, Image } from '@gluestack-ui/themed';
import { TouchableOpacity } from 'react-native';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { UserNFTCardData } from '../../types';

interface UserNFTCardProps {
  data: UserNFTCardData;
  isSelected: boolean;
  onPress: () => void;
}

export const UserNFTCard = ({ data, isSelected, onPress }: UserNFTCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const handleSellPress = (e: any) => {
    e?.stopPropagation?.(); // Prevent parent Pressable from triggering
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: isDark ? '#1A1A1A' : '#FDFDFD',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: isDark ? '#2A2A2A' : '#E9E9E9',
      }}
    >
      {/* Image Section */}
      <Box
        borderRadius={5}
        height={157}
        width="100%"
        position="relative"
        overflow="hidden"
        p='$2'
      >
        <Image
          style={{
            width: '100%',
            height: '100%',
          }}
          source={data.image || require('@/assets/inventory/product_01.png')}
          alt={data.title}
          borderRadius={5}
          resizeMode="cover"
        />

        {/* ON SALE Badge - Top Right */}
        {data.isListed && (
          <Box
            position="absolute"
            top={15}
            right={15}
            bg="rgba(194, 230, 7, 0.95)"
            borderRadius={10}
            px={'$2'}
            py={'$1'}
          >
            <Text
              color="#596B00"
              fontSize={8}
              fontWeight="$bold"
            >
              ON SALE
            </Text>
          </Box>
        )}

        {/* Price Badge - Top Left (only if listed) */}
        {data.isListed && data.price && (
          <Box
            position="absolute"
            top={15}
            left={15}
            bg="rgba(0, 0, 0, 0.7)"
            borderRadius={10}
            px={'$2'}
            py={'$1'}
          >
            <Text
              color="#FFFFFF"
              fontSize={10}
              fontWeight="$bold"
            >
              {Math.floor(parseFloat(String(data.price)) || 0)} TIPS
            </Text>
          </Box>
        )}
      </Box>

      {/* Content Section */}
      <VStack space="xs" px='$2' mb={8}>
        <Text
          color={isDark ? '$textDark50' : '#000000'}
          fontSize={10}
          fontWeight="$bold"
          numberOfLines={1}
        >
          {data.title}
        </Text>
        <Text
          color={isDark ? '$textDark400' : '#808080'}
          fontSize={9}
          fontWeight="$semibold"
          numberOfLines={1}
        >
          @{data.username}
        </Text>
      </VStack>

      <Box
        height={1}
        bg={isDark ? '$backgroundDark200' : '#D9D9D9'}
        mb={8}
      />

      {/* Action Button - Only Sell */}
      <HStack px='$2' pb={'$2'}>
        <Pressable
          onPress={handleSellPress}
          bg={data.isListed ? '#CCCCCC' : (isDark ? '$backgroundDark600' : '#E8FF6B')}
          justifyContent="center"
          alignItems="center"
          borderRadius={10}
          borderWidth={1}
          borderColor={data.isListed ? '#B0B0B0' : (isDark ? '$backgroundDark500' : '#D8FF08')}
          py={'$2'}
          flex={1}
          disabled={data.isListed}
          opacity={data.isListed ? 0.5 : 1}
        >
          <Text
            color={data.isListed ? '#666666' : (isDark ? '$textDark50' : '#000000')}
            fontSize={8}
            fontWeight="$bold"
            textAlign="center"
          >
            Sell
          </Text>
        </Pressable>
      </HStack>
    </TouchableOpacity>
  );
};
