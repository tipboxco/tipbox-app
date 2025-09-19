import React, { useCallback, useState } from 'react';
import { Box } from '@gluestack-ui/themed';
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';
import ProfileCard from '../components/ProfileCard';
import { ReviewsTab, LadderTab, RepliesTab, TipsTab, FeedTab, BenchmarksTab } from '../components/TabContents';
import { mock_user_card } from '@/src/mock/profile/userCardData';
import { useColorMode } from '@/src/hooks/useColorMode';

const TABS = [
  { key: 'feed',        title: 'Feed' },
  { key: 'reviews',     title: 'Reviews' },
  { key: 'ladders',     title: 'Ladders' },
  { key: 'benchmarks',  title: 'Benchmarks' },
  { key: 'tips',        title: 'Tips & tricks' },
  { key: 'replies',     title: 'Replies' }
];

const ProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const renderHeader = useCallback(() => (
    <ProfileCard userData={mock_user_card} />
  ), []);

  const renderTabBar = useCallback((props: any) => (
    <MaterialTabBar
      {...props}
      scrollEnabled
      activeColor={isDark ? '#fff' : '#000'}
      inactiveColor={isDark ? '#666' : '#999'}
      labelStyle={{
        fontSize: 13,
        textTransform: 'capitalize',
        fontWeight: '500',
        paddingHorizontal: 20,
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
      }}
      tabStyle={{
        width: 'auto',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 4,
      }}
      indicatorStyle={{
        backgroundColor: isDark ? '#fff' : '#000',
        height: 2,
      }}
      style={{
        backgroundColor: isDark ? '#171717' : '#fff',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#333' : '#eee',
        elevation: 0,
        shadowOpacity: 0,
      }}
    />
  ), [isDark]);

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Tabs.Container
        renderHeader={renderHeader}
        headerHeight={200}
        renderTabBar={renderTabBar}
        containerStyle={{
          backgroundColor: isDark ? '#171717' : '#fff',
        }}
      >
        {TABS.map((tab) => {
          const TabContent = () => {
            if (tab.key === 'feed') return <FeedTab />;
            if (tab.key === 'ladders') return <LadderTab />;
            if (tab.key === 'replies') return <RepliesTab />;
            if (tab.key === 'tips') return <TipsTab />;
            if (tab.key === 'reviews') return <ReviewsTab />;
            if (tab.key === 'benchmarks') return <BenchmarksTab />;
            return <FeedTab />;
          };

          return (
            <Tabs.Tab name={tab.key} key={tab.key}>
              <Tabs.ScrollView>
                <TabContent />
              </Tabs.ScrollView>
            </Tabs.Tab>
          );
        })}
      </Tabs.Container>
    </Box>
  );
};

export default ProfileScreen;
