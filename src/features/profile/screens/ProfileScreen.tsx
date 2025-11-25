import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, Text, Pressable, Image } from '@gluestack-ui/themed';
import { Feather } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import ProfileCard from '../components/ProfileCard';
import { ReviewsTab, LadderTab, RepliesTab, TipsTab, FeedTab, BenchmarksTab } from '../components/TabContents';
import { useColorMode } from '@/src/hooks/useColorMode';
import LadderDetail from '../components/LadderDetail';
import { Ladder } from '@/src/mock/profile/ladders/types';
import { useUserProfile } from '../api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useSafeAreaValues, useBottomTabBarHeightValue } from '@/src/utils';

const TABS = [
  { key: 'feed',        title: 'Feed' },
  { key: 'reviews',     title: 'Reviews' },
  { key: 'ladders',     title: 'Ladders' },
  { key: 'benchmarks',  title: 'Benchmarks' },
  { key: 'tips',        title: 'Tips & Tricks' },
  { key: 'replies',     title: 'Replies' }
];

const ProfileScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAppStore();
  const userId = user?.id;
  const safeAreaBottom = useSafeAreaValues('bottom');
  const tabBarHeight = useBottomTabBarHeightValue();
  
  // Profile API hook
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(userId);
  
  const [activeTab, setActiveTab] = useState('feed');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // BottomSheet state ve ref'leri
  const [selectedLadder, setSelectedLadder] = useState<Ladder | null>(null);
  const ladderBottomSheetRef = useRef<BottomSheet>(null);

  // Ladder seçildiğinde BottomSheet'i aç
  const handleLadderSelect = useCallback((ladder: Ladder) => {
    console.log('[ProfileScreen] ladder selected ->', ladder);
    setSelectedLadder(ladder);
  }, []);

  // selectedLadder değiştiğinde BottomSheet'i aç
  useEffect(() => {
    if (selectedLadder) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (ladderBottomSheetRef.current) {
            ladderBottomSheetRef.current.expand();
          } else {
            setTimeout(() => {
              if (ladderBottomSheetRef.current) {
                ladderBottomSheetRef.current.expand();
              }
            }, 100);
          }
        }, 50);
      });
    }
  }, [selectedLadder]);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('[ProfileScreen] sheet index ->', index);
    if (index === -1) {
      setSelectedLadder(null);
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    []
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return <FeedTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'ladders':
        return <LadderTab onLadderSelect={handleLadderSelect} />;
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



  const handleScroll = useCallback((event: any) => {
    const currentOffsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop((prev) => {
      if (currentOffsetY > 250 && !prev) {
        return true;
      }
      if (currentOffsetY <= 250 && prev) {
        return false;
      }
      return prev;
    });
  }, []);

  const handleScrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

        {/* Tab Bar */}
        <Box
          height={50}
          bg={isDark ? '#171717' : '#fff'}
          borderBottomWidth={1}
          borderBottomColor={isDark ? '#333' : '#eee'}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              alignItems: 'center',
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    position: 'relative',
                    minWidth: 'auto',
                  }}
                >
                  <Text
                    fontSize={11}
                    fontWeight={isActive ? '$semibold' : '$normal'}
                    color={isActive ? '#000000' : '#A3A3A3'}
                    textTransform="capitalize"
                  >
                    {tab.title}
                  </Text>
                  {isActive && (
                    <Box
                      position="absolute"
                      bottom={0}
                      left={0}
                      right={0}
                      height={2}
                      bg={isDark ? '#fff' : '#000'}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Box>

        {/* Tab Content */}
        <Box>
          {renderTabContent()}
        </Box>
      </ScrollView>

      {showScrollToTop && (
        <Pressable
          onPress={handleScrollToTop}
          style={{
            position: 'absolute',
            right: 20,
            bottom: safeAreaBottom + 8,
            zIndex: 1000,
            elevation: 5,
          }}  
        >
          <Box
            bg="#E8FF6B"
            borderRadius={30}
            w={56}
            h={56}
            justifyContent="center"
            alignItems="center"
            borderWidth={1}
            borderColor="#B2C742"
          >
            <Feather name="arrow-up" size={22} color="#000" />
          </Box>
        </Pressable>
      )}

      {/* Ladder BottomSheet */}
      <BottomSheet
        ref={ladderBottomSheetRef}
        index={-1}
        onChange={handleSheetChanges}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        enableDynamicSizing
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView
          style={{
            paddingBottom: Platform.OS === 'ios' ? safeAreaBottom : tabBarHeight,
          }}
        >
          {selectedLadder && (
            <LadderDetail
              ladderId={selectedLadder.id}
              onClose={() => {
                ladderBottomSheetRef.current?.close();
                setSelectedLadder(null);
              }}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
      </Box>
    </SafeAreaView>
  );
};

export default ProfileScreen;
