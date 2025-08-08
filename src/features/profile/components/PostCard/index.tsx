import React from 'react';
import { Box, HStack, Image, Text, VStack, Icon, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Heart, MessageCircle, Send, Bookmark, MoreVertical } from 'lucide-react-native';

interface ActionButtonProps {
  icon: typeof Heart | typeof MessageCircle | typeof Send | typeof Bookmark;
  count: string;
  isDark: boolean;
}

const ActionButton = ({ icon: IconComponent, count, isDark }: ActionButtonProps) => (
  <HStack space="xs" alignItems="center">
    <IconComponent 
      size={20}
      color={isDark ? '#A1A1AA' : '#71717A'}
      strokeWidth={2}
    />
    <Text
      fontSize="$sm"
      color={isDark ? '$textDark400' : '$textLight400'}
    >
      {count}
    </Text>
  </HStack>
);

export const PostCard = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box
      bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
      borderRadius="$lg"
      borderWidth={1}
      borderColor={isDark ? '$borderDark100' : '$borderLight200'}
    >
      {/* Üst Kısım - Profil Bilgileri */}
      <HStack p="$4" space="sm" alignItems="center">
        <Box
          width={44}
          height={44}
          borderRadius="$full"
          overflow="hidden"
          borderWidth={2}
          borderColor="$white"
        >
          <Image
            source={{ uri: 'https://via.placeholder.com/44' }}
            alt="Profil Fotoğrafı"
            width={44}
            height={44}
          />
        </Box>
        <VStack flex={1}>
          <Text
            fontSize="$sm"
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Ozan Mutluoğlu
          </Text>
        </VStack>
        <MoreVertical 
          size={20}
          color={isDark ? '#A1A1AA' : '#71717A'}
          strokeWidth={2}
        />
      </HStack>

      {/* Ürün Resmi */}
      <Box width="100%" height={330}>
        <Image
          source={{ uri: 'https://via.placeholder.com/330' }}
          alt="Ürün Fotoğrafı"
          width={330}
          height={330}
        />
      </Box>

      {/* Alt Kısım - Etkileşim Butonları */}
      <VStack p="$4" space="md">
        <HStack justifyContent="space-between">
          <HStack space="lg">
            <ActionButton icon={Heart} count="110" isDark={isDark} />
            <ActionButton icon={MessageCircle} count="32" isDark={isDark} />
            <ActionButton icon={Send} count="11" isDark={isDark} />
          </HStack>
          <ActionButton icon={Bookmark} count="32" isDark={isDark} />
        </HStack>

        {/* İçerik */}
        <VStack space="sm">
          <Text
            fontSize="$md"
            fontWeight="$semibold"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Lorem ipsum Başlık
          </Text>
          <Text
            fontSize="$sm"
            color={isDark ? '$textDark200' : '$textLight700'}
            numberOfLines={3}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud...
          </Text>
        </VStack>

        {/* Etiketler */}
        <HStack space="sm" flexWrap="wrap">
          <Box
            bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
            px="$3"
            py="$1"
            borderRadius="$full"
          >
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark200' : '$textLight700'}
            >
              4-7 Gün
            </Text>
          </Box>
          <Box
            bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
            px="$3"
            py="$1"
            borderRadius="$full"
          >
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark200' : '$textLight700'}
            >
              Daha İyisi Olabilir
            </Text>
          </Box>
          <Box
            bg={isDark ? '$backgroundDark200' : '$backgroundLight200'}
            px="$3"
            py="$1"
            borderRadius="$full"
          >
            <Text
              fontSize="$xs"
              color={isDark ? '$textDark200' : '$textLight700'}
            >
              Günlük Kullanım
            </Text>
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};
