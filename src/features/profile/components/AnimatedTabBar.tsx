import React, { useState, useCallback, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
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
  useAnimatedReaction,
  runOnJS,
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

export interface AnimatedTabBarRef {
  scrollToTab: (tabKey: string) => void;
}

/**
 * AnimatedTabBar with PagerView sync support
 *
 * Features:
 * - Horizontal swipe between tabs
 * - Snap to tab positions
 * - Sync with PagerView
 * - Spring animations for indicator
 */
export const AnimatedTabBar = forwardRef<AnimatedTabBarRef, AnimatedTabBarProps>(({
  tabs,
  activeTab,
  onTabChange,
  isDark,
  scrollPosition,
}, ref) => {
  const flatListRef = useRef<FlatList>(null);

  // Shared animation values
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(60);

  // Local state
  const [tabLayouts, setTabLayouts] = useState<Map<string, TabLayout>>(new Map());
  const [tabWidths, setTabWidths] = useState<Map<string, number>>(new Map());
  const [scrollViewWidth, setScrollViewWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  // Refs to avoid dependency issues in useAnimatedReaction
  const tabLayoutsRef = useRef(tabLayouts);
  const scrollViewWidthRef = useRef(scrollViewWidth);
  const tabsRef = useRef(tabs);

  // Keep refs up to date
  useEffect(() => {
    tabLayoutsRef.current = tabLayouts;
  }, [tabLayouts]);

  useEffect(() => {
    scrollViewWidthRef.current = scrollViewWidth;
  }, [scrollViewWidth]);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  // Track individual tab width measurements (onLayout sadece width için)
  const handleTabLayout = useCallback(
    (key: string, event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      setTabWidths(prev => {
        const next = new Map(prev);
        next.set(key, width);
        return next;
      });
    },
    []
  );

  // Width'ler ölçüldükten sonra accumulated X pozisyonlarını hesapla
  useEffect(() => {
    // Tüm tab'ların width'i ölçülene kadar bekle
    if (tabWidths.size !== tabs.length || tabs.length === 0) return;

    const layouts = new Map<string, TabLayout>();
    let accumulatedX = 16; // FlatList paddingHorizontal başlangıcı

    tabs.forEach((tab) => {
      const width = tabWidths.get(tab.key) || 60;
      layouts.set(tab.key, { x: accumulatedX, width });
      accumulatedX += width; // Bir sonraki tab'ın X pozisyonu
    });

    setTabLayouts(layouts);
  }, [tabWidths, tabs]);

  // Calculate snap offsets for each tab
  const snapToOffsets = useMemo(() => {
    if (tabLayouts.size === 0 || tabLayouts.size !== tabs.length) return undefined;

    // Tab order'a göre X pozisyonlarını al (zaten accumulated order'da)
    const offsets = tabs
      .map(tab => tabLayouts.get(tab.key)?.x)
      .filter((x): x is number => x !== undefined);

    if (offsets.length !== tabs.length) return undefined;

    return offsets;
  }, [tabLayouts, tabs]);

  // Scroll to align active tab to CENTER (better visibility)
  const scrollToTabLeft = useCallback((tabKey: string) => {
    const layout = tabLayouts.get(tabKey);
    if (!layout || !flatListRef.current || !scrollViewWidth) {
      return;
    }

    // Calculate scroll position to center the tab in viewport
    const tabCenter = layout.x + (layout.width / 2);
    const viewportCenter = scrollViewWidth / 2;

    // Scroll to center the tab
    const scrollPos = Math.max(0, tabCenter - viewportCenter);

    // FlatList uses scrollToOffset instead of scrollTo
    flatListRef.current.scrollToOffset({
      offset: scrollPos,
      animated: true,
    });
  }, [tabLayouts, scrollViewWidth]);

  // Expose scrollToTab method via ref
  useImperativeHandle(ref, () => ({
    scrollToTab: (tabKey: string) => {
      scrollToTabLeft(tabKey);
    },
  }), [scrollToTabLeft]);

  // Helper: İki tab arasında interpolate ederek scroll yap (Ref kullanarak dependency sorununu çözdük)
  const scrollToPosition = useCallback((scrollPos: number) => {
    if (!flatListRef.current || scrollPos < 0) return;

    const currentViewportWidth = scrollViewWidthRef.current;
    const layouts = tabLayoutsRef.current;
    const currentTabs = tabsRef.current;

    if (layouts.size === 0 || !currentViewportWidth || currentTabs.length === 0) return;

    const currentIndex = Math.floor(scrollPos);
    const nextIndex = Math.min(Math.ceil(scrollPos), currentTabs.length - 1);
    const progress = scrollPos - currentIndex;

    const currentTabKey = currentTabs[currentIndex]?.key;
    const nextTabKey = currentTabs[nextIndex]?.key;

    if (!currentTabKey || !nextTabKey) return;

    const currentLayout = layouts.get(currentTabKey);
    const nextLayout = layouts.get(nextTabKey);

    if (!currentLayout || !nextLayout) return;

    // Current tab'ın center pozisyonu
    const currentTabCenter = currentLayout.x + (currentLayout.width / 2);
    // Next tab'ın center pozisyonu
    const nextTabCenter = nextLayout.x + (nextLayout.width / 2);

    // Interpolate between current and next
    const interpolatedCenter = currentTabCenter + (nextTabCenter - currentTabCenter) * progress;

    // Viewport center
    const viewportCenter = currentViewportWidth / 2;

    // Scroll position
    const finalScrollPos = Math.max(0, interpolatedCenter - viewportCenter);

    // Smooth scroll (animated: false for realtime)
    flatListRef.current.scrollToOffset({
      offset: finalScrollPos,
      animated: false,
    });
  }, []);

  // REALTIME SCROLL: PagerView scroll progress'e göre tab bar'ı da scroll et
  useAnimatedReaction(
    () => {
      if (!scrollPosition) return -1;
      return scrollPosition.value;
    },
    (currentScrollPos) => {
      if (currentScrollPos < 0) return;
      runOnJS(scrollToPosition)(currentScrollPos);
    },
    [scrollPosition]
  );

  // Handle scroll - sadece position tracking için (fade indicator için)
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      setScrollX(scrollX);
    },
    []
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
        horizontal={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
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
});

AnimatedTabBar.displayName = 'AnimatedTabBar';

export default AnimatedTabBar;
