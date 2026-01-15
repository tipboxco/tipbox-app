# Context Menu Architecture Documentation

## Overview

Context menu yapısı, tüm post card tiplerinde ve farklı ekranlarda kullanılabilen, yeniden kullanılabilir bir context menu component'idir. Menu açıkken boşluğa tıklanınca otomatik kapanır ve post card'a tıklamayı engeller.

### Key Principles

1. **Menu Position**: Context menu **her zaman** trigger button'ın **solunda** açılır
2. **Positioning API**: `measure` API kullanılır (parent container'a göre koordinatlar için)
3. **Trigger Component**: Gluestack `Pressable` kullanılır (RNPressable değil)
4. **Container**: Context menu bir `View` container içinde olmalı (`position: 'relative'`)

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

### Example 3: RemoveFromTrustlistContextMenu (Profile Feature)

```typescript
// src/features/profile/components/TrustUserCard/index.tsx

const TrustUserCard = ({ user, onUserPress }: TrustUserCardProps) => {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const contextMenuCloseRef = useRef<(() => void) | null>(null);

  const handleRemoveFromTrustList = () => {
    Alert.alert('Remove from Trust List', `Remove ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => untrustUser(user.id) },
    ]);
  };

  return (
    <HStack position="relative" overflow="visible">
      {/* User Info */}
      <Pressable flex={1} onPress={onUserPress}>
        {/* ... user content ... */}
      </Pressable>

      {/* Context Menu */}
      <RemoveFromTrustlistContextMenu
        onRemoveFromTrustList={handleRemoveFromTrustList}
        onMute={handleMute}
        onBlock={handleBlock}
        onMenuStateChange={setIsContextMenuOpen}
        onCloseRef={(closeFn) => {
          contextMenuCloseRef.current = closeFn;
        }}
      >
        <Box p={8}>
          <Feather name="more-horizontal" size={24} color="#959595" />
        </Box>
      </RemoveFromTrustlistContextMenu>

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
            zIndex: 9999,
          }}
          onPress={() => contextMenuCloseRef.current?.()}
        />
      )}
    </HStack>
  );
};
```

## Positioning Logic

### Menu Position Calculation

**CRITICAL**: Context menu her zaman trigger button'ın **solunda** açılır. Bu, kullanıcı deneyimi için önemlidir.

```typescript
// Menu opens to the left of trigger button
const buttonLeft = triggerLayout.x;  // Parent container'a göre koordinat
const menuLeft = buttonLeft - MENU_WIDTH;  // Menu width: 180px (veya 200px)
const top = triggerLayout.y - 8;  // 8px above button

// Ensure menu doesn't go off screen
const screenWidth = Dimensions.get('window').width;
const left = Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft);
```

### Layout Measurement

**IMPORTANT**: `measure` API kullanılmalı, `measureInWindow` değil. Çünkü menü parent container'a göre absolute pozisyonlanır.

1. **onLayout Callback**: Trigger button'ın pozisyonunu mount'ta ölçer
2. **measure API**: Parent container'a göre koordinatları döndürür (px, py)
3. **Fallback**: Ref hazır değilse InteractionManager kullanılır

```typescript
// ✅ DOĞRU: measure kullan (parent container'a göre)
triggerRef.current.measure((fx, fy, w, h, px, py) => {
  // px, py = parent container'a göre koordinatlar
  const buttonLeft = px;
  const menuLeft = buttonLeft - MENU_WIDTH;
  setMenuPosition({ top: py - 8, left: menuLeft });
});

// ❌ YANLIŞ: measureInWindow kullanma (window'a göre koordinatlar)
triggerRef.current.measureInWindow((wx, wy, w, h) => {
  // Bu yanlış! Menü parent container'a göre absolute, window'a göre değil
});
```

### Trigger Button Implementation

**CRITICAL**: Trigger button için Gluestack `Pressable` kullanılmalı, `RNPressable` değil.

```typescript
// ✅ DOĞRU
<View ref={triggerRef} collapsable={false} onLayout={handleTriggerLayout}>
  <Pressable onPress={handleToggle}>
    {children}
  </Pressable>
</View>

