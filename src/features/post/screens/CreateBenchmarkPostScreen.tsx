import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, View, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Image, Input, InputField, useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, useRoute, RouteProp, CommonActions, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider, Controller, useFormContext, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { useCallback } from 'react';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBenchmarkPostForm } from '../hooks/useBenchmarkPostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ProductBenchmarkCard } from '../components/ProductBenchmarkCard';
import { DashedProductCard } from '../components/DashedProductCard';
import { useCreateBenchmarkPost } from '../api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { useCatalogProducts, useGlobalProductSearch } from '@/src/features/catalog/api/hooks';
import type { CatalogProduct } from '@/src/features/catalog/types';
import type { InventoryItem } from '@/src/features/profile/types';
import type { PostStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BenchmarkPostFormData } from '../schemas/benchmarkPostSchema';

type CreateBenchmarkPostScreenRouteProp = RouteProp<PostStackParamList, 'CreateBenchmarkPostScreen'>;
type CreateBenchmarkPostScreenNavigationProp = NativeStackNavigationProp<PostStackParamList & RootStackParamList>;


// Catalog Selection Bottom Sheet Content
const CATALOG_CARD_GAP = 8;
const CATALOG_CARDS_PER_ROW = 3;
const CATALOG_HORIZONTAL_PADDING = 16;
const CATALOG_CARD_WIDTH =
  (Dimensions.get('window').width - CATALOG_HORIZONTAL_PADDING * 2 - CATALOG_CARD_GAP * (CATALOG_CARDS_PER_ROW - 1)) /
  CATALOG_CARDS_PER_ROW;

interface CatalogSelectionProps {
  onProductSelect: (product: CatalogProduct) => void;
  onClose: () => void;
  productGroupId?: string;
  hideHeader?: boolean;
}

