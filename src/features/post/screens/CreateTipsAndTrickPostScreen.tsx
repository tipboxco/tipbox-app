import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable, useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider, Controller, useFormContext } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { useTipsAndTrickPostForm } from '../hooks/useTipsAndTrickPostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateTipsAndTricksPost } from '../api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { mapProductInfoTypeToContextType } from '../types';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TipsAndTrickPostFormData } from '../schemas/tipsAndTrickPostSchema';

// Mock data for product info
const productInfo = {
  image: require('@/assets/product/product_01.png'),
  title: 'Computers & Tablet\nTechnology Subcategories',
};

// Categories from Figma
const categories = [
  { 
    label: 'Zaman Tasarrufu', 
    value: 'time-saving',
    icon: 'clock' as const
  },
  { 
    label: 'Enerji Verimliliği', 
    value: 'energy-efficiency',
    icon: 'zap' as const
  },
  { 
    label: 'Kalıcılık / Dayanıklılık', 
    value: 'durability',
    icon: 'shield' as const
  },
  { 
    label: 'Daha İyi Sonuç', 
    value: 'better-result',
    icon: 'target' as const
  },
];

type CreateTipsAndTrickPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Category Selector Component with Controller
const CategorySelectorField: React.FC = () => {
  const { control, watch } = useFormContext<TipsAndTrickPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const selectedCategory = watch('selectedCategory');

  return (
    <Controller
      name="selectedCategory"
      control={control}
      render={({ field: { onChange }, fieldState: { error } }) => (
        <VStack space="xs" position="relative">
          <Text
            color={isDark ? '$textDark400' : '#A3A3A3'}
            fontSize={10}
            fontWeight="$semibold"
          >
            Tips & Tricks Category
          </Text>
          <Pressable onPress={() => setShowCategoryModal(!showCategoryModal)}>
            <Box
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor={error ? '#CE4A4A' : '#E9E9E9'}
              borderRadius={10}
              height={44}
              px={16}
              justifyContent="center"
            >
              <HStack
                flex={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Text
                  color={selectedCategory ? (isDark ? '$textDark50' : '#000000') : (isDark ? '#8C8C8C' : '#8C8C8C')}
                  fontSize={10}
                  fontWeight="$medium"
                  flex={1}
                >
                  {selectedCategory
                    ? categories.find((cat) => cat.value === selectedCategory)?.label
                    : 'Select the category of your Tips & Tricks'}
                </Text>
                <Feather
                  name={showCategoryModal ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={isDark ? '#000000' : '#000000'}
                />
              </HStack>
            </Box>
          </Pressable>

          {/* Dropdown List */}
          {showCategoryModal && (
            <Box
              position="absolute"
              top={58}
              left={0}
              right={0}
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderTopWidth={0}
              borderTopLeftRadius={0}
              borderTopRightRadius={0}
              borderBottomLeftRadius={5}
              borderBottomRightRadius={5}
              zIndex={1000}
              overflow="hidden"
            >
              <VStack>
                {categories.map((category, index) => (
                  <Box key={category.value}>
                    {index > 0 && (
                      <Box
                        height={1}
                        bg="#E9E9E9"
                        width="100%"
                      />
                    )}
                    <Pressable
                      onPress={() => {
                        onChange(category.value);
                        setShowCategoryModal(false);
                      }}
                    >
                      <HStack
                        px={12}
                        py={10}
                        alignItems="center"
                        space="sm"
                      >
                        <Feather
                          name={category.icon}
                          size={18}
                          color={isDark ? '#FFFFFF' : '#2F2F2F'}
                        />
                        <Text
                          color={isDark ? '$textDark50' : '#2F2F2F'}
                          fontSize={10}
                          fontWeight="$medium"
                        >
                          {category.label}
                        </Text>
                      </HStack>
                    </Pressable>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          {error && (
            <Text color="#CE4A4A" fontSize={9} px={2}>
              {error.message}
            </Text>
          )}
        </VStack>
      )}
    />
  );
};

export const CreateTipsAndTrickPostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateTipsAndTrickPostScreenNavigationProp>();
  const methods = useTipsAndTrickPostForm();
  const { handleSubmit, formState, getValues, setValue } = methods;
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const toast = useToast();
  const createTipsAndTricksPostMutation = useCreateTipsAndTricksPost();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  
  // Flow store'dan context bilgilerini al
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
  const isValidFlow = useCreatePostFlowStore((state) => state.isValid());
  
  // Debug: Context değerlerini logla
  React.useEffect(() => {
    console.log('[CreateTipsAndTrickPostScreen] 🔍 Context State:', {
      contextType,
      contextId,
      isValidFlow,
      storeState: useCreatePostFlowStore.getState(),
    });
  }, [contextType, contextId, isValidFlow]);

  const handleBackPress = () => {
    // Go back to previous screen
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to Feed screen
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
  };

  const handleImagePicker = async () => {
    try {
      const currentImages = getValues('selectedImages') || [];
      const remainingSlots = 10 - currentImages.length;
      
      if (remainingSlots <= 0) {
        showCustomToast(toast, {
          title: 'Limit Aşıldı',
          description: 'Maksimum 10 görsel seçebilirsiniz.',
          action: 'error',
        });
        return;
      }

      const result = await imagePickerService.pickMultipleFromGallery(remainingSlots);
      
      if (result.success && result.assets && result.assets.length > 0) {
        const newImageUris = result.assets
          .map(asset => asset.uri)
          .filter((uri): uri is string => !!uri);
        
        if (newImageUris.length > 0) {
          const updatedImages = [...currentImages, ...newImageUris];
          setValue('selectedImages', updatedImages, { shouldValidate: true });
        } else {
          showCustomToast(toast, {
            title: 'Hata',
            description: 'Seçilen görsellerin URI\'leri bulunamadı.',
            action: 'error',
          });
        }
      } else if (result.error) {
        showCustomToast(toast, {
          title: 'Hata',
          description: result.error,
          action: 'error',
        });
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      const errorMessage = error?.message || 'Görsel seçilirken bir hata oluştu';
      showCustomToast(toast, {
        title: 'Hata',
        description: errorMessage,
        action: 'error',
      });
    }
  };

  // Form'daki category değerini API formatına çevir
  const mapCategoryToBenefitCategory = (category: string): 'time_saving' | 'energy_efficiency' | 'durability' | 'better_result' => {
    const mapping: Record<string, 'time_saving' | 'energy_efficiency' | 'durability' | 'better_result'> = {
      'time-saving': 'time_saving',
      'energy-efficiency': 'energy_efficiency',
      'durability': 'durability',
      'better-result': 'better_result',
    };
    return mapping[category] || 'time_saving';
  };

  const onSubmit = async (data: TipsAndTrickPostFormData) => {
    console.log('[CreateTipsAndTrickPostScreen] Form submitted:', data);
    
    // Debug: Store state'i kontrol et
    const storeState = useCreatePostFlowStore.getState();
    console.log('[CreateTipsAndTrickPostScreen] 🔍 Store State Check:', {
      contextType,
      contextId,
      isValidFlow,
      storeState: {
        contextType: storeState.contextType,
        contextId: storeState.contextId,
        expiresAt: storeState.expiresAt,
        isExpired: storeState.expiresAt ? Date.now() > storeState.expiresAt : false,
      },
    });
    
    // ContextType ve contextId kontrolü
    if (!contextType || !contextId) {
      console.error('[CreateTipsAndTrickPostScreen] ❌ Missing context:', { contextType, contextId });
      showCustomToast(toast, {
        title: 'Error',
        description: 'Context information not found. Please try again.',
        action: 'error',
      });
      return;
    }
    
    // API contextType'a çevir
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    // Category'yi API formatına çevir
    const benefitCategory = mapCategoryToBenefitCategory(data.selectedCategory);
    
    try {
      const response = await createTipsAndTricksPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: contextId,
        description: data.tipsText,
        benefitCategory: benefitCategory,
        images: data.selectedImages || [],
      });
      
      console.log('[CreateTipsAndTrickPostScreen] ✅ API Response:', response);
      
      // Başarılı toast göster
      showCustomToast(toast, {
        title: 'Post Oluşturuldu',
        description: 'Tips & Tricks gönderiniz başarıyla oluşturuldu!',
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
          queryKey: profileKeys.userTipsAndTricks(user.id),
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
                ...(appRoute?.state && { state: appRoute.state }), // App'in mevcut state'ini koru
              } as any,
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
      console.error('[CreateTipsAndTrickPostScreen] ❌ API Error:', error);
      
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'} position="relative">
          {/* Header */}
          <Header
            title="Tips & Tricks Post"
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
              onPress: handleSubmit(onSubmit),
            }}
          />

          {/* Content */}
          <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setShowCategoryModal(false)}
            keyboardShouldPersistTaps="handled"
          >
            <VStack space="md">
              {/* Product Info Card */}
              <Box px="$4" py="$2">
                <ProductInfoCard
                  image={productInfo.image}
                  title={productInfo.title}
                  size="big"
                  type={ProductInfoType.SUB_CATEGORY}
                />
              </Box>

              {/* Tips & Tricks Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="tipsText"
                  placeholder="Type your Tips & Tricks here..."
                  maxLength={500}
                  label="Tips & Tricks Description"
                />
              </VStack>

              {/* Tips & Tricks Category Section */}
              <VStack px={16} space="xs" mt="$2">
                <CategorySelectorField />
              </VStack>

              {/* Images Section */}
              <VStack px={16} space="xs" mt="$4">
                <ControlledImagePicker
                  name="selectedImages"
                  label="Images"
                  maxImages={10}
                  onImagePicker={handleImagePicker}
                />
              </VStack>
            </VStack>
          </ScrollView>

          {/* Click outside overlay to close dropdown */}
          {showCategoryModal && (
            <Pressable
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={999}
              onPress={() => setShowCategoryModal(false)}
            />
          )}
        </Box>
        </KeyboardAvoidingView>
      </FormProvider>
    </SafeAreaView>
  );
};

