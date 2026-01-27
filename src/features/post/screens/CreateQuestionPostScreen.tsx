import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, useToast } from '@gluestack-ui/themed';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { InformationCircleIcon } from 'react-native-heroicons/outline';
import { FormProvider, Controller, useFormContext, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { BoostOptionCard } from '../components/BoostOptionCard';
import { useQuestionPostForm } from '../hooks/useQuestionPostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateQuestionPost, useBoostOptions } from '../api/hooks';
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
import type { BoostOption } from '../api/postApi';

// ProductInfo will be loaded from store

type CreateQuestionPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Boost Options Component with Controller
const BoostOptionsField: React.FC<{ boostOptions: BoostOption[] }> = ({ boostOptions }) => {
  const { control, watch } = useFormContext<QuestionPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const selectedBoost = watch('selectedBoost');

  return (
    <Controller
      name="selectedBoost"
      control={control}
      render={({ field: { onChange } }) => (
        <VStack space="xs">
          {boostOptions.map((option) => (
            <BoostOptionCard
              key={option.id}
              id={option.id}
              title={option.title}
              price={`${option.amount} TIPS`}
              description={option.description}
              borderColor="#829905"
              iconBg="#829905"
              isPopular={option.isPopular}
              isSelected={selectedBoost === option.id}
              onPress={() => onChange(option.id)}
            />
          ))}
        </VStack>
      )}
    />
  );
};

export const CreateQuestionPostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateQuestionPostScreenNavigationProp>();
  const methods = useQuestionPostForm();
  const { formState, getValues, setValue } = methods;
  const handleSubmit = methods.handleSubmit;
  const toast = useToast();
  const createQuestionPostMutation = useCreateQuestionPost();
  const { user, walletBalance: storeBalance } = useAppStore();
  
  // Realtime wallet balance - Store'dan al, yoksa API'den getir
  const { data: walletBalance, isLoading: isLoadingBalance } = useWalletBalance();
  // Store'daki balance varsa onu kullan, yoksa API'den gelen balance'ı kullan
  const availableTips = storeBalance !== null && storeBalance !== undefined ? storeBalance : (walletBalance?.balance || 0);
  
  const queryClient = useQueryClient();
  
  // Fetch boost options from API
  const { data: boostOptions = [], isLoading: isLoadingBoostOptions, error: boostOptionsError } = useBoostOptions();
  
  // Get context information from flow store
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const productInfoSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
  const isValidFlow = useCreatePostFlowStore((state) => state.isValid());
  
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
      const currentImages = getValues('selectedImages') || [];
      const remainingSlots = 10 - currentImages.length;
      
      if (remainingSlots <= 0) {
        showCustomToast(toast, {
          title: 'Limit Exceeded',
          description: 'You can select a maximum of 10 images.',
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
            title: 'Error',
            description: "Selected image URIs could not be found.",
            action: 'error',
          });
        }
      } else if (result.error) {
        showCustomToast(toast, {
          title: 'Error',
          description: result.error,
          action: 'error',
        });
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      const errorMessage = error?.message || 'An error occurred while selecting images';
      showCustomToast(toast, {
        title: 'Error',
        description: errorMessage,
        action: 'error',
      });
    }
  };

  // Find boost option ID (selectedBoost in form is now the actual boost option ID)
  const getBoostOptionId = (selectedBoost: string): string | null => {
    // Return null if boost option is not selected or is empty string
    if (!selectedBoost || selectedBoost.trim() === '') {
      return null;
    }
    
    // Search for this ID in boost options list
    const foundOption = boostOptions.find(option => option.id === selectedBoost);
    if (foundOption) {
      return foundOption.id; // Actual UUID ID
    }
    
    // Return null if not found (won't be sent to backend)
    console.warn('[CreateQuestionPostScreen] Boost option not found:', selectedBoost);
    return null;
  };

  const onSubmit: SubmitHandler<QuestionPostFormData> = async (data) => {
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
        title: 'Error',
        description: 'Context information not found. Please try again.',
        action: 'error',
      });
      return;
    }
    
    // Convert to API contextType
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    // Get boost option ID (actual UUID)
    const selectedBoostOptionId = getBoostOptionId(data.selectedBoost);
    
    // Boost option ID check (backend requires it)
    if (!selectedBoostOptionId) {
      showCustomToast(toast, {
        title: 'Missing Information',
        description: 'Boost selection is required.',
        action: 'error',
      });
      return;
    }
    
    console.log('[CreateQuestionPostScreen] Submitting with:', {
      contextType: apiContextType,
      contextId: contextId,
      description: data.questionText,
      selectedBoostOptionId: selectedBoostOptionId,
      imagesCount: data.selectedImages?.length || 0,
    });
    
    try {
      const response = await createQuestionPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: contextId,
        description: data.questionText,
        selectedBoostOptionId: selectedBoostOptionId,
        images: data.selectedImages || [],
      });
      
      console.log('[CreateQuestionPostScreen] ✅ API Response:', response);
      
      // Show success toast
      showCustomToast(toast, {
        title: 'Question Post Created',
        description: 'Your question post has been shared successfully!',
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
      
      // Show error toast
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
          {/* Header */}
          <Header
            title="Question Post"
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
              onPress: methods.handleSubmit(onSubmit),
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
                  placeholder="Type your Question here..."
                  maxLength={500}
                  label="Question Description"
                />
              </VStack>

              {/* Images Section */}
              <VStack px={16} space="xs">
                <ControlledImagePicker
                  name="selectedImages"
                  label="Images"
                  maxImages={10}
                  onImagePicker={handleImagePicker}
                />
              </VStack>

              {/* Boost this Question Section */}
              <VStack px={16} space="xs">
                {/* Section Title */}
                <Text
                  color={isDark ? '$textDark400' : '#A3A3A3'}
                  fontSize="$sm"
                  fontWeight="$bold"
                >
                  Boost this Question
                </Text>

                {/* Boost Options */}
                {isLoadingBoostOptions ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '$textDark400' : '#A3A3A3'} fontSize="$sm">
                      Loading boost options...
                    </Text>
                  </Box>
                ) : boostOptionsError ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '$red500' : '#EF4444'} fontSize="$sm">
                      Error loading boost options
                    </Text>
                  </Box>
                ) : boostOptions.length === 0 ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '$textDark400' : '#A3A3A3'} fontSize="$sm">
                      No boost options found
                    </Text>
                  </Box>
                ) : (
                  <BoostOptionsField boostOptions={boostOptions} />
                )}

                {/* TIPS Available Info */}
                <HStack alignItems="center" space="xs">
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
                    You currently have {availableTips} TIPS available
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

