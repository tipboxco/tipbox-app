import React from 'react';
import { ScrollView } from 'react-native';
import {
  Box,
  Tabs,
  TabsTabList,
  TabsTab,
  TabsTabTitle,
  TabsTabPanels,
  TabsTabPanel,
} from '@gluestack-ui/themed';
import ProfileCard from '../components/ProfileCard';
import { PostsTab, LadderTab } from '../components/TabContents';
import { mock_user_card } from '@/src/mock/profile/userCardData';
import { useColorMode } from '@/src/hooks/useColorMode';

const TABS = [
  { key: 'feed', title: 'Feed' },
  { key: 'reviews', title: 'Reviews' },
  { key: 'ladders', title: 'Ladders' },
  { key: 'benchmarks', title: 'Benchmarks' },
  { key: 'tips', title: 'Tips & Tricks' },
  { key: 'replies', title: 'Replies' },
  { key: 'bookmarks', title: 'Bookmarks' },
];

const ProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        <ProfileCard userData={mock_user_card} />
        
        <Tabs
          value="feed"
          width="100%"
          bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
        >
          <TabsTabList
            borderBottomWidth={1}
            borderBottomColor={isDark ? '$borderDark800' : '$borderLight200'}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TABS.map((tab) => (
                <TabsTab key={tab.key} value={tab.key}>
                  <TabsTabTitle
                    fontSize="$xs"
                    color={isDark ? '$textDark400' : '$textLight500'}
                    $active={{
                      color: isDark ? '$textDark50' : '$textLight900',
                      fontWeight: '$bold',
                    }}
                  >
                    {tab.title}
                  </TabsTabTitle>
                </TabsTab>
              ))}
            </ScrollView>
          </TabsTabList>

          <TabsTabPanels>
            <TabsTabPanel value="feed">
              <PostsTab />
            </TabsTabPanel>
            <TabsTabPanel value="reviews">
              <PostsTab />
            </TabsTabPanel>
            <TabsTabPanel value="ladders">
              <LadderTab />
            </TabsTabPanel>
            <TabsTabPanel value="benchmarks">
              <PostsTab />
            </TabsTabPanel>
            <TabsTabPanel value="tips">
              <PostsTab />
            </TabsTabPanel>
            <TabsTabPanel value="replies">
              <PostsTab />
            </TabsTabPanel>
            <TabsTabPanel value="bookmarks">
              <PostsTab />
            </TabsTabPanel>
          </TabsTabPanels>
        </Tabs>
      </ScrollView>
    </Box>
  );
};

export default ProfileScreen;