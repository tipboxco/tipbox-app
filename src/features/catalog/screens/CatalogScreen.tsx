import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Pressable, Image, HStack, Input, InputField } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '@/src/components/Header';
import { mock_user_profile } from '@/src/mock/common';
import { Category } from '@/src/mock/catalog/productCatalog/types';
import { ProductCatalogScreen } from './ProductCatalogScreen';
import { BrandScreen } from './BrandScreen';
import { Search } from 'lucide-react-native';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { CatalogStackParamList } from '../navigation';
import { RootStackParamList } from '@/src/navigation/navigation.types';

type CatalogScreenNavigationProp = NativeStackNavigationProp<CatalogStackParamList & RootStackParamList> & {
  navigate: (name: any, params?: any) => void;
};

export const CatalogScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CatalogScreenNavigationProp>();
  const [currentMode, setCurrentMode] = useState<'product' | 'brand-catalog' | 'brand-selection'>('product');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [headerHeight, setHeaderHeight] = useState(40); // Default header height
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // BottomSheet state
  const [bottomSheetKey, setBottomSheetKey] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<'categories' | 'subcategories' | 'productgroups' | 'products'>('categories');
  
  // Scroll animasyonu için Animated.Value
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Brand isminin pozisyonu (Header Info Box yüksekliği yaklaşık 80-100px)
  const BRAND_TITLE_THRESHOLD = 80;

  const handleBrandCategorySelection = (category: Category) => {
    setSelectedCategory(category);
    // Brand catalog modunda kal, sadece seçilen kategoriyi güncelle
    // Kullanıcı floating button ile brand-selection moduna geçebilir
  };

  const handleCreatePost = useCallback(() => {
    console.log('Create a Post pressed');
    // Reset bottom sheet key to remount component and reset view
    setBottomSheetKey(prev => prev + 1);
    
    openBottomSheet(
      <CreatePostBottomSheet
        key={bottomSheetKey + 1}
        onClose={closeBottomSheet}
        onPostTypeSelect={handlePostTypeSelect}
        onViewChange={handleViewChange}
        stage={currentView === 'categories' ? undefined : currentView as 'subcategories' | 'productgroups' | 'products'}
        selectedProduct={selectedProduct ? {
          id: selectedProduct.id,
          name: selectedProduct.name,
          subName: selectedProduct.description || undefined,
          image: selectedProduct.image,
          hasDiscount: false,
        } : undefined}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        enableDynamicSizing: true,
        animateOnMount: true,
        paddingBottom: Platform.OS === 'ios' ? 32 + 8 : 45 + 8,
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
        onChange: (index: number) => {
    // Reset bottom sheet key when sheet closes to reset view state
    if (index === -1) {
      setBottomSheetKey(prev => prev + 1);
    }
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, currentView, selectedProduct, isDark]);

  const handlePostTypeSelect = useCallback((type: string) => {
    console.log('Post type selected:', type);
    
    // Close bottom sheet first
    closeBottomSheet();
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
      navigation.navigate('Post', {
        screen: 'CreatePostScreen',
      });
    } else if (type === 'tips') {
      navigation.navigate('Post', {
        screen: 'CreateTipsAndTrickPostScreen',
      });
    } else if (type === 'question') {
      navigation.navigate('Post', {
        screen: 'CreateQuestionPostScreen',
      });
    } else if (type === 'experience') {
      navigation.navigate('Post', {
        screen: 'CreateExperiencePostScreen',
        params: {
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
            brand: selectedProduct.brand,
          } : undefined,
        },
      });
    } else if (type === 'comparison') {
      navigation.navigate('Post', {
        screen: 'CreateBenchmarkPostScreen',
        params: {
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
          } : undefined,
        },
      });
    } else if (type === 'update') {
      navigation.navigate('Post', {
        screen: 'CreateUpdatePostScreen',
        params: {
          product: selectedProduct ? {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            image: selectedProduct.image,
            brand: selectedProduct.brand,
          } : undefined,
        },
      });
    }
  }, [navigation, selectedProduct, closeBottomSheet]);

  const handleViewChange = useCallback((view: 'options' | 'experience' | 'product-selection') => {
    console.log('BottomSheet view changed:', view);
    // View change is handled internally by CreatePostBottomSheet
  }, []);

  const handleFloatingButtonPress = () => {
    if (currentMode === 'brand-selection') {
      // Brand selection modundan brand catalog moduna geri dön
      setCurrentMode('brand-catalog');
    } else if (currentMode === 'brand-catalog') {
      // Brand catalog modundan normal moda geri dön
      setCurrentMode('product');
      setSelectedCategory(null);
      // Scroll pozisyonunu sıfırla
      scrollY.setValue(0);
    } else {
      // Normal moddan brand catalog moduna geç
      setCurrentMode('brand-catalog');
      // Scroll pozisyonunu sıfırla
      scrollY.setValue(0);
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

  const handleProductCatalogStateChange = useCallback((data: {
    selectedProduct: any | null;
    currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
  }) => {
    setSelectedProduct(data.selectedProduct);
    setCurrentView(data.currentView);
  }, []);

  // Scroll handler - Brand ismini geçtikten sonra Header opacity'sini arttır
  const handleBrandScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.setValue(offsetY);
  }, [scrollY]);

  // Header opacity animasyonu: Brand ismini geçtikten sonra (80px'de başlar, 120px'de tamamen görünür)
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, BRAND_TITLE_THRESHOLD, BRAND_TITLE_THRESHOLD + 40],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const renderContent = () => {
    const paddingBottom = headerHeight + 12;
    switch (currentMode) {
      case 'brand-catalog':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            onScroll={handleBrandScroll}
            showHeader={false}
          />
        );
      case 'brand-selection':
        return (
          <BrandScreen
            selectedCategory={selectedCategory}
            onCategorySelect={handleBrandCategorySelection}
            scrollViewPaddingBottom={paddingBottom}
            onScroll={handleBrandScroll}
            showHeader={false}
          />
        );
      default:
        return (
          <ProductCatalogScreen
            onCreatePost={handleCreatePost}
            onStateChange={handleProductCatalogStateChange}
            scrollViewPaddingBottom={paddingBottom}
          />
        );
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '#1A1A1A' : '#FAFAFA'}
      >
      {/* Görünmez Header - Yükseklik ölçümü için */}
      <Box
        position="absolute"
        opacity={0}
        pointerEvents="none"
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height);
        }}
      >
        <Header
          title={getTitle()}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
      </Box>

      {/* Sticky Animated Header */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          elevation: 10,
          width: '100%',
          pointerEvents: 'box-none',
        }}
        collapsable={false}
      >
        <Animated.View
          style={{
            // Brand ve product katalog görünümlerinde header her zaman görünür olsun
            opacity: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 9999,
          }}
        >
          <Box 
            bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
            width="100%"
          >
            <Header
              title={getTitle()}
              showBackButton
              onBackPress={() => navigation.goBack()}
            />
          </Box>
        </Animated.View>
      </Animated.View>

      {/* Arama Çubuğu */}
      <Box px="$4" pt={headerHeight > 0 ? headerHeight + 12 : '$3'}>
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
