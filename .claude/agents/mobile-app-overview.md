# Tipbox Mobile App – Hızlı Genel Bakış

Bu doküman, Claude Code'un mobil uygulama tarafını hızlıca anlaması için özet bilgi içerir.

---

## 1. Teknoloji Özeti

| Alan | Teknoloji |
|------|-----------|
| Framework | **React Native** + **Expo** (SDK 54, dev client) |
| Dil | **TypeScript** |
| UI | **Gluestack** (tüm bileşenler), **NativeWind** (Tailwind), **@gorhom/bottom-sheet** |
| HTTP | **Axios** (tek singleton: `apiService.getClient()`) |
| Veri / Cache | **React Query** (TanStack Query v5) |
| State | **Zustand** (persist + devtools), feature bazlı store'lar |
| Auth | **JWT** (Access + Refresh), **Expo SecureStore**, **Auth0** entegrasyonu |
| Navigasyon | **React Navigation v7** (Native Stack, Bottom Tabs, Drawer) |

---

## 2. Klasör Yapısı (Feature-Based)

```
src/
├── config/              # api.config, auth0, firebase, notification, imagePicker
├── features/            # Her domain kendi feature klasöründe
│   └── <featureName>/
│       ├── api/         # <feature>Api.ts (endpoint fonksiyonları), hooks.ts (React Query)
│       ├── components/  # Feature'a özel UI
│       ├── screens/     # Ekranlar
│       ├── navigation.tsx  # Feature navigator (stack)
│       ├── index.ts     # Public export
│       └── store/       # (opsiyonel) Feature Zustand store
├── navigation/         # Root: RootNavigator, Drawer, Tab, linking, types
├── providers/          # QueryProvider, AuthProvider, ComposedProviders, Notification, Socket, vb.
├── services/           # ApiService, TokenService, Auth0, DeepLink, Notification, Socket, vb.
├── store/              # Global Zustand: appStore, drawerStore, notificationStore, navigationUIStore
├── components/         # Paylaşılan UI (ui/, GlobalUIHost, GlobalBottomSheet, vb.)
├── hooks/              # useColorMode, useAuthStatus, vb.
├── types/              # Ortak tip tanımları
└── utils/              # Icon mapper, navigation helpers, vb.
```

**Önemli:** Tüm HTTP istekleri `src/services/ApiService` üzerinden tek Axios instance ile yapılır; feature'lar kendi `api/<feature>Api.ts` dosyalarında sadece endpoint fonksiyonları yazar ve `apiService.getClient()` kullanır.

---

## 3. Başlangıç ve Provider Sırası

**App.tsx** sırası:

1. `QueryProvider` (React Query)
2. `AppProviders` (ComposedProviders):
   - QueryProvider, AuthProvider, AppStateProvider, SafeAreaProvider, NotificationProvider, SocketProvider
3. `AppInner`:
   - `GestureHandlerRootView` → `GluestackProvider` → `PortalProvider` → `BottomSheetModalProvider` → `Navigation`
   - Splash screen, auth ready sonrası kapatılır; Android navigation bar tema ile ayarlanır.

**Navigation** (`src/navigation/index.tsx`):

- `NavigationProvider` → `NavigationInner`
- `NavigationContainer` içinde: `ScrollProvider`, `BottomSheetModalProvider`, `GlobalBottomSheetProvider`, `KeyboardProvider` → `RootNavigator`, `GlobalBottomSheet`
- Deep link: `DeepLinkService` + `NavigationService` ile ilk URL ve URL listener işlenir; pending notification navigation `onReady` / `onStateChange` ile consume edilir.

---

## 4. Navigasyon Mimarisi (Flat / Twitter-Instagram Modeli)

- **RootNavigator** (`stacks/RootNavigator.tsx`):
  - Giriş yoksa: `Auth` → AuthNavigator
  - Giriş varsa:
    - **App**: `AppDrawerNavigator` (tab’lerin ve drawer’ın temeli)
    - **DetailsGroup** (card, sağdan slide): Post, Profile, Bookmarks, Marketplace, Event, News, Brand, MessageDetail, SupportMessageDetail, ProductSelect
    - **Wallet**: fullScreenModal
    - **Settings**: card
    - **MoreSchoise**: modal
- **AppDrawerNavigator**: Drawer → içinde **TabNavigator** (Feed, Explore, Catalog, Events, Notification, Inbox).
- Her tab kendi stack’ine sahip (örn. Feed → FeedNavigator); detay ekranları çoğunlukla **Root** seviyede açılır (Post, Profile, Wallet, vb.).

Tab route sabitleri: `src/navigation/constants/tabRoutes.ts` (`TAB_ROUTES`).

---

## 5. API ve React Query Kuralları

- **API**: Tek client `src/services/ApiService/index.ts` → `apiService.getClient()`. Base URL ve timeout `src/config/api.config.ts` (`API_CONFIG`).
- **Interceptors** (`ApiService/interceptors.ts`):
  - Request: Access token `Authorization: Bearer <token>` eklenir (memory cache + TokenService fallback).
  - Response: 401’de refresh token ile yeniden deneme; refresh başarısızsa logout (token temizleme).
