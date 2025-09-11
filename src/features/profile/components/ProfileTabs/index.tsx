import React from 'react';
import { Box, HStack, Pressable, Text, ScrollView } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

type TabItem = {
  key: string;
  title: string;
};

const TABS: TabItem[] = [
  { key: 'feed', title: 'Feed' },
  { key: 'reviews', title: 'Reviews' },
  { key: 'benchmarks', title: 'Benchmarks' },
  { key: 'tips', title: 'Tips & Tricks' },
  { key: 'replies', title: 'Replies' },
  { key: 'bookmarks', title: 'Bookmarks' },
];

type ProfileTabsProps = {
  activeTab: string;
  onChangeTab: (tab: string) => void;
};

export const ProfileTabs = ({ activeTab, onChangeTab }: ProfileTabsProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box borderBottomWidth={1} borderBottomColor={isDark ? '$borderDark800' : '$borderLight200'}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack space="xl" px="$4">
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => onChangeTab(tab.key)}
              py="$3"
            >
              <Text
                fontSize={12}
                fontWeight={activeTab === tab.key ? '$bold' : '$normal'}
                color={activeTab === tab.key 
                  ? (isDark ? '$textDark50' : '$textLight900')
                  : (isDark ? '$textDark400' : '$textLight500')
                }
              >
                {tab.title}
              </Text>
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h={2}
                bg={activeTab === tab.key 
                  ? (isDark ? '$primary500' : '$primary600')
                  : 'transparent'
                }
              />
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Box>
  );
};