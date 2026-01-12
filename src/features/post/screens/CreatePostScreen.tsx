import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
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
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { CameraScreen } from '../components/CameraScreen';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
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
  const { handleSubmit, formState, watch, trigger, getValues } = methods;
  const createPostMutation = useCreateFreePost();
  const toast = useToast();
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
  
  // Flow store'dan context bilgilerini al (route params yerine)
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const productInfoSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);
  const isValidFlow = useCreatePostFlowStore((state) => state.isValid());
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
  
  // CatalogUIStore'dan ID'leri al (type'a göre)
  const selectedProductId = useCatalogUIStore((state) => state.selectedProductId);
  const selectedSubCategoryId = useCatalogUIStore((state) => state.selectedSubCategoryId);
  const selectedProductGroupId = useCatalogUIStore((state) => state.selectedProductGroupId);
  const getContextIdFromStore = useCatalogUIStore((state) => state.getContextId);
  
  // Route params'dan da al (fallback için, backward compatibility)
  const routeParams = route.params || {};
  const routeContextType = routeParams.contextType;
  const routeContextId = routeParams.contextId;
  const routeProductInfo = routeParams.productInfo;
  
  // Store'dan gelen değerler varsa onları kullan, yoksa route params'ı kullan
  const finalContextType = contextType || routeContextType;
  
  // ID'yi önce CreatePostFlowStore'dan al, yoksa CatalogUIStore'dan type'a göre al, yoksa route params'tan al
  let finalContextId = contextId;
  if (!finalContextId && finalContextType) {
    // Type'a göre CatalogUIStore'dan ID'yi al
    const apiContextType = finalContextType === ProductInfoType.PRODUCT ? 'product' :
                          finalContextType === ProductInfoType.PRODUCT_GROUP ? 'product_group' :
                          'sub_category';
    finalContextId = getContextIdFromStore(apiContextType);
  }
  // Son fallback: route params
  if (!finalContextId) {
    finalContextId = routeContextId;
  }
  
  const finalProductInfo = productInfoSnapshot || routeProductInfo;
  
  // Debug: Store durumunu logla (component mount olduğunda)
  useEffect(() => {
    console.log('🔍 [CreatePostScreen] Store State Check:', {
      flowStore: {
        contextType,
        contextId,
        productInfoSnapshot: productInfoSnapshot ? { title: productInfoSnapshot.title } : null,
        isValidFlow,
      },
      catalogUIStore: {
        selectedProductId,
        selectedSubCategoryId,
        selectedProductGroupId,
      },
      routeParams: {
        contextType: routeContextType,
        contextId: routeContextId,
        productInfo: routeProductInfo ? { title: routeProductInfo.title } : null,
      },
      final: {
        contextType: finalContextType,
        contextId: finalContextId,
        productInfo: finalProductInfo ? { title: finalProductInfo.title } : null,
      },
    });
  }, [contextType, contextId, productInfoSnapshot, isValidFlow, selectedProductId, selectedSubCategoryId, selectedProductGroupId, routeContextType, routeContextId, routeProductInfo, finalContextType, finalContextId, finalProductInfo]);
  
  // Form değerlerini izle - TÜM form değerlerini loglamak için
  const postText = watch('postText');
  const selectedImages = watch('selectedImages');
  const allFormValues = watch(); // Tüm form değerlerini al
  const prevValuesRef = useRef<{ postText?: string; selectedImages?: string[]; isValid?: boolean; errors?: any }>({});

  // Form state değişikliklerini logla - TÜM form değerlerini içerecek şekilde
  useEffect(() => {
    const currentValues = {
      postText: postText || '',
      selectedImages: selectedImages || [],
      isValid: formState.isValid,
      errors: formState.errors,
    };

    const changedValues: string[] = [];
    Object.keys(currentValues).forEach((key) => {
      const typedKey = key as keyof typeof currentValues;
      if (prevValuesRef.current[typedKey] !== currentValues[typedKey]) {
        if (key === 'errors' || key === 'selectedImages') {
          changedValues.push(`${key}: ${JSON.stringify(prevValuesRef.current[typedKey])} → ${JSON.stringify(currentValues[typedKey])}`);
        } else {
          changedValues.push(`${key}: ${prevValuesRef.current[typedKey]} → ${currentValues[typedKey]}`);
        }
      }
    });

    if (changedValues.length > 0) {
      console.log('[CreatePostScreen] 🔄 Form State Changed:', {
        changed: changedValues,
        current: {
          postText: currentValues.postText,
          postTextLength: currentValues.postText.length,
          selectedImages: currentValues.selectedImages,
          isValid: currentValues.isValid,
          errors: currentValues.errors,
        },
      });
      
      // TÜM form değerlerini logla (React Hook Form'dan)
      console.log('[CreatePostScreen] 📋 All Form Values (from React Hook Form):', {
        ...allFormValues,
        postText: allFormValues.postText || '',
        selectedImages: allFormValues.selectedImages || [],
      });
    }

    prevValuesRef.current = currentValues;
  }, [postText, selectedImages, formState.isValid, formState.errors, allFormValues]);

  // Component mount olduğunda log
  useEffect(() => {
    console.log('[CreatePostScreen] 🚀 Component Mounted');
    console.log('[CreatePostScreen] 📋 Flow Store Context:', {
      contextType: finalContextType,
      contextId: finalContextId,
      isValidFlow,
      productInfo: finalProductInfo ? {
        title: finalProductInfo.title,
        subName: finalProductInfo.subName,
        hasImage: !!finalProductInfo.image,
      } : null,
    });
    console.log('[CreatePostScreen] 📋 Route Params (fallback):', {
      contextType: routeContextType,
      contextId: routeContextId,
      productInfo: routeProductInfo ? {
        title: routeProductInfo.title,
        subName: routeProductInfo.subName,
        hasImage: !!routeProductInfo.image,
      } : null,
    });
    console.log('[CreatePostScreen] 📋 Initial Form State:', {
      postText: postText || '',
      selectedImages: selectedImages || [],
      isValid: formState.isValid,
      errors: formState.errors,
    });
    console.log('[CreatePostScreen] 📋 All Initial Form Values:', getValues());
  }, []);

  const handleBackPress = () => {
    console.log('[CreatePostScreen] Back button pressed');
    console.log('[CreatePostScreen] Current form values before navigation:', {
      postText: postText || '',
      isValid: formState.isValid,
    });
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
    console.log('[CreatePostScreen] Image picker button pressed');
    
    // Mevcut seçili image sayısını al
    const currentImages = methods.getValues('selectedImages') || [];
    const remainingSlots = 10 - currentImages.length;
    
    if (remainingSlots <= 0) {
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Limit Aşıldı</ToastTitle>
                <ToastDescription>Maksimum 10 görsel seçebilirsiniz.</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      return;
    }

    // Instagram tarzı: Custom kamera screen'ini aç
    setShowCamera(true);
  };

  const handlePhotoTaken = (uri: string) => {
    console.log('[CreatePostScreen] ✅ Photo taken:', uri);
    const currentImages = methods.getValues('selectedImages') || [];
    const newImages = [...currentImages, uri];
    methods.setValue('selectedImages', newImages, { shouldValidate: true });
    setLastPhotoUri(uri);
    setShowCamera(false);
  };

  // Seçili image'lerin sonuncusunu lastPhotoUri olarak kullan
  const currentImages = methods.watch('selectedImages') || [];
  const displayLastPhotoUri = lastPhotoUri || (currentImages.length > 0 ? currentImages[currentImages.length - 1] : null);

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const onSubmit = async (data: PostFormData) => {
    console.log('[CreatePostScreen] ========== FORM SUBMITTED ==========');
    console.log('[CreatePostScreen] 📤 Submitted Form Data (from React Hook Form):', {
      postText: data.postText,
      postTextLength: data.postText.length,
      selectedImages: data.selectedImages || [],
      isValid: formState.isValid,
    });
    
    // Context type ve ID'yi flow store'dan al (route params fallback)
    if (!finalContextType || !finalContextId) {
      console.error('[CreatePostScreen] ❌ Missing contextType or contextId in flow store or route params');
      return;
    }
    
    const apiContextType = mapProductInfoTypeToContextType(finalContextType);
    
    console.log('[CreatePostScreen] 📤 API Request Data:', {
      contextType: apiContextType,
      contextId: finalContextId,
      description: data.postText,
      images: data.selectedImages || [],
    });
    
    try {
      const response = await createPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: finalContextId,
        description: data.postText,
        images: data.selectedImages,
      });
      
      console.log('[CreatePostScreen] ✅ API Response:', response);
      console.log('[CreatePostScreen] ====================================');
      
      // Başarılı toast göster
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Post Oluşturuldu</ToastTitle>
                <ToastDescription>Postunuz başarıyla oluşturuldu!</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      
      // Clear flow context on successful submit
      clearFlow();
      
      // Başarılı olursa ProfileScreen'e yönlendir
      if (user?.id) {
        // Profil verilerini invalidate et - yeni post görünsün
        queryClient.invalidateQueries({
          queryKey: profileKeys.userPosts(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
        });
        
        navigation.navigate('Profile', {
          screen: 'ProfileMain',
          params: { userId: user.id },
        });
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
                          'Post oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>{errorMessage}</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      // TODO: Error handling UI göster
    }
  };

  const handleSharePress = () => {
    console.log('[CreatePostScreen] 🔘 Share button pressed');
    console.log('[CreatePostScreen] 📋 Form validation before submit:', {
      isValid: formState.isValid,
      errors: formState.errors,
      postText: postText || '',
      postTextLength: postText?.length || 0,
      selectedImages: selectedImages || [],
    });
    
    // TÜM form değerlerini logla
    const allValues = getValues();
    console.log('[CreatePostScreen] 📋 All Form Values (getValues()):', allValues);
    
    // Manual validation trigger
    trigger().then((isValid) => {
      console.log('[CreatePostScreen] ✅ Manual validation result:', isValid);
      if (isValid) {
        handleSubmit(onSubmit)();
      } else {
        console.log('[CreatePostScreen] ❌ Form validation failed, errors:', formState.errors);
      }
    });
  };

  // Check if share button should be enabled (form is valid)
  const isShareEnabled = formState.isValid;

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
              backgroundColor: isShareEnabled ? '#D0F205' : '#EDEDED',
              borderWidth: 1,
              borderColor: isShareEnabled ? '#B8CC04' : '#B1B1B1',
              textColor: isShareEnabled ? '#111111' : '#B1B1B1',
              fontSize: 12,
              borderRadius: 25,
              paddingX: 24,
              paddingY: 8,
              onPress: handleSharePress,
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
                    methods.setValue('selectedImages', newImages, { shouldValidate: true });
                    console.log('[CreatePostScreen] ✅ Image removed at index:', index);
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

