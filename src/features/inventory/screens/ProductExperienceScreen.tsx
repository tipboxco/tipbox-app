import React, { useState } from 'react';
import { Box, Text, VStack, Textarea, TextareaInput, Button, ButtonText, HStack, Toast, ToastTitle, useToast } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { InventoryStackParamList } from '../types';
import { Header } from '@/src/components/Header';
import { Box as BoxIcon } from 'lucide-react-native';

type ProductExperienceScreenNavigationProp = NativeStackNavigationProp<InventoryStackParamList, 'ProductExperience'>;
type ProductExperienceScreenRouteProp = RouteProp<InventoryStackParamList, 'ProductExperience'>;

export const ProductExperienceScreen = () => {
  const navigation = useNavigation<ProductExperienceScreenNavigationProp>();
  const route = useRoute<ProductExperienceScreenRouteProp>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [experience, setExperience] = useState('');
  const toast = useToast();

  const { productId, productName, priceExperience, shoppingExperience } = route.params;

  const handleComplete = () => {
    if (experience.trim()) {
      // TODO: API'ye deneyimleri gönder
      console.log({
        productId,
        productName,
        experiences: {
          price: priceExperience,
          shopping: shoppingExperience,
          product: experience,
        },
      });

      // State'leri sıfırla
      setExperience('');

      // Toast göster
      toast.show({
        placement: "top",
        render: ({ id }) => {
          return (
            <Toast nativeID={"toast-" + id} action="success" variant="solid">
              <ToastTitle>Deneyimleriniz başarıyla kaydedildi! 🎉</ToastTitle>
            </Toast>
          );
        },
      });

      // Inventory ana ekranına dön
      navigation.reset({
        index: 0,
        routes: [{ name: 'InventoryHome' }],
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
          <BoxIcon size={16} color={isDark ? '#FFFFFF' : '#000000'} />
          <Text
            fontSize="$md"
            fontWeight="$bold"
            color={isDark ? '$textDark50' : '$textLight900'}
          >
            Ürün ve Kullanım Deneyimi
          </Text>
        </HStack>

        {/* Açıklama */}
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
        >
          "{productName}" ürünü için kullanım deneyiminizi girin.
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
          onPress={handleComplete}
          disabled={!experience.trim()}
        >
          <ButtonText
            color={experience.trim() ? '#000000' : isDark ? '$textDark400' : '$textLight500'}
            fontWeight="$bold"
          >
            Tamamla
          </ButtonText>
        </Button>

        {/* Adım Göstergesi */}
        <Text
          fontSize="$sm"
          color={isDark ? '$textDark300' : '$textLight600'}
          textAlign="right"
        >
          3/3
        </Text>
      </VStack>
    </Box>
  );
};