// ❌ YANLIŞ
<RNPressable onPress={handleToggle}>
  {children}
</RNPressable>
```

### Container Structure

Context menu component'i bir `View` container içinde olmalı ve `position: 'relative'` olmalı:

```typescript
return (
  <View style={{ position: 'relative' }}>
    {/* Trigger Button */}
    <View ref={triggerRef} collapsable={false} onLayout={handleTriggerLayout}>
      <Pressable onPress={handleToggle}>
        {children}
      </Pressable>
    </View>
    
    {/* Overlay - Modal kullanarak ekranın tamamını kapla */}
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      onRequestClose={closeMenu}
    >
      <RNPressable
        style={{
          flex: 1,
          backgroundColor: 'transparent',
        }}
        onPress={closeMenu}
      />
    </Modal>
    
    {/* Menu */}
    {isOpen && <Animated.View style={menuStyle}>...</Animated.View>}
  </View>
);
```

**CRITICAL**: Overlay için `Modal` kullanılmalı. Bu sayede overlay ekranın tamamını kaplar ve boşluğa tıklayınca menu kapanır. Absolute positioned overlay sadece parent container içinde çalışır, ekranın tamamını kaplamaz.

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
Modal overlay becomes visible (transparent, full screen)
  ↓
onMenuStateChange(true) → Parent component
  ↓
User clicks outside (anywhere on screen)
  ↓
Modal overlay onPress → closeMenu()
  ↓
Set isOpen = false
  ↓
Modal overlay becomes invisible
  ↓
onMenuStateChange(false) → Parent component
```

**Key Points:**
- Modal overlay ekranın tamamını kaplar
- Boşluğa tıklayınca menu otomatik kapanır
- Parent component overlay yönetmez, context menu component kendi overlay'ini yönetir

## Z-Index Hierarchy

**With Modal Overlay Pattern:**

```
Menu Content: zIndex 10000 (top, absolute positioned)
Modal Overlay: Full screen (transparent, catches all clicks)
Parent Content: default (below everything)
```

**Note:** Modal overlay z-index kullanmaz, ekranın tamamını kaplar. Menu absolute positioned olduğu için Modal'ın üstünde görünür.

## Best Practices

### 1. Always Use Modal Overlay in Context Menu Component

**CRITICAL**: Context menu component'i içinde overlay için `Modal` kullanılmalı. Bu sayede overlay ekranın tamamını kaplar ve boşluğa tıklayınca menu kapanır.

```typescript
// ✅ DOĞRU: Modal kullan (ekranın tamamını kaplar)
<Modal
  visible={isOpen}
  transparent={true}
  animationType="none"
  onRequestClose={closeMenu}
>
  <RNPressable
    style={{
      flex: 1,
      backgroundColor: 'transparent',
    }}
    onPress={closeMenu}
  />
</Modal>

// ❌ YANLIŞ: Absolute positioned overlay (sadece parent container içinde çalışır)
{isOpen && (
  <RNPressable
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      zIndex: 9999,
    }}
    onPress={closeMenu}
  />
)}
```

**Why Modal?**
- Absolute positioned overlay sadece parent container içinde çalışır
- Modal ekranın tamamını kaplar, scroll view'ların dışında bile çalışır
- Boşluğa tıklayınca menu kapanır (kullanıcı deneyimi için kritik)

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

### 5. CRITICAL: Use `measure` API, NOT `measureInWindow`

**ALWAYS** use `measure` API to get parent-relative coordinates:

```typescript
// ✅ DOĞRU
triggerRef.current.measure((fx, fy, w, h, px, py) => {
  // px, py = parent container'a göre koordinatlar
  const buttonLeft = px;
  const menuLeft = buttonLeft - MENU_WIDTH;
});

// ❌ YANLIŞ - measureInWindow window koordinatları verir
triggerRef.current.measureInWindow((wx, wy, w, h) => {
  // Bu yanlış! Menü parent container'a göre absolute
});
```

### 6. CRITICAL: Use Gluestack `Pressable` for Trigger

**ALWAYS** use Gluestack `Pressable` component for trigger button:

