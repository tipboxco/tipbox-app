import React, { useState, useCallback, useRef } from 'react';
import { ScrollView, View, Pressable, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/src/components/ui';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { FeedTabList } from '../components/FeedTabList';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { FeedFilterParams } from '../api/feedApi';
import { CreateButton } from '@/src/features/post/components/CreateButton';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';

type FeedScreenNavigationProp = NativeStackNavigationProp<FeedStackParamList & RootStackParamList, 'FeedScreen'>;

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const FEED_TABS: Array<{ key: string; labelKey: string; filters?: FeedFilterParams }> = [
  { key: 'trusting',   labelKey: 'tabs.trusting',   filters: { interests: ['MUTUAL_TRUST', 'TRUSTER'] } },
  { key: 'forYou',     labelKey: 'tabs.forYou',     filters: { interests: ['CATEGORY_MATCH', 'ENGAGEMENT_HIGH'] } },
  { key: 'tips',       labelKey: 'tabs.tips',       filters: { tags: ['Tips'] } },
  { key: 'questions',  labelKey: 'tabs.questions',  filters: { tags: ['Question'] } },
  { key: 'reviews',    labelKey: 'tabs.reviews',    filters: { tags: ['Review'] } },
  { key: 'benchmarks', labelKey: 'tabs.benchmarks', filters: { tags: ['Benchmark'] } },
  { key: 'updates',    labelKey: 'tabs.updates',    filters: { tags: ['Update'] } },
];

const FeedScreenInner: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<FeedScreenNavigationProp>();
  const { t } = useTranslation('feed');

  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const bottomOffset = useBottomOffset({ includeTabBar: true, extraPadding: 16 });

  const [currentPage, setCurrentPage] = useState(0);
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set([0]));

  const pagerRef = useRef<PagerView>(null);
  const tabScrollRef = useRef<ScrollView>(null);

  const handlePageSelected = useCallback((e: any) => {
    const page = e.nativeEvent.position;
    setCurrentPage(page);
    setVisitedTabs((prev) => new Set([...prev, page]));
  }, []);

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setVisitedTabs((prev) => new Set([...prev, index]));
    tabScrollRef.current?.scrollTo({ x: index * 80, animated: true });
  }, []);

  const handleProductPost = useCallback(() => {
    closeBottomSheet();
    navigation.navigate('ProductCatalog');
  }, [closeBottomSheet, navigation]);

  const handleSubcategoryPost = useCallback(() => {
    closeBottomSheet();
    navigation.navigate('ProductCatalog');
  }, [closeBottomSheet, navigation]);

  const handleCreatePress = useCallback(() => {
    const bg = isDark ? '#121212' : '#FDFDFB';
    const textColor = isDark ? '#F5F5F5' : '#000000';
    const subTextColor = isDark ? '#888888' : '#B9B9B9';
    const borderColor = isDark ? '#333333' : '#E2E2E2';
    const itemBg = isDark ? '#1A1A1A' : '#FFFFFF';

    openBottomSheet(
      <View style={{ backgroundColor: bg, width: '100%', paddingBottom: 16 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>Create Post</Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {/* Product Post */}
          <Pressable
            onPress={handleProductPost}
            style={{
              backgroundColor: itemBg,
              borderWidth: 1,
              borderColor,
              borderRadius: 10,
              paddingHorizontal: 13,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <View style={{ width: 24, height: 24, borderWidth: 1, borderColor: isDark ? '#444444' : '#E8E8E8', borderStyle: 'dashed', borderRadius: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: itemBg }}>
              <Image source={require('@/assets/add_post.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textColor, marginBottom: 3 }}>
                Product Post
              </Text>
              <Text style={{ fontSize: 10, color: subTextColor, lineHeight: 14 }}>
                Create an experience, question, tip, or benchmark post about the product itself.
              </Text>
            </View>
          </Pressable>

          {/* Subcategory & Product Group Post */}
          <Pressable
            onPress={handleSubcategoryPost}
            style={{
              backgroundColor: itemBg,
              borderWidth: 1,
              borderColor,
              borderRadius: 10,
              paddingHorizontal: 13,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <View style={{ width: 24, height: 24, borderWidth: 1, borderColor: isDark ? '#444444' : '#E8E8E8', borderStyle: 'dashed', borderRadius: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: itemBg }}>
              <Image source={require('@/assets/add_post.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: textColor, marginBottom: 3 }}>
                Subcategory & Product Group Post
              </Text>
              <Text style={{ fontSize: 10, color: subTextColor, lineHeight: 14 }}>
                Create a general, tip, or question post about a Subcategory or Product Group.
              </Text>
            </View>
          </Pressable>
        </View>
      </View>,
      {
        enableDynamicSizing: false,
        snapPoints: ['35%'],
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: false,
        paddingBottom: bottomOffset,
      }
    );
  }, [openBottomSheet, isDark, bottomOffset, handleProductPost, handleSubcategoryPost]);

  const backgroundColor = isDark ? '#000000' : '#FFFFFF';
  const tabBarBg = isDark ? '#000000' : '#FFFFFF';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor }}>
        <Header
          logo={require('@/assets/tipbox-nobg.png')}
          leftAction="menu"
          onSearchPress={() => navigation.navigate('Search')}
        />

        {/* Scrollable Tab Bar */}
        <View style={{ backgroundColor: tabBarBg, borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#E9E9E9' }}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            {FEED_TABS.map((tab, index) => {
              const isActive = currentPage === index;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabPress(index)}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? (isDark ? '#FFFFFF' : '#000000') : '#8C8C8C',
                    }}
                  >
                    {t(tab.labelKey)}
                  </Text>
                  {isActive && (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 16,
                        right: 16,
                        height: 2,
                        backgroundColor: isDark ? '#FFFFFF' : '#000000',
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* PagerView */}
        <AnimatedPagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          {FEED_TABS.map((tab, index) => (
            <View key={tab.key} style={{ flex: 1 }}>
              <FeedTabList
                tabKey={tab.key}
                filterParams={tab.filters}
                enabled={visitedTabs.has(index)}
                onCreatePress={handleCreatePress}
              />
            </View>
          ))}
        </AnimatedPagerView>

        <CreateButton onPress={handleCreatePress} />
      </View>
    </SafeAreaView>
  );
};

export const FeedScreen = React.memo(FeedScreenInner);
FeedScreen.displayName = 'FeedScreen';
