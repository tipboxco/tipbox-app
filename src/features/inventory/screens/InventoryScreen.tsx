import React, { useState } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';

const MOCK_USER_PROFILE = {
  name: 'Ozan Mutluoğlu',
  avatar: require('@/assets/avatar/ozan.png'),
  trust: 776,
  truster: 556,
  friends: 556,
  badge: {
    text: 'Kitchen Specialist',
    color: '#FF0842',
    borderColor: '#FF0842',
  },
};

import { Feather } from '@expo/vector-icons';
import { SideMenu } from '@/src/components/SideMenu';
type FeatherIconName = keyof typeof Feather.glyphMap;

const MENU_ITEMS: Array<{
  id: string;
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
}> = [
    {
      id: 'profile',
      icon: 'user',
      label: 'Profil',
      onPress: () => { },
    },
    {
      id: 'wishlist',
      icon: 'heart',
      label: 'Wishlist',
      onPress: () => { },
    },
    {
      id: 'bridge',
      icon: 'link',
      label: 'Bridge',
      onPress: () => { },
    },
    {
      id: 'wishbox',
      icon: 'package',
      label: 'Wishbox',
      onPress: () => { },
    },
    {
      id: 'achievements',
      icon: 'trending-up',
      label: 'Başarım Merdiveni',
      onPress: () => { },
    },
    {
      id: 'collection',
      icon: 'grid',
      label: 'Koleksiyon Vitrini',
      onPress: () => { },
    },
    {
      id: 'assets',
      icon: 'package',
      label: 'Varlıklarım',
      onPress: () => { },
    },
    {
      id: 'bookmarks',
      icon: 'bookmark',
      label: 'Kaydedilenler',
      onPress: () => { },
    },
  ];

export const InventoryScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <Header
        title="Inventory"
        hasNotification
        hasMessage
        onMenuPress={() => setIsMenuVisible(true)}
      />
      <Text>Welcome to Inventory</Text>
      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={MOCK_USER_PROFILE}
        menuItems={MENU_ITEMS}
      />
    </Box>
  );
};
