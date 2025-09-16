import React from 'react';
import { Box, Text, HStack, Pressable } from '@gluestack-ui/themed';
import { Tabs } from 'react-native-collapsible-tab-view';
import { ScrollView } from 'react-native';
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

  const renderHeader = () => {
    return <ProfileCard userData={mock_user_card} />;
  };

  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <Tabs.Container
        renderHeader={renderHeader}
        headerHeight={200}
        containerStyle={{
          backgroundColor: isDark ? '#171717' : '#FFFFFF',
        }}
        tabBarStyle={{
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#333' : '#eee',
          height: 48,
        }}
        renderTabBar={props => (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HStack space="xl" px="$4">
              {props.tabNames.map((name, i) => {
                const tab = TABS.find(t => t.key === name);
                if (!tab) return null;
                
                return (
                  <Pressable 
                    key={name}
                    onPress={() => {
                      if (props.onTabPress) {
                        props.onTabPress(i);
                      }
                    }}
                    py="$3"
                    px="$4"
                  >
                    <Text
                      size="sm"
                      color={props.activeIndex === i 
                        ? (isDark ? '$textDark50' : '$textLight900')
                        : (isDark ? '$textDark400' : '$textLight500')}
                      fontWeight={props.activeIndex === i ? '$bold' : '$normal'}
                    >
                      {tab.title}
                    </Text>
                  </Pressable>
                );
              })}
            </HStack>
          </ScrollView>
        )}
      >
        {TABS.map(tab => (
          <Tabs.Tab 
            name={tab.key} 
            key={tab.key}
          >
            <Tabs.ScrollView>
              {tab.key === 'ladders' ? <LadderTab /> : <PostsTab />}
            </Tabs.ScrollView>
          </Tabs.Tab>
        ))}
      </Tabs.Container>
    </Box>
  );
};

export default ProfileScreen;