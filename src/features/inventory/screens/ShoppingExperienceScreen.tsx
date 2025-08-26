import React, { useState } from 'react';
import { Box, Text, VStack, Textarea, TextareaInput, Button, ButtonText, HStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { InventoryStackParamList } from '../types';
import { Header } from '@/src/components/Header';
import { ShoppingBag } from 'lucide-react-native';

type ShoppingExperienceScreenNavigationProp = NativeStackNavigationProp<InventoryStackParamList, 'ShoppingExperience'>;
type ShoppingExperienceScreenRouteProp = RouteProp<InventoryStackParamList, 'ShoppingExperience'>;

export const ShoppingExperienceScreen = () => {
  const navigation = useNavigation<ShoppingExperienceScreenNavigationProp>();
  const route = useRoute<ShoppingExperienceScreenRouteProp>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [experience, setExperience] = useState('');

  const { productId, productName, priceExperience } = route.params;

  const handleNext = () => {
    if (experience.trim()) {
      navigation.navigate('ProductExperience', {
        productId,
        productName,
        priceExperience,
        shoppingExperience: experience,
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
          <ShoppingBag size={16} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text
            fontSize="$md"
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Alışveriş Deneyimi
          </Text>
        </HStack>

        {/* Açıklama */}
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
        >
          "{productName}" ürünü için alışveriş deneyiminizi girin.
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
          2/3
        </Text>
      </VStack>
    </Box>
  );
};
