import React from 'react';
import { Box, Text, Image, VStack, HStack } from '@gluestack-ui/themed';
import { Collection } from '@/src/mock/profile/collections/types';
import { useColorMode } from '@/src/hooks/useColorMode';

interface CollectionCardProps {
  collection: Collection;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({ collection }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark800' : '$white'}
      borderWidth={1}
      borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
      borderRadius={5}
      w="$48"
      h="$48"
      overflow="hidden"
      position="relative"
    >
      <Image
        source={collection.image}
        alt={collection.title}
        w="$32"
        h="$32"
        resizeMode="contain"
        alignSelf="center"
        mt="$2"
      />

      <Box
        position="absolute"
        top="$2"
        right="$2"
        bg={collection.type === 'rare' ? 'rgba(255, 8, 152, 0.4)' : 'rgba(211, 211, 211, 0.4)'}
        borderWidth={1}
        borderColor={collection.type === 'rare' ? '#EF4F75' : '#D4D4D4'}
        borderRadius={10}
        px="$4"
        py="$1"
      >
        <HStack space="xs" alignItems="center">
          <Box w="$2.5" h="$2.5">
            <Image
              source={require('@/assets/icons/trophy.svg')}
              alt="Trophy"
              w="100%"
              h="100%"
              tintColor={collection.type === 'rare' ? '#AB2847' : isDark ? '$textLight0' : '$textDark0'}
            />
          </Box>
          <Text
            fontSize="$xs"
            color={collection.type === 'rare' ? '#AB2847' : isDark ? '$textLight0' : '$textDark0'}
            fontWeight="$medium"
          >
            {collection.type === 'rare' ? 'Rare' : 'Usual'}
          </Text>
        </HStack>
      </Box>

      <VStack
        position="absolute"
        bottom="$4"
        left="$4"
        right="$4"
        space="xs"
      >
        <Text
          fontSize="$sm"
          color={isDark ? '$textLight0' : '$textDark0'}
          fontWeight="$semibold"
          textAlign="center"
        >
          {collection.title}
        </Text>
      </VStack>
    </Box>
  );
};
