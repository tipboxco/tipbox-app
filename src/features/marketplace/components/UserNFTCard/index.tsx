import React from 'react';
import { VStack, Text, Pressable, Box, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { UserNFT } from '@/src/mock/marketplace/NFTList/types';

interface UserNFTCardProps {
  data: UserNFT;
  isSelected: boolean;
  onPress: () => void;
}

export const UserNFTCard = ({ data, isSelected, onPress }: UserNFTCardProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Pressable
      bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
      borderRadius={5}
      borderWidth={1}
      borderColor={isSelected ? '#C2E607' : (isDark ? '$backgroundDark200' : '#E9E9E9')}
      p={8}
      onPress={onPress}
    >
      {/* Image Section */}
      <Box
        bg={isDark ? '$backgroundDark700' : 'rgba(0, 0, 0, 0.2)'}
        borderRadius={5}
        height={94}
        width="100%"
        position="relative"
        overflow="hidden"
        mb={8}
      >
        <Image
          style={{
            width: '100%',
            height: '100%',
          }}
          source={data.image}
          alt={data.title}
          borderRadius={5}
          resizeMode="cover"
        />
      </Box>

      {/* Content Section */}
      <VStack space="xs">
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
          {data.username}
        </Text>
      </VStack>
    </Pressable>
  );
};
