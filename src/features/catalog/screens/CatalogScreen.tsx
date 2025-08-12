import React, { useState } from 'react';
import { Box, Text } from '@gluestack-ui/themed';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SideMenu } from '@/src/components/SideMenu';
import { mock_user_profile } from '@/src/mock/common';



export const CatalogScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <Header
        title="Catalog"
        hasNotification
        hasMessage
        onMenuPress={() => setIsMenuVisible(true)}
      />
      <Text>Welcome to Catalog</Text>
      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={mock_user_profile}

      />
    </Box>
  );
};