```typescript
// ✅ DOĞRU
<Pressable onPress={handleToggle}>
  {children}
</Pressable>

// ❌ YANLIŞ
<RNPressable onPress={handleToggle}>
  {children}
</RNPressable>
```

### 7. Menu Always Opens to the LEFT

Context menu **her zaman** trigger button'ın solunda açılır:

```typescript
const menuLeft = buttonLeft - MENU_WIDTH;  // Soluna yerleştir
```

### 8. Container Structure

Context menu component'i mutlaka bir `View` container içinde olmalı:

```typescript
return (
  <View style={{ position: 'relative' }}>
    <View ref={triggerRef} collapsable={false} onLayout={handleTriggerLayout}>
      <Pressable onPress={handleToggle}>
        {children}
      </Pressable>
    </View>
    {/* ... menu and overlay ... */}
  </View>
);
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

### Design Pattern - Trust List Context Menu

Trust List context menu (`RemoveFromTrustlistContextMenu`) için standart tasarım pattern'i:

#### Padding Structure

**CRITICAL**: Tüm padding'ler eşit olmalı (sağ, sol, üst, alt).

```typescript
// VStack - Menu container padding (tüm yönlerde eşit)
<VStack p={12} width="100%">
  {/* Items */}
</VStack>

// Pressable - Item vertical padding (itemler arası gap için)
<Pressable py={10}>
  {/* Item content */}
</Pressable>
```

**Padding Hierarchy:**
- **VStack**: `p={12}` - Menu container'ın tüm kenarlarında 12px padding
- **Pressable**: `py={10}` - Her item'in üst ve altında 10px padding (itemler arası gap)
- **Pressable**: `px={0}` - Yatay padding YOK (VStack padding'i kullanılır)

#### Item Layout

```typescript
<Pressable py={10}>
  <HStack 
    alignItems="center" 
    justifyContent="flex-start"  // Itemleri sola hizala
    space="xs"                    // Icon ile text arası minimal gap
  >
    {item.icon}
    <Text fontSize="$sm" fontWeight="$medium">
      {item.label}
    </Text>
  </HStack>
