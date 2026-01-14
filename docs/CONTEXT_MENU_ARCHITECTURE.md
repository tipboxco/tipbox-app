# Context Menu Architecture Documentation

## Overview

Context menu yapısı, tüm post card tiplerinde ve farklı ekranlarda kullanılabilen, yeniden kullanılabilir bir context menu component'idir. Menu açıkken boşluğa tıklanınca otomatik kapanır ve post card'a tıklamayı engeller.

## Architecture

### Component Structure

```
ContextMenuReanimated (Core Component)
├── Trigger Button (View + Pressable)
├── Overlay (Menu açıkken tıklamaları yakalamak için)
└── Animated Menu (Reanimated ile animasyonlu)
```

### Parent Component Integration

```
PostCard (Parent Component)
├── State Management
│   ├── isContextMenuOpen (boolean)
│   └── contextMenuCloseRef (ref to close function)
├── ContextMenuReanimated
│   ├── onMenuStateChange callback
│   └── onCloseRef callback
└── Overlay (PostCard seviyesinde)
```

## Core Component: ContextMenuReanimated

### Location
`src/components/PostCards/PostCard/ContextMenuReanimated.tsx`

### Props Interface

```typescript
interface ContextMenuReanimatedProps {
  children: React.ReactNode;              // Trigger button (icon, text, etc.)
  onViewProfile?: () => void;             // Profile görüntüleme callback
  onReport?: () => void;                  // Raporlama callback
  menuItems?: Array<{                    // Custom menu items (optional)
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
    color?: string;
  }>;
  onMenuStateChange?: (isOpen: boolean) => void;  // Menu state değişikliği callback
  onCloseRef?: (closeFn: () => void) => void;    // Close function expose callback
}
```

### Key Features

1. **Reanimated Performance**
   - Single SharedValue (progress: 0-1) controls all animations
   - All style calculations in worklets (UI thread)
   - withSpring for natural feel

2. **Position Calculation**
   - Uses `measure` API for parent container-relative positioning
   - Menu opens to the left of trigger button
   - Handles screen boundaries automatically

3. **State Management**
   - Internal state: `isOpen`, `menuPosition`, `triggerLayout`
   - Exposes state changes to parent via `onMenuStateChange`
   - Exposes close function via `onCloseRef`

## Parent Component Integration Pattern

### Required Imports

```typescript
import React, { useState, useRef } from 'react';
import { View, Pressable as RNPressable } from 'react-native';
import { ContextMenuReanimated } from './ContextMenuReanimated';
```

### State Setup

```typescript
const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
const contextMenuCloseRef = useRef<(() => void) | null>(null);
```

### Component Usage

```typescript
<ContextMenuReanimated
  onViewProfile={handleViewProfile}
  onReport={handleReport}
  onMenuStateChange={setIsContextMenuOpen}
  onCloseRef={(closeFn) => {
    contextMenuCloseRef.current = closeFn;
  }}
>
  <EllipsisHorizontalIcon width={24} height={24} color={isDark ? '#fff' : '#A3A3A3'} />
</ContextMenuReanimated>
```

### Overlay Integration

Parent component'in ana container'ına `position="relative"` ekleyin:

```typescript
<VStack
  bg={isDark ? '$backgroundDark900' : '$white'}
  mb={16}
  position="relative"  // ← Required for overlay positioning
>
  {/* ... content ... */}
  
  {/* Overlay - menu açıkken PostCard'a tıklamayı engellemek için */}
  {isContextMenuOpen && (
    <RNPressable
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 999,  // Menu zIndex: 1000, overlay: 999
      }}
      onPress={() => {
        contextMenuCloseRef.current?.();
      }}
    />
  )}
</VStack>
```

## Implementation Examples

### Example 1: PostCard Integration

```typescript
// src/components/PostCards/PostCard/index.tsx

const PostCard = ({ data }: PostCardProps) => {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuCloseRef = useRef<(() => void) | null>(null);

  const handleViewProfile = useCallback(() => {
    navigationService.navigate(ROOT_ROUTES.PROFILE, {
      screen: 'ProfileMain',
      params: { userId: data.user.id },
    });
  }, [data.user.id]);

  const handleReport = useCallback(() => {
    Alert.alert('Report User', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => reportUser(...) },
    ]);
  }, [data.user.id]);

  return (
    <VStack position="relative" mb={16}>
      {/* Header */}
      <HStack>
        {/* ... avatar, name ... */}
        <ContextMenuReanimated
          onViewProfile={handleViewProfile}
          onReport={handleReport}
          onMenuStateChange={setIsContextMenuOpen}
          onCloseRef={(closeFn) => {
            contextMenuCloseRef.current = closeFn;
          }}
        >
          <EllipsisHorizontalIcon width={24} height={24} />
        </ContextMenuReanimated>
      </HStack>

      {/* Content */}
      {/* ... */}

      {/* Overlay */}
      {isContextMenuOpen && (
        <RNPressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
            zIndex: 999,
          }}
          onPress={() => contextMenuCloseRef.current?.()}
        />
      )}
    </VStack>
  );
};
```

