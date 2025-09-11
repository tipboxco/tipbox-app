import React from 'react';
import { ScrollView } from 'react-native';
import { VStack, HStack, Text, Image, Box, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { mock_inventory } from '@/src/mock/inventory';

const InventoryDetailScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const route = useRoute();
  const { itemId } = route.params as { itemId: string };

  const item = mock_inventory
    .flatMap(group => group.items)
    .find(item => item.id === itemId);

  if (!item) {
    return null;
  }

  return (
    <VStack flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <HStack alignItems="center" px={15} py={10}>
        <Pressable onPress={() => navigation.goBack()}>
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
          Product Details
        </Text>
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack space="lg" p={15}>
          <Box
            bg={isDark ? '$backgroundDark800' : '$white'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
            borderRadius={10}
            p={20}
            alignItems="center"
          >
            <Image
              source={item.image}
              alt={`${item.brand} ${item.model}`}
              w="80%"
              h={200}
              resizeMode="contain"
            />
          </Box>

          <VStack space="md">
            <Text
              fontSize={20}
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '#000'}
            >
              {item.brand}
            </Text>
            <Text
              fontSize={16}
              color={isDark ? '$textDark200' : '#333'}
            >
              {item.model}
            </Text>
            <Text
              fontSize={14}
              color={isDark ? '$textDark400' : '#666'}
            >
              {item.specs}
            </Text>
          </VStack>
        </VStack>
      </ScrollView>
    </VStack>
  );
};

export default InventoryDetailScreen;
