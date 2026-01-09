import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
// Config kullanımı kaldırıldı - StyledProvider hatasını önlemek için
import { useUpdatePostForm } from '../hooks/useUpdatePostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateUpdatePost } from '../api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { mapProductInfoTypeToContextType } from '../types';
import type { PostStackParamList } from '../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { UpdatePostFormData } from '../schemas/updatePostSchema';

type CreateUpdatePostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreateUpdatePostScreenRouteProp = RouteProp<PostStackParamList, 'CreateUpdatePostScreen'>;

export const CreateUpdatePostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateUpdatePostScreenNavigationProp>();
  const route = useRoute<CreateUpdatePostScreenRouteProp>();
  const { product } = route.params || {};
  const methods = useUpdatePostForm();
  const { handleSubmit, formState, getValues, setValue, watch } = methods;
  const toast = useToast();
  const createUpdatePostMutation = useCreateUpdatePost();
  
  // Flow store'dan context bilgilerini al
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
  
  // Mock experience content - in real app, this would come from props or be fetched
  const experienceContent = [
    {
      tag: {
        icon: 'tag',
        title: 'Price and Shopping Experience'
      },
      text: 'I bought the Dyson V15s Detect Submarine™ from an official Dyson store for around $949. The price felt premium compared to other cordless vacuums, but Dyson often positions itself in the premium segment. The build quality is excellent, and the design feels modern and functional. Delivery was fast and packaging was well-protected.',
      rating: [1, 1, 1, 0, 0]
    },
    {
      tag: {
        icon: 'package',
        title: 'Product and Usage Experience'
      },
      text: 'After using it for 2 weeks, the suction power is impressive - easily handles both wet and dry messes. The battery lasts about 40 minutes on regular mode. The only downside is the weight - it\'s heavier than expected for a cordless model. The filtration system works great, and the HEPA filter is easy to replace.',
      rating: [1, 1, 1, 1, 0]
    }
  ];

  // Mock tags - in real app, this would come from props or be fetched
  const tags = ['2 Weeks', 'Could Be Better', 'Daily Use'];

  const handleBackPress = () => {
    // Go back to previous screen
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to Feed screen
      navigation.navigate('Main', {
        screen: 'Feed',
        params: {
          screen: 'FeedScreen',
        },
      });
    }
  };

  const handleImagePicker = async () => {
    try {
      const currentImages = getValues('selectedImages') || [];
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

      const result = await imagePickerService.pickMultipleFromGallery(remainingSlots);
      
      if (result.success && result.assets && result.assets.length > 0) {
        const newImageUris = result.assets
          .map(asset => asset.uri)
          .filter((uri): uri is string => !!uri); // URI'leri filtrele
        
        if (newImageUris.length > 0) {
          const updatedImages = [...currentImages, ...newImageUris];
          setValue('selectedImages', updatedImages, { shouldValidate: true });
        } else {
          toast.show({
            placement: 'top',
            render: ({ id }: { id: string }) => {
              return (
                <Box maxWidth="90%" alignSelf="center" px="$4">
                  <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                    <ToastTitle>Hata</ToastTitle>
                    <ToastDescription>Seçilen görsellerin URI'leri bulunamadı.</ToastDescription>
                  </Toast>
                </Box>
              );
            },
          });
        }
      } else if (result.error) {
        toast.show({
          placement: 'top',
          render: ({ id }: { id: string }) => {
            return (
              <Box maxWidth="90%" alignSelf="center" px="$4">
                <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                  <ToastTitle>Hata</ToastTitle>
                  <ToastDescription>{result.error}</ToastDescription>
                </Toast>
              </Box>
            );
          },
        });
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      const errorMessage = error?.message || 'Görsel seçilirken bir hata oluştu';
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
    }
  };

  const handleRemoveImage = (index: number) => {
    // Image removal is handled by ControlledImagePicker
    console.log('Remove image at index:', index);
  };

  const onSubmit = async (data: UpdatePostFormData) => {
    console.log('[CreateUpdatePostScreen] Form submitted:', data);
    console.log('[CreateUpdatePostScreen] Product from route params:', product);
    
    // ContextType ve contextId kontrolü
    if (!contextType || !contextId) {
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="error" variant="solid">
                <ToastTitle>Hata</ToastTitle>
                <ToastDescription>Context bilgisi bulunamadı. Lütfen tekrar deneyin.</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      return;
    }
    
    // API contextType'a çevir
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    try {
      const response = await createUpdatePostMutation.mutateAsync({
        contextType: apiContextType,
        contextId: contextId,
        content: data.description, // API'de "content" field'ı kullanılıyor
        images: data.selectedImages || [],
      });
      
      console.log('[CreateUpdatePostScreen] ✅ API Response:', response);
      
      // Başarılı toast göster
      toast.show({
        placement: 'top',
        render: ({ id }: { id: string }) => {
          return (
            <Box maxWidth="90%" alignSelf="center" px="$4">
              <Toast nativeID={`toast-${id}`} action="success" variant="solid">
                <ToastTitle>Post Oluşturuldu</ToastTitle>
                <ToastDescription>Update gönderiniz başarıyla oluşturuldu!</ToastDescription>
              </Toast>
            </Box>
          );
        },
      });
      
      // Clear flow context on successful submit
      clearFlow();
      
      // Başarılı olursa Feed ekranına yönlendir ki kullanıcı gönderisini görebilsin
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Main',
              state: {
                routes: [
                  {
                    name: 'Feed',
                    state: {
                      routes: [{ name: 'FeedScreen' }],
                    },
                  },
                ],
                index: 0,
              },
            },
          ],
        })
      );
    } catch (error: any) {
      console.error('[CreateUpdatePostScreen] ❌ API Error:', error);
      
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
    }
  };

  // Check if share button should be enabled (product exists and form is valid)
  const isShareEnabled = product !== undefined && formState.isValid;

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
            title="Update Post"
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
          <ScrollView flex={1} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack space="md" pb={100}>
              {/* Product Info Card */}
              {product && (
                <Box px="$4" py="$2">
                  <ProductInfoCard
                    image={product.image}
                    title={product.name}
                    subName={product.description}
                    size="big"
                    type={ProductInfoType.SUB_CATEGORY}
                  />
                </Box>
              )}

              {/* Experience Content Section */}
              {product && (
                <VStack px={16} space="md">
                  {experienceContent.map((item, index) => (
                    <VStack key={index} py={8}>
                      <HStack space="sm" alignItems="center">
                        <Feather 
                          name={item.tag.icon === 'tag' ? 'tag' : 'package'} 
                          size={18} 
                          color={isDark ? '#fff' : '#000'} 
                          fill={isDark ? '#fff' : '#000'} 
                        />
                        <Text
                          color={isDark ? '$textDark50' : '#000'}
                          fontSize={'$xs'}
                          fontWeight="$bold"
                        >
                          {item.tag.title}
                        </Text>
                      </HStack>
                      <Text
                        color={isDark ? '$textDark50' : '#000'}
                        fontSize="$sm"
                        ml={26}
                        lineHeight={22}
                      >
                        {item.text}
                      </Text>
                      <HStack ml={26} mt={8}>
                        {item.rating.map((star, idx) => (
                          <Feather
                            key={idx}
                            name="star"
                            size={12}
                            color={star ? (isDark ? '#fff' : '#829905') : (isDark ? '#7E7E7E' : '#E8E8E8')}
                            fill={star ? (isDark ? '#fff' : '#829905') : 'transparent'}
                          />
                        ))}
                      </HStack>
                    </VStack>
                  ))}
                  
                  {/* Tags */}
                  <HStack px={0} py={8} flexWrap="wrap">
                    {tags.map((tag, index) => (
                      <HStack
                        key={index}
                        bg={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)'}
                        borderWidth={1}
                        borderColor={'#E9E9E9'}
                        rounded={'$full'}
                        px={16}
                        py={6}
                        mr={4}
                        mb={4}
                      >
                        <Text
                          color={isDark ? '$textDark50' : '#000'}
                          fontSize={8}
                          fontWeight="$semibold"
                        >
                          {tag}
                        </Text>
                      </HStack>
                    ))}
                  </HStack>
                </VStack>
              )}

              {/* Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="description"
                  placeholder="Type your update here..."
                  maxLength={500}
                  label="Update Description"
                />
              </VStack>

              {/* Images Section */}
              <VStack px={16} space="xs">
                <ControlledImagePicker
                  name="selectedImages"
                  label="Images"
                  maxImages={10}
                  onImagePicker={handleImagePicker}
                  onRemoveImage={handleRemoveImage}
                />
              </VStack>
            </VStack>
          </ScrollView>
        </Box>
        </KeyboardAvoidingView>
      </FormProvider>
    </SafeAreaView>
  );
};

