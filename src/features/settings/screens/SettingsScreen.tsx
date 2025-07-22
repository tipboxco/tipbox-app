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
      style={{
        flex: 1,
        backgroundColor: isDark ? 'rgb(17, 24, 39)' : 'rgb(249, 250, 251)',
      }}
    >
      <HStack
        style={{
          backgroundColor: isDark ? 'rgb(31, 41, 55)' : 'rgb(243, 244, 246)',
          padding: 4,
          margin: 16,
          borderRadius: 8,
        }}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={{
              flex: 1,
              backgroundColor:
                activeTab === tab.id
                  ? isDark
                    ? 'rgb(17, 24, 39)'
                    : 'rgb(249, 250, 251)'
                  : 'transparent',
              padding: 12,
              borderRadius: 6,
              alignItems: 'center',
            }}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={{
                color: isDark ? '#F9FAFB' : '#111827',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              }}
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
