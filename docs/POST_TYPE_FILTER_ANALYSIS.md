# Post Type ve Context-Based Feed Filtreleme Analizi

Bu doküman, kategori hiyerarşisinde hangi seviyede hangi tip gönderilerin oluşturulabileceği, görüntülenebileceği ve backend'den nasıl getirileceği konusundaki mevcut durumu ve eksiklikleri analiz eder.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Post Type Kuralları](#post-type-kuralları)
3. [Mevcut Durum Analizi](#mevcut-durum-analizi)
4. [Eksiklikler ve Çözüm Önerileri](#eksiklikler-ve-çözüm-önerileri)
5. [Backend Endpoint Gereksinimleri](#backend-endpoint-gereksinimleri)
6. [Frontend Implementation Plan](#frontend-implementation-plan)

---

## 🎯 Genel Bakış

### Post Type Hiyerarşisi

```
Sub Category / Product Group Seviyesi:
  ✅ Oluşturulabilen: Free, Tips & Tricks, Question
  ✅ Görüntülenebilen: Free, Tips & Tricks, Question
  ❌ Görüntülenemeyen: Experience, Update, Benchmark

Product Seviyesi:
  ✅ Oluşturulabilen: Experience, Tips & Tricks, Question, Update, Benchmark
  ✅ Görüntülenebilen: Experience, Tips & Tricks, Question, Update, Benchmark
```

### Hiyerarşik Feed Mantığı

- **Bir üst seviye**, hem kendine ait hem de **alt seviyeye ait** gönderileri feedinde barındırabilir
- **Experience ve Benchmark** sadece **product feed'de** görüntülenir
- Sub Category ve Product Group feed'lerinde Experience ve Benchmark gönderileri **filtrelenmelidir**

---

## 📊 Post Type Kuralları

### Seviye Bazlı Post Type Matrisi

| Seviye | Free | Tips & Tricks | Question | Experience | Update | Benchmark |
|--------|------|--------------|----------|------------|--------|-----------|
| **Sub Category** | ✅ Oluştur | ✅ Oluştur | ✅ Oluştur | ❌ Oluştur | ❌ Oluştur | ❌ Oluştur |
| **Sub Category Feed** | ✅ Görüntüle | ✅ Görüntüle | ✅ Görüntüle | ❌ Görüntüleme | ❌ Görüntüleme | ❌ Görüntüleme |
| **Product Group** | ✅ Oluştur | ✅ Oluştur | ✅ Oluştur | ❌ Oluştur | ❌ Oluştur | ❌ Oluştur |
| **Product Group Feed** | ✅ Görüntüle | ✅ Görüntüle | ✅ Görüntüle | ❌ Görüntüleme | ❌ Görüntüleme | ❌ Görüntüleme |
| **Product** | ❌ Oluştur | ✅ Oluştur | ✅ Oluştur | ✅ Oluştur | ✅ Oluştur | ✅ Oluştur |
| **Product Feed** | ✅ Görüntüle | ✅ Görüntüle | ✅ Görüntüle | ✅ Görüntüle | ✅ Görüntüle | ✅ Görüntüle |

### Backend Tag Mapping

| Frontend Post Type | Backend Tag | Açıklama |
|-------------------|-------------|----------|
| Free | `Review` veya tag yok | Serbest gönderiler |
| Tips & Tricks | `Tips` | İpucu gönderileri |
| Question | `Question` | Soru gönderileri |
| Experience | `Experience` | Deneyim gönderileri |
| Update | `Update` | Güncelleme gönderileri |
| Benchmark | `Benchmark` | Karşılaştırma gönderileri |

---

## 🔍 Mevcut Durum Analizi

### ✅ Çalışan Özellikler

1. **CreatePostBottomSheet - Post Type Filtreleme**
   - `subcategories` ve `productgroups` seviyesinde: Sadece Free, Tips, Question gösteriliyor ✅
   - `products` seviyesinde: Experience, Tips, Comparison, Update, Question gösteriliyor ✅
   - **Dosya:** `src/components/CreatePostBottomSheet/index.tsx` (satır 114-141)

2. **Feed API - Context Support**
   - `getFeed` fonksiyonu `contextType` ve `contextId` parametrelerini destekliyor ✅
   - **Dosya:** `src/features/feed/api/feedApi.ts` (satır 94-141)

3. **Filtered Feed API - Context Support**
   - `getFilteredFeed` fonksiyonu `contextType` ve `contextId` parametrelerini destekliyor ✅
   - Backend endpoint: `GET /feed/filtered?contextType=<type>&contextId=<id>&tags[]=<tag>&sort=<sort>`
   - **Dosya:** `src/features/feed/api/feedApi.ts` (satır 161-284)
   - **Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 527-566)

4. **PostsScreen - Context Detection**
   - Context type ve ID'yi route params ve store'dan belirliyor ✅
   - **Dosya:** `src/features/post/screens/PostsScreen.tsx` (satır 64-103)

5. **Backend - Hiyerarşik Feed Mantığı**
   - Sub Category Feed: Sub category + alt product groups + alt products (sadece Free, Tips, Question) ✅
   - Product Group Feed: Product group + alt products (sadece Free, Tips, Question) ✅
   - Product Feed: Sadece product'a ait gönderiler (tüm tipler) ✅
   - **Backend Endpoint'ler:**
     - `GET /catalog/sub-categories/:subCategoryId/posts`
     - `GET /catalog/product-groups/:productGroupId/posts`
     - `GET /catalog/products/:productId/posts`
   - **Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 319-485, 570-647)

6. **Backend - Otomatik Post Type Filtreleme**
   - Backend context seviyesine göre otomatik filtreleme yapıyor ✅
   - Sub Category ve Product Group için Experience, Update, Benchmark otomatik filtreleniyor ✅
   - **Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 652-666)

### ❌ Eksik Özellikler

#### 1. PostsScreen - Filter/Sort UI Eksik

**Mevcut Durum:**
- `handleFilterPress` sadece `console.log` yapıyor
- Filter/Sort bottom sheet yok
- Post type'a göre filtreleme yok

**Dosya:** `src/features/post/screens/PostsScreen.tsx` (satır 147-150)

```typescript
const handleFilterPress = () => {
  // Handle filter/sort action
  console.log('Filter/Sort pressed');
};
```

**Eksik:**
- Filter/Sort bottom sheet component'i
- Context seviyesine göre post type filtreleme
- Sort seçenekleri (Newest First, Oldest First, Most Popular)

#### 2. Feed API - Context-Based Post Type Filtreleme Eksik

**Mevcut Durum:**
- `getFeed` fonksiyonu contextType ve contextId alıyor ama post type filtreleme yapmıyor
- Backend'den gelen tüm post type'ları gösteriliyor

**Dosya:** `src/features/feed/api/feedApi.ts` (satır 94-141)

**Eksik:**
- Context seviyesine göre otomatik post type filtreleme
- Sub Category ve Product Group için Experience, Update, Benchmark'ı filtreleme

#### 3. Filtered Feed API - Context Support (Backend'de Var, Frontend'de Eksik)

**Mevcut Durum:**
- Backend endpoint `contextType` ve `contextId` parametrelerini destekliyor ✅
- Frontend `getFilteredFeed` fonksiyonu bu parametreleri desteklemiyor ❌

**Backend Endpoint:**
```
GET /feed/filtered?contextType=<type>&contextId=<id>&tags[]=<tag>&sort=<sort>
```

**Dosya:** `src/features/feed/api/feedApi.ts` (satır 161-284)

**Eksik:**
- Frontend `getFilteredFeed` fonksiyonuna `contextType` ve `contextId` parametreleri eklenmeli
- Context seviyesine göre otomatik post type filtreleme (backend'de var, frontend'de kullanılmıyor)

#### 4. Hiyerarşik Feed Mantığı (Backend'de Var, Frontend'de Kullanılmıyor)

**Mevcut Durum:**
- Backend hiyerarşik feed mantığını destekliyor ✅
- Sub Category Feed: Sub category + alt product groups + alt products (sadece Free, Tips, Question)
- Product Group Feed: Product group + alt products (sadece Free, Tips, Question)
- Product Feed: Sadece product'a ait gönderiler (tüm tipler)

**Backend Endpoint'ler:**
- `GET /catalog/sub-categories/:subCategoryId/posts` - Hiyerarşik feed ✅
- `GET /catalog/product-groups/:productGroupId/posts` - Hiyerarşik feed ✅
- `GET /catalog/products/:productId/posts` - Product feed ✅

**Dosya:** `src/features/post/screens/PostsScreen.tsx`

**Eksik:**
- Frontend'de hiyerarşik feed endpoint'leri kullanılmıyor
- Şu anda `/feed` endpoint'i kullanılıyor, `/catalog/*/posts` endpoint'leri kullanılmalı
- Frontend'de bu endpoint'lerin kullanımı

#### 5. PostsScreen - Post Type Render Eksik

**Mevcut Durum:**
- Sadece `post` type'ı render ediliyor
- Experience, Benchmark, Tips, Question, Update render edilmiyor

**Dosya:** `src/features/post/screens/PostsScreen.tsx` (satır 436-471)

**Eksik:**
- Tüm post type'ları için render logic
- FeedScreen'deki mapping fonksiyonlarının kullanımı

---

## 🚨 Eksiklikler ve Çözüm Önerileri

### 1. Filter/Sort Bottom Sheet Component

**Gereksinim:**
- Context seviyesine göre post type filtreleme seçenekleri
- Sort seçenekleri (Newest First, Oldest First, Most Popular)
- Reset ve Done butonları

**Önerilen Yapı:**

```typescript
interface FilterSortBottomSheetProps {
  contextType: 'sub_category' | 'product_group' | 'product';
  onFilterChange: (filters: {
    postTypes?: string[];
    sort?: 'newest' | 'oldest' | 'popular';
  }) => void;
  onClose: () => void;
}

// Post Type Seçenekleri (Context'e göre)
const getAvailablePostTypes = (contextType: string) => {
  switch (contextType) {
    case 'sub_category':
    case 'product_group':
      return ['All', 'Generals', 'Tips & Tricks', 'Questions'];
    case 'product':
      return ['All', 'Reviews', 'Tips & Tricks', 'Benchmarks', 'Updates', 'Questions'];
    default:
      return [];
  }
};
```

**Yeni Dosya:** `src/features/post/components/FilterSortBottomSheet/index.tsx`

### 2. Catalog Posts API Endpoint'leri Kullanımı

**Gereksinim:**
- Hiyerarşik feed mantığı için `/catalog/*/posts` endpoint'lerini kullanmalı
- Backend otomatik olarak hiyerarşik feed ve post type filtreleme yapıyor

**Önerilen Yeni Endpoint Fonksiyonları:**

```typescript
// Sub Category Posts
export const getSubCategoryPosts = async (
  subCategoryId: string,
  cursor?: string,
  limit: number = 20,
  type?: 'tips' | 'experience' | 'comments' | 'benchmark'
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit.toString());
  if (type) params.append('type', type);

  const response = await apiService.getClient().get<FeedApiResponse>(
    `/catalog/sub-categories/${subCategoryId}/posts?${params.toString()}`
  );
  return response.data;
};

// Product Group Posts
export const getProductGroupPosts = async (
  productGroupId: string,
  cursor?: string,
  limit: number = 20,
  type?: 'tips' | 'experience' | 'comments' | 'benchmark'
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit.toString());
  if (type) params.append('type', type);

  const response = await apiService.getClient().get<FeedApiResponse>(
    `/catalog/product-groups/${productGroupId}/posts?${params.toString()}`
  );
  return response.data;
};

// Product Posts
export const getProductPosts = async (
  productId: string,
  cursor?: string,
  limit: number = 20,
  type?: 'tips' | 'experience' | 'comments' | 'benchmark'
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  params.append('limit', limit.toString());
  if (type) params.append('type', type);

  const response = await apiService.getClient().get<FeedApiResponse>(
    `/catalog/products/${productId}/posts?${params.toString()}`
  );
  return response.data;
};
```

**Not:** Backend otomatik olarak:
- Sub Category ve Product Group için Experience, Update, Benchmark'ı filtreler
- Hiyerarşik feed mantığını uygular (alt seviyelerin gönderilerini de getirir)

**Dosya:** `src/features/catalog/api/catalogApi.ts` (yeni veya mevcut dosyaya ekle)

### 3. Filtered Feed API - Context Support Ekleme

**Gereksinim:**
- `getFilteredFeed` fonksiyonuna `contextType` ve `contextId` parametreleri eklenmeli
- Backend zaten bu parametreleri destekliyor, frontend'de kullanılmalı

**Önerilen Değişiklik:**

```typescript
export const getFilteredFeed = async (
  cursor?: string,
  limit: number = 20,
  filters?: FeedFilterParams,
  contextType?: 'sub_category' | 'product_group' | 'product', // Yeni parametre
  contextId?: string // Yeni parametre
): Promise<FeedApiResponse> => {
  const params = new URLSearchParams();
  // ... mevcut parametreler
  
  // Context parametreleri (Backend'de zaten destekleniyor)
  if (contextType) {
    params.append('contextType', contextType);
  }
  if (contextId) {
    params.append('contextId', contextId);
  }
  
  // Backend otomatik olarak context seviyesine göre filtreleme yapıyor
  // Eğer tags belirtilmemişse, backend otomatik filtreleme yapar
  // Eğer tags belirtilmişse, kullanıcının seçtiği filtreler uygulanır
  
  // ...
};
```

**Backend Davranışı:**
- `contextType` ve `contextId` varsa, backend context'e göre filtreleme yapar
- `tags` yoksa, backend context seviyesine göre otomatik post type filtreleme yapar
- `tags` varsa, kullanıcının seçtiği tag filtreleri uygulanır

**Dosya:** `src/features/feed/api/feedApi.ts`

### 4. PostsScreen - Filter/Sort Integration

**Gereksinim:**
- Filter/Sort bottom sheet entegrasyonu
- Filtrelenmiş feed API çağrısı
- Post type render logic

**Önerilen Değişiklik:**

```typescript
// State
const [filters, setFilters] = useState<{
  postTypes?: string[];
  sort?: 'newest' | 'oldest' | 'popular';
}>({});

// Filtered feed hook
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  error,
} = useFilteredFeed(
  20,
  {
    tags: filters.postTypes?.map(type => mapPostTypeToTag(type)),
    sort: filters.sort ? mapSortToBackend(filters.sort) : undefined,
  },
  feedContextType,
  feedContextId
);

// Filter press handler
const handleFilterPress = () => {
  openBottomSheet(
    <FilterSortBottomSheet
      contextType={feedContextType}
      onFilterChange={(newFilters) => {
        setFilters(newFilters);
        closeBottomSheet();
      }}
      onClose={closeBottomSheet}
    />
  );
};
```

**Dosya:** `src/features/post/screens/PostsScreen.tsx`

### 5. Post Type Render Logic

**Gereksinim:**
- Tüm post type'ları için render logic
- FeedScreen'deki mapping fonksiyonlarının kullanımı

**Önerilen Değişiklik:**

```typescript
const renderFeedItem = useCallback((item: FeedApiItem) => {
  switch (item.type) {
    case 'post':
      return <PostCard data={mapToPostCardData(item)} />;
    case 'experience':
      return <ExperiencePostCard data={mapToExperienceCardData(item)} />;
    case 'benchmark':
      return <BenchmarkPostCard data={mapToBenchmarkCardData(item)} />;
    case 'tipsAndTricks':
      return <TipsAndTricksPostCard data={mapToTipsCardData(item)} />;
    case 'question':
      return <QuestionPostCard data={mapToQuestionCardData(item)} />;
    case 'update':
      return <UpdatePostCard data={mapToUpdateCardData(item)} />;
    default:
      return null;
  }
}, []);
```

**Dosya:** `src/features/post/screens/PostsScreen.tsx`

---

## 🔧 Backend Endpoint Durumu

### ✅ Mevcut Backend Endpoint'leri

#### 1. GET /catalog/sub-categories/:subCategoryId/posts

**Endpoint:**
```
GET /catalog/sub-categories/:subCategoryId/posts?type=<type>&cursor=<cursor>&limit=<limit>
```

**Özellikler:**
- ✅ Hiyerarşik feed mantığı (sub category + alt product groups + alt products)
- ✅ Otomatik post type filtreleme (Experience, Update, Benchmark hariç)
- ✅ `type` parametresi ile manuel filtreleme (`tips`, `experience`, `comments`, `benchmark`)

**Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 319-373)

