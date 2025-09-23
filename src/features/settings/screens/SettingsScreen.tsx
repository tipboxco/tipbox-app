import React, { useState, useRef, useMemo, useCallback } from 'react';
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
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import ChangePasswordBottomSheet from '../components/ChangePasswordBottomSheet';
import YourDevicesBottomSheet from '../components/YourDevicesBottomSheet';

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
  
  // Bottom sheet refs
  const changePasswordBottomSheetRef = useRef<BottomSheet>(null);
  const yourDevicesBottomSheetRef = useRef<BottomSheet>(null);
  
  // Bottom sheet snap points
  const changePasswordSnapPoints = useMemo(() => ['55%'], []);
  const yourDevicesSnapPoints = useMemo(() => ['70%'], []);

  const settingSections: SettingSection[] = [
    {
      title: 'Account Security',
      items: [
        {
          id: 'change-password',
          icon: 'user',
          title: 'Change Password',
          onPress: () => {
            console.log('[SettingsScreen] Change Password pressed');
            console.log('[SettingsScreen] BottomSheet ref:', changePasswordBottomSheetRef.current);
            if (changePasswordBottomSheetRef.current) {
              changePasswordBottomSheetRef.current.snapToIndex(0);
            } else {
              console.log('[SettingsScreen] BottomSheet ref is null, trying again...');
              // Ref henüz hazır değilse, kısa bir gecikme ile tekrar dene
              setTimeout(() => {
                if (changePasswordBottomSheetRef.current) {
                  changePasswordBottomSheetRef.current.snapToIndex(0);
                } else {
                  console.log('[SettingsScreen] BottomSheet ref still null after timeout');
                }
              }, 100);
            }
          },
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
          icon: 'bell',
          title: 'Notification Settings',
          onPress: () => navigation.navigate('NotificationSettings' as never),
        },
        {
          id: 'privacy-settings',
          icon: 'shield',
          title: 'Privacy Settings',
          onPress: () => navigation.navigate('PrivacySettings' as never),
        },
        {
          id: 'support-settings',
          icon: 'headphones',
          title: '1-on-1 Support Settings',
          onPress: () => navigation.navigate('SupportSettings' as never),
        },
        {
          id: 'your-devices',
          icon: 'smartphone',
          title: 'Your Devices',
          onPress: () => {
            console.log('[SettingsScreen] Your Devices pressed');
            console.log('[SettingsScreen] Your Devices BottomSheet ref:', yourDevicesBottomSheetRef.current);
            if (yourDevicesBottomSheetRef.current) {
              yourDevicesBottomSheetRef.current.snapToIndex(0);
            } else {
              console.log('[SettingsScreen] Your Devices BottomSheet ref is null, trying again...');
              setTimeout(() => {
                if (yourDevicesBottomSheetRef.current) {
                  yourDevicesBottomSheetRef.current.snapToIndex(0);
                } else {
                  console.log('[SettingsScreen] Your Devices BottomSheet ref still null after timeout');
                }
              }, 100);
            }
          },
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

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}     // 0. indexte overlay görünsün
        disappearsOnIndex={-1} // sadece kapalıyken (-1) kaybolsun
      />
    ),
    []
  );

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

      {/* Change Password Bottom Sheet */}
      <BottomSheet
        ref={changePasswordBottomSheetRef}
        index={-1}
        snapPoints={changePasswordSnapPoints}
        enablePanDownToClose
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView>
          <ChangePasswordBottomSheet
            onClose={() => changePasswordBottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>

      {/* Your Devices Bottom Sheet */}
      <BottomSheet
        ref={yourDevicesBottomSheetRef}
        index={-1}
        snapPoints={yourDevicesSnapPoints}
        enablePanDownToClose
        enableOverDrag={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#B8B8B7',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView>
          <YourDevicesBottomSheet
            onClose={() => yourDevicesBottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
};
