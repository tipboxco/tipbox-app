import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Tag, Package, Star, Layers } from 'lucide-react-native';
import { VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';

import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { mock_inventory } from '@/src/mock/inventory';
import { ProfileStackParamList } from '../navigation';

const InventoryDetailScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'InventoryDetail'>>();
  const { itemId } = route.params as { itemId: string };

  const item = mock_inventory
    .flatMap(group => group.items)
    .find(item => item.id === itemId);

  if (!item) {
    return null;
  }

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={12}
        fill={index < count ? '#829905' : 'transparent'}
        color={index < count ? '#829905' : '#7E7E7E'}
        strokeWidth={0.5}
      />
    ));
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
    <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
      <Header
        title="Product Details"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: isDark ? '#000000' : '#FFFFFF' 
      }}
      showsVerticalScrollIndicator={false}
    >
      <VStack space="lg" p={15}>
        {/* Product Image and Title */}
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={5}
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
          <VStack space="xs" alignItems="center" mt={15}>
            <Text
              fontSize={14}
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '#A3A3A3'}
              textAlign="center"
            >
              {item.brand}\n{item.model}
            </Text>
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '#A3A3A3'}
              textAlign="center"
            >
              {item.specs}
            </Text>
          </VStack>
        </Box>

        {/* Reviews */}
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={5}
          p={15}
        >
          {/* Price Review */}
          <VStack space="sm">
            <HStack alignItems="center" space="sm">
              <Tag size={16} color={isDark ? '#3B3B3B' : '#3B3B3B'} />
              <Text
                fontSize={11}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '#3B3B3B'}
              >
                Price and Shopping Experience
              </Text>
            </HStack>
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '#343434'}
              lineHeight={14}
              ml={18}
            >
              {item.reviews?.price.text}
            </Text>
            <HStack space="xs" ml={18}>
              {renderStars(item.reviews?.price.rating || 0)}
            </HStack>
          </VStack>

          <Box h={1} bg={isDark ? '$borderDark700' : '#E9E9E9'} my={15} />

          {/* Product Review */}
          <VStack space="sm">
            <HStack alignItems="center" space="sm">
              <Package size={16} color={isDark ? '#3B3B3B' : '#3B3B3B'} />
              <Text
                fontSize={11}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '#3B3B3B'}
              >
                Product and Usage Experience
              </Text>
            </HStack>
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '#343434'}
              lineHeight={14}
              ml={18}
            >
              {item.reviews?.product.text}
            </Text>
            <HStack space="xs" ml={18}>
              {renderStars(item.reviews?.product.rating || 0)}
            </HStack>
          </VStack>
        </Box>

        {/* Features */}
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={5}
          py={15}
        >
          <VStack space="lg" w="100%" px={15}>
            <HStack alignItems="center" w="100%">
              <Box w={24} h={24} justifyContent="center" alignItems="center">
                <Layers size={16} color="#536471" strokeWidth={1.5} />
              </Box>
              <Text
                fontSize={11}
                fontWeight="$medium"
                color={isDark ? '$textDark400' : '#6D6D6D'}
                ml={4}
              >
                {item.features?.warranty}
              </Text>
            </HStack>

            <HStack alignItems="center" w="100%">
              <Box w={24} h={24} justifyContent="center" alignItems="center">
                <Layers size={16} color="#536471" strokeWidth={1.5} />
              </Box>
              <Text
                fontSize={11}
                fontWeight="$medium"
                color={isDark ? '$textDark400' : '#6D6D6D'}
                ml={4}
              >
                {item.features?.delivery}
              </Text>
            </HStack>

            <HStack alignItems="center" w="100%">
              <Box w={24} h={24} justifyContent="center" alignItems="center">
                <Layers size={16} color="#536471" strokeWidth={1.5} />
              </Box>
              <Text
                fontSize={11}
                fontWeight="$medium"
                color={isDark ? '$textDark400' : '#6D6D6D'}
                ml={4}
              >
                {item.features?.quality}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </VStack>
    </ScrollView>
    </VStack>
    </SafeAreaView>
  );
};

export default InventoryDetailScreen;
