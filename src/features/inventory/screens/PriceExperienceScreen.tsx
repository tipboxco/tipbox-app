import React, { useState } from 'react';
import { Box, Text, VStack, HStack, Textarea, TextareaInput, Button, ButtonText } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { InventoryStackParamList } from '../types';
import { Header } from '@/src/components/Header';
import { Tag } from 'lucide-react-native';

type PriceExperienceScreenNavigationProp = NativeStackNavigationProp<InventoryStackParamList, 'PriceExperience'>;
type PriceExperienceScreenRouteProp = RouteProp<InventoryStackParamList, 'PriceExperience'>;

export const PriceExperienceScreen = () => {
  const navigation = useNavigation<PriceExperienceScreenNavigationProp>();
  const route = useRoute<PriceExperienceScreenRouteProp>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [experience, setExperience] = useState('');

  const { productId, productName } = route.params;

  const handleNext = () => {
    if (experience.trim()) {
      navigation.navigate('ShoppingExperience', {
        productId,
        productName,
        priceExperience: experience,
      });
    }
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Deneyim Paylaş"
        showBackButton
        onMenuPress={() => navigation.goBack()}
      />

      <VStack space="lg" p="$4" flex={1}>
        {/* Başlık */}
        <HStack space="sm" alignItems="center">
          <Tag size={16} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text
            fontSize="$md"
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Fiyat ve Alışveriş Deneyimi
          </Text>
        </HStack>

        {/* Açıklama */}
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
        >
          "{productName}" ürünü için fiyat ve alışveriş deneyiminizi girin.
        </Text>

        {/* Deneyim Girişi */}
        <Box
          bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
          borderRadius="$lg"
          p="$4"
          flex={1}
        >
          <Textarea h="$full" flex={1}>
            <TextareaInput
              flex={1}
              placeholder="Deneyiminizi paylaşın..."
              color={isDark ? '$textDark50' : '$textLight900'}
              value={experience}
              onChangeText={setExperience}
              maxLength={500}
            />
          </Textarea>
          <Text
            fontSize="$xs"
            color={isDark ? '$textDark400' : '$textLight500'}
            textAlign="right"
            mt="$2"
          >
            {experience.length}/500
          </Text>
        </Box>

        {/* Onay Butonu */}
        <Button
          bg={experience.trim() ? '#D8FF08' : isDark ? '$backgroundDark800' : '$backgroundLight200'}
          borderRadius="$lg"
          p="$1"
          opacity={experience.trim() ? 1 : 0.5}
          onPress={handleNext}
          disabled={!experience.trim()}
        >
          <ButtonText
            color={experience.trim() ? '#000000' : isDark ? '$textDark400' : '$textLight500'}
            fontWeight="$bold"
          >
            Devam Et
          </ButtonText>
        </Button>

        {/* Adım Göstergesi */}
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="right"
        >
          1/3
        </Text>
      </VStack>
    </Box>
  );
};
