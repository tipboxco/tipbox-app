import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  ScrollView,
  Pressable,
} from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PrivacyOption {
  id: string;
  label: string;
}

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  selectedOption: string;
  options: PrivacyOption[];
  onSelect: (optionId: string) => void;
}

export const PrivacySettingsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();

  // Privacy settings state
  const [nftCollectionPrivacy, setNftCollectionPrivacy] = useState('trusters-only');
  const [trustListPrivacy, setTrustListPrivacy] = useState('everyone');
  const [supportSessionPrivacy, setSupportSessionPrivacy] = useState('everyone');

  const privacyOptions = {
    'trusters-only': { id: 'trusters-only', label: 'Trusters Only' },
    'everyone': { id: 'everyone', label: 'Everyone' },
    'friends': { id: 'friends', label: 'Friends Only' },
    'private': { id: 'private', label: 'Private' },
  };

  const privacySettings: PrivacySetting[] = [
    {
      id: 'nft-collections',
      title: 'NFT / Badge Collections',
      description: 'Choose who can view your NFT / Badge Collections.',
      selectedOption: nftCollectionPrivacy,
      options: [
        privacyOptions['trusters-only'],
        privacyOptions['everyone'],
        privacyOptions['friends'],
        privacyOptions['private'],
      ],
      onSelect: setNftCollectionPrivacy,
    },
    {
      id: 'trust-list',
      title: 'Trust / Truster List',
      description: 'Choose who can view your Trust / Truster List.',
      selectedOption: trustListPrivacy,
      options: [
        privacyOptions['everyone'],
        privacyOptions['trusters-only'],
        privacyOptions['friends'],
        privacyOptions['private'],
      ],
      onSelect: setTrustListPrivacy,
    },
    {
      id: 'support-session',
      title: '1-on-1 Support Session Request',
      description: 'Choose who can request a 1-on-1 Support Session.',
      selectedOption: supportSessionPrivacy,
      options: [
        privacyOptions['everyone'],
        privacyOptions['trusters-only'],
        privacyOptions['friends'],
        privacyOptions['private'],
      ],
      onSelect: setSupportSessionPrivacy,
    },
  ];

  const renderPrivacySetting = (setting: PrivacySetting) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const selectedOption = setting.options.find(opt => opt.id === setting.selectedOption);

    return (
      <VStack key={setting.id} space="xs">
        {/* Main Setting Card */}
        <Box
          bg={isDark ? '#1A1A1A' : '#FFFFFF'}
          borderRadius={10}
          mb={'$1'}
        >
          <VStack space="xs">
            <Text
              fontSize={11}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              {setting.title}
            </Text>
            <Text
              fontSize={10}
              fontWeight="$medium"
              color="#B9B9B9"
              lineHeight={12}
            >
              {setting.description}
            </Text>
          </VStack>
        </Box>

        {/* Dropdown Selector */}
        <Pressable
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
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
          <VStack space="xs">
            {setting.options.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => {
                  setting.onSelect(option.id);
                  setIsDropdownOpen(false);
                }}
              >
                <Box
                  bg={isDark ? '#1A1A1A' : '#FFFFFF'}
                  borderRadius={10}
                  borderWidth={1}
                  borderColor={setting.selectedOption === option.id ? '#34C759' : '#B9B9B9'}
                  px="$4"
                  py="$2"
                >
                  <Text
                    fontSize={11}
                    fontWeight="$medium"
                    color={setting.selectedOption === option.id ? '#34C759' : '#B9B9B9'}
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
          <VStack space="lg">
            {privacySettings.map((setting) => renderPrivacySetting(setting))}
          </VStack>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};

export default PrivacySettingsScreen;
