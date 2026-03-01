# Collections API Endpoints - Backend Gereksinim Dökümanı

> **Base URL:** `{API_BASE}/events/collections`
> **Auth:** Bearer Token (JWT) - Tüm endpoint'ler auth gerektirir
> **Tarih:** 2026-02-26

---

## Genel Bakış

Frontend'de şu anda Collections tab'ı ve Collection Detail ekranı tamamen **mock data** ile çalışıyor. Aşağıdaki endpoint'lerin backend'de geliştirilmesi gerekiyor.

### Mevcut Durum
| Bileşen | Mock Kullanıyor | İhtiyaç Duyulan EP |
|---|---|---|
| CollectionsTab (liste) | `MOCK_COLLECTIONS` (6 item) | EP-01 |
| CollectionsTab (chip filtreler) | `FILTER_CATEGORIES` hardcoded | EP-02 |
| CollectionDetailScreen | `MOCK_COLLECTION` + `MOCK_BADGES` | EP-03 (mevcut, güncellenmeli) |
| CollectionsBottomSheet (cascading filter) | `MOCK_MAIN_CATEGORIES`, `MOCK_SUB_CATEGORIES`, `MOCK_PRODUCT_GROUPS` | EP-04, EP-05, EP-06 (Medusa) |

---

## EP-01: Collections Listesi

Collections tab'ında gösterilen collection listesini getirir. Arama, kategori chip filtresi ve bottom sheet filtreleri desteklemelidir.

### Request

```
GET /events/collections
```

**Query Parameters:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `search` | string | Hayır | Collection title veya description'da arama. Frontend 500ms debounce yapıyor. |
| `category` | string | Hayır | Chip filter kategorisi (ör: `electronics`, `cosmetics`, `starter_packs`). `all` veya boş = tüm kategoriler. |
| `mainCategoryId` | string | Hayır | Bottom sheet ana kategori filtresi (Medusa category ID) |
| `subCategoryId` | string | Hayır | Bottom sheet alt kategori filtresi (Medusa category ID) |
| `productGroupId` | string | Hayır | Bottom sheet ürün grubu filtresi (Medusa category ID) - ileride eklenecek |
| `cursor` | string | Hayır | Pagination cursor (infinite scroll için) |
| `limit` | number | Hayır | Sayfa başına item sayısı (default: 20, max: 50) |

### Response

```json
{
  "collections": [
    {
      "id": "col_01",
      "title": "Silicon Strategist",
      "description": "Master the hardware landscape.",
      "currentProgress": 12,
      "totalProgress": 120,
      "backgroundGradient": {
        "colors": ["#FF6B9D", "#C084FC", "#7C3AED"],
        "start": { "x": 0, "y": 0 },
        "end": { "x": 1, "y": 1 }
      },
      "category": "electronics"
    },
    {
      "id": "col_02",
      "title": "Sonic Voyagers",
      "description": "Feel every beat.",
      "currentProgress": 40,
      "totalProgress": 74,
      "backgroundGradient": {
        "colors": ["#0EA5E9", "#6366F1", "#8B5CF6"],
        "start": { "x": 0, "y": 0 },
        "end": { "x": 1, "y": 1 }
      },
      "category": "electronics"
    }
  ],
  "pagination": {
    "cursor": "eyJpZCI6ImNvbF8wMiJ9",
    "hasMore": true,
    "limit": 20,
    "total": 42
  }
}
```

### Response Tipleri (TypeScript)

```typescript
interface CollectionBackgroundGradient {
  colors: string[];          // Min 2 renk, hex formatında (ör: "#FF6B9D")
  start: { x: number; y: number }; // 0-1 arası, gradient başlangıç noktası
  end: { x: number; y: number };   // 0-1 arası, gradient bitiş noktası
}

interface Collection {
  id: string;
  title: string;
  description: string;
  currentProgress: number;   // Kullanıcının bu collection'daki mevcut ilerlemesi
  totalProgress: number;     // Collection'ın toplam ilerleme hedefi
  backgroundGradient: CollectionBackgroundGradient;
  category?: string;         // Chip filter kategorisi (ör: "electronics", "cosmetics")
}

interface CollectionsListResponse {
  collections: Collection[];
  pagination: {
    cursor: string | null;   // Sonraki sayfa cursor'ı, null = son sayfa
    hasMore: boolean;
    limit: number;
    total: number;           // Toplam collection sayısı (filtreler dahil)
  };
}
```

