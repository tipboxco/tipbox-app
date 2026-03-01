import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  SectionList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewToken,
} from 'react-native';
import { Box, VStack } from '@gluestack-ui/themed';
import { FeedSkeleton } from '@/src/components/Skeletons';

export interface PostSection {
  title: string;
  key: string;
  data: Array<{ id: string; type: string; [key: string]: any }>;
  postCount: number;
}

interface DynamicPostFeedProps {
  sections: PostSection[];
  isLoading: boolean;
  isDark: boolean;
  onSectionChange?: (sectionKey: string) => void;
  renderItem: (item: any) => React.ReactElement;
  renderSectionHeader?: (section: PostSection) => React.ReactElement;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
}

/**
 * DynamicPostFeed - Flat feed with auto-scrolling sections
 * 
 * Combines multiple post types (feed, questions, benchmarks, tips, experiences)
 * into a single scrollable view with automatic section tracking.
 * 
 * Features:
 * - SectionList-like structure flattened into FlatList for better performance
 * - Auto-detected section based on scroll position
 * - Smooth scrolling with section tracking
 * - Optional section header rendering
 * 
 * Usage:
 * ```tsx
 * <DynamicPostFeed
 *   sections={[
 *     { title: 'Feed', key: 'feed', data: feedPosts, postCount: 5 },
 *     { title: 'Benchmarks', key: 'benchmarks', data: benchmarkPosts, postCount: 3 },
 *   ]}
 *   isLoading={isLoading}
 *   isDark={isDark}
 *   onSectionChange={handleSectionChange}
 *   renderItem={renderPost}
 * />
 * ```
 */
export const DynamicPostFeed: React.FC<DynamicPostFeedProps> = ({
  sections,
  isLoading,
  isDark,
  onSectionChange,
  renderItem,
  renderSectionHeader,
  onLoadMore,
  hasMore = false,
  isFetchingMore = false,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentSectionKey, setCurrentSectionKey] = useState<string>(
    sections[0]?.key ?? 'feed'
  );
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([]);

  // Flatten sections into a single data array with section metadata
  const flattenedData = useMemo(() => {
    const result: Array<{
      id: string;
      type: 'section-header' | 'post';
      sectionKey?: string;
      sectionTitle?: string;
      postData?: any;
      postCount?: number;
    }> = [];

    for (const section of sections) {
      // Add section header
      if (section.data.length > 0 && renderSectionHeader) {
        result.push({
          id: `section-${section.key}`,
          type: 'section-header',
          sectionKey: section.key,
          sectionTitle: section.title,
          postCount: section.postCount,
        });
      }

      // Add posts from this section
      for (const post of section.data) {
        result.push({
          id: post.id,
          type: 'post',
          sectionKey: section.key,
          postData: post,
        });
      }
    }

    return result;
  }, [sections, renderSectionHeader]);

  // Track viewable items to determine current section
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems: vItems }: { viewableItems: ViewToken[] }) => {
      setViewableItems(vItems);

      // Find the first section header in viewable items
      const firstSectionHeader = vItems.find(
        (vItem) => (vItem.item as any).type === 'section-header'
      );

      if (firstSectionHeader) {
        const sectionKey = (firstSectionHeader.item as any).sectionKey;
        if (sectionKey !== currentSectionKey) {
          setCurrentSectionKey(sectionKey);
          onSectionChange?.(sectionKey);
        }
      }
    },
    [currentSectionKey, onSectionChange]
  );

  const viewConfigRef = useRef({
    minimumViewTime: 250,
    viewAreaCoveragePercentThreshold: 50,
  });

  // Handle scroll to section
  const scrollToSection = useCallback(
    (sectionKey: string) => {
      const itemIndex = flattenedData.findIndex(
        (item) =>
          (item as any).type === 'section-header' &&
          (item as any).sectionKey === sectionKey
      );

      if (itemIndex >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: itemIndex,
          animated: true,
          viewPosition: 0,
        });
      }
    },
    [flattenedData]
  );

  // Expose scroll function via ref
  useEffect(() => {
    if ((flatListRef.current as any)?.scrollToSection) {
      (flatListRef.current as any).scrollToSection = scrollToSection;
    }
  }, [scrollToSection]);

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (!isFetchingMore && !hasMore) return null;

    return (
      <Box py={16} alignItems="center">
        {isFetchingMore && <FeedSkeleton count={1} />}
      </Box>
    );
  }, [isFetchingMore, hasMore]);

  // Render loading state
  if (isLoading && flattenedData.length === 0) {
    return (
      <Box py={20}>
        <FeedSkeleton count={3} />
      </Box>
    );
  }

  // Render empty state
  if (!isLoading && flattenedData.length === 0) {
    return (
      <Box py={32} alignItems="center">
        {/* Empty state content would go here */}
      </Box>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={flattenedData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        if ((item as any).type === 'section-header' && renderSectionHeader) {
          return renderSectionHeader({
            title: (item as any).sectionTitle,
            key: (item as any).sectionKey,
            data: [],
            postCount: (item as any).postCount,
          });
        }

        if ((item as any).type === 'post') {
          return renderItem((item as any).postData);
        }

        return null;
      }}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewConfigRef.current}
      scrollEventThrottle={16}
      ListFooterComponent={renderFooter}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
    />
  );
};

// Export helper function to create sections
export const createPostSection = (
  key: string,
  title: string,
  posts: any[],
  postCount: number = posts.length
): PostSection => ({
  key,
  title,
  data: posts,
  postCount,
});

export default DynamicPostFeed;
