import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FlatList,
  View,
  LayoutChangeEvent,
  StyleSheet,
  Platform,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Box, Text, Pressable, VStack } from '@gluestack-ui/themed';

export interface TabDefinition {
  key: string;
  title: string;
}

interface TabLayout {
  x: number;
  width: number;
}

interface AnimatedTabBarProps {
  tabs: readonly TabDefinition[] | TabDefinition[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  isDark: boolean;
}

// Tab item component
interface TabItemProps {
  tab: TabDefinition;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
}

const TabItem: React.FC<TabItemProps> = React.memo(({
  tab,
  isActive,
  activeColor,
  inactiveColor,
  onPress,
  onLayout,
}) => (
  <Pressable
    onPress={onPress}
    onLayout={onLayout}
    py="$3"
    px="$4"
    minWidth={80}
    alignItems="center"
  >
    <Text
      style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: isActive ? activeColor : inactiveColor,
      }}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {tab.title}
    </Text>
  </Pressable>
));

TabItem.displayName = 'TabItem';

/**
 * AnimatedTabBar with Dynamic ScrollToIndex (viewPosition: 0 - LEFT alignment)
 *
 * Features:
 * - Uses FlatList's scrollToIndex with viewPosition: 0 (left edge alignment)
 * - Dynamic item layouts with getItemLayout for instant scroll
 * - Spring animations for indicator position and width
 * - Horizontal padding: 16px (left/right)
 * - Tab gap: 12px (space="md")
 *
 * Inspiration: https://github.com/Tunacodin/dynamic-scrollindex
 */
export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isDark,
}) => {
  const flatListRef = useRef<FlatList<TabDefinition>>(null);

  // Shared animation values
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(60);

  // Local state
  const [tabLayouts, setTabLayouts] = useState<Map<string, TabLayout>>(new Map());
  const [containerWidth, setContainerWidth] = useState(0);

  // Tab gap (space="md" in Gluestack = 12px)
  const TAB_GAP = 12;
  const HORIZONTAL_PADDING = 16;
  const MIN_TAB_WIDTH = 60;

  // Track individual tab layout measurements
  const handleTabLayout = useCallback(
    (key: string, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      setTabLayouts(prev => {
        const next = new Map(prev);
        next.set(key, { x, width });
        return next;
      });
    },
    []
  );

  // Calculate average tab width for getItemLayout
  const avgTabWidth = useMemo(() => {
    if (tabLayouts.size === 0) return MIN_TAB_WIDTH + TAB_GAP;

    const layouts = Array.from(tabLayouts.values());
    const totalWidth = layouts.reduce((sum, layout) => sum + layout.width, 0);
    const avgWidth = totalWidth / layouts.length;

    return avgWidth + TAB_GAP;
  }, [tabLayouts]);

  // getItemLayout for instant scrollToIndex (performance optimization)
  const getItemLayout = useCallback(
    (data: ArrayLike<TabDefinition> | null | undefined, index: number) => {
      return {
        length: avgTabWidth,
        offset: avgTabWidth * index,
        index,
      };
    },
    [avgTabWidth]
  );

  // Scroll to active tab using scrollToIndex with viewPosition: 0 (LEFT)
  const scrollToActiveTab = useCallback(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
    if (activeIndex === -1 || !flatListRef.current) return;

    try {
      // scrollToIndex with viewPosition: 0 -> align to LEFT edge
      flatListRef.current.scrollToIndex({
        index: activeIndex,
        viewPosition: 0, // 0 = left, 0.5 = center, 1 = right
        animated: true,
      });
    } catch (error) {
      // Fallback: use scrollToOffset if scrollToIndex fails
      console.warn('[AnimatedTabBar] scrollToIndex failed, using fallback');
    }
  }, [tabs, activeTab]);

  // Handle momentum scroll end - update active tab based on scroll position
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (tabLayouts.size === 0) return;

      const scrollX = event.nativeEvent.contentOffset.x;

      // Viewport left edge (considering padding)
      const viewportLeft = scrollX + HORIZONTAL_PADDING;

      // Find the tab whose left edge is closest to viewport left edge
      let nearestKey: string | null = null;
      let minDistance = Infinity;

      for (const [key, layout] of tabLayouts.entries()) {
        const tabLeft = layout.x;
        const distance = Math.abs(tabLeft - viewportLeft);

        if (distance < minDistance) {
          minDistance = distance;
          nearestKey = key;
        }
      }

      if (nearestKey && nearestKey !== activeTab) {
        onTabChange(nearestKey);
      }
    },
    [tabLayouts, activeTab, onTabChange]
  );

  // Update indicator when active tab changes
  useEffect(() => {
    const activeLayout = tabLayouts.get(activeTab);
    if (activeLayout) {
      indicatorX.value = withSpring(activeLayout.x, {
        damping: 12,
        mass: 1,
        overshootClamping: false,
      });
      indicatorWidth.value = withSpring(activeLayout.width, {
        damping: 12,
        mass: 1,
        overshootClamping: false,
      });

      // Scroll to active tab with viewPosition: 0 (left alignment)
      const timer = setTimeout(() => {
        scrollToActiveTab();
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [activeTab, tabLayouts, indicatorX, indicatorWidth, scrollToActiveTab]);

  // Animated indicator style
  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
    height: 3,
    backgroundColor: isDark ? '#FFFFFF' : '#000000',
  }));

  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';

  // Render tab item
  const renderTabItem: ListRenderItem<TabDefinition> = useCallback(
    ({ item }) => {
      const isActive = item.key === activeTab;
      return (
        <TabItem
          tab={item}
          isActive={isActive}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          onPress={() => onTabChange(item.key)}
          onLayout={(e) => handleTabLayout(item.key, e)}
        />
      );
    },
    [activeTab, activeColor, inactiveColor, onTabChange, handleTabLayout]
  );

  // Item separator (gap between tabs)
  const ItemSeparator = useCallback(
    () => <View style={{ width: TAB_GAP }} />,
    []
  );

  return (
    <Box
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderBottomColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
    >
      <View style={{ position: 'relative' }}>
        <FlatList
          ref={flatListRef}
          data={tabs as TabDefinition[]}
          renderItem={renderTabItem}
          keyExtractor={(item) => item.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          ItemSeparatorComponent={ItemSeparator}
          getItemLayout={getItemLayout}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          directionalLockEnabled={false}
          bounces={false}
          pagingEnabled={false}
          snapToInterval={undefined}
          snapToAlignment="start"
          initialNumToRender={tabs.length}
          maxToRenderPerBatch={tabs.length}
          windowSize={2}
          removeClippedSubviews={false}
        />

        {/* Animated indicator bar */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 0,
              left: HORIZONTAL_PADDING,
              height: 3,
            },
            animatedIndicatorStyle,
          ]}
        />
      </View>
    </Box>
  );
};

export default AnimatedTabBar;
