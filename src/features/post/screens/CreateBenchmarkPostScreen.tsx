import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Image, useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider, Controller, useFormContext, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { AddProductFromCatalog } from '@/src/components/AddProductFromCatalog';
import { AddProductFromInventory } from '@/src/components/AddProductFromInventory';
import { Product } from '@/src/mock/catalog/productCatalog/types';
import { InventoryItem } from '@/src/mock/inventory/types';
import { useBenchmarkPostForm } from '../hooks/useBenchmarkPostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ProductComparisonCard } from '../components/ProductComparisonCard';
import { DashedProductCard } from '../components/DashedProductCard';
import { useCreateBenchmarkPost } from '../api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { mapProductInfoTypeToContextType } from '../types';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import type { PostStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BenchmarkPostFormData } from '../schemas/benchmarkPostSchema';

type CreateBenchmarkPostScreenRouteProp = RouteProp<PostStackParamList, 'CreateBenchmarkPostScreen'>;
type CreateBenchmarkPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Product Comparison Field Component
const ProductComparisonField: React.FC = () => {
  const { control, watch, setValue } = useFormContext<BenchmarkPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSource, setProductSource] = useState<'Catalog' | 'Inventory' | null>(null);

  const selectedProduct1 = watch('selectedProduct1');
  const selectedProduct2 = watch('selectedProduct2');
  const selectedChoice = watch('selectedChoice');

  const handleProductSelect = () => {
    openBottomSheet(
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FDFDFB'} px="$4" py="$4">
        <VStack space="md">
          <Text
            fontSize={16}
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '#000000'}
            textAlign="center"
            mb="$2"
          >
            Ürün Seç
          </Text>
          <Pressable
            onPress={() => {
              setProductSource('Inventory');
              setShowProductSelector(true);
              closeBottomSheet();
            }}
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
                  Envanterimden Seç
                </Text>
                <Text
                  fontSize={11}
                  color={isDark ? '$textDark400' : '#787878'}
                >
                  Envanterinizden seçin
                </Text>
              </VStack>
              <Feather
                name="chevron-right"
                size={20}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </HStack>
          </Pressable>
          <Pressable
            onPress={() => {
              setProductSource('Catalog');
              setShowProductSelector(true);
              closeBottomSheet();
            }}
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
                  Katalogdan Seç
                </Text>
                <Text
                  fontSize={11}
                  color={isDark ? '$textDark400' : '#787878'}
                >
                  Ürün kataloğuna göz atın
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
      </Box>,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableDynamicSizing: true,
        animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
        handleIndicatorStyle: {
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 70,
          height: 5,
        },
      }
    );
  };

  const handleCatalogProductSelect = (product: Product) => {
    const nameParts = product.name.split(' ');
    const brand = nameParts.length > 1 ? nameParts[0] : undefined;
    const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
    
    const selectedProduct = {
      id: product.id,
      name: productName,
      brand: brand,
      subName: product.description,
      image: product.image,
      isOwned: false,
    };
    setValue('selectedProduct2', selectedProduct, { shouldValidate: true });
    setShowProductSelector(false);
    setProductSource(null);
  };

  const handleInventoryProductSelect = (product: InventoryItem) => {
    const selectedProduct = {
      id: product.id,
      name: product.model,
      brand: product.brand,
      subName: product.specs,
      image: product.image,
      isOwned: true,
    };
    setValue('selectedProduct2', selectedProduct, { shouldValidate: true });
    setShowProductSelector(false);
    setProductSource(null);
  };

  const handleCloseProductSelector = () => {
    setShowProductSelector(false);
    setProductSource(null);
  };

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
    <VStack px={16} space="xs">
      <Text
        color={isDark ? '$textDark400' : '#B9B9B9'}
        fontSize={10}
        fontWeight="$bold"
      >
        Product Comparison
      </Text>
      <Box position="relative" width="100%">
        <HStack justifyContent="space-between" width="100%" alignItems="stretch">
          {selectedProduct1 ? (
            <Controller
              name="selectedChoice"
              control={control}
              render={({ field: { onChange, value } }) => (
                <ProductComparisonCard
                  product={selectedProduct1}
                  isSelected={value === 'product1'}
                  onPress={() => onChange('product1')}
                />
              )}
            />
          ) : null}
          
          {selectedProduct2 ? (
            <Controller
              name="selectedChoice"
              control={control}
              render={({ field: { onChange, value } }) => (
                <ProductComparisonCard
                  product={selectedProduct2}
                  isSelected={value === 'product2'}
                  onPress={() => onChange('product2')}
                />
              )}
            />
          ) : (
            <DashedProductCard onPress={handleProductSelect} />
          )}
        </HStack>
        
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
  
  // Flow store'dan context bilgilerini al
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);

  // Initialize first product from route params
  useEffect(() => {
    if (product) {
      const nameParts = product.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : undefined;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : product.name;
      
      const initialProduct = {
        id: product.id,
        name: productName,
        brand: brand,
        subName: product.description,
        image: product.image,
        isOwned: false,
      };
      setValue('selectedProduct1', initialProduct, { shouldValidate: true });
    }
  }, [product, setValue]);

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
    
    // ContextType ve contextId kontrolü
    if (!contextType || !contextId) {
      showCustomToast(toast, {
        title: 'Error',
        description: 'Context information not found. Please try again.',
        action: 'error',
      });
      return;
    }
    
    // API contextType'a çevir
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    // Products array'ini oluştur
    const products = [];
    if (data.selectedProduct1) {
      products.push({
        productId: data.selectedProduct1.id,
        isSelected: data.selectedChoice === 'product1',
      });
    }
    if (data.selectedProduct2) {
      products.push({
        productId: data.selectedProduct2.id,
        isSelected: data.selectedChoice === 'product2',
      });
    }
    
    if (products.length < 2) {
      showCustomToast(toast, {
        title: 'Hata',
        description: 'En az 2 ürün seçilmelidir.',
        action: 'error',
      });
      return;
    }
    
    try {
      const response = await createBenchmarkPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: contextId,
        description: data.postText,
        products: products,
        images: data.selectedImages || [],
      });
      
      console.log('[CreateBenchmarkPostScreen] ✅ API Response:', response);
      
      // Başarılı toast göster
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Post Oluşturuldu</ToastTitle>
                <ToastDescription>Karşılaştırma gönderiniz başarıyla oluşturuldu!</ToastDescription>
              </Toast>
            </Box>
          );
        },
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
                          'Post oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      
      showCustomToast(toast, {
        title: 'Hata',
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
              {/* Product Comparison Section */}
              <ProductComparisonField />

              {/* Post Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="postText"
                  placeholder="Type your Comparison Post here..."
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
