import React, { useState } from 'react';
import { Box, HStack, Pressable, Text, VStack, ScrollView } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { SettingsTab } from '../tabs/SettingsTab';
import { NotificationTab } from '../tabs/NotificationTab';
import { MediaTab } from '../tabs/MediaTab';
import { Keyboard } from '../tabs/Keyboard';

type TabType = 'theme' | 'notification' | 'media' | 'keyboard';

export const MoreSchoiseScreen = () => {
  const { t } = useTranslation('common');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('theme');

  const tabs = [
    { id: 'theme' as TabType, label: t('moreSchoise.tabs.settings') },
    { id: 'notification' as TabType, label: t('moreSchoise.tabs.notification') },
    { id: 'media' as TabType, label: t('moreSchoise.tabs.media') },
    { id: 'keyboard' as TabType, label: t('moreSchoise.tabs.keyboard') },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'theme':
        return <SettingsTab />;
      case 'notification':
        return <NotificationTab />;
      case 'media':
        return <MediaTab />;
      case 'keyboard':
        return <Keyboard />;
      default:
        return null;
    }
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <Header
        title={t('moreSchoise.title')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <HStack
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
        p="$1"
        m="$4"
        rounded="$lg"
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            flex={1}
            bg={
              activeTab === tab.id
                ? isDark
                  ? '$backgroundDark0' : '$backgroundLight0'
                : 'transparent'
            }
            p="$3"
            rounded="$md"
            alignItems="center"
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              color={isDark ? '$textDark50' : '$textLight900'}
              fontWeight={activeTab === tab.id ? '$bold' : '$normal'}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </HStack>

      {renderContent()}
    </Box>
  );
};