const CatalogSelection: React.FC<CatalogSelectionProps> = ({
  onProductSelect,
  onClose,
  productGroupId,
  hideHeader = false,
}) => {
  const { colorMode } = useColorMode();
  const { t } = useTranslation('post');
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // If productGroupId exists, use useCatalogProducts; otherwise use useGlobalProductSearch
  const catalogProductsQuery = useCatalogProducts(
    productGroupId,
    debouncedSearch || undefined,
    16
  );

  const globalSearchQuery = useGlobalProductSearch(
    !productGroupId ? (debouncedSearch || undefined) : undefined,
    20
  );

  const usesCatalog = !!productGroupId;
  const activeQuery = usesCatalog ? catalogProductsQuery : globalSearchQuery;

  // Flatten products from pages
  const products: CatalogProduct[] = React.useMemo(() => {
    if (!activeQuery.data?.pages) return [];

    if (usesCatalog) {
      // useCatalogProducts returns CatalogPaginationResponse<CatalogProduct>
      return catalogProductsQuery.data?.pages.flatMap((page) => page.items) || [];
    } else {
      // useGlobalProductSearch returns GlobalProductSearchResponse with nested products
      return (
        globalSearchQuery.data?.pages.flatMap((page) =>
          page.items.flatMap((group) => group.products)
        ) || []
      );
    }
  }, [activeQuery.data?.pages, usesCatalog]);

  const handleLoadMore = () => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage();
    }
  };

  const renderProductCard = ({ item }: { item: CatalogProduct }) => {
    // Parse name: first word is brand, rest is product name
    const nameParts = item.name.split(' ');
    const brandName = nameParts.length > 1 ? nameParts[0] : '';
    const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : item.name;

    return (
      <Pressable onPress={() => onProductSelect(item)} mb={CATALOG_CARD_GAP}>
        <Box
          bg={isDark ? '$backgroundDark800' : '$white'}
          borderWidth={1}
          borderColor={isDark ? '$borderDark700' : '#E9E9E9'}
          borderRadius={5}
          w={CATALOG_CARD_WIDTH}
          h={200}
          overflow="hidden"
        >
          {/* Product Image */}
          <Box flex={1} p={18} alignItems="center" justifyContent="center">
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                alt={item.name}
                width={110}
                height={110}
                resizeMode="contain"
              />
            ) : (
              <Box
                width={110}
                height={110}
                bg={isDark ? '$backgroundDark700' : '#F5F5F5'}
                borderRadius={8}
                justifyContent="center"
                alignItems="center"
              >
                <Feather name="image" size={36} color={isDark ? '#666' : '#CCC'} />
              </Box>
            )}
          </Box>

          {/* Product Info */}
          <Box
            px={8}
            pb={10}
            pt={5}
            borderTopWidth={1}
            borderTopColor={isDark ? '$borderDark700' : '#E9E9E9'}
          >
            {brandName ? (
              <Text
                fontSize={11}
                fontWeight="$semibold"
                color={isDark ? '$textDark50' : '$textLight900'}
                numberOfLines={1}
              >
                {brandName}
              </Text>
            ) : null}
            <Text
              fontSize={10}
              color={isDark ? '$textDark400' : '$textLight500'}
              numberOfLines={1}
              mt={brandName ? 2 : 0}
            >
              {productName}
            </Text>
          </Box>
        </Box>
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (!activeQuery.isFetchingNextPage) return null;
    return (
      <Box py="$4" justifyContent="center" alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFF' : '#000'} />
      </Box>
    );
  };

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  // For global search without productGroupId, require a search query
  const needsSearch = !usesCatalog && !debouncedSearch;

  return (
    <Box bg={isDark ? '$backgroundDark950' : '#FDFDFB'} width="100%" flex={1}>
      <VStack px="$4" py="$3" space="md" flex={1}>
        {/* Header */}
        {!hideHeader && (
          <HStack alignItems="center" justifyContent="space-between" mb="$1">
            <Text fontSize={16} fontWeight="$bold" color={isDark ? '#FFFFFF' : '#000000'}>
              {t('create.benchmark.modal.fromCatalog')}
            </Text>
          </HStack>
        )}

        {/* Search Bar */}
        <Box>
          <Input
            bg={isDark ? '$backgroundDark900' : '$white'}
            borderWidth={1}
            borderColor={isDark ? '$borderDark700' : '#E0E0E0'}
            borderRadius={8}
            h={44}
          >
            <Box pl="$3" pr="$2" justifyContent="center">
              <Feather name="search" size={18} color={isDark ? '#999' : '#666'} />
            </Box>
            <InputField
              placeholder={t('create.benchmark.catalogSearch')}
              placeholderTextColor={isDark ? '#999' : '#999'}
              color={isDark ? '$textDark50' : '$textLight900'}
              fontSize={15}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} pr="$3" justifyContent="center">
                <Feather name="x" size={18} color={isDark ? '#999' : '#666'} />
              </Pressable>
            )}
          </Input>
        </Box>

        {/* Content */}
        <Box flex={1} minHeight={200}>
          {/* Loading State */}
          {isLoading && (
            <Box flex={1} justifyContent="center" alignItems="center" py="$8">
              <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
            </Box>
          )}

          {/* Error State */}
          {isError && (
            <Box flex={1} justifyContent="center" alignItems="center" px="$6" py="$8">
              <Feather name="alert-circle" size={48} color={isDark ? '#999' : '#CCC'} />
              <Text
                mt="$3"
                color={isDark ? '$textDark400' : '$textLight500'}
                fontSize={14}
                textAlign="center"
              >
                {t('create.benchmark.catalogError')}
              </Text>
            </Box>
          )}

          {/* Needs Search Prompt (global search mode without query) */}
          {!isLoading && !isError && needsSearch && (
            <Box flex={1} justifyContent="center" alignItems="center" px="$6" py="$8">
              <Feather name="search" size={48} color={isDark ? '#999' : '#CCC'} />
              <Text
                mt="$3"
                color={isDark ? '$textDark400' : '$textLight500'}
                fontSize={14}
                textAlign="center"
              >
                {t('create.benchmark.catalogSearchPrompt')}
              </Text>
            </Box>
          )}

          {/* Empty State */}
          {!isLoading && !isError && !needsSearch && products.length === 0 && (
            <Box flex={1} justifyContent="center" alignItems="center" px="$6" py="$8">
              <Feather name="inbox" size={48} color={isDark ? '#999' : '#CCC'} />
              <Text
                mt="$3"
                color={isDark ? '$textDark400' : '$textLight500'}
                fontSize={14}
                textAlign="center"
              >
                {t('create.benchmark.catalogEmpty')}
              </Text>
            </Box>
          )}

          {/* Product List */}
          {!isLoading && !isError && !needsSearch && products.length > 0 && (
            <FlatList
              data={products}
              renderItem={renderProductCard}
              keyExtractor={(item) => item.productId}
              numColumns={CATALOG_CARDS_PER_ROW}
              columnWrapperStyle={{
                paddingHorizontal: 0,
                justifyContent: 'space-between',
                marginBottom: CATALOG_CARD_GAP,
              }}
              contentContainerStyle={{
                paddingTop: 8,
                paddingBottom: 20,
              }}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              scrollEnabled={true}
            />
          )}
        </Box>
      </VStack>
    </Box>
  );
};

