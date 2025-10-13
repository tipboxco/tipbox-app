import React, { useState } from 'react';
import { ScrollView, HStack, Pressable, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface FilterTabsProps {
  tabs: string[];
  onTabChange?: (tab: string) => void;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ tabs, onTabChange }) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [selectedTab, setSelectedTab] = useState(tabs[0]);

  const handleTabPress = (tab: string) => {
    setSelectedTab(tab);
    onTabChange?.(tab);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 0 }}
    >
      <HStack space="sm" alignItems="center">
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => handleTabPress(tab)}
            bg={
              selectedTab === tab
                ? isDark
                  ? '#1A1A1A'
                  : '#FDFDFD'
                : isDark
                ? '#2A2A2A'
                : '#F2F2F2'
            }
            borderWidth={1}
            borderColor={
              selectedTab === tab
                ? isDark
                  ? '#4A90E2'
                  : '#4A90E2'
                : isDark
                ? '#3A3A3A'
                : '#E9E9E9'
            }
            borderRadius={10}
            px="$3"
            py="$2"
          >
            <Text
              color={
                selectedTab === tab
                  ? isDark
                    ? '#FFFFFF'
                    : '#000000'
                  : isDark
                  ? '#8C8C8C'
                  : '#666666'
              }
              fontSize={9}
              fontWeight="$semibold"
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </HStack>
    </ScrollView>
  );
};

export default FilterTabs;
