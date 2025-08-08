import React from 'react';
import { Box, HStack, Image, Text, VStack, Button, Icon } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export const ProfileCard = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
      borderRadius="$lg"
      p="$4"
    >
      <VStack space="md">
        {/* Profil Fotoğrafı ve İsim */}
        <VStack alignItems="center" space="sm">
          <Box
            width={80}
            height={80}
            borderRadius="$full"
            overflow="hidden"
            borderWidth={4}
            borderColor="$white"
          >
            <Image
              source={{ uri: 'https://via.placeholder.com/80' }}
              alt="Profil Fotoğrafı"
              width="100%"
              height="100%"
            />
          </Box>
          <VStack alignItems="center" space="xs">
            <Text
              fontSize="$xl"
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              Ozan Mutluoğlu
            </Text>
            <Text
              fontSize="$md"
              color={isDark ? '$textDark400' : '$textLight400'}
            >
              @ozanmutluoglu
            </Text>
          </VStack>
        </VStack>

        {/* Premium Badge */}
        <Box
          bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
          borderRadius="$sm"
          px="$3"
          py="$2"
          alignSelf="center"
        >
          <HStack space="sm" alignItems="center">
            <Icon
              name="star"
              size="sm"
              color={isDark ? '$amber400' : '$amber500'}
            />
            <Text
              fontSize="$sm"
              fontWeight="$semibold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              Premium
            </Text>
          </HStack>
        </Box>

        {/* Düzenle ve Paylaş Butonları */}
        <HStack space="md" justifyContent="center">
          <Button
            variant="outline"
            size="sm"
            flex={1}
            borderColor={isDark ? '$borderDark400' : '$borderLight400'}
          >
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$sm"
              fontWeight="$semibold"
            >
              Profili Düzenle
            </Text>
          </Button>
          <Button
            variant="outline"
            size="sm"
            flex={1}
            borderColor={isDark ? '$borderDark400' : '$borderLight400'}
          >
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize="$sm"
              fontWeight="$semibold"
            >
              Profili Paylaş
            </Text>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};