// Combined Inventory + Catalog Selection Bottom Sheet Content
interface CombinedProductSelectionProps {
  onInventoryProductSelect: (item: InventoryItem) => void;
  onCatalogProductSelect: (item: CatalogProduct) => void;
  onClose: () => void;
  productGroupFilter?: string;
  productGroupId?: string;
}

const CombinedProductSelection: React.FC<CombinedProductSelectionProps> = ({
  onInventoryProductSelect,
  onCatalogProductSelect,
  onClose,
  productGroupFilter,
  productGroupId,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'catalog'>('inventory');
  const { colorMode } = useColorMode();
  const { t } = useTranslation('post');
  const isDark = colorMode === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }}>
      {/* Tab Bar */}
      <HStack px={16} pt={8} pb={12} space="sm">
        <Pressable
          onPress={() => setActiveTab('inventory')}
          flex={1}
          py={10}
          borderRadius={8}
          bg={activeTab === 'inventory' ? (isDark ? '#FFFFFF' : '#000000') : 'transparent'}
          borderWidth={activeTab === 'inventory' ? 0 : 1}
          borderColor={isDark ? '#333' : '#E0E0E0'}
          alignItems="center"
        >
          <Text
            fontSize={14}
            fontWeight="$semibold"
            color={activeTab === 'inventory' ? (isDark ? '#000' : '#FFF') : (isDark ? '#999' : '#666')}
          >
            {t('create.benchmark.modal.fromInventory')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('catalog')}
          flex={1}
          py={10}
          borderRadius={8}
          bg={activeTab === 'catalog' ? (isDark ? '#FFFFFF' : '#000000') : 'transparent'}
          borderWidth={activeTab === 'catalog' ? 0 : 1}
          borderColor={isDark ? '#333' : '#E0E0E0'}
          alignItems="center"
        >
          <Text
            fontSize={14}
            fontWeight="$semibold"
            color={activeTab === 'catalog' ? (isDark ? '#000' : '#FFF') : (isDark ? '#999' : '#666')}
          >
            {t('create.benchmark.modal.fromCatalog')}
          </Text>
        </Pressable>
      </HStack>

      {/* Content */}
      {activeTab === 'inventory' ? (
        <AddProductFromInventory
          onProductSelect={onInventoryProductSelect}
          onClose={onClose}
          productGroupFilter={productGroupFilter}
          hideHeader
        />
      ) : (
        <CatalogSelection
          onProductSelect={onCatalogProductSelect}
          onClose={onClose}
          productGroupId={productGroupId}
          hideHeader
        />
      )}
    </View>
  );
};

// Product Source Selection Bottom Sheet Content
interface ProductSourceSelectionProps {
  onSelectInventory: () => void;
  onSelectCatalog: () => void;
}

const ProductSourceSelection: React.FC<ProductSourceSelectionProps> = ({
  onSelectInventory,
  onSelectCatalog,
}) => {
  const { colorMode } = useColorMode();
  const { t } = useTranslation('post');
  const isDark = colorMode === 'dark';

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 }}>
      {/* Title */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text
          fontSize={18}
          fontWeight="$bold"
          color={isDark ? '#FFFFFF' : '#000000'}
        >
          {t('create.benchmark.modal.addProduct')}
        </Text>
      </View>

      {/* Add from Inventory */}
      <Pressable
        onPress={onSelectInventory}
        flexDirection="row"
        alignItems="center"
        p={16}
        borderWidth={1}
        borderColor={isDark ? '#333' : '#E9E9E9'}
        borderRadius={12}
        mb={12}
        bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
      >
        <Feather name="package" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
        <Text
          ml={12}
          fontSize={16}
          fontWeight="$semibold"
          color={isDark ? '#FFFFFF' : '#000000'}
        >
          {t('create.benchmark.modal.addFromInventory')}
        </Text>
      </Pressable>

      {/* Add from Catalog */}
      <Pressable
        onPress={onSelectCatalog}
        flexDirection="row"
        alignItems="center"
        p={16}
        borderWidth={1}
        borderColor={isDark ? '#333' : '#E9E9E9'}
        borderRadius={12}
        bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
      >
        <Feather name="list" size={22} color={isDark ? '#FFFFFF' : '#000000'} />
        <Text
          ml={12}
          fontSize={16}
          fontWeight="$semibold"
          color={isDark ? '#FFFFFF' : '#000000'}
        >
          {t('create.benchmark.modal.addFromCatalog')}
        </Text>
      </Pressable>
    </View>
  );
};

