import React from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Box,
  VStack,
  HStack,
  Text,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from '@/src/hooks/useTranslation';

export const TwoFactorAuthScreen = () => {
  const { t } = useTranslation('settings');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const backgroundColor = '#FFFFFF';

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Top safe area */}
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
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Box
          flex={1}
          bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
        >
        <Header
          title={t('settings.twoFactorAuth.title')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

        <VStack flex={1} px="$4" py="$6" space="lg">
          {/* Placeholder Image Area */}
          <Box
            height={200}
            bg={isDark ? '#1A1A1A' : '#E5E5E5'}
            borderRadius={10}
            alignItems="center"
            justifyContent="center"
            mb="$4"
          >
            <Feather 
              name="image" 
              size={48} 
              color={isDark ? '#666666' : '#999999'} 
            />
          </Box>

          {/* Description Placeholder */}
          <Box
            height={60}
            bg={isDark ? '#1A1A1A' : '#E5E5E5'}
            borderRadius={10}
            mb="$6"
          />

          {/* Google Authenticator Option */}
          <Pressable
            onPress={() => navigation.navigate('GoogleAuthenticatorSetup')}
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
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    mb="$1"
                  >
                    {t('settings.twoFactorAuth.googleAuthenticator.title')}
                  </Text>
                  <Text
                    fontSize="$sm"
                    color={isDark ? '#CCCCCC' : '#666666'}
                  >
                    {t('settings.twoFactorAuth.googleAuthenticator.description')}
                  </Text>
                </VStack>
              </HStack>
              <Feather 
                name="chevron-right" 
                size={20} 
                color={isDark ? '#FFFFFF' : '#000000'} 
              />
            </HStack>
          </Pressable>

          {/* SMS Option */}
          <Pressable
            onPress={() => navigation.navigate('SMSVerification')}
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
                    fontSize="$sm"
                    fontWeight="$bold"
                    color={isDark ? '#FFFFFF' : '#000000'}
                    mb="$1"
                  >
                    {t('settings.twoFactorAuth.smsOption.title')}
                  </Text>
                  <Text
                    fontSize="$sm"
                    color={isDark ? '#CCCCCC' : '#666666'}
                  >
                    {t('settings.twoFactorAuth.smsOption.description')}
                  </Text>
                </VStack>
              </HStack>
              <Feather 
                name="chevron-right" 
                size={20} 
                color={isDark ? '#FFFFFF' : '#000000'} 
              />
            </HStack>
          </Pressable>

          {/* Why do we need this? Link */}
          <Pressable
            onPress={() => {
              // TODO: Show info modal or navigate to help screen
              console.log('Why do we need this?');
            }}
            mt="auto"
            pb="$4"
          >
            <Text
              fontSize="$sm"
              fontWeight="$semibold"
              color={isDark ? '#FFFFFF' : '#000000'}
              textAlign="center"
              underline
            >
              {t('settings.twoFactorAuth.whyNeeded')}
            </Text>
          </Pressable>
        </VStack>
      </Box>
      </SafeAreaView>
      {/* Bottom safe area */}
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

export default TwoFactorAuthScreen;

