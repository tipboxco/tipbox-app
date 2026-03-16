# Plan: ProfileScreen Instagram-Style Scroll Refactoring

## Context

ProfileScreen currently uses a single FlatList with `ListHeaderComponent` (profile header + tab bar) and `ListEmptyComponent` (badge/collections content). This architecture causes:

1. **Nested vertical ScrollView**: CollectionsTab has its own `ScrollView` inside FlatList's `ListEmptyComponent` - triggers "VirtualizedLists should never be nested" warning
2. **Broken scroll for non-post tabs**: When `data=[]` (badge/collections), FlatList scroll doesn't work properly
3. **Touch handler conflicts**: Raw `onTouchStart/onTouchEnd` on wrapper View conflicts with inner scrollable components
4. **No sticky tab bar**: Profile header and tab bar scroll away together, no Instagram-style sticky effect

**Goal**: Instagram-style experience - profile header collapses on scroll, tab bar sticks to top, native swipe between tabs, no nested scroll issues.

## Approach

Use `react-native-collapsible-tab-view` (v8.0.1, **already installed** in package.json) which is specifically designed for this exact use case.

**Library provides:**
- `Tabs.Container` with `renderHeader` (collapsible) + `renderTabBar` (sticky)
- `Tabs.FlatList` / `Tabs.ScrollView` per tab - each tab has its own scroll context
- Native PagerView-based swipe between tabs
- `MaterialTabBar` with animated indicator, `scrollEnabled`, `keepActiveTabCentered`
- `lazy` loading - tabs only render when first visited

**Library API (from `react-native-collapsible-tab-view/src/index.tsx`):**
```tsx
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';

// Tabs.Container - main wrapper
// Tabs.Tab - declares each tab (name, label, children)
// Tabs.FlatList - drop-in FlatList replacement (syncs with header collapse)
// Tabs.ScrollView - drop-in ScrollView replacement
// Tabs.FlashList - @shopify/flash-list replacement
// MaterialTabBar - built-in tab bar with animated indicator
```

**Key CollapsibleProps:**
```tsx
{
  renderHeader?: (props: TabBarProps) => ReactElement | null;
  renderTabBar?: (props: TabBarProps) => ReactElement | null;
  headerContainerStyle?: StyleProp<ViewStyle>;
  allowHeaderOverscroll?: boolean; // for pull-to-refresh on iOS
  lazy?: boolean; // mount tabs only when visited
  onTabChange?: (data: IndexChangeEventData) => void;
  minHeaderHeight?: number; // header min height when collapsed
  snapThreshold?: number | null; // snap point for header
}
```

## Files to Modify

| File | Action | Change |
|------|--------|--------|
| `src/features/profile/screens/ProfileScreen.tsx` | Major refactor | ~2586 -> ~900 lines |
| `src/features/events/components/TabContents/CollectionsTab.tsx` | Minor change | Add `isEmbedded` prop |
| `src/features/profile/utils/postMappers.ts` | New file | Extract mapping functions |
| `src/features/profile/utils/renderPostCard.tsx` | New file | Shared card renderer |
| `src/features/profile/components/ProfileTabs/FeedTabContent.tsx` | New file | Feed tab (combined queries) |
| `src/features/profile/components/ProfileTabs/ExperienceTabContent.tsx` | New file | Experience tab |
| `src/features/profile/components/ProfileTabs/BenchmarksTabContent.tsx` | New file | Benchmarks tab |
| `src/features/profile/components/ProfileTabs/TipsTabContent.tsx` | New file | Tips tab |
| `src/features/profile/components/ProfileTabs/QuestionsTabContent.tsx` | New file | Questions tab |
| `src/features/profile/components/ProfileTabs/BadgesTabContent.tsx` | New file | Badges tab |
| `src/features/profile/components/ProfileTabs/CollectionsTabContent.tsx` | New file | Collections wrapper |
| `src/features/profile/components/ProfileTabs/index.ts` | New file | Re-exports |

## Implementation Steps

### Step 1: Extract Mapping Functions to Utility File

**New file**: `src/features/profile/utils/postMappers.ts`

Move from ProfileScreen.tsx (lines 86-389):
- `mapPostToCardData` (line 86)
- `mapExperienceToCardData` (line 138)
- `mapBenchmarkToCardData` (line 194)
- `mapTipsToCardData` (line 226)
- `mapQuestionToCardData` (line 267)
- `mapUpdateToCardData` (line 312)
- `MappedPost` type union (line 382)
- `BADGE_FILTERS` and `BadgeFilterKey` type (line 391)

Dependencies to import in new file:
- `toImageSource`, `isSameImageSource` from `@/src/utils`
- All card types from `@/src/types/*`
- `CardType`, `ProductInfoType` from `@/src/types/common`
- `ProfilePost`, `ProfileReview` from `../types`

