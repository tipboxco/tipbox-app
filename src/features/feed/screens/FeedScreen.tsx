import React, { useState } from 'react';
import { Box, ScrollView } from '@gluestack-ui/themed';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { FilterBar } from '../components/FilterBar';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SideMenu } from '@/src/components/SideMenu';
import { mock_user_profile } from '@/src/mock/common';
import { mock_feed_data } from '@/src/mock/feed';
import { FeedItem } from '@/src/mock/feed/types';
import PostCard from '@/src/components/PostCard';
import BenchmarkPostCard from '@/src/components/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/ExperiencePostCard';



type FeedScreenNavigationProp = NativeStackNavigationProp<FeedStackParamList & RootStackParamList, 'FeedScreen'>;

export const FeedScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'inventory'>('wallet');
  const navigation = useNavigation<FeedScreenNavigationProp>();


  const handleTabChange = (tab: 'wallet' | 'inventory') => {
    setActiveTab(tab);
    console.log('Selected tab:', tab);
  };

  const renderFeedItem = (item: FeedItem) => {
    switch (item.type) {
      case 'feed':
        return (
          <ExperiencePostCard
            key={item.id}
            data={item}
          />
        );
      case 'benchmark':
        return (
          <BenchmarkPostCard
            key={item.id}
            data={item}
          />
        );
      case 'post':
        return (
          <PostCard
            key={item.id}
            data={item}
          />
        );
      case 'question':
        return (
          <QuestionPostCard
            key={item.id}
            data={item}
          />
        );
      case 'tipsAndTricks':
        return (
          <TipsAndTricksPostCard
            key={item.id}
            data={item}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box
      flex={1}
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
    >
      <Header
        title="Akış"
        onMenuPress={() => setIsMenuVisible(true)}
        showTabs={true}
        onTabChange={handleTabChange}
      />
      <FilterBar />
      <ScrollView flex={1} px="$4" py="$2">
        {activeTab === 'wallet' ? (
          // Wallet içeriği - Feed verilerini göster
          <Box>
            {mock_feed_data.map((item) => renderFeedItem(item))}
          </Box>
        ) : (
          // Inventory içeriği
          <Box>
            {/* Inventory içeriği buraya gelecek */}
          </Box>
        )}
      </ScrollView>
      <SideMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        userProfile={mock_user_profile}

      />
    </Box>
  );
};