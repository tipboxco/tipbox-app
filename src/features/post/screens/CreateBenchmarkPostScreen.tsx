import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Textarea, TextareaInput, Image } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { AddProductFromCatalog } from '@/src/components/AddProductFromCatalog';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { Product } from '@/src/mock/catalog/productCatalog/types';
import { InventoryItem } from '@/src/mock/inventory/types';
import type { PostStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProductComparisonCard } from '../components/ProductComparisonCard';
import { DashedProductCard } from '../components/DashedProductCard';

type CreateBenchmarkPostScreenRouteProp = RouteProp<PostStackParamList, 'CreateBenchmarkPostScreen'>;
type CreateBenchmarkPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SelectedProduct {
  id: string;
  name: string;
  brand?: string;
  subName?: string;
  image?: any;
  isOwned?: boolean;
}

export const CreateBenchmarkPostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateBenchmarkPostScreenNavigationProp>();
  const route = useRoute<CreateBenchmarkPostScreenRouteProp>();
  
  const { product } = route.params || {};
  
  const [postText, setPostText] = useState('');
  const [selectedProduct1, setSelectedProduct1] = useState<SelectedProduct | null>(null);
  const [selectedProduct2, setSelectedProduct2] = useState<SelectedProduct | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<'product1' | 'product2' | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSource, setProductSource] = useState<'Catalog' | 'Inventory' | null>(null);

  // Bottom sheet refs
  const productSelectBottomSheetRef = useRef<BottomSheet>(null);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  // Initialize first product from route params
  useEffect(() => {
    if (product) {
      // Parse product name to extract brand if possible
      const nameParts = product.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : undefined;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
      
      const initialProduct: SelectedProduct = {
        id: product.id,
        name: productName,
        brand: brand,
        subName: product.description,
        image: product.image,
        isOwned: false, // You can determine this based on your logic
      };
      setSelectedProduct1(initialProduct);
    }
  }, [product]);

  const handleBackPress = () => {
    // Navigate to Feed screen
    navigation.navigate('Main', {
      screen: 'Feed',
      params: {
        screen: 'FeedScreen',
      },
    });
  };

  const handleImagePicker = () => {
    console.log('Open image picker');
    // TODO: Implement image picker
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleProductSelect = () => {
    // Open bottom sheet for product selection
    if (productSelectBottomSheetRef.current) {
      productSelectBottomSheetRef.current.snapToIndex(0);
    }
  };

  const handleCloseBottomSheet = () => {
    productSelectBottomSheetRef.current?.close();
  };

  const handleCatalogPress = () => {
    setProductSource('Catalog');
    setShowProductSelector(true);
    handleCloseBottomSheet();
  };

  const handleInventoryPress = () => {
    setProductSource('Inventory');
    setShowProductSelector(true);
    handleCloseBottomSheet();
  };

  const handleCatalogProductSelect = (product: Product) => {
    // Parse product name to extract brand if possible
    // Catalog products might have format like "Brand ProductName" or just "ProductName"
    const nameParts = product.name.split(' ');
    const brand = nameParts.length > 1 ? nameParts[0] : undefined;
    const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
    
    const selectedProduct: SelectedProduct = {
      id: product.id,
      name: productName,
      brand: brand,
      subName: product.description,
      image: product.image,
      isOwned: false,
    };
    setSelectedProduct2(selectedProduct);
    setShowProductSelector(false);
    setProductSource(null);
  };

  const handleInventoryProductSelect = (product: InventoryItem) => {
    const selectedProduct: SelectedProduct = {
      id: product.id,
      name: product.model,
      brand: product.brand,
      subName: product.specs,
      image: product.image,
      isOwned: true,
    };
    setSelectedProduct2(selectedProduct);
    setShowProductSelector(false);
    setProductSource(null);
  };

  const handleCloseProductSelector = () => {
    setShowProductSelector(false);
    setProductSource(null);
  };

  const handleProductChoice = (productNumber: 1 | 2) => {
    setSelectedChoice(productNumber === 1 ? 'product1' : 'product2');
  };

  const handleShare = () => {
    console.log('Share button pressed');
  };

  const characterCount = postText.length;
  const maxCharacters = 500;

  // Check if share button should be enabled (content, both products selected, and choice made)
  const isShareEnabled = postText.trim().length > 0 && selectedProduct1 !== null && selectedProduct2 !== null && selectedChoice !== null;

  // Show product selector if productSource is set
  if (showProductSelector && productSource) {
    if (productSource === 'Catalog') {
      return (
        <AddProductFromCatalog
          onProductSelect={handleCatalogProductSelect}
          onClose={handleCloseProductSelector}
        />
      );
    } else if (productSource === 'Inventory') {
      return (
        <AddProductFromInventory
          onProductSelect={handleInventoryProductSelect}
          onClose={handleCloseProductSelector}
        />
      );
    }
  }


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      {/* Header */}
      <Header
        title="Comparison Post"
        leftAction="cancel"
        onLeftActionPress={handleBackPress}
        rightButton={{
          text: 'Share',
          backgroundColor: isShareEnabled ? '#D0F205' : '#EDEDED',
          borderWidth: 1,
          borderColor: isShareEnabled ? '#B8CC04' : '#B1B1B1',
          textColor: isShareEnabled ? '#111111' : '#B1B1B1',
          fontSize: 12,
          borderRadius: 25,
          paddingX: 24,
          paddingY: 8,
          onPress: handleShare,
        }}
      />

      {/* Content */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space="md">
          {/* Product Comparison Section */}
          <VStack px={16} space="xs">
            {/* Section Title */}
            <Text
              color={isDark ? '$textDark400' : '#B9B9B9'}
              fontSize={10}
              fontWeight="$bold"
            >
              Product Comparison
            </Text>

            {/* Product Comparison Container */}
            <Box position="relative" width="100%">
              <HStack justifyContent="space-between" width="100%" alignItems="stretch">
                {/* First Product - Always render ProductCard if product exists */}
                {selectedProduct1 ? (
                  <ProductComparisonCard
                    product={selectedProduct1}
                    isSelected={selectedChoice === 'product1'}
                    onPress={() => handleProductChoice(1)}
                  />
                ) : null}
                
                {/* Second Product - DashedCard if not selected, ProductCard if selected */}
                {selectedProduct2 ? (
                  <ProductComparisonCard
                    product={selectedProduct2}
                    isSelected={selectedChoice === 'product2'}
                    onPress={() => handleProductChoice(2)}
                  />
                ) : (
                  <DashedProductCard
                    onPress={handleProductSelect}
                  />
                )}
              </HStack>
              
              {/* Benchmark Icon - Center */}
              {(selectedProduct1 || selectedProduct2) && (
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  style={{
                    transform: [{ translateX: -20 }, { translateY: -20 }],
                  }}
                  width={40}
                  height={40}
                  zIndex={10}
                  pointerEvents="none"
                >
                  <Image
                    source={require('@/assets/common/benchmarks.png')}
                    alt="benchmarks"
                    width={40}
                    height={40}
                  />
                </Box>
              )}
            </Box>
          </VStack>

          {/* Post Description Section */}
          <VStack px={16} space="xs">
            {/* Section Title */}
            <Text
              color={isDark ? '$textDark400' : '#B9B9B9'}
              fontSize={10}
              fontWeight="$bold"
            >
              Benchmark Description
            </Text>

            {/* Text Input Area */}
            <Box
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              $dark-borderColor="$borderDark600"
              borderRadius={5}
              overflow="hidden"
              minHeight={174}
              position="relative"
            >
              {/* Text Input */}
              <Textarea
                bg="transparent"
                borderWidth={0}
                flex={1}
                minHeight={174}
              >
                <TextareaInput
                  placeholder="Type your Comparison Post here..."
                  placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                  color={isDark ? '$textDark50' : '#000000'}
                  fontSize={10}
                  lineHeight={12}
                  value={postText}
                  onChangeText={setPostText}
                  maxLength={maxCharacters}
                  style={{
                    textAlignVertical: 'top',
                    paddingTop: 10,
                    paddingBottom: 32,
                    paddingLeft: 8,
                    paddingRight: 8,
                  }}
                />
              </Textarea>

              {/* Character Count - Bottom Right */}
              <Box
                position="absolute"
                bottom={8}
                right={8}
              >
                <Text
                  color={isDark ? '$textDark400' : '#A3A3A3'}
                  fontSize={9}
                  fontWeight="$medium"
                >
                  {characterCount}/{maxCharacters}
                </Text>
              </Box>
            </Box>
          </VStack>


        </VStack>
      </ScrollView>

      {/* Product Selection Bottom Sheet */}
      <BottomSheet
        ref={productSelectBottomSheetRef}
        index={-1}
        enablePanDownToClose
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        }}
      >
        <BottomSheetView>
          <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FDFDFB'} px="$4" py="$4">
            <VStack space="md">
              <Text
                fontSize={16}
                fontWeight="$bold"
                color={isDark ? '$textDark50' : '#000000'}
                textAlign="center"
                mb="$2"
              >
                Select Product Source
              </Text>

              {/* Add From Inventory */}
              <Pressable
                onPress={handleInventoryPress}
                bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                borderRadius={10}
                p="$4"
              >
                <HStack alignItems="center" space="md">
                  <Box
                    w={40}
                    h={40}
                    bg={isDark ? '$backgroundDark700' : '#F5F5F5'}
                    borderRadius={8}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Feather
                      name="package"
                      size={20}
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </Box>
                  <VStack flex={1}>
                    <Text
                      fontSize={14}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#000000'}
                    >
                      Add From Inventory
                    </Text>
                    <Text
                      fontSize={11}
                      color={isDark ? '$textDark400' : '#787878'}
                    >
                      Select from your inventory
                    </Text>
                  </VStack>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                </HStack>
              </Pressable>

              {/* Add From Catalog */}
              <Pressable
                onPress={handleCatalogPress}
                bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                borderWidth={1}
                borderColor="#E9E9E9"
                $dark-borderColor="$borderDark600"
                borderRadius={10}
                p="$4"
              >
                <HStack alignItems="center" space="md">
                  <Box
                    w={40}
                    h={40}
                    bg={isDark ? '$backgroundDark700' : '#F5F5F5'}
                    borderRadius={8}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Feather
                      name="grid"
                      size={20}
                      color={isDark ? '#FFFFFF' : '#000000'}
                    />
                  </Box>
                  <VStack flex={1}>
                    <Text
                      fontSize={14}
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#000000'}
                    >
                      Add From Catalog
                    </Text>
                    <Text
                      fontSize={11}
                      color={isDark ? '$textDark400' : '#787878'}
                    >
                      Browse product catalog
                    </Text>
                  </VStack>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={isDark ? '#FFFFFF' : '#000000'}
                  />
                </HStack>
              </Pressable>
            </VStack>
          </Box>
        </BottomSheetView>
      </BottomSheet>
      </Box>
    </SafeAreaView>
  );
};