### Notlar
- `currentProgress` / `totalProgress`: Kullanıcıya özeldir (authenticated user). Giriş yapmamış kullanıcı için `currentProgress: 0` dönebilir.
- `backgroundGradient`: Her collection'ın kendine özel gradient renkleri olmalıdır. Frontend `expo-linear-gradient` ile render ediyor.
- `category` alanı chip filter ile eşleşmeli (EP-02'deki kategori handle'ları ile tutarlı olmalı).
- Frontend layout pattern: İlk item full-width, sonraki 2'li half-width, sonraki 2'li half-width, sonra tekrar full-width... (Her 5 item'de bir full). Bu layout frontend tarafında hesaplanıyor, backend'in bununla ilgilenmesine gerek yok.

---

## EP-02: Collection Chip Filtre Kategorileri

CollectionsTab üstündeki yatay kaydırılabilir chip filtrelerin kategorilerini getirir.

### Request

```
GET /events/collections/categories
```

**Query Parameters:** Yok

### Response

```json
{
  "categories": [
    {
      "id": "all",
      "name": "All",
      "handle": "all"
    },
    {
      "id": "cat_01",
      "name": "Starter Packs",
      "handle": "starter_packs"
    },
    {
      "id": "cat_02",
      "name": "Electronics",
      "handle": "electronics"
    },
    {
      "id": "cat_03",
      "name": "Cosmetics",
      "handle": "cosmetics"
    }
  ]
}
```

### Response Tipleri (TypeScript)

```typescript
interface CollectionCategory {
  id: string;
  name: string;    // UI'da gösterilecek isim
  handle: string;  // EP-01'de "category" query param olarak gönderilecek değer
}

interface CollectionCategoriesResponse {
  categories: CollectionCategory[];
}
```

### Notlar
- İlk eleman her zaman `"All"` olmalıdır (veya frontend "All"'ı kendisi ekler, bu durumda backend sadece gerçek kategorileri döner - hangisi uygunsa).
- `handle` alanı EP-01'deki `category` query parametresi ile eşleşmelidir.
- Bu liste sık değişmez, frontend 24 saat cache'liyor.

---

## EP-03: Collection Detay + Badge Listesi

Belirli bir collection'ın detayını ve ona ait badge listesini getirir. Badge'ler içinde arama destekler.

### Request

```
GET /events/collections/{collectionId}
```

**Path Parameters:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `collectionId` | string | Evet | Collection ID |

**Query Parameters:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `search` | string | Hayır | Badge title veya description'da arama. Frontend 400ms debounce yapıyor. |

### Response

```json
{
  "collection": {
    "id": "col_01",
    "title": "Silicon Strategist",
    "description": "Completing this collection proves your deep understanding of the digital backbone. You've demonstrated that you know exactly what drives modern productivity. You are now a certified authority in high-performance computing.",
    "currentProgress": 12,
    "totalProgress": 120,
    "backgroundGradient": {
      "colors": ["#3B2F63", "#5C4A7D", "#8B6F47"],
      "start": { "x": 0, "y": 0 },
      "end": { "x": 1, "y": 1 }
    },
    "category": "electronics"
  },
  "badges": [
    {
      "id": "badge_01",
      "title": "Boot Loader",
      "description": "Add your first computer or tablet to your inventory.",
      "icon": "https://cdn.tipbox.co/badges/badge_01.png",
      "currentProgress": 8,
      "totalProgress": 10,
      "status": "in_progress"
    },
    {
      "id": "badge_02",
      "title": "Sound Wave",
      "description": "Add 3 audio devices to your collection.",
      "icon": "https://cdn.tipbox.co/badges/badge_02.png",
      "currentProgress": 10,
      "totalProgress": 10,
      "status": "completed"
    },
    {
      "id": "badge_03",
      "title": "First Step",
      "description": "Register your first product in the system.",
      "icon": "https://cdn.tipbox.co/badges/badge_03.png",
      "currentProgress": 0,
      "totalProgress": 10,
      "status": "not_started"
    }
  ]
}
```

### Response Tipleri (TypeScript)

```typescript
type CollectionBadgeStatus = 'not_started' | 'in_progress' | 'completed';

interface CollectionBadge {
  id: string;
  title: string;
  description: string;
  icon: string;              // Public CDN URL (badge görseli). ZORUNLU. Download özelliği için public erişilebilir olmalı.
  currentProgress: number;   // Kullanıcının bu badge'deki mevcut ilerlemesi
  totalProgress: number;     // Badge'in toplam ilerleme hedefi
  status: CollectionBadgeStatus;  // "not_started" | "in_progress" | "completed"
}

interface CollectionDetailResponse {
  collection: Collection;    // EP-01'deki Collection tipi ile aynı
  badges: CollectionBadge[];
}
```

### Status Hesaplama Kuralları
- `not_started`: `currentProgress === 0`
- `in_progress`: `currentProgress > 0 && currentProgress < totalProgress`
- `completed`: `currentProgress >= totalProgress`

### Notlar
- **Bu endpoint zaten frontend'de implement edilmiş** (`communityEventsApi.ts` > `getCollectionDetail`). Backend tarafında geliştirilmesi/güncellenmesi gerekiyor.
- Mevcut frontend URL: `GET /events/collections/{collectionId}?search=...`
- `search` parametresi badge'lerin `title` ve `description` alanlarında arama yapmalıdır.
- `icon` alanı mutlaka **public erişilebilir URL** olmalıdır (CDN). Frontend bu URL'i hem görseli göstermek hem de kullanıcının badge'i indirmesi (Media Library'ye kaydetme) için kullanıyor.
- Status filtreleme (All / Not Started / In Progress / Completed) **client-side** yapılıyor. Backend'in bunu desteklemesine gerek yok.
- `collection.description` detay sayfasında uzun gösterildiğinden kısaltma yapılmamalıdır.

---

## EP-04: Ana Kategoriler (Medusa - CollectionsBottomSheet)

CollectionsBottomSheet'teki ilk dropdown (Main Category) için ana kategorileri getirir.

### Request

```
GET /store/product-categories?parent_category_id=null&limit=100&offset=0
```

> **NOT:** Bu endpoint zaten frontend'de `medusaApi.ts` > `getMainCategories` olarak implement edilmiş. Medusa standart endpoint'idir.

### Response

```json
{
  "product_categories": [
    {
      "id": "pcat_01",
      "name": "Analytics Tools",
      "handle": "analytics-tools",
      "parent_category_id": null,
      "is_active": true,
      "is_internal": false,
      "rank": 0,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "pcat_02",
      "name": "Content Management",
      "handle": "content-management",
      "parent_category_id": null,
      "is_active": true,
      "is_internal": false,
      "rank": 1,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 10,
  "offset": 0,
  "limit": 100
}
```

### Response Tipleri (TypeScript)

```typescript
interface MedusaCategory {
  id: string;
  name: string;
  handle: string;
  parent_category_id: string | null;
  parent_category?: MedusaCategory;
  category_children?: MedusaCategory[];
  rank?: number;
  description?: string;
  is_active: boolean;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

interface MedusaCategoriesResponse {
  product_categories: MedusaCategory[];
  count: number;
  offset: number;
  limit: number;
}
```

### Notlar
- `parent_category_id: null` olan kategoriler = ana kategoriler.
- Frontend bu veriyi 24 saat cache'liyor (sık değişmez).
- Şu an **MOCK_MAIN_CATEGORIES** (10 adet) kullanılıyor. Medusa'da gerçek kategoriler oluşturulmalı.

---

## EP-05: Alt Kategoriler (Medusa - CollectionsBottomSheet)

CollectionsBottomSheet'teki ikinci dropdown (Sub Category) için seçilen ana kategorinin alt kategorilerini getirir.

### Request

```
GET /store/product-categories?parent_category_id={parentCategoryId}&limit=100&offset=0
```

**Query Parameters:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `parent_category_id` | string | Evet | Ana kategori ID'si |
| `limit` | number | Hayır | Default: 100 |
| `offset` | number | Hayır | Default: 0 |

### Response

EP-04 ile aynı format (`MedusaCategoriesResponse`). Sadece `parent_category_id` alanı bu sefer parent'ın ID'sini içerir.

```json
{
  "product_categories": [
    {
      "id": "pcat_sub_01",
      "name": "Business Intelligence",
      "handle": "business-intelligence",
      "parent_category_id": "pcat_01",
      "is_active": true,
      "is_internal": false,
      "rank": 0,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "pcat_sub_02",
      "name": "Data Visualization",
      "handle": "data-visualization",
      "parent_category_id": "pcat_01",
      "is_active": true,
      "is_internal": false,
      "rank": 1,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 4,
  "offset": 0,
  "limit": 100
}
```

### Notlar
- Main Category seçilmeden bu dropdown disabled. Frontend zaten `enabled: enabled && !!parentCategoryId` kontrolü yapıyor.
- Main Category değiştiğinde Sub Category ve Product Group seçimleri resetleniyor.
- Şu an **MOCK_SUB_CATEGORIES** (5 parent x 4 child = 20 adet) kullanılıyor.

---

## EP-06: Ürün Grupları (Medusa - CollectionsBottomSheet)

CollectionsBottomSheet'teki üçüncü dropdown (Product Group) için seçilen alt kategorinin ürün gruplarını getirir.

### Request

```
GET /store/product-categories?parent_category_id={subCategoryId}&limit=100&offset=0
```

### Response

EP-04 ile aynı format. Üçüncü seviye kategori olarak davranır.

```json
{
  "product_categories": [
    {
      "id": "pcat_pg_01",
      "name": "Cloud BI Solutions",
      "handle": "cloud-bi-solutions",
      "parent_category_id": "pcat_sub_01",
      "is_active": true,
      "is_internal": false,
      "rank": 0,
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "count": 3,
  "offset": 0,
  "limit": 100
}
```

### Notlar
- Sub Category seçilmeden bu dropdown disabled.
- Sub Category değiştiğinde Product Group seçimi resetleniyor.
- Şu an **MOCK_PRODUCT_GROUPS** (3 parent x 3 child = 9 adet) kullanılıyor.
- Bu endpoint `CollectionFilters.productGroupId` alanı ile ilişkili ve "Coming soon" olarak işaretlenmiş. Ancak UI'da zaten mevcut.

---

## Hata Yanıtları (Tüm Endpoint'ler İçin Geçerli)

### 400 Bad Request

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid query parameter: limit must be between 1 and 50"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Collection not found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Frontend Entegrasyon Notları

### Mevcut API Dosyaları
- **API fonksiyonları:** `src/features/events/api/communityEventsApi.ts`
- **React Query hooks:** `src/features/events/api/hooks.ts`
- **Medusa API:** `src/features/events/api/medusaApi.ts`
- **Tipler:** `src/features/events/types/collection.types.ts`, `src/features/events/types/medusa.types.ts`

### Mevcut Hook/API Durumu
| Hook/API | Durum | EP |
|---|---|---|
| `getCollectionDetail` / `useCollectionDetail` | Mevcut, mock fallback ile çalışıyor | EP-03 |
| `getMainCategories` / `useMainCategories` | Mevcut ama mock data'ya fallback | EP-04 |
| `getSubCategories` / `useSubCategories` | Mevcut ama mock data'ya fallback | EP-05 |
| `getCategoryById` / `useCategoryById` | Mevcut | EP-04/05/06 |
| Collection list endpoint | **YOK - Oluşturulacak** | EP-01 |
| Collection categories endpoint | **YOK - Oluşturulacak** | EP-02 |

### Backend Geliştirme Sonrası Frontend'de Yapılacaklar
1. **EP-01:** `communityEventsApi.ts`'ye `getCollections` fonksiyonu eklenecek, `hooks.ts`'ye `useCollections` infinite query hook'u eklenecek, `CollectionsTab.tsx`'deki `MOCK_COLLECTIONS` kaldırılacak.
2. **EP-02:** `communityEventsApi.ts`'ye `getCollectionCategories` fonksiyonu eklenecek, `CollectionsTab.tsx`'deki `FILTER_CATEGORIES` hardcoded array kaldırılacak.
3. **EP-03:** Zaten mevcut. Mock fallback (`MOCK_COLLECTION`, `MOCK_BADGES`) kaldırılacak.
4. **EP-04/05/06:** `medusaApi.ts` zaten hazır. `CollectionsBottomSheet`'teki `MOCK_MAIN_CATEGORIES`, `MOCK_SUB_CATEGORIES`, `MOCK_PRODUCT_GROUPS` kaldırılıp gerçek API hook'larına (`useMainCategories`, `useSubCategories`) geçilecek.

---

## Özet: Geliştirme Öncelik Sırası

| Öncelik | EP | Endpoint | Açıklama |
|---|---|---|---|
| 1 | EP-01 | `GET /events/collections` | Collections listesi - Ana ihtiyaç |
| 2 | EP-03 | `GET /events/collections/:id` | Collection detay + badge'ler - Mevcut, güncellenmeli |
| 3 | EP-02 | `GET /events/collections/categories` | Chip filter kategorileri |
| 4 | EP-04 | `GET /store/product-categories` (parent=null) | Medusa ana kategoriler |
| 5 | EP-05 | `GET /store/product-categories` (parent=id) | Medusa alt kategoriler |
| 6 | EP-06 | `GET /store/product-categories` (parent=sub_id) | Medusa ürün grupları |
