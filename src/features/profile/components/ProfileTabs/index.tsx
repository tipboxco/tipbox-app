import React from 'react';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Feather } from '@expo/vector-icons';

type TabItem = {
  key: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
};

const TABS: TabItem[] = [
  { key: 'posts', title: 'Posts', icon: 'grid' },
  { key: 'inventory', title: 'Envanter', icon: 'box' },
  { key: 'wishlist', title: 'Wishlist', icon: 'bookmark' },
  { key: 'badges', title: 'Badges', icon: 'award' },
];

type ProfileTabsProps = {
  activeTab: string;
  onChangeTab: (tab: string) => void;
};

export const ProfileTabs = ({ activeTab, onChangeTab }: ProfileTabsProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <HStack space="xl" p="$4" my="$4" justifyContent="space-between">
      {TABS.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => onChangeTab(tab.key)}
        >
          <VStack alignItems="center" space="sm">
            <Feather
              name={tab.icon}
              size={24}
              color={activeTab === tab.key 
                ? (isDark ? '#FFFFFF' : '#000000')
                : (isDark ? '#94A3B8' : '#64748B')
              }
            />
            <Text
              fontSize="$xs"
              fontWeight={activeTab === tab.key ? '$bold' : '$medium'}
              color={activeTab === tab.key 
                ? (isDark ? '$textDark50' : '$textLight900')
                : (isDark ? '$textDark400' : '$textLight500')
              }
            >
              {tab.title}
            </Text>
            <Box
              h={2}
              w="$full"
              bg={activeTab === tab.key 
                ? (isDark ? '$primary500' : '$primary600')
                : 'transparent'
              }
              rounded="$full"
            />
          </VStack>
        </Pressable>
      ))}
    </HStack>
  );
};
