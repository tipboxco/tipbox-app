import React from 'react';
import { Box, HStack, Text, Pressable, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface EventsTabsProps {
  activeTab: 'community' | 'achievement';
  onTabChange: (tab: 'community' | 'achievement') => void;
}

export const EventsTabs: React.FC<EventsTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const tabs = [
    { id: 'community' as const, label: 'Community Events' },
    { id: 'achievement' as const, label: 'Achievement Ladder' },
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
              py="$2"
              position="relative"
            >
              <VStack alignItems="center" space="xs">
                <Text
                  fontSize={14}
                  fontWeight="$bold"
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
              </VStack>
              <Box
                position="absolute"
                bottom={-1}
                left="25%"
                height={2}
                width="50%"
                borderRadius={999}
                bg={isActive ? (isDark ? '#FFFFFF' : '#000000') : 'transparent'}
              />
            </Pressable>
          );
        })}
      </HStack>
    </Box>
  );
};

export default EventsTabs;

