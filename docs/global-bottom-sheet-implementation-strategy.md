# Global Bottom Sheet Manager - Detaylı Implementasyon Stratejisi

## 📋 İçindekiler
1. [Mevcut Durum Analizi](#mevcut-durum-analizi)
2. [Teknik Araştırma](#teknik-araştırma)
3. [Mimari Tasarım](#mimari-tasarım)
4. [Adım Adım Implementasyon Planı](#adım-adım-implementasyon-planı)
5. [Migration Stratejisi](#migration-stratejisi)
6. [Test Planı](#test-planı)

---

## 🔍 Mevcut Durum Analizi

### Kullanılan Kütüphane
- **@gorhom/bottom-sheet**: v5.2.3
- **BottomSheetModalProvider**: App.tsx'te mevcut
- **PortalProvider**: App.tsx'te mevcut

### Ortak Bottom Sheet Pattern'leri

#### 1. Ortak Props
```typescript
{
  index: -1,                                    // Kapalı başla
  enablePanDownToClose: true,                  // Aşağı çekerek kapat
  enableOverDrag: false,                        // Sınır ötesi esneme kapalı
  enableHandlePanningGesture: true,            // Handle sürükleme açık
  enableContentPanningGesture: true,            // İçerikten sürükleme açık
  enableDynamicSizing: true/false,              // Dinamik boyutlandırma (bazılarında)
  animateOnMount: true,                         // Mount animasyonu
  backdropComponent: renderBackdrop,            // Backdrop component
  onChange: handleSheetChanges,                // Değişiklik callback'i
}
```

#### 2. Ortak Style'lar
```typescript
backgroundStyle: {
  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
}

handleStyle: {
  backgroundColor: isDark ? '#1A1A1A' : '#FDFDFB',
  borderTopLeftRadius: 30,
  borderTopRightRadius: 30,
}

handleIndicatorStyle: {
  backgroundColor: isDark ? '#333333' : '#CCCCCC',
  width: 40-70,
  height: 4-5,
}
```

#### 3. Backdrop Pattern
```typescript
const renderBackdrop = useCallback(
  (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
      opacity={0.5}
    />
  ),
  []
);
```

### Bottom Sheet Kullanım İstatistikleri

- **Toplam Dosya**: 26+ dosya
- **En Çok Kullanılan**: 
  - CreatePostBottomSheet (5+ screen'de)
  - ExpertBottomSheet (FeedScreen'de)
  - Badge Detail Bottom Sheet (CollectionsScreen'de)
- **Ortak Özellikler**: 
  - %90'ı enablePanDownToClose kullanıyor
  - %80'i enableDynamicSizing kullanıyor
  - %100'ü backdropComponent kullanıyor

---

## 🔬 Teknik Araştırma

### @gorhom/bottom-sheet v5.2.3 Özellikleri

1. **BottomSheetModal**: Portal kullanır, global render edilir
2. **BottomSheet**: Local render edilir, parent container içinde
3. **BottomSheetModalProvider**: Modal'lar için provider (zaten mevcut)

### Global Yönetim için En İyi Yaklaşım

**Seçenek A: BottomSheetModal Kullanımı**
- ✅ Portal ile otomatik global render
- ✅ Z-index sorunları yok
- ❌ Tab bar kapatma hala manuel

**Seçenek B: Custom Global Manager (ÖNERİLEN)**
- ✅ Tam kontrol
- ✅ Tab bar otomatik kapatma
- ✅ Custom logic eklenebilir
- ⚠️ Daha fazla kod

**Karar**: Seçenek B - Custom Global Manager kullanılacak çünkü:
1. Tab bar kapatma otomatik olmalı
2. Tüm bottom sheet'ler aynı davranışa sahip olmalı
3. Gelecekte özelleştirme gerekebilir

---

## 🏗️ Mimari Tasarım

### Dosya Yapısı

```
src/
  ├── providers/
  │   └── GlobalBottomSheetProvider.tsx      # Provider component
  ├── hooks/
  │   └── useGlobalBottomSheet.ts            # Hook
  ├── components/
  │   └── GlobalBottomSheet/
  │       ├── index.tsx                       # Ana component
  │       └── types.ts                        # Type definitions
  └── navigation/
      └── TabNavigator.tsx                   # Tab bar entegrasyonu
```

### Context Yapısı

```typescript
interface GlobalBottomSheetContextType {
  // State
  isOpen: boolean;
  content: React.ReactNode | null;
  options: BottomSheetOptions | null;
  
  // Actions
  openBottomSheet: (content: React.ReactNode, options?: BottomSheetOptions) => void;
  closeBottomSheet: () => void;
  updateContent: (content: React.ReactNode) => void;
}
```

### Options Interface

```typescript
interface BottomSheetOptions {
  // Snap points
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
  
  // Gesture settings
  enablePanDownToClose?: boolean;
  enableOverDrag?: boolean;
  enableHandlePanningGesture?: boolean;
  enableContentPanningGesture?: boolean;
  
  // Animation
  animateOnMount?: boolean;
  
  // Callbacks
  onChange?: (index: number) => void;
  onClose?: () => void;
  
  // Custom styles
  backgroundStyle?: ViewStyle;
  handleStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  
  // Backdrop
  backdropOpacity?: number;
  backdropPressBehavior?: 'none' | 'close' | 'collapse';
  
  // Padding
  paddingBottom?: number;
}
```

---

## 📝 Adım Adım Implementasyon Planı

### Faz 1: Core Infrastructure (1-2 gün)

#### Adım 1.1: Type Definitions
**Dosya**: `src/components/GlobalBottomSheet/types.ts`
- `BottomSheetOptions` interface
- `GlobalBottomSheetContextType` interface
- Default options constant

#### Adım 1.2: Context ve Provider
**Dosya**: `src/providers/GlobalBottomSheetProvider.tsx`
- Context oluştur
- Provider component
- State management (isOpen, content, options)

#### Adım 1.3: Hook
**Dosya**: `src/hooks/useGlobalBottomSheet.ts`
- `useGlobalBottomSheet` hook
- `openBottomSheet`, `closeBottomSheet`, `updateContent` fonksiyonları
- Type-safe API

#### Adım 1.4: GlobalBottomSheet Component
**Dosya**: `src/components/GlobalBottomSheet/index.tsx`
- BottomSheet component wrapper
- Default options merge
- Backdrop component
- Style management

### Faz 2: App.tsx Entegrasyonu (0.5 gün)

#### Adım 2.1: Provider Ekle
**Dosya**: `App.tsx`
- GlobalBottomSheetProvider'ı ekle
- GlobalBottomSheet component'ini render et
- Z-index ayarları

### Faz 3: TabNavigator Entegrasyonu (0.5 gün)

#### Adım 3.1: Tab Bar Kapatma
**Dosya**: `src/navigation/TabNavigator.tsx`
- `useGlobalBottomSheet` hook'unu kullan
- `isOpen` state'ine göre tab bar'ı gizle/göster
- Z-index ayarları

### Faz 4: İlk Migration (1 gün)

#### Adım 4.1: FeedScreen - ExpertBottomSheet
**Dosya**: `src/features/feed/screens/FeedScreen.tsx`
- Local bottom sheet'i kaldır
- Global bottom sheet kullan
- Test et

#### Adım 4.2: CatalogScreen - CreatePostBottomSheet
**Dosya**: `src/features/catalog/screens/CatalogScreen.tsx`
- Local bottom sheet'i kaldır
- Global bottom sheet kullan
- Test et

### Faz 5: Kalan Migration (3-5 gün)

#### Adım 5.1: Diğer Screen'ler
- PostsScreen
- CollectionsScreen
- WalletScreen
- InventoryScreen
- SettingsScreen
- vb.

### Faz 6: Test ve Bug Fix (2-3 gün)

#### Adım 6.1: Test Senaryoları
- Bottom sheet açılma/kapanma
- Tab bar kapatma
- Overlay davranışı
- Z-index sorunları
- Gesture davranışları

---

## 🔄 Migration Stratejisi

### Migration Pattern

#### Öncesi
```typescript
// 1. Ref oluştur
const bottomSheetRef = useRef<BottomSheet>(null);

// 2. Backdrop component
const renderBackdrop = useCallback(...);

// 3. BottomSheet render
<BottomSheet
  ref={bottomSheetRef}
  index={-1}
  enablePanDownToClose
  backdropComponent={renderBackdrop}
  ...
>
  <BottomSheetView>
    <MyBottomSheetContent onClose={() => bottomSheetRef.current?.close()} />
  </BottomSheetView>
</BottomSheet>

// 4. Açma
bottomSheetRef.current?.expand();
```

#### Sonrası
```typescript
// 1. Hook kullan
const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

// 2. Açma
const handleOpen = () => {
  openBottomSheet(
    <MyBottomSheetContent onClose={closeBottomSheet} />,
    {
      enablePanDownToClose: true,
      // diğer options
    }
  );
};
```

### Migration Checklist

Her dosya için:
- [ ] Local `BottomSheet` component'ini kaldır
- [ ] `useRef<BottomSheet>` kaldır
- [ ] `renderBackdrop` callback'ini kaldır
- [ ] `useGlobalBottomSheet` hook'unu ekle
- [ ] `openBottomSheet` ile açma kodunu güncelle
- [ ] `onClose` callback'lerini güncelle
- [ ] Test et

---

## 🧪 Test Planı

### Test Senaryoları

1. **Temel Açılma/Kapanma**
   - ✅ Bottom sheet açılıyor mu?
   - ✅ Bottom sheet kapanıyor mu?
   - ✅ Tab bar kapanıyor mu?

2. **Overlay Davranışı**
   - ✅ Overlay tüm sayfayı kaplıyor mu?
   - ✅ Backdrop'a tıklayınca kapanıyor mu?
   - ✅ Z-index doğru mu?

3. **Gesture Davranışları**
   - ✅ Pan down to close çalışıyor mu?
   - ✅ Handle gesture çalışıyor mu?
   - ✅ Content gesture çalışıyor mu?

4. **Farklı Screen'ler**
   - ✅ FeedScreen'de çalışıyor mu?
   - ✅ CatalogScreen'de çalışıyor mu?
   - ✅ ProfileScreen'de çalışıyor mu?

5. **Edge Cases**
   - ✅ Hızlı açma/kapanma
   - ✅ Birden fazla bottom sheet açma denemesi
   - ✅ Navigation sırasında bottom sheet açık

---

## 📊 Başarı Kriterleri

### Teknik Kriterler
- ✅ Tüm bottom sheet'ler global manager üzerinden açılıyor
- ✅ Tab bar otomatik kapanıyor
- ✅ Overlay tüm sayfayı kaplıyor
- ✅ Z-index sorunları çözülmüş
- ✅ Type safety sağlanmış

### UX Kriterleri
- ✅ Tüm bottom sheet'ler aynı davranışa sahip
- ✅ Animasyonlar smooth
- ✅ Gesture'lar doğru çalışıyor
- ✅ Kullanıcı deneyimi iyileşmiş

---

## 🚀 Sonraki Adımlar

1. ✅ Strateji dokümantasyonu tamamlandı
2. ⏳ Faz 1: Core Infrastructure implementasyonu
3. ⏳ Faz 2: App.tsx entegrasyonu
4. ⏳ Faz 3: TabNavigator entegrasyonu
5. ⏳ Faz 4: İlk migration
6. ⏳ Faz 5: Kalan migration
7. ⏳ Faz 6: Test ve bug fix

---

**Hazırlanma Tarihi**: 2025-01-XX
**Durum**: Strateji Hazır - Implementasyona Başlanabilir

