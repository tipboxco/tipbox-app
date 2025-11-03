import React, { useState } from 'react';
import { Box, ScrollView, VStack, HStack, Text, Pressable, Textarea, TextareaInput } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '../components/ProductInfoCard';

// Mock data for product info
const productInfo = {
  image: require('@/assets/product/product_01.png'),
  title: 'Computers & Tablet\nTechnology Subcategories',
};

export const CreatePostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const [postText, setPostText] = useState('');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleImagePicker = () => {
    // Handle image picker action
    console.log('Open image picker');
  };

  const characterCount = postText.length;
  const maxCharacters = 500;

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      {/* Header */}
      <Header
        title="Write a Post"
        showBackButton={true}
        onBackPress={handleBackPress}
      />

      {/* Content */}
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space="md" pb={100}>
          {/* Product Info Card */}
          <ProductInfoCard
            image={productInfo.image}
            title={productInfo.title}
          />

          {/* Post Description Section */}
          <VStack px={16} space="xs">
            {/* Section Title */}
            <Text
              color={isDark ? '$textDark400' : '#B9B9B9'}
              fontSize={10}
              fontWeight="$bold"
            >
              Post Description
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
                  placeholder="Type your Post here..."
                  placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                  color={isDark ? '$textDark50' : '#000000'}
                  fontSize={10}
                  lineHeight={12}
                  value={postText}
                  onChangeText={setPostText}
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

          {/* Images Section */}
          <VStack px={16} space="xs">
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
    </Box>
  );
};

