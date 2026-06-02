import React, { useState, useCallback, useRef } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/src/components/ui';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../navigation';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { SearchModal } from '@/src/components/SearchModal';
import { AssetAccessCard } from '../components/AssetAccessCard';
import { FeedTabList } from '../components/FeedTabList';
import { useAppStore } from '@/src/store/appStore';
import { useNotificationStore } from '@/src/store/notificationStore';
import { useTranslation } from '@/src/hooks/useTranslation';
import type { FeedFilterParams } from '../api/feedApi';

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
  const { user } = useAppStore();
  const { t } = useTranslation('feed');
  const unreadCount = useNotificationStore((s) => s.unreadCountCache ?? 0);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set([0]));

  const pagerRef = useRef<PagerView>(null);
  const tabScrollRef = useRef<ScrollView>(null);

  const handleNotificationBellPress = useCallback(() => {
    (navigation as any).navigate('NotificationStack');
  }, [navigation]);

  const handleTabChange = useCallback((tab: 'wallet' | 'inventory') => {
    if (tab === 'wallet') {
      navigation.navigate('WalletScreen');
    } else if (tab === 'inventory' && user?.id) {
      (navigation as any).navigate('Profile', {
        screen: 'InventoryList',
        params: { userId: user.id },
      });
    }
  }, [navigation, user?.id]);

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

  const backgroundColor = isDark ? '#000000' : '#F5F5F5';
  const tabBarBg = isDark ? '#000000' : '#FFFFFF';

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor }}>
        <Header
          logo={require('@/assets/tipbox-nobg.png')}
          leftAction="menu"
          onSearchPress={() => setIsSearchVisible(true)}
          showNotificationBell
          onNotificationBellPress={handleNotificationBellPress}
          notificationBadgeCount={unreadCount}
        />

        <View style={{ flexShrink: 0 }}>
          <AssetAccessCard onTabChange={handleTabChange} />
        </View>

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
              />
            </View>
          ))}
        </AnimatedPagerView>

        <SearchModal
          visible={isSearchVisible}
          onClose={() => setIsSearchVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export const FeedScreen = React.memo(FeedScreenInner);
FeedScreen.displayName = 'FeedScreen';
