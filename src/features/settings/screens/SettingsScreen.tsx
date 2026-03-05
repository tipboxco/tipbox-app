import React, { useState, useCallback } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Pressable, 
  Text, 
  ScrollView, 
  Input, 
  InputField,
} from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import YourDevicesBottomSheet from '../components/YourDevicesBottomSheet';
import { LanguageBottomSheet } from '../components/LanguageBottomSheet';
import { useTranslation } from '@/src/hooks/useTranslation';

type SettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsScreen'>;

interface SettingItem {
  id: string;
  icon: string;
  title: string;
  onPress: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const SettingsScreen = () => {
  const { t } = useTranslation('settings');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Safe area insets
  const insets = useSafeAreaInsets();
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  const settingSections: SettingSection[] = [
    {
      title: t('settingsScreen.sections.accountSecurity'),
      items: [
        {
          id: 'change-password',
          icon: 'user',
          title: t('settingsScreen.menuItems.changePassword'),
          onPress: () => navigation.navigate('ChangePassword'),
        },
        {
          id: 'two-factor',
          icon: 'user',
          title: t('settingsScreen.menuItems.twoFactor'),
          onPress: () => navigation.navigate('TwoFactorAuth'),
        },
      ],
    },
    {
      title: t('settingsScreen.sections.accountPreferences'),
      items: [
        {
          id: 'notification-settings',
          icon: 'bell',
          title: t('settingsScreen.menuItems.notificationSettings'),
          onPress: () => navigation.navigate('NotificationSettings'),
        },
        {
          id: 'privacy-settings',
          icon: 'shield',
          title: t('settingsScreen.menuItems.privacySettings'),
          onPress: () => navigation.navigate('PrivacySettings'),
        },
        {
          id: 'support-settings',
          icon: 'headphones',
          title: t('settingsScreen.menuItems.supportSettings'),
          onPress: () => navigation.navigate('SupportSettings'),
        },
        {
          id: 'language',
          icon: 'globe',
          title: t('settingsScreen.menuItems.language'),
          onPress: () => {
            openBottomSheet(
              <LanguageBottomSheet onClose={closeBottomSheet} />,
              {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableDynamicSizing: true,
                backgroundStyle: {
                  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                },
                handleStyle: {
                  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                },
                handleIndicatorStyle: {
                  backgroundColor: isDark ? '#333333' : '#B8B8B7',
                  width: 40,
                  height: 4,
                },
                paddingBottom: bottomOffset,
              }
            );
          },
        },
        {
          id: 'your-devices',
          icon: 'smartphone',
          title: t('settingsScreen.menuItems.yourDevices'),
          onPress: () => {
            openBottomSheet(
              <YourDevicesBottomSheet onClose={closeBottomSheet} />,
              {
                enablePanDownToClose: true,
                enableOverDrag: false,
                enableDynamicSizing: true,
                backgroundStyle: {
                  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                },
                handleStyle: {
                  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                },
                handleIndicatorStyle: {
                  backgroundColor: isDark ? '#333333' : '#B8B8B7',
                  width: 40,
                  height: 4,
                },
                paddingBottom: bottomOffset,
              }
            );
          },
        },
      ],
    },
    {
      title: t('settingsScreen.sections.paymentSubscription'),
      items: [
        {
          id: 'payment-subscription',
          icon: 'credit-card',
          title: t('settingsScreen.menuItems.paymentSubscription'),
          onPress: () => navigation.navigate('PaymentAndSubscription'),
        },
        {
          id: 'billing-history',
          icon: 'file-text',
          title: t('settingsScreen.menuItems.billingHistory'),
          onPress: () => console.log('Billing History'),
        },
      ],
    },
  ];

  const filteredSections = settingSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(section => section.items.length > 0);

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Box pt={insets.top}>
        <Header
          title={t('settingsScreen.title')}
          showBackButton
          onBackPress={() => navigation.goBack()}
        />
      </Box>

      {/* Search Bar */}
      <Box px="$4" py="$2">
        <HStack
          alignItems="center"
          bg={isDark ? '#2A2A2A' : '#F2F2F2'}
          borderWidth={1}
          borderColor="#E9E9E9"
          borderRadius={23}
          px="$3"
          space="sm"
        >
          <Feather 
            name="search" 
            size={24} 
            color={isDark ? 'rgba(60, 60, 67, 0.6)' : 'rgba(60, 60, 67, 0.6)'} 
          />
          <Input flex={1} borderWidth={0} bg="transparent">
            <InputField
              placeholder={t('settingsScreen.searchPlaceholder')}
              placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
              color={isDark ? '#fff' : '#000'}
              fontSize="$sm"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        </HStack>
      </Box>

      {/* Settings Content */}
      <ScrollView flex={1} px="$4" pb={insets.bottom + 24}>
        <VStack>
          {filteredSections.map((section, sectionIndex) => (
            <VStack key={section.title}>
              {/* Section Title */}
              <Text
                fontSize="$sm"
                fontWeight="$medium"
                color={isDark ? '#8C8C8C' : '#8C8C8C'}
                px="$2"
                py="$3"
              >
                {section.title}
              </Text>
              
              {/* Section Items */}
              <VStack>
                {section.items.map((item, itemIndex) => (
                  <Pressable
                    key={item.id}
                    onPress={() => item.onPress()}
                    py="$2"
                    px="$2"
                  >
                    <HStack alignItems="center" justifyContent="space-between">
                      <HStack alignItems="center" space="sm" flex={1}>
                        <Box
                          w="$7"
                          h="$7"
                          bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                          rounded="$sm"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Feather
                            name={item.icon as any} 
                            size={20} 
                            color={isDark ? '#FFFFFF' : '#000000'} 
                          />
                        </Box>
                        <Text
                          fontSize="$sm"
                          fontWeight="$bold"
                          color={isDark ? '#FFFFFF' : '#000000'}
                          flex={1}
                        >
                          {item.title}
                        </Text>
                      </HStack>
                      <Feather
                        name="chevron-right" 
                        size={18} 
                        color={isDark ? '#000' : '#000'} 
                      />
                    </HStack>
                  </Pressable>
                ))}
              </VStack>
              
              {/* Divider - Only show if not the last section */}
              {sectionIndex < filteredSections.length - 1 && (
                <Box
                  height={1}
                  bg={isDark ? '#333333' : '#E9E9E9'}
                  mx="$2"
                  my="$2"
                />
              )}
            </VStack>
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
};