#### 2. GET /catalog/product-groups/:productGroupId/posts

**Endpoint:**
```
GET /catalog/product-groups/:productGroupId/posts?type=<type>&cursor=<cursor>&limit=<limit>
```

**Özellikler:**
- ✅ Hiyerarşik feed mantığı (product group + alt products)
- ✅ Otomatik post type filtreleme (Experience, Update, Benchmark hariç)
- ✅ `type` parametresi ile manuel filtreleme (`tips`, `experience`, `comments`, `benchmark`)

**Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 377-429)

#### 3. GET /catalog/products/:productId/posts

**Endpoint:**
```
GET /catalog/products/:productId/posts?type=<type>&cursor=<cursor>&limit=<limit>
```

**Özellikler:**
- ✅ Product feed (sadece product'a ait gönderiler)
- ✅ Tüm post tipleri gösterilir (filtreleme yok)
- ✅ `type` parametresi ile manuel filtreleme (`tips`, `experience`, `comments`, `benchmark`)

**Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 433-484)

#### 4. GET /feed - Context-Based Feed

**Endpoint:**
```
GET /feed?cursor=<cursor>&limit=<limit>&contextType=<type>&contextId=<id>
```

**Özellikler:**
- ✅ Context-based feed
- ✅ Context seviyesine göre otomatik post type filtreleme

**Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 488-523)

#### 5. GET /feed/filtered - Context-Based Filtered Feed

**Endpoint:**
```
GET /feed/filtered?contextType=<type>&contextId=<id>&tags[]=<tag>&sort=<sort>&cursor=<cursor>&limit=<limit>
```

**Özellikler:**
- ✅ Context-based filtered feed
- ✅ `contextType` ve `contextId` parametreleri destekleniyor
- ✅ Context seviyesine göre otomatik post type filtreleme
- ✅ `tags` parametresi ile manuel filtreleme
- ✅ `sort` parametresi (`recent`, `top`)

**Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 527-566)

### Backend Otomatik Filtreleme Mantığı

Backend otomatik olarak context seviyesine göre post type filtreleme yapıyor:

| Context Seviyesi | Gösterilen Post Tipleri | Filtrelenen Post Tipleri |
|------------------|------------------------|--------------------------|
| Sub Category | Free, Tips, Question | Experience, Update, Benchmark |
| Product Group | Free, Tips, Question | Experience, Update, Benchmark |
| Product | Tüm tipler | Yok |

**Backend Dokümantasyon:** `docs/MOBILE_API_COMPATIBILITY.md` (satır 652-666)

---

## 📱 Frontend Implementation Plan

### Phase 1: Filter/Sort Bottom Sheet Component

