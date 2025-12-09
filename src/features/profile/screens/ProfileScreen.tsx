import React, { useState, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { Box, Text, Pressable, HStack, VStack } from '@gluestack-ui/themed';
import { useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ProfileCard from '../components/ProfileCard';
import { ReviewsTab, LadderTab, RepliesTab, TipsTab, FeedTab, BenchmarksTab } from '../components/TabContents';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useUserProfile } from '../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { ProfileStackParamList } from '../navigation';

const TABS = [
  { key: 'feed',        title: 'Feed' },
  { key: 'reviews',     title: 'Reviews' },
  { key: 'benchmarks',  title: 'Benchmarks' },
  { key: 'tips',        title: 'Tips & Tricks' },
  { key: 'replies',     title: 'Questions' },
  { key: 'ladders',     title: 'Ladders' },
];

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'ProfileMain'>;

const ProfileScreen = ({ route }: ProfileScreenProps) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAppStore();
  
  // Route params'tan userId al, yoksa store'daki user.id'yi kullan
  const routeUserId = route.params?.userId;
  const targetUserId = routeUserId || user?.id;
  
  // Profile API hook - targetUserId ile profil bilgilerini getir
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(targetUserId);
  
  const [activeTab, setActiveTab] = useState('feed');

  // Tab content'i memoize et - sadece activeTab değiştiğinde yeniden render et
  const renderTabContent = useMemo(() => {
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
  }, [activeTab]);




  return (
    <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} style={{ margin: 0, padding: 0 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={{ flexGrow: 1 }}
        style={{ margin: 0, padding: 0 }}
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
            <ProfileCard userData={userProfile} userId={targetUserId} />
          ) : null}

          {/* Tab Bar - Trust/Collections tasarımı + yatay scroll */}
          <VStack py={16} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
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
                      minWidth={75}
                      flexShrink={0}
                    >
                      <Text
                        textAlign="center"
                        fontSize={12}
                        fontWeight="$bold"
                        color={isActive ? (isDark ? '#FFFFFF' : '#000000') : '#A3A3A3'}
                        numberOfLines={1}
                        flexShrink={0}
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
          <Box minHeight={400}>
            {renderTabContent}
          </Box>
        </ScrollView>
    </Box>
  );
};

export default ProfileScreen;
