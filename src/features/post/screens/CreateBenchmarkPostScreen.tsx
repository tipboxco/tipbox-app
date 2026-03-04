import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Image, useToast } from '@gluestack-ui/themed';
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
import type { InventoryItem } from '@/src/features/profile/types';
import type { PostStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BenchmarkPostFormData } from '../schemas/benchmarkPostSchema';

type CreateBenchmarkPostScreenRouteProp = RouteProp<PostStackParamList, 'CreateBenchmarkPostScreen'>;
type CreateBenchmarkPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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
        fontSize={10}
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
            ) : null}
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
              alt="benchmarks"
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

  // Modal states for second product selection
  const [showProductSourceModal, setShowProductSourceModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);

  const selectedProduct1 = watch('selectedProduct1');
  const postText = watch('postText');
  const selectedProduct2 = watch('selectedProduct2');
  const selectedChoice = watch('selectedChoice');

  // Initialize first product from route params (ekrandaki ürün veya dönüşte korunan initial product)
  useEffect(() => {
    if (product) {
      console.log('[CreateBenchmarkPostScreen] 🔍 Initializing product1 from route params:', product);
      
      const nameParts = product.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : (product as any).brand;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
      const subName = (product as any).subName ?? product.description;

      const initialProduct = {
        id: product.id,
        name: productName,
        brand: brand,
        subName: subName,
        image: product.image ?? (product as any).imageUrl ?? product.description, // Try multiple image fields
        isOwned: false,
      };
      
      console.log('[CreateBenchmarkPostScreen] ✅ Formatted product1:', initialProduct);
      setValue('selectedProduct1', initialProduct, { shouldValidate: true });
    }
  }, [product, setValue]);

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

  // Handler for showing product source selection modal (second product)
  const handleShowProductSourceModal = () => {
    setShowProductSourceModal(true);
  };

  // Handler for selecting from catalog (second product)
  const handleSelectFromCatalog = () => {
    setShowProductSourceModal(false);

    const initialProductForReturn = selectedProduct1
      ? {
          id: selectedProduct1.id,
          name: selectedProduct1.name,
          brand: selectedProduct1.brand,
          subName: selectedProduct1.subName,
          image: selectedProduct1.image,
        }
      : undefined;

    navigationService.navigate(ROOT_ROUTES.PRODUCT_SELECT, {
      returnScreen: 'CreateBenchmarkPostScreen',
      selectedProductField: 'selectedProduct2',
      initialProduct: initialProductForReturn,
    });
  };

  // Handler for selecting from inventory (second product)
  const handleSelectFromInventory = () => {
    setShowProductSourceModal(false);
    setShowInventoryModal(true);
  };

  // Handler for when product is selected from inventory modal
  const handleInventoryProductSelect = (item: InventoryItem) => {
    console.log('[CreateBenchmarkPostScreen] 📦 Inventory product selected:', item);

    const formattedProduct = {
      id: item.productId || item.id,
      name: item.brand?.model || item.brand?.name || 'Unknown Product',
      brand: item.brand?.name || '',
      subName: item.brand?.model || '',
      image: item.image,
      isOwned: true,
    };

    setValue('selectedProduct2', formattedProduct, { shouldValidate: true });
    setShowInventoryModal(false);
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

    // products: backend en az 2 ürün ve ikisinde de isSelected: true istiyor
    const products = [
      { productId: data.selectedProduct1.id, isSelected: true },
      { productId: data.selectedProduct2.id, isSelected: true },
    ];

    // contextType: "product" (küçük harf), contextId: ürün id'lerinden biri
    try {
      const response = await createBenchmarkPostMutation.mutateAsync({
        contextType: 'product',
        contextId: data.selectedProduct1.id,
        description,
        products,
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
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
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

        {/* Product Source Selection Modal (Catalog or Inventory) */}
        <Modal
          visible={showProductSourceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProductSourceModal(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={1}
            onPress={() => setShowProductSourceModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ width: '80%', maxWidth: 320 }}
            >
              <Box
                bg={isDark ? '$backgroundDark900' : '$white'}
                borderRadius={12}
                p={20}
              >
                <Text
                  fontSize={18}
                  fontWeight="$semibold"
                  color={isDark ? '$textDark50' : '#000'}
                  mb={16}
                  textAlign="center"
                >
                  {t('create.benchmark.modal.title')}
                </Text>

                <VStack space="md">
                  <Pressable
                    onPress={handleSelectFromInventory}
                    bg={isDark ? '$backgroundDark800' : '#F5F5F5'}
                    borderRadius={8}
                    p={16}
                  >
                    <HStack space="sm" alignItems="center">
                      <Feather name="archive" size={20} color={isDark ? '#FFF' : '#000'} />
                      <Text
                        fontSize={15}
                        fontWeight="$medium"
                        color={isDark ? '$textDark50' : '#000'}
                      >
                        {t('create.benchmark.modal.fromInventory')}
                      </Text>
                    </HStack>
                  </Pressable>

                  <Pressable
                    onPress={handleSelectFromCatalog}
                    bg={isDark ? '$backgroundDark800' : '#F5F5F5'}
                    borderRadius={8}
                    p={16}
                  >
                    <HStack space="sm" alignItems="center">
                      <Feather name="grid" size={20} color={isDark ? '#FFF' : '#000'} />
                      <Text
                        fontSize={15}
                        fontWeight="$medium"
                        color={isDark ? '$textDark50' : '#000'}
                      >
                        {t('create.benchmark.modal.fromCatalog')}
                      </Text>
                    </HStack>
                  </Pressable>

                  <Pressable
                    onPress={() => setShowProductSourceModal(false)}
                    bg="transparent"
                    borderWidth={1}
                    borderColor={isDark ? '$borderDark700' : '#E0E0E0'}
                    borderRadius={8}
                    p={16}
                  >
                    <Text
                      fontSize={15}
                      fontWeight="$medium"
                      color={isDark ? '$textDark400' : '#666'}
                      textAlign="center"
                    >
                      {t('create.benchmark.modal.cancel')}
                    </Text>
                  </Pressable>
                </VStack>
              </Box>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Inventory Product Selection Modal */}
        <Modal
          visible={showInventoryModal}
          animationType="slide"
          onRequestClose={() => setShowInventoryModal(false)}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
              <Header
                title={t('create.benchmark.modal.selectFromInventoryTitle')}
                leftAction="back"
                onLeftActionPress={() => setShowInventoryModal(false)}
              />
              <AddProductFromInventory
                onProductSelect={handleInventoryProductSelect}
                onClose={() => setShowInventoryModal(false)}
              />
            </Box>
          </SafeAreaView>
        </Modal>
      </FormProvider>
    </SafeAreaView>
  );
};
