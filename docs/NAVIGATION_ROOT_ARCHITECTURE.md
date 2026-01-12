# Navigation Root Architecture - Detaylı Mimari Analizi

Bu doküman, Tipbox uygulamasının root seviyesindeki navigasyon mimarisini, nested yapıları, shared component'leri ve etkileşimleri detaylı olarak açıklar.

## 📋 İçindekiler

1. [Root Hiyerarşi](#root-hiyerarşi)
2. [Navigator Seviyeleri](#navigator-seviyeleri)
3. [Shared Yapılar](#shared-yapılar)
4. [Event Flow ve Etkileşimler](#event-flow-ve-etkileşimler)
5. [Context ve State Yönetimi](#context-ve-state-yönetimi)
6. [Scroll-to-Top Problemi Analizi](#scroll-to-top-problemi-analizi)

---

## 🏗️ Root Hiyerarşi

### Tam Hiyerarşi (7 Seviye)

```
App.tsx (Root Entry Point)
  └── QueryProvider
      └── AppProviders (AuthProvider + diğerleri)
          └── AppInner
              └── Navigation Component
                  └── NavigationProvider
                      └── NavigationInner
                          └── NavigationContainer (React Navigation Root)
                              └── RootNavigator (Level 1)
                                  ├── Auth (if !isAuthenticated)
                                  │   └── AuthNavigator
                                  └── App (if isAuthenticated)
                                      └── AppDrawerNavigator (Level 2)
                                          └── MainTabs Screen
                                              └── TabNavigator (Level 3)
                                                  ├── FeedStack (Level 4)
                                                  │   └── FeedNavigator (Level 5)
                                                  │       └── FeedStack.Navigator (Level 6)
                                                  │           └── FeedScreen (Level 7)
                                                  ├── ExploreStack
                                                  ├── CatalogStack
                                                  ├── EventsStack
                                                  ├── NotificationStack
                                                  └── InboxStack
                                  ├── DetailsGroup (Root Level)
                                  │   ├── Post
                                  │   ├── Profile
                                  │   ├── Wallet
                                  │   ├── Bookmarks
                                  │   ├── Marketplace
                                  │   ├── MessageDetail
                                  │   └── SupportMessageDetail
                                  └── ModalsGroup (Root Level)
                                      ├── Settings
                                      └── MoreSchoise
```

---

## 📊 Navigator Seviyeleri

### Seviye 0: App.tsx (Root Entry Point)

**Dosya:** `App.tsx`

**Yapı:**
```typescript
App()
  └── QueryProvider
      └── AppProviders
          └── AppInner
              └── Navigation
```

**Özellikler:**
- React Query provider (data fetching)
- AppProviders (AuthProvider, AppStateProvider, vb.)
- Navigation component'ini render eder

**Shared State:**
- Zustand stores (appStore, notificationStore, vb.)
- React Query cache
- Auth state

---

### Seviye 1: NavigationContainer + RootNavigator

**Dosya:** `src/navigation/index.tsx` → `src/navigation/stacks/RootNavigator.tsx`

**Yapı:**
```typescript
NavigationContainer
  └── RootNavigator
      ├── Auth (conditional)
      ├── App (conditional)
      ├── DetailsGroup (Post, Profile, Wallet, vb.)
      └── ModalsGroup (Settings, MoreSchoise)
```

**Özellikler:**
- Deep linking yönetimi
- Navigation ref export (NavigationProvider)
- Initial URL handling
- Authentication-based routing

**Shared Services:**
- `navigationService` (NavigationService)
- `deepLinkService` (DeepLinkService)
- Navigation ref (global erişim)

**Event Listeners:**
- `onReady`: Navigation ready olduğunda pending navigation queue'yu consume et
- `onStateChange`: Navigation state değiştiğinde pending navigation'ı kontrol et

---

### Seviye 2: AppDrawerNavigator

**Dosya:** `src/navigation/DrawerNavigator.tsx`

**Yapı:**
```typescript
Drawer.Navigator
  └── MainTabs Screen
      └── TabNavigator
```

**Özellikler:**
- Drawer menu (CustomDrawerContent)
- Swipe gesture desteği (swipeEdgeWidth: 50)
- Dark mode desteği
- Drawer width: 75% (301px)
- `drawerType: 'front'` (overlay olarak açılır, ekranı kaydırmaz)
- Z-Index: 10000 (SafeAreaView'lerin üstünde)

**Gesture Ownership:**
- Drawer'da kalır (Twitter/X pattern)
- Tab'lerin dışında ve üstünde

**Shared Components:**
- `DrawerContent` (CustomDrawerContent component)

---

### Seviye 3: TabNavigator (Bottom Tab Bar)

**Dosya:** `src/navigation/TabNavigator.tsx`

**Yapı:**
```typescript
Tab.Navigator
  ├── FeedStack
  ├── ExploreStack
  ├── CatalogStack
  ├── EventsStack
  ├── NotificationStack
  └── InboxStack
```

**Özellikler:**
- 6 tab (Feed, Explore, Catalog, Events, Notification, Inbox)
- Tab bar visibility kontrolü (`useNavigationUIStore`)
- Notification badge (unread count)
- Message badge (unread messages)
- Auto mark as read (notification tab'a tıklandığında)
- Tab bar height: iOS (45 + insets.bottom), Android (45 + insets.bottom)
- `unmountOnBlur: false` (tab state persistence)

**Tab Icons:**
- FeedStack: `home` (HomeIconSolid/Outline)
- ExploreStack: `search` (MagnifyingGlassIconSolid/Outline)
- CatalogStack: `grid` (Squares2X2IconSolid/Outline)
- EventsStack: `calendar` (CalendarIconSolid/Outline)
- NotificationStack: `bell` (BellIconSolid/Outline) + badge
- InboxStack: `inbox` (InboxIconSolid/Outline) + badge

**Tab Press Handlers:**
- `FeedStack`: `handleFeedTabPress` (şu an boş, FeedScreen içinde handle edilecek)
- `NotificationStack`: `handleNotificationTabPress` (mark all as read)

**Shared State:**
- `useNavigationUIStore` (tab bar visibility)
- `useAppStore` (authentication status)
- `useUnreadCount` (notification badge)
- `useMessages` (inbox badge)

**Edge-to-Edge Design:**
- Manual inset management (SafeAreaView yerine)
- Üst güvenli alan (status bar arkası)
- Alt güvenli alan (home indicator arkası, tab bar altı)

---

### Seviye 4-7: FeedStack → FeedNavigator → FeedScreen

**Dosyalar:**
- `src/navigation/TabNavigator.tsx` (FeedStack tanımı)
- `src/features/feed/navigation.tsx` (FeedNavigator)
- `src/features/feed/screens/FeedScreen.tsx` (FeedScreen)

**Yapı:**
```typescript
TabNavigator
  └── FeedStack (Tab.Screen)
      └── FeedNavigator (component)
          └── FeedStack.Navigator (NativeStackNavigator)
              └── FeedScreen (Screen)
                  └── FeedListProvider (Context Provider)
                      └── FeedScreenInner
                          └── FlatList (feedListRef)
```

**Context Yapısı:**
```typescript
FeedListProvider (Context Provider)
  └── feedListRef (FlatList ref)
  └── scrollToTop (function)
      └── FeedScreenInner (Consumer)
          └── FlatList (ref={feedListRef})
```

**Tab Press Event Flow:**
1. User taps home icon in bottom tab bar
2. `TabNavigator` → `FeedStack` → `tabPress` event fires
3. `handleFeedTabPress` (boş handler, şu an hiçbir şey yapmıyor)
4. **PROBLEM:** FeedScreen içinde `tabPress` listener var ama parent tab navigator'dan event gelmiyor

**Scroll-to-Top Problemi:**
- `FeedScreen` içinde `tabNavigation.getParent()` ile parent tab navigator'a erişmeye çalışıyor
- `tabPress` event listener ekleniyor ama event gelmiyor veya scroll çalışmıyor
- `scrollToOffset`, `scrollToIndex`, `getScrollResponder()`, `getNode()`, `_listRef`, `UIManager` - hiçbiri çalışmıyor

---

## 🔄 Shared Yapılar

### 1. Navigation Services

**NavigationService** (`src/services/NavigationService`)
- Global navigation ref erişimi
- Type-safe navigation methods
- Pending navigation queue

**DeepLinkService** (`src/services/DeepLinkService`)
- URL parsing
- Initial URL handling
- URL change listeners

### 2. Zustand Stores

**useNavigationUIStore**
- Tab bar visibility
- Drawer state
- Navigation UI state

**useAppStore**
- Authentication status
- User busy state
- App-level state

**useNotificationStore**
- Unread count
- Pending navigation queue

### 3. Context Providers

**FeedListContext** (`src/features/feed/context/FeedListContext.tsx`)
- `feedListRef`: FlatList ref
- `scrollToTop`: Scroll to top function
- **PROBLEM:** Context'e erişim var ama scroll çalışmıyor

**NavigationProvider** (`src/providers/NavigationProvider`)
- Navigation ref export
- Global navigation erişimi

### 4. Shared Components

**CustomDrawerContent** (`src/components/CustomDrawer/DrawerContent`)
- Drawer menu content
- Navigation links

**NotificationBadge** (`src/components/NotificationBadge`)
- Unread notification count badge

**MessageBadge** (`src/components/MessageBadge`)
- Unread message indicator

---

## 🎯 Event Flow ve Etkileşimler

### Tab Press Event Flow (Mevcut - Çalışmıyor)

```
User taps home icon
  ↓
TabNavigator (Tab.Screen - FeedStack)
  ↓
tabPress event fires
  ↓
handleFeedTabPress (boş handler)
  ↓
FeedScreen içinde listener (tabNavigation.getParent())
  ↓
tabPress event dinleniyor
  ↓
scrollToTop() çağrılıyor
  ↓
FeedListContext.scrollToTop()
  ↓
FlatList scroll methods (scrollToOffset, scrollToIndex, vb.)
  ↓
❌ SCROLL ÇALIŞMIYOR
```

### Doğru Event Flow (Önerilen)

```
User taps home icon
  ↓
TabNavigator (Tab.Screen - FeedStack)
  ↓
tabPress event fires
  ↓
handleFeedTabPress (TabNavigator seviyesinde)
  ↓
FeedListContext'e erişim (global context veya navigation params)
  ↓
scrollToTop() çağrılıyor
  ↓
FeedListContext.scrollToTop()
  ↓
FlatList scroll methods
  ↓
✅ SCROLL ÇALIŞIYOR
```

**Problem:** TabNavigator seviyesinde FeedListContext'e erişemiyoruz çünkü:
1. Context Provider FeedScreen içinde
2. TabNavigator → FeedNavigator → FeedScreen hiyerarşisi var
3. Context sadece FeedScreen ve child'larında erişilebilir

---

## 🔍 Context ve State Yönetimi

### Context Erişim Hiyerarşisi

```
FeedListProvider (Context Provider)
  └── FeedScreen (Consumer)
      └── FeedScreenInner (Consumer)
          └── FlatList (ref={feedListRef})
```

**Erişim:**
- ✅ FeedScreen içinde: `useFeedListContext()` → erişilebilir
- ✅ FeedScreenInner içinde: `useFeedListContext()` → erişilebilir
- ❌ TabNavigator içinde: `useFeedListContext()` → undefined (context dışında)
- ❌ FeedNavigator içinde: `useFeedListContext()` → undefined (context dışında)

### State Yönetimi

**Zustand Stores (Global):**
- `useNavigationUIStore` → TabNavigator, FeedScreen, tüm ekranlarda erişilebilir
- `useAppStore` → Tüm ekranlarda erişilebilir
- `useNotificationStore` → Tüm ekranlarda erişilebilir

**React Context (Local):**
- `FeedListContext` → Sadece FeedScreen ve child'larında erişilebilir

---

## 🐛 Scroll-to-Top Problemi Analizi

### Denenen Yöntemler

1. ✅ **scrollToOffset**: Çağrılıyor ama scroll olmuyor
2. ✅ **scrollToIndex**: Çağrılıyor ama scroll olmuyor
3. ✅ **getScrollResponder()**: `undefined` döndürüyor
4. ✅ **getNode()**: Mevcut değil
5. ✅ **_listRef**: Mevcut ama `scrollTo` method'u yok
6. ✅ **UIManager**: Çağrılıyor ama scroll olmuyor

### Olası Nedenler

1. **Event Listener Problemi:**
   - `tabPress` event FeedScreen'e ulaşmıyor olabilir
   - Parent tab navigator'a erişim yanlış olabilir
   - Event timing problemi (event geldiğinde FlatList henüz hazır değil)

2. **FlatList Ref Problemi:**
   - Ref doğru bağlanmamış olabilir
   - FlatList mount olmadan önce scroll çağrılıyor olabilir
   - `scrollEnabled` prop'u false olabilir (ama loglar true gösteriyor)

3. **Navigation Hiyerarşi Problemi:**
   - Nested navigator yapısı event propagation'ı engelliyor olabilir
   - Root → Drawer → Tab → FeedStack → FeedNavigator → FeedScreen (7 seviye)
   - Event bu kadar derin nested yapıda kayboluyor olabilir

4. **Native Scroll Problemi:**
   - FlatList'in native ScrollView'i henüz hazır değil
   - Layout henüz hesaplanmamış
   - Content size henüz bilinmiyor

### Önerilen Çözümler

#### Çözüm 1: Context'i Root Seviyesine Taşı

```typescript
// App.tsx veya Navigation seviyesinde
<FeedListProvider>
  <Navigation />
</FeedListProvider>
```

**Avantajlar:**
- TabNavigator seviyesinde erişilebilir
- `handleFeedTabPress` içinde `scrollToTop()` çağrılabilir

**Dezavantajlar:**
- Context sadece Feed için, root seviyede olmamalı
- Diğer feature'lar için de context gerekirse karmaşık olur

#### Çözüm 2: Zustand Store Kullan

```typescript
// Store'da scrollToTop function'ı tut
useFeedStore.setState({ scrollToTop: () => { ... } });

// TabNavigator'da
const scrollToTop = useFeedStore((state) => state.scrollToTop);
handleFeedTabPress = () => scrollToTop?.();
```

**Avantajlar:**
- Global erişim
- TabNavigator seviyesinde erişilebilir

**Dezavantajlar:**
- Function'ı store'da tutmak anti-pattern
- Ref'i store'da tutmak memory leak riski

#### Çözüm 3: Navigation Params ile İletişim

```typescript
// TabNavigator'da
navigation.navigate('FeedStack', { action: 'scrollToTop' });

// FeedScreen'de
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    const params = route.params;
    if (params?.action === 'scrollToTop') {
      scrollToTop();
    }
  });
  return unsubscribe;
}, [navigation, route]);
```

**Avantajlar:**
- Navigation pattern'e uygun
- Type-safe

**Dezavantajlar:**
- Her focus'ta kontrol etmek gerekiyor
- Params temizlenmeli

#### Çözüm 4: Custom Event System

```typescript
// Event emitter kullan
EventEmitter.emit('feed:scrollToTop');

// FeedScreen'de
useEffect(() => {
  const listener = EventEmitter.on('feed:scrollToTop', () => {
    scrollToTop();
  });
  return () => listener.remove();
}, []);
```

**Avantajlar:**
- Decoupled
- Esnek

**Dezavantajlar:**
- Yeni bir dependency
- Type-safe değil

---

## 📝 Özet

### Mevcut Mimari

- **7 seviyeli nested navigator yapısı**
- **Context sadece FeedScreen seviyesinde**
- **TabNavigator seviyesinde context'e erişim yok**
- **Event listener çalışmıyor veya scroll çalışmıyor**

### Problem

- `tabPress` event FeedScreen'e ulaşmıyor veya scroll çalışmıyor
- Tüm scroll yöntemleri denendi ama hiçbiri çalışmıyor
- Root navigator ve bottom bar erişiminden kaynaklı olabilir

### Önerilen Çözüm

**En iyi çözüm: Çözüm 2 (Zustand Store)**

1. `useFeedStore` oluştur
2. `scrollToTop` function'ı store'da tut (ref'i closure'da)
3. TabNavigator'da store'dan `scrollToTop` al
4. `handleFeedTabPress` içinde çağır

**Alternatif: Çözüm 3 (Navigation Params)**

1. TabNavigator'da `navigation.navigate('FeedStack', { action: 'scrollToTop' })`
2. FeedScreen'de `route.params.action` kontrol et
3. `scrollToTop()` çağır
