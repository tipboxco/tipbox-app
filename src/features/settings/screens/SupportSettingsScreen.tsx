import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Pressable,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';

export const SupportSettingsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();

  // Support settings state
  const [tipsAmount, setTipsAmount] = useState('50');
  const [usdAmount, setUsdAmount] = useState('5');

  const handleTipsChange = (value: string) => {
    // Sadece sayısal değerleri kabul et
    const numericValue = value.replace(/[^0-9]/g, '');
    setTipsAmount(numericValue);
    
    // TIPS'i USD'ye çevir (basit oran: 10 TIPS = 1 USD)
    const usdValue = Math.round(parseInt(numericValue || '0') / 10);
    setUsdAmount(usdValue.toString());
  };

  const handleUsdChange = (value: string) => {
    // Sadece sayısal değerleri kabul et
    const numericValue = value.replace(/[^0-9]/g, '');
    setUsdAmount(numericValue);
    
    // USD'yi TIPS'e çevir (basit oran: 1 USD = 10 TIPS)
    const tipsValue = parseInt(numericValue || '0') * 10;
    setTipsAmount(tipsValue.toString());
  };

  return (
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
              * Minimum of 50 TIPS can be set.
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
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default SupportSettingsScreen;