</Pressable>
```

**Key Design Rules:**
1. **HStack Alignment**: `justifyContent="flex-start"` - Itemler her zaman sola hizalanmalı
2. **Icon Spacing**: `space="xs"` - Icon ile text arası minimal gap
3. **Font Size**: `fontSize="$sm"` - Küçük font size token kullan
4. **No Horizontal Padding on Pressable**: VStack'in padding'i yeterli

#### Complete Example

```typescript
return (
  <View style={{ position: 'relative' }}>
    {/* Trigger Button */}
    <View ref={triggerRef} collapsable={false} onLayout={handleTriggerLayout}>
      <Pressable onPress={handleToggle}>
        {children}
      </Pressable>
    </View>

    {/* Modal Overlay - ekranın tamamını kapla */}
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="none"
      onRequestClose={closeMenu}
    >
      <RNPressable
        style={{
          flex: 1,
          backgroundColor: 'transparent',
        }}
        onPress={closeMenu}
      />
    </Modal>

    {/* Animated Menu */}
    {isOpen && (
      <Animated.View style={menuStyle}>
        <RNPressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
          <VStack p={12} width="100%">
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider bg={isDark ? '#333333' : '#E9E9E9'} mx={0} />}
                <Pressable onPress={handlePress} py={10}>
                  <HStack alignItems="center" justifyContent="flex-start" space="xs">
                    {item.icon}
                    <Text fontSize="$sm" fontWeight="$medium">
                      {item.label}
                    </Text>
                  </HStack>
                </Pressable>
              </React.Fragment>
            ))}
          </VStack>
        </RNPressable>
      </Animated.View>
    )}
  </View>
);
```

#### Constants for Trust List Menu

```typescript
const MENU_ITEM_HEIGHT = 40;
const MENU_PADDING = 8;  // Not used directly, VStack p={12} kullanılır
const MENU_BORDER_RADIUS = 12;
const MENU_WIDTH = 200;
```

#### Dynamic Menu Height Calculation

**CRITICAL**: Menu height dinamik olarak hesaplanmalı. Sabit height kullanılırsa, tüm itemler görünmeyebilir.

```typescript
// Menu height: VStack padding (12 top + 12 bottom) + items (her item py={10} + text height ~15px = ~35px per item) + dividers (1px per divider)
// Her item için: py={10} (20px padding) + text height (~15px) = ~35px
const menuHeight = 24 + (items.length * 35) + ((items.length - 1) * 1);
```

**Height Calculation Breakdown:**
- **VStack Padding**: 24px (12px top + 12px bottom)
- **Per Item**: 35px
  - Pressable `py={10}`: 20px (10px top + 10px bottom padding)
  - Text height: ~15px (fontSize="$sm")
- **Dividers**: 1px per divider (items.length - 1)

**Example Calculations:**
- 1 item: 24 + (1 * 35) + 0 = 59px
- 2 items: 24 + (2 * 35) + 1 = 95px
- 3 items: 24 + (3 * 35) + 2 = 131px

**Why Dynamic?**
- Item sayısı değişebilir (conditional rendering)
- Sabit height kullanılırsa itemler kesilir veya boş alan kalır
- Animasyon sırasında smooth height transition için doğru height gerekli

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

### Trust List Screen
- `RemoveFromTrustlistContextMenu` component'i kullanılır
- TrustUserCard içinde 3 nokta butonu olarak görünür
- Menu items: Remove from Trust List, Mute, Block

### Custom Screens
1. Import context menu component
2. Add state management
3. Add overlay
4. Configure callbacks

## Troubleshooting

### Menu doesn't close on outside click
- **CRITICAL**: Use `Modal` for overlay, not absolute positioned overlay
- Verify Modal is imported from `react-native`
- Check Modal `visible={isOpen}` prop is set correctly
- Verify Modal overlay `onPress={closeMenu}` is set
- Modal should have `transparent={true}` and `animationType="none"`

### Menu position is wrong
- **CRITICAL**: Verify `measure` API is used (NOT `measureInWindow`)
- Verify `onLayout` callback is working
- Check `measure` API returns correct values (px, py should be parent-relative)
- Ensure parent has `position="relative"`
- Ensure container View has `position: 'relative'` style

### Menu doesn't appear
- Check `isOpen` state
- Verify trigger ref is set
- Check console logs for errors
- Verify `Pressable` (Gluestack) is used for trigger, not `RNPressable`

### Menu opens on wrong side
- **CRITICAL**: Menu should always open to the LEFT of trigger button
- Formula: `menuLeft = buttonLeft - MENU_WIDTH`
- If menu appears on right, check positioning calculation
- Verify `measure` returns parent-relative coordinates (px, py)

### Menu opens but position is off-screen
- Check screen width calculation: `Dimensions.get('window').width`
- Verify boundary check: `Math.max(-screenWidth + MENU_WIDTH + 12, menuLeft)`
- Ensure menu width constant matches actual menu width

## Files Modified

### Core Components
1. `src/components/PostCards/PostCard/ContextMenuReanimated.tsx` - PostCard için core component
2. `src/features/profile/components/RemoveFromTrustlistContextMenu/index.tsx` - Trust list için context menu

### PostCard Integrations
3. `src/components/PostCards/PostCard/index.tsx` - PostCard integration
4. `src/components/PostCards/BenchmarkPostCard/index.tsx` - BenchmarkPostCard integration
5. `src/components/PostCards/ExperiencePostCard/index.tsx` - ExperiencePostCard integration
6. `src/components/PostCards/QuestionPostCard/index.tsx` - QuestionPostCard integration
7. `src/components/PostCards/TipsAndTricksPostCard/index.tsx` - TipsAndTricksPostCard integration
8. `src/components/PostCards/UpdatePostCard/index.tsx` - UpdatePostCard integration

### Profile Feature Integrations
9. `src/features/profile/components/TrustUserCard/index.tsx` - TrustUserCard integration
10. `src/features/profile/screens/Trust_TrusterListScreen.tsx` - Trust list screen

## Future Enhancements

1. **Theme Support**: Dark/Light mode menu styling
2. **Accessibility**: Screen reader support
3. **Animations**: More animation options
4. **Positioning**: Smart positioning (auto-detect best position)
5. **Submenus**: Nested menu support
