import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { Box, VStack, HStack, Text, Pressable, Image, Input, InputField, useToast } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FormProvider, useFormContext, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { showCustomToast } from '@/src/components/CustomToast';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBenchmarkPostForm } from '../../hooks/useBenchmarkPostForm';
import { ControlledTextarea } from '../FormFields/ControlledTextarea';
import { useCreateBenchmarkPost } from '../../api/hooks';
import { navigateAfterPostCreate } from '../../utils/navigateAfterPostCreate';
import { useCreatePostFlowStore } from '../../store/createPostFlowStore';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { useCatalogProducts, useGlobalProductSearch } from '@/src/features/catalog/api/hooks';
import type { CatalogProduct } from '@/src/features/catalog/types';
import type { InventoryItem } from '@/src/features/profile/types';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BenchmarkPostFormData } from '../../schemas/benchmarkPostSchema';

export interface BenchmarkComposerHandle {
  submit: () => void;
  /** 2. ürün (karşılaştırılacak) seçim picker'ını açar */
  openSecondProductPicker: () => void;
  /** Seçili 2. ürünü temizler */
  clearSecondProduct: () => void;
}

export interface BenchmarkSecondProduct {
  image?: any;
  title: string;
}

export interface BenchmarkComposerProductContext {
  id: string;
  name: string;
  brand?: string;
  subName?: string;
  image?: any;
  productGroupId?: string;
}

interface BenchmarkComposerProps {
  /** İlk ürün (ekrandaki bağlam ürünü) */
  productContext?: BenchmarkComposerProductContext | null;
  /** Paylaş butonunun aktif/yüklenme durumunu + seçili 2. ürünü parent'a bildirir */
  onStateChange?: (state: { canShare: boolean; isLoading: boolean; secondProduct: BenchmarkSecondProduct | null }) => void;
}

const CATALOG_CARD_GAP = 8;
const CATALOG_CARDS_PER_ROW = 3;
const CATALOG_HORIZONTAL_PADDING = 16;
const CATALOG_CARD_WIDTH =
  (Dimensions.get('window').width - CATALOG_HORIZONTAL_PADDING * 2 - CATALOG_CARD_GAP * (CATALOG_CARDS_PER_ROW - 1)) /
  CATALOG_CARDS_PER_ROW;

interface CatalogSelectionProps {
  onProductSelect: (product: CatalogProduct) => void;
  productGroupId?: string;
}

