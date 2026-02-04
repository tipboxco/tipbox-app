import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  ButtonText,
  Pressable,
  ScrollView,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useToast, Toast, ToastTitle, ToastDescription } from '@gluestack-ui/themed';

export const GoogleAuthenticatorSetupScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const toast = useToast();

  // Mock QR key - Bu gerçek uygulamada API'den gelecek
  const [secretKey] = useState('CSAR TPAL MTKR RTZK LLLA ANDQ OTIG NGSF');
  const [showQRCode, setShowQRCode] = useState(false);

  const handleCopyKey = async () => {
    await Clipboard.setStringAsync(secretKey);
    toast.show({
      placement: 'top',
      render: ({ id }) => {
        return (
          <Box maxWidth="90%" alignSelf="center" px="$4">
            <Toast nativeID={`toast-${id}`} action="success" variant="solid">
              <ToastTitle>Kopyalandı</ToastTitle>
              <ToastDescription>Key panoya kopyalandı</ToastDescription>
            </Toast>
          </Box>
        );
      },
    });
  };

  const handleNext = () => {
    navigation.navigate('GoogleAuthenticatorVerify');
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
      >
        <Header
          title="Google Authenticator"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView flex={1} px="$4" py="$6">
          <VStack space="lg" pb="$8">
            {/* Step 1: Download Google Authenticator */}
            <Box
              bg={isDark ? '#1A1A1A' : '#FFFFFF'}
              borderRadius={10}
              p="$4"
              borderWidth={1}
              borderColor={isDark ? '#333333' : '#E5E5E5'}
            >
              <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center" space="md" flex={1}>
                  <Box
                    width={40}
                    height={40}
                    borderRadius={20}
                    bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Feather 
                      name="user-plus" 
                      size={20} 
                      color={isDark ? '#FFFFFF' : '#000000'} 
                    />
                  </Box>
                  <VStack flex={1}>
                    <Text
                      fontSize={14}
                      fontWeight="$bold"
                      color={isDark ? '#FFFFFF' : '#000000'}
                      mb="$1"
                    >
                      1. Download Google Authenticator
                    </Text>
                    <Text
                      fontSize={11}
                      color={isDark ? '#CCCCCC' : '#666666'}
                    >
                      If you don't have it installed, download the Google Authenticator app.
                    </Text>
                  </VStack>
                </HStack>
                <Feather 
                  name="download" 
                  size={20} 
                  color={isDark ? '#FFFFFF' : '#000000'} 
                />
              </HStack>
            </Box>

            {/* Step 2: Scan QR Code or Copy Key */}
            <Box
              bg={isDark ? '#1A1A1A' : '#FFFFFF'}
              borderRadius={10}
              p="$4"
              borderWidth={1}
              borderColor={isDark ? '#333333' : '#E5E5E5'}
            >
              <HStack alignItems="center" space="md" mb="$4">
                <Box
                  width={40}
                  height={40}
                  borderRadius={20}
                  bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather 
                    name="user-plus" 
                    size={20} 
                    color={isDark ? '#FFFFFF' : '#000000'} 
                  />
                </Box>
                <VStack flex={1}>
                  <Text
                    fontSize={14}
                    fontWeight="$bold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    mb="$1"
                  >
                    2. Scan QR Code or Copy Key
                  </Text>
                  <Text
                    fontSize={11}
                    color={isDark ? '#CCCCCC' : '#666666'}
                  >
                    Scan the QR code in the Google Authenticator app, or copy and paste the key into the app.
                  </Text>
                </VStack>
              </HStack>

              {/* Secret Key Display */}
              <Box
                bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                borderRadius={10}
                p="$4"
                mb="$3"
              >
                <HStack alignItems="center" justifyContent="space-between">
                  <Text
                    fontSize={12}
                    fontWeight="$medium"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    flex={1}
                    fontFamily="monospace"
                  >
                    {secretKey}
                  </Text>
                  <Pressable onPress={handleCopyKey} ml="$2">
                    <Feather 
                      name="copy" 
                      size={18} 
                      color={isDark ? '#FFFFFF' : '#000000'} 
                    />
                  </Pressable>
                </HStack>
              </Box>

              {/* QR Code Button */}
              <Button
                bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                borderRadius={8}
                onPress={() => setShowQRCode(!showQRCode)}
                borderWidth={1}
                borderColor={isDark ? '#333333' : '#E5E5E5'}
              >
                <HStack alignItems="center" space="sm">
                  <Feather 
                    name="qr-code" 
                    size={18} 
                    color={isDark ? '#FFFFFF' : '#000000'} 
                  />
                  <ButtonText
                    color={isDark ? '#FFFFFF' : '#000000'}
                    fontSize={12}
                    fontWeight="$semibold"
                  >
                    QR Kodu Görüntüle
                  </ButtonText>
                </HStack>
              </Button>

              {/* QR Code Display (if shown) */}
              {showQRCode && (
                <Box
                  mt="$4"
                  bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                  borderRadius={10}
                  p="$4"
                  alignItems="center"
                  justifyContent="center"
                  height={200}
                >
                  <Text
                    fontSize={11}
                    color={isDark ? '#CCCCCC' : '#666666'}
                    textAlign="center"
                  >
                    QR Code burada gösterilecek
                  </Text>
                </Box>
              )}
            </Box>

            {/* Step 3: Enter 6-Digit Code */}
            <Box
              bg={isDark ? '#1A1A1A' : '#FFFFFF'}
              borderRadius={10}
              p="$4"
              borderWidth={1}
              borderColor={isDark ? '#333333' : '#E5E5E5'}
            >
              <HStack alignItems="center" space="md">
                <Box
                  width={40}
                  height={40}
                  borderRadius={20}
                  bg={isDark ? '#2A2A2A' : '#F5F5F5'}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Feather 
                    name="user-plus" 
                    size={20} 
                    color={isDark ? '#FFFFFF' : '#000000'} 
                  />
                </Box>
                <VStack flex={1}>
                  <Text
                    fontSize={14}
                    fontWeight="$bold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    mb="$1"
                  >
                    3. Enter 6-Digit Code
                  </Text>
                  <Text
                    fontSize={11}
                    color={isDark ? '#CCCCCC' : '#666666'}
                  >
                    Enter the 6-digit code generated by Google Authenticator
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>
        </ScrollView>

        {/* Next Button */}
        <Box px="$4" pb="$4" pt="$2">
          <Button
            bg="#E2FF46"
            borderRadius={8}
            onPress={handleNext}
          >
            <ButtonText
              color="#000000"
              fontSize={14}
              fontWeight="$bold"
              textAlign="center"
            >
              İleri
            </ButtonText>
          </Button>
        </Box>
      </Box>
    </SafeAreaView>
  );
};

export default GoogleAuthenticatorSetupScreen;

