import React, { useState } from 'react';
import { Box, HStack, Pressable, Text, VStack } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';

interface TabItemProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
}

const TabItem = ({ label, isActive, onPress, isDark }: TabItemProps) => (
  <Pressable onPress={onPress} flex={1}>
    <VStack alignItems="center" space="sm">
      <Box
        bg={isActive ? (isDark ? '$backgroundDark200' : '$backgroundLight200') : 'transparent'}
        px="$3"
        py="$2"
        borderRadius="$sm"
        width={30}
        height={22}
      />
      <Text
        fontSize="$xs"
        fontWeight={isActive ? '$semibold' : '$medium'}
        color={isActive ? (isDark ? '$textDark50' : '$textLight900') : (isDark ? '$textDark400' : '$textLight400')}
      >
        {label}
      </Text>
    </VStack>
  </Pressable>
);

export const ProfileTabs = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [activeTab, setActiveTab] = useState('akis');

  const tabs = [
    { id: 'akis', label: 'Akış' },
    { id: 'envanter', label: 'Envanter' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'rozetler', label: 'Rozetler' },
  ];

  return (
    <Box
      bg={isDark ? '$backgroundDark100' : '$backgroundLight100'}
      borderRadius="$lg"
      p="$4"
    >
      <HStack justifyContent="space-between" space="md">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onPress={() => setActiveTab(tab.id)}
            isDark={isDark}
          />
        ))}
      </HStack>
    </Box>
  );
};