- **Feature API**: `src/features/<feature>/api/<feature>Api.ts` → sadece `apiService.getClient()` ile istek atan fonksiyonlar; tip ve response modelleri burada veya ortak `types`’ta.
- **React Query**: `src/features/<feature>/api/hooks.ts` → `useQuery`, `useMutation`, `useInfiniteQuery`; query key’ler feature’a özel (örn. `feedKeys.feed(...)`). Mutation sonrası ilgili query’ler `queryClient.invalidateQueries` ile invalidate edilir.

---

## 6. Auth Akışı

- **TokenService** (`src/services/TokenService`): Access / Refresh token ve güvenli kullanıcı bilgisi **Expo SecureStore** ile; Access token memory cache (interceptor ile uyumlu).
- **AuthProvider**: Oturum durumu, token yenileme ve “auth ready” yönetimi.
- **useAuthStatus**: Giriş yapılmış mı (RootNavigator’da kullanılır).
- 401 → Interceptor refresh dener → başarısızsa token temizlenir ve logout.

---

## 7. Önemli Servisler

- **NavigationService**: Tip-güvenli navigate, nested tab/drawer, pending queue (deep link / notification).
- **DeepLinkService**: İlk URL, URL listener, parse → route → NavigationService.
- **NotificationService / ExpoNotificationService**: Bildirimler, notification’dan ekrana yönlendirme, pending navigation.
- **SocketService**: Real-time (provider ile sarılı).

---

## 8. State (Zustand)

- **Global** (`src/store/`): `appStore` (auth, user busy, vb.), `drawerStore`, `notificationStore`, `navigationUIStore`.
- **Feature** (opsiyonel): `src/features/<feature>/store/` veya `slice/` (örn. catalog, post create flow, profile, wallet).

---

## 9. Feature Listesi (Kısa)

- **auth**: Login, Register, Onboarding, Forgot/Reset password, VerifyCode, SetupProfile, SelectAvatar, SelectCategories.
- **feed**: FeedScreen, infinite feed, filtreler; FeedStack içinde Wallet ekranları da var.
- **explore**: ExploreScreen, Hottest/News tab.
- **catalog**: Brand / News navigator’lar; marka, ürün, haber ekranları.
- **events**: EventsScreen, koleksiyonlar, etkinlik oluşturma, rozetler.
- **post**: Post oluşturma (deneyim vb.), CreateExperienceSteps.
- **profile**: ProfileScreen, ProfileEdit, Inventory, Collections, Trust/Truster list, SuggestedUsers, Badge.
- **wallet**: WalletScreen, Swap, NFT list/detail/transfer, bağlantı.
- **inbox**: Mesaj listesi, MessageDetail, SupportMessageDetail.
- **notifications**: NotificationsScreen.
- **marketplace**: MarketplaceScreen, NFT satış/satın alma.
- **bookmarks**: Bookmarks ekranı.
- **settings**: Ayarlar navigator.
- **moreSchoise**: MoreSchoiseScreen (OTA, Media, Notification, Settings tab’ları).

---

## 10. UI ve Stil

- **Gluestack**: Tüm temel bileşenler `@/src/components/ui` (GluestackProvider ile).
- **Bottom sheet**: `@gorhom/bottom-sheet` + `GlobalBottomSheetProvider` / `GlobalBottomSheet`.
- **Portal**: `@gorhom/portal` (GluestackProvider altında).
- Renk / tema: `useColorMode` (dark/light), StatusBar ve Android navigation bar buna göre.

---

## 11. Nereye Bakılır (Hızlı Referans)

| İhtiyaç | Dosya / Klasör |
|--------|-----------------|
| API base URL, timeout | `src/config/api.config.ts` |
| HTTP client, interceptors | `src/services/ApiService/` |
| Token, SecureStore | `src/services/TokenService/` |
| Root navigator, auth branch | `src/navigation/stacks/RootNavigator.tsx` |
| Tab isimleri | `src/navigation/constants/tabRoutes.ts` |
| Drawer + Tab yapısı | `src/navigation/DrawerNavigator.tsx`, `TabNavigator.tsx` |
| Bir feature’ın API’si | `src/features/<feature>/api/<feature>Api.ts` |
| Bir feature’ın React Query hook’ları | `src/features/<feature>/api/hooks.ts` |
| Bir feature’ın ekranları ve stack’i | `src/features/<feature>/screens/`, `navigation.tsx` |
| Global state | `src/store/` |
| Provider sırası | `App.tsx`, `src/providers/ComposedProviders.tsx` |

Bu doküman, proje kuralları (`.cursor/rules/tipbox-app-rules.mdc`) ile birlikte okunduğunda mobil taraftaki kararlar ve konumlar hızlıca bulunabilir.
