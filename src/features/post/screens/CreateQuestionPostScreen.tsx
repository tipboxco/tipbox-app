import React, { useState, useRef } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, useToast, Switch, Divider } from '@gluestack-ui/themed';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { InformationCircleIcon, ArrowTrendingUpIcon } from 'react-native-heroicons/outline';
import { FormProvider, Controller, useFormContext, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { useQuestionPostForm } from '../hooks/useQuestionPostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateQuestionPost, useBoostPrice } from '../api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { mapProductInfoTypeToContextType } from '../types';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { useWalletBalance } from '@/src/features/wallet/api/hooks';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { invalidateCatalogPosts } from '../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { showCustomToast } from '@/src/components/CustomToast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { QuestionPostFormData } from '../schemas/questionPostSchema';

// ProductInfo will be loaded from store

type CreateQuestionPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** TIPS to USD display rate (e.g. 100 TIPS = $1) */
const TIPS_TO_USD_RATE = 100;

// Boost Switch Component with Controller + Available / Boost Price row
const BoostSwitchField: React.FC<{
  boostPrice?: number;
  isLoadingPrice: boolean;
  availableTips: number;
}> = ({ boostPrice, isLoadingPrice, availableTips }) => {
  const { t } = useTranslation('post');
  const { control, watch } = useFormContext<QuestionPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const greyLabel = isDark ? '$textDark400' : '#787878';
  const greyValue = isDark ? '#A3A3A3' : '#A3A3A3';

  return (
    <Controller
      name="boostEnabled"
      control={control}
      render={({ field: { onChange, value } }) => (
        <Box
          px={16}
          py={12}
          bg={isDark ? '$backgroundDark900' : '$white'}
          borderRadius={12}
          borderWidth={1}
          borderColor={isDark ? '#333333' : '#E9E9E9'}
        >
          <HStack alignItems="center" justifyContent="space-between">
            <Box
              w={36}
              h={36}
              borderRadius={8}
              bg={isDark ? '#333333' : '#E9E9E9'}
              alignItems="center"
              justifyContent="center"
              mr={12}
            >
              <ArrowTrendingUpIcon
                width={20}
                height={20}
                color={isDark ? '#A3A3A3' : '#787878'}
              />
            </Box>
            <VStack flex={1} mr={12}>
              <Text
                color={isDark ? '$textDark50' : '#000'}
                fontSize="$sm"
                fontWeight="$semibold"
                mb={4}
              >
                {t('create.question.boost.title')}
              </Text>
              <Text
                color={isDark ? '$textDark400' : '#787878'}
                fontSize={11}
                lineHeight={14}
              >
                {isLoadingPrice
                  ? t('create.question.boost.calculating')
                  : value
                    ? (boostPrice != null ? t('create.question.boost.activeTips', { price: boostPrice }) : t('create.question.boost.active'))
                    : t('create.question.boost.description')}
              </Text>
            </VStack>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{
                false: isDark ? '#333333' : '#E9E9E9',
                true: '#829905',
              }}
              thumbColor={value ? '#B8CC04' : (isDark ? '#666666' : '#FFFFFF')}
              disabled={isLoadingPrice}
            />
          </HStack>

          <Divider my={12} bg={isDark ? '#333333' : '#E9E9E9'} />

          <HStack justifyContent="space-between" alignItems="flex-start">
            <VStack alignItems="flex-start" flex={1}>
              <Text color={greyLabel} fontSize={10} mb={4}>
                {t('create.question.boost.available')}
              </Text>
              <Text color={greyValue} fontSize="$sm" fontWeight="$medium">
                {availableTips} TIPS
              </Text>
              <Text color={greyLabel} fontSize={10} mt={2}>
                (${(availableTips / TIPS_TO_USD_RATE).toFixed(0)})
              </Text>
            </VStack>
            <VStack alignItems="flex-end" flex={1}>
              <Text color={greyLabel} fontSize={10} mb={4}>
                {t('create.question.boost.boostPrice')}
              </Text>
              <Text
                color={isLoadingPrice ? greyValue : '#829905'}
                fontSize="$sm"
                fontWeight="$semibold"
              >
                {isLoadingPrice ? '—' : `${boostPrice ?? 0} TIPS`}
              </Text>
              <Text color={greyLabel} fontSize={10} mt={2}>
                ({isLoadingPrice ? '—' : `$${((boostPrice ?? 0) / TIPS_TO_USD_RATE).toFixed(1)}`})
              </Text>
            </VStack>
          </HStack>
        </Box>
      )}
    />
  );
};

