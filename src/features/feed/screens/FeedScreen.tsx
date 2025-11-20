import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { Box, HStack, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { FilterBar } from '../components/FilterBar';
import { AssetAccessCard } from '../components/AssetAccessCard';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ExpertButton } from '@/src/components/FloatingActionButton';
import ExpertBottomSheet from '@/src/components/ExpertBottomSheet';
import { SearchModal } from '@/src/components/SearchModal';
import { mock_feed_data } from '@/src/mock/feed';
import { FeedItem } from '@/src/mock/feed/types';
import PostCard from '@/src/components/PostCards/PostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';



type FeedScreenNavigationProp = NativeStackNavigationProp<FeedStackParamList & RootStackParamList, 'FeedScreen'>;

export const FeedScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'wallet' | 'inventory'>('wallet');

  // Safe area and tab bar insets
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  // Bottom sheet refs
  const expertBottomSheetRef = useRef<BottomSheet>(null);

  // Bottom sheet snap points



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
      case 'update':
        return (
          <UpdatePostCard
            key={item.id}
            data={item}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box
        flex={1}
        bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      >
        <Header
          title="Akış"
          leftAction="menu"
          onSearchPress={handleSearchPress}
        />
        <AssetAccessCard onTabChange={handleTabChange} />
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
          <BottomSheetView style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : tabBarHeight }}>
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
    </SafeAreaView>
  );
};