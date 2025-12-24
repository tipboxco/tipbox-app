# React Hook Form Entegrasyonu Analizi - Create Post Screens

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Mevcut Durum Analizi](#mevcut-durum-analizi)
3. [Screen Bazında Detaylı Analiz](#screen-bazında-detaylı-analiz)
4. [Component Yapısı Analizi](#component-yapısı-analizi)
5. [React Hook Form Entegrasyon Stratejisi](#react-hook-form-entegrasyon-stratejisi)
6. [Uygulanabilirlik Değerlendirmesi](#uygulanabilirlik-değerlendirmesi)
7. [Önerilen Mimari](#önerilen-mimari)
8. [Uygulama Adımları](#uygulama-adımları)

---

## Genel Bakış

Bu doküman, `src/features/post/screens` içerisindeki tüm Create screenlerinin React Hook Form ile entegrasyonu için kapsamlı bir analiz sunmaktadır. Analiz, mevcut state yönetimi yaklaşımını, veri toplama noktalarını ve component hiyerarşisini incelemektedir.

### Analiz Edilen Screens
1. `CreateBenchmarkPostScreen.tsx`
2. `CreateUpdatePostScreen.tsx`
3. `CreateExperiencePostScreen.tsx`
4. `CreatePostScreen.tsx`
5. `CreateQuestionPostScreen.tsx`
6. `CreateTipsAndTrickPostScreen.tsx`

---

## Mevcut Durum Analizi

### Mevcut State Yönetimi Yaklaşımı

Tüm Create screenlerinde **React useState** kullanılarak form state yönetimi yapılmaktadır:

```typescript
// Örnek: CreateBenchmarkPostScreen
const [postText, setPostText] = useState('');
const [selectedProduct1, setSelectedProduct1] = useState<SelectedProduct | null>(null);
const [selectedProduct2, setSelectedProduct2] = useState<SelectedProduct | null>(null);
const [selectedChoice, setSelectedChoice] = useState<'product1' | 'product2' | null>(null);
const [selectedImages, setSelectedImages] = useState<string[]>([]);
```

### Mevcut Validasyon Yaklaşımı

Validasyon, manuel olarak button enable/disable kontrolü ile yapılmaktadır:

```typescript
// Örnek: CreateBenchmarkPostScreen
const isShareEnabled = postText.trim().length > 0 && 
                       selectedProduct1 !== null && 
                       selectedProduct2 !== null && 
                       selectedChoice !== null;
```

### Sorunlar ve Zorluklar

1. **Manuel State Yönetimi**: Her field için ayrı useState hook'u kullanılıyor
2. **Validasyon Eksikliği**: Sadece basit length kontrolü var, detaylı validasyon yok
3. **Error Handling**: Form hatalarının gösterilmesi için bir mekanizma yok
4. **Component İletişimi**: Child componentlerden parent'a veri aktarımı callback'ler ile yapılıyor
5. **Form Submit**: Submit işlemi sadece console.log ile mock edilmiş
6. **Re-render Optimizasyonu**: Her state değişikliğinde tüm component re-render oluyor

---

## Screen Bazında Detaylı Analiz

### 1. CreateBenchmarkPostScreen

**Toplanan Veriler:**
- `postText` (string): Karşılaştırma açıklaması (max 500 karakter)
- `selectedProduct1` (SelectedProduct | null): İlk ürün
- `selectedProduct2` (SelectedProduct | null): İkinci ürün
- `selectedChoice` ('product1' | 'product2' | null): Hangi ürünün seçildiği
- `selectedImages` (string[]): Seçilen görseller

**Validasyon Kuralları:**
- `postText`: Required, max 500 karakter
- `selectedProduct1`: Required
- `selectedProduct2`: Required
- `selectedChoice`: Required

**Kullanılan Componentler:**
- `ProductComparisonCard`: Ürün seçimi ve seçim durumu
- `DashedProductCard`: Ürün ekleme butonu
- `AddProductFromCatalog`: Katalogdan ürün seçimi (modal)
- `AddProductFromInventory`: Envanterden ürün seçimi (modal)

**Özel Durumlar:**
- İki ürün karşılaştırması yapılıyor
- Ürün seçimi için bottom sheet kullanılıyor
- Route params'tan gelen product ile ilk ürün initialize edilebiliyor

---

### 2. CreateUpdatePostScreen

**Toplanan Veriler:**
- `description` (string): Güncelleme açıklaması (max 500 karakter)
- `selectedImages` (string[]): Seçilen görseller

**Validasyon Kuralları:**
- `description`: Required, max 500 karakter
- `product`: Route params'tan geliyor (required)

**Kullanılan Componentler:**
- `ProductInfoCard`: Ürün bilgisi gösterimi (read-only)

**Özel Durumlar:**
- Product route params'tan geliyor, form state'inde tutulmuyor
- Experience content mock data olarak gösteriliyor (form state'inde değil)

---

### 3. CreateExperiencePostScreen

**Toplanan Veriler:**

**Step 0 (SelectProduct):**
- `selectedProduct` (Product | null): Seçilen ürün
- `selectedDuration` (string): Kullanım süresi (SelectProduct component'inde)
- `selectedLocation` (string): Kullanım yeri (SelectProduct component'inde)
- `selectedPurpose` (string): Kullanım amacı (SelectProduct component'inde)

**Step 1 (StepOneScreen):**
- `selectedDuration` (string): Deneyim süresi
- `selectedCondition` (string): Ürün durumu
- `selectedFrequency` (string): Kullanım sıklığı

**Step 2 (StepTwoScreen):**
- `experienceText` (string): Deneyim metni (max 500 karakter)
- `selectedImages` (string[]): Seçilen görseller

**Step 3 (StepThreeScreen):**
- `priceExperienceText` (string): Fiyat deneyimi metni
- `productExperienceText` (string): Ürün deneyimi metni
- `priceRating` (number): Fiyat puanı (1-5)
- `productRating` (number): Ürün puanı (1-5)
- `editingField` ('price' | 'product' | null): Düzenleme modu

**Validasyon Kuralları:**
- Step 0: `selectedProduct` required
- Step 1: `selectedDuration`, `selectedCondition`, `selectedFrequency` required
- Step 2: `experienceText` required, max 500 karakter
- Step 3: `priceRating` ve `productRating` required (1-5 arası)

**Kullanılan Componentler:**
- `SelectProduct`: Ürün seçimi ve kullanım bilgileri
- `StepOneScreen`: Deneyim süresi, durum, sıklık seçimi
- `StepTwoScreen`: Deneyim metni ve görseller
- `StepThreeScreen`: Fiyat/ürün deneyimi ve puanlama
- `AddProductFromCatalog`: Ürün seçimi modal'ı

**Özel Durumlar:**
- Multi-step form yapısı (4 step)
- Her step'te farklı validasyon kuralları
- Step 3'te edit modu var
- Route params'tan product ve experienceOption gelebiliyor

---

### 4. CreatePostScreen

**Toplanan Veriler:**
- `postText` (string): Post açıklaması (max 500 karakter)

**Validasyon Kuralları:**
- `postText`: Required, max 500 karakter

**Kullanılan Componentler:**
- `ProductInfoCard`: Ürün bilgisi gösterimi (read-only, mock data)

**Özel Durumlar:**
- En basit form yapısı
- Sadece text input var
- Product info mock data, form state'inde değil

---

### 5. CreateQuestionPostScreen

**Toplanan Veriler:**
- `questionText` (string): Soru metni (max 500 karakter)
- `selectedBoost` (string): Seçilen boost seçeneği
- `selectedImages` (string[]): Seçilen görseller (henüz implement edilmemiş)

**Validasyon Kuralları:**
- `questionText`: Required, max 500 karakter
- `selectedBoost`: Optional (default: 'no-boost')

**Kullanılan Componentler:**
- `ProductInfoCard`: Ürün bilgisi gösterimi (read-only, mock data)
- `BoostOptionCard`: Boost seçenekleri

**Özel Durumlar:**
- Boost seçenekleri sabit liste
- TIPS bakiyesi gösterimi var (form state'inde değil)

---

### 6. CreateTipsAndTrickPostScreen

**Toplanan Veriler:**
- `tipsText` (string): Tips & Tricks metni (max 500 karakter)
- `selectedCategory` (string): Seçilen kategori
- `selectedImages` (string[]): Seçilen görseller (henüz implement edilmemiş)

**Validasyon Kuralları:**
- `tipsText`: Required, max 500 karakter
- `selectedCategory`: Required

**Kullanılan Componentler:**
- `ProductInfoCard`: Ürün bilgisi gösterimi (read-only, mock data)

**Özel Durumlar:**
- Custom dropdown implementasyonu (modal değil, inline)
- Kategori seçimi için özel UI

---

## Component Yapısı Analizi

### Child Componentler ve Veri Akışı

#### 1. CreateExperiencePostScreen Component Hiyerarşisi

```
CreateExperiencePostScreen
├── SelectProduct (Step 0)
│   ├── AddProductFromCatalog (modal)
│   └── Select boxes (duration, location, purpose)
├── StepOneScreen (Step 1)
│   └── Select boxes (duration, condition, frequency)
├── StepTwoScreen (Step 2)
│   └── Textarea (experienceText)
└── StepThreeScreen (Step 3)
    ├── Textarea (priceExperienceText, productExperienceText)
    └── Star Rating (priceRating, productRating)
```

**Veri Akışı:**
- Parent → Child: Props ile state değerleri gönderiliyor
- Child → Parent: Callback fonksiyonlar ile state güncellemeleri yapılıyor

**Örnek:**
```typescript
// Parent
const [selectedDuration, setSelectedDuration] = useState('');
<StepOneScreen
  selectedDuration={selectedDuration}
  onDurationChange={setSelectedDuration}
/>

// Child
interface StepOneScreenProps {
  selectedDuration: string;
  onDurationChange: (value: string) => void;
}
```

#### 2. CreateBenchmarkPostScreen Component Hiyerarşisi

```
CreateBenchmarkPostScreen
├── ProductComparisonCard (product1)
├── DashedProductCard (product2 placeholder)
├── AddProductFromCatalog (modal)
└── AddProductFromInventory (modal)
```

**Veri Akışı:**
- Modal componentler callback ile seçilen ürünü parent'a iletiyor
- ProductComparisonCard sadece gösterim yapıyor, seçim parent'ta yönetiliyor

---

## React Hook Form Entegrasyon Stratejisi

### Uygulanabilirlik Değerlendirmesi

#### ✅ Uygulanabilir Senaryolar

1. **Basit Formlar (CreatePostScreen, CreateQuestionPostScreen, CreateTipsAndTrickPostScreen)**
   - Tek seviye form yapısı
   - Az sayıda field
   - Standart input componentleri
   - **Uygulama Kolaylığı: Yüksek**

2. **Orta Karmaşıklık (CreateUpdatePostScreen, CreateBenchmarkPostScreen)**
   - Modal componentler ile ürün seçimi
   - Multiple product selection
   - **Uygulama Kolaylığı: Orta**

3. **Karmaşık Formlar (CreateExperiencePostScreen)**
   - Multi-step form
   - Nested componentler
   - Conditional validation
   - **Uygulama Kolaylığı: Düşük-Orta**

#### ⚠️ Zorluklar ve Çözümler

**1. Child Componentlerden Veri Toplama**

**Sorun:** Child componentler (StepOneScreen, StepTwoScreen, etc.) kendi state'lerini yönetiyor.

**Çözüm 1: Controller Component Pattern**
```typescript
// Parent
const { control } = useForm();
<Controller
  name="duration"
  control={control}
  render={({ field: { onChange, value } }) => (
    <StepOneScreen
      selectedDuration={value}
      onDurationChange={onChange}
    />
  )}
/>
```

**Çözüm 2: useFormContext + FormProvider**
```typescript
// Parent
const methods = useForm();
<FormProvider {...methods}>
  <StepOneScreen />
</FormProvider>

// Child
const { control } = useFormContext();
const { field } = useController({ name: 'duration', control });
```

**Çözüm 3: setValue ile Manuel Güncelleme**
```typescript
// Parent
const { setValue } = useForm();
<StepOneScreen
  onDurationChange={(value) => setValue('duration', value)}
/>
```

**Öneri:** Çözüm 1 (Controller Pattern) en uygun çözüm. Child componentlerin mevcut API'sini korurken React Hook Form entegrasyonu sağlar.

---

**2. Modal Componentlerden Veri Toplama**

**Sorun:** AddProductFromCatalog ve AddProductFromInventory modal componentler callback ile veri döndürüyor.

**Çözüm:**
```typescript
const { setValue } = useForm();

const handleCatalogProductSelect = (product: Product) => {
  setValue('selectedProduct2', product, { shouldValidate: true });
  setShowProductSelector(false);
};
```

---

**3. Multi-Step Form Yapısı**

**Sorun:** CreateExperiencePostScreen 4 step'ten oluşuyor ve her step'te farklı validasyon kuralları var.

**Çözüm 1: Tek Form, Step Bazlı Validasyon**
```typescript
const { trigger, formState } = useForm();

const handleNextPress = async () => {
  const fieldsToValidate = getFieldsForStep(currentStep);
  const isValid = await trigger(fieldsToValidate);
  if (isValid) {
    setCurrentStep(nextStep);
  }
};
```

**Çözüm 2: useFormState ile Step Tracking**
```typescript
const [currentStep, setCurrentStep] = useState(0);
const { trigger, formState } = useForm({
  mode: 'onChange',
});

// Her step için ayrı validation schema
const stepValidationSchemas = [
  ['selectedProduct'],
  ['selectedDuration', 'selectedCondition', 'selectedFrequency'],
  ['experienceText'],
  ['priceRating', 'productRating'],
];
```

**Öneri:** Çözüm 1 daha esnek ve mevcut yapıya uygun.

---

**4. Custom Componentler (Select, Textarea, etc.)**

**Sorun:** Gluestack UI componentleri React Hook Form ile doğrudan uyumlu değil.

**Çözüm: Controller Wrapper**
```typescript
<Controller
  name="postText"
  control={control}
  rules={{ required: true, maxLength: 500 }}
  render={({ field: { onChange, value }, fieldState: { error } }) => (
    <Textarea>
      <TextareaInput
        value={value}
        onChangeText={onChange}
        maxLength={500}
      />
      {error && <Text color="red">{error.message}</Text>}
    </Textarea>
  )}
/>
```

---

**5. Conditional Fields**

**Sorun:** CreateBenchmarkPostScreen'de selectedChoice'a göre validasyon değişiyor.

**Çözüm: watch + conditional validation**
```typescript
const selectedChoice = watch('selectedChoice');
const { control } = useForm({
  defaultValues: {
    selectedChoice: null,
  },
});

// Validation rules dinamik olarak değişebilir
```

---

## Önerilen Mimari

### 1. Form Schema Yapısı (Zod ile)

```typescript
// src/features/post/schemas/benchmarkPostSchema.ts
import { z } from 'zod';

export const benchmarkPostSchema = z.object({
  postText: z.string()
    .min(1, 'Açıklama gereklidir')
    .max(500, 'Maksimum 500 karakter olabilir'),
  selectedProduct1: z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    subName: z.string().optional(),
    image: z.any(),
    isOwned: z.boolean().optional(),
  }),
  selectedProduct2: z.object({
    id: z.string(),
    name: z.string(),
    brand: z.string().optional(),
    subName: z.string().optional(),
    image: z.any(),
    isOwned: z.boolean().optional(),
  }),
  selectedChoice: z.enum(['product1', 'product2']),
  selectedImages: z.array(z.string()).optional(),
});

export type BenchmarkPostFormData = z.infer<typeof benchmarkPostSchema>;
```

### 2. Form Hook Yapısı

```typescript
// src/features/post/hooks/useBenchmarkPostForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { benchmarkPostSchema } from '../schemas/benchmarkPostSchema';

export const useBenchmarkPostForm = (initialValues?: Partial<BenchmarkPostFormData>) => {
  return useForm<BenchmarkPostFormData>({
    resolver: zodResolver(benchmarkPostSchema),
    defaultValues: {
      postText: '',
      selectedProduct1: null,
      selectedProduct2: null,
      selectedChoice: null,
      selectedImages: [],
      ...initialValues,
    },
    mode: 'onChange',
  });
};
```

### 3. Component Wrapper Pattern

```typescript
// src/features/post/components/FormFields/ControlledTextarea.tsx
import { Controller, useFormContext } from 'react-hook-form';

interface ControlledTextareaProps {
  name: string;
  placeholder?: string;
  maxLength?: number;
}

export const ControlledTextarea: React.FC<ControlledTextareaProps> = ({
  name,
  placeholder,
  maxLength = 500,
}) => {
  const { control } = useFormContext();
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <VStack>
          <Textarea>
            <TextareaInput
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              maxLength={maxLength}
            />
          </Textarea>
          {error && (
            <Text color="red" fontSize="$xs">
              {error.message}
            </Text>
          )}
        </VStack>
      )}
    />
  );
};
```

### 4. Multi-Step Form Hook

```typescript
// src/features/post/hooks/useExperiencePostForm.ts
import { useForm, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { experiencePostSchema } from '../schemas/experiencePostSchema';

export const useExperiencePostForm = () => {
  const form = useForm({
    resolver: zodResolver(experiencePostSchema),
    mode: 'onChange',
  });

  const { trigger } = form;

  const validateStep = async (step: number) => {
    const stepFields = getStepFields(step);
    return await trigger(stepFields);
  };

  return {
    ...form,
    validateStep,
  };
};

const getStepFields = (step: number): string[] => {
  switch (step) {
    case 0:
      return ['selectedProduct'];
    case 1:
      return ['selectedDuration', 'selectedCondition', 'selectedFrequency'];
    case 2:
      return ['experienceText'];
    case 3:
      return ['priceRating', 'productRating'];
    default:
      return [];
  }
};
```

---

## Uygulanabilirlik Değerlendirmesi

### Screen Bazında Uygulama Önceliği

| Screen | Karmaşıklık | Öncelik | Tahmini Süre |
|--------|-------------|---------|--------------|
| CreatePostScreen | Düşük | Yüksek | 2-3 saat |
| CreateQuestionPostScreen | Düşük | Yüksek | 2-3 saat |
| CreateTipsAndTrickPostScreen | Düşük | Yüksek | 2-3 saat |
| CreateUpdatePostScreen | Orta | Orta | 4-5 saat |
| CreateBenchmarkPostScreen | Orta-Yüksek | Orta | 5-6 saat |
| CreateExperiencePostScreen | Yüksek | Düşük | 8-10 saat |

### Uygulama Stratejisi

**Faz 1: Basit Formlar (1-2 hafta)**
1. CreatePostScreen
2. CreateQuestionPostScreen
3. CreateTipsAndTrickPostScreen

**Faz 2: Orta Karmaşıklık (1 hafta)**
4. CreateUpdatePostScreen
5. CreateBenchmarkPostScreen

**Faz 3: Karmaşık Formlar (1-2 hafta)**
6. CreateExperiencePostScreen

---

## Uygulama Adımları

### Adım 1: Gerekli Paketlerin Kurulumu

✅ **Tamamlandı:**
- `react-hook-form`: ^7.68.0
- `zod`: ^4.1.13

⚠️ **Eksik:**
- `@hookform/resolvers`: Zod resolver için gerekli

```bash
npm install @hookform/resolvers
```

### Adım 2: Schema Tanımlamaları

Her screen için Zod schema oluşturulmalı:

```
src/features/post/schemas/
├── benchmarkPostSchema.ts
├── updatePostSchema.ts
├── experiencePostSchema.ts
├── postSchema.ts
├── questionPostSchema.ts
└── tipsAndTrickPostSchema.ts
```

### Adım 3: Form Hook'ları

Her screen için custom hook oluşturulmalı:

```
src/features/post/hooks/
├── useBenchmarkPostForm.ts
├── useUpdatePostForm.ts
├── useExperiencePostForm.ts
├── usePostForm.ts
├── useQuestionPostForm.ts
└── useTipsAndTrickPostForm.ts
```

### Adım 4: Reusable Form Components

Ortak kullanılan form componentleri:

```
src/features/post/components/FormFields/
├── ControlledTextarea.tsx
├── ControlledSelect.tsx
├── ControlledProductSelector.tsx
├── ControlledImagePicker.tsx
└── ControlledStarRating.tsx
```

### Adım 5: Screen Refactoring

Her screen için:
1. useState'leri kaldır
2. useForm hook'unu ekle
3. Controller componentlerini ekle
4. Validasyon kurallarını ekle
5. Error handling ekle
6. Submit handler'ı implement et

### Adım 6: Child Component Refactoring

Child componentler için:
1. Props interface'ini güncelle (form context kullanımı için)
2. useFormContext veya Controller pattern kullan
3. Error state'lerini göster

---

## Sonuç ve Öneriler

### ✅ Avantajlar

1. **Merkezi State Yönetimi**: Tüm form state'i tek bir yerde
2. **Otomatik Validasyon**: Zod schema ile type-safe validasyon
3. **Performans**: Re-render optimizasyonu
4. **Error Handling**: Otomatik error mesajları
5. **Type Safety**: TypeScript ile tam tip güvenliği
6. **Test Edilebilirlik**: Form logic'i test edilebilir

### ⚠️ Dikkat Edilmesi Gerekenler

1. **Child Component Refactoring**: Mevcut child componentlerin API'si değişebilir
2. **Modal Componentler**: Modal componentlerden veri aktarımı için setValue kullanılmalı
3. **Multi-Step Forms**: Step bazlı validasyon için özel logic gerekli
4. **Custom Components**: Gluestack UI componentleri için Controller wrapper gerekli
5. **Migration Süreci**: Mevcut kod ile yeni kod yan yana çalışabilmeli

### 🎯 Önerilen Yaklaşım

1. **Incremental Migration**: Screen'leri tek tek migrate et
2. **Backward Compatibility**: Mevcut API'yi mümkün olduğunca koru
3. **Component Wrappers**: Reusable wrapper componentler oluştur
4. **Type Safety**: Zod schema'lar ile tam tip güvenliği sağla
5. **Testing**: Her screen için form validation testleri yaz

---

## Ek Kaynaklar

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)

---

**Doküman Tarihi:** 2024
**Son Güncelleme:** Analiz tamamlandı
**Hazırlayan:** AI Assistant

