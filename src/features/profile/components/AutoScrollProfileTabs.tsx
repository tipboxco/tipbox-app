import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  SectionList,
  SectionListData,
  SectionListRenderItem,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';

/**
 * Generic section list with a header bar that behaves like a tab strip.
 *
 * - tabs are built from the provided sections array
 * - when the user scrolls through the list the active tab is updated
 *   automatically based on the first visible item/section
 * - tapping a tab scrolls the list to the corresponding section
 *
 * This is very similar to the small demo in
 * https://github.com/gulsher7/auto-scroll-header-sectionList-react-native
 * but written without an external dependency so we can easily adapt it to
 * Tipbox's styling and data-fetching model.
 */

export interface AutoScrollProfileTabsSection<T> {
  key: string;           // unique id for the section, used for lookups
  title: string;         // shown in the tab bar
  data: T[];             // list of items in this section
}

interface Props<T> {
  sections: AutoScrollProfileTabsSection<T>[];
  renderItem: SectionListRenderItem<T>;
  renderSectionHeader?: SectionListRenderItem<T>;

  /**
   * called when the end of a section is reached; the section index is
   * provided so the parent can call the correct `fetchNextPage` or
   * similar. this makes the component agnostic of how the data is
   * obtained.
   */
  onEndReached?: (sectionIndex: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;

  /**
   * optional flag to disable the built‑in tab bar if the caller wants to
   * render its own; the scroll‑synchronisation behaviour will still work.
   */
  hideTabBar?: boolean;

  /**
   * notify the parent when the active section changes (either by scroll
   * or tab press). receives the section key and its index.
   */
  onSectionChange?: (key: string, index: number) => void;
}

function AutoScrollProfileTabs<T>(props: Props<T>) {
  const {
    sections,
    renderItem,
    renderSectionHeader,
    onEndReached,
    onRefresh,
    refreshing,
    hideTabBar,
  } = props;

  const listRef = useRef<SectionList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToSection = useCallback(
    (index: number) => {
      listRef.current?.scrollToLocation({
        sectionIndex: index,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
      });
    },
    []
  );

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    []
  );

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      const first = viewableItems[0];
      const sectionKey = first.section?.key;
      const idx = sections.findIndex(s => s.key === sectionKey);
      if (idx >= 0 && idx !== activeIndex) {
        setActiveIndex(idx);
        if (props.onSectionChange) {
          props.onSectionChange(sectionKey ?? '', idx);
        }
      }
    }
  ).current;

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {sections.map((sec, idx) => {
        const selected = idx === activeIndex;
        return (
          <TouchableOpacity
            key={sec.key}
            style={[styles.tabButton, selected && styles.tabButtonActive]}
            onPress={() => scrollToSection(idx)}
          >
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>
              {sec.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <>
      {!hideTabBar && renderTabBar()}
      <SectionList
        ref={listRef}
        sections={sections as any}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader ? (info) => renderSectionHeader(info as any) : undefined}
        keyExtractor={(_, index) => index.toString()}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={({ distanceFromEnd }) => {
          if (distanceFromEnd < 0) return;
          if (onEndReached) {
            onEndReached(activeIndex);
          }
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        stickySectionHeadersEnabled={false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E9E9E9',
    backgroundColor: 'white',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderColor: 'black',
  },
  tabText: {
    fontSize: 12,
    color: '#A3A3A3',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
  },
});

export default AutoScrollProfileTabs;
