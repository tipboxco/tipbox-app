import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Input,
  InputField,
  Button,
  ButtonText,
  useToast,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSupportSessionPrice, useUpdateSupportSessionPrice } from '../api/hooks';
import { CustomToast } from '@/src/components/CustomToast';

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

  const handleSave = async () => {
    const price = parseInt(tipsAmount || '0');

    // Validation
    if (!price || price < MIN_PRICE) {
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <CustomToast
            id={id}
            title="Invalid Price"
            description={`Minimum ${MIN_PRICE} TIPS required`}
            action="error"
            duration={3000}
          />
        ),
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({ price });
      setHasChanges(false);
      toast.show({
        placement: 'top',
        duration: 3000,
        render: ({ id }) => (
          <CustomToast
            id={id}
            title="Price Updated"
            description="Support session price has been updated successfully"
            action="success"
            duration={3000}
          />
        ),
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'An error occurred while updating price';
      toast.show({
        placement: 'top',
        duration: 4000,
        render: ({ id }) => (
          <CustomToast
            id={id}
            title="Error"
            description={errorMessage}
            action="error"
            duration={4000}
          />
        ),
      });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
      >
        <Header
          title="1-on-1 Support Settings"
          showBackButton
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView flex={1} px="$4" py="$6">
          {isLoading ? (
            <Box flex={1} justifyContent="center" alignItems="center" py="$10">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : error ? (
            <Box flex={1} justifyContent="center" alignItems="center" py="$10" px="$4">
              <Text color="#CE4A4A" fontSize="$sm" textAlign="center">
                {error.message || 'An error occurred while loading price information'}
              </Text>
            </Box>
          ) : (
            <VStack space="lg">
              {/* Set TIPS Amount Section */}
              <VStack space="md">
                {/* Title */}
                <Text
                  fontSize={11}
                  fontWeight="$bold"
                  color={isDark ? '#FFFFFF' : '#000000'}
                >
                  Set TIPS Amount
                </Text>

                {/* Description */}
                <VStack space="xs">
                  <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color="#B9B9B9"
                    lineHeight={14}
                  >
                    Set the minimum TIPS amount users must pay to open a 1-on-1
                  </Text>
                  <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color="#B9B9B9"
                    lineHeight={14}
                  >
                    Support Request.
                  </Text>
                  <Text
                    fontSize={10}
                    fontWeight="$normal"
                    color="#B9B9B9"
                    lineHeight={14}
                    mt="$1"
                  >
                    This amount is only required to open the request.
                  </Text>
                </VStack>

                {/* Input Field - TIPS Amount on left, USD on right */}
                <Box
                  bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                  borderRadius={10}
                  borderWidth={1}
                  borderColor="#B9B9B9"
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  px="$4"
                  py="$3"
                >
                  {/* Left side - TIPS Amount (large, gray) */}
                  <Box flex={1}>
                    <Input borderWidth={0} bg="transparent">
                      <InputField
                        value={tipsAmount}
                        onChangeText={handleTipsChange}
                        keyboardType="numeric"
                        color="#B9B9B9"
                        fontSize={32}
                        fontWeight="$bold"
                        textAlign="left"
                        placeholder="50"
                        placeholderTextColor="#B9B9B9"
                      />
                    </Input>
                  </Box>

                  {/* Right side - USD Amount (small box) */}
                  <Box
                    bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    borderRadius={8}
                    px="$3"
                    py="$2"
                    ml="$3"
                  >
                    <Text
                      fontSize={14}
                      fontWeight="$medium"
                      color={isDark ? '#FFFFFF' : '#000000'}
                    >
                      ${usdAmount}
                    </Text>
                  </Box>
                </Box>
              </VStack>

              {/* Information Notes */}
              <VStack space="xs" mt="$2">
                <Text
                  fontSize={10}
                  fontWeight="$normal"
                  color="#B9B9B9"
                  lineHeight={14}
                >
                  * Minimum of {MIN_PRICE} TIPS can be set.
                </Text>
                <Text
                  fontSize={10}
                  fontWeight="$normal"
                  color="#B9B9B9"
                  lineHeight={14}
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
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
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
