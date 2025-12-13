import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, HStack, Text } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { FormProvider } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { config } from '@/src/components/ui/gluestack-ui-provider/config';
import { useUpdatePostForm } from '../hooks/useUpdatePostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
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
  const { handleSubmit, formState } = methods;
  
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
    // Navigate to Feed screen
    navigation.navigate('Main', {
      screen: 'Feed',
      params: {
        screen: 'FeedScreen',
      },
    });
  };

  const handleImagePicker = () => {
    console.log('Open image picker');
    // TODO: Implement image picker
  };

  const handleRemoveImage = (index: number) => {
    // Image removal is handled by ControlledImagePicker
    console.log('Remove image at index:', index);
  };

  const onSubmit = (data: UpdatePostFormData) => {
    console.log('Form submitted:', data);
    console.log('Product from route params:', product);
    // TODO: Backend entegrasyonu - product'ı ayrı parametre olarak gönder
  };

  // Check if share button should be enabled (product exists and form is valid)
  const isShareEnabled = product !== undefined && formState.isValid;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <FormProvider {...methods}>
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
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
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
                        fontSize={'$2xs'}
                        ml={26}
                        lineHeight={16}
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
                          fontSize={config.tokens.fontSizes['4xs'] as number}
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
      </FormProvider>
    </SafeAreaView>
  );
};

