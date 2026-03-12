import React, { useCallback, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  FlatList,
  View,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  Pressable,
} from 'react-native';

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
  initialTab?: string;
  onTabChange: (tabKey: string) => void;
  isDark: boolean;
}

export interface AnimatedTabBarRef {
  scrollToTab: (tabKey: string) => void;
  setActiveTab: (tabKey: string) => void;
}

export const AnimatedTabBar = forwardRef<AnimatedTabBarRef, AnimatedTabBarProps>(({
  tabs,
  initialTab,
  onTabChange,
  isDark,
}, ref) => {
  const flatListRef = useRef<FlatList>(null);

  // Internal active tab state - parent re-render olmadan güncellenebilir
  const [activeTab, setActiveTabInternal] = useState(initialTab || tabs[0]?.key || '');

  const [tabLayouts, setTabLayouts] = useState<Map<string, TabLayout>>(new Map());
  const [tabWidths, setTabWidths] = useState<Map<string, number>>(new Map());
  const [scrollViewWidth, setScrollViewWidth] = useState(0);

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

  useEffect(() => {
    if (tabWidths.size !== tabs.length || tabs.length === 0) return;

    const layouts = new Map<string, TabLayout>();
    let accumulatedX = 16;

    tabs.forEach((tab) => {
      const width = tabWidths.get(tab.key) || 60;
      layouts.set(tab.key, { x: accumulatedX, width });
      accumulatedX += width;
    });

    setTabLayouts(layouts);
  }, [tabWidths, tabs]);

  const scrollToTabCenter = useCallback((tabKey: string) => {
    const layout = tabLayouts.get(tabKey);
    if (!layout || !flatListRef.current || !scrollViewWidth) return;

    const tabCenter = layout.x + (layout.width / 2);
    const viewportCenter = scrollViewWidth / 2;
    const scrollPos = Math.max(0, tabCenter - viewportCenter);

    flatListRef.current.scrollToOffset({
      offset: scrollPos,
      animated: true,
    });
  }, [tabLayouts, scrollViewWidth]);

  // Ref üzerinden erişilebilir methodlar
  useImperativeHandle(ref, () => ({
    scrollToTab: (tabKey: string) => {
      scrollToTabCenter(tabKey);
    },
    setActiveTab: (tabKey: string) => {
      setActiveTabInternal(tabKey);
      scrollToTabCenter(tabKey);
    },
  }), [scrollToTabCenter]);

  const activeColor = isDark ? '#FFFFFF' : '#000000';
  const inactiveColor = '#A3A3A3';

  return (
    <View
      style={{
        backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
      }}
    >
      <FlatList
        ref={flatListRef}
        data={tabs}
        extraData={activeTab}
        horizontal
        scrollEnabled
        nestedScrollEnabled
        directionalLockEnabled
        alwaysBounceVertical={false}
        alwaysBounceHorizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        scrollEventThrottle={16}
        onLayout={(e) => setScrollViewWidth(e.nativeEvent.layout.width)}
        renderItem={({ item }) => {
          const isActive = item.key === activeTab;
          return (
            <Pressable
              onPress={() => {
                setActiveTabInternal(item.key);
                scrollToTabCenter(item.key);
                onTabChange(item.key);
              }}
              onLayout={(e) => handleTabLayout(item.key, e)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 8,
                minWidth: 60,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: isActive ? activeColor : inactiveColor,
                }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
});

AnimatedTabBar.displayName = 'AnimatedTabBar';

export default AnimatedTabBar;