const CatalogSelection: React.FC<CatalogSelectionProps> = ({ onProductSelect, productGroupId }) => {
  const { colorMode } = useColorMode();
  const { t } = useTranslation('post');
  const isDark = colorMode === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const catalogProductsQuery = useCatalogProducts(productGroupId, debouncedSearch || undefined, 16);
  const globalSearchQuery = useGlobalProductSearch(!productGroupId ? (debouncedSearch || undefined) : undefined, 20);

  const usesCatalog = !!productGroupId;
  const activeQuery = usesCatalog ? catalogProductsQuery : globalSearchQuery;

  const products: CatalogProduct[] = React.useMemo(() => {
    if (!activeQuery.data?.pages) return [];
    if (usesCatalog) {
      return catalogProductsQuery.data?.pages.flatMap(page => page.items) || [];
    }
    return globalSearchQuery.data?.pages.flatMap(page => page.items.flatMap(group => group.products)) || [];
  }, [activeQuery.data?.pages, usesCatalog]);

  const handleLoadMore = () => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) activeQuery.fetchNextPage();
  };

  const renderProductCard = ({ item }: { item: CatalogProduct }) => {
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
          <Box flex={1} p={18} alignItems="center" justifyContent="center">
            {item.image ? (
              <Image source={{ uri: item.image }} alt={item.name} width={110} height={110} resizeMode="contain" />
            ) : (
              <Box width={110} height={110} bg={isDark ? '$backgroundDark700' : '#F5F5F5'} borderRadius={8} justifyContent="center" alignItems="center">
                <Feather name="image" size={36} color={isDark ? '#666' : '#CCC'} />
              </Box>
            )}
          </Box>
          <Box px={8} pb={10} pt={5} borderTopWidth={1} borderTopColor={isDark ? '$borderDark700' : '#E9E9E9'}>
            {brandName ? (
              <Text fontSize={11} fontWeight="$semibold" color={isDark ? '$textDark50' : '$textLight900'} numberOfLines={1}>
                {brandName}
              </Text>
            ) : null}
            <Text fontSize={10} color={isDark ? '$textDark400' : '$textLight500'} numberOfLines={1} mt={brandName ? 2 : 0}>
              {productName}
            </Text>
          </Box>
        </Box>
      </Pressable>
    );
  };

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const needsSearch = !usesCatalog && !debouncedSearch;

  return (
    <Box bg={isDark ? '$backgroundDark950' : '#FDFDFB'} width="100%" flex={1}>
      <VStack px="$4" py="$3" space="md" flex={1}>
        <Box>
          <Input bg={isDark ? '$backgroundDark900' : '$white'} borderWidth={1} borderColor={isDark ? '$borderDark700' : '#E0E0E0'} borderRadius={8} h={44}>
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
        <Box flex={1} minHeight={200}>
          {isLoading && (
            <Box flex={1} justifyContent="center" alignItems="center" py="$8">
              <ActivityIndicator size="large" color={isDark ? '#FFF' : '#000'} />
            </Box>
          )}
          {isError && (
            <Box flex={1} justifyContent="center" alignItems="center" px="$6" py="$8">
              <Feather name="alert-circle" size={48} color={isDark ? '#999' : '#CCC'} />
              <Text mt="$3" color={isDark ? '$textDark400' : '$textLight500'} fontSize={14} textAlign="center">
                {t('create.benchmark.catalogError')}
              </Text>
            </Box>
          )}
          {!isLoading && !isError && needsSearch && (
            <Box flex={1} justifyContent="center" alignItems="center" px="$6" py="$8">
              <Feather name="search" size={48} color={isDark ? '#999' : '#CCC'} />
              <Text mt="$3" color={isDark ? '$textDark400' : '$textLight500'} fontSize={14} textAlign="center">
                {t('create.benchmark.catalogSearchPrompt')}
              </Text>
            </Box>
          )}
          {!isLoading && !isError && !needsSearch && products.length === 0 && (
            <Box flex={1} justifyContent="center" alignItems="center" px="$6" py="$8">
              <Feather name="inbox" size={48} color={isDark ? '#999' : '#CCC'} />
              <Text mt="$3" color={isDark ? '$textDark400' : '$textLight500'} fontSize={14} textAlign="center">
                {t('create.benchmark.catalogEmpty')}
              </Text>
            </Box>
          )}
          {!isLoading && !isError && !needsSearch && products.length > 0 && (
            <FlatList
              data={products}
              renderItem={renderProductCard}
              keyExtractor={item => item.productId}
              numColumns={CATALOG_CARDS_PER_ROW}
              columnWrapperStyle={{ paddingHorizontal: 0, justifyContent: 'space-between', marginBottom: CATALOG_CARD_GAP }}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              scrollEnabled
            />
          )}
        </Box>
      </VStack>
    </Box>
  );
};

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
  // Benchmark'ta karşılaştırılacak ürün genelde katalogdan gelir; envanter boş
  // olabileceği için varsayılan sekme Katalog.
  const [activeTab, setActiveTab] = useState<'inventory' | 'catalog'>('catalog');
  const { colorMode } = useColorMode();
  const { t } = useTranslation('post');
  const isDark = colorMode === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0A0A0A' : '#FAFAFA' }}>
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
          <Text fontSize={14} fontWeight="$semibold" color={activeTab === 'inventory' ? (isDark ? '#000' : '#FFF') : (isDark ? '#999' : '#666')}>
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
          <Text fontSize={14} fontWeight="$semibold" color={activeTab === 'catalog' ? (isDark ? '#000' : '#FFF') : (isDark ? '#999' : '#666')}>
            {t('create.benchmark.modal.fromCatalog')}
          </Text>
        </Pressable>
      </HStack>

      {activeTab === 'inventory' ? (
        <AddProductFromInventory onProductSelect={onInventoryProductSelect} onClose={onClose} productGroupFilter={productGroupFilter} hideHeader />
      ) : (
        <CatalogSelection onProductSelect={onCatalogProductSelect} productGroupId={productGroupId} />
      )}
    </View>
  );
};

