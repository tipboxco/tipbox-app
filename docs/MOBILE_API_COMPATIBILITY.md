# Mobil API Uyumluluk Dokümantasyonu

Bu dokümantasyon, mobil uygulama ve backend API arasındaki uyumluluğu ve kullanım örneklerini açıklar.

## İçindekiler

1. [Post Oluşturma Endpoint'leri](#post-oluşturma-endpointleri)
2. [Feed Endpoint'leri](#feed-endpointleri)
3. [Hiyerarşik Feed Mantığı](#hiyerarşik-feed-mantığı)
4. [Filtreleme Kılavuzu](#filtreleme-kılavuzu)
5. [Parametre Mapping Tabloları](#parametre-mapping-tabloları)
6. [Hata Yönetimi](#hata-yönetimi)
7. [Best Practices](#best-practices)

---

## Post Oluşturma Endpoint'leri

### 1. Free Post (Serbest Gönderi)

**Endpoint:** `POST /posts/free`

**Request Body:**
```json
{
  "contextType": "sub_category" | "product_group" | "product",
  "contextId": "uuid",
  "description": "string",
  "images": ["string"] (optional),
  "eventId": "string" (optional)
}
```

**Response (201):**
```json
{
  "id": "post-id",
  "message": "Post başarıyla oluşturuldu",
  "success": true
}
```

**Örnek:**
```json
{
  "contextType": "product",
  "contextId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Bu ürün hakkında bir gönderi",
  "images": ["https://example.com/image1.jpg"]
}
```

---

### 2. Tips & Tricks Post (İpucu Gönderisi)

**Endpoint:** `POST /posts/tips-and-tricks`

**Request Body:**
```json
{
  "contextType": "sub_category" | "product_group" | "product",
  "contextId": "uuid",
  "description": "string",
  "benefitCategory": "time_saving" | "energy_efficiency" | "durability" | "better_result",
  "images": ["string"] (optional),
  "eventId": "string" (optional)
}
```

**BenefitCategory Mapping:**

Mobil'de `selectedCategory` değerini backend'in beklediği enum değerine dönüştürmek gerekiyor:

| Mobil Değer | Backend Enum | Açıklama |
|------------|--------------|----------|
| `time_saving` | `time_saving` | Zaman tasarrufu |
| `energy_efficiency` | `energy_efficiency` | Enerji verimliliği |
| `durability` | `durability` | Dayanıklılık |
| `better_result` | `better_result` | Daha iyi sonuç |

**Response (201):**
```json
{
  "id": "post-id",
  "message": "Tips & tricks post başarıyla oluşturuldu",
  "success": true
}
```

**Örnek:**
```json
{
  "contextType": "product",
  "contextId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Bu ürün için harika bir ipucu",
  "benefitCategory": "time_saving",
  "images": ["https://example.com/image1.jpg"]
}
```

---

### 3. Question Post (Soru Gönderisi)

**Endpoint:** `POST /posts/question`

**Request Body:**
```json
{
  "contextType": "sub_category" | "product_group" | "product",
  "contextId": "uuid",
  "description": "string",
  "selectedBoostOptionId": "string",
  "images": ["string"] (optional),
  "eventId": "string" (optional)
}
```

**Boost Options:**

Boost option'ları almak için:
- **Endpoint:** `GET /posts/boost-options`
- **Response:** `BoostOption[]`

**Response (201):**
```json
{
  "id": "post-id",
  "message": "Question post başarıyla oluşturuldu",
  "success": true
}
```

**Örnek:**
```json
{
  "contextType": "product",
  "contextId": "550e8400-e29b-41d4-a716-446655440000",
  "description": "Bu ürün hakkında bir soru",
  "selectedBoostOptionId": "boost-option-id-123",
  "images": ["https://example.com/image1.jpg"]
}
```

---

### 4. Benchmark Post (Karşılaştırma)

**Endpoint:** `POST /posts/benchmark`

**Request Body:**
```json
{
  "contextType": "product",
  "contextId": "uuid",
  "products": [
    { "productId": "uuid", "isSelected": true },
    { "productId": "uuid", "isSelected": true }
  ],
  "description": "string",
  "images": ["string"] (optional),
  "eventId": "string" (optional)
}
```

**Not:** `contextType` sadece `product` olabilir. En az 2 ürün seçilmelidir.

**Mobil'den Backend'e Dönüşüm:**

```typescript
// Mobil formatı
{
  selectedProduct1: "product-id-1",
  selectedProduct2: "product-id-2"
}

// Backend formatına dönüşüm
{
  products: [
    { productId: "product-id-1", isSelected: true },
    { productId: "product-id-2", isSelected: true }
  ]
}
```

**Response (201):**
```json
{
  "id": "post-id",
  "message": "Benchmark post başarıyla oluşturuldu",
  "success": true
}
```

---

### 5. Update Post (Güncelleme)

**Endpoint:** `POST /posts/update`

**Request Body:**
```json
{
  "contextType": "product",
  "contextId": "uuid",
  "content": "string",
  "images": ["string"] (optional),
  "eventId": "string" (optional)
}
```

**Not:** `contextType` sadece `product` olabilir.

**Response (201):**
```json
{
  "id": "post-id",
  "message": "Update post başarıyla oluşturuldu",
  "success": true
}
```

---

### 6. Experience Post (Deneyim Paylaşımı)

**Endpoint:** `POST /posts/experience`

**Request Body:**
```json
{
  "contextType": "product",
  "contextId": "uuid",
  "selectedDurationId": "uuid" | null,
  "selectedLocationId": "uuid" | null,
  "selectedPurposeId": "uuid" | null,
  "content": "string",
  "experience": [
    {
      "type": "price_and_shopping" | "product_and_usage",
      "content": "string",
      "rating": 1-5
    }
  ],
  "status": "own" | "tested",
  "images": ["string"] (optional),
  "experienceSnippetId": "string" (optional),
  "eventId": "string" (optional)
}
```

**Not:** `contextType` sadece `product` olabilir.

**Parametre İsimleri:**

Backend hem yeni hem eski parametre isimlerini destekliyor:

| Yeni İsim (Önerilen) | Eski İsim (Deprecated) |
|---------------------|------------------------|
| `selectedDurationId` | `step1Duration`, `selectedDuration` |
| `selectedLocationId` | `selectedCondition`, `selectedLocation` |
| `selectedPurposeId` | `selectedFrequency`, `selectedPurpose` |
| `content` | `experienceText` |

**Experience Array Dönüşümü:**

```typescript
// Mobil formatı
{
  priceRating: 4,
  productRating: 5,
  experienceText: "Genel deneyim metni"
}

// Backend formatına dönüşüm
{
  experience: [
    {
      type: "price_and_shopping",
      content: "Fiyat ve alışveriş deneyimi metni",
      rating: 4
    },
    {
      type: "product_and_usage",
      content: "Ürün ve kullanım deneyimi metni",
      rating: 5
    }
  ]
}
```

**Experience Options:**

Experience seçeneklerini almak için:
- **Endpoint:** `GET /posts/experience/options`
- **Response:**
```json
{
  "durations": [{ "id": "uuid", "name": "string" }],
  "locations": [{ "id": "uuid", "name": "string" }],
  "purposes": [{ "id": "uuid", "name": "string" }]
}
```

**Response (201):**
```json
{
  "id": "post-id",
  "message": "Experience post başarıyla oluşturuldu",
  "success": true
}
```

---

## Feed Endpoint'leri

### 1. Sub Category Posts

**Endpoint:** `GET /catalog/sub-categories/:subCategoryId/posts`

**Query Parameters:**
- `type` (optional): `tips`, `experience`, `comments`, `benchmark`
- `cursor` (optional): Pagination cursor
- `limit` (optional): 1-50, default: 20

**Hiyerarşik Feed Mantığı:**
- Sub category'ye ait gönderiler
- Alt product group'ların gönderileri
- Alt product'ların gönderileri (sadece Free, Tips, Question)

**Post Type Filtreleme:**
- `type` belirtilmezse: Sadece Free, Tips, Question (Experience, Update, Benchmark hariç)
- `type=tips`: Sadece Tips gönderileri
- `type=experience`: Experience ve Update gönderileri (ancak sub category için bu tipler filtrelenir)

**Response (200):**
```json
{
  "items": [
    {
      "type": "tipsAndTricks",
      "data": {
        "id": "post-id",
        "type": "tipsAndTricks",
        "user": { ... },
        "stats": { ... },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "contextType": "sub_category",
        "contextData": {
          "id": "sub-category-id",
          "name": "Sub Category Name",
          "subName": "Main Category Name",
          "image": "https://..."
        },
        "content": "Post içeriği",
        "images": ["https://..."]
      }
    }
  ],
  "pagination": {
    "cursor": "post-id",
    "hasMore": true,
    "limit": 20
  }
}
```

**Örnek:**
```
GET /catalog/sub-categories/330e8400-e29b-41d4-a716-446655440000/posts?type=tips&limit=20
```

---

### 2. Product Group Posts

**Endpoint:** `GET /catalog/product-groups/:productGroupId/posts`

**Query Parameters:**
- `type` (optional): `tips`, `experience`, `comments`, `benchmark`
- `cursor` (optional): Pagination cursor
- `limit` (optional): 1-50, default: 20

**Hiyerarşik Feed Mantığı:**
- Product group'a ait gönderiler
- Alt product'ların gönderileri (sadece Free, Tips, Question)

**Post Type Filtreleme:**
- `type` belirtilmezse: Sadece Free, Tips, Question (Experience, Update, Benchmark hariç)
- `type=tips`: Sadece Tips gönderileri

**Response (200):**
```json
{
  "items": [
    {
      "type": "tipsAndTricks",
      "data": {
        "id": "post-id",
        "type": "tipsAndTricks",
        "user": { ... },
        "stats": { ... },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "contextType": "product_group",
        "contextData": {
          "id": "product-group-id",
          "name": "Product Group Name",
          "subName": "Sub Category Name",
          "image": "https://..."
        },
        "content": "Post içeriği",
        "images": ["https://..."]
      }
    }
  ],
  "pagination": {
    "cursor": "post-id",
    "hasMore": true,
    "limit": 20
  }
}
```

**Örnek:**
```
GET /catalog/product-groups/550e8400-e29b-41d4-a716-446655440000/posts?type=tips&limit=20
```

---

### 3. Product Posts

**Endpoint:** `GET /catalog/products/:productId/posts`

**Query Parameters:**
- `type` (optional): `tips`, `experience`, `comments`, `benchmark`
- `cursor` (optional): Pagination cursor
- `limit` (optional): 1-50, default: 20

**Post Type Filtreleme:**
- `type` belirtilmezse: Tüm post tipleri
- `type=tips`: Sadece Tips gönderileri
- `type=experience`: Experience ve Update gönderileri
- `type=comments`: Free ve Question gönderileri
- `type=benchmark`: Benchmark gönderileri

**Response (200):**
```json
{
  "items": [
    {
      "type": "tipsAndTricks",
      "data": {
        "id": "post-id",
        "type": "tipsAndTricks",
        "user": { ... },
        "stats": { ... },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "contextType": "product",
        "contextData": {
          "id": "product-id",
          "name": "Product Name",
          "subName": "Product Group Name",
          "image": "https://..."
        },
        "content": "Post içeriği",
        "images": ["https://..."]
      }
    }
  ],
  "pagination": {
    "cursor": "post-id",
    "hasMore": true,
    "limit": 20
  }
}
```

**Örnek:**
```
GET /catalog/products/770e8400-e29b-41d4-a716-446655440000/posts?type=tips&limit=20
```

---

### 4. User Feed (Context-Based)

**Endpoint:** `GET /feed`

**Query Parameters:**
- `cursor` (optional): Pagination cursor
- `limit` (optional): 1-200, default: 20
- `contextType` (optional): `sub_category`, `product_group`, `product`
- `contextId` (optional): Context ID (required if contextType is provided)

**Context-Based Filtreleme:**
- `contextType` ve `contextId` belirtilirse, context'e göre feed getirilir
- Context seviyesine göre otomatik post type filtreleme yapılır

**Response (200):**
```json
{
  "items": [
    {
      "type": "tipsAndTricks",
      "data": { ... }
    }
  ],
  "pagination": {
    "cursor": "post-id",
    "hasMore": true,
    "limit": 20,
    "total": 100
  }
}
```

**Örnek:**
```
GET /feed?contextType=sub_category&contextId=330e8400-e29b-41d4-a716-446655440000&limit=20
```

---

### 5. Filtered Feed (Context-Based)

**Endpoint:** `GET /feed/filtered`

**Query Parameters:**
- `interests` (optional): Feed source filtreleri
- `tags` (optional): Post type filtreleri (`Review`, `Benchmark`, `Tips`, `Question`, `Experience`, `Update`)
- `category` (optional): Kategori ID'si
- `sort` (optional): `recent`, `top`
- `contextType` (optional): `sub_category`, `product_group`, `product`
- `contextId` (optional): Context ID (required if contextType is provided)
- `cursor` (optional): Pagination cursor
- `limit` (optional): 1-50, default: 20

**Context-Based Filtreleme:**
- `contextType` ve `contextId` belirtilirse, context'e göre filtreleme yapılır
- `tags` yoksa, context seviyesine göre otomatik post type filtreleme yapılır

**Response (200):**
```json
{
  "items": [
    {
      "type": "tipsAndTricks",
      "data": { ... }
    }
  ],
  "pagination": {
    "cursor": "post-id",
    "hasMore": true,
    "limit": 20,
    "total": 50
  }
}
```

**Örnek:**
```
GET /feed/filtered?contextType=product_group&contextId=550e8400-e29b-41d4-a716-446655440000&tags[]=Tips&sort=recent
```

---

## Hiyerarşik Feed Mantığı

### Sub Category Feed

Sub category feed'i şu gönderileri içerir:

1. **Sub category'ye ait gönderiler**
   - `subCategoryId = X` olan gönderiler

2. **Alt product group'ların gönderileri**
   - `productGroupId IN (alt product group'lar)` olan gönderiler

3. **Alt product'ların gönderileri**
   - `productId IN (alt product'lar)` olan gönderiler
   - **Sadece Free, Tips, Question** (Experience, Update, Benchmark hariç)

**Post Type Filtreleme:**
- Otomatik: Experience, Update, Benchmark filtrelenir
- Manuel: `type` parametresi ile filtreleme yapılabilir

**Örnek:**
```
GET /catalog/sub-categories/330e8400-e29b-41d4-a716-446655440000/posts
```

Bu endpoint şunları getirir:
- Sub category'ye ait tüm gönderiler (Free, Tips, Question)
- Alt product group'ların tüm gönderileri (Free, Tips, Question)
- Alt product'ların sadece Free, Tips, Question gönderileri

---

### Product Group Feed

Product group feed'i şu gönderileri içerir:

1. **Product group'a ait gönderiler**
   - `productGroupId = X` olan gönderiler

2. **Alt product'ların gönderileri**
   - `productId IN (alt product'lar)` olan gönderiler
   - **Sadece Free, Tips, Question** (Experience, Update, Benchmark hariç)

**Post Type Filtreleme:**
- Otomatik: Experience, Update, Benchmark filtrelenir
- Manuel: `type` parametresi ile filtreleme yapılabilir

**Örnek:**
```
GET /catalog/product-groups/550e8400-e29b-41d4-a716-446655440000/posts
```

Bu endpoint şunları getirir:
- Product group'a ait tüm gönderiler (Free, Tips, Question)
- Alt product'ların sadece Free, Tips, Question gönderileri

---

### Product Feed

Product feed'i şu gönderileri içerir:

1. **Sadece o product'a ait gönderiler**
   - `productId = X` olan gönderiler
   - **Tüm post tipleri** (Free, Tips, Question, Experience, Update, Benchmark)

**Post Type Filtreleme:**
- Otomatik: Filtreleme yok (tüm tipler gösterilir)
- Manuel: `type` parametresi ile filtreleme yapılabilir

**Örnek:**
```
GET /catalog/products/770e8400-e29b-41d4-a716-446655440000/posts
```

Bu endpoint şunları getirir:
- Product'a ait tüm gönderiler (tüm post tipleri)

---

## Filtreleme Kılavuzu

### Context Seviyesine Göre Otomatik Filtreleme

Backend otomatik olarak context seviyesine göre post type filtreleme yapar:

| Context Seviyesi | Gösterilen Post Tipleri | Filtrelenen Post Tipleri |
|------------------|------------------------|--------------------------|
| Sub Category | Free, Tips, Question | Experience, Update, Benchmark |
| Product Group | Free, Tips, Question | Experience, Update, Benchmark |
| Product | Tüm tipler | Yok |

**Örnek:**
```
GET /catalog/sub-categories/330e8400-e29b-41d4-a716-446655440000/posts
```
Bu endpoint otomatik olarak sadece Free, Tips, Question gönderilerini getirir.

---

### Manuel Post Type Filtreleme

`type` parametresi ile manuel filtreleme yapılabilir:

**Sub Category ve Product Group için:**
- `type=tips`: Sadece Tips gönderileri
- `type=comments`: Free ve Question gönderileri
- `type=experience`: Experience ve Update gönderileri (ancak bu tipler otomatik olarak filtrelenir, bu yüzden boş sonuç dönebilir)
- `type=benchmark`: Benchmark gönderileri (ancak bu tip otomatik olarak filtrelenir, bu yüzden boş sonuç dönebilir)

**Product için:**
- `type=tips`: Sadece Tips gönderileri
- `type=experience`: Experience ve Update gönderileri
- `type=comments`: Free ve Question gönderileri
- `type=benchmark`: Benchmark gönderileri

**Örnek:**
```
GET /catalog/products/770e8400-e29b-41d4-a716-446655440000/posts?type=tips
```

---

### Tips Gönderileri İçin Özel Örnekler

**Sub Category Tips:**
```
GET /catalog/sub-categories/330e8400-e29b-41d4-a716-446655440000/posts?type=tips
```

**Product Group Tips:**
```
GET /catalog/product-groups/550e8400-e29b-41d4-a716-446655440000/posts?type=tips
```

**Product Tips:**
```
GET /catalog/products/770e8400-e29b-41d4-a716-446655440000/posts?type=tips
```

---

## Parametre Mapping Tabloları

### Post Oluşturma Parametreleri

#### Tips & Tricks Post

| Mobil Parametre | Backend Parametre | Mapping |
|----------------|-------------------|---------|
| `tipsText` | `description` | Direkt mapping |
| `selectedCategory` | `benefitCategory` | Enum mapping gerekli |

**BenefitCategory Mapping:**
```typescript
const benefitCategoryMap: Record<string, string> = {
  'time_saving': 'time_saving',
  'energy_efficiency': 'energy_efficiency',
  'durability': 'durability',
  'better_result': 'better_result'
};
```

#### Question Post

| Mobil Parametre | Backend Parametre | Mapping |
|----------------|-------------------|---------|
| `questionText` | `description` | Direkt mapping |
| `selectedBoost` | `selectedBoostOptionId` | Direkt mapping |

#### Benchmark Post

| Mobil Parametre | Backend Parametre | Mapping |
|----------------|-------------------|---------|
| `postText` | `description` | Direkt mapping |
| `selectedProduct1`, `selectedProduct2` | `products[]` | Array dönüşümü gerekli |

**Array Dönüşümü:**
```typescript
const products = [
  { productId: selectedProduct1, isSelected: true },
  { productId: selectedProduct2, isSelected: true }
];
```

#### Update Post

| Mobil Parametre | Backend Parametre | Mapping |
|----------------|-------------------|---------|
| `description` | `content` | Direkt mapping |
| `selectedImages` | `images` | Direkt mapping |

#### Experience Post

| Mobil Parametre | Backend Parametre | Mapping |
|----------------|-------------------|---------|
| `experienceText` | `content` | Direkt mapping |
| `step1Duration` | `selectedDurationId` | Direkt mapping (eski isim) |
| `selectedCondition` | `selectedLocationId` | Direkt mapping (eski isim) |
| `selectedFrequency` | `selectedPurposeId` | Direkt mapping (eski isim) |
| `priceRating`, `productRating` | `experience[]` | Array dönüşümü gerekli |

**Experience Array Dönüşümü:**
```typescript
const experience = [
  {
    type: 'price_and_shopping',
    content: priceAndShoppingContent,
    rating: priceRating
  },
  {
    type: 'product_and_usage',
    content: productAndUsageContent,
    rating: productRating
  }
];
```

---

## Hata Yönetimi

### Yaygın Hatalar ve Çözümleri

#### 1. 400 Bad Request - Geçersiz Parametreler

**Hata:**
```json
{
  "message": "contextType, contextId, description, and benefitCategory are required"
}
```

**Çözüm:**
- Tüm required parametrelerin gönderildiğinden emin olun
- Parametre tiplerinin doğru olduğundan emin olun

#### 2. 400 Bad Request - Geçersiz Context Type

**Hata:**
```json
{
  "message": "Tips and tricks posts can only be created for sub_category, product_group, or product"
}
```

**Çözüm:**
- `contextType` değerinin `sub_category`, `product_group`, veya `product` olduğundan emin olun

#### 3. 404 Not Found - Context Bulunamadı

**Hata:**
```json
{
  "message": "Sub category not found: {contextId}"
}
```

**Çözüm:**
- `contextId` değerinin geçerli bir UUID olduğundan emin olun
- Context'in veritabanında mevcut olduğundan emin olun

#### 4. 400 Bad Request - Geçersiz Post Type

**Hata:**
```json
{
  "message": "Invalid post type for context"
}
```

**Çözüm:**
- Context seviyesine göre izin verilen post tiplerini kontrol edin
- Sub category ve product group için Experience, Update, Benchmark oluşturulamaz

---

## Best Practices

### 1. Context Type Validasyonu

Her post tipi için farklı context type kısıtlamaları var:

- **Free Post**: `sub_category`, `product_group`, `product`
- **Tips & Tricks**: `sub_category`, `product_group`, `product`
- **Question**: `sub_category`, `product_group`, `product`
- **Benchmark**: Sadece `product`
- **Experience**: Sadece `product`
- **Update**: Sadece `product`

### 2. Image Upload

Tüm endpoint'ler hem multipart/form-data hem de JSON formatında image URL'lerini kabul eder:

**Multipart/Form-Data:**
```
Content-Type: multipart/form-data
images: [File, File, ...]
```

**JSON:**
```json
{
  "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
}
```

### 3. Pagination

Tüm feed endpoint'leri cursor-based pagination kullanır:

```typescript
// İlk sayfa
const response = await fetch('/catalog/products/{id}/posts?limit=20');

// Sonraki sayfa
const nextResponse = await fetch(`/catalog/products/{id}/posts?limit=20&cursor=${response.pagination.cursor}`);
```

### 4. Error Handling

```typescript
try {
  const response = await fetch('/posts/tips-and-tricks', {
    method: 'POST',
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const error = await response.json();
    // Hata mesajını kullanıcıya göster
    console.error('Error:', error.message);
  }
} catch (error) {
  // Network hatası
  console.error('Network error:', error);
}
```

### 5. Context-Based Feed Kullanımı

Context-based feed kullanırken:

1. **Context Type ve ID'yi doğru gönderin**
2. **Otomatik filtrelemeyi anlayın** (sub category ve product group için Experience, Update, Benchmark filtrelenir)
3. **Manuel filtreleme yapmak istiyorsanız `type` parametresini kullanın**

**Örnek:**
```typescript
// Sub category feed - otomatik olarak sadece Free, Tips, Question
const subCategoryFeed = await fetch(
  `/catalog/sub-categories/${subCategoryId}/posts`
);

// Sub category feed - sadece Tips gönderileri
const subCategoryTips = await fetch(
  `/catalog/sub-categories/${subCategoryId}/posts?type=tips`
);
```

---

## Özet

### Post Oluşturma

- Tüm endpoint'ler `contextType` ve `contextId` parametrelerini destekliyor
- Image upload hem multipart/form-data hem de JSON formatında destekleniyor
- Event desteği tüm endpoint'lerde mevcut (`eventId` parametresi)

### Feed Endpoint'leri

- Sub category, product group ve product için posts endpoint'leri mevcut
- Hiyerarşik feed mantığı ile alt seviyelerin gönderileri de getiriliyor
- Post type filtreleme `type` parametresi ile yapılabiliyor
- Context-based otomatik filtreleme mevcut

### Filtreleme

- Context seviyesine göre otomatik post type filtreleme
- Manuel filtreleme `type` parametresi ile
- Tips gönderileri için özel endpoint'ler yok, `type=tips` parametresi kullanılmalı

---

**Son Güncelleme:** 2024-12-19
