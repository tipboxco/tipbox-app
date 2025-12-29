# Post API Spesifikasyonu - Backend Entegrasyon Dokümantasyonu

Bu dokümantasyon, tüm post gönderi tipleri için frontend'in beklediği request/response formatlarını içerir.

---

## 📋 İçindekiler

1. [Free Post](#1-free-post)
2. [Event Post](#2-event-post)
3. [Tips & Tricks Post](#3-tips--tricks-post)
4. [Question Post](#4-question-post)
5. [Benchmark Post](#5-benchmark-post)
6. [Update Post](#6-update-post)
7. [Experience Post](#7-experience-post)

---

## 1. Free Post

### Endpoint
```
POST /posts/free
```

### Authentication
```
Authorization: Bearer <access_token>
```

### Request Headers
```
Content-Type: multipart/form-data
Accept: application/json
Authorization: Bearer <access_token>
```

### Request Body (FormData)
```typescript
{
  contextType: string;      // "sub_category" | "product_group" | "product"
  contextId: string;        // UUID - Sub category, product group veya product ID
  description: string;      // Post açıklama metni (zorunlu)
  images?: File[];          // Opsiyonel - Görsel dosyaları (array)
  eventId?: string;        // Opsiyonel - Event ID (event'e bağlı post için)
}
```

### FormData Detayları
- **contextType**: String (required)
  - Değerler: `"sub_category"`, `"product_group"`, `"product"`
  
- **contextId**: String (required)
  - UUID formatında
  - Sub category, product group veya product ID'si
  
- **description**: String (required)
  - Post içeriği/metni
  - Maksimum uzunluk: Backend'de belirlenmeli
  
- **images**: File[] (optional)
  - Her görsel için `images` key'i kullanılır (array formatında)
  - React Native'de görseller şu formatta gönderilir:
    ```typescript
    {
      uri: string;        // Görsel URI (ph://, assets-library://, file://, vb.)
      type: string;       // MIME type: "image/jpeg" veya "image/png"
      name: string;       // Dosya adı: "image_0.jpg", "image_1.png", vb.
    }
    ```
  - iOS'ta URI'ler `ph://` veya `assets-library://` ile başlayabilir
  - Bu durumda varsayılan olarak `image/jpeg` kullanılır
  
- **eventId**: String (optional)
  - UUID formatında
  - Event'e bağlı post oluşturmak için kullanılır
  - Event ID'si verilirse, post otomatik olarak event'e bağlanır

### Örnek Request (cURL)
```bash
curl -X POST "http://192.168.1.165:3000/posts/free" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "contextType=product" \
  -F "contextId=550e8400-e29b-41d4-a716-446655440000" \
  -F "description=Bu ürün hakkında bir gönderi" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.png"
```

### Response Headers
```
Content-Type: application/json
Status: 201 Created
```

### Response Body
```typescript
{
  id: string;              // Oluşturulan post ID'si (UUID)
  message: string;          // Başarı mesajı
  success: boolean;         // İşlem başarı durumu (true)
}
```

### Örnek Response
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Post başarıyla oluşturuldu",
  "success": true
}
```

### Hata Durumları

#### 400 Bad Request
```json
{
  "message": "contextType is required"
}
```

```json
{
  "message": "contextId is required"
}
```

```json
{
  "message": "description is required"
}
```

```json
{
  "message": "Invalid contextType. Must be one of: sub_category, product_group, product"
}
```

#### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

#### 413 Payload Too Large
```json
{
  "message": "Image file size exceeds maximum allowed size"
}
```

#### 404 Not Found
```json
{
  "message": "Event not found"
}
```
**Not:** Bu hata, geçersiz `eventId` verildiğinde döner.

---

## 2. Event Post

### Not
**Önemli:** Backend'de `/events/{eventId}/posts` endpoint'i mevcut değil. Event post'ları oluşturmak için normal post endpoint'lerini kullanın ve `eventId` parametresini request body'ye ekleyin.

### Kullanım
Event'e bağlı post oluşturmak için:
1. Normal post endpoint'lerini kullanın (`/posts/free`, `/posts/tips-and-tricks`, `/posts/question`, vb.)
2. `eventId` parametresini request body'ye ekleyin
3. Post otomatik olarak event'e bağlanır

### Örnek: Event'e bağlı Free Post
```bash
curl -X POST "http://192.168.1.165:3000/posts/free" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "contextType=product" \
  -F "contextId=550e8400-e29b-41d4-a716-446655440000" \
  -F "description=Event için bir gönderi" \
  -F "eventId=770e8400-e29b-41d4-a716-446655440002" \
  -F "images=@/path/to/image1.jpg"
```

**Not:** Tüm post tipleri (Free, Tips & Tricks, Question, Benchmark, Update, Experience) `eventId` parametresini destekler.

---

## 3. Tips & Tricks Post

### Endpoint
```
POST /posts/tips-and-tricks
```
**Not:** Bu endpoint henüz frontend'de implement edilmemiş. Backend'de oluşturulması gerekiyor.

### Authentication
```
Authorization: Bearer <access_token>
```

### Request Headers
```
Content-Type: multipart/form-data
Accept: application/json
Authorization: Bearer <access_token>
```

### Request Body (FormData)
```typescript
{
  contextType: string;      // "sub_category" | "product_group" | "product"
  contextId: string;        // UUID - Sub category, product group veya product ID
  description: string;      // Tips & tricks içeriği (zorunlu)
  benefitCategory: string;  // ZORUNLU - "time_saving" | "energy_efficiency" | "durability" | "better_result"
  images?: File[];          // Opsiyonel - Görsel dosyaları (array)
  eventId?: string;        // Opsiyonel - Event ID (event'e bağlı post için)
}
```

### FormData Detayları
- Free Post ile benzer format
- **description**: Tips & tricks metni
- **benefitCategory**: String (required)
  - Değerler: `"time_saving"`, `"energy_efficiency"`, `"durability"`, `"better_result"`
  - İpucunun hangi fayda kategorisinde olduğunu belirtir

### Örnek Request (cURL)
```bash
curl -X POST "http://192.168.1.165:3000/posts/tips-and-tricks" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "contextType=product" \
  -F "contextId=550e8400-e29b-41d4-a716-446655440000" \
  -F "description=Bu ürün için harika bir ipucu!" \
  -F "benefitCategory=time_saving" \
  -F "images=@/path/to/image1.jpg"
```

### Response Headers
```
Content-Type: application/json
Status: 201 Created
```

### Response Body
```typescript
{
  id: string;              // Oluşturulan post ID'si (UUID)
  message: string;          // Başarı mesajı
  success: boolean;         // İşlem başarı durumu
}
```

### Örnek Response
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "message": "Tips & tricks post başarıyla oluşturuldu",
  "success": true
}
```

---

## 4. Question Post

### Endpoint
```
POST /posts/question
```
**Not:** Bu endpoint henüz frontend'de implement edilmemiş. Backend'de oluşturulması gerekiyor.

### Authentication
```
Authorization: Bearer <access_token>
```

### Request Headers
```
Content-Type: multipart/form-data
Accept: application/json
Authorization: Bearer <access_token>
```

### Request Body (FormData)
```typescript
{
  contextType: string;      // "sub_category" | "product_group" | "product"
  contextId: string;        // UUID - Sub category, product group veya product ID
  description: string;      // Soru metni (zorunlu)
  selectedBoostOptionId: string; // ZORUNLU - Boost option ID (GET /posts/boost-options'dan alınır)
  images?: File[];          // Opsiyonel - Görsel dosyaları (array)
  eventId?: string;        // Opsiyonel - Event ID (event'e bağlı post için)
}
```

### FormData Detayları
- Free Post ile benzer format
- **selectedBoostOptionId**: String (required)
  - Boost option ID'si (UUID formatında)
  - Boost option'ları almak için `GET /posts/boost-options` endpoint'ini kullanın
  - Soruyu öne çıkarmak için kullanılır

### Boost Options Endpoint
Soru gönderisi için kullanılabilir boost option'ları almak için:

**Endpoint:** `GET /posts/boost-options`

**Response:**
```typescript
Array<{
  id: string;              // Boost option ID
  image: string;           // Boost option görseli
  title: string;           // Boost option başlığı
  description: string;      // Boost option açıklaması
  amount: number;          // Boost miktarı
  isPopular: boolean;      // Popüler boost option mu?
}>
```

### Örnek Request (cURL)
```bash
curl -X POST "http://192.168.1.165:3000/posts/question" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "contextType=product" \
  -F "contextId=550e8400-e29b-41d4-a716-446655440000" \
  -F "description=Bu ürün hakkında bir soru?" \
  -F "selectedBoostOptionId=660e8400-e29b-41d4-a716-446655440001" \
  -F "images=@/path/to/image1.jpg"
```

### Response Headers
```
Content-Type: application/json
Status: 201 Created
```

### Response Body
```typescript
{
  id: string;              // Oluşturulan post ID'si (UUID)
  message: string;          // Başarı mesajı
  success: boolean;         // İşlem başarı durumu
}
```

### Örnek Response
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "message": "Question post başarıyla oluşturuldu",
  "success": true
}
```

---

## 5. Benchmark Post

### Endpoint
```
POST /posts/benchmark
```
**Not:** Bu endpoint henüz frontend'de implement edilmemiş. Backend'de oluşturulması gerekiyor.

### Authentication
```
Authorization: Bearer <access_token>
```

### Request Headers
```
Content-Type: multipart/form-data
Accept: application/json
Authorization: Bearer <access_token>
```

### Request Body (FormData)
```typescript
{
  contextType: string;      // "sub_category" | "product_group" | "product"
  contextId: string;        // UUID - Sub category, product group veya product ID
  description: string;      // Karşılaştırma açıklaması (zorunlu)
  products: Array<{         // ZORUNLU - En az 2 ürün karşılaştırılmalı
    productId: string;       // Ürün ID'si (UUID)
    isSelected: boolean;    // Bu ürün seçili mi?
  }>;
  images?: File[];          // Opsiyonel - Görsel dosyaları (array)
  eventId?: string;        // Opsiyonel - Event ID (event'e bağlı post için)
}
```

### FormData Detayları
- Free Post ile benzer format
- **products**: Array (required)
  - En az 2 ürün içermelidir
  - Her ürün için:
    - **productId**: String (required) - UUID formatında ürün ID'si
    - **isSelected**: Boolean (required) - Bu ürün seçili mi?

### Örnek Request (cURL)
```bash
curl -X POST "http://192.168.1.165:3000/posts/benchmark" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "contextType=product" \
  -F "contextId=550e8400-e29b-41d4-a716-446655440000" \
  -F "description=Bu iki ürünü karşılaştırıyorum" \
  -F "products=[{\"productId\":\"660e8400-e29b-41d4-a716-446655440001\",\"isSelected\":true},{\"productId\":\"770e8400-e29b-41d4-a716-446655440002\",\"isSelected\":true}]" \
  -F "images=@/path/to/image1.jpg"
```

**Not:** JSON formatında array gönderirken, FormData'da string olarak serialize edilmelidir. Alternatif olarak, her ürün için ayrı field'lar kullanılabilir (frontend implementasyonuna bağlı).

### Response Headers
```
Content-Type: application/json
Status: 201 Created
```

### Response Body
```typescript
{
  id: string;              // Oluşturulan post ID'si (UUID)
  message: string;          // Başarı mesajı
  success: boolean;         // İşlem başarı durumu
}
```

### Örnek Response
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440005",
  "message": "Benchmark post başarıyla oluşturuldu",
  "success": true
}
```

---

## 6. Update Post

### Endpoint
```
POST /posts/update
```
**Not:** Bu endpoint henüz frontend'de implement edilmemiş. Backend'de oluşturulması gerekiyor.

### Authentication
```
Authorization: Bearer <access_token>
```

### Request Headers
```
Content-Type: multipart/form-data
Accept: application/json
Authorization: Bearer <access_token>
```

### Request Body (FormData)
```typescript
{
  contextType: string;      // "sub_category" | "product_group" | "product"
  contextId: string;        // UUID - Sub category, product group veya product ID
  content: string;          // Update içeriği (zorunlu) - "description" değil, "content"!
  images?: File[];          // Opsiyonel - Görsel dosyaları (array)
  eventId?: string;        // Opsiyonel - Event ID (event'e bağlı post için)
}
```

### FormData Detayları
- Free Post ile benzer format
- **content**: String (required)
  - Update içeriği/metni
  - **Önemli:** `description` değil, `content` parametresi kullanılmalıdır!

### Örnek Request (cURL)
```bash
curl -X POST "http://192.168.1.165:3000/posts/update" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "contextType=product" \
  -F "contextId=550e8400-e29b-41d4-a716-446655440000" \
  -F "content=Ürün hakkında bir güncelleme" \
  -F "images=@/path/to/image1.jpg"
```

### Response Headers
```
Content-Type: application/json
Status: 201 Created
```

### Response Body
```typescript
{
  id: string;              // Oluşturulan post ID'si (UUID)
  message: string;          // Başarı mesajı
  success: boolean;         // İşlem başarı durumu
}
```

### Örnek Response
```json
{
  "id": "bb0e8400-e29b-41d4-a716-446655440006",
  "message": "Update post başarıyla oluşturuldu",
  "success": true
}
```

---

## 7. Experience Post

### Endpoint
```
POST /posts/experience
```
**Not:** Bu endpoint henüz frontend'de implement edilmemiş. Backend'de oluşturulması gerekiyor.

### Authentication
```
Authorization: Bearer <access_token>
```

### Request Headers
```
Content-Type: multipart/form-data
Accept: application/json
Authorization: Bearer <access_token>
```

### Request Body (FormData)
```typescript
{
  contextType: string;           // "sub_category" | "product_group" | "product"
  contextId: string;             // UUID - Sub category, product group veya product ID
  selectedDurationId: string;     // ZORUNLU - Duration ID (GET /posts/experience/options'dan alınır)
  selectedLocationId: string;     // ZORUNLU - Location ID (GET /posts/experience/options'dan alınır)
  selectedPurposeId: string;      // ZORUNLU - Purpose ID (GET /posts/experience/options'dan alınır)
  content: string;                // ZORUNLU - Deneyim metni
  experience: Array<{             // ZORUNLU - Experience array (en az 1, genelde 2)
    type: "price_and_shopping" | "product_and_usage";
    content: string;             // Deneyim içeriği
    rating: number;              // Puan (1-5 arası)
  }>;
  status: "own" | "tested";      // ZORUNLU - Ürün durumu
  images?: File[];               // Opsiyonel - Görsel dosyaları (array)
  experienceSnippetId?: string;   // Opsiyonel - Experience snippet ID (AI ile ayrılmış deneyim için)
  eventId?: string;              // Opsiyonel - Event ID (event'e bağlı post için)
}
```

### FormData Detayları
- **selectedDurationId**: String (required)
  - UUID formatında
  - Deneyim süresi ID'si
  - `GET /posts/experience/options` endpoint'inden alınır
  
- **selectedLocationId**: String (required)
  - UUID formatında
  - Deneyim konumu ID'si
  - `GET /posts/experience/options` endpoint'inden alınır
  
- **selectedPurposeId**: String (required)
  - UUID formatında
  - Deneyim amacı ID'si
  - `GET /posts/experience/options` endpoint'inden alınır
  
- **content**: String (required)
  - Deneyim metni
  - Maksimum uzunluk: Backend'de belirlenmeli
  
- **experience**: Array (required)
  - En az 1, genelde 2 experience içermelidir
  - Her experience için:
    - **type**: String (required) - `"price_and_shopping"` veya `"product_and_usage"`
    - **content**: String (required) - Deneyim içeriği
    - **rating**: Number (required) - Puan (1-5 arası)
  
- **status**: String (required)
  - Değerler: `"own"` (sahip olunan) veya `"tested"` (test edilen)
  
- **experienceSnippetId**: String (optional)
  - AI ile ayrılmış deneyim snippet ID'si
  - `POST /posts/experience/split` veya `POST /posts/split-experience` endpoint'lerinden alınır

### Experience Options Endpoint
Deneyim seçeneklerini (Duration, Location, Purpose) almak için:

**Endpoint:** `GET /posts/experience/options`

**Response:**
```typescript
{
  durations: Array<{
    id: string;              // Duration ID
    name: string;            // Duration adı
  }>;
  locations: Array<{
    id: string;              // Location ID
    name: string;            // Location adı
  }>;
  purposes: Array<{
    id: string;              // Purpose ID
    name: string;            // Purpose adı
  }>;
}
```

### Experience Split Endpoint
Deneyim metnini AI ile kategorilere ayırmak için:

**Endpoint:** `POST /posts/experience/split` veya `POST /posts/split-experience`

**Request:**
```typescript
{
  productId: string;         // Ürün ID'si (zorunlu)
  content: string;           // Deneyim metni (zorunlu, en az 10 karakter)
}
```

**Response:**
```typescript
{
  experienceSnippetId: string;
  priceAndShopping: {
    content: string;
    rating: number;
    placeholder?: string;
    isEnhanced?: boolean;
  } | null;
  productAndUsage: {
    content: string;
    rating: number;
    placeholder?: string;
    isEnhanced?: boolean;
  } | null;
  metadata: {
    tokensUsed: number | null;
    processingTimeMs: number;
    model: string;
    promptVersion: string;
  };
}
```

### Örnek Request (cURL)
```bash
curl -X POST "http://192.168.1.165:3000/posts/experience" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "contextType=product" \
  -F "contextId=550e8400-e29b-41d4-a716-446655440000" \
  -F "selectedDurationId=660e8400-e29b-41d4-a716-446655440001" \
  -F "selectedLocationId=770e8400-e29b-41d4-a716-446655440002" \
  -F "selectedPurposeId=880e8400-e29b-41d4-a716-446655440003" \
  -F "content=Harika bir deneyim yaşadım" \
  -F "experience=[{\"type\":\"price_and_shopping\",\"content\":\"Fiyat performans açısından mükemmel\",\"rating\":4},{\"type\":\"product_and_usage\",\"content\":\"Kullanımı çok kolay ve pratik\",\"rating\":5}]" \
  -F "status=own" \
  -F "images=@/path/to/image1.jpg"
```

**Not:** JSON formatında array gönderirken, FormData'da string olarak serialize edilmelidir. Alternatif olarak, her experience için ayrı field'lar kullanılabilir (frontend implementasyonuna bağlı).

### Response Headers
```
Content-Type: application/json
Status: 201 Created
```

### Response Body
```typescript
{
  id: string;              // Oluşturulan post ID'si (UUID)
  message: string;          // Başarı mesajı
  success: boolean;         // İşlem başarı durumu
}
```

### Örnek Response
```json
{
  "id": "cc0e8400-e29b-41d4-a716-446655440007",
  "message": "Experience post başarıyla oluşturuldu",
  "success": true
}
```

---

## 📝 Genel Notlar

### Image Format Detayları

1. **React Native FormData Formatı:**
   ```typescript
   {
     uri: string;      // Görsel URI
     type: string;     // MIME type: "image/jpeg" veya "image/png"
     name: string;     // Dosya adı
   }
   ```

2. **iOS URI Formatları:**
   - `ph://` - Photo Library
   - `assets-library://` - Assets Library
   - Bu durumlarda varsayılan `image/jpeg` kullanılır

3. **Desteklenen Formatlar:**
   - JPEG/JPG
   - PNG
   - HEIC/HEIF (iOS'ta otomatik olarak JPEG'e dönüştürülmeli)

4. **Maksimum Dosya Boyutu:**
   - Frontend'de 10MB limit var
   - Backend'de de limit belirlenmeli

### Authentication

Tüm endpoint'ler JWT token gerektirir:
```
Authorization: Bearer <access_token>
```

Token, request interceptor tarafından otomatik olarak eklenir.

### Error Response Formatı

Tüm hata durumları için standart format:
```json
{
  "message": "Error message here"
}
```

### Status Codes

- `201 Created`: Post başarıyla oluşturuldu
- `400 Bad Request`: Geçersiz request body
- `401 Unauthorized`: Token geçersiz veya eksik
- `404 Not Found`: Kaynak bulunamadı
- `413 Payload Too Large`: Dosya boyutu limiti aşıldı
- `500 Internal Server Error`: Sunucu hatası

---

## 🔄 Backend Entegrasyon Checklist

- [x] Free Post (`/posts/free`) - ✅ Implement edilmiş
- [x] Event Post (via `eventId` parameter) - ✅ Implement edilmiş (özel endpoint yok, `eventId` parametresi kullanılıyor)
- [x] Tips & Tricks Post (`/posts/tips-and-tricks`) - ✅ Implement edilmiş
- [x] Question Post (`/posts/question`) - ✅ Implement edilmiş
- [x] Benchmark Post (`/posts/benchmark`) - ✅ Implement edilmiş
- [x] Update Post (`/posts/update`) - ✅ Implement edilmiş
- [x] Experience Post (`/posts/experience`) - ✅ Implement edilmiş

## 📚 Ek Endpoint'ler

### Boost Options
**Endpoint:** `GET /posts/boost-options`  
**Açıklama:** Question post için kullanılabilir boost option'ları getirir.  
**Authentication:** Bearer token gerekli

### Experience Options
**Endpoint:** `GET /posts/experience/options`  
**Açıklama:** Experience post için kullanılabilir duration, location ve purpose seçeneklerini getirir.  
**Authentication:** Bearer token gerekli

### Experience Split
**Endpoint:** `POST /posts/experience/split` veya `POST /posts/split-experience`  
**Açıklama:** Deneyim metnini AI ile "Price and Shopping Experience" ve "Product and Usage Experience" kategorilerine ayırır.  
**Authentication:** Bearer token gerekli

### Update Reviews
**Endpoint:** `GET /posts/update/reviews/{productId}`  
**Açıklama:** Kullanıcının belirtilen ürün için yapmış olduğu review bilgilerini getirir.  
**Authentication:** Bearer token gerekli