Pure extraction, no logic changes.

### Step 2: Create Shared renderPostCard Utility

**New file**: `src/features/profile/utils/renderPostCard.tsx`

Extract the `renderPostCard` function (identical across all post tabs):
```tsx
import React from 'react';
import PostCard from '@/src/components/PostCards/PostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import type { MappedPost } from './postMappers';

export const renderPostCard = (post: MappedPost) => {
  switch (post.type) {
    case 'update': return <UpdatePostCard data={post.data} />;
    case 'experience': return <ExperiencePostCard data={post.data} />;
    case 'benchmark': return <BenchmarkPostCard data={post.data} />;
    case 'tips': return <TipsAndTricksPostCard data={post.data} />;
    case 'question': return <QuestionPostCard data={post.data} />;
    case 'post':
    default: return <PostCard data={post.data} />;
  }
};
```

### Step 3: Create Per-Tab Content Components

**Directory**: `src/features/profile/components/ProfileTabs/`

Each component receives `targetUserId` and `isDark` as props.

#### a) FeedTabContent.tsx (~200 lines)
- Calls all 5 query hooks (`useUserPosts`, `useUserReviews`, `useUserBenchmarks`, `useUserTipsAndTricks`, `useUserReplies`)
- Merges all results, deduplicates by `id`, maps using extracted mapping functions
- Uses `Tabs.FlatList<MappedPost>` (or `Tabs.FlashList` if FlashList preferred)
- Handles `RefreshControl` (refetches all 5 queries)
- Handles `onEndReached` (fetchNextPage on all queries with hasNextPage)
- `ListEmptyComponent` for empty state
- `ListFooterComponent` for loading indicator

```tsx
import { Tabs } from 'react-native-collapsible-tab-view';
import { RefreshControl } from 'react-native';

const FeedTabContent: React.FC<TabContentProps> = ({ targetUserId, isDark }) => {
  const feedQuery = useUserPosts(targetUserId, 10, { enabled: !!targetUserId });
  const reviewsQuery = useUserReviews(targetUserId, 10, { enabled: !!targetUserId });
  // ... all 5 queries

  const mappedPosts = useMemo(() => {
    // Merge all queries, deduplicate, map to MappedPost[]
    // Same logic as current ProfileScreen lines 1105-1173
  }, [feedQuery.data, reviewsQuery.data, ...]);

  return (
    <Tabs.FlatList
      data={mappedPosts}
      renderItem={({ item }) => (
        <Box px={16} mb={16}>{renderPostCard(item)}</Box>
      )}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={...}
      ListFooterComponent={...}
    />
  );
};
```

#### b) ExperienceTabContent.tsx (~100 lines)
- Calls `useUserReviews(targetUserId, 10)`
- Maps items to `MappedPost[]` using `mapExperienceToCardData` and `mapUpdateToCardData`
- Uses `Tabs.FlatList<MappedPost>`

#### c) BenchmarksTabContent.tsx (~100 lines)
- Calls `useUserBenchmarks(targetUserId, 10)`
- Maps items to `MappedPost[]` using `mapBenchmarkToCardData`
- Uses `Tabs.FlatList<MappedPost>`

#### d) TipsTabContent.tsx (~100 lines)
- Calls `useUserTipsAndTricks(targetUserId, 10)`
- Maps items to `MappedPost[]` using `mapTipsToCardData`
- Uses `Tabs.FlatList<MappedPost>`

#### e) QuestionsTabContent.tsx (~100 lines)
- Calls `useUserReplies(targetUserId, 10)`
- Maps items to `MappedPost[]` using `mapQuestionToCardData`
- Uses `Tabs.FlatList<MappedPost>`