**Dosya:** `src/features/post/components/FilterSortBottomSheet/index.tsx`

**Özellikler:**
- Context seviyesine göre post type seçenekleri
- Sort seçenekleri (Newest First, Oldest First, Most Popular)
- Reset ve Done butonları
- Radio button seçimi

**Post Type Mapping:**
```typescript
const POST_TYPE_MAPPING = {
  'All': undefined,
  'Generals': 'Review', // Free posts
  'Reviews': 'Review', // Experience posts (product seviyesinde)
  'Tips & Tricks': 'Tips',
  'Questions': 'Question',
  'Benchmarks': 'Benchmark',
  'Updates': 'Update',
};
```

### Phase 2: Catalog Posts API Endpoint'leri

**Dosya:** `src/features/catalog/api/catalogApi.ts` (yeni veya mevcut dosyaya ekle)

**Yeni Fonksiyonlar:**
1. `getSubCategoryPosts` - Sub category posts endpoint'i
2. `getProductGroupPosts` - Product group posts endpoint'i
3. `getProductPosts` - Product posts endpoint'i

**Özellikler:**
- Hiyerarşik feed mantığı (backend'de zaten var)
- Otomatik post type filtreleme (backend'de zaten var)
- `type` parametresi ile manuel filtreleme

### Phase 3: Feed API Updates

**Dosya:** `src/features/feed/api/feedApi.ts`

**Değişiklikler:**
1. `getFilteredFeed` fonksiyonuna `contextType` ve `contextId` parametreleri ekle
2. Backend zaten bu parametreleri destekliyor, frontend'de kullanılmalı

### Phase 4: Catalog Posts Hooks

**Dosya:** `src/features/catalog/api/hooks.ts` (yeni veya mevcut dosyaya ekle)

**Yeni Hooks:**
1. `useSubCategoryPosts` - Sub category posts hook
2. `useProductGroupPosts` - Product group posts hook
3. `useProductPosts` - Product posts hook

**Özellikler:**
- Infinite scroll desteği
- `type` parametresi ile filtreleme
- Context seviyesine göre otomatik filtreleme (backend'de)

### Phase 5: Feed Hooks Updates

**Dosya:** `src/features/feed/api/hooks.ts`

**Değişiklikler:**
1. `useFilteredFeed` hook'una `contextType` ve `contextId` parametreleri
2. Backend otomatik filtreleme yapıyor, frontend'de sadece parametreleri göndermeli

### Phase 6: PostsScreen Integration

**Dosya:** `src/features/post/screens/PostsScreen.tsx`

**Değişiklikler:**
1. Filter/Sort state management
2. Filter/Sort bottom sheet entegrasyonu
3. Filtered feed API çağrısı
4. Post type render logic (tüm post type'lar için)

### Phase 7: Post Type Mapping Functions

**Dosya:** `src/features/post/utils/postTypeMapping.ts` (yeni)

**Fonksiyonlar:**
- `mapPostTypeToTag`: Frontend post type → Backend tag
- `mapTagToPostType`: Backend tag → Frontend post type
- `getAllowedPostTypesForContext`: Context seviyesine göre izin verilen post type'lar
- `mapSortToBackend`: Frontend sort → Backend sort
- `mapSortFromBackend`: Backend sort → Frontend sort

---

## 📝 Request/Response Yapıları

### Request: GET /catalog/sub-categories/:subCategoryId/posts

```typescript
// Request
GET /catalog/sub-categories/330e8400-e29b-41d4-a716-446655440000/posts?type=tips&limit=20

// Backend:
// 1. Hiyerarşik feed: Sub category + alt product groups + alt products
// 2. Otomatik filtreleme: Experience, Update, Benchmark hariç
// 3. Manuel filtreleme: type=tips ile sadece Tips gönderileri
```

### Request: GET /catalog/product-groups/:productGroupId/posts

```typescript
// Request
GET /catalog/product-groups/550e8400-e29b-41d4-a716-446655440000/posts?type=tips&limit=20

// Backend:
// 1. Hiyerarşik feed: Product group + alt products
// 2. Otomatik filtreleme: Experience, Update, Benchmark hariç
// 3. Manuel filtreleme: type=tips ile sadece Tips gönderileri
```

### Request: GET /catalog/products/:productId/posts

```typescript
// Request
GET /catalog/products/770e8400-e29b-41d4-a716-446655440000/posts?type=experience&limit=20

// Backend:
// 1. Product feed: Sadece product'a ait gönderiler
// 2. Otomatik filtreleme: Yok (tüm tipler gösterilir)
// 3. Manuel filtreleme: type=experience ile sadece Experience ve Update gönderileri
```

### Request: GET /feed/filtered (Context-Based)

```typescript
// Request
GET /feed/filtered?contextType=product_group&contextId=550e8400-e29b-41d4-a716-446655440000&tags[]=Tips&tags[]=Question&sort=recent&limit=20

// Backend:
// 1. Context'e göre otomatik filtreleme yapar (sub_category/product_group için Experience, Update, Benchmark hariç)
// 2. Kullanıcının seçtiği tag filtrelerini uygular
// 3. Sort parametresine göre sıralar
```

### Response: FeedApiResponse

```typescript
interface FeedApiResponse {
  items: FeedApiItem[];
  pagination: {
    cursor?: string;
    hasMore: boolean;
    limit: number;
  };
}

interface FeedApiItem {
  type: 'post' | 'experience' | 'benchmark' | 'tipsAndTricks' | 'question' | 'update';
  data: ProfilePost | ReviewApiItem | BenchmarkApiItem | TipsApiItem | QuestionApiItem | UpdateApiItem;
}
```

---

## 🎯 Özet

### Eksik Ekranlar
1. ❌ **FilterSortBottomSheet** - Filter/Sort bottom sheet component'i

### Eksik Logic'ler
1. ❌ **Context-based post type filtreleme** - Feed API'de otomatik filtreleme
2. ❌ **Filter/Sort state management** - PostsScreen'de filter state
3. ❌ **Post type render logic** - Tüm post type'lar için render
4. ❌ **Hiyerarşik feed mantığı** - Üst seviye alt seviyeye ait gönderileri gösterme

### Eksik Endpoint Kullanımları
1. ❌ **GET /catalog/sub-categories/:id/posts** - Frontend'de kullanılmıyor
2. ❌ **GET /catalog/product-groups/:id/posts** - Frontend'de kullanılmıyor
3. ❌ **GET /catalog/products/:id/posts** - Frontend'de kullanılmıyor
4. ⚠️ **GET /feed/filtered** - `contextType` ve `contextId` parametreleri backend'de var ama frontend'de kullanılmıyor

### Eksik Request/Response Yapıları
1. ❌ **CatalogPostsRequest** - Sub category, product group, product posts için request yapıları
2. ❌ **Post type mapping** - Frontend post type ↔ Backend `type` parametresi mapping
3. ⚠️ **FilteredFeedRequest** - `contextType` ve `contextId` alanları backend'de var ama frontend'de kullanılmıyor

### Post Type Mapping (Frontend ↔ Backend)

**Frontend Post Type → Backend `type` Parametresi:**

| Frontend Post Type | Backend `type` Parametresi | Açıklama |
|-------------------|---------------------------|----------|
| Free | `comments` | Free ve Question gönderileri |
| Tips & Tricks | `tips` | Tips gönderileri |
| Question | `comments` | Free ve Question gönderileri |
| Experience | `experience` | Experience ve Update gönderileri |
| Update | `experience` | Experience ve Update gönderileri |
| Benchmark | `benchmark` | Benchmark gönderileri |

**Backend Tag → Frontend Post Type:**

| Backend Tag | Frontend Post Type | Açıklama |
|-------------|-------------------|----------|
| `Review` | Free | Serbest gönderiler |
| `Tips` | Tips & Tricks | İpucu gönderileri |
| `Question` | Question | Soru gönderileri |
| `Experience` | Experience | Deneyim gönderileri |
| `Update` | Update | Güncelleme gönderileri |
| `Benchmark` | Benchmark | Karşılaştırma gönderileri |

---

**Son Güncelleme:** 2024-12-19
