import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Pressable,
  Input,
  InputField,
  ActivityIndicator,
  Button,
  ButtonText,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupportSessionPrice, useUpdateSupportSessionPrice } from '../api/hooks';

const MIN_PRICE = 50;
const TIPS_TO_USD_RATIO = 10; // 10 TIPS = 1 USD

export const SupportSettingsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const toast = useToast();

  // API hooks
  const { data: priceData, isLoading, error } = useSupportSessionPrice();
  const updateMutation = useUpdateSupportSessionPrice();

  // Support settings state
  const [tipsAmount, setTipsAmount] = useState('50');
  const [usdAmount, setUsdAmount] = useState('5');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize from API data
  useEffect(() => {
    if (priceData?.price !== null && priceData?.price !== undefined) {
      const price = priceData.price;
      setTipsAmount(price.toString());
      setUsdAmount(Math.round(price / TIPS_TO_USD_RATIO).toString());
      setHasChanges(false);
    }
  }, [priceData]);

  const handleTipsChange = (value: string) => {
    // Sadece sayısal değerleri kabul et
    const numericValue = value.replace(/[^0-9]/g, '');
    setTipsAmount(numericValue);
    
    // TIPS'i USD'ye çevir
    const usdValue = Math.round(parseInt(numericValue || '0') / TIPS_TO_USD_RATIO);
    setUsdAmount(usdValue.toString());
    setHasChanges(true);
  };

  const handleUsdChange = (value: string) => {
    // Sadece sayısal değerleri kabul et
    const numericValue = value.replace(/[^0-9]/g, '');
    setUsdAmount(numericValue);
    
    // USD'yi TIPS'e çevir
    const tipsValue = parseInt(numericValue || '0') * TIPS_TO_USD_RATIO;
    setTipsAmount(tipsValue.toString());
    setHasChanges(true);
  };

  const handleSave = async () => {
    const price = parseInt(tipsAmount || '0');

    // Validation
    if (!price || price < MIN_PRICE) {
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Geçersiz Fiyat</ToastTitle>
              <ToastDescription>Minimum {MIN_PRICE} TIPS olmalıdır</ToastDescription>
            </Toast>
          </Box>
        ),
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({ price });
      setHasChanges(false);
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Başarılı</ToastTitle>
              <ToastDescription>Destek oturumu fiyatı güncellendi</ToastDescription>
            </Toast>
          </Box>
        ),
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Fiyat güncellenirken bir hata oluştu';
      toast.show({
        placement: 'top',
        render: ({ id }) => (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="error" variant="solid">
              <ToastTitle>Hata</ToastTitle>
              <ToastDescription>{errorMessage}</ToastDescription>
            </Toast>
          </Box>
        ),
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FFF'}
      >
        <Header
          title="1-on-1 Support Settings"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView flex={1} px="$4">
          {isLoading ? (
            <Box flex={1} justifyContent="center" alignItems="center" py="$10">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : error ? (
            <Box flex={1} justifyContent="center" alignItems="center" py="$10" px="$4">
              <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                {error.message || 'Fiyat bilgisi yüklenirken bir hata oluştu'}
              </Text>
            </Box>
          ) : (
          <VStack space="lg">
            {/* Set TIPS Amount Section */}
            <VStack space="sm">
            {/* Main Setting Card */}
            <Box
              bg={isDark ? '#1A1A1A' : '#FFFFFF'}
              borderRadius={10}
              py="$3"
            >
              <VStack space="xs">
                <Text
                  fontSize={11}
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  Set TIPS Amount
                </Text>
                <Text
                  fontSize={10}
                  fontWeight="$medium"
                  color="#B9B9B9"
                  lineHeight={12}
                >
                  Set the minimum TIPS amount users must pay to open a 1-on-1 Support Request.
                </Text>
                <Text
                  fontSize={10}
                  fontWeight="$medium"
                  color="#B9B9B9"
                  lineHeight={12}
                >
                  This amount is only required to open the request.
                </Text>
              </VStack>
            </Box>

            {/* TIPS Amount Input */}
            <Box
              bg={isDark ? '#1A1A1A' : '#FFFFFF'}
              borderRadius={10}
              borderWidth={1}
              borderColor="#B9B9B9"
              height={47}
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              px="$4"
            >
              {/* Left side - TIPS Amount */}
              <HStack alignItems="center" space="xs">
                <Input
                  borderWidth={0}
                  bg="transparent"
                  w={280}
                >
                  <InputField
                    value={tipsAmount}
                    onChangeText={handleTipsChange}
                    keyboardType="numeric"
                    color="#B9B9B9"
                    fontSize={20}
                    fontWeight="$bold"
                    textAlign="left"
                    placeholder="50"
                    placeholderTextColor="#B9B9B9"
                  />
                </Input>
              </HStack>

              {/* Vertical Divider */}
              <Box
                width={1}
                height={46}
                bg="#B9B9B9"
                position="absolute"
                left={301}
                top={0.5}
              />

              {/* Right side - USD Amount */}
              <HStack alignItems="center" space="xs">
                <Text
                  fontSize={14}
                  fontWeight="$medium"
                  color="#B9B9B9"
                >
                  $5
                </Text>
                <Input
                  borderWidth={0}
                  bg="transparent"
                  w={20}
                >
                  <InputField
                    value={usdAmount}
                    onChangeText={handleUsdChange}
                    keyboardType="numeric"
                    color="#B9B9B9"
                    fontSize={14}
                    fontWeight="$medium"
                    textAlign="left"
                    placeholder="5"
                    placeholderTextColor="#B9B9B9"
                  />
                </Input>
              </HStack>
            </Box>
          </VStack>

          {/* Information Text */}
          <VStack space="xs">
            <Text
              fontSize={10}
              fontWeight="$medium"
              color="#B9B9B9"
              lineHeight={12}
            >
              * Minimum of {MIN_PRICE} TIPS can be set.
            </Text>
            <Text
              fontSize={10}
              fontWeight="$medium"
              color="#B9B9B9"
              lineHeight={12}
            >
              * The amount can be changed once every 10 days.
            </Text>
          </VStack>

          {/* Save Button */}
          {hasChanges && (
            <Button
              bg="#E2FF46"
              borderRadius={8}
              onPress={handleSave}
              disabled={updateMutation.isPending}
              opacity={updateMutation.isPending ? 0.5 : 1}
              mt="$4"
            >
              <ButtonText
                color="#000000"
                fontSize={14}
                fontWeight="$bold"
              >
                {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </ButtonText>
            </Button>
          )}
          </VStack>
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};

export default SupportSettingsScreen;