// Product Benchmark Field Component
const ProductBenchmarkField: React.FC<{ onShowSelectModal: () => void }> = ({ onShowSelectModal }) => {
  const { t } = useTranslation('post');
  const { control, watch } = useFormContext<BenchmarkPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const selectedProduct1 = watch('selectedProduct1');
  const selectedProduct2 = watch('selectedProduct2');
  const selectedChoice = watch('selectedChoice');

  return (
    <VStack px={16} space="xs">
      <Text
        color={isDark ? '$textDark400' : '#B9B9B9'}
        fontSize="$sm"
        fontWeight="$bold"
      >
        {t('create.benchmark.labels.productBenchmark')}
      </Text>
      <Box position="relative" width="100%">
        <HStack width="100%" alignItems="stretch" space="md" flex={1}>
          {/* Sol: Ekrandaki / ilk ürün */}
          <Box flex={1} minWidth={0}>
            {selectedProduct1 ? (
              <Controller
                name="selectedChoice"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <ProductBenchmarkCard
                    product={selectedProduct1}
                    isSelected={value === 'product1'}
                    onPress={() => onChange('product1')}
                  />
                )}
              />
            ) : (
              <Box
                flex={1}
                borderWidth={1}
                borderColor={isDark ? '#333333' : '#E9E9E9'}
                borderRadius={10}
                bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                alignItems="center"
                justifyContent="center"
                minHeight={180}
              >
                <Text color="#B9B9B9" fontSize={11}>
                  {t('create.benchmark.labels.loading')}
                </Text>
              </Box>
            )}
          </Box>

          {/* Sağ: Artı ile seçilen ikinci ürün veya artı kartı */}
          <Box flex={1} minWidth={0}>
            {selectedProduct2 ? (
              <Controller
                name="selectedChoice"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <ProductBenchmarkCard
                    product={selectedProduct2}
                    isSelected={value === 'product2'}
                    onPress={() => onChange('product2')}
                  />
                )}
              />
            ) : (
              <DashedProductCard onPress={onShowSelectModal} />
            )}
          </Box>
        </HStack>

        {/* Ortadaki kıyaslama simgesi: sol ürün varken (sağda Add Product olsa bile) göster */}
        {selectedProduct1 && (
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
              alt={t('altTexts.benchmarks')}
              width={40}
              height={40}
            />
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export const CreateBenchmarkPostScreen = () => {
  const { t } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateBenchmarkPostScreenNavigationProp>();
  const route = useRoute<CreateBenchmarkPostScreenRouteProp>();
  const { product } = route.params || {};
  const methods = useBenchmarkPostForm();
  const { handleSubmit, formState, setValue, watch } = methods;
  const toast = useToast();
  const createBenchmarkPostMutation = useCreateBenchmarkPost();
  const isSubmittingRef = useRef(false);
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
  const flowContextId = useCreatePostFlowStore((state) => state.contextId);
  const flowProductSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet, dismissBottomSheet } = useGlobalBottomSheet();

  const selectedProduct1 = watch('selectedProduct1');
  const postText = watch('postText');
  const selectedProduct2 = watch('selectedProduct2');
  const selectedChoice = watch('selectedChoice');

  // Initialize first product from route params or flow store fallback
  useEffect(() => {
    if (product) {
      console.log('[CreateBenchmarkPostScreen] 🔍 Initializing product1 from route params:', {
        product,
        hasProductGroupId: !!product.productGroupId,
        productGroupIdValue: product.productGroupId,
        productGroupIdType: typeof product.productGroupId,
      });

      const nameParts = product.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : (product as any).brand;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
      const subName = (product as any).subName ?? product.description;

      // CRITICAL: productGroupId boş string olmamalı, undefined olmalı
      const productGroupId = product.productGroupId ?? (product as any).productGroupId;

      const initialProduct = {
        id: product.id,
        name: productName,
        brand: brand,
        subName: subName,
        image: product.image ?? (product as any).imageUrl ?? product.description,
        isOwned: false,
        productGroupId: productGroupId || undefined, // Boş string yerine undefined
      };

      console.log('[CreateBenchmarkPostScreen] ✅ Formatted product1:', {
        initialProduct,
        productGroupId: initialProduct.productGroupId,
        willFilterWork: !!initialProduct.productGroupId,
      });

      if (!initialProduct.productGroupId) {
        console.warn('[CreateBenchmarkPostScreen] ⚠️ WARNING: product1 has no productGroupId! Filter will not work.');
      }

      setValue('selectedProduct1', initialProduct, { shouldValidate: true });
    } else if (flowContextId && flowProductSnapshot) {
      // Fallback: route params'ta product yoksa, flow store'dan al
      console.log('[CreateBenchmarkPostScreen] 🔄 Fallback: Initializing product1 from flow store:', {
        flowContextId,
        flowProductSnapshot,
      });

      const nameParts = flowProductSnapshot.title.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : '';
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : flowProductSnapshot.title;

      const initialProduct = {
        id: flowContextId,
        name: productName,
        brand: brand,
        subName: flowProductSnapshot.subName || '',
        image: flowProductSnapshot.image,
        isOwned: false,
        productGroupId: undefined,
      };

      console.log('[CreateBenchmarkPostScreen] ✅ Formatted product1 from flow store:', initialProduct);
      setValue('selectedProduct1', initialProduct, { shouldValidate: true });
    }
  }, [product, setValue, flowContextId, flowProductSnapshot]);

  // Track if we've processed the selected product to prevent re-applying
  const processedSelectedProductRef = useRef<string | null>(null);

  // Handle selected product from navigation (when returning from AddProductFromInventory or AddProductFromCatalog)
  useFocusEffect(
    useCallback(() => {
      const routeParams = route.params || {};
      const selectedProduct = routeParams.selectedProduct;
      const selectedProductField = routeParams.selectedProductField;

      if (selectedProduct && selectedProductField) {
        // Create a unique key for this selection to prevent re-processing
        const selectionKey = `${selectedProductField}-${selectedProduct.id}`;
        
        // Skip if we've already processed this selection
        if (processedSelectedProductRef.current === selectionKey) {
          return;
        }
        
        console.log('[CreateBenchmarkPostScreen] 🔍 Processing selected product from navigation:', {
          field: selectedProductField,
          product: selectedProduct,
        });

        const formattedProduct = {
          id: selectedProduct.id,
          name: selectedProduct.name,
          brand: selectedProduct.brand,
          subName: selectedProduct.description || selectedProduct.subName || '',
          image: selectedProduct.image ?? (selectedProduct as any).imageUrl ?? selectedProduct.description,
          isOwned: selectedProductField === 'selectedProduct2' && selectedProduct.brand ? true : false,
          productGroupId: (selectedProduct as any).productGroupId ?? '', // Include productGroupId for filtering
        };
        
        console.log('[CreateBenchmarkPostScreen] ✅ Formatted product for', selectedProductField, ':', formattedProduct);

        if (selectedProductField === 'selectedProduct1') {
          setValue('selectedProduct1', formattedProduct, { shouldValidate: true });
        } else if (selectedProductField === 'selectedProduct2') {
          setValue('selectedProduct2', formattedProduct, { shouldValidate: true });
        }

        // Mark as processed
        processedSelectedProductRef.current = selectionKey;
      }
    }, [route.params, setValue])
  );

  // Handler for when product is selected from catalog bottom sheet
  const handleCatalogProductSelect = (item: CatalogProduct) => {
    console.log('[CreateBenchmarkPostScreen] 🛍️ Catalog product selected:', item);

    const nameParts = item.name.split(' ');
    const brand = nameParts.length > 1 ? nameParts[0] : '';
    const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : item.name;

    const formattedProduct = {
      id: item.productId,
      name: productName,
      brand: brand,
      subName: '',
      image: item.image,
      isOwned: false,
      productGroupId: item.productGroupId,
    };

    setValue('selectedProduct2', formattedProduct, { shouldValidate: true });
    closeBottomSheet();
  };

  // Handler for showing product source selection bottom sheet (second product)
  const handleShowProductSourceModal = () => {
    const productGroupFilter = selectedProduct1?.productGroupId;

    const handleSelectInventory = () => {
      // Dismiss current sheet instantly, then open inventory selection
      dismissBottomSheet();
      setTimeout(() => {
        openBottomSheet(
          <AddProductFromInventory
            onProductSelect={handleInventoryProductSelect}
            onClose={closeBottomSheet}
            productGroupFilter={productGroupFilter}
            hideHeader
          />,
          {
            snapPoints: ['85%'],
            enableDynamicSizing: false,
            enablePanDownToClose: true,
            enableOverDrag: false,
            enableHandlePanningGesture: true,
            enableContentPanningGesture: false,
            animateOnMount: true,
            backdropPressBehavior: 'close',
            wrapWithScrollView: false,
          }
        );
      }, 150);
    };

    const handleSelectCatalog = () => {
      // Dismiss bottom sheet and navigate to full-screen ProductSelectScreen
      dismissBottomSheet();
      navigation.navigate('ProductSelect' as any, {
        returnScreen: 'CreateBenchmarkPostScreen',
        selectedProductField: 'selectedProduct2',
        initialProduct: selectedProduct1 ? {
          id: selectedProduct1.id,
          name: selectedProduct1.name,
          brand: selectedProduct1.brand,
          subName: selectedProduct1.subName,
          image: selectedProduct1.image,
          productGroupId: selectedProduct1.productGroupId,
        } : undefined,
        productGroupFilter: productGroupFilter,
      });
    };

    // First: show source selection (Inventory or Catalog)
    openBottomSheet(
      <ProductSourceSelection
        onSelectInventory={handleSelectInventory}
        onSelectCatalog={handleSelectCatalog}
      />,
      {
        snapPoints: ['50%'],
        enableDynamicSizing: false,
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: true,
        backdropPressBehavior: 'close',
      }
    );
  };

  // Handler for when product is selected from inventory bottom sheet
  const handleInventoryProductSelect = (item: InventoryItem) => {
    console.log('[CreateBenchmarkPostScreen] 📦 Inventory product selected:', item);

    const formattedProduct = {
      id: item.productId || item.id,
      name: item.brand?.model || item.brand?.name || 'Unknown Product',
      brand: item.brand?.name || '',
      subName: item.brand?.model || '',
      image: item.image,
      isOwned: true,
      productGroupId: item.productGroupId, // Include productGroupId for filtering
    };

    setValue('selectedProduct2', formattedProduct, { shouldValidate: true });
    closeBottomSheet();
  };

  const handleBackPress = () => {
    // Go back to previous screen
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to Feed screen
      navigation.navigate('App', {
        screen: 'MainTabs',
        params: {
          screen: 'FeedScreen',
        },
      });
    }
  };

  const onSubmit: SubmitHandler<BenchmarkPostFormData> = async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
    console.log('[CreateBenchmarkPostScreen] Form submitted:', data);
    
    // Benchmark API: contextType sadece "product" kabul eder; contextId ürün id'lerinden biri olmalı
    if (!data.selectedProduct1?.id || !data.selectedProduct2?.id) {
      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: t('create.benchmark.validation.twoProductsRequired'),
        action: 'error',
      });
      return;
    }

    const description = (data.postText || '').trim();
    if (!description) {
      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: t('create.benchmark.validation.descriptionRequired'),
        action: 'error',
      });
      return;
    }

    // Kullanıcının kazanan seçimi (sol = product1, sağ = product2)
    const choiceProductId =
      data.selectedChoice === 'product1'
        ? data.selectedProduct1.id
        : data.selectedProduct2.id;

    // products: karşılaştırılan iki ürün; isSelected kazananı işaretler
    const products = [
      { productId: data.selectedProduct1.id, isSelected: data.selectedChoice === 'product1' },
      { productId: data.selectedProduct2.id, isSelected: data.selectedChoice === 'product2' },
    ];

    // contextType: "product" (küçük harf), contextId: ürün id'lerinden biri
    try {
      const response = await createBenchmarkPostMutation.mutateAsync({
        contextType: 'product',
        contextId: data.selectedProduct1.id,
        description,
        products,
        choiceProductId,
        images: data.selectedImages || [],
      });
      
      console.log('[CreateBenchmarkPostScreen] ✅ API Response:', response);

      // Başarılı toast göster
      showCustomToast(toast, {
        title: t('create.benchmark.success.title'),
        description: t('create.benchmark.success.description'),
        action: 'success',
      });
      
      // Clear flow context on successful submit
      clearFlow();
      
      // Başarılı olursa ProfileScreen'e yönlendir ve Post stack'ini temizle
      if (user?.id) {
        // Profil verilerini invalidate et - yeni post görünsün
        queryClient.invalidateQueries({
          queryKey: profileKeys.userPosts(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.userBenchmarks(user.id),
        });
        
        // CRITICAL: Post stack'ini temizle ve ProfileScreen'e yönlendir
        // Kullanıcı gönderi oluşturduktan sonra CreatePostScreen'e geri dönmemeli
        // App'in mevcut state'ini koru (hangi tab açıksa o kalır)
        const currentState = navigation.getState();
        const appRoute = currentState?.routes?.find((route) => route.name === 'App');
        
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              {
                name: 'App',
                state: appRoute?.state, // App'in mevcut state'ini koru
              },
              {
                name: 'Profile',
                params: {
                  screen: 'ProfileMain',
                  params: { userId: user.id },
                },
              },
            ],
          })
        );
      } else {
        // Fallback: Feed ekranına yönlendir
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'App',
                state: {
                  routes: [
                    {
                      name: 'MainTabs',
                      state: {
                        routes: [{ name: 'FeedScreen' }],
                        index: 0,
                      },
                    },
                  ],
                  index: 0,
                },
              },
            ],
          })
        );
      }
    } catch (error: any) {
      console.error('[CreateBenchmarkPostScreen] ❌ API Error:', error);

      // Backend hata kodlarını ve mesajlarını kontrol et
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;

      // İlk ürün envanter kontrolü - Backend'den gelen özel mesaj
      if (errorMessage?.includes('ana ürün envanterinizde bulunmuyor') ||
          errorMessage?.includes('envanterinizde bulunmuyor') ||
          errorCode === 'PRODUCT_NOT_IN_INVENTORY') {
        showCustomToast(toast, {
          title: t('create.benchmark.validation.firstProductMustBeInInventory.title'),
          description: t('create.benchmark.validation.firstProductMustBeInInventory.description'),
          action: 'error',
        });
        // Kullanıcıyı 1. ürün seçim ekranına geri götürmek için product1'i temizle
        setValue('selectedProduct1', null as any);
        return;
      }

      // Genel hata
      const fallbackMessage = errorMessage ||
                          error?.message ||
                          t('create.common.errors.general');

      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: fallbackMessage,
        action: 'error',
      });
    }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Share button: schema (benchmarkPostSchema) required alanları açıkça kontrol et
  const hasRequiredFields =
    Boolean(postText?.trim?.()) &&
    Boolean(selectedProduct1) &&
    Boolean(selectedProduct2) &&
    (selectedChoice === 'product1' || selectedChoice === 'product2');
  const isShareEnabled = formState.isValid && hasRequiredFields;
  const isShareLoading = createBenchmarkPostMutation.isPending;

  const handleSharePress = () => {
    Keyboard.dismiss();
    const submitHandler = handleSubmit as unknown as (callback: SubmitHandler<BenchmarkPostFormData>) => () => void;
    submitHandler(onSubmit)();
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <FormProvider {...methods}>
        <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
          {/* Header */}
          <Header
            title={t('create.benchmark.header.title')}
            leftAction="cancel"
            onLeftActionPress={handleBackPress}
            rightButton={{
              text: t('create.benchmark.header.share'),
              backgroundColor: isShareEnabled || isShareLoading ? '#D0F205' : '#EDEDED',
              borderWidth: 1,
              borderColor: isShareEnabled || isShareLoading ? '#B8CC04' : '#B1B1B1',
              textColor: isShareEnabled || isShareLoading ? '#111111' : '#B1B1B1',
              fontSize: 11,
              borderRadius: 25,
              paddingX: 10,
              paddingY: 10,
              onPress: handleSharePress,
              loading: isShareLoading,
            }}
          />

          {/* Content */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <VStack space="md">
              {/* Product Benchmark Section */}
              <ProductBenchmarkField onShowSelectModal={handleShowProductSourceModal} />

              {/* Post Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="postText"
                  placeholder={t('create.benchmark.placeholders.description')}
                  maxLength={500}
                  label={t('create.benchmark.labels.description')}
                />
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
      </FormProvider>
    </SafeAreaView>
  );
};
