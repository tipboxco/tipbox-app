import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { FormProvider } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { usePostForm } from '../hooks/usePostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
import { useCreateFreePost } from '../api/hooks';
import { mapProductInfoTypeToContextType } from '../types';
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
  
  // Route params'dan context bilgilerini al
  const { contextType, contextId, productInfo } = route.params || {};
  
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
    console.log('[CreatePostScreen] 📋 Route Params:', {
      contextType,
      contextId,
      productInfo: productInfo ? {
        title: productInfo.title,
        subName: productInfo.subName,
        hasImage: !!productInfo.image,
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
    // Navigate to Feed screen
    navigation.navigate('Main', {
      screen: 'Feed',
      params: {
        screen: 'FeedScreen',
      },
    });
  };

  const handleImagePicker = () => {
    console.log('[CreatePostScreen] Image picker button pressed');
    // TODO: Implement image picker
  };

  const onSubmit = async (data: PostFormData) => {
    console.log('[CreatePostScreen] ========== FORM SUBMITTED ==========');
    console.log('[CreatePostScreen] 📤 Submitted Form Data (from React Hook Form):', {
      postText: data.postText,
      postTextLength: data.postText.length,
      selectedImages: data.selectedImages || [],
      isValid: formState.isValid,
    });
    
    // Context type ve ID'yi route params'dan al
    if (!contextType || !contextId) {
      console.error('[CreatePostScreen] ❌ Missing contextType or contextId in route params');
      return;
    }
    
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    console.log('[CreatePostScreen] 📤 API Request Data:', {
      contextType: apiContextType,
      contextId,
      description: data.postText,
      images: data.selectedImages || [],
    });
    
    try {
      const response = await createPostMutation.mutateAsync({
        contextType: apiContextType,
        contextId,
        description: data.postText,
        images: data.selectedImages,
      });
      
      console.log('[CreatePostScreen] ✅ API Response:', response);
      console.log('[CreatePostScreen] ====================================');
      
      // Başarılı olursa geri dön
      navigation.navigate('Main', {
        screen: 'Feed',
        params: {
          screen: 'FeedScreen',
        },
      });
    } catch (error: any) {
      console.error('[CreatePostScreen] ❌ API Error:', error);
      console.log('[CreatePostScreen] ====================================');
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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <FormProvider {...methods}>
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
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <VStack space="md" pb={100}>
              {/* Product Info Card */}
              {productInfo && (
                <Box px="$4" py="$2">
                  <ProductInfoCard
                    image={productInfo.image}
                    title={productInfo.title}
                    subName={productInfo.subName}
                    size="big"
                    type={contextType || ProductInfoType.SUB_CATEGORY}
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
                />
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
      </FormProvider>
    </SafeAreaView>
  );
};

