import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Box, Text, VStack, HStack, Image } from '@gluestack-ui/themed';
import { Header } from '../../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { mockWishlistDetail } from '@/src/mock/profile/wishlist/wishlistDetail';
import { mockWishlistItems } from '@/src/mock/profile/wishlist';
import { ProductCard } from '../components/ProductCard';
import { Feather } from '@expo/vector-icons';
import { AddProductCard } from '../components/ProductCard/AddProductCard';

export const WishlistScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const selectedWishlist = mockWishlistItems[0];

  const handleAddProduct = () => {
    // Add Product işlemleri burada yapılacak
    console.log('Add Product clicked');
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Wishlist"
        showBackButton
        onMenuPress={() => navigation.goBack()}
      />

      {/* Selected Wishlist Info */}
      <Box px="$4" py="$4" bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <HStack space="md">
          <Box
            width={100}
            height={100}
            borderRadius="$lg"
            overflow="hidden"
            borderWidth={1}
            borderColor={isDark ? '$borderDark100' : '$borderLight200'}
          >
            <Image
              source={selectedWishlist.image}
              alt={selectedWishlist.title}
              resizeMode="cover"
              width={100}
              height={100}
            />
          </Box>

          <VStack flex={1} space="xs">
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '$textLight500'}
            >
              {selectedWishlist.date} - {selectedWishlist.itemCount} Item
            </Text>
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              {selectedWishlist.title}
            </Text>
            <Text
              fontSize={12}
              color={isDark ? '$textDark400' : '$textLight500'}
              numberOfLines={2}
            >
              {selectedWishlist.description}
            </Text>
            <Box
              bg={selectedWishlist.badgeColor}
              borderWidth={1}
              borderColor={selectedWishlist.badgeBorderColor}
              borderRadius="$lg"
              px="$2"
              py="$1"
              alignSelf="flex-start"
            >
              <Text fontSize={10} color="#000000">
                {selectedWishlist.itemCount} Item
              </Text>
            </Box>
          </VStack>
        </HStack>
      </Box>

      {/* Filter Buttons */}
      <Box py="$2" borderBottomWidth={1} borderBottomColor={isDark ? '$borderDark100' : '$borderLight200'}>
        <HStack px="$4" justifyContent="space-between">
          <Pressable>
            <HStack
              borderWidth={1}
              borderColor={isDark ? '$borderDark100' : '$borderLight200'}
              borderRadius="$md"
              p="$2"
              alignItems="center"
              space="xs"
            >
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '$textLight900'}
              >
                Sırala
              </Text>
              <Feather
                name="chevron-down"
                size={14}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </HStack>
          </Pressable>

          <Pressable>
            <Box
              borderWidth={1}
              borderColor={isDark ? '$borderDark100' : '$borderLight200'}
              borderRadius="$md"
              p="$2"
            >
              <Text
                fontSize={12}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '$textLight900'}
              >
                Seç
              </Text>
            </Box>
          </Pressable>
        </HStack>
      </Box>

      {/* Product Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <Box py="$4">
          <HStack px="$4" space="md" flexWrap="wrap" justifyContent="space-between">
            {mockWishlistDetail.map((item) => (
              <Box key={item.id} mb="$4">
                <ProductCard item={item} />
              </Box>
            ))}
            <Box mb="$4">
              <ProductCard onPress={handleAddProduct} />
              <AddProductCard onPress={handleAddProduct} />
            </Box>
          </HStack>
        </Box>
      </ScrollView>
    </Box>
  );
};