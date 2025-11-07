import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Box, HStack, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { FilterBar } from '../components/FilterBar';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SideMenu } from '@/src/components/SideMenu';
import { ExpertButton } from '@/src/components/FloatingActionButton';
import ExpertBottomSheet from '@/src/components/ExpertBottomSheet';
import { SearchModal } from '@/src/components/SearchModal';
import { mock_user_profile } from '@/src/mock/common';
import { mock_feed_data } from '@/src/mock/feed';
import { FeedItem } from '@/src/mock/feed/types';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';



type FeedScreenNavigationProp = NativeStackNavigationProp<FeedStackParamList & RootStackParamList, 'FeedScreen'>;

export const FeedScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'inventory'>('wallet');

  // Bottom sheet refs
  const expertBottomSheetRef = useRef<BottomSheet>(null);

  // Bottom sheet snap points
  const expertSnapPoints = useMemo(() => ['83%'], []);


  const handleTabChange = (tab: 'wallet' | 'inventory') => {
    setActiveTab(tab);
    console.log('Selected tab:', tab);
  };

  const handleSearchPress = () => {
    setIsSearchVisible(true);
  };

  const handleSearchClose = () => {
    setIsSearchVisible(false);
  };

  const handleExpertPress = () => {
    console.log('[FeedScreen] Expert button pressed');
    if (expertBottomSheetRef.current) {
      expertBottomSheetRef.current.snapToIndex(0);
    } else {
      console.log('[FeedScreen] Expert BottomSheet ref is null, trying again...');
      setTimeout(() => {
        if (expertBottomSheetRef.current) {
          expertBottomSheetRef.current.snapToIndex(0);
        } else {
          console.log('[FeedScreen] Expert BottomSheet ref still null after timeout');
        }
      }, 100);
    }
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

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
        onSearchPress={handleSearchPress}
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

      {/* Search Modal */}
      <SearchModal
        visible={isSearchVisible}
        onClose={handleSearchClose}
      />

      {/* Expert Button */}
      <ExpertButton
        onPress={handleExpertPress}
      />

      {/* Expert Bottom Sheet */}
      <BottomSheet
        ref={expertBottomSheetRef}
        index={-1}
        snapPoints={expertSnapPoints}
        enablePanDownToClose
        enableOverDrag={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        animateOnMount={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleStyle={{
          backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#333333' : '#CCCCCC',
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView>
          {/* Header */}
          <VStack space="md" pb={'$3'} mb={'$4'} borderBottomWidth={1} borderBottomColor="#D9D9D9">
            <HStack justifyContent="center" alignItems="center">
              <Text
                fontSize={16}
                fontWeight="$bold"
                color={isDark ? '#FFFFFF' : '#000000'}
                textAlign="center"
              >
                Expert Now
              </Text>
            </HStack>
          </VStack>
          <ExpertBottomSheet
            onClose={() => expertBottomSheetRef.current?.close()}
          />
        </BottomSheetView>
      </BottomSheet>
    </Box>
  );
};