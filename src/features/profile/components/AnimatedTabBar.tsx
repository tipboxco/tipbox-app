import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  ScrollView,
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
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Shared animation values
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(60);
  
  // Local state
  const [tabLayouts, setTabLayouts] = useState<Map<string, TabLayout>>(new Map());
  const [scrollViewWidth, setScrollViewWidth] = useState(0);

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

  // Scroll to align active tab to LEFT edge (flex-start)
  const scrollToTabLeft = useCallback((tabKey: string) => {
    const layout = tabLayouts.get(tabKey);
    if (!layout || !scrollViewRef.current) return;

    // Calculate scroll position to align tab to LEFT edge
    // Subtract horizontal padding (16px) to account for contentContainerStyle padding
    const HORIZONTAL_PADDING = 16;
    const scrollPos = Math.max(0, layout.x - HORIZONTAL_PADDING);

    scrollViewRef.current.scrollTo({
      x: scrollPos,
      animated: true,
    });
  }, [tabLayouts]);

  // Handle momentum scroll end - snap to leftmost visible tab (flex-start)
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const HORIZONTAL_PADDING = 16;

      // Viewport left edge (considering padding)
      const viewportLeft = scrollX + HORIZONTAL_PADDING;

      // Find the leftmost tab that starts at or after viewport left edge
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

      // Scroll to align tab to left edge (flex-start)
      const timer = setTimeout(() => {
        scrollToTabLeft(activeTab);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [activeTab, tabLayouts, indicatorX, indicatorWidth, scrollToTabLeft]);

  // Animated indicator style
  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
    height: 3,
    backgroundColor: isDark ? '#FFFFFF' : '#000000',
  }));

  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';

  return (
    <Box
      bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}
      borderBottomWidth={StyleSheet.hairlineWidth}
      borderBottomColor={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        onLayout={(e) => setScrollViewWidth(e.nativeEvent.layout.width)}
        bounces={false}
      >
        <VStack position="relative">
          <HStack space="md" mb={0} position="relative">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => onTabChange(tab.key)}
                  onLayout={(e) => handleTabLayout(tab.key, e)}
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
                    {tab.title}
                  </Text>
                </Pressable>
              );
            })}
          </HStack>

          {/* Animated indicator bar */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
              },
              animatedIndicatorStyle,
            ]}
          />
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default AnimatedTabBar;
