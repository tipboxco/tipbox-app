import React, { useState } from 'react';
import { Box } from '@gluestack-ui/themed';
import ProfileCard from '../components/ProfileCard';
import { ProfileTabs } from '../components/ProfileTabs';
import { PostsTab, InventoryTab, WishlistTab, BadgesTab } from '../components/TabContents';
import { mock_user_card } from '@/src/mock/profile';
import { useColorMode } from '@/src/hooks/useColorMode';

export const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('posts');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return <PostsTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'wishlist':
        return <WishlistTab />;
      case 'badges':
        return <BadgesTab />;
      default:
        return <PostsTab />;
    }
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <ProfileCard userData={mock_user_card} />
      <ProfileTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      {renderTabContent()}
    </Box>
  );
};