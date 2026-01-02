import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Pressable,
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrivacySettings, useUpdatePrivacySettings } from '../api/hooks';
import { PrivacyCode } from '../types';

interface PrivacyOption {
  id: 'trust-only' | 'everyone';
  label: string;
}

export const PrivacySettingsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const toast = useToast();

  // API hooks
  const { data: privacySettings, isLoading, error } = usePrivacySettings();
  const updateMutation = useUpdatePrivacySettings();

  // Local state for UI
  const [localSettings, setLocalSettings] = useState<Record<number, 'trust-only' | 'everyone'>>({});
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});

  // Initialize local state from API data
  useEffect(() => {
    if (privacySettings) {
      const settingsMap: Record<number, 'trust-only' | 'everyone'> = {};
      privacySettings.forEach((setting) => {
        settingsMap[setting.privacyCode] = setting.selectedValue;
      });
      setLocalSettings(settingsMap);
    }
  }, [privacySettings]);

  // Get setting value by code
  const getSettingValue = (code: PrivacyCode): 'trust-only' | 'everyone' => {
    return localSettings[code] ?? 'everyone';
  };

  // Update setting value
  const updateSetting = async (code: PrivacyCode, value: 'trust-only' | 'everyone') => {
    // Optimistic update
    setLocalSettings((prev) => ({ ...prev, [code]: value }));
    setOpenDropdowns((prev) => ({ ...prev, [code]: false }));

    // Prepare all settings for API
    const allSettings = [
      { privacyCode: PrivacyCode.NFT_BADGE_COLLECTIONS, selectedValue: localSettings[PrivacyCode.NFT_BADGE_COLLECTIONS] ?? 'trust-only' },
      { privacyCode: PrivacyCode.TRUST_TRUSTER_LIST, selectedValue: localSettings[PrivacyCode.TRUST_TRUSTER_LIST] ?? 'everyone' },
      { privacyCode: PrivacyCode.ONE_ON_ONE_SUPPORT, selectedValue: localSettings[PrivacyCode.ONE_ON_ONE_SUPPORT] ?? 'everyone' },
    ];
    
    // Update the changed setting
    const settingIndex = allSettings.findIndex((s) => s.privacyCode === code);
    if (settingIndex !== -1) {
      allSettings[settingIndex].selectedValue = value;
    }

    try {
      await updateMutation.mutateAsync({ settings: allSettings });
    } catch (error: any) {
      // Revert optimistic update on error
      setLocalSettings((prev) => {
        const current = prev[code];
        return { ...prev, [code]: current ?? 'everyone' };
      });
      const errorMessage = error?.response?.data?.message || error?.message || 'Gizlilik ayarları güncellenirken bir hata oluştu';
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

  const privacyOptions: PrivacyOption[] = [
    { id: 'trust-only', label: 'Trusters Only' },
    { id: 'everyone', label: 'Everyone' },
  ];

  // Privacy setting items for display
  const privacyItems = [
    {
      id: 'nft-collections',
      code: PrivacyCode.NFT_BADGE_COLLECTIONS,
      title: 'NFT / Badge Collections',
      description: 'Choose who can view your NFT / Badge Collections.',
      defaultValue: 'trust-only' as const,
    },
    {
      id: 'trust-list',
      code: PrivacyCode.TRUST_TRUSTER_LIST,
      title: 'Trust / Truster List',
      description: 'Choose who can view your Trust / Truster List.',
      defaultValue: 'everyone' as const,
    },
    {
      id: 'support-session',
      code: PrivacyCode.ONE_ON_ONE_SUPPORT,
      title: '1-on-1 Support Session Request',
      description: 'Choose who can request a 1-on-1 Support Session.',
      defaultValue: 'everyone' as const,
    },
  ];

  const renderPrivacySetting = (item: typeof privacyItems[0]) => {
    const isDropdownOpen = openDropdowns[item.code] || false;
    const selectedValue = getSettingValue(item.code);
    const selectedOption = privacyOptions.find(opt => opt.id === selectedValue);

    return (
      <VStack key={item.id} space="md" mb="$4">
        {/* Title and Description */}
        <VStack space="xs">
          <Text
            fontSize={11}
            fontWeight="$bold"
            color={isDark ? '#FFFFFF' : '#000000'}
          >
            {item.title}
          </Text>
          <Text
            fontSize={10}
            fontWeight="$normal"
            color="#B9B9B9"
            lineHeight={14}
          >
            {item.description}
          </Text>
        </VStack>

        {/* Dropdown Selector */}
        <Pressable
          onPress={() => setOpenDropdowns((prev) => ({ ...prev, [item.code]: !prev[item.code] }))}
          disabled={updateMutation.isPending}
        >
          <Box
            bg={isDark ? '#1A1A1A' : '#FFFFFF'}
            borderRadius={10}
            borderWidth={1}
            borderColor="#B9B9B9"
            px="$4"
            py="$3"
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            opacity={updateMutation.isPending ? 0.5 : 1}
          >
            <Text
              fontSize={11}
              fontWeight="$medium"
              color="#B9B9B9"
            >
              {selectedOption?.label || 'Select Option'}
            </Text>
            <Feather
              name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#B9B9B9"
            />
          </Box>
        </Pressable>

        {/* Dropdown Options */}
        {isDropdownOpen && (
          <VStack space="xs" mt="$1">
            {privacyOptions.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => updateSetting(item.code, option.id)}
                disabled={updateMutation.isPending}
              >
                <Box
                  bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                  borderRadius={10}
                  borderWidth={1}
                  borderColor={selectedValue === option.id ? '#34C759' : '#B9B9B9'}
                  px="$4"
                  py="$3"
                  opacity={updateMutation.isPending ? 0.5 : 1}
                >
                  <Text
                    fontSize={11}
                    fontWeight="$medium"
                    color={selectedValue === option.id ? '#34C759' : '#B9B9B9'}
                  >
                    {option.label}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </VStack>
        )}
      </VStack>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '#FAFAFA'}
      >
        <Header
          title="Privacy Settings"
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
                {error.message || 'Gizlilik ayarları yüklenirken bir hata oluştu'}
              </Text>
            </Box>
          ) : (
            <VStack space="lg">
              {privacyItems.map((item) => renderPrivacySetting(item))}
            </VStack>
          )}
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};

export default PrivacySettingsScreen;
