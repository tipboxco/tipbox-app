import React, { useRef, useState } from 'react';
import { View, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Button, ButtonText, VStack, HStack, Image } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '@/src/store/appStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation';

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
    image: require('@/assets/onboard/onboarding0.png'),
    title: 'Hoş Geldiniz',
    description: 'Tipbox\'a hoş geldiniz! Deneyimlerinizi paylaşın ve keşfedin.',
  },
  {
    id: 1,
    image: require('@/assets/onboard/onboarding1.png'),
    title: 'Keşfet',
    description: 'İlginç içerikler keşfedin ve toplulukla etkileşime geçin.',
  },
  {
    id: 2,
    image: require('@/assets/onboard/onboarding2.png'),
    title: 'Paylaş',
    description: 'Deneyimlerinizi paylaşın ve başkalarına ilham verin.',
  },
  {
    id: 3,
    image: require('@/assets/onboard/onboarding3.png'),
    title: 'Bağlan',
    description: 'Benzer ilgi alanlarına sahip insanlarla bağlantı kurun.',
  },
  {
    id: 4,
    image: require('@/assets/onboard/onboarding4.png'),
    title: 'Başlayalım',
    description: 'Hesabınızı oluşturun ve yolculuğunuza başlayın!',
  },
];

export const OnboardingScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { completeRegistration } = useAppStore();
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
    // Onboarding tamamlandığında kullanıcıyı giriş yapmış olarak işaretle
    // completeRegistration() çağrıldığında RootNavigator otomatik olarak
    // isAuthenticated kontrolü yapacak ve MainDrawer'ı render edecek
    completeRegistration();
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => {
    return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        <Box
          flex={1}
          bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
          alignItems="center"
          justifyContent="center"
          px="$6"
        >
          {/* Image */}
          <Box flex={1} w="$full" alignItems="center" justifyContent="center" mb="$8">
            <Image
              source={item.image}
              alt={item.title}
              width={SCREEN_WIDTH - 48}
              height={400}
              resizeMode="contain"
            />
          </Box>

          {/* Content */}
          <VStack space="md" alignItems="center" mb="$12" px="$4">
            <Text
              fontSize="$3xl"
              fontWeight="$bold"
              color={isDark ? '$textDark50' : '$textLight900'}
              textAlign="center"
            >
              {item.title}
            </Text>
            <Text
              fontSize="$md"
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
    <View style={{ flex: 1, backgroundColor }}>
      {/* Üst Güvenli Alan */}
      <View
        style={{
          height: insets.top,
          backgroundColor,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      />

      {/* Ana İçerik */}
      <View style={{ flex: 1 }}>
        {/* Skip Button */}
        <Box position="absolute" top={insets.top + 16} right="$6" zIndex={2}>
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
              Atla
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
                {currentIndex === onboardingData.length - 1 ? 'Başlayalım' : 'Devam Et'}
              </ButtonText>
            </Button>
          </Box>
        </Box>
      </View>

      {/* Alt Güvenli Alan */}
      <View
        style={{
          height: insets.bottom,
          backgroundColor,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      />
    </View>
  );
};
