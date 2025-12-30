# @gorhom/bottom-sheet Kullanım Listesi

Bu dosya projede `@gorhom/bottom-sheet` kütüphanesinin kullanıldığı tüm yerleri içermektedir.

## 📊 Özet
- **Toplam Dosya Sayısı**: 29 dosya
- **Toplam Kullanım**: 365+ referans

---

## 📁 Screen Dosyaları (15 dosya)

### Feed Feature
1. **`src/features/feed/screens/FeedScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 18 referans

### Post Feature
2. **`src/features/post/screens/CreateBenchmarkPostScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 15 referans

3. **`src/features/post/screens/PostsScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 22 referans

4. **`src/features/post/screens/CreateExperiencePostScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 17 referans
   - Özel: Split Experience dialog için bottom sheet kullanımı

### Catalog Feature
5. **`src/features/catalog/screens/ProductCatalogScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 24 referans

### Profile Feature
6. **`src/features/profile/screens/Trust_TrusterListScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`
   - Kullanım: 11 referans

7. **`src/features/profile/screens/InventoryScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 24 referans

8. **`src/features/profile/screens/CollectionsScreen.tsx`**
   - Import: `BottomSheet` ve diğer componentler
   - Kullanım: 19 referans

### Wallet Feature
9. **`src/features/wallet/screens/WalletScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 40 referans

10. **`src/features/wallet/screens/SwapScreen.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
   - Kullanım: 8 referans

### Inbox Feature
11. **`src/features/inbox/screens/MessageDetail.tsx`**
    - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
    - Kullanım: 31 referans

### Settings Feature
12. **`src/features/settings/screens/PaymentAndSubscriptionScreen.tsx`**
    - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
    - Kullanım: 16 referans

13. **`src/features/settings/screens/SettingsScreen.tsx`**
    - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
    - Kullanım: 35 referans

### Events Feature
14. **`src/features/events/screens/EventCreatePost.tsx`**
    - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`, `BottomSheetBackdropProps`
    - Kullanım: 17 referans

### Profile Components
15. **`src/features/profile/components/TabContents/LadderTab.tsx`**
    - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetBackdrop`
    - Kullanım: 10 referans

---

## 🧩 Component Dosyaları (14 dosya)

### Shared Components
1. **`src/components/CommentsBottomSheet/index.tsx`**
   - Import: `BottomSheet`, `BottomSheetView`, `BottomSheetTextInput`
   - Kullanım: 10 referans
   - Özel: Portal kullanımı var

2. **`src/components/CreatePostBottomSheet/index.tsx`**
   - Kullanım: 2 referans

3. **`src/components/ExpertBottomSheet/index.tsx`**
   - Kullanım: 4 referans

### Wallet Components
4. **`src/features/wallet/components/SendFriendBottomSheet/index.tsx`**
   - Kullanım: 2 referans

5. **`src/features/wallet/components/SendBottomSheet/index.tsx`**
   - Kullanım: 15 referans

6. **`src/features/wallet/components/ClaimBottomSheet/index.tsx`**
   - Kullanım: 2 referans

### Settings Components
7. **`src/features/settings/components/YourDevicesBottomSheet/index.tsx`**
   - Kullanım: 3 referans

8. **`src/features/settings/components/ChangePasswordBottomSheet/index.tsx`**
   - Kullanım: 3 referans

9. **`src/features/settings/components/AddPaymentMethodBottomSheet/index.tsx`**
   - Kullanım: 3 referans

### Inbox Components
10. **`src/features/inbox/components/SendTipsBottomSheet/index.tsx`**
    - Kullanım: 4 referans

11. **`src/features/inbox/components/OneOnOneSupportBottomSheet/index.tsx`**
    - Kullanım: 4 referans

### Events Components
12. **`src/features/events/components/CreateEventPostBottomSheet/index.tsx`**
    - Kullanım: 4 referans

### Type Definitions
13. **`src/components/CommentsBottomSheet/types.ts`**
    - Kullanım: 1 referans (tip tanımlaması)

### Mock Data
14. **`src/mock/common/comments.ts`**
    - Kullanım: 1 referans (mock data)

---

## 📦 Kullanılan Componentler

### Ana Componentler
- `BottomSheet` - Ana bottom sheet componenti
- `BottomSheetView` - Bottom sheet içeriği için container
- `BottomSheetBackdrop` - Backdrop (arka plan) componenti
- `BottomSheetBackdropProps` - Backdrop props tipi
- `BottomSheetTextInput` - Text input componenti (CommentsBottomSheet'te kullanılıyor)

### Portal Kullanımı
- `@gorhom/portal` - CommentsBottomSheet'te Portal ile kullanılıyor

---

## 📈 Kullanım İstatistikleri

### En Çok Kullanılan Dosyalar
1. **WalletScreen.tsx** - 40 referans
2. **MessageDetail.tsx** - 31 referans
3. **SettingsScreen.tsx** - 35 referans
4. **ProductCatalogScreen.tsx** - 24 referans
5. **InventoryScreen.tsx** - 24 referans

### Feature Bazında Dağılım
- **Wallet**: 3 screen + 3 component = 6 dosya
- **Settings**: 2 screen + 3 component = 5 dosya
- **Profile**: 3 screen + 1 component = 4 dosya
- **Post**: 3 screen = 3 dosya
- **Inbox**: 1 screen + 2 component = 3 dosya
- **Events**: 1 screen + 1 component = 2 dosya
- **Feed**: 1 screen = 1 dosya
- **Catalog**: 1 screen = 1 dosya
- **Shared Components**: 3 component = 3 dosya

---

## 🔍 Notlar

- Tüm bottom sheet kullanımları `useRef` ile yönetiliyor
- `snapPoints` genellikle `useMemo` ile optimize ediliyor
- `BottomSheetBackdrop` custom backdrop için kullanılıyor
- `CommentsBottomSheet` Portal kullanarak render ediliyor
- Bazı dosyalarda `BottomSheetTextInput` kullanılıyor (özellikle yorum ekleme için)

---

*Son güncelleme: Bu liste otomatik olarak oluşturulmuştur.*

