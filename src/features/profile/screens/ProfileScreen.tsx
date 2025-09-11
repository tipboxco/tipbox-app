import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import ProfileCard from '../components/ProfileCard';
import { ProfileTabs } from '../components/ProfileTabs';
import { PostsTab, InventoryTab, WishlistTab, BadgesTab } from '../components/TabContents';
import { mock_user_card } from '@/src/mock/profile/userCardData';
import { useColorMode } from '@/src/hooks/useColorMode';

export const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('feed');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <PostsTab />;
      case 'reviews':
        return <PostsTab />;
      case 'benchmarks':
        return <PostsTab />;
      case 'tips':
        return <PostsTab />;
      case 'replies':
        return <PostsTab />;
      case 'bookmarks':
        return <WishlistTab />;
      default:
        return <PostsTab />;
    }
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]} // ProfileTabs'i sticky yapar
      >
        <ProfileCard userData={mock_user_card} />
        <Box bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
          <ProfileTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        </Box>
        <Box minHeight={600}>
          {renderTabContent()}
        </Box>
      </ScrollView>
    </Box>
  );
};