import React, { useState } from 'react';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Textarea, TextareaInput } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

export const CreateTipsAndTrickPostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<CreateTipsAndTrickPostScreenNavigationProp>();
  const [tipsText, setTipsText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
  };

  const handleShare = () => {
    console.log('Share button pressed');
  };

  const characterCount = tipsText.length;
  const maxCharacters = 500;

  // Check if share button should be enabled (content and category entered)
  const isShareEnabled = tipsText.trim().length > 0 && selectedCategory.length > 0;

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
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
          onPress: handleShare,
        }}
      />

      {/* Content */}
      <Box flex={1} position="relative">
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
            {/* Section Title */}
            <Text
              color={isDark ? '$textDark400' : '#B9B9B9'}
              fontSize={10}
              fontWeight="$bold"
            >
              Tips & Tricks Description
            </Text>

            {/* Text Input Area */}
            <Box
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor="#E9E9E9"
              borderRadius={5}
              overflow="hidden"
              minHeight={174}
              position="relative"
            >
              {/* Text Input */}
              <Textarea
                bg="transparent"
                borderWidth={0}
                flex={1}
                minHeight={174}
              >
                <TextareaInput
                  placeholder="Type your Tips & Tricks here..."
                  placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                  color={isDark ? '$textDark50' : '#000000'}
                  fontSize={10}
                  lineHeight={12}
                  value={tipsText}
                  onChangeText={setTipsText}
                  maxLength={maxCharacters}
                  style={{
                    textAlignVertical: 'top',
                    paddingTop: 10,
                    paddingBottom: 32,
                    paddingLeft: 8,
                    paddingRight: 8,
                  }}
                />
              </Textarea>

              {/* Character Count - Bottom Right */}
              <Box
                position="absolute"
                bottom={8}
                right={8}
              >
                <Text
                  color={isDark ? '$textDark400' : '#A3A3A3'}
                  fontSize={9}
                  fontWeight="$medium"
                >
                  {characterCount}/{maxCharacters}
                </Text>
              </Box>
            </Box>
          </VStack>

          {/* Tips & Tricks Category Section */}
          <VStack px={16} space="xs" mt="$2" position="relative">
            {/* Section Title */}
            <Text
              color={isDark ? '$textDark400' : '#A3A3A3'}
              fontSize={10}
              fontWeight="$semibold"
            >
              Tips & Tricks Category
            </Text>

            {/* Category Selector */}
            <Pressable onPress={() => setShowCategoryModal(!showCategoryModal)}>
              <Box
                bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                borderWidth={1}
                borderColor="#E9E9E9"
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

            {/* Dropdown List - Appears directly below input */}
            {showCategoryModal && (
              <Box
                position="absolute"
                top={58}
                left={16}
                right={16}
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
                          setSelectedCategory(category.value);
                          setShowCategoryModal(false);
                        }}
                      >
                        <HStack
                          px={12}
                          py={10}
                          alignItems="center"
                          space="sm"
                        >
                          {/* Icon */}
                          <Feather
                            name={category.icon}
                            size={18}
                            color={isDark ? '#FFFFFF' : '#2F2F2F'}
                          />
                          {/* Label */}
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
          </VStack>

          {/* Images Section */}
          <VStack px={16} space="xs" mt="$4">
            {/* Section Title */}
            <Text
              color={isDark ? '$textDark400' : '#A3A3A3'}
              fontSize={10}
              fontWeight="$bold"
            >
              Images
            </Text>

            {/* Image Picker Area */}
            <Pressable onPress={handleImagePicker}>
              <Box
                width={64}
                height={64}
                bg={isDark ? '$backgroundDark800' : '#F5F5F5'}
                borderWidth={1}
                borderColor="#9E9E9E"
                borderStyle="dashed"
                borderRadius={5}
                justifyContent="center"
                alignItems="center"
              >
                <Feather
                  name="plus"
                  size={24}
                  color={isDark ? '#C1BEBF' : '#C1BEBF'}
                />
              </Box>
            </Pressable>
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
    </Box>
  );
};