### Example 2: Custom Menu Items

```typescript
<ContextMenuReanimated
  menuItems={[
    {
      label: 'Share',
      icon: <ShareIcon />,
      onPress: () => handleShare(),
    },
    {
      label: 'Delete',
      icon: <TrashIcon />,
      onPress: () => handleDelete(),
      color: '#FF3040',
    },
  ]}
  onMenuStateChange={setIsContextMenuOpen}
  onCloseRef={(closeFn) => {
    contextMenuCloseRef.current = closeFn;
  }}
>
  <EllipsisHorizontalIcon />
</ContextMenuReanimated>
```

## Positioning Logic

### Menu Position Calculation

```typescript
// Menu opens to the left of trigger button
const buttonLeft = triggerLayout.x;
const menuLeft = buttonLeft - MENU_WIDTH;  // Menu width: 180px
const top = triggerLayout.y - 8;  // 8px above button

// Ensure menu doesn't go off screen
const screenWidth = Dimensions.get('window').width;
const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
```

### Layout Measurement

1. **onLayout Callback**: Measures trigger button position on mount
2. **measure API**: Gets parent container-relative coordinates
3. **Fallback**: Uses InteractionManager if ref is not ready

## State Flow

```
User clicks trigger
  ↓
handleToggle() called
  ↓
Measure trigger position
  ↓
Set menuPosition state
  ↓
Set isOpen = true
  ↓
onMenuStateChange(true) → Parent component
  ↓
Parent shows overlay
  ↓
User clicks outside
  ↓
Overlay onPress → contextMenuCloseRef.current()
  ↓
closeMenu() called
  ↓
Set isOpen = false
  ↓
onMenuStateChange(false) → Parent component
  ↓
Parent hides overlay
```

## Z-Index Hierarchy

```
Menu Content: zIndex 1000 (top)
Overlay: zIndex 999 (catches clicks, below menu)
PostCard Content: default (below overlay)
```

## Best Practices

### 1. Always Use Overlay in Parent

Overlay, menu açıkken parent component'e tıklamayı engeller. Her zaman ekleyin:

```typescript
{isContextMenuOpen && (
  <RNPressable
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 999,
    }}
    onPress={() => contextMenuCloseRef.current?.()}
  />
)}
```

### 2. Position Relative on Container

Parent container'a `position="relative"` ekleyin:

```typescript
<VStack position="relative">
  {/* content */}
</VStack>
```

### 3. State Management

Always manage state in parent component:

```typescript
const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
const contextMenuCloseRef = useRef<(() => void) | null>(null);
```

### 4. Callback Functions

Use `useCallback` for performance:

```typescript
const handleViewProfile = useCallback(() => {
  // navigation logic
}, [userId]);

const handleReport = useCallback(() => {
  // report logic
}, [userId]);
```

## Customization

### Menu Styling

Constants in `ContextMenuReanimated.tsx`:

```typescript
const MENU_ITEM_HEIGHT = 48;
const MENU_PADDING = 8;
const MENU_BORDER_RADIUS = 8;
const MENU_WIDTH = 180;
```

### Animation Configuration

```typescript
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};
```

## Usage in Different Screens

### Feed Screen
- Used in all post card types
- Same implementation pattern

### Profile Screen
- Can be used for user actions
- Custom menu items (Follow, Block, etc.)

### Detail Screen
- Same pattern, different callbacks
- Can disable navigation on menu open

### Custom Screens
1. Import `ContextMenuReanimated`
2. Add state management
3. Add overlay
4. Configure callbacks

## Troubleshooting

### Menu doesn't close on outside click
- Check overlay is added in parent
- Verify `onCloseRef` is set
- Check z-index hierarchy

### Menu position is wrong
- Verify `onLayout` callback is working
- Check `measure` API returns correct values
- Ensure parent has `position="relative"`

### Menu doesn't appear
- Check `isOpen` state
- Verify trigger ref is set
- Check console logs for errors

## Files Modified

1. `src/components/PostCards/PostCard/ContextMenuReanimated.tsx` - Core component
2. `src/components/PostCards/PostCard/index.tsx` - PostCard integration
3. `src/components/PostCards/BenchmarkPostCard/index.tsx` - BenchmarkPostCard integration
4. `src/components/PostCards/ExperiencePostCard/index.tsx` - ExperiencePostCard integration
5. `src/components/PostCards/QuestionPostCard/index.tsx` - QuestionPostCard integration
6. `src/components/PostCards/TipsAndTricksPostCard/index.tsx` - TipsAndTricksPostCard integration
7. `src/components/PostCards/UpdatePostCard/index.tsx` - UpdatePostCard integration

## Future Enhancements

1. **Theme Support**: Dark/Light mode menu styling
2. **Accessibility**: Screen reader support
3. **Animations**: More animation options
4. **Positioning**: Smart positioning (auto-detect best position)
5. **Submenus**: Nested menu support
