import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, useToast } from '@gluestack-ui/themed';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider, Controller, useFormContext } from 'react-hook-form';
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
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { CustomToast } from '@/src/components/CustomToast';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { QuestionPostFormData } from '../schemas/questionPostSchema';
import type { BoostOption } from '../api/postApi';

// Mock data for product info
const productInfo = {
  image: require('@/assets/product/product_01.png'),
  title: 'Computers & Tablet\nTechnology Subcategories',
};

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
  const { handleSubmit, formState, getValues, setValue } = methods;
  const availableTips = 250;
  const toast = useToast();
  const createQuestionPostMutation = useCreateQuestionPost();
  
  // Boost options'ı API'den çek
  const { data: boostOptions = [], isLoading: isLoadingBoostOptions, error: boostOptionsError } = useBoostOptions();
  
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
          duration: 3000,
          render: ({ id }: { id: string }) => {
            return (
              <CustomToast
                id={id}
                title="Limit aşıldı"
                description="Maksimum 10 görsel seçebilirsiniz"
                action="error"
                duration={3000}
              />
            );
          },
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
          toast.show({
            placement: 'top',
            duration: 3000,
            render: ({ id }: { id: string }) => {
              return (
                <CustomToast
                  id={id}
                  title="Hata"
                  description="Seçilen görsellerin URI'leri bulunamadı"
                  action="error"
                  duration={3000}
                />
              );
            },
          });
        }
      } else if (result.error) {
        toast.show({
          placement: 'top',
          duration: 3000,
          render: ({ id }: { id: string }) => {
            return (
              <CustomToast
                id={id}
                title="Hata"
                description={result.error}
                action="error"
                duration={3000}
              />
            );
          },
        });
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      const errorMessage = error?.message || 'Görsel seçilirken bir hata oluştu';
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }: { id: string }) => {
          return (
            <CustomToast
              id={id}
              title="Hata"
              description={errorMessage}
              action="error"
              duration={3000}
            />
          );
        },
      });
    }
  };

  // Boost option ID'sini bul (form'daki selectedBoost artık gerçek boost option ID'si)
  const getBoostOptionId = (selectedBoost: string): string | null => {
    // Eğer boost option seçilmediyse veya boş string ise null döndür
    if (!selectedBoost || selectedBoost.trim() === '') {
      return null;
    }
    
    // Boost options listesinde bu ID'yi ara
    const foundOption = boostOptions.find(option => option.id === selectedBoost);
    if (foundOption) {
      return foundOption.id; // Gerçek UUID ID'si
    }
    
    // Bulunamazsa null döndür (backend'e gönderilmeyecek)
    console.warn('[CreateQuestionPostScreen] Boost option not found:', selectedBoost);
    return null;
  };

  const onSubmit = async (data: QuestionPostFormData) => {
    console.log('[CreateQuestionPostScreen] Form submitted:', data);
    
    // ContextType ve contextId kontrolü
    if (!contextType || !contextId) {
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }: { id: string }) => {
          return (
            <CustomToast
              id={id}
              title="Hata"
              description="Context bilgisi bulunamadı. Lütfen tekrar deneyin."
              action="error"
              duration={3000}
            />
          );
        },
      });
      return;
    }
    
    // API contextType'a çevir
    const apiContextType = mapProductInfoTypeToContextType(contextType);
    
    // Boost option ID'sini al (gerçek UUID)
    const selectedBoostOptionId = getBoostOptionId(data.selectedBoost);
    
    // Boost option ID kontrolü (backend zorunlu kılıyor)
    if (!selectedBoostOptionId) {
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }: { id: string }) => {
          return (
            <CustomToast
              id={id}
              title="Eksik bilgi"
              description="Boost seçimi zorunludur"
              action="error"
              duration={3000}
            />
          );
        },
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
      
      // Başarılı toast göster
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }: { id: string }) => {
          return (
            <CustomToast
              id={id}
              title="Soru gönderisi oluşturuldu"
              description="Gönderiniz başarıyla paylaşıldı!"
              action="success"
              duration={3000}
            />
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
      console.error('[CreateQuestionPostScreen] ❌ API Error:', error);
      
      // Hata toast göster
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Gönderi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      
      toast.show({
        placement: 'top',
        duration: 4000,
        render: ({ id }: { id: string }) => {
          return (
            <CustomToast
              id={id}
              title="Hata"
              description={errorMessage}
              action="error"
              duration={4000}
            />
          );
        },
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
              <Box px="$4" py="$2">
                <ProductInfoCard
                  image={productInfo.image}
                  title={productInfo.title}
                  size="big"
                  type={ProductInfoType.SUB_CATEGORY}
                />
              </Box>

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
                  fontSize={10}
                  fontWeight="$bold"
                >
                  Boost this Question
                </Text>

                {/* Boost Options */}
                {isLoadingBoostOptions ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '$textDark400' : '#A3A3A3'} fontSize={12}>
                      Boost seçenekleri yükleniyor...
                    </Text>
                  </Box>
                ) : boostOptionsError ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '$red500' : '#EF4444'} fontSize={12}>
                      Boost seçenekleri yüklenirken hata oluştu
                    </Text>
                  </Box>
                ) : boostOptions.length === 0 ? (
                  <Box py="$4" alignItems="center">
                    <Text color={isDark ? '$textDark400' : '#A3A3A3'} fontSize={12}>
                      Boost seçeneği bulunamadı
                    </Text>
                  </Box>
                ) : (
                  <BoostOptionsField boostOptions={boostOptions} />
                )}

                {/* TIPS Available Info */}
                <HStack alignItems="center" space="xs">
                  <Feather
                    name="info"
                    size={18}
                    color={isDark ? '#FFFFFF' : '#A3A3A3'}
                  />
                  <Text
                    color={isDark ? '$textDark400' : '#A3A3A3'}
                    fontSize={10}
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

