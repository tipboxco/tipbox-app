---
name: Custom Drawer Overlay Migration
overview: React Navigation Drawer'ı custom overlay'a (Reanimated + GestureHandler) dönüştürme ve production-grade navigation kurallarını uygulama
todos:
  - id: create-drawer-store
    content: Zustand drawer store oluştur (src/store/drawerStore.ts) - isOpen, openDrawer, closeDrawer, toggleDrawer actions. Navigation state ile senkronize edilmeyecek.
    status: completed
  - id: create-drawer-overlay
    content: Custom DrawerOverlay component oluştur (src/components/CustomDrawer/DrawerOverlay.tsx) - Reanimated + GestureHandler ile native thread animasyon, her zaman mounted, pan gesture desteği
    status: completed
    dependencies:
      - create-drawer-store
  - id: create-drawer-content
    content: DrawerContent component oluştur (src/components/CustomDrawer/DrawerContent.tsx) - Mevcut CustomDrawerContent'ten drawer store kullanacak şekilde refactor
    status: completed
    dependencies:
      - create-drawer-store
  - id: create-drawer-gesture-hook
    content: useDrawerGestureEnabled hook oluştur (src/hooks/useDrawerGestureEnabled.ts) - Stack depth === 1 kontrolü ile drawer gesture scope yönetimi
    status: completed
  - id: update-root-navigator
    content: RootNavigator'ı güncelle - DrawerNavigator'ı kaldır, MainDrawer yerine MainTabs ekle, Modal ve Overlay ekranlarını ayrı Stack.Group'lara ayır
    status: completed
  - id: update-navigation-wrapper
    content: Navigation wrapper'ı güncelle (src/navigation/index.tsx) - DrawerOverlay'ı NavigationContainer dışında overlay olarak ekle
    status: completed
    dependencies:
      - create-drawer-overlay
      - create-drawer-content
  - id: update-header-component
    content: Header component'i güncelle - navigation.openDrawer() yerine useDrawerStore().openDrawer() kullan
    status: completed
    dependencies:
      - create-drawer-store
  - id: update-feed-screen
    content: FeedScreen'i güncelle - Drawer açıkken carousel'ı disable et, drawer state kontrolü ekle
    status: completed
    dependencies:
      - create-drawer-store
  - id: create-freeze-rules
    content: Navigation freeze kuralları dosyası oluştur (src/navigation/rules/freezeRules.ts) - Ekran türüne göre mount/unmount/freeze kuralları
    status: completed
  - id: update-tab-navigator
    content: "TabNavigator'ı güncelle - Heavy tab'lerde freezeOnBlur: true ekle (Catalog, Events)"
    status: completed
    dependencies:
      - create-freeze-rules
  - id: remove-drawer-navigator
    content: DrawerNavigator.tsx dosyasını kaldır (artık custom overlay kullanılıyor)
    status: completed
    dependencies:
      - update-root-navigator
      - update-navigation-wrapper
---

#Custom Drawer Overlay Migration ve Production-Grade Navigation Kuralları

## Mevcut Durum Analizi

- **DrawerNavigator**: React Navigation Drawer kullanıyor (`createDrawerNavigator`)
- **RootNavigator**: MainDrawer içinde TabNavigator var
- **Modal/Overlay**: RootNavigator'da tanımlı (Post, Profile, MessageDetail)
- **Carousel**: Gesture arbitration mekanizması mevcut (FeedListContext)

## Hedef Mimari

```javascript
NavigationContainer
  └── RootStack
      ├── Auth (if !authenticated)
      └── MainTabs (if authenticated) ← Tab'lar en üstte
          ├── FeedStack
          ├── ExploreStack
          ├── CatalogStack
          ├── EventsStack
          ├── NotificationStack
          └── InboxStack
      ├── Modal Screens (presentation: 'modal')
      └── Overlay Screens (presentation: 'transparentModal')
      
+ Custom Drawer Overlay (Reanimated + GestureHandler)
```



## Yapılacak Değişiklikler

### 1. Drawer Store Oluşturma (`src/store/drawerStore.ts`)

- Zustand store ile drawer state yönetimi
- `isOpen`, `openDrawer`, `closeDrawer`, `toggleDrawer` actions
- Navigation state ile ASLA senkronize edilmeyecek (kural)

