import React from 'react';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeTab, onTabChange }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <VStack space="xs">
      <HStack justifyContent="center" alignItems="center" space="lg">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => onTabChange(item.id)}
              alignItems="center"
            >
              <VStack alignItems="center" space="xs">
                <Text
                  fontSize={12}
                  fontWeight="$bold"
                  color={
                    isActive
                      ? isDark
                        ? '$textDark50'
                        : '$textLight900'
                      : isDark
                      ? '$textDark400'
                      : '$textLight500'
                  }
                >
                  {item.label.toUpperCase()}
                </Text>
                {isActive ? (
                  <Box
                    w="100%"
                    h={2}
                    bg={isDark ? '$backgroundDark600' : '$backgroundLight300'}
                    rounded={2}
                  />
                ) : (
                  <Box w="100%" h={2} bg="transparent" />
                )}
              </VStack>
            </Pressable>
          );
        })}
      </HStack>
      {/* Divider under tabs */}
      <Box h={2} bg={isDark ? '#333333' : '#ECECEC'} />
    </VStack>
  );
};

export default Tabs;


