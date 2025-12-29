import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
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
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { QuestionPostFormData } from '../schemas/questionPostSchema';

// Mock data for product info
const productInfo = {
  image: require('@/assets/product/product_01.png'),
  title: 'Computers & Tablet\nTechnology Subcategories',
};

// Boost options
const boostOptions = [
  {
    id: 'no-boost',
    title: 'No Boost',
    price: 'Free',
    description: 'Standart Visibility',
    borderColor: '#829905',
    iconBg: '#829905',
    isPopular: true,
  },
  {
    id: 'standard-boost',
    title: 'Standart Boost',
    price: '50 TIPS',
    description: '2x Visibility for 24 Hours',
    borderColor: '#829905',
    iconBg: '#829905',
    isPopular: false,
  },
  {
    id: 'premium-boost',
    title: 'Premium Boost',
    price: '100 TIPS',
    description: '5x Visibility for 48 Hours',
    borderColor: '#829905',
    iconBg: '#829905',
    isPopular: false,
  },
  {
    id: 'ultimate-boost',
    title: 'Ultimate Boost',
    price: '200 TIPS',
    description: '10x Visibility for 7 Days',
    borderColor: '#829905',
    iconBg: '#829905',
    isPopular: false,
  },
];

type CreateQuestionPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Boost Options Component with Controller
const BoostOptionsField: React.FC = () => {
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
              price={option.price}
              description={option.description}
              borderColor={option.borderColor}
              iconBg={option.iconBg}
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

  const handleBackPress = () => {
    // Navigate to Feed screen
    navigation.navigate('Main', {
      screen: 'Feed',
      params: {
        screen: 'FeedScreen',
      },
    });
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
          .filter((uri): uri is string => !!uri);
        
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

  const onSubmit = (data: QuestionPostFormData) => {
    console.log('Form submitted:', data);
    // TODO: Backend entegrasyonu
  };

  // Check if share button should be enabled (form is valid)
  const isShareEnabled = formState.isValid;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <FormProvider {...methods}>
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
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
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
                <BoostOptionsField />

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
      </FormProvider>
    </SafeAreaView>
  );
};

