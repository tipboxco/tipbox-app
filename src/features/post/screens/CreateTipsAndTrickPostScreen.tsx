import React, { useState, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable, useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider, Controller, useFormContext } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
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
import { invalidateCatalogPosts } from '../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TipsAndTrickPostFormData } from '../schemas/tipsAndTrickPostSchema';

import { BENEFIT_CATEGORIES } from '../constants/benefitCategories';

// ProductInfo will be loaded from store

type CreateTipsAndTrickPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Category Selector – state lifted to screen for single source of truth
type CategorySelectorFieldProps = {
  showCategoryModal: boolean;
  setShowCategoryModal: (show: boolean) => void;
};

const CategorySelectorField: React.FC<CategorySelectorFieldProps> = ({
  showCategoryModal,
  setShowCategoryModal,
}) => {
  const { t } = useTranslation('post');
  const { control, watch } = useFormContext<TipsAndTrickPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const selectedCategory = watch('selectedCategory');

  return (
    <Controller
      name="selectedCategory"
      control={control}
      render={({ field: { onChange }, fieldState: { error } }) => (
        <VStack space="xs" position="relative">
          <Text
            color={isDark ? '$textDark400' : '#A3A3A3'}
            fontSize="$sm"
            fontWeight="$semibold"
          >
            {t('create.tipsAndTricks.labels.category')}
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
                  fontSize="$sm"
                  fontWeight="$medium"
                  flex={1}
                >
                  {selectedCategory
                    ? t(BENEFIT_CATEGORIES.find((cat) => cat.value === selectedCategory)?.labelKey ?? '')
                    : t('create.tipsAndTricks.placeholders.categorySelect')}
                </Text>
                <Feather
                  name={showCategoryModal ? "chevron-up" : "chevron-down"}
                  size={20}
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
              borderColor={isDark ? '#333333' : '#E9E9E9'}
              borderTopWidth={0}
              borderTopLeftRadius={0}
              borderTopRightRadius={0}
              borderBottomLeftRadius={5}
              borderBottomRightRadius={5}
              zIndex={1000}
              overflow="hidden"
            >
              <VStack>
                {BENEFIT_CATEGORIES.map((category, index) => (
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
                        px="$3"
                        py="$3"
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
                          fontSize="$sm"
                          fontWeight="$medium"
                        >
                          {t(category.labelKey)}
                        </Text>
                      </HStack>
                    </Pressable>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          {error && (
            <Text color="#CE4A4A" fontSize="$xs" px={2}>
              {error.message}
            </Text>
          )}
        </VStack>
      )}
    />
  );
};

export const CreateTipsAndTrickPostScreen = () => {
  const { t } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateTipsAndTrickPostScreenNavigationProp>();
  const methods = useTipsAndTrickPostForm();
  const { handleSubmit, formState, getValues, setValue } = methods;
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isImagePickerLoading, setIsImagePickerLoading] = useState(false);
  const toast = useToast();
  const isSubmittingRef = useRef(false);
  const createTipsAndTricksPostMutation = useCreateTipsAndTricksPost();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  
  // Flow store'dan context bilgilerini al
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const productInfoSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
  const isValidFlow = useCreatePostFlowStore((state) => state.isValid());
  
  // Debug: Context değerlerini logla
  React.useEffect(() => {
    console.log('[CreateTipsAndTrickPostScreen] 🔍 Context State:', {
      contextType,
      contextId,
      productInfoSnapshot,
      isValidFlow,
      storeState: useCreatePostFlowStore.getState(),
    });
  }, [contextType, contextId, productInfoSnapshot, isValidFlow]);

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
    setIsImagePickerLoading(true);
    try {
      const currentImages = getValues('selectedImages') || [];
      const remainingSlots = 10 - currentImages.length;

      if (remainingSlots <= 0) {
        showCustomToast(toast, {
          title: t('create.toast.limitExceeded.title'),
          description: t('create.toast.limitExceeded.description'),
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
            title: t('create.common.errors.title'),
            description: t('create.common.validation.imageUriNotFound'),
            action: 'error',
          });
        }
      } else if (result.error) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: result.error,
          action: 'error',
        });
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      const errorMessage = error?.message || t('create.common.validation.imagePickerError');
      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: errorMessage,
        action: 'error',
      });
    } finally {
      setIsImagePickerLoading(false);
    }
  };

  // Not needed - BENEFIT_CATEGORIES already uses snake_case values

  const onSubmit = async (data: TipsAndTrickPostFormData) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
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
        title: t('create.common.errors.title'),
        description: t('create.tipsAndTricks.validation.contextMissing'),
        action: 'error',
      });
      return;
    }
    
    // API contextType'a çevir
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    // benefitCategory directly from form (already in snake_case format)
    const benefitCategory = data.selectedCategory;
    
    // Validate contextId before sending
    if (!contextId || contextId.trim() === '') {
      console.error('[CreateTipsAndTrickPostScreen] ❌ Empty or invalid contextId:', contextId);
      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: t('create.tipsAndTricks.validation.invalidContext'),
        action: 'error',
      });
      return;
    }
    
    console.log('[CreateTipsAndTrickPostScreen] 📤 Sending request:', {
      contextType: apiContextType,
      contextId: contextId,
      contextIdLength: contextId.length,
      benefitCategory: benefitCategory,
      descriptionLength: data.tipsText?.length || 0,
      imagesCount: data.selectedImages?.length || 0,
    });
    
    console.log('[CreateTipsAndTrickPostScreen] 📋 Context Details:', {
      contextType,
      contextId,
      productInfoSnapshot,
      apiContextType,
    });
    
    try {
      const response = await createTipsAndTricksPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: contextId.trim(), // Trim whitespace
        description: data.tipsText,
        benefitCategory: benefitCategory,
        images: data.selectedImages || [],
      });
      
      console.log('[CreateTipsAndTrickPostScreen] ✅ API Response:', response);

      // Başarılı toast göster
      showCustomToast(toast, {
        title: t('create.tipsAndTricks.success.title'),
        description: t('create.tipsAndTricks.success.description'),
        action: 'success',
      });
      
      // Invalidate catalog posts to refresh the feed
      if (apiContextType && contextId) {
        invalidateCatalogPosts(queryClient, apiContextType, contextId);
      }
      
      // Profil verilerini invalidate et - yeni post görünsün
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.userPosts(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.userTipsAndTricks(user.id),
        });
      }
      
      // Save context info before clearing flow
      const savedContextType = contextType;
      const savedContextId = contextId;
      const savedProductInfo = productInfoSnapshot;
      
      // Clear flow context on successful submit
      clearFlow();
      
      // Navigate to PostsScreen if context is available
      // CRITICAL: Clear navigation stack to prevent going back to create post screens
      if (savedContextType && savedContextId && savedProductInfo) {
        // Determine stage from contextType
        let stage: 'SubCategories' | 'ProductGroup' | 'Product' = 'SubCategories';
        switch (savedContextType) {
          case ProductInfoType.PRODUCT:
            stage = 'Product';
            break;
          case ProductInfoType.PRODUCT_GROUP:
            stage = 'ProductGroup';
            break;
          case ProductInfoType.SUB_CATEGORY:
            stage = 'SubCategories';
            break;
        }
        
        // Get current navigation state to preserve App state
        const currentState = navigation.getState();
        const appRoute = currentState?.routes?.find((route) => route.name === 'App');
        
        // Reset navigation stack and navigate to PostsScreen
        // This clears all create post screens from the stack
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              {
                name: 'App',
                state: appRoute?.state,
              },
              {
                name: ROOT_ROUTES.POST as any,
                state: {
                  routes: [
                    {
                      name: 'PostsScreen' as any,
                      params: {
                        stage,
                        name: savedProductInfo.title,
                        productInfo: savedProductInfo,
                        contextType: savedContextType,
                        contextId: savedContextId,
                      },
                    },
                  ],
                  index: 0,
                },
              },
            ],
          })
        );
      } else if (user?.id) {
        // Fallback: ProfileScreen'e yönlendir
        const currentState = navigation.getState();
        const appRoute = currentState?.routes?.find((route) => route.name === 'App');
        
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              {
                name: 'App',
                ...(appRoute?.state && { state: appRoute.state }),
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
      console.error('[CreateTipsAndTrickPostScreen] ❌ API Error:', {
        error,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        responseMessage: error?.response?.data?.message,
        responseError: error?.response?.data?.error,
        requestData: {
          contextType: apiContextType,
          contextId: contextId,
          contextIdLength: contextId?.length || 0,
          descriptionLength: data.tipsText?.length || 0,
          benefitCategory: benefitCategory,
          imagesCount: data.selectedImages?.length || 0,
        },
        errorMessage: error?.message,
        errorStack: error?.stack,
      });
      
      // Backend'den gelen detaylı hata mesajını al (description her zaman string olmalı; obje React hatası verir)
      let errorMessage = t('create.common.errors.general');
      const errObj = error?.response?.data?.error;
      const errMsg = typeof errObj?.message === 'string' ? errObj.message : undefined;
      if (error?.response?.data?.message && typeof error.response.data.message === 'string') {
        errorMessage = error.response.data.message;
      } else if (errMsg) {
        errorMessage = errMsg;
      } else if (error?.response?.status === 500) {
        errorMessage = t('create.tipsAndTricks.errors.serverError');
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || t('create.tipsAndTricks.errors.badRequest');
      } else if (error?.response?.status === 401) {
        errorMessage = t('create.tipsAndTricks.errors.unauthorized');
      } else if (error?.response?.status === 403) {
        errorMessage = t('create.tipsAndTricks.errors.forbidden');
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: errorMessage,
        action: 'error',
      });
    }
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Check if share button should be enabled (form is valid)
  const isShareEnabled = formState.isValid;
  const isShareLoading = createTipsAndTricksPostMutation.isPending;

  const handleSharePress = () => {
    Keyboard.dismiss();
    handleSubmit(onSubmit)();
  };

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
            title={t('create.tipsAndTricks.header.title')}
            leftAction="cancel"
            onLeftActionPress={handleBackPress}
            rightButton={{
              text: t('create.tipsAndTricks.header.share'),
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
          <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setShowCategoryModal(false)}
            keyboardShouldPersistTaps="handled"
          >
            <VStack space="md">
              {/* Product Info Card */}
              {productInfoSnapshot && (
                <Box px="$4" py="$2">
                  <ProductInfoCard
                    image={productInfoSnapshot.image}
                    title={productInfoSnapshot.title}
                    subName={productInfoSnapshot.subName}
                    size="big"
                    type={contextType || ProductInfoType.SUB_CATEGORY}
                  />
                </Box>
              )}

              {/* Tips & Tricks Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="tipsText"
                  placeholder={t('create.tipsAndTricks.placeholders.description')}
                  maxLength={500}
                  label={t('create.tipsAndTricks.labels.description')}
                />
              </VStack>

              {/* Tips & Tricks Category Section - single state from screen */}
              <VStack px={16} space="xs" mt="$2">
                <CategorySelectorField
                  showCategoryModal={showCategoryModal}
                  setShowCategoryModal={setShowCategoryModal}
                />
              </VStack>

              {/* Images Section */}
              <VStack px={16} space="xs" mt="$4">
                <ControlledImagePicker
                  name="selectedImages"
                  label={t('create.tipsAndTricks.labels.images')}
                  maxImages={10}
                  onImagePicker={handleImagePicker}
                  isLoading={isImagePickerLoading}
                />
              </VStack>
            </VStack>
          </ScrollView>

          {/* Overlay kaldırıldı: zIndex sibling-only çalıştığı için dropdown item'ları engelliyor.
              Dropdown zaten scroll (onScrollBeginDrag), item seçimi ve toggle ile kapanıyor. */}
        </Box>
        </KeyboardAvoidingView>
      </FormProvider>
    </SafeAreaView>
  );
};

