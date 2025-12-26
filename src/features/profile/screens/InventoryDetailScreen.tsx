import React from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Tag, Package, Star, Layers } from 'lucide-react-native';
import { VStack, HStack, Text, Image, Box } from '@gluestack-ui/themed';

import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { useInventory } from '../api/hooks';
import { toImageSource } from '@/src/utils';
import { ProfileStackParamList } from '../navigation';

const InventoryDetailScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, 'InventoryDetail'>>();
  const { itemId } = route.params as { itemId: string };

  // API'den inventory listesini al
  const { data: inventoryItems, isLoading, error } = useInventory();

  // itemId'ye göre item'ı bul
  const item = inventoryItems?.find((item) => item.id === itemId);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'} justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        </VStack>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !item) {
    return (
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <VStack flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
          <Header
            title="Product Details"
            showBackButton
            onBackPress={() => navigation.goBack()}
          />
          <VStack flex={1} justifyContent="center" alignItems="center" p={20}>
            <Text
              fontSize={14}
              color={isDark ? '$textDark400' : '#6D6D6D'}
              textAlign="center"
            >
              {error ? 'Ürün bilgisi yüklenirken bir hata oluştu.' : 'Ürün bulunamadı.'}
            </Text>
          </VStack>
        </VStack>
      </SafeAreaView>
    );
  }

  // API'den gelen reviews array'ini formatla
  // İlk review'u "Price and Shopping Experience" olarak, ikinci review'u "Product and Usage Experience" olarak kullan
  const priceReview = item.reviews && item.reviews.length > 0 ? item.reviews[0] : null;
  const productReview = item.reviews && item.reviews.length > 1 ? item.reviews[1] : null;

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
            source={toImageSource(item.image) || require('@/assets/inventory/product_01.png')}
            alt={`${item.brand.name} ${item.brand.model}`}
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
              {item.brand.name}{'\n'}{item.brand.model}
            </Text>
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '#A3A3A3'}
              textAlign="center"
            >
              {item.brand.specs}
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
          {priceReview && (
            <VStack space="sm">
              <HStack alignItems="center" space="sm">
                <Tag size={16} color={isDark ? '#3B3B3B' : '#3B3B3B'} />
                <Text
                  fontSize={11}
                  fontWeight="$semibold"
                  color={isDark ? '$textDark50' : '#3B3B3B'}
                >
                  {priceReview.title || 'Price and Shopping Experience'}
                </Text>
              </HStack>
              <Text
                fontSize={10}
                color={isDark ? '$textDark400' : '#343434'}
                lineHeight={14}
                ml={18}
              >
                {priceReview.description}
              </Text>
              <HStack space="xs" ml={18}>
                {renderStars(priceReview.rating || 0)}
              </HStack>
            </VStack>
          )}

          {priceReview && productReview && (
            <Box h={1} bg={isDark ? '$borderDark700' : '#E9E9E9'} my={15} />
          )}

          {/* Product Review */}
          {productReview && (
            <VStack space="sm">
              <HStack alignItems="center" space="sm">
                <Package size={16} color={isDark ? '#3B3B3B' : '#3B3B3B'} />
                <Text
                  fontSize={11}
                  fontWeight="$semibold"
                  color={isDark ? '$textDark50' : '#3B3B3B'}
                >
                  {productReview.title || 'Product and Usage Experience'}
                </Text>
              </HStack>
              <Text
                fontSize={10}
                color={isDark ? '$textDark400' : '#343434'}
                lineHeight={14}
                ml={18}
              >
                {productReview.description}
              </Text>
              <HStack space="xs" ml={18}>
                {renderStars(productReview.rating || 0)}
              </HStack>
            </VStack>
          )}

          {/* Eğer hiç review yoksa mesaj göster */}
          {!priceReview && !productReview && (
            <VStack space="sm" alignItems="center" py={20}>
              <Text
                fontSize={11}
                color={isDark ? '$textDark400' : '#6D6D6D'}
                textAlign="center"
              >
                Bu ürün için henüz değerlendirme bulunmamaktadır.
              </Text>
            </VStack>
          )}
        </Box>

        {/* Tags / Features */}
        {item.tags && item.tags.length > 0 && (
          <Box
            bg={isDark ? '$backgroundDark800' : '$white'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
            borderRadius={5}
            py={15}
          >
            <VStack space="lg" w="100%" px={15}>
              {item.tags.map((tag, index) => (
                <HStack key={index} alignItems="center" w="100%">
                  <Box w={24} h={24} justifyContent="center" alignItems="center">
                    <Layers size={16} color="#536471" strokeWidth={1.5} />
                  </Box>
                  <Text
                    fontSize={11}
                    fontWeight="$medium"
                    color={isDark ? '$textDark400' : '#6D6D6D'}
                    ml={4}
                  >
                    {tag}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </ScrollView>
    </VStack>
    </SafeAreaView>
  );
};

export default InventoryDetailScreen;
