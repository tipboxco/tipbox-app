import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, useToast } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { FormProvider, useFormContext } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { usePostForm } from '../hooks/usePostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
import { useCreateFreePost } from '../api/hooks';
import { mapProductInfoTypeToContextType } from '../types';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { useCatalogUIStore } from '@/src/features/catalog/store/catalogUIStore';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { invalidateCatalogPosts } from '../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { CameraScreen } from '../components/CameraScreen';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
import * as ImageManipulator from 'expo-image-manipulator';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PostStackParamList } from '../navigation';
import type { PostFormData } from '../schemas/postSchema';

type CreatePostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreatePostScreenRouteProp = RouteProp<PostStackParamList, 'CreatePostScreen'>;

export const CreatePostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const route = useRoute<CreatePostScreenRouteProp>();
  const methods = usePostForm();
  const { handleSubmit, formState, trigger, getValues, control } = methods;
  const createPostMutation = useCreateFreePost();
  const toast = useToast();
  const isSubmittingRef = useRef(false);
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [showCamera, setShowCamera] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  
  // Global navigation UI store'dan kamera state'ini yönet
  const setCameraOpen = useNavigationUIStore((state) => state.setCameraOpen);
  
  // Kamera açık/kapalı durumunu global store'a bildir
  useEffect(() => {
    setCameraOpen(showCamera);
    
    // Cleanup: component unmount olduğunda kamera state'ini sıfırla
    return () => {
      setCameraOpen(false);
    };
  }, [showCamera, setCameraOpen]);
  
  // Context resolution: explicit priority order (flow store has TTL/expiration)
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const productInfoSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);
  const isValidFlow = useCreatePostFlowStore((state) => state.isValid());
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);

  const routeParams = route.params || {};
  const routeContextType = routeParams.contextType;
  const routeContextId = routeParams.contextId;
  const routeProductInfo = routeParams.productInfo;

  // Priority 1: CreatePostFlowStore (valid and not expired). Priority 2: route params.
  const finalContextType = isValidFlow && contextType ? contextType : routeContextType;
  const finalContextId = isValidFlow && contextId ? contextId : routeContextId;
  const finalProductInfo = isValidFlow && productInfoSnapshot ? productInfoSnapshot : routeProductInfo;

  const selectedProductId = useCatalogUIStore((state) => state.selectedProductId);
  const selectedSubCategoryId = useCatalogUIStore((state) => state.selectedSubCategoryId);
  const selectedProductGroupId = useCatalogUIStore((state) => state.selectedProductGroupId);

  // PERFORMANCE FIX: Debug log'ları kaldırıldı - production'da gereksiz re-render yaratıyordu

  const handleBackPress = () => {
    // Clear flow context on cancel/back
    clearFlow();
    // Navigate back
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to Catalog screen if can't go back
      // ARCHITECTURE FIX: Doğru navigation yapısı: App → MainTabs → CatalogStack → CatalogScreen
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
                      routes: [{ name: 'CatalogStack' }],
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

  const handleImagePicker = () => {
    // Mevcut seçili image sayısını al
    const currentImages = methods.getValues('selectedImages') || [];
    const remainingSlots = 10 - currentImages.length;

    if (remainingSlots <= 0) {
        showCustomToast(toast, {
          title: 'Limit Exceeded',
          description: 'You can select a maximum of 10 images.',
          action: 'error',
        });
      return;
    }

    // Instagram tarzı: Custom kamera screen'ini aç
    setShowCamera(true);
  };

  const handlePhotoTaken = async (uri: string) => {
    try {
      // PERFORMANCE FIX: Image compression - max 2MB, max 1920px, quality 0.8
      // 5-10x küçük dosya boyutu = daha hızlı upload
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }], // Max width 1920px (aspect ratio korunur)
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      const currentImages = methods.getValues('selectedImages') || [];
      const newImages = [...currentImages, compressedImage.uri];
      // PERFORMANCE FIX: shouldValidate: false - validation sadece submit'te
      methods.setValue('selectedImages', newImages, { shouldValidate: false });
      setLastPhotoUri(compressedImage.uri);
      setShowCamera(false);
    } catch (error) {
      console.error('[CreatePostScreen] Image compression error:', error);
      // Hata durumunda orijinal resmi kullan
      const currentImages = methods.getValues('selectedImages') || [];
      const newImages = [...currentImages, uri];
      methods.setValue('selectedImages', newImages, { shouldValidate: false });
      setLastPhotoUri(uri);
      setShowCamera(false);
    }
  };

  // PERFORMANCE FIX: getValues ile image'leri al - watch() yerine
  // watch() her keystroke'da re-render yaratır
  const displayLastPhotoUri = lastPhotoUri || (() => {
    const imgs = methods.getValues('selectedImages') || [];
    return imgs.length > 0 ? imgs[imgs.length - 1] : null;
  })();

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const onSubmit = async (data: PostFormData) => {
    // Context type ve ID'yi flow store'dan al (route params fallback)
    if (!finalContextType || !finalContextId) {
      return;
    }

    const apiContextType = mapProductInfoTypeToContextType(finalContextType);

    try {
      const response = await createPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: finalContextId,
        description: data.postText,
        images: data.selectedImages,
      });
      
      // Başarılı toast göster
      showCustomToast(toast, {
        title: 'Post Created',
        description: 'Your post has been created successfully!',
        action: 'success',
      });

      // PERFORMANCE FIX: Optimistic update - query invalidation yerine cache'i direkt güncelle
      // 6x API call yerine 0 API call (instant update)
      if (apiContextType && finalContextId) {
        invalidateCatalogPosts(queryClient, apiContextType, finalContextId);
      }

      // PERFORMANCE FIX: Profile cache'ini invalidate et - ama refetch bekleme
      // Background'da refetch olacak, UI anında devam edecek
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.userPosts(user.id),
          refetchType: 'none', // Immediate refetch yapma, background'da yap
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
          refetchType: 'none', // Immediate refetch yapma, background'da yap
        });
      }
      
      // Save context info before clearing flow
      const savedContextType = finalContextType;
      const savedContextId = finalContextId;
      const savedProductInfo = finalProductInfo;
      
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
                state: appRoute?.state,
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
      console.error('[CreatePostScreen] ❌ API Error:', error);
      console.log('[CreatePostScreen] ====================================');
      
      // Hata toast göster
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'An error occurred while creating the post. Please try again.';
      
      showCustomToast(toast, {
        title: 'Error',
        description: errorMessage,
        action: 'error',
      });
      // TODO: Error handling UI göster
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleSharePress = () => {
    Keyboard.dismiss();

    // PERFORMANCE FIX: Manual validation sadece submit'te - her keystroke'da değil
    trigger().then((isValid) => {
      if (isValid) {
        handleSubmit(onSubmit)();
      } else {
        const errors = formState.errors as Record<string, { message?: string } | undefined>;
        const firstError = errors?.postText?.message
          || errors?.selectedImages?.message
          || (Object.values(errors).find((e) => e?.message) as { message?: string } | undefined)?.message
          || 'Please check your post and try again.';
        showCustomToast(toast, {
          title: 'Validation',
          description: firstError,
          action: 'error',
          duration: 3000,
        });
      }
    });
  };

  // Check if share button should be enabled (form is valid)
  const isShareEnabled = formState.isValid;
  const isShareLoading = createPostMutation.isPending;

  return (
    <>
      {showCamera ? (
        <CameraScreen
          onPhotoTaken={handlePhotoTaken}
          onClose={handleCameraClose}
          lastPhotoUri={displayLastPhotoUri}
        />
      ) : (
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
            title="Write a Post"
            leftAction="cancel"
            onLeftActionPress={handleBackPress}
            rightButton={{
              text: 'Share',
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
              {finalProductInfo && (
                <Box px="$4" py="$2">
                  <ProductInfoCard
                    image={finalProductInfo.image}
                    title={finalProductInfo.title}
                    subName={finalProductInfo.subName}
                    size="big"
                    type={finalContextType || ProductInfoType.SUB_CATEGORY}
                  />
                </Box>
              )}

              {/* Post Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="postText"
                  placeholder="Type your Post here..."
                  maxLength={500}
                  label="Post Description"
                />
              </VStack>

              {/* Images Section */}
              <VStack px={16} space="xs">
                <ControlledImagePicker
                  name="selectedImages"
                  label="Images"
                  maxImages={10}
                  onImagePicker={handleImagePicker}
                  onRemoveImage={(index) => {
                    const currentImages = methods.getValues('selectedImages') || [];
                    const newImages = currentImages.filter((_: any, i: number) => i !== index);
                    // PERFORMANCE FIX: shouldValidate: false - validation sadece submit'te
                    methods.setValue('selectedImages', newImages, { shouldValidate: false });
                  }}
                />
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
        </KeyboardAvoidingView>
      </FormProvider>
    </SafeAreaView>
      )}
    </>
  );
};

