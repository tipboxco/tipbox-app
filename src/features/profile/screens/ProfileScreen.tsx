import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, Image, HStack, VStack } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import ProfileCard from '../components/ProfileCard';
import { ReviewsTab, LadderTab, RepliesTab, TipsTab, FeedTab, BenchmarksTab } from '../components/TabContents';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserProfile } from '../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useSafeAreaValues } from '@/src/utils';

const TABS = [
  { key: 'feed',        title: 'Feed' },
  { key: 'reviews',     title: 'Reviews' },
  { key: 'benchmarks',  title: 'Benchmarks' },
  { key: 'tips',        title: 'Tips & Tricks' },
  { key: 'replies',     title: 'Questions' },
  { key: 'ladders',     title: 'Ladders' },
];

const ProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAppStore();
  const userId = user?.id;
  const safeAreaBottom = useSafeAreaValues('bottom');
  
  // Profile API hook
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(userId);
  
  const [activeTab, setActiveTab] = useState('feed');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'ladders':
        return <LadderTab />;
      case 'benchmarks':
        return <BenchmarksTab />;
      case 'tips':
        return <TipsTab />;
      case 'replies':
        return <RepliesTab />;
      default:
        return <FeedTab />;
    }
  };




  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Profile Card Content */}
        {isProfileLoading ? (
          <Box py={20} alignItems="center">
            <Text color={isDark ? '#fff' : '#000'}>Yükleniyor...</Text>
          </Box>
        ) : profileError ? (
          <Box py={20} alignItems="center">
            <Text color="#CE4A4A">Hata: {profileError.message}</Text>
          </Box>
        ) : userProfile ? (
          <Box>
            <ProfileCard userData={userProfile} userId={userProfile.id} />
          </Box>
        ) : null}

        {/* Tab Bar - Trust/Collections tasarımı + yatay scroll */}
        <VStack py={16} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <HStack
              px={16}
              space="md"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    alignItems="center"
                    justifyContent="center"
                    pb="$1"
                    position="relative"
                    width={75}
                  >
                    <Text
                      textAlign="center"
                      fontSize={12}
                      fontWeight="$bold"
                      color={isActive ? (isDark ? '#FFFFFF' : '#000000') : '#A3A3A3'}
                    >
                      {tab.title}
                    </Text>
                    <Box
                      position="absolute"
                      bottom={-1}
                      left="15%"
                      height={2}
                      width="70%"
                      borderRadius={999}
                      bg={isActive ? (isDark ? '#FFFFFF' : '#000000') : '#A3A3A3'}
                    />
                  </Pressable>
                );
              })}
            </HStack>
          </ScrollView>
        </VStack>

        {/* Tab Content */}
        <Box>
          {renderTabContent()}
        </Box>
      </ScrollView>
      </Box>
    </SafeAreaView>
  );
};

export default ProfileScreen;
