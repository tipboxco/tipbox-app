import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider, Controller, useFormContext } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { useTipsAndTrickPostForm } from '../hooks/useTipsAndTrickPostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TipsAndTrickPostFormData } from '../schemas/tipsAndTrickPostSchema';

// Mock data for product info
const productInfo = {
  image: require('@/assets/product/product_01.png'),
  title: 'Computers & Tablet\nTechnology Subcategories',
};

// Categories from Figma
const categories = [
  { 
    label: 'Zaman Tasarrufu', 
    value: 'time-saving',
    icon: 'clock' as const
  },
  { 
    label: 'Enerji Verimliliği', 
    value: 'energy-efficiency',
    icon: 'zap' as const
  },
  { 
    label: 'Kalıcılık / Dayanıklılık', 
    value: 'durability',
    icon: 'shield' as const
  },
  { 
    label: 'Daha İyi Sonuç', 
    value: 'better-result',
    icon: 'target' as const
  },
];

type CreateTipsAndTrickPostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Category Selector Component with Controller
const CategorySelectorField: React.FC = () => {
  const { control, watch } = useFormContext<TipsAndTrickPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const selectedCategory = watch('selectedCategory');

  return (
    <Controller
      name="selectedCategory"
      control={control}
      render={({ field: { onChange }, fieldState: { error } }) => (
        <VStack space="xs" position="relative">
          <Text
            color={isDark ? '$textDark400' : '#A3A3A3'}
            fontSize={10}
            fontWeight="$semibold"
          >
            Tips & Tricks Category
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
                  fontSize={10}
                  fontWeight="$medium"
                  flex={1}
                >
                  {selectedCategory
                    ? categories.find((cat) => cat.value === selectedCategory)?.label
                    : 'Select the category of your Tips & Tricks'}
                </Text>
                <Feather
                  name={showCategoryModal ? "chevron-up" : "chevron-down"}
                  size={18}
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
              borderColor="#E9E9E9"
              borderTopWidth={0}
              borderTopLeftRadius={0}
              borderTopRightRadius={0}
              borderBottomLeftRadius={5}
              borderBottomRightRadius={5}
              zIndex={1000}
              overflow="hidden"
            >
              <VStack>
                {categories.map((category, index) => (
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
                        px={12}
                        py={10}
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
                          fontSize={10}
                          fontWeight="$medium"
                        >
                          {category.label}
                        </Text>
                      </HStack>
                    </Pressable>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          {error && (
            <Text color="#CE4A4A" fontSize={9} px={2}>
              {error.message}
            </Text>
          )}
        </VStack>
      )}
    />
  );
};

export const CreateTipsAndTrickPostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateTipsAndTrickPostScreenNavigationProp>();
  const methods = useTipsAndTrickPostForm();
  const { handleSubmit, formState } = methods;
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleBackPress = () => {
    // Navigate to Feed screen
    navigation.navigate('Main', {
      screen: 'Feed',
      params: {
        screen: 'FeedScreen',
      },
    });
  };

  const handleImagePicker = () => {
    // Handle image picker action
    console.log('Open image picker');
    // TODO: Implement image picker
  };

  const onSubmit = (data: TipsAndTrickPostFormData) => {
    console.log('Form submitted:', data);
    // TODO: Backend entegrasyonu
  };

  // Check if share button should be enabled (form is valid)
  const isShareEnabled = formState.isValid;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <FormProvider {...methods}>
        <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'} position="relative">
          {/* Header */}
          <Header
            title="Tips & Tricks Post"
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
          <ScrollView 
            flex={1} 
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => setShowCategoryModal(false)}
          >
            <VStack space="md">
              {/* Product Info Card */}
              <Box px="$4" py="$2">
                <ProductInfoCard
                  image={productInfo.image}
                  title={productInfo.title}
                  size="big"
                  type={ProductInfoType.SUB_CATEGORY}
                />
              </Box>

              {/* Tips & Tricks Description Section */}
              <VStack px={16} space="xs">
                <ControlledTextarea
                  name="tipsText"
                  placeholder="Type your Tips & Tricks here..."
                  maxLength={500}
                  label="Tips & Tricks Description"
                />
              </VStack>

              {/* Tips & Tricks Category Section */}
              <VStack px={16} space="xs" mt="$2">
                <CategorySelectorField />
              </VStack>

              {/* Images Section */}
              <VStack px={16} space="xs" mt="$4">
                {/* TODO: Implement ControlledImagePicker when image picker is ready */}
              </VStack>
            </VStack>
          </ScrollView>

          {/* Click outside overlay to close dropdown */}
          {showCategoryModal && (
            <Pressable
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={999}
              onPress={() => setShowCategoryModal(false)}
            />
          )}
        </Box>
      </FormProvider>
    </SafeAreaView>
  );
};

