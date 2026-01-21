import React, { useRef, useState } from 'react';
import { View, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingItem {
  id: number;
  image: any;
  title: string;
  description: string;
}

const onboardingData: OnboardingItem[] = [
  {
    id: 0,
    image: require('@/assets/onboard/onboarding4.png'),
    title: 'Build Your Digital Inventory',
    description: 'Add the products you own and showcase your digital collection.',
  },
  {
    id: 1,
    image: require('@/assets/onboard/onboarding1.png'),
    title: 'Review Shopping and Products',
    description: 'Post your shopping journey and product usage experiences.',
  },
  {
    id: 2,
    image: require('@/assets/onboard/onboarding2.png'),
    title: 'Connect With Your Community',
    description: 'Gain followers and lead the community with your expertise.',
  },
  {
    id: 3,
    image: require('@/assets/onboard/onboarding3.png'),
    title: 'Earn Exclusive Web3 Rewards',
    description: 'Climb the ladder and collect Web3 connected badges.',
  },
];

export const OnboardingScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const backgroundColor = '#FFFFFF';

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    // Onboarding tamamlandığında Login ekranına yönlendir
    // Kullanıcı kayıt işlemini tamamladı, şimdi login yapması gerekiyor
    // Success toast göstermek için parametre gönder
    navigation.navigate('Login', { showSuccessToast: true });
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        <Box
          flex={1}
          bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
          alignItems="center"
          justifyContent="flex-start"
          px="$6"
          pt={insets.top + 50}
          pb={200}
        >
          {/* Image */}
          <Box 
            w="$full" 
            alignItems="center" 
            justifyContent="center" 
            mb="$4"
            style={{ maxHeight: 280 }}
          >
            <Image
              source={item.image}
              alt={item.title}
              width={SCREEN_WIDTH - 48}
              height={280}
              resizeMode="contain"
            />
          </Box>

          {/* Content */}
          <VStack space="sm" alignItems="center" px="$4">
            <Text
              fontSize="$2xl"
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
              textAlign="center"
            >
              {item.title}
            </Text>
            <Text
              fontSize="$sm"
              color={isDark ? '$textDark300' : '$textLight600'}
              textAlign="center"
              px="$4"
            >
              {item.description}
            </Text>
          </VStack>
        </Box>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <HStack space="sm" alignItems="center" justifyContent="center" mb="$6">
        {onboardingData.map((_, index) => (
          <Box
            key={index}
            w={currentIndex === index ? 24 : 8}
            h={8}
            bg={currentIndex === index ? '$buttonPrimary' : '$gray400'}
            rounded="$full"
          />
        ))}
      </HStack>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor }}>
   

      {/* Ana İçerik */}
      <View style={{ flex: 1 }}>
        {/* Skip Button */}
        <Box position="absolute" top={insets.top } right="$6" zIndex={2}>
          <Button
            variant="link"
            onPress={handleSkip}
            p="$2"
          >
            <ButtonText
              fontSize="$sm"
              color={isDark ? '$textDark300' : '$textLight600'}
              fontWeight="$medium"
            >
              Skip
            </ButtonText>
          </Button>
        </Box>

        {/* Carousel */}
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
          contentContainerStyle={{ paddingBottom: 0 }}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />

        {/* Bottom Section */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
          pb={insets.bottom + 16}
          pt="$4"
        >
          {renderPagination()}
          <Box px="$6">
            <Button
              bg="$buttonPrimary"
              h={50}
              rounded="$lg"
              w="$full"
              onPress={handleNext}
            >
              <ButtonText color="$textLight900" fontWeight="$bold" fontSize="$md">
                {currentIndex === onboardingData.length - 1 ? "Let's Begin" : 'Continue'}
              </ButtonText>
            </Button>
          </Box>
        </Box>
      </View>

    </SafeAreaView>
  );
};
