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
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../navigation';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import YourDevicesBottomSheet from '../components/YourDevicesBottomSheet';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

  const settingSections: SettingSection[] = [
    {
      title: 'Account Security',
      items: [
        {
          id: 'change-password',
          icon: 'user',
          title: 'Change Password',
          onPress: () => navigation.navigate('ChangePassword'),
        },
        {
          id: 'two-factor',
          icon: 'user',
          title: 'Two-Factor Authentication',
          onPress: () => navigation.navigate('TwoFactorAuth'),
        },
      ],
    },
    {
      title: 'Account Preferences',
      items: [
        {
          id: 'notification-settings',
          icon: 'bell',
          title: 'Notification Settings',
          onPress: () => navigation.navigate('NotificationSettings'),
        },
        {
          id: 'privacy-settings',
          icon: 'shield',
          title: 'Privacy Settings',
          onPress: () => navigation.navigate('PrivacySettings'),
        },
        {
          id: 'support-settings',
          icon: 'headphones',
          title: '1-on-1 Support Settings',
          onPress: () => navigation.navigate('SupportSettings'),
        },
        {
          id: 'your-devices',
          icon: 'smartphone',
          title: 'Your Devices',
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
      title: 'Payment & Subscription Settings',
      items: [
        {
          id: 'payment-subscription',
          icon: 'credit-card',
          title: 'Payment & Subscription',
          onPress: () => navigation.navigate('PaymentAndSubscription'),
        },
        {
          id: 'billing-history',
          icon: 'file-text',
          title: 'Billing History',
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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      >
      <Header
        title="Settings"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <Box px="$4" py="$2">
        <HStack
          alignItems="center"
          bg={isDark ? '#1A1A1A' : '#FDFDFD'}
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
              placeholder="Select product group or search product name"
              placeholderTextColor={isDark ? '#B9B9B9' : '#B9B9B9'}
              color={isDark ? '#fff' : '#000'}
              fontSize={11}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Input>
        </HStack>
      </Box>

      {/* Settings Content */}
      <ScrollView flex={1} px="$4" pb="$6">
        <VStack>
          {filteredSections.map((section, sectionIndex) => (
            <VStack key={section.title}>
              {/* Section Title */}
              <Text
                fontSize="$xs"
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
                          w={22}
                          h={22}
                          bg={isDark ? '#1A1A1A' : '#FDFDFD'}
                          rounded="$sm"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Feather
                            name={item.icon as any} 
                            size={21} 
                            color={isDark ? '#FFFFFF' : '#000000'} 
                          />
                        </Box>
                        <Text
                          fontSize={11}
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
    </SafeAreaView>
  );
};
