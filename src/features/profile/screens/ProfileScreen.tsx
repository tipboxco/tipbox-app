import React, { useState } from 'react';
import { Box } from '@gluestack-ui/themed';
import ProfileCard from '../components/ProfileCard';
import { ProfileTabs } from '../components/ProfileTabs';
import { PostsTab, InventoryTab, WishlistTab, BadgesTab } from '../components/TabContents';

export const ProfileScreen = () => {
  const [activeTab, setActiveTab] = useState('posts');

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
    <Box flex={1}>
      <ProfileCard
        username="Adan Galloway"
        handle="@adangalloway"
        badge="Technology Expert"
        stats={{
          trust: 245,
          truster: 180,
          supporter: 92
        }}
      />
      <ProfileTabs activeTab={activeTab} onChangeTab={setActiveTab} />
      {renderTabContent()}
    </Box>
  );
};