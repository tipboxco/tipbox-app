import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FlatList,
  View,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Box, Text, Pressable, HStack, VStack } from '@gluestack-ui/themed';

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
  scrollPosition?: Animated.SharedValue<number>;
}

/**
 * AnimatedTabBar with LEFT-ALIGNED (flex-start) Dynamic Snap-to-Interval
 *
 * Features:
 * - Active tab always snaps to LEFT edge of viewport (flex-start behavior)
 * - Dynamic snap interval based on actual tab widths
 * - Smooth momentum scroll with automatic snap to leftmost visible tab
 * - Spring animations for indicator and position changes
 * - Horizontal padding: 16px (left/right)
 *
 * Reference: https://www.animatereactnative.com/post/dynamic-snap-to-interval-%2B-dyanmic-widths
 */
export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isDark,
  scrollPosition,
}) => {
  const flatListRef = useRef<FlatList>(null);

  // Shared animation values
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(60);

  // Local state
  const [tabLayouts, setTabLayouts] = useState<Map<string, TabLayout>>(new Map());
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

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

  // Calculate dynamic snap interval from actual tab dimensions
  const snapInterval = useMemo(() => {
    if (tabLayouts.size === 0) return 100;
    
    let totalWidth = 0;
    let totalGaps = 0;
    const layouts = Array.from(tabLayouts.values());
    
    for (let i = 0; i < layouts.length; i++) {
      totalWidth += layouts[i].width;
      if (i < layouts.length - 1) {
        // Gap between tabs (HStack space="md" = 12px in Gluestack)
        totalGaps += layouts[i + 1].x - (layouts[i].x + layouts[i].width);
      }
    }
    
    const avgWidth = totalWidth / layouts.length;
    const avgGap = layouts.length > 1 ? totalGaps / (layouts.length - 1) : 0;
    
    return Math.round(avgWidth + avgGap);
  }, [tabLayouts]);

  // Scroll to align active tab to CENTER (better visibility)
  const scrollToTabLeft = useCallback((tabKey: string) => {
    const layout = tabLayouts.get(tabKey);
    if (!layout || !scrollViewRef.current || !scrollViewWidth) {
      console.log('[AnimatedTabBar] ❌ Cannot scroll - missing data:', {
        hasLayout: !!layout,
        hasScrollRef: !!scrollViewRef.current,
        scrollViewWidth,
        tabKey,
      });
      return;
    }

    // Calculate scroll position to center the tab in viewport
    const HORIZONTAL_PADDING = 16;
    const tabCenter = layout.x + (layout.width / 2);
    const viewportCenter = scrollViewWidth / 2;

    // Scroll to center the tab, accounting for padding
    const scrollPos = Math.max(0, tabCenter - viewportCenter);

    console.log('[AnimatedTabBar] 📍 Scrolling to center tab:', {
      tabKey,
      tabCenter,
      viewportCenter,
      scrollPos,
      layoutX: layout.x,
      layoutWidth: layout.width,
    });

    scrollViewRef.current.scrollTo({
      x: scrollPos,
      animated: true,
    });
  }, [tabLayouts, scrollViewWidth]);

  // Handle scroll - track position
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      setScrollX(scrollX);
    },
    []
  );

  // Handle momentum scroll end - snap to nearest centered tab
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;

      // Viewport center
      const viewportCenter = scrollX + (scrollViewWidth / 2);

      // Find the tab closest to viewport center
      let nearestKey: string | null = null;
      let minDistance = Infinity;

      for (const [key, layout] of tabLayouts.entries()) {
        const tabCenter = layout.x + (layout.width / 2);
        const distance = Math.abs(tabCenter - viewportCenter);

        if (distance < minDistance) {
          minDistance = distance;
          nearestKey = key;
        }
      }

      console.log('[AnimatedTabBar] 🔚 Scroll ended:', {
        scrollX,
        viewportCenter,
        nearestKey,
        minDistance,
        willChange: nearestKey !== activeTab,
      });

      if (nearestKey && nearestKey !== activeTab) {
        onTabChange(nearestKey);
      }
    },
    [tabLayouts, activeTab, onTabChange, scrollViewWidth]
  );

  // ANIMATION FIX: Update indicator when active tab changes OR when scroll position changes (realtime)
  useEffect(() => {
    const activeLayout = tabLayouts.get(activeTab);
    if (activeLayout && !scrollPosition) {
      // Fallback: No scrollPosition prop, use spring animation
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
    }
  }, [activeTab, tabLayouts, indicatorX, indicatorWidth, scrollPosition]);

  // ANIMATION FIX: Animated indicator style - interpolate based on scroll position
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    if (!scrollPosition || tabLayouts.size === 0) {
      // Fallback: Use static position
      return {
        transform: [{ translateX: indicatorX.value }],
        width: indicatorWidth.value,
        height: 3,
        backgroundColor: isDark ? '#FFFFFF' : '#000000',
      };
    }

    // Realtime animation: Interpolate between tab positions based on scroll
    const currentIndex = Math.floor(scrollPosition.value);
    const nextIndex = Math.ceil(scrollPosition.value);

    const currentTab = tabs[currentIndex];
    const nextTab = tabs[nextIndex];

    if (!currentTab || !nextTab) {
      return {
        transform: [{ translateX: indicatorX.value }],
        width: indicatorWidth.value,
        height: 3,
        backgroundColor: isDark ? '#FFFFFF' : '#000000',
      };
    }

    const currentLayout = tabLayouts.get(currentTab.key);
    const nextLayout = tabLayouts.get(nextTab.key);

    if (!currentLayout || !nextLayout) {
      return {
        transform: [{ translateX: indicatorX.value }],
        width: indicatorWidth.value,
        height: 3,
        backgroundColor: isDark ? '#FFFFFF' : '#000000',
      };
    }

    // Interpolate X position and width
    const progress = scrollPosition.value - currentIndex;
    const x = interpolate(
      progress,
      [0, 1],
      [currentLayout.x, nextLayout.x],
      Extrapolate.CLAMP
    );
    const width = interpolate(
      progress,
      [0, 1],
      [currentLayout.width, nextLayout.width],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX: x }],
      width,
      height: 3,
      backgroundColor: isDark ? '#FFFFFF' : '#000000',
    };
  }, [scrollPosition, tabLayouts, tabs, isDark, indicatorX, indicatorWidth]);

  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';

  // Check if there's more content to scroll
  const hasMoreRight = contentWidth > scrollViewWidth && scrollX < (contentWidth - scrollViewWidth - 10);
  const hasMoreLeft = scrollX > 10;

  return (
    <View
      style={{
        backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        position: 'relative',
      }}
    >
      <FlatList
        ref={flatListRef}
        data={tabs}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onLayout={(e) => setScrollViewWidth(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentWidth(w)}
        renderItem={({ item }) => {
          const isActive = item.key === activeTab;
          return (
            <Pressable
              key={item.key}
              onPress={() => onTabChange(item.key)}
              onLayout={(e) => handleTabLayout(item.key, e)}
              py="$3"
              px="$2"
              minWidth={60}
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
                {item.title}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Left fade indicator - shows there's more content to the left */}
      {hasMoreLeft && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 40,
            pointerEvents: 'none',
          }}
        >
          {/* Gradient simulation using multiple layers */}
          {[0.9, 0.7, 0.5, 0.3, 0.1].map((opacity, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: index * 8,
                top: 0,
                bottom: 0,
                width: 8,
                backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                opacity,
              }}
            />
          ))}
        </View>
      )}

      {/* Right fade indicator - shows there's more content to the right */}
      {hasMoreRight && (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 40,
            pointerEvents: 'none',
          }}
        >
          {/* Gradient simulation using multiple layers */}
          {[0.9, 0.7, 0.5, 0.3, 0.1].map((opacity, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                right: index * 8,
                top: 0,
                bottom: 0,
                width: 8,
                backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
                opacity,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default AnimatedTabBar;
