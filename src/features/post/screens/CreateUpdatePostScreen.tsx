import React, { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, View, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, useToast, Image } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
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
import { useCreateUpdatePost, useUpdatePost, usePostDetail } from '../api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { mapProductInfoTypeToContextType } from '../types';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import type { PostStackParamList } from '../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { UpdatePostFormData } from '../schemas/updatePostSchema';
import { TagIcon, CubeIcon, StarIcon } from 'react-native-heroicons/outline';
import { StarIcon as StarIconSolid } from 'react-native-heroicons/solid';
import { toImageSource } from '@/src/utils';
import CardImageCarousel from '@/src/components/CardImageCarousel';
import type { ImageSourcePropType } from 'react-native';

type CreateUpdatePostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreateUpdatePostScreenRouteProp = RouteProp<PostStackParamList, 'CreateUpdatePostScreen'>;

export const CreateUpdatePostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateUpdatePostScreenNavigationProp>();
  const route = useRoute<CreateUpdatePostScreenRouteProp>();
  const { product, postId, experiencePostId, experiencePost } = route.params || {}; 
  // postId: Update modu için (mevcut update post'u düzenleme)
  // experiencePostId: Experience post ID (update oluştururken bağlanacak experience post)
  // experiencePost: Experience post bilgileri (content, images, product)
  const methods = useUpdatePostForm();
  const { handleSubmit, formState, getValues, setValue, watch, reset } = methods;
  const toast = useToast();
  const createUpdatePostMutation = useCreateUpdatePost();
  const updatePostMutation = useUpdatePost();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  
  // Update modu kontrolü
  const isUpdateMode = !!postId;
  // Experience post'tan update oluşturma modu
  const isExperienceUpdateMode = !!experiencePostId && !!experiencePost;
  
  // Post detayını fetch et (update modu için)
  const { data: postDetail, isLoading: isLoadingPost } = usePostDetail(
    postId,
    isUpdateMode, // Sadece update modunda fetch et
    false
  );
  
  // Post detayı yüklendiğinde form'a yükle
  useEffect(() => {
    if (isUpdateMode && postDetail) {
      reset({
        description: postDetail.content || '',
        selectedImages: postDetail.images || [],
      });
    }
  }, [postDetail, isUpdateMode, reset]);
  
  // Flow store'dan context bilgilerini al
  const contextType = useCreatePostFlowStore((state) => state.contextType);
  const contextId = useCreatePostFlowStore((state) => state.contextId);
  const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);

  const handleBackPress = () => {
    // Go back to previous screen
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Navigate to Feed screen
      navigation.navigate('App', {
        screen: 'MainTabs',
        params: {
          screen: 'FeedStack',
          params: {
            screen: 'FeedScreen',
          },
        },
      } as any);
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
          .filter((uri): uri is string => !!uri); // URI'leri filtrele
        
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

  const handleRemoveImage = (index: number) => {
    // Image removal is handled by ControlledImagePicker
    console.log('Remove image at index:', index);
  };

  const onSubmit = async (data: UpdatePostFormData) => {
    console.log('[CreateUpdatePostScreen] Form submitted:', data);
    console.log('[CreateUpdatePostScreen] Product from route params:', product);
    console.log('[CreateUpdatePostScreen] Is update mode:', isUpdateMode);
    console.log('[CreateUpdatePostScreen] Is experience update mode:', isExperienceUpdateMode);
    console.log('[CreateUpdatePostScreen] Experience post ID:', experiencePostId);
    
    try {
      if (isUpdateMode && postId) {
        // Update modu: Mevcut post'u güncelle
        const response = await updatePostMutation.mutateAsync({
          postId,
          data: {
            content: data.description,
            images: data.selectedImages || [],
          },
        });
        
        console.log('[CreateUpdatePostScreen] ✅ Post Updated:', response);
        
        // Başarılı toast göster
        showCustomToast(toast, {
          title: 'Post Updated',
          description: 'Your post has been updated successfully!',
          action: 'success',
        });
        
        // Geri dön
        navigation.goBack();
      } else if (isExperienceUpdateMode && experiencePostId) {
        // Experience post'tan update oluşturma modu
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
        
        const response = await createUpdatePostMutation.mutateAsync({
          contextType: apiContextType,
          contextId: contextId,
          content: data.description, // API'de "content" field'ı kullanılıyor
          images: data.selectedImages || [],
          experiencePostId: experiencePostId, // Experience post ID'yi gönder
        });
        
        console.log('[CreateUpdatePostScreen] ✅ Update Post Created from Experience:', response);
        
        // Başarılı toast göster
        showCustomToast(toast, {
          title: 'Update Post Created',
          description: 'Your update post has been created successfully!',
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
          
          // CRITICAL: Post stack'ini temizle ve ProfileScreen'e yönlendir
          const currentState = navigation.getState();
          const appRoute = currentState?.routes?.find((route) => route.name === 'App');
          
          navigation.dispatch(
            CommonActions.reset({
              index: 1,
              routes: [
                {
                  name: 'App',
                  state: appRoute?.state as any,
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
      } else {
        // Create modu: Yeni post oluştur (normal flow)
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
        
        const response = await createUpdatePostMutation.mutateAsync({
          contextType: apiContextType,
          contextId: contextId,
          content: data.description, // API'de "content" field'ı kullanılıyor
          images: data.selectedImages || [],
        });
        
        console.log('[CreateUpdatePostScreen] ✅ API Response:', response);
        
        // Başarılı toast göster
        showCustomToast(toast, {
          title: 'Post Created',
          description: 'Your update post has been created successfully!',
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
                  state: appRoute?.state as any, // App'in mevcut state'ini koru
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
      }
    } catch (error: any) {
      console.error('[CreateUpdatePostScreen] ❌ API Error:', error);
      
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

  // Check if share button should be enabled (product exists and form is valid)
  const isShareEnabled = (product !== undefined || experiencePost !== undefined) && formState.isValid;

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
              fontSize: 11,
              borderRadius: 25,
              paddingX: 10,
              paddingY: 10,
              onPress: handleSubmit(onSubmit),
            }}
          />

          {/* Content */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <VStack space="md" pb={100}>
              {/* Experience Post Card - Show if creating update from experience post */}
              {isExperienceUpdateMode && experiencePost && (
                <Box px="$4" py="$2">
                  <VStack space="sm">
                    <Text
                      fontSize="$sm"
                      fontWeight="$semibold"
                      color={isDark ? '$textDark50' : '#000'}
                      mb="$2"
                    >
                      Original Experience Post
                    </Text>
                    <Box
                      bg={isDark ? '$backgroundDark800' : '#FFFFFF'}
                      borderWidth={1}
                      borderColor={isDark ? '$borderDark600' : '#E9E9E9'}
                      borderRadius={8}
                      overflow="hidden"
                    >
                      {/* Product Info */}
                      {experiencePost.product && (
                        <Box px="$3" py="$2" borderBottomWidth={1} borderColor={isDark ? '$borderDark600' : '#E9E9E9'}>
                          <ProductInfoCard
                            image={experiencePost.product.image}
                            title={experiencePost.product.name}
                            subName={experiencePost.product.subName}
                            size="small"
                            type={ProductInfoType.PRODUCT}
                          />
                        </Box>
                      )}

                      {/* Content */}
                      <VStack px="$3" py="$2" space="sm">
                        {experiencePost.content.map((item, index) => (
                          <VStack key={index} space="xs">
                            <HStack space="xs" alignItems="center">
                              {item.tag.icon === 'tag' ? (
                                <TagIcon width={16} height={16} color={isDark ? '#fff' : '#000'} />
                              ) : (
                                <CubeIcon width={16} height={16} color={isDark ? '#fff' : '#000'} />
                              )}
                              <Text
                                color={isDark ? '$textDark50' : '#000'}
                                fontSize="$xs"
                                fontWeight="$semibold"
                              >
                                {item.tag.title}
                              </Text>
                            </HStack>
                            <Text
                              color={isDark ? '$textDark400' : '#666'}
                              fontSize="$xs"
                              ml={22}
                              numberOfLines={3}
                            >
                              {item.text}
                            </Text>
                            <HStack ml={22} space="xs">
                              {item.rating.map((star, idx) =>
                                star ? (
                                  <StarIconSolid
                                    key={idx}
                                    width={10}
                                    height={10}
                                    color={isDark ? '#fff' : '#829905'}
                                  />
                                ) : (
                                  <StarIcon
                                    key={idx}
                                    width={10}
                                    height={10}
                                    color={isDark ? '#7E7E7E' : '#E8E8E8'}
                                  />
                                )
                              )}
                            </HStack>
                          </VStack>
                        ))}
                      </VStack>

                      {/* Images */}
                      {experiencePost.images && experiencePost.images.length > 0 && (
                        <Box px="$3" py="$2">
                          <CardImageCarousel
                            images={experiencePost.images.map(img => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)}
                            height={200}
                          />
                        </Box>
                      )}
                    </Box>
                  </VStack>
                </Box>
              )}

              {/* Product Info Card - Show if not experience update mode */}
              {!isExperienceUpdateMode && product && (
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

