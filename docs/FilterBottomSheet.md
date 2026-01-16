# FilterBottomSheet Component Documentation

## Genel Bakış

`FilterBottomSheet` component'i, uygulama genelinde tutarlı bir filtreleme ve sıralama deneyimi sağlamak için kullanılan yeniden kullanılabilir bir bottom sheet component'idir. Mevcut `FilterSortBottomSheet` yapısı temel alınarak oluşturulmuştur.

## Özellikler

- ✅ Radio button seçimi (tek seçim)
- ✅ Seçili item için özel görsel tasarım (border siyah, merkez siyah, arası beyaz)
- ✅ Seçili olmayan item'lar için gri text rengi
- ✅ Semibold font weight
- ✅ Responsive tasarım (dark/light mode desteği)
- ✅ Reset ve Done butonları
- ✅ Customizable content (Filter ve Sort section'ları)

## Tasarım Özellikleri

### Radio Button Tasarımı

**Seçili Item:**
- Border: Siyah (`#000000`)
- Arka plan: Beyaz (`#FFFFFF`)
- Merkez: Siyah daire (8x8, `#000000`)
- Text: Beyaz (dark mode) / Siyah (light mode)
- Font weight: Semibold

**Seçili Olmayan Item:**
- Border: Gri (`#666666` light mode, `#666666` dark mode)
- Text: Gri (`#666666` light mode, `#999999` dark mode)
- Font weight: Semibold

### Butonlar

- **Done Butonu:**
  - Background: `#D8FF08`
  - Text: Siyah (`#000000`)
  - Font weight: Bold

- **Reset Butonu:**
  - Background: Transparent
  - Border: Gri (`#E9E9E9` light mode, `#444444` dark mode)
  - Text: Gri (disabled durumda daha açık)

### Spacing

- Ana container padding: `px="$4" py="$3" pb="$8"`
- Section'lar arası boşluk: `space="md"`
- Item'lar arası boşluk: `space="xs"`
- Item padding: `py="$1.5"`
- Header margin: `mb="$1"`

## Kullanım Senaryoları

### 1. Post Filtreleme (Mevcut - FilterSortBottomSheet)

**Kullanım:**
```typescript
<FilterSortBottomSheet
  contextType="sub_category" | "product_group" | "product"
  initialFilters={{
    postType?: string;
    sort?: 'newest' | 'oldest' | 'popular';
  }}
  onFilterChange={(filters) => {
    // Filter değişikliklerini handle et
  }}
  onClose={() => {
    // Bottom sheet'i kapat
  }}
/>
```

**Özellikler:**
- Post type filtreleme (All, Generals, Tips & Tricks, Questions, vb.)
- Sort seçenekleri (Newest First, Oldest First, Most Popular)
- Default sort: "newest"

### 2. NFT Filtreleme (Örnek)

**Kullanım:**
```typescript
<NFTFilterBottomSheet
  availableTypes={['image', 'video', 'audio']}
  selectedTypes={['image']}
  onApply={(types) => {
    // Seçilen type'ları handle et
  }}
  onClose={() => {
    // Bottom sheet'i kapat
  }}
/>
```

**Özellikler:**
- Multi-select veya single-select
- Type bazlı filtreleme
- Reset ve Apply butonları

### 3. Event Filtreleme (Örnek)

**Kullanım:**
```typescript
<EventFilterBottomSheet
  initialFilters={{
    eventType?: 'upcoming' | 'past' | 'all';
    category?: string;
    sort?: 'date' | 'popularity';
  }}
  onFilterChange={(filters) => {
    // Filter değişikliklerini handle et
  }}
  onClose={() => {
    // Bottom sheet'i kapat
  }}
/>
```

**Özellikler:**
- Event type filtreleme
- Category filtreleme
- Sort seçenekleri

### 4. Search Filtreleme (Örnek)

**Kullanım:**
```typescript
<SearchFilterBottomSheet
  initialFilters={{
    contentType?: 'posts' | 'users' | 'products' | 'all';
    dateRange?: 'today' | 'week' | 'month' | 'all';
    sort?: 'relevance' | 'date' | 'popularity';
  }}
  onFilterChange={(filters) => {
    // Filter değişikliklerini handle et
  }}
  onClose={() => {
    // Bottom sheet'i kapat
  }}
/>
```

## Component Yapısı

### Temel Yapı

```typescript
interface FilterBottomSheetProps<T> {
  // Initial filter state
  initialFilters?: T;
  
  // Callbacks
  onFilterChange: (filters: T) => void;
  onClose: () => void;
  
  // Optional props
  title?: string;
  sections?: FilterSection[];
}

interface FilterSection {
  title: string;
  options: FilterOption[];
  type: 'single' | 'multi'; // Radio button veya checkbox
}

interface FilterOption {
  label: string;
  value: string;
}
```

### Örnek Implementation

```typescript
export const CustomFilterBottomSheet: React.FC<CustomFilterBottomSheetProps> = ({
  initialFilters,
  onFilterChange,
  onClose,
}) => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // State management
  const [filters, setFilters] = useState(initialFilters || defaultFilters);

  // Handlers
  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDone = useCallback(() => {
    onFilterChange(filters);
    onClose();
  }, [filters, onFilterChange, onClose]);

  return (
    <BottomSheetScrollView>
      <Box bg={isDark ? '$backgroundDark950' : '#FDFDFB'} width="100%">
        <VStack px="$4" py="$3" pb="$8" space="md">
          {/* Header */}
          <HStack alignItems="center" justifyContent="center" mb="$1">
            <Text
              fontSize={16}
              fontWeight="$bold"
              color={isDark ? '#FFFFFF' : '#000000'}
            >
              Filter Title
            </Text>
          </HStack>

          {/* Filter Sections */}
          {/* ... Filter sections ... */}

          {/* Action Buttons */}
          <HStack space="md" mt="$2">
            <Button
              flex={1}
              variant="outline"
              bg="transparent"
              borderWidth={1}
              borderColor={isDark ? '#444444' : '#E9E9E9'}
              onPress={handleReset}
            >
              <ButtonText
                color={isDark ? '#FFFFFF' : '#000000'}
                fontSize={14}
                fontWeight="$semibold"
              >
                Reset
              </ButtonText>
            </Button>
            <Button
              flex={1}
              bg="#D8FF08"
              onPress={handleDone}
            >
              <ButtonText
                color="#000000"
                fontSize={14}
                fontWeight="$bold"
              >
                Done
              </ButtonText>
            </Button>
          </HStack>
        </VStack>
      </Box>
    </BottomSheetScrollView>
  );
};
```

## Radio Button Component

### Seçili Radio Button

```typescript
{isSelected ? (
  <Box
    w={20}
    h={20}
    rounded="$full"
    borderWidth={2}
    borderColor="#000000"
    bg="#FFFFFF"
    alignItems="center"
    justifyContent="center"
  >
    <Box
      w={8}
      h={8}
      rounded="$full"
      bg="#000000"
    />
  </Box>
) : (
  <Box
    w={20}
    h={20}
    rounded="$full"
    borderWidth={2}
    borderColor={isDark ? '#666666' : '#D4D4D4'}
  />
)}
```

### Text Styling

```typescript
<Text
  fontSize={14}
  fontWeight="$semibold"
  color={isSelected ? (isDark ? '#FFFFFF' : '#000000') : (isDark ? '#999999' : '#666666')}
>
  {option.label}
</Text>
```

## Best Practices

### 1. State Management

- Her filter bottom sheet kendi state'ini yönetmeli
- Initial filters prop'undan başlamalı
- Reset handler'da default değerlere dönmeli

### 2. Callbacks

- `onFilterChange`: Filter değişikliklerini parent component'e bildir
- `onClose`: Bottom sheet'i kapat
- Reset ve Done butonları için ayrı handler'lar kullan

### 3. Default Values

- Her filter için mantıklı bir default değer belirle
- Örneğin: Sort için "newest", Filter için "All"

### 4. Accessibility

- Tüm interactive element'ler için `onPress` handler'ları ekle
- Disabled state'ler için uygun renk ve opacity kullan
- Text size'ları okunabilir tut (minimum 14px)

### 5. Performance

- `useCallback` ile handler'ları memoize et
- `useMemo` ile hesaplanan değerleri cache'le
- Gereksiz re-render'ları önle

## Örnek Kullanım Senaryoları

### Senaryo 1: Basit Single-Select Filter

```typescript
const [selectedCategory, setSelectedCategory] = useState('all');

<FilterBottomSheet
  options={[
    { label: 'All', value: 'all' },
    { label: 'Category 1', value: 'cat1' },
    { label: 'Category 2', value: 'cat2' },
  ]}
  selectedValue={selectedCategory}
  onSelect={(value) => setSelectedCategory(value)}
  onClose={closeBottomSheet}
/>
```

### Senaryo 2: Multi-Section Filter

```typescript
<FilterBottomSheet
  sections={[
    {
      title: 'Type',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Type 1', value: 'type1' },
      ],
    },
    {
      title: 'Sort',
      options: [
        { label: 'Newest', value: 'newest' },
        { label: 'Oldest', value: 'oldest' },
      ],
    },
  ]}
  onFilterChange={(filters) => {
    // Handle filters
  }}
  onClose={closeBottomSheet}
/>
```

## Migration Guide

### Mevcut FilterSortBottomSheet'ten Yeni Yapıya Geçiş

1. **Component adını değiştir:**
   - `FilterSortBottomSheet` → `CustomFilterBottomSheet`

2. **Props'ları güncelle:**
   - Generic type kullan: `FilterBottomSheetProps<T>`
   - Initial filters'ı generic yap

3. **State management'ı güncelle:**
   - Her section için ayrı state veya tek bir state object

4. **Styling'i kontrol et:**
   - Radio button tasarımı aynı kalmalı
   - Spacing değerleri aynı olmalı
   - Renkler aynı olmalı

## Notlar

- Bottom sheet padding'i (`pb="$8"`) cihaz navigasyon çizgisinin üstünde butonların görünmesi için yeterli
- Dark mode desteği tüm component'lerde tutarlı olmalı
- Reset butonu disabled state'de daha açık renkte görünmeli
- Done butonu her zaman aktif olmalı

## İlgili Dosyalar

- `src/features/post/components/FilterSortBottomSheet/index.tsx` - Mevcut implementation
- `src/features/post/screens/PostsScreen.tsx` - Kullanım örneği
- `src/hooks/useGlobalBottomSheet.ts` - Bottom sheet hook

## Gelecek Geliştirmeler

- [ ] Generic FilterBottomSheet component oluştur
- [ ] Multi-select desteği ekle
- [ ] Checkbox tasarımı ekle
- [ ] Date range picker desteği
- [ ] Slider/range filter desteği
- [ ] Animation improvements
- [ ] Accessibility improvements (screen reader support)
