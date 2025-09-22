import React, { useState } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Pressable, 
  Text, 
  ScrollView, 
  Input, 
  InputField
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';

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
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const settingSections: SettingSection[] = [
    {
      title: 'Account Security',
      items: [
        {
          id: 'change-password',
          icon: 'user',
          title: 'Change Password',
          onPress: () => console.log('Change Password'),
        },
        {
          id: 'two-factor',
          icon: 'user',
          title: 'Two-Factor Authentication',
          onPress: () => console.log('Two-Factor Authentication'),
        },
      ],
    },
    {
      title: 'Account Preferences',
      items: [
        {
          id: 'notification-settings',
          icon: 'user',
          title: 'Notification Settings',
          onPress: () => console.log('Notification Settings'),
        },
        {
          id: 'privacy-settings',
          icon: 'user',
          title: 'Privacy Settings',
          onPress: () => console.log('Privacy Settings'),
        },
        {
          id: 'support-settings',
          icon: 'user',
          title: '1-on-1 Support Settings',
          onPress: () => console.log('1-on-1 Support Settings'),
        },
        {
          id: 'linked-devices',
          icon: 'user',
          title: 'Linked Devices',
          onPress: () => console.log('Linked Devices'),
        },
      ],
    },
    {
      title: 'Payment & Subscription Settings',
      items: [
        {
          id: 'payment-methods',
          icon: 'user',
          title: 'Payment Methods',
          onPress: () => console.log('Payment Methods'),
        },
        {
          id: 'subscriptions',
          icon: 'user',
          title: 'Subscriptions',
          onPress: () => console.log('Subscriptions'),
        },
        {
          id: 'billing-history',
          icon: 'user',
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
              placeholder="Ürün Grubu seçin veya ürün adı arayın"
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
                    onPress={item.onPress}
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
  );
};
