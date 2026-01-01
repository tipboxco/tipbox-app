# Navigation Architecture - Detaylı Flow Dokümantasyonu

Bu doküman, Tipbox mobil uygulamasının nested navigator yapısını ve tüm ekran akışlarını detaylı olarak açıklar.

## 📋 İçindekiler

1. [Genel Mimari](#genel-mimari)
2. [Navigator Hiyerarşisi](#navigator-hiyerarşisi)
3. [Detaylı Flow Diyagramları](#detaylı-flow-diyagramları)
4. [Feature Navigator'lar](#feature-navigatorlar)
5. [Shared Screens](#shared-screens)
6. [Navigation Patterns](#navigation-patterns)
7. [Deep Linking](#deep-linking)

---

## 🏗️ Genel Mimari

Uygulama **4 seviyeli nested navigator** yapısı kullanır:

```
NavigationContainer (Root)
  └── DrawerNavigator
      └── MainNavigator
          ├── AuthNavigator (if not authenticated)
          └── TabNavigator (if authenticated)
              ├── FeedStackNavigator
              ├── ExploreStackNavigator
              ├── CatalogStackNavigator
              ├── EventsStackNavigator
              ├── NotificationStackNavigator
              └── InboxStackNavigator
          ├── SettingsNavigator
          └── MoreSchoiseNavigator
```

### Navigator Tipleri

- **DrawerNavigator**: Yan menü (drawer) navigator
- **MainNavigator**: Ana stack navigator (Auth/Tabs/Settings/MoreSchoise)
- **TabNavigator**: Alt tab bar navigator (6 tab)
- **Feature Stack Navigator'lar**: Her feature için stack navigator
- **Shared Screens**: Tüm feature stack'lerde paylaşılan ekranlar

---

## 📊 Navigator Hiyerarşisi

### Seviye 1: NavigationContainer

**Dosya:** `src/navigation/index.tsx`

```typescript
NavigationContainer
  ├── Deep Linking Support
  ├── Initial URL Handling (killed state)
  └── DrawerNavigator
```

**Özellikler:**
- Deep linking yönetimi
- Navigation ref export
- Initial URL handling

---

### Seviye 2: DrawerNavigator

**Dosya:** `src/navigation/DrawerNavigator.tsx`

```typescript
DrawerNavigator
  └── Main (Screen)
      └── MainNavigator
```

**Özellikler:**
- Drawer menu (CustomDrawerContent)
- Swipe gesture desteği
- Dark mode desteği
- Drawer width: 301px

---

### Seviye 3: MainNavigator

**Dosya:** `src/navigation/MainNavigator.tsx`

```typescript
MainNavigator
  ├── Auth (if !isAuthenticated)
  │   └── AuthNavigator
  └── Authenticated Screens (if isAuthenticated)
      ├── Tabs
      │   └── TabNavigator
      ├── Settings
      │   └── SettingsNavigator
      └── MoreSchoise
          └── MoreSchoiseNavigator
```

**Özellikler:**
- Authentication-based routing
- Conditional screen rendering
- Stack navigator

---

### Seviye 4: TabNavigator

**Dosya:** `src/navigation/TabNavigator.tsx`

```typescript
TabNavigator (Bottom Tab Bar)
  ├── FeedStack
  │   └── FeedStackNavigator
  ├── ExploreStack
  │   └── ExploreStackNavigator
  ├── CatalogStack
  │   └── CatalogStackNavigator
  ├── EventsStack
  │   └── EventsStackNavigator
  ├── NotificationStack
  │   └── NotificationStackNavigator
  └── InboxStack
      └── InboxStackNavigator
```

**Özellikler:**
- 6 tab (Feed, Explore, Catalog, Events, Notification, Inbox)
- Tab bar visibility kontrolü (useNavigationUIStore)
- Notification badge (unread count)
- Auto mark as read (notification tab'a tıklandığında)
- Tab bar height: iOS (45 + insets.bottom), Android (45 + insets.bottom)

**Tab Icons:**
- FeedStack: `home`
- ExploreStack: `search`
- CatalogStack: `grid`
- EventsStack: `calendar`
- NotificationStack: `bell` (with badge)
- InboxStack: `inbox`

---

## 🔄 Detaylı Flow Diyagramları

### Authentication Flow

```
App Start
  │
  ├─→ isAuthenticated = false
  │   └─→ MainNavigator
  │       └─→ AuthNavigator
  │           └─→ WelcomeScreen (initialRouteName)
  │               ├─→ Login
  │               ├─→ Register
  │               └─→ ...
  │
  └─→ isAuthenticated = true
      └─→ MainNavigator
          └─→ TabNavigator
              └─→ FeedStackNavigator
                  └─→ FeedScreen
```

### Tab Navigation Flow

```
TabNavigator
  │
  ├─→ FeedStack (Tab 1)
  │   └─→ FeedStackNavigator
  │       ├─→ FeedNavigator (initial)
  │       │   └─→ FeedScreen
  │       └─→ Shared Screens
  │           ├─→ Profile
  │           ├─→ Post
  │           ├─→ Notification
  │           ├─→ Bookmarks
  │           ├─→ Marketplace
  │           └─→ Wallet
  │
  ├─→ ExploreStack (Tab 2)
  │   └─→ ExploreStackNavigator
  │       ├─→ ExploreNavigator (initial)
  │       │   └─→ ExploreScreen
  │       └─→ Shared Screens
  │
  ├─→ CatalogStack (Tab 3)
  │   └─→ CatalogStackNavigator
  │       ├─→ CatalogNavigator (initial)
  │       │   └─→ CatalogScreen
  │       └─→ Shared Screens
  │
  ├─→ EventsStack (Tab 4)
  │   └─→ EventsStackNavigator
  │       ├─→ EventsNavigator (initial)
  │       │   └─→ EventsScreen
  │       └─→ Shared Screens
  │
  ├─→ NotificationStack (Tab 5)
  │   └─→ NotificationStackNavigator
  │       ├─→ NotificationsNavigator (initial)
  │       │   └─→ NotificationsScreen
  │       └─→ Shared Screens (except Notification)
  │
  └─→ InboxStack (Tab 6)
      └─→ InboxStackNavigator
          ├─→ InboxNavigator (initial)
          │   └─→ InboxScreen
          └─→ Shared Screens
```

### Shared Screens Flow

**Dosya:** `src/navigation/shared-screens.tsx`

Her feature stack navigator'da paylaşılan ekranlar:

```
FeatureStackNavigator
  ├─→ FeatureNavigator (initial)
  └─→ Shared Screens
      ├─→ Profile
      │   └─→ ProfileNavigator
      ├─→ Post
      │   └─→ PostNavigator
      ├─→ Notification (conditional)
      │   └─→ NotificationsNavigator
      ├─→ Bookmarks
      │   └─→ BookmarksNavigator
      ├─→ Marketplace
      │   └─→ MarketplaceNavigator
      └─→ Wallet
          └─→ WalletNavigator
```

**Not:** Notification screen, NotificationStackNavigator içinde exclude edilir (duplicate önlemek için).

---

## 📱 Feature Navigator'lar

### 1. AuthNavigator

**Dosya:** `src/features/auth/navigation.tsx`

**Type:** `AuthStackParamList`

**Screens:**
```
AuthNavigator
  ├─→ Welcome (initialRouteName)
  ├─→ Login
  ├─→ Register
  ├─→ ForgotPassword
  ├─→ VerifyCode
  ├─→ ResetPassword
  ├─→ SetupProfile (gestureEnabled: false)
  └─→ SelectCategories (gestureEnabled: false)
```

**Özellikler:**
- Initial route: `Welcome`
- Gesture enabled: true (default)
- Animation: `slide_from_right`
- SetupProfile ve SelectCategories: gesture disabled (back navigation yok)

---

### 2. FeedNavigator

**Dosya:** `src/features/feed/navigation.tsx`

**Type:** `FeedStackParamList`

**Screens:**
```
FeedNavigator
  └─→ FeedScreen
```

**Özellikler:**
- Tek ekran (FeedScreen)
- Gesture enabled: true

---

### 3. ExploreNavigator

**Dosya:** `src/features/explore/navigation.tsx`

**Type:** `ExploreStackParamList`

**Screens:**
```
ExploreNavigator
  └─→ ExploreMain (initialRouteName)
      └─→ ExploreScreen
```

**Özellikler:**
- Tek ekran (ExploreScreen)
- Initial route: `ExploreMain`

---

### 4. CatalogNavigator

**Dosya:** `src/features/catalog/navigation.tsx`

**Type:** `CatalogStackParamList`

**Screens:**
```
CatalogNavigator
  ├─→ CatalogScreen (initial)
  ├─→ BrandDetailScreen
  ├─→ BrandProductBookScreen
  ├─→ BrandProductDetailScreen
  ├─→ NewsDetailScreen
  ├─→ SurveyScreen
  ├─→ BrandEventsDetailScreen
  ├─→ BrandHistoryScreen
  ├─→ BrandSurveyListScreen
  ├─→ BrandPostListScreen
  └─→ BrandEventsScreen
```

**Parametreler:**
- `BrandDetailScreen`: `{ brandId: string }`
- `BrandProductBookScreen`: `{ brandId: string }`
- `BrandProductDetailScreen`: `{ productId: string }`
- `NewsDetailScreen`: `{ newsId: string }`
- `SurveyScreen`: `{ brandId: string }`

---

### 5. EventsNavigator

**Dosya:** `src/features/events/navigation.tsx`

**Type:** `EventsStackParamList`

**Screens:**
```
EventsNavigator
  ├─→ EventsScreen (initial)
  ├─→ EventDetail
  ├─→ RewardsBadges
  └─→ EventCreatePost
```

**Parametreler:**
- `EventDetail`: `{ eventId: string }`
- `EventCreatePost`: `{ eventId?: string; eventType?: EventType; product?: EventProduct; productSource?: 'Catalog' | 'Inventory' } | undefined`

---

### 6. NotificationsNavigator

**Dosya:** `src/features/notifications/navigation.tsx`

**Type:** `NotificationsStackParamList`

**Screens:**
```
NotificationsNavigator
  └─→ NotificationsScreen
```

**Özellikler:**
- Tek ekran (NotificationsScreen)
- Tab bar'da badge gösterimi
- Tab'a tıklandığında tüm bildirimler okundu olarak işaretlenir

---

### 7. InboxNavigator

**Dosya:** `src/features/inbox/navigation/index.tsx`

**Type:** `InboxStackParamList`

**Screens:**
```
InboxNavigator
  ├─→ InboxScreen (initial)
  ├─→ MessageDetailScreen
  └─→ SupportMessageDetail
```

**Parametreler:**
- `MessageDetailScreen`: 
  ```typescript
  {
    messageId: string;
    recipientUserId?: string;
    senderName: string;
    senderTitle: string;
    senderAvatar: any;
  }
  ```
- `SupportMessageDetail`:
  ```typescript
  {
    expertName: string;
    expertTitle: string;
    expertAvatar: any;
    userName?: string;
    userTitle?: string;
    userAvatar?: any;
    requestId?: string;
    recipientUserId?: string;
  }
  ```

---

### 8. PostNavigator

**Dosya:** `src/features/post/navigation.tsx`

**Type:** `PostStackParamList`

**Screens:**
```
PostNavigator
  ├─→ PostDetailScreen
  ├─→ PostsScreen
  ├─→ CreatePostScreen
  ├─→ CreateTipsAndTrickPostScreen
  ├─→ CreateQuestionPostScreen
  ├─→ CreateExperiencePostScreen
  ├─→ CreateBenchmarkPostScreen
  └─→ CreateUpdatePostScreen
```

**Parametreler:**
- `PostDetailScreen`: 
  ```typescript
  {
    postData: any;
    type: 'post' | 'tipsAndTricks' | 'question' | 'benchmark' | 'experience' | 'update';
    showRelatedPost?: boolean;
    relatedPostData?: any;
  }
  ```
- `PostsScreen`: 
  ```typescript
  {
    stage: 'SubCategories' | 'ProductGroup' | 'Product';
    name: string;
    productInfo: { image: any; title: string; subName?: string; };
    selectedProduct?: { id: string; name: string; description?: string; image: any; };
    contextType?: ProductInfoType;
    contextId?: string;
  }
  ```
- `CreatePostScreen`: 
  ```typescript
  {
    contextType?: ProductInfoType;
    contextId?: string;
    productInfo?: { image: any; title: string; subName?: string; };
  }
  ```
- `CreateExperiencePostScreen`: 
  ```typescript
  {
    product?: { id: string; name: string; description?: string; image: any; brand?: string };
    fromInventory?: boolean;
    experienceOption?: 'own' | 'tried';
  }
  ```
- `CreateBenchmarkPostScreen`: 
  ```typescript
  {
    product?: { id: string; name: string; description?: string; image: any };
  }
  ```
- `CreateUpdatePostScreen`: 
  ```typescript
  {
    product?: { id: string; name: string; description?: string; image: any; brand?: string };
  }
  ```

---

### 9. ProfileNavigator

**Dosya:** `src/features/profile/navigation.tsx`

**Type:** `ProfileStackParamList`

**Screens:**
```
ProfileNavigator
  ├─→ ProfileMain (initial)
  ├─→ ProfileEdit
  ├─→ InventoryList
  ├─→ InventoryDetail
  ├─→ TrustList
  ├─→ SuggestedUsers
  └─→ Collections
```

**Parametreler:**
- `ProfileMain`: `{ userId?: string } | undefined`
- `InventoryList`: `{ userId: string }`
- `InventoryDetail`: `{ itemId: string }`
- `TrustList`: `{ userId: string; initialTab?: 'trust' | 'truster' }`

**Özellikler:**
- ProfileMain: animation: 'none' (smooth transition için)
- Dark mode desteği

---

### 10. WalletNavigator

**Dosya:** `src/features/wallet/navigation.tsx`

**Type:** `WalletStackParamList`

**Screens:**
```
WalletNavigator
  ├─→ WalletConnection (conditional - if !isConnected)
  ├─→ WalletScreen
  ├─→ SwapScreen
  ├─→ NftAssetsScreen
  └─→ NftAssetDetailScreen
```

**Parametreler:**
- `NftAssetDetailScreen`: `{ nft: NftItem }`

**Özellikler:**
- Conditional rendering: Wallet bağlı değilse WalletConnection gösterilir
- WalletService ile bağlantı durumu kontrol edilir
- Dynamic initial route

---

### 11. SettingsNavigator

**Dosya:** `src/features/settings/navigation.tsx`

**Type:** `SettingsStackParamList`

**Screens:**
```
SettingsNavigator
  ├─→ SettingsScreen (initialRouteName)
  ├─→ ForgotPassword
  ├─→ NotificationSettings
  ├─→ PrivacySettings
  ├─→ SupportSettings
  └─→ PaymentAndSubscription
```

**Özellikler:**
- Header gösterimi: true
- Dark mode desteği
- Gesture enabled: true

---

### 12. MoreSchoiseNavigator

**Dosya:** `src/features/moreSchoise/navigation.tsx`

**Type:** `MoreSchoiseStackParamList`

**Screens:**
```
MoreSchoiseNavigator
  └─→ MoreSchoiseScreen (initialRouteName)
```

**Özellikler:**
- Tek ekran (MoreSchoiseScreen)
- Header gösterimi: false
- Gesture enabled: true

---

### 13. BookmarksNavigator

**Dosya:** `src/features/bookmarks/navigation.tsx`

**Type:** `BookmarksStackParamList`

**Screens:**
```
BookmarksNavigator
  └─→ BookMarksScreen
```

**Özellikler:**
- Tek ekran (BookMarksScreen)
- Shared screen olarak kullanılır

---

### 14. MarketplaceNavigator

**Dosya:** `src/features/marketplace/navigation.tsx`

**Type:** `MarketplaceStackParamList`

**Screens:**
```
MarketplaceNavigator
  ├─→ MarketPlaceScreen
  ├─→ SelectNFTScreen
  └─→ NFTDetailScreen
```

**Parametreler:**
- `NFTDetailScreen`: `{ nftData: UserNFT }`

**Özellikler:**
- Shared screen olarak kullanılır

---

## 🔗 Shared Screens

**Dosya:** `src/navigation/shared-screens.tsx`

Shared screens, `buildFeatureStack` fonksiyonu ile her feature stack navigator'a otomatik olarak eklenir.

**Shared Screens Listesi:**
1. **Profile** → ProfileNavigator
2. **Post** → PostNavigator
3. **Notification** → NotificationsNavigator (conditional - NotificationStackNavigator'da exclude edilir)
4. **Bookmarks** → BookmarksNavigator
5. **Marketplace** → MarketplaceNavigator
6. **Wallet** → WalletNavigator

**Kullanım:**
```typescript
// buildFeatureStack fonksiyonu
export const buildFeatureStack = (
  initialScreenName: string,
  initialComponent: React.ComponentType<any>
) => {
  return () => (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialScreenName}
    >
      <Stack.Screen name={initialScreenName} component={initialComponent} />
      {registerSharedScreens(initialScreenName)}
    </Stack.Navigator>
  );
};
```

**Örnek:**
```typescript
// FeedStackNavigator
<Stack.Navigator>
  <Stack.Screen name="Feed" component={FeedNavigator} />
  <Stack.Screen name="Profile" component={ProfileNavigator} />
  <Stack.Screen name="Post" component={PostNavigator} />
  <Stack.Screen name="Notification" component={NotificationsNavigator} />
  <Stack.Screen name="Bookmarks" component={BookmarksNavigator} />
  <Stack.Screen name="Marketplace" component={MarketplaceNavigator} />
  <Stack.Screen name="Wallet" component={WalletNavigator} />
</Stack.Navigator>
```

---

## 🎯 Navigation Patterns

### 1. Feature-Based Navigation

Her feature kendi navigator'ına sahiptir:
- `src/features/<featureName>/navigation.tsx`
- Feature-specific screens
- Feature-specific types

### 2. Shared Screens Pattern

Ortak ekranlar (Profile, Post, vb.) tüm feature stack'lerde paylaşılır:
- `buildFeatureStack` ile otomatik eklenir
- Duplicate önlenir (Notification screen exclude edilir)

### 3. Conditional Navigation

**Authentication-based:**
```typescript
{!isAuthenticated ? (
  <Stack.Screen name="Auth" component={AuthNavigator} />
) : (
  <>
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="Settings" component={SettingsNavigator} />
  </>
)}
```

**State-based:**
```typescript
// WalletNavigator
{!isConnected && (
  <Stack.Screen name="WalletConnection" component={WalletConnection} />
)}
```

### 4. Nested Navigation

**Örnek: Feed → Post → PostDetail**
```
FeedStackNavigator
  └─→ FeedNavigator
      └─→ FeedScreen
          └─→ (navigate to Post)
              └─→ PostNavigator
                  └─→ PostDetailScreen
```

**Navigation Path:**
```typescript
navigation.navigate('Post', {
  screen: 'PostDetailScreen',
  params: { postData, type: 'post' }
});
```

---

## 🔗 Deep Linking

**Dosya:** `src/navigation/index.tsx`

**Deep Link Support:**
- Initial URL handling (killed state)
- URL change listener (foreground state)
- DeepLinkService entegrasyonu

**URL Format:**
```
tipboxapp://<screen>/<params>
```

**Örnekler:**
- `tipboxapp://post/123` → PostDetailScreen
- `tipboxapp://user/456` → ProfileScreen
- `tipboxapp://notifications` → NotificationsScreen
- `tipboxapp://inbox/thread/789` → MessageDetailScreen

---

## 📐 Type Safety

**Dosya:** `src/navigation/navigation.types.ts`

Tüm navigator'lar TypeScript ile tip güvenli:

```typescript
// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
  MoreSchoise: NavigatorScreenParams<MoreSchoiseStackParamList>;
  Wallet: NavigatorScreenParams<WalletStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

// Main Stack
export type MainStackParamList = {
  Feed: NavigatorScreenParams<FeedStackParamList>;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Catalog: NavigatorScreenParams<CatalogStackParamList>;
  Events: NavigatorScreenParams<EventsStackParamList>;
  Notification: NavigatorScreenParams<NotificationsStackParamList>;
  Inbox: NavigatorScreenParams<InboxStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Post: NavigatorScreenParams<PostStackParamList>;
  Bookmarks: NavigatorScreenParams<BookmarksStackParamList>;
  Marketplace: NavigatorScreenParams<MarketplaceStackParamList>;
  Wallet: NavigatorScreenParams<WalletStackParamList>;
};
```

---

## 🎨 UI/UX Özellikleri

### Tab Bar

- **Visibility Control**: `useNavigationUIStore` ile dinamik kontrol
- **Badge**: Notification tab'da unread count badge
- **Auto Mark as Read**: Notification tab'a tıklandığında tüm bildirimler okundu olarak işaretlenir
- **Height**: iOS (45 + insets.bottom), Android (45 + insets.bottom)
- **Icons**: Feather icons kullanılır

### Drawer

- **Width**: 301px
- **Swipe Gesture**: Enabled (edge width: 50px)
- **Dark Mode**: Desteklenir
- **Custom Content**: CustomDrawerContent component

### Screen Options

- **Header**: Genellikle false (custom header kullanılır)
- **Gesture**: Genellikle true (back gesture)
- **Animation**: Default (slide_from_right)
- **Dark Mode**: Tüm navigator'larda desteklenir

---

## 🔄 Navigation Flow Örnekleri

### Örnek 1: Feed'den Post Detail'e Gitme

```
1. FeedScreen (FeedStackNavigator)
   │
   └─→ navigate('Post', {
         screen: 'PostDetailScreen',
         params: { postData, type: 'post' }
       })
   │
   └─→ PostNavigator (Shared Screen)
       │
       └─→ PostDetailScreen
```

### Örnek 2: Profile'dan Inventory'e Gitme

```
1. ProfileScreen (ProfileNavigator)
   │
   └─→ navigate('InventoryList', { userId: '123' })
   │
   └─→ InventoryScreen
```

### Örnek 3: Notification'dan Post'a Gitme

```
1. NotificationsScreen (NotificationStackNavigator)
   │
   └─→ navigate('Post', {
         screen: 'PostDetailScreen',
         params: { postData, type: 'post' }
       })
   │
   └─→ PostNavigator (Shared Screen)
       │
       └─→ PostDetailScreen
```

### Örnek 4: Catalog'dan Brand Detail'e Gitme

```
1. CatalogScreen (CatalogNavigator)
   │
   └─→ navigate('BrandDetailScreen', { brandId: '123' })
   │
   └─→ BrandDetailScreen
```

---

## 📝 Özet

### Navigator Sayıları

- **Toplam Navigator**: 14
- **Tab Navigator**: 6
- **Shared Screens**: 6
- **Toplam Screen**: 50+

### Navigator Tipleri

- **DrawerNavigator**: 1
- **StackNavigator**: 13
- **TabNavigator**: 1

### Özellikler

✅ **Type-Safe Navigation**: Tüm navigator'lar TypeScript ile tip güvenli  
✅ **Feature-Based**: Her feature kendi navigator'ına sahip  
✅ **Shared Screens**: Ortak ekranlar paylaşılır  
✅ **Conditional Navigation**: Authentication ve state-based routing  
✅ **Deep Linking**: URL-based navigation desteği  
✅ **Dark Mode**: Tüm navigator'larda desteklenir  
✅ **Gesture Support**: Back gesture desteği  

---

## 🔗 İlgili Dosyalar

- `src/navigation/index.tsx` - Root NavigationContainer
- `src/navigation/DrawerNavigator.tsx` - Drawer Navigator
- `src/navigation/MainNavigator.tsx` - Main Stack Navigator
- `src/navigation/TabNavigator.tsx` - Tab Bar Navigator
- `src/navigation/build-stack.tsx` - Feature Stack Builder
- `src/navigation/shared-screens.tsx` - Shared Screens Registry
- `src/navigation/navigation.types.ts` - Type Definitions
- `src/features/*/navigation.tsx` - Feature Navigators

---

## 📚 Notlar

1. **buildFeatureStack**: Her feature stack navigator'ı otomatik olarak shared screens ile oluşturur
2. **registerSharedScreens**: Shared screens'leri feature stack'lere ekler (exclude parametresi ile conditional)
3. **Navigation Ref**: `src/providers/NotificationProvider.tsx` içinde export edilir
4. **Deep Linking**: `src/services/DeepLinkService` ile yönetilir
5. **Tab Bar Visibility**: `useNavigationUIStore` ile global state'ten kontrol edilir

---

*Son Güncelleme: 2026-01-01*