#### f) BadgesTabContent.tsx (~120 lines)
- Receives `badges: Badge[]`, `onBadgePress`, `isDark` as props
- Uses `Tabs.ScrollView` wrapping badge filter chips + grid
- Badge filter state is local to this component
- No API calls (data comes from parent's `userProfile.badges`)

```tsx
const BadgesTabContent: React.FC<BadgesTabContentProps> = ({ badges, isDark, onBadgePress }) => {
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilterKey>('All Badges');

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'All Badges') return badges;
    if (badgeFilter === 'Event Badges') return badges.filter(b => b.type === 'event');
    if (badgeFilter === 'Collections') return badges.filter(b => b.type === 'collection');
    return badges;
  }, [badges, badgeFilter]);

  return (
    <Tabs.ScrollView>
      <Box px={16} pt={8}>
        {/* Filter chips (horizontal ScrollView) */}
        {/* Badge grid */}
      </Box>
    </Tabs.ScrollView>
  );
};
```

#### g) CollectionsTabContent.tsx (~30 lines)
```tsx
const CollectionsTabContent: React.FC<{ targetUserId?: string; isDark: boolean }> = ({ targetUserId, isDark }) => (
  <Tabs.ScrollView>
    <CollectionsTab userId={targetUserId} isEmbedded />
  </Tabs.ScrollView>
);
```

#### h) index.ts - Re-exports
```tsx
export { default as FeedTabContent } from './FeedTabContent';
export { default as ExperienceTabContent } from './ExperienceTabContent';
// ... etc
```

### Step 4: Modify CollectionsTab to Support `isEmbedded` Prop

**File**: `src/features/events/components/TabContents/CollectionsTab.tsx`

Changes:
- Add `isEmbedded?: boolean` to `CollectionsTabProps` (line 26)
- When `isEmbedded=true`: Replace outer `<ScrollView>` (line 276) with plain `<View>`
- Horizontal `FilterChips` ScrollView stays unchanged (no vertical conflict)
- EventsScreen usage unchanged (default `isEmbedded=false`)

```tsx
// Line 276 - conditional rendering:
{isEmbedded ? (
  <View style={[styles.listContent, { paddingBottom: bottomInset + 24 }]}>
    {rows.length === 0 ? EmptyComponent : null}
    {rows.map((item, index) => (
      <View key={`row-${index}-${item.items.map(c => c.id).join('-')}`}>
        {renderRow({ item })}
      </View>
    ))}
    {ListFooter}
  </View>
) : (
  <ScrollView
    style={styles.scrollView}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 24 }]}
  >
    {/* existing content */}
  </ScrollView>
)}
```

### Step 5: Refactor ProfileScreen Main Render

**File**: `src/features/profile/screens/ProfileScreen.tsx`

#### 5a. New imports
```tsx
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';
import type { TabBarProps } from 'react-native-collapsible-tab-view';
import {
  FeedTabContent, ExperienceTabContent, BenchmarksTabContent,
  TipsTabContent, QuestionsTabContent, BadgesTabContent, CollectionsTabContent
} from '../components/ProfileTabs';
```

#### 5b. renderTabBar function
```tsx
const renderTabBar = useCallback((props: TabBarProps) => (
  <MaterialTabBar
    {...props}
    scrollEnabled
    keepActiveTabCentered
    activeColor={isDark ? '#FFFFFF' : '#000000'}
    inactiveColor="#A3A3A3"
    indicatorStyle={{
      backgroundColor: isDark ? '#FFFFFF' : '#000000',
      height: 2,
    }}
    labelStyle={{ fontSize: 12, fontWeight: '700' }}
    tabStyle={{ paddingVertical: 12, paddingHorizontal: 8, minWidth: 60 }}
    style={{
      backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
      shadowOpacity: 0,
      elevation: 0,
    }}
  />
), [isDark]);
```

#### 5c. renderProfileHeader function
Keep existing profile header JSX (banner, avatar, action buttons, stats, inventory, badge preview) from current `renderProfileHeader` (lines 1720-2288). **Remove** the `AnimatedTabBar` from it - the tab bar is now handled by `renderTabBar`.

#### 5d. Main render
```tsx
return (
  <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'} width="100%">
    <StatusBar style="light" />

    <Tabs.Container
      renderHeader={renderProfileHeader}
      renderTabBar={renderTabBar}
      headerContainerStyle={{
        backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
        shadowOpacity: 0,
        elevation: 0,
      }}
      allowHeaderOverscroll={true}
      lazy
      onTabChange={handleOnTabChange}
    >
      <Tabs.Tab name="feed" label="Feed">
        <FeedTabContent targetUserId={targetUserId!} isDark={isDark} />
      </Tabs.Tab>
      <Tabs.Tab name="reviews" label="Experience">
        <ExperienceTabContent targetUserId={targetUserId!} isDark={isDark} />
      </Tabs.Tab>
      <Tabs.Tab name="benchmarks" label="Benchmarks">
        <BenchmarksTabContent targetUserId={targetUserId!} isDark={isDark} />
      </Tabs.Tab>
      <Tabs.Tab name="tips" label="Tips & Tricks">
        <TipsTabContent targetUserId={targetUserId!} isDark={isDark} />
      </Tabs.Tab>
      <Tabs.Tab name="replies" label="Questions">
        <QuestionsTabContent targetUserId={targetUserId!} isDark={isDark} />
      </Tabs.Tab>
      <Tabs.Tab name="badge" label="Badges">
        <BadgesTabContent
          badges={userProfile?.badges || []}
          isDark={isDark}
          onBadgePress={handleBadgePress}
          isOwnProfile={isOwnProfile}
          onEditHighlightBadges={() => navigation.navigate('EditHighlightBadges')}
        />
      </Tabs.Tab>
      <Tabs.Tab name="collections" label="Collections">
        <CollectionsTabContent targetUserId={targetUserId} isDark={isDark} />
      </Tabs.Tab>
    </Tabs.Container>

    {/* Modals stay outside Tabs.Container */}
    {!isOwnProfile && (<RNModal ...>{/* context menu */}</RNModal>)}
    <SendTipsModal ... />
    <Modal ...>{/* Badge detail */}</Modal>
  </Box>
);
```

### Step 6: Clean Up Dead Code from ProfileScreen

**Remove:**
- `TabContent` component (lines 488-811) - dead code, never used in render
- `TabsBar` component (lines 413-485) - replaced by MaterialTabBar
- Touch handler swipe detection (`onTouchStart/onTouchEnd`, `touchStartRef`, `switchToNextTab/switchToPrevTab`) (lines 1023-1073)
- `ListEmptyComponent` callback (lines 1199-1317)
- `ListHeaderComponent` callback (lines 2297-2308)
- `ListFooterComponent` callback (lines 1320-1328)
- `mappedPosts` useMemo (lines 1105-1173) - moved to per-tab components
- `renderItem` callback (lines 1189-1193)
- `keyExtractor` callback (line 1196)
- `renderPostCard` callback (lines 1176-1186)
- `activeTabQuery` useMemo (lines 1093-1102)
- All 5 query hooks from ProfileScreen level (lines 1076-1090) - moved to tab components
- `activeTab` state (line 1011) - library manages internally
- `badgeFilter` state (line 1012) - moved to BadgesTabContent
- `tabBarRef` ref (line 1013)
- `handleTabChange` callback (line 1016)

**Keep in ProfileScreen:**
- Profile query hook (`useUserProfile`) - needed for header
- All mutation hooks (trust, mute, report, block, send tips)
- All action handlers (handleSendTIPS, handleDM, handleShare, handleReport, handleBlock, handleMute, handleBadgePress etc.)
- Modal states and components (isMenuOpen, selectedBadge, isSendTipsModalVisible)
- `useFocusEffect` for auto-refresh (simplified - just invalidate queries, tabs refetch naturally)
- `renderProfileHeader` function (adapted for `renderHeader` prop)
- Loading/error early returns

### Step 7: Simplify useFocusEffect

Current `useFocusEffect` (lines 868-940) invalidates + refetches all queries. With per-tab architecture, simplify to just invalidate - tabs will refetch automatically via React Query:

```tsx
useFocusEffect(
  useCallback(() => {
    if (targetUserId && user?.id && targetUserId === user.id) {
      // Just invalidate - tabs will refetch when they become active
      queryClient.invalidateQueries({
        queryKey: profileKeys.all(targetUserId),
        exact: false,
      });
    }
  }, [targetUserId, user?.id, queryClient])
);
```

## Key Design Decisions

### Why `react-native-collapsible-tab-view` over manual FlatList?
- Already installed (v8.0.1) and whitelisted in expo.doctor
- Solves all 4 problems simultaneously
- Battle-tested for this exact Instagram-style use case
- Uses PagerView (already installed: 6.9.1) for native swipe
- Each tab has independent scroll context - zero nesting issues

### Why `MaterialTabBar` over custom `AnimatedTabBar`?
- Built-in integration with library's `indexDecimal` shared value
- `scrollEnabled` + `keepActiveTabCentered` handles 7 tabs perfectly
- Animated indicator syncs with swipe progress automatically
- `AnimatedTabBar.tsx` remains unchanged for use in other screens

### Why per-tab components over centralized data?
- Each tab owns its own query lifecycle (loading, error, refresh, pagination)
- No shared state management complexity
- Lazy loading works naturally (queries only run when tab is visited)
- Easier to maintain and debug

## Verification Checklist

1. **Vertical scroll**: Profile header collapses on scroll, tab bar sticks to top
2. **Horizontal swipe**: Swipe left/right between all 7 tabs smoothly
3. **Badge tab**: Scroll vertically to see all badges, filter chips work
4. **Collections tab**: Scroll vertically to see all collections, no nested scroll warning
5. **Console**: No "VirtualizedLists should never be nested" warnings
6. **Pull to refresh**: Works on each tab independently
7. **Infinite scroll**: `onEndReached` works per post tab
8. **Tab bar indicator**: Animates smoothly during swipe
9. **Lazy loading**: Non-visible tabs don't render until first visit
10. **Dark mode**: All components respect dark/light theme
11. **Own profile**: Edit button, edit highlight badges link work
12. **Other profile**: Trust, mute, DM, gift, report, block actions work
13. **Context menu**: Three-dot menu still opens correctly
14. **Badge detail modal**: Badge press opens modal correctly
15. **Send TIPS modal**: Gift button opens modal correctly
16. **Navigation**: Back button, inventory button, trust/truster list navigation work
