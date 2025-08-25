import React, { useRef } from 'react';
import { ScrollView, Pressable } from 'react-native';
import { Box, Text, VStack, HStack } from '@gluestack-ui/themed';
import BottomSheet from '@gorhom/bottom-sheet';
import { Header } from '../../../components/Header';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';
import { ComboBox } from '@/src/components/ComboBox';
import { StarRating } from '@/src/components/StarRating';
import { CategoryBottomSheet } from '../components/CategoryBottomSheet';

const USAGE_DURATION_OPTIONS = [
  '1 Ay - 6 Ay',
  '6 Ay - 1 Yıl',
  '1 Yıl - 3 Yıl',
  '3 Yıl - Daha Fazla',
];

const USAGE_LOCATION_OPTIONS = ['Ev', 'Ofis', 'Diğer'];

const USAGE_PURPOSE_OPTIONS = [
  'Günlük Kullanım',
  'Kişisel İhtiyaç',
  'İş Yeri İhtiyacı',
];

export const AddProductScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedOption, setSelectedOption] = React.useState<'own' | 'experienced' | null>(null);
  const [usageDuration, setUsageDuration] = React.useState<string | null>(null);
  const [usageLocation, setUsageLocation] = React.useState<string | null>(null);
  const [usagePurpose, setUsagePurpose] = React.useState<string | null>(null);
  const [rating, setRating] = React.useState(0);
  const [showCategorySheet, setShowCategorySheet] = React.useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Header
        title="Ürün Ekle"
        showBackButton
        onMenuPress={() => navigation.goBack()}
      />
      <ScrollView>
        <VStack space="lg" p="$4">
          {/* Ürün Başlığı */}
          <VStack space="sm">
            <Text
              fontWeight="$semibold"
              size="sm"
              color={isDark ? '$textDark50' : '$textLight900'}
            >
              Ürün
            </Text>
            <HStack space="md">
              {/* Fotoğraf Ekleme Alanı */}
              <Pressable onPress={() => setShowCategorySheet(true)}>
                <Box
                  bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                  borderRadius="$lg"
                  width={120}
                  height={120}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text
                    color={isDark ? '$textDark400' : '$textLight500'}
                    fontSize="$3xl"
                  >
                    +
                  </Text>
                </Box>
              </Pressable>
              {/* Fotoğraf Önizleme Alanı */}
              <Box flex={1}>
                <VStack space="sm">
                  <Box
                    bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                    height={24}
                    borderRadius="$sm"
                  />
                  <Box
                    bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                    height={15}
                    width="80%"
                    borderRadius="$sm"
                  />
                  <Box
                    bg={isDark ? '$backgroundDark900' : '$backgroundLight100'}
                    height={15}
                    width="60%"
                    borderRadius="$sm"
                  />
                </VStack>
                <Box mt="$4">
                  <StarRating
                    rating={rating}
                    onRate={setRating}
                    size={20}
                    color="#FFD700"
                  />
                </Box>
              </Box>
            </HStack>
          </VStack>

          {/* Kullanım Detayları */}
          <VStack space="md">
            <ComboBox
              label="Ne Kadar Süre Kullanıldı"
              value={usageDuration}
              options={USAGE_DURATION_OPTIONS}
              onSelect={setUsageDuration}
            />

            <ComboBox
              label="Nerede Kullanıldı"
              value={usageLocation}
              options={USAGE_LOCATION_OPTIONS}
              onSelect={setUsageLocation}
            />

            <ComboBox
              label="Hangi İhtiyaç için Kullanıldı"
              value={usagePurpose}
              options={USAGE_PURPOSE_OPTIONS}
              onSelect={setUsagePurpose}
            />
          </VStack>

          {/* Ürün Sahipliği */}
          <HStack w="$full" alignItems="center" justifyContent="center" space="md" mt="$2">
            <Box flex={1}>
              <Pressable onPress={() => setSelectedOption('own')}>
                <Box
                  flex={1}
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark400' : '$borderLight400'}
                  borderRadius="$md"
                  p="$2"
                  bg={selectedOption === 'own' ? '#D8FF08' : 'transparent'}
                >
                  <Text
                    textAlign="center"
                    color={selectedOption === 'own' ? '#000000' : isDark ? '$textDark400' : '$textLight500'}
                    size="sm"
                  >
                    Ürüne Sahibim
                  </Text>
                </Box>
              </Pressable>
            </Box>
            <Box flex={1}>
              <Pressable onPress={() => setSelectedOption('experienced')}>
                <Box
                  flex={1}
                  borderWidth={1}
                  borderColor={isDark ? '$borderDark400' : '$borderLight400'}
                  borderRadius="$md"
                  p="$2"
                  bg={selectedOption === 'experienced' ? '#D8FF08' : 'transparent'}
                >
                  <Text
                    textAlign="center"
                    color={selectedOption === 'experienced' ? '#000000' : isDark ? '$textDark400' : '$textLight500'}
                    size="sm"
                  >
                    Sadece Deneyimledim
                  </Text>
                </Box>
              </Pressable>
            </Box>
          </HStack>
        </VStack>
      </ScrollView>

      {/* Onay Butonu */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p="$4"
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      >
        <Pressable onPress={() => { }}>
          <Box
            bg="#D8FF08"
            borderRadius="$lg"
            p="$3"
            alignItems="center"
          >
            <Text
              color="#000000"
              fontWeight="$bold"
              size="md"
            >
              Onayla
            </Text>
          </Box>
        </Pressable>
      </Box>

      <CategoryBottomSheet
        ref={bottomSheetRef}
        visible={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        onSelect={(category) => {
          console.log('Selected category:', category);
          setShowCategorySheet(false);
          bottomSheetRef.current?.close();
        }}
      />
    </Box>
  );
};
