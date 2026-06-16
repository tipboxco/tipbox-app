import React, { useState, useCallback, useRef } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
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
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';

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

  // "+" → doğrudan post oluşturma ekranına git. Ürün/kategori bağlamı CreatePostScreen
  // içinde (medya ekleme gibi) opsiyonel olarak seçilir; burada bağlamı temizleyip taze başlatıyoruz.
  const handleCreatePress = useCallback(() => {
    useCreatePostFlowStore.getState().clearFlow();
    navigationService.navigate(ROOT_ROUTES.POST as any, {
      screen: 'CreatePostScreen',
    });
  }, []);

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
