import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Image, useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, useRoute, RouteProp, CommonActions, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider, Controller, useFormContext, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
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
import type { PostStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BenchmarkPostFormData } from '../schemas/benchmarkPostSchema';

type CreateBenchmarkPostScreenRouteProp = RouteProp<PostStackParamList, 'CreateBenchmarkPostScreen'>;
type CreateBenchmarkPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Product Benchmark Field Component
const ProductBenchmarkField: React.FC = () => {
  const { control, watch } = useFormContext<BenchmarkPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const selectedProduct1 = watch('selectedProduct1');
  const selectedProduct2 = watch('selectedProduct2');
  const selectedChoice = watch('selectedChoice');

  const handleProductSelect = () => {
    const initialProductForReturn = selectedProduct1
      ? { id: selectedProduct1.id, name: selectedProduct1.name, brand: selectedProduct1.brand, subName: selectedProduct1.subName, image: selectedProduct1.image }
      : undefined;

    navigationService.navigate(ROOT_ROUTES.PRODUCT_SELECT, {
      returnScreen: 'CreateBenchmarkPostScreen',
      selectedProductField: 'selectedProduct2',
      initialProduct: initialProductForReturn,
    });
  };

  return (
    <VStack px={16} space="xs">
      <Text
        color={isDark ? '$textDark400' : '#B9B9B9'}
        fontSize={10}
        fontWeight="$bold"
      >
        Product Benchmark
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
              <DashedProductCard onPress={handleProductSelect} />
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
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateBenchmarkPostScreenNavigationProp>();
  const route = useRoute<CreateBenchmarkPostScreenRouteProp>();
  const { product } = route.params || {};
  const methods = useBenchmarkPostForm();
  const { handleSubmit, formState, setValue } = methods;
  const toast = useToast();
  const createBenchmarkPostMutation = useCreateBenchmarkPost();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);

  // Initialize first product from route params (ekrandaki ürün veya dönüşte korunan initial product)
  useEffect(() => {
    if (product) {
      const nameParts = product.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : (product as any).brand;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
      const subName = (product as any).subName ?? product.description;

      const initialProduct = {
        id: product.id,
        name: productName,
        brand: brand,
        subName: subName,
        image: product.image,
        isOwned: false,
      };
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

        const formattedProduct = {
          id: selectedProduct.id,
          name: selectedProduct.name,
          brand: selectedProduct.brand,
          subName: selectedProduct.description || selectedProduct.subName || '',
          image: selectedProduct.image,
          isOwned: selectedProductField === 'selectedProduct2' && selectedProduct.brand ? true : false,
        };

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
    console.log('[CreateBenchmarkPostScreen] Form submitted:', data);
    
    // Benchmark API: contextType sadece "product" kabul eder; contextId ürün id'lerinden biri olmalı
    if (!data.selectedProduct1?.id || !data.selectedProduct2?.id) {
      showCustomToast(toast, {
        title: 'Error',
        description: 'Two products must be selected.',
        action: 'error',
      });
      return;
    }

    const description = (data.postText || '').trim();
    if (!description) {
      showCustomToast(toast, {
        title: 'Error',
        description: 'Benchmark description is required.',
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
        title: 'Post Created',
        description: 'Your benchmark post has been created successfully!',
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
      
      // Hata toast göster
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'An error occurred while creating the post. Please try again.';
      
      showCustomToast(toast, {
        title: 'Error',
        description: errorMessage,
        action: 'error',
      });
    }
  };

  // Check if share button should be enabled (form is valid)
  const isShareEnabled = formState.isValid;


  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <FormProvider {...methods}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
          {/* Header */}
          <Header
            title="Benchmark Post"
            leftAction="cancel"
            onLeftActionPress={handleBackPress}
            rightButton={{
              text: 'Share',
              backgroundColor: isShareEnabled ? '#D0F205' : '#EDEDED',
              borderWidth: 1,
              borderColor: isShareEnabled ? '#B8CC04' : '#B1B1B1',
              textColor: isShareEnabled ? '#111111' : '#B1B1B1',
              fontSize: 11,
              borderRadius: 25,
              paddingX: 10,
              paddingY: 10,
              onPress: () => {
                // TypeScript type inference issue with react-hook-form handleSubmit
                // useBenchmarkPostForm already uses BenchmarkPostFormData, so this is safe
                const submitHandler = handleSubmit as unknown as (callback: SubmitHandler<BenchmarkPostFormData>) => () => void;
                submitHandler(onSubmit)();
              },
            }}
          />

          {/* Content */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <VStack space="md">
              {/* Product Benchmark Section */}
              <ProductBenchmarkField />

              {/* Post Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="postText"
                  placeholder="Type your Benchmark Description here..."
                  maxLength={500}
                  label="Benchmark Description"
                />
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
      </FormProvider>
    </SafeAreaView>
  );
};