/**
 * İki ürün de seçiliyken "hangisini öneriyorsun?" (selectedChoice) kompakt
 * segmented seçimi. 2. ürün seçim input'u CreatePostScreen'de 1. ürünün hemen
 * altında (paylaşılan ProductSelectInput) render edilir.
 */
const BenchmarkWinnerField: React.FC = () => {
  const { t } = useTranslation('post');
  const { watch, setValue } = useFormContext<BenchmarkPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const selectedProduct1 = watch('selectedProduct1');
  const selectedProduct2 = watch('selectedProduct2');
  const selectedChoice = watch('selectedChoice');

  if (!selectedProduct1 || !selectedProduct2) return null;

  return (
    <VStack px={16} space="xs">
      <Text color={isDark ? '$textDark400' : '#B9B9B9'} fontSize="$sm" fontWeight="$bold">
        {t('create.benchmark.whichBetter', 'Hangisini öneriyorsun?')}
      </Text>
      <HStack space="sm">
        {[
          { key: 'product1' as const, product: selectedProduct1 },
          { key: 'product2' as const, product: selectedProduct2 },
        ].map(({ key, product }) => {
          const selected = selectedChoice === key;
          return (
            <Pressable key={key} flex={1} onPress={() => setValue('selectedChoice', key, { shouldValidate: true })}>
              <Box
                h={44}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                px="$2"
                bg={selected ? (isDark ? '#2A2E15' : '#EDF2C9') : isDark ? '#2A2A2A' : '#F2F2F2'}
                borderWidth={selected ? 1.5 : 1}
                borderColor={selected ? '#B8CC04' : isDark ? '#2A2A2A' : '#F2F2F2'}
              >
                <Text fontSize={13} fontWeight="$semibold" color={selected ? '#758600' : '#9D9D9D'} numberOfLines={1}>
                  {product.brand ? `${product.brand} ${product.name}` : product.name}
                </Text>
              </Box>
            </Pressable>
          );
        })}
      </HStack>
    </VStack>
  );
};

/**
 * Benchmark paylaşımının kompakt, inline composer'ı (onboarding/çok-adım yok).
 * Kendi formunu ve submit'ini yönetir; parent'ın Header "Paylaş" butonuna `ref`
 * üzerinden bağlanır (submit) ve durumunu onStateChange ile bildirir.
 */