export const CreateQuestionPostScreen = () => {
  const { t } = useTranslation('post');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateQuestionPostScreenNavigationProp>();
  const methods = useQuestionPostForm();
  const { formState, getValues, setValue } = methods;
  const handleSubmit = methods.handleSubmit;
  const toast = useToast();
  const createQuestionPostMutation = useCreateQuestionPost();
  const isSubmittingRef = useRef(false);
  const { user, walletBalance: storeBalance } = useAppStore();
  const [isImagePickerLoading, setIsImagePickerLoading] = useState(false);
  
  // Realtime wallet balance - Store'dan al, yoksa API'den getir
  const { data: walletBalance, isLoading: isLoadingBalance } = useWalletBalance();
  // Store'daki balance varsa onu kullan, yoksa API'den gelen balance'ı kullan
  const availableTips = storeBalance !== null && storeBalance !== undefined ? storeBalance : (walletBalance?.balance || 0);
  
  const queryClient = useQueryClient();

  // Fetch dynamic boost price from API
  const { data: boostPriceData, isLoading: isLoadingBoostPrice, error: boostPriceError } = useBoostPrice();

  // Get context information from flow store
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const productInfoSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
  const isValidFlow = useCreatePostFlowStore((state) => state.isValid());

  // ✅ QUESTION POST: Envanter kontrolü YAPILMAZ (kullanıcılar sahip olmadıkları ürünler hakkında soru sorabilir)
  
  // Debug: Log boost price state
  React.useEffect(() => {
    console.log('[CreateQuestionPostScreen] 🔍 Boost Price State:', {
      isLoadingBoostPrice,
      boostPrice: boostPriceData?.price,
      currency: boostPriceData?.currency,
      factors: boostPriceData?.factors,
      hasError: !!boostPriceError,
      error: boostPriceError?.message,
    });
  }, [boostPriceData, isLoadingBoostPrice, boostPriceError]);
  
  // Debug: Log context values
  React.useEffect(() => {
    console.log('[CreateQuestionPostScreen] 🔍 Context State:', {
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
      // ARCHITECTURE FIX: Correct navigation structure: App → MainTabs → FeedScreen
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
      setIsImagePickerLoading(true);
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

  const onSubmit: SubmitHandler<QuestionPostFormData> = async (data) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
    console.log('[CreateQuestionPostScreen] Form submitted:', data);

    // Debug: Check store state
    const storeState = useCreatePostFlowStore.getState();
    console.log('[CreateQuestionPostScreen] 🔍 Store State Check:', {
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

    // Check contextType and contextId
    if (!contextType || !contextId) {
      console.error('[CreateQuestionPostScreen] ❌ Missing context:', { contextType, contextId });
      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: t('create.question.validation.contextMissing'),
        action: 'error',
      });
      return;
    }

    // ✅ QUESTION POST: Envanter kontrolü YOK (kullanıcılar sahip olmadıkları ürünler hakkında soru sorabilir)

    // Convert to API contextType
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    console.log('[CreateQuestionPostScreen] Submitting with:', {
      contextType: apiContextType,
      contextId: contextId,
      description: data.questionText,
      boostEnabled: data.boostEnabled,
      imagesCount: data.selectedImages?.length || 0,
    });
    
    console.log('[CreateQuestionPostScreen] 📋 Context Details:', {
      contextType,
      contextId,
      productInfoSnapshot,
      apiContextType,
    });
    
    try {
      const response = await createQuestionPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: contextId,
        description: data.questionText,
        boostEnabled: data.boostEnabled,
        images: data.selectedImages || [],
      });
      
      console.log('[CreateQuestionPostScreen] ✅ API Response:', response);

      // Show success toast
      showCustomToast(toast, {
        title: t('create.question.success.title'),
        description: t('create.question.success.description'),
        action: 'success',
      });
      
      // Invalidate catalog posts to refresh the feed
      if (apiContextType && contextId) {
        invalidateCatalogPosts(queryClient, apiContextType, contextId);
      }
      
      // Invalidate profile data - new post should be visible
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.userPosts(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.userReplies(user.id),
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
              } as any,
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
              } as any,
            ],
          })
        );
      } else if (user?.id) {
        // Fallback: Navigate to ProfileScreen
        const currentState = navigation.getState();
        const appRoute = currentState?.routes?.find((route) => route.name === 'App');
        
        navigation.dispatch(
          CommonActions.reset({
            index: 1,
            routes: [
              {
                name: 'App',
                state: appRoute?.state,
              } as any,
              {
                name: 'Profile',
                params: {
                  screen: 'ProfileMain',
                  params: { userId: user.id },
                },
              } as any,
            ],
          })
        );
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
    } catch (error: any) {
      console.error('[CreateQuestionPostScreen] ❌ API Error:', error);

      // Backend hata kodlarını kontrol et
      const errorCode = error?.response?.data?.code;
      const errorMessage = error?.response?.data?.message;

      // Context not found hatası
      if (errorCode === 'CONTEXT_NOT_FOUND') {
        showCustomToast(toast, {
          title: t('create.question.validation.productNotFound.title'),
          description: t('create.question.validation.productNotFound.description'),
          action: 'error',
        });
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

  // Check if share button should be enabled (form is valid)
  const isShareEnabled = formState.isValid;
  const isShareLoading = createQuestionPostMutation.isPending;

  const handleSharePress = () => {
    Keyboard.dismiss();
    methods.handleSubmit(onSubmit)();
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <FormProvider {...methods}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
          {/* Header */}
          <Header
            title={t('create.question.header.title')}
            leftAction="cancel"
            onLeftActionPress={handleBackPress}
            rightButton={{
              text: t('create.question.header.share'),
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
          <ScrollView flex={1} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack space="md" pb={100}>
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

              {/* Question Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="questionText"
                  placeholder={t('create.question.placeholders.description')}
                  maxLength={500}
                  label={t('create.question.labels.description')}
                />
              </VStack>

              {/* Images Section */}
              <VStack px={16} space="xs">
                <ControlledImagePicker
                  name="selectedImages"
                  label={t('create.question.labels.images')}
                  maxImages={10}
                  onImagePicker={handleImagePicker}
                  isLoading={isImagePickerLoading}
                />
              </VStack>

              {/* Boost this Question Section */}
              <VStack px={16} space="xs">
                {/* Section Title */}
                <Text
                  color={isDark ? '$textDark400' : '#A3A3A3'}
                  fontSize="$sm"
                  fontWeight="$bold"
                  mb={8}
                >
                  {t('create.question.labels.boostSection')}
                </Text>

                {/* Boost Switch */}
                {boostPriceError ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '$red500' : '#EF4444'} fontSize="$sm">
                      {t('create.question.boost.errorLoading')}
                    </Text>
                  </Box>
                ) : (
                  <BoostSwitchField
                    boostPrice={boostPriceData?.price}
                    isLoadingPrice={isLoadingBoostPrice}
                    availableTips={availableTips}
                  />
                )}

                {/* TIPS Available Info */}
                <HStack alignItems="center" space="xs" mt={12}>
                  <InformationCircleIcon
                    width={18}
                    height={18}
                    color={isDark ? '#FFFFFF' : '#A3A3A3'}
                  />
                  <Text
                    color={isDark ? '$textDark400' : '#A3A3A3'}
                    fontSize="$sm"
                    fontWeight="$medium"
                  >
                    {t('create.question.boost.tipsAvailable', { tips: availableTips })}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
        </KeyboardAvoidingView>
      </FormProvider>
    </SafeAreaView>
  );
};

