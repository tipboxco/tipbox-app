import React, { useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Pressable, Image, HStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { mock_user_profile } from '@/src/mock/common';
import { Category } from '@/src/mock/catalog/productCatalog/types';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import { BrandScreen } from './BrandScreen';
import { Search } from 'lucide-react-native';

export const CatalogScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const [currentMode, setCurrentMode] = useState<'product' | 'brand-catalog' | 'brand-selection'>('product');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBrandCategorySelection = (category: Category) => {
    setSelectedCategory(category);
    // Brand catalog modunda kal, sadece seçilen kategoriyi güncelle
    // Kullanıcı floating button ile brand-selection moduna geçebilir
  };

  const handleFloatingButtonPress = () => {
    if (currentMode === 'brand-selection') {
      // Brand selection modundan brand catalog moduna geri dön
      setCurrentMode('brand-catalog');
    } else if (currentMode === 'brand-catalog') {
      // Brand catalog modundan normal moda geri dön
      setCurrentMode('product');
      setSelectedCategory(null);
    } else {
      // Normal moddan brand catalog moduna geç
      setCurrentMode('brand-catalog');
    }
  };

  const getTitle = () => {
    switch (currentMode) {
      case 'brand-catalog':
        return 'Brand Catalog';
      case 'brand-selection':
        return 'Brand Catalog';
      default:
        return 'Product Catalog';
    }
  };

  const renderContent = () => {
    switch (currentMode) {
      case 'brand-catalog':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
          />
        );
      case 'brand-selection':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
          />
        );
      default:
        return <ProductCatalogScreen />;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '#1A1A1A' : '#FAFAFA'}
      >
      <Header
        title={getTitle()}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Arama Çubuğu */}
      <Box px="$4" pt="$3">
        <Box
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderRadius={20}
          height={36}
          px="$4"
          justifyContent="center"
        >
          <HStack alignItems="center" space="sm">
            <Search size={24} color={isDark ? '#FFFFFF' : '#B9B9B9'} />
            <Input flex={1} borderWidth={0} bg="transparent">
              <InputField
                placeholder="Ürün Grubu seçin veya ürün adı arayın"
                placeholderTextColor={isDark ? '#8C8C8C' : '#B9B9B9'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={9}
              />
            </Input>
          </HStack>
        </Box>
      </Box>

      {/* Content Area */}
      {renderContent()}

      {/* Floating Action Button */}
      <Pressable
        position="absolute"
        bottom={Platform.OS === 'ios' ? 34 + 8 : 45 + 8}
        right={16}
        width={60}
        height={60}
        borderRadius={30}
        bg="#4619B1"
        justifyContent="center"
        alignItems="center"
        onPress={handleFloatingButtonPress}
      >
        <Image
          source={require('@/assets/catalog_change.png')}
          alt="Change catalog"
          width={27}
          height={27}
        />
      </Pressable>
      </Box>
    </SafeAreaView>
  );
};
