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
    borderColor: '#E9E9E9',
    iconBg: '#F5F5F5',
    isPopular: false,
  },
  {
    id: 'premium-boost',
    title: 'Premium Boost',
    price: '100 TIPS',
    description: '5x Visibility for 48 Hours',
    borderColor: '#E9E9E9',
    iconBg: '#F5F5F5',
    isPopular: false,
  },
  {
    id: 'ultimate-boost',
    title: 'Ultimate Boost',
    price: '200 TIPS',
    description: '10x Visibility for 7 Days',
    borderColor: '#E9E9E9',
    iconBg: '#F5F5F5',
    isPopular: false,
  },
];

export const CreateQuestionPostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const [questionText, setQuestionText] = useState('');
  const [selectedBoost, setSelectedBoost] = useState<string>('no-boost');
  const availableTips = 250;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleImagePicker = () => {
    // Handle image picker action
    console.log('Open image picker');
  };

  const characterCount = questionText.length;
  const maxCharacters = 500;

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      {/* Header */}
      <Header
        title="Question Post"
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

          {/* Question Description Section */}
          <VStack px={16} space="xs">
            {/* Section Title */}
            <Text
              color={isDark ? '$textDark400' : '#B9B9B9'}
              fontSize={10}
              fontWeight="$bold"
            >
              Question Description
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
                  placeholder="Type your Question here..."
                  placeholderTextColor={isDark ? '#8C8C8C' : '#8C8C8C'}
                  color={isDark ? '$textDark50' : '#000000'}
                  fontSize={10}
                  lineHeight={12}
                  value={questionText}
                  onChangeText={setQuestionText}
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
            <VStack space="xs">
              {boostOptions.map((option) => (
                <Pressable
                  key={option.id}
                  onPress={() => setSelectedBoost(option.id)}
                >
                  <Box
                    bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
                    borderWidth={1}
                    borderColor={selectedBoost === option.id ? option.borderColor : '#E9E9E9'}
                    borderRadius={5}
                    position="relative"
                  >
                    <HStack px={12} py={18} alignItems="center" space="sm">
                      {/* Icon */}
                      <Box
                        width={36}
                        height={36}
                        bg={selectedBoost === option.id ? option.iconBg : (isDark ? '$backgroundDark700' : '#F5F5F5')}
                        borderRadius={5}
                        justifyContent="center"
                        alignItems="center"
                      >
                        {selectedBoost === option.id ? (
                          <Feather
                            name="zap"
                            size={18}
                            color="#FFFFFF"
                          />
                        ) : (
                          <Feather
                            name="zap"
                            size={18}
                            color={isDark ? '#FFFFFF' : '#646464'}
                          />
                        )}
                      </Box>

                      {/* Content */}
                      <VStack flex={1} space="xs">
                        <HStack justifyContent="space-between" alignItems="center">
                          <Text
                            color={isDark ? '$textDark50' : '#000000'}
                            fontSize={12}
                            fontWeight="$semibold"
                          >
                            {option.title}
                          </Text>
                          <Text
                            color={selectedBoost === option.id ? '#829905' : (isDark ? '$textDark50' : '#000000')}
                            fontSize={12}
                            fontWeight="$semibold"
                          >
                            {option.price}
                          </Text>
                        </HStack>
                        <Text
                          color={isDark ? '$textDark400' : '#000000'}
                          fontSize={10}
                          fontWeight="$normal"
                        >
                          {option.description}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Popular Badge */}
                    {option.isPopular && (
                      <Box
                        position="absolute"
                        top={2}
                        right={15}
                        bg="#829905"
                        borderWidth={1}
                        borderColor="#829905"
                        borderRadius={10}
                        px="$2"
                        py="$0.5"
                      >
                        <Text
                          color="#FFFFFF"
                          fontSize={9}
                          fontWeight="$medium"
                        >
                          Popular
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Pressable>
              ))}
            </VStack>

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
  );
};

