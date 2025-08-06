import React, { useState } from 'react';
import { Box, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { ThemeTab } from './tabs/ThemeTab';
import { NotificationTab } from './tabs/NotificationTab';
import { MediaTab } from './tabs/MediaTab';

type TabType = 'theme' | 'notification' | 'media';

export const SettingsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeTab, setActiveTab] = useState<TabType>('theme');

  const tabs = [
    { id: 'theme' as TabType, label: 'Tema' },
    { id: 'notification' as TabType, label: 'Bildirimler' },
    { id: 'media' as TabType, label: 'Medya' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'theme':
        return <ThemeTab />;
      case 'notification':
        return <NotificationTab />;
      case 'media':
        return <MediaTab />;
      default:
        return null;
    }
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
    >
      <HStack
        bg={isDark ? '$backgroundDark50' : '$backgroundLight0'}
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
                ? '$backgroundDark50' : '$backgroundLight0'
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
