import React, { useState } from 'react';
import { Box, HStack, Text, Pressable } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface CollectionTabsProps {
  activeTab: 'achievements' | 'bridges';
  onTabChange: (tab: 'achievements' | 'bridges') => void;
}

export const CollectionTabs: React.FC<CollectionTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const tabs = [
    { id: 'achievements' as const, label: 'Achievements Badges' },
    { id: 'bridges' as const, label: 'Bridge Badges' },
  ];

  return (
    <Box
      bg={isDark ? '$backgroundDark900' : '$white'}
      borderBottomWidth={1}
      borderBottomColor={isDark ? '$borderDark800' : '$borderLight200'}
    >
      <HStack px="$4" space="md">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              flex={1}
            >
              <Box
                py="$3"
                alignItems="center"
                borderBottomWidth={2}
                borderBottomColor={isActive ? '#D4FF00' : 'transparent'}
              >
                <Text
                  fontSize={14}
                  fontWeight={isActive ? '$semibold' : '$normal'}
                  color={
                    isActive
                      ? isDark
                        ? '$textDark50'
                        : '$textLight950'
                      : isDark
                      ? '$textDark400'
                      : '$textLight500'
                  }
                >
                  {tab.label}
                </Text>
              </Box>
            </Pressable>
          );
        })}
      </HStack>
    </Box>
  );
};

export default CollectionTabs;