### 2. Custom Drawer Overlay Component (`src/components/CustomDrawer/DrawerOverlay.tsx`)

- Reanimated + GestureHandler ile native thread animasyon
- Drawer her zaman mounted (pointerEvents + opacity ile kontrol)
- Pan gesture ile swipe desteği
- Dark overlay ile backdrop
- Drawer width: %85 (Twitter benzeri)

### 3. Drawer Content Component (`src/components/CustomDrawer/DrawerContent.tsx`)

- Mevcut `CustomDrawerContent.tsx`'i drawer store kullanacak şekilde güncelleme
- React Navigation drawer props'larını kaldırma
- Zustand store'dan drawer state okuma

### 4. RootNavigator Güncelleme (`src/navigation/stacks/RootNavigator.tsx`)

- `DrawerNavigator`'ı kaldırma
- `MainDrawer` yerine direkt `MainTabs` (TabNavigator)
- Modal ve Overlay ekranlarını ayrı Stack.Group'lara ayırma

### 5. Navigation Wrapper (`src/navigation/index.tsx`)

- DrawerOverlay'ı NavigationContainer dışında, overlay olarak ekleme
- Drawer state'i navigation state'inden tamamen bağımsız

### 6. Drawer Gesture Scope Kontrolü

- Drawer gesture sadece root tab ekranlarında aktif
- Stack depth === 1 kontrolü (back gesture çakışmasını önlemek için)
- `src/hooks/useDrawerGestureEnabled.ts` hook'u oluşturma

### 7. Header Drawer Button (`src/components/Header/index.tsx`)

- `navigation.openDrawer()` yerine `useDrawerStore().openDrawer()` kullanma

### 8. Feed + Carousel Gesture Çakışması

- Drawer açıkken carousel'ı disable etme
- `FeedScreen`'de drawer state kontrolü

### 9. Navigation Freeze Kuralları

- `src/navigation/rules/freezeRules.ts` dosyası oluşturma
- Ekran türüne göre mount/unmount/freeze kuralları:
- Feed: always mounted
- Tab root: mounted
- Stack detail: unmountOnBlur
- Modal: unmount
- Overlay: freeze background

### 10. Tab Navigator Optimizasyonları

- `lazy: true` (zaten var)
- `unmountOnBlur: false` (zaten var)
- Heavy tab'lerde `freezeOnBlur: true` ekleme (Catalog, Events)

## Kritik Kurallar

1. **Drawer State Isolation**: Drawer state navigation state ile ASLA senkronize edilmeyecek
2. **Drawer Gesture Scope**: Sadece root tab ekranlarında (stack depth === 1)
3. **Drawer Mount Strategy**: Drawer her zaman mounted, sadece translate edilir
4. **Back Gesture Priority**: Stack back gesture drawer gesture'dan öncelikli (nested screens'de)
5. **Vertical Scroll Priority**: Feed scroll her zaman drawer gesture'dan öncelikli

## Dosya Değişiklikleri

### Yeni Dosyalar

- `src/store/drawerStore.ts`
- `src/components/CustomDrawer/DrawerOverlay.tsx`
- `src/components/CustomDrawer/DrawerContent.tsx` (yeniden yazılacak)
- `src/hooks/useDrawerGestureEnabled.ts`
- `src/navigation/rules/freezeRules.ts`

### Güncellenecek Dosyalar

- `src/navigation/stacks/RootNavigator.tsx` - DrawerNavigator kaldırılacak
- `src/navigation/TabNavigator.tsx` - Freeze kuralları eklenecek
- `src/navigation/index.tsx` - DrawerOverlay eklenecek
- `src/components/Header/index.tsx` - Drawer store kullanımı
- `src/features/feed/screens/FeedScreen.tsx` - Drawer state kontrolü

### Kaldırılacak Dosyalar

- `src/navigation/DrawerNavigator.tsx` (custom overlay'a geçildiği için)

## Test Senaryoları

1. Drawer swipe gesture (root tab ekranlarında)
2. Drawer swipe gesture (nested screens'de - disabled olmalı)
3. Drawer button click
4. Drawer + Carousel gesture çakışması
5. Drawer + Feed scroll çakışması