import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Pressable,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { Header } from '@/src/components/Header';
import { useColorMode } from '@/src/hooks/useColorMode';
import { BrandProductsScreenProps } from '../types';
import { ChevronRight, Square } from 'lucide-react-native';
import { brandProductsData } from '@/src/mock/bridge/brandProducts';
import { Feather } from '@expo/vector-icons';

export const BrandProductsScreen: React.FC<BrandProductsScreenProps> = ({
  navigation,
  route,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { brandName } = route.params;
  const [searchQuery, setSearchQuery] = useState('');

  const renderProductCard = (product: any) => (
    <Box
      key={product.id}
      bg={isDark ? '$backgroundDark800' : '$white'}
      borderRadius={10}
      p={10}
      shadowColor={isDark ? '$backgroundDark950' : '$backgroundLight950'}
      shadowOffset={{ width: 0, height: 0 }}
      shadowOpacity={0.25}
      shadowRadius={3}
      elevation={3}
      width={176}
      height={236}
    >
      {/* Product Image */}
      <Box
        width={157}
        height={157}
        borderRadius={5}
        bg={isDark ? '$backgroundDark700' : '$backgroundLight200'}
        overflow="hidden"
        mb={10}
      >
        <Image
          source={require('../../../../assets/bridge/card-icon.png')}
          alt={product.name}
          w="100%"
          h="100%"
          resizeMode="cover"
        />
      </Box>

      {/* Product Name */}
      <Text
        color={isDark ? '$textDark50' : '$textLight900'}
        fontWeight="$600"
        fontSize={11}
        mb={10}
      >
        {product.name}
      </Text>

      {/* Divider Line */}
      <Box
        width="100%"
        height={1}
        bg={isDark ? '$borderDark700' : '$borderLight300'}
        mb={10}
      />

      {/* Metrics */}
      <HStack space="xl" alignItems="center">
        <HStack space="sm" alignItems="center">
          <Box
            width={16}
            height={16}
            bg={isDark ? '$backgroundDark600' : '$backgroundLight300'}
            borderRadius={2}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$500"
            fontSize={9}
          >
            {product.metrics.metric1}
          </Text>
        </HStack>

        <HStack space="sm" alignItems="center">
          <Box
            width={16}
            height={16}
            bg={isDark ? '$backgroundDark600' : '$backgroundLight300'}
            borderRadius={2}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$500"
            fontSize={9}
          >
            {product.metrics.metric2}
          </Text>
        </HStack>

        <HStack space="sm" alignItems="center">
          <Box
            width={16}
            height={16}
            bg={isDark ? '$backgroundDark600' : '$backgroundLight300'}
            borderRadius={2}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$500"
            fontSize={9}
          >
            {product.metrics.metric3}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );

  const renderCategory = (category: any) => (
    <Box key={category.id} mb={6}>
      {/* Category Header */}
      <HStack
        justifyContent="space-between"
        alignItems="center"
        mb={6}
        px={16}
      >
        <Text
          color={isDark ? '$textDark400' : '$textLight600'}
          fontWeight="$700"
          fontSize={14}
        >
          {category.name}
        </Text>
        <ChevronRight
          size={20}
          color={isDark ? '$textDark400' : '$textLight600'}
        />
      </HStack>

      {/* Product Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <HStack space="sm">
          {category.products.map((product: any) => renderProductCard(product))}
        </HStack>
      </ScrollView>
    </Box>
  );

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight50'}
    >
      <Header
        title={brandName}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Search/Filter Bar */}
      <Box px={16} py={16}>
        <Box
          bg={isDark ? '$backgroundDark950' : '$backgroundLight100'}
          borderRadius={20}
          p={12}
          flexDirection="row"
          alignItems="center"
        >
          <Box
            width={24}
            height={24}
            bg={isDark ? '$backgroundDark600' : '$backgroundLight300'}
            borderRadius={2}
          />
          <Text
            color={isDark ? '$textDark50' : '$textLight900'}
            fontWeight="$700"
            fontSize={16}
            flex={1}
            ml={12}
          >
            Marka Ürünleri Defteri
          </Text>
        </Box>
        
        {/* Search Input */}
        <Box mt={12}>
          <Input
            variant="outline"
            size="md"
            borderRadius={10}
            borderColor={isDark ? '$borderDark800' : '$borderLight200'}
            backgroundColor={isDark ? '$backgroundDark800' : '$backgroundLight50'}
          >
            <HStack alignItems="center" px="$3" flex={1}>
              <Box mr="$2">
                <Feather name="search" size={16} color={isDark ? '#666' : '#999'} />
              </Box>
              <InputField
                flex={1}
                placeholder="Ürün ara..."
                placeholderTextColor={isDark ? '$textDark400' : '$textLight400'}
                color={isDark ? '$textDark50' : '$textLight900'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </HStack>
          </Input>
        </Box>
      </Box>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <VStack space="md">
          {brandProductsData.map((category) => renderCategory(category))}
        </VStack>
      </ScrollView>
    </Box>
  );
};