export const BenchmarkComposer = forwardRef<BenchmarkComposerHandle, BenchmarkComposerProps>(
  ({ productContext, onStateChange }, ref) => {
    const { t } = useTranslation('post');
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const methods = useBenchmarkPostForm();
    const { handleSubmit, formState, setValue, watch } = methods;
    const toast = useToast();
    const createBenchmarkPostMutation = useCreateBenchmarkPost();
    const isSubmittingRef = useRef(false);
    const { user } = useAppStore();
    const queryClient = useQueryClient();
    const clearFlow = useCreatePostFlowStore(state => state.clearFlow);
    const { openBottomSheet, closeBottomSheet, dismissBottomSheet } = useGlobalBottomSheet();

    const selectedProduct1 = watch('selectedProduct1');
    const selectedProduct2 = watch('selectedProduct2');
    const selectedChoice = watch('selectedChoice');
    const postText = watch('postText');

    // İlk ürünü bağlamdan başlat
    useEffect(() => {
      if (!productContext) return;
      const nameParts = productContext.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : productContext.brand;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : productContext.name;
      setValue(
        'selectedProduct1',
        {
          id: productContext.id,
          name: productName,
          brand,
          subName: productContext.subName ?? '',
          image: productContext.image,
          isOwned: false,
          productGroupId: productContext.productGroupId || undefined,
        } as any,
        { shouldValidate: true },
      );
    }, [productContext, setValue]);

    const handleInventoryProductSelect = (item: InventoryItem) => {
      setValue(
        'selectedProduct2',
        {
          id: item.productId || item.id,
          name: item.brand?.model || item.brand?.name || 'Unknown Product',
          brand: item.brand?.name || '',
          subName: item.brand?.model || '',
          image: item.image,
          isOwned: true,
          productGroupId: item.productGroupId,
        } as any,
        { shouldValidate: true },
      );
      closeBottomSheet();
    };

    const handleCatalogProductSelect = (item: CatalogProduct) => {
      const nameParts = item.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : '';
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : item.name;
      setValue(
        'selectedProduct2',
        {
          id: item.productId,
          name: productName,
          brand,
          subName: '',
          image: item.image,
          isOwned: false,
          productGroupId: item.productGroupId,
        } as any,
        { shouldValidate: true },
      );
      closeBottomSheet();
    };

    const handleShowSelectModal = () => {
      const productGroupFilter = selectedProduct1?.productGroupId;
      openBottomSheet(
        <CombinedProductSelection
          onInventoryProductSelect={handleInventoryProductSelect}
          onCatalogProductSelect={handleCatalogProductSelect}
          onClose={closeBottomSheet}
          productGroupFilter={productGroupFilter}
          productGroupId={productGroupFilter}
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
        },
      );
    };

    const onSubmit: SubmitHandler<BenchmarkPostFormData> = async data => {
      if (isSubmittingRef.current) return;
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
      isSubmittingRef.current = true;
      try {
        await createBenchmarkPostMutation.mutateAsync({
          contextType: 'product',
          contextId: data.selectedProduct1.id,
          description,
          products: [
            { productId: data.selectedProduct1.id, isSelected: true },
            { productId: data.selectedProduct2.id, isSelected: true },
          ],
          images: data.selectedImages || [],
        });

        showCustomToast(toast, {
          title: t('create.benchmark.success.title'),
          description: t('create.benchmark.success.description'),
          action: 'success',
        });
        clearFlow();

        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(user.id) });
          queryClient.invalidateQueries({ queryKey: profileKeys.profile(user.id) });
          queryClient.invalidateQueries({ queryKey: profileKeys.userBenchmarks(user.id) });
        }

        // Başarıda Profile'a (yoksa Feed'e) yönlendir — ortak helper
        navigateAfterPostCreate(navigation, { userId: user?.id });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || t('create.common.errors.general');
        showCustomToast(toast, { title: t('create.common.errors.title'), description: errorMessage, action: 'error' });
      } finally {
        isSubmittingRef.current = false;
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        const submitHandler = handleSubmit as unknown as (cb: SubmitHandler<BenchmarkPostFormData>) => () => void;
        submitHandler(onSubmit)();
      },
      openSecondProductPicker: () => handleShowSelectModal(),
      clearSecondProduct: () => {
        setValue('selectedProduct2', null as any, { shouldValidate: true });
        if (selectedChoice === 'product2') setValue('selectedChoice', undefined as any, { shouldValidate: true });
      },
    }));

    const canShare =
      formState.isValid &&
      Boolean(postText?.trim?.()) &&
      Boolean(selectedProduct1) &&
      Boolean(selectedProduct2) &&
      (selectedChoice === 'product1' || selectedChoice === 'product2');
    const isLoading = createBenchmarkPostMutation.isPending;

    useEffect(() => {
      const secondProduct = selectedProduct2
        ? {
            image: selectedProduct2.image ? { uri: selectedProduct2.image } : undefined,
            title: selectedProduct2.brand ? `${selectedProduct2.brand} ${selectedProduct2.name}` : selectedProduct2.name,
          }
        : null;
      onStateChange?.({ canShare, isLoading, secondProduct });
    }, [canShare, isLoading, onStateChange, selectedProduct2]);

    return (
      <FormProvider {...methods}>
        <VStack space="md">
          <BenchmarkWinnerField />
          <VStack px={16} space="xs">
            <ControlledTextarea
              name="postText"
              placeholder={t('create.benchmark.placeholders.description')}
              maxLength={500}
              label={t('create.benchmark.labels.description')}
            />
          </VStack>
        </VStack>
      </FormProvider>
    );
  },
);

BenchmarkComposer.displayName = 'BenchmarkComposer';
