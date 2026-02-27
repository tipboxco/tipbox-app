# Collections & Badges — Backend API Specification

> **Kaynak:** `src/features/profile/` altındaki tüm ekranlar ve bileşenler incelenerek çıkarılmıştır.
> **Tarih:** 2026-02-25

---

## İçindekiler

1. [Genel Bakış](#1-genel-bakış)
2. [Ortak Tipler](#2-ortak-tipler)
3. [EP-01 — GET /users/:id/collections/bridges](#3-ep-01--get-usersidcollectionsbridges)
4. [EP-02 — GET /users/:id/collections/achievements (deprecated)](#4-ep-02--get-usersidcollectionsachievements-deprecated)
5. [EP-03 — GET /users/:id/collections/bridges/:badgeId (YENİ)](#5-ep-03--get-usersidcollectionsbridgesbadgeid-yeni)
6. [EP-04 — POST /users/me/collections/badges/:badgeId/claim (YENİ)](#6-ep-04--post-usersmecollectionsbadgesbadgeidclaim-yeni)
7. [EditHighlightBadgesScreen — Tam Entegrasyon Analizi](#7-edithighlightbadgesscreen--tam-entegrasyon-analizi)
8. [EP-05 — GET /users/me/highlight-badges (YENİ)](#8-ep-05--get-usersmehighlight-badges-yeni)
9. [EP-06 — PUT /users/me/highlight-badges (YENİ)](#9-ep-06--put-usersmehighlight-badges-yeni)
10. [EP-07 — GET /users/:id/profile (Mevcut — badges alanı güncellenmeli)](#10-ep-07--get-usersidprofile-mevcut--badges-alanı-güncellenmeli)
11. [Ekran → EP Haritası](#11-ekran--ep-haritası)
12. [Önemli Notlar ve TODO'lar](#12-önemli-notlar-ve-todoler)

---

## 1. Genel Bakış

### Kullanılan Ekranlar

| Ekran / Bileşen | Dosya |
|---|---|
| CollectionsScreen | `screens/CollectionsScreen.tsx` |
| AchievementBadgesTab | `components/TabsPage/AchievementBadgesTab.tsx` |
| BridgeBadgesTab | `components/TabsPage/BridgeBadgesTab.tsx` |
| BadgeDetail | `components/BadgeDetail/index.tsx` |
| ProfileBadgeBottomSheet | `components/ProfileBadgeBottomSheet/index.tsx` |
| ProfileCard (badges bölümü) | `components/ProfileCard/index.tsx` |
| EditHighlightBadgesScreen | `screens/EditHighlightBadgesScreen.tsx` |

### Badge Kategorileri

| Kategori | Açıklama | Response Alanı |
|---|---|---|
| `achievement` | Kullanıcının kendi aksiyonları ile kazandığı rozetler | `response.achievement.items` |
| `bridge` (`brand`) | Marka/platform köprüleme ile kazanılan rozetler | `response.brand.items` |
| `event` | Event katılımı ile kazanılan rozetler (ayrı feature) | — |

### Pagination Modeli

Tüm liste endpoint'leri **cursor-based pagination** kullanır:

```
GET /users/:id/collections/bridges?cursor=<last_id>&limit=10&q=keyword
```

- `cursor`: Son dönen item'ın `id`'si
- `limit`: Sayfa başına item sayısı (min: 1, max: 50, varsayılan: 20)
- `q`: Badge adı veya açıklamasına göre arama (case-insensitive)

---

## 2. Ortak Tipler

### BadgeRarity

```typescript
type BadgeRarity = 'Usual' | 'Rare' | 'Epic' | 'Legendary';
```

### CollectionBadgeTask

```typescript
interface CollectionBadgeTask {
  id: string;
  title: string;       // Görüntülenecek görev metni, ör: "150 Yorum Yap"
  type: 'Comment' | 'Like' | 'Share';
  current: number;     // Kullanıcının mevcut ilerlemesi
  total: number;       // Görevi tamamlamak için gereken toplam
  isCompleted: boolean;
}
```

> **Not:** Şu an frontend'de `CollectionBadgeTask` içinde `current`, `total`, `isCompleted` alanları **eksik**. Bunlar BadgeDetail ekranında progress bar için gerekli. Aşağıdaki şemaya eklenmeli.

### CollectionBadgeApiItem (Ana Badge Şeması)

```typescript
interface CollectionBadgeApiItem {
  id: string;
  title: string;
  image: string | null;          // CDN URL — badge görseli
  rarity: BadgeRarity;           // 'Usual' | 'Rare' | 'Epic' | 'Legendary'
  isClaimed: boolean;            // NFT claim edilmiş mi?
  nftAddress: string | null;     // Claim sonrası NFT contract adresi
  totalEarned: number;           // Bu badge'i toplam kaç kullanıcı kazandı (Sahip sayısı)
  earnedDate: string | null;     // ISO8601 — kullanıcının kazanma tarihi
  tasks: CollectionBadgeTask[];  // Badge'i kazanmak için gereken görevler
}
```

### Pagination

```typescript
interface Pagination {
  cursor: string | null;  // Sonraki sayfanın başlangıç cursor'ı
  hasMore: boolean;       // Daha fazla sayfa var mı?
  limit: number;          // Bu sayfada istenen limit
}
```

---

## 3. EP-01 — GET /users/:id/collections/bridges

> **Durum:** Mevcut (güncellenecek)
> **Kullanıldığı yerler:** `AchievementBadgesTab`, `BridgeBadgesTab`

Her iki tab (Achievement Badges + Bridge Badges) bu **tek endpoint**'ten beslenir. Response hem `achievement` hem `brand` (bridge) listesini döner.

### Request

```
GET /users/:id/collections/bridges
Authorization: Bearer <token>
```

#### Path Parameters

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | string | ✅ | Koleksiyonu görüntülenecek kullanıcının ID'si |

#### Query Parameters

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|---|---|---|---|---|
| `cursor` | string | ❌ | — | Önceki sayfanın son cursor değeri |
| `limit` | number | ❌ | `20` | Sayfa başına item (min: 1, max: 50) |
| `q` | string | ❌ | — | Badge adına göre arama (case-insensitive, min 1 karakter) |

#### Örnek Request

```
GET /users/user-123/collections/bridges?limit=10&q=network
Authorization: Bearer eyJ...
```

### Response — 200 OK

```json
{
  "brand": {
    "items": [
      {
        "id": "badge-789",
        "title": "Network Guru",
        "image": "https://cdn.tipbox.io/badges/network-guru.png",
        "rarity": "Legendary",
        "isClaimed": false,
        "nftAddress": null,
        "totalEarned": 42,
        "earnedDate": "2025-07-11T10:30:00Z",
        "tasks": [
          {
            "id": "task-1",
            "title": "5 Farklı Markayı Bağla",
            "type": "Share",
            "current": 5,
            "total": 5,
            "isCompleted": true
          }
        ]
      }
    ]
  },
  "achievement": {
    "items": [
      {
        "id": "badge-456",
        "title": "Community Builder",
        "image": "https://cdn.tipbox.io/badges/community-builder.png",
        "rarity": "Epic",
        "isClaimed": true,
        "nftAddress": "0xAbCd...1234",
        "totalEarned": 1049,
        "earnedDate": "2025-06-01T08:00:00Z",
        "tasks": [
          {
            "id": "task-2",
            "title": "150 Yorum Yap",
            "type": "Comment",
            "current": 150,
            "total": 150,
            "isCompleted": true
          },
          {
            "id": "task-3",
            "title": "20 Deneyim Paylaş",
            "type": "Share",
            "current": 20,
            "total": 20,
            "isCompleted": true
          }
        ]
      }
    ]
  },
  "pagination": {
    "cursor": "badge-456",
    "hasMore": true,
    "limit": 10
  }
}
```

### Response — Hata Durumları

| HTTP Status | Açıklama |
|---|---|
| `401 Unauthorized` | Token geçersiz veya eksik |
| `404 Not Found` | Kullanıcı bulunamadı |
| `500 Internal Server Error` | Sunucu hatası |

### Önemli Davranış Notları

- `brand.items` ve `achievement.items` **aynı sayfada** döner (tek pagination). Frontend her iki listeyi kendi tab'ında gösterir.
- `totalEarned`: Bu badge'i kazanan toplam kullanıcı sayısı (BadgeDetail'deki "Sahip" alanı).
- `earnedDate`: Oturum açmış kullanıcının bu badge'i ne zaman kazandığı (BadgeDetail'deki "Kazanma Tarihi").
- `tasks[].current` ve `tasks[].total`: BadgeDetail ekranındaki progress bar için zorunlu.

---

## 4. EP-02 — GET /users/:id/collections/achievements (deprecated)

> **Durum:** Frontend hook'unda import edilmiş ama CollectionsScreen'de kullanılmıyor.
> EP-01 tek endpoint olarak kullanıldığı için bu endpoint kaldırılabilir veya EP-01 ile birleştirilebilir.

---

## 5. EP-03 — GET /users/:id/collections/bridges/:badgeId (YENİ)

> **Durum:** Henüz yok — BadgeDetail ekranı için gerekli
> **Kullanıldığı yer:** `BadgeDetail/index.tsx`, `ProfileBadgeBottomSheet/index.tsx`

Badge'e tıklandığında açılan bottom sheet / modal için badge detay endpoint'i. Şu anda detay verisi liste response'undan geldiği için `tasks[].current`, `tasks[].total` gibi bilgiler eksik kalıyor.

### Request

```
GET /users/:id/collections/bridges/:badgeId
Authorization: Bearer <token>
```

#### Path Parameters

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `id` | string | ✅ | Kullanıcı ID'si |
| `badgeId` | string | ✅ | Badge ID'si |

### Response — 200 OK

```json
{
  "id": "badge-456",
  "title": "Community Builder",
  "image": "https://cdn.tipbox.io/badges/community-builder.png",
  "rarity": "Epic",
  "isClaimed": false,
  "nftAddress": null,
  "totalEarned": 1049,
  "earnedDate": "2025-06-01T08:00:00Z",
  "description": "Topluluk oluşturmada öne çıkan kullanıcılara verilen rozet.",
  "tasks": [
    {
      "id": "task-2",
      "title": "150 Yorum Yap",
      "type": "Comment",
      "current": 150,
      "total": 150,
      "isCompleted": true
    },
    {
      "id": "task-3",
      "title": "20 Deneyim Paylaş",
      "type": "Share",
      "current": 20,
      "total": 20,
      "isCompleted": true
    },
    {
      "id": "task-4",
      "title": "5 Kullanıcıyı Takip Et",
      "type": "Like",
      "current": 3,
      "total": 5,
      "isCompleted": false
    }
  ]
}
```

> **Not:** Eğer detay endpoint eklenmeyecekse, EP-01 response'undaki `CollectionBadgeApiItem`'a `description` ve `tasks[].current` / `tasks[].total` alanları mutlaka eklenmeli.

---

## 6. EP-04 — POST /users/me/collections/badges/:badgeId/claim (YENİ)

> **Durum:** Frontend'de "Claim NFT" butonu var, API bağlantısı yok
> **Kullanıldığı yer:** `BadgeDetail/index.tsx` (satır 92–104), `ProfileBadgeBottomSheet/index.tsx` (satır 68–83)

Badge'in NFT olarak claim edilmesi için endpoint.

### Request

```
POST /users/me/collections/badges/:badgeId/claim
Authorization: Bearer <token>
Content-Type: application/json
```

#### Path Parameters

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `badgeId` | string | ✅ | Claim edilecek badge ID'si |

#### Request Body

```json
{
  "walletAddress": "0xAbCd...1234"
}
```

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `walletAddress` | string | ✅ | NFT gönderilecek cüzdan adresi |

### Response — 200 OK

```json
{
  "success": true,
  "badgeId": "badge-456",
  "nftAddress": "0xAbCd...1234",
  "transactionHash": "0xTx..."
}
```

### Response — Hata Durumları

| HTTP Status | Açıklama |
|---|---|
| `400 Bad Request` | Badge zaten claim edilmiş (`isClaimed: true`) |
| `401 Unauthorized` | Token geçersiz |
| `403 Forbidden` | Badge bu kullanıcıya ait değil |
| `404 Not Found` | Badge bulunamadı |

---

## 7. EditHighlightBadgesScreen — Tam Entegrasyon Analizi

> **Ekran:** `screens/EditHighlightBadgesScreen.tsx`
> **Durum:** Tamamen mock data kullanıyor — backend bağlantısı sıfır

---

### 7.1 Mevcut Durum (Ne Var, Ne Yok)

#### Şu an ne yapıyor?

```typescript
// EditHighlightBadgesScreen.tsx satır 30–31
const EVENT_BADGES: Badge[] = mockBadgesData.achievements;  // ❌ Mock
const COLLECTION_BADGES: Badge[] = mockBadgesData.bridges;   // ❌ Mock

// Satır 60–66
const handleSave = useCallback(async () => {
  setIsSaving(true);
  const badgeIds = slots.filter(...);
  // TODO: API - highlight badges güncelle          // ❌ API çağrısı yok
  setIsSaving(false);
  navigation.goBack();
}, [slots, navigation]);
```

#### Nereden navigasyon yapılıyor?

**ProfileScreen.tsx satır 2012–2019:**
```typescript
navigation.navigate('EditHighlightBadges', {
  initialBadgeIds: profile.badges?.map((b) => b.id) ?? [],
});
```

Kullanıcı kendi profil sayfasındaki badge grid'e (ProfileCard) tıkladığında bu ekrana gidiliyor. `initialBadgeIds`, o anda profilde seçili olan badge ID'lerini taşıyor — bunlar `GET /users/:id/profile` response'undaki `badges[]` listesinden geliyor.

---

### 7.2 Tam Kullanıcı Akışı

```
ProfileScreen (profil kartı badge grid görünür)
  ↓  [badge grid'e tıkla]
EditHighlightBadgesScreen açılır
  ├─ route.params.initialBadgeIds = ["badge-1", "badge-2"]  (profildeki mevcut seçim)
  ├─ Tab 1: "Event Badges"       → kullanıcının kazandığı achievement badge'leri  ← şu an MOCK
  ├─ Tab 2: "Collections"        → kullanıcının kazandığı bridge badge'leri       ← şu an MOCK
  ├─ 4 slot → initialBadgeIds ile başlatılıyor
  │    └─ slot render için: [...EVENT_BADGES, ...COLLECTION_BADGES].find(b => b.id === slotId)
  │         → badge resmi için tam badge objesine ihtiyaç var
  └─ [Save tıkla]
       → API çağrısı yapılmıyor (TODO)
       → goBack()
  ↓
ProfileScreen (badge grid güncellenmez — veri değişmedi)
```

---

### 7.3 Backend'den Ne Gerekiyor?

**3 şeye ihtiyaç var:**

| # | Ne | Neden |
|---|---|---|
| 1 | Tüm kazanılmış badge listesi (event + collection) | Tab'larda seçim ekranı için |
| 2 | Slot başlangıç verileri (resim + başlık) | `initialBadgeIds`'deki ID'lerle slot render etmek için |
| 3 | Kaydetme endpoint'i | "Save" butonunun gerçekten bir şey yapması için |

> **Kritik Not:** 1 ve 2 aynı endpoint'ten sağlanabilir. `initialBadgeIds`'deki badge'lerin resimleri, tab'lardaki `availableBadges` listesinde zaten mevcut olduğundan ayrıca lookup yapılmasına gerek yok.

---

### 7.4 Tab İçerik Ayrımı

Ekranda iki tab var. Bu tab'ların hangi badge tipine karşılık geldiği:

| Tab | Label | Karşılık Geldiği Veri | Mevcut Mock |
|---|---|---|---|
| Tab 0 | Event Badges | Kullanıcının kazandığı achievement badge'leri | `mockBadgesData.achievements` |
| Tab 1 | Collections | Kullanıcının kazandığı bridge (brand) badge'leri | `mockBadgesData.bridges` |

Kod yorumundan (`// Event Badges = achievements, Collections = bridges`):
- "Event Badges" → EP-01'deki `achievement.items` ile eşleşiyor
- "Collections" → EP-01'deki `brand.items` ile eşleşiyor

**Önemli:** Seçim amaçlı badge listesi için **tüm sayfalardaki** badge'lerin yüklenmesi gerekiyor (paginated değil, full list). Çünkü kullanıcı badge seçerken infinite scroll yapmıyor, hepsini bir kerede görmesi gerekiyor.

---

## 8. EP-05 — GET /users/me/highlight-badges (YENİ)

> **Durum:** Henüz yok
> **Kullanıldığı yer:** `EditHighlightBadgesScreen` mount olduğunda çağrılacak

Ekran açıldığında tek çağrıyla:
1. Kullanıcının seçmiş olduğu badge ID'lerini (slot başlangıcı için)
2. Seçim yapılabilecek tüm kazanılmış badge'leri (tab içerikleri için)

döndürür.

### Request

```
GET /users/me/highlight-badges
Authorization: Bearer <token>
```

Query parametresi yok — sayfalama yok, tüm kazanılmış badge'ler tek seferde döner.

### Response — 200 OK

```json
{
  "selectedBadgeIds": ["badge-456", "badge-789"],
  "availableBadges": {
    "event": [
      {
        "id": "badge-456",
        "title": "Community Builder",
        "image": "https://cdn.tipbox.io/badges/community-builder.png",
        "rarity": "Epic"
      },
      {
        "id": "badge-101",
        "title": "Everyday Consumer",
        "image": "https://cdn.tipbox.io/badges/everyday-consumer.png",
        "rarity": "Usual"
      },
      {
        "id": "badge-102",
        "title": "Premium Shopper",
        "image": "https://cdn.tipbox.io/badges/premium-shopper.png",
        "rarity": "Rare"
      }
    ],
    "collection": [
      {
        "id": "badge-789",
        "title": "Network Guru",
        "image": "https://cdn.tipbox.io/badges/network-guru.png",
        "rarity": "Legendary"
      },
      {
        "id": "badge-103",
        "title": "Hardware Expert",
        "image": "https://cdn.tipbox.io/badges/hardware-expert.png",
        "rarity": "Usual"
      }
    ]
  }
}
```

#### Response Alanları

| Alan | Tip | Açıklama |
|---|---|---|
| `selectedBadgeIds` | `string[]` (max 4) | Profil kartında şu an seçili olan badge ID'leri. Frontend bu array ile 4 slotu başlatır. |
| `availableBadges.event` | `HighlightBadgeItem[]` | Kullanıcının kazandığı tüm achievement/event badge'leri. EditHighlightBadgesScreen Tab 0 içeriği. |
| `availableBadges.collection` | `HighlightBadgeItem[]` | Kullanıcının kazandığı tüm bridge/collection badge'leri. Tab 1 içeriği. |

#### HighlightBadgeItem Şeması

```typescript
interface HighlightBadgeItem {
  id: string;
  title: string;
  image: string | null;  // CDN URL
  rarity: 'Usual' | 'Rare' | 'Epic' | 'Legendary';
}
```

#### Kritik Tasarım Kuralı

`selectedBadgeIds` içindeki her ID **mutlaka** `availableBadges.event` veya `availableBadges.collection` listelerinde de bulunmalı. Frontend, slot render için bu listede lookup yapıyor:

```typescript
// EditHighlightBadgesScreen.tsx satır 164–165
const badge = badgeId
  ? [...EVENT_BADGES, ...COLLECTION_BADGES].find((b) => b.id === badgeId)
  : null;
```

Eğer bir badge ID seçili ama listede yoksa, o slot **boş** render eder.

#### Boş Durum (Kullanıcının Hiç Badge'i Yoksa)

```json
{
  "selectedBadgeIds": [],
  "availableBadges": {
    "event": [],
    "collection": []
  }
}
```

### Response — Hata Durumları

| HTTP Status | Açıklama |
|---|---|
| `401 Unauthorized` | Token geçersiz veya eksik |
| `500 Internal Server Error` | Sunucu hatası |

---

## 9. EP-06 — PUT /users/me/highlight-badges (YENİ)

> **Durum:** Henüz yok
> **Kullanıldığı yer:** `EditHighlightBadgesScreen` "Save" butonu (satır 60–66, `// TODO: API`)

Kullanıcının profil kartında gösterilecek badge'leri kaydeder.

### Request

```
PUT /users/me/highlight-badges
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

```json
{
  "badgeIds": ["badge-456", "badge-789"]
}
```

| Alan | Tip | Zorunlu | Kural | Açıklama |
|---|---|---|---|---|
| `badgeIds` | `string[]` | ✅ | max 4 eleman, boş array kabul | Seçilen badge ID'leri sıralı olarak. Boş array = tüm slotları temizle. |

**Frontend'den gelen örnek senaryolar:**

| Senaryo | Gönderilen `badgeIds` |
|---|---|
| 4 slot dolu | `["id1","id2","id3","id4"]` |
| 2 slot dolu, 2 boş | `["id1","id3"]` |
| Tüm slotlar temizlendi | `[]` |

#### Sıralama Önemi

`badgeIds` array sırası, profil kartındaki badge grid sırasını belirler. Backend bu sıralamayı korumalı, `GET /users/:id/profile` response'unda `badges[]` aynı sırayla dönmeli.

### Response — 200 OK

```json
{
  "success": true,
  "badgeIds": ["badge-456", "badge-789"],
  "badges": [
    {
      "id": "badge-456",
      "title": "Community Builder",
      "image": "https://cdn.tipbox.io/badges/community-builder.png",
      "rarity": "Epic",
      "earnedAt": "2025-06-01T08:00:00Z",
      "owner": "1049",
      "type": "event"
    },
    {
      "id": "badge-789",
      "title": "Network Guru",
      "image": "https://cdn.tipbox.io/badges/network-guru.png",
      "rarity": "Legendary",
      "earnedAt": "2025-07-11T10:30:00Z",
      "owner": "42",
      "type": "collection"
    }
  ]
}
```

> **Neden `badges[]` de dönsün?** Frontend, save sonrası `GET /users/:id/profile` cache'ini güncellemek için tam badge objesine ihtiyaç duyar. Response'da tam veri dönerse gereksiz refetch önlenir.

### Response — Hata Durumları

| HTTP Status | Hata | Açıklama |
|---|---|---|
| `400 Bad Request` | `BADGE_LIMIT_EXCEEDED` | `badgeIds` 4'ten fazla eleman içeriyor |
| `400 Bad Request` | `BADGE_NOT_OWNED` | Bir veya daha fazla badge ID bu kullanıcıya ait değil |
| `400 Bad Request` | `BADGE_NOT_FOUND` | Geçersiz badge ID |
| `401 Unauthorized` | — | Token geçersiz |

#### Hata Response Formatı

```json
{
  "success": false,
  "error": "BADGE_NOT_OWNED",
  "message": "Badge 'badge-999' does not belong to this user.",
  "invalidBadgeIds": ["badge-999"]
}
```

### Backend'de Yapılması Gerekenler

1. `badgeIds` içindeki her ID'nin bu kullanıcıya ait (kazanılmış) badge olduğunu doğrula
2. Sıralamayı koru (`ORDER BY` veya JSON array sırası)
3. Kayıt sonrası `GET /users/:id/profile`'daki `badges[]` aynı sırada ve tam alanlarla dönmeli

---

### 7.5 EditHighlightBadgesScreen — Frontend Entegrasyon Planı

Backend EP'ler hazır olduğunda frontendde yapılması gerekenler (referans için):

#### A) Ekran mount'unda EP-05 çağrısı

```typescript
// Şu an: (satır 30–31)
const EVENT_BADGES: Badge[] = mockBadgesData.achievements;  // ❌
const COLLECTION_BADGES: Badge[] = mockBadgesData.bridges;   // ❌

// Olması gereken:
const { data, isLoading } = useHighlightBadges(); // EP-05'i çağıran hook
const EVENT_BADGES = data?.availableBadges.event ?? [];
const COLLECTION_BADGES = data?.availableBadges.collection ?? [];
```

#### B) initialBadgeIds'i route params'tan değil EP-05'ten almak

```typescript
// Şu an: (satır 41)
const initialBadgeIds = route.params?.initialBadgeIds ?? [];

// Olması gereken — EP-05 daha güvenilir, route params stale olabilir:
const initialBadgeIds = data?.selectedBadgeIds ?? route.params?.initialBadgeIds ?? [];
```

#### C) Save butonunu EP-06'ya bağlamak

```typescript
// Şu an: (satır 60–66)
const handleSave = useCallback(async () => {
  setIsSaving(true);
  const badgeIds = slots.filter(...);
  // TODO: API
  setIsSaving(false);
  navigation.goBack();
}, []);

// Olması gereken:
const { mutate: saveHighlightBadges } = useSaveHighlightBadges(); // EP-06

const handleSave = useCallback(async () => {
  const badgeIds = slots.filter((id): id is string => id != null && id !== '');
  saveHighlightBadges(
    { badgeIds },
    {
      onSuccess: () => navigation.goBack(),
      onError: (err) => Alert.alert('Error', err.message),
    }
  );
}, [slots, saveHighlightBadges, navigation]);
```

#### D) Save sonrası profil cache'i güncelleme

EP-06 response'u `badges[]` dönerse, `GET /users/:id/profile` cache'i optimistic update ile güncellenebilir:

```typescript
onSuccess: (response) => {
  queryClient.setQueryData(
    profileKeys.profile(userId),
    (old) => old ? { ...old, badges: response.badges } : old
  );
  navigation.goBack();
}
```

---

## 10. EP-07 — GET /users/:id/profile (Mevcut — badges alanı güncellenmeli)

> **Durum:** Mevcut — `badges[]` alanı güncellenmeli
> **Kullanıldığı yer:** `components/ProfileCard/index.tsx` (highlight badges gösterimi)

ProfileCard'da "See More Collections" altında gösterilen highlight badge'ler bu endpoint'ten geliyor.

### Mevcut `badges` Şeması

```typescript
// Şu an gelen format (ProfileApi.ts satır 66–70):
badges?: Array<{
  id: string;
  title: string;
  image?: string;
}>
```

### Beklenen `badges` Şeması (ProfileBadgeBottomSheet için)

ProfileCard'da badge'e tıklandığında `ProfileBadgeBottomSheet` açılır. Bu sheet için `earnedAt`, `rarity`, `owner` alanları gerekli:

```typescript
badges?: Array<{
  id: string;
  title: string;
  image: string | null;
  type?: 'collection' | 'event';   // Badge türü (bottom sheet modalını belirler)
  earnedAt?: string | null;         // ISO8601 — "Earned Date"
  rarity?: BadgeRarity | null;      // "Rarity" alanı
  owner?: string | null;            // Sahip sayısı veya kullanıcı adı — "Owner"
}>
```

#### Güncelleme Gereksinimleri

1. `GET /users/:id/profile` response'undaki `badges` array'i en fazla **4 eleman** döndürmeli (highlight badges)
2. Her badge için `earnedAt`, `rarity`, `owner` alanları eklenmeli
3. `type` alanı `'collection'` veya `'event'` olmalı (frontend modal tipi buna göre belirliyor)

---

## 11. Ekran → EP Haritası

| Ekran / Bileşen | Kullandığı EP | Metod | Açıklama |
|---|---|---|---|
| **CollectionsScreen** | `EP-01` | GET | Ekran açılınca hook trigger |
| **AchievementBadgesTab** | `EP-01` | GET | `response.achievement.items` |
| **BridgeBadgesTab** | `EP-01` | GET | `response.brand.items` |
| **BadgeDetail** (bottom sheet) | `EP-03` *(YENİ)* | GET | Badge detay + task progress |
| **BadgeDetail** ("Claim NFT") | `EP-04` *(YENİ)* | POST | NFT claim |
| **ProfileBadgeBottomSheet** | `EP-03` *(YENİ)* | GET | Earned date, rarity, owner |
| **ProfileBadgeBottomSheet** ("Claim NFT") | `EP-04` *(YENİ)* | POST | NFT claim |
| **ProfileCard** (badge grid) | `EP-07` (mevcut) | GET | `data.badges[]` max 4 |
| **ProfileCard** ("See More Collections") | Navigasyon → CollectionsScreen | — | EP tetiklemez |
| **EditHighlightBadgesScreen** (mount) | `EP-05` *(YENİ)* | GET | Tab içerikleri + seçili slot başlangıcı |
| **EditHighlightBadgesScreen** ("Save") | `EP-06` *(YENİ)* | PUT | Seçili badge ID'lerini kaydet |
| **ProfileScreen** → EditHighlightBadges nav | `EP-07` (mevcut) | GET | `initialBadgeIds` için `profile.badges` |

---

## 12. Önemli Notlar ve TODO'lar

### Frontend'de TODO olarak işaretlenmiş API bağlantıları

1. **EditHighlightBadgesScreen.tsx satır 63:**
   ```typescript
   // TODO: API - highlight badges güncelle (örn. PATCH /profile/highlight-badges)
   setIsSaving(false);
   ```
   → EP-06 (`PUT /users/me/highlight-badges`) ile bağlanacak.

2. **EditHighlightBadgesScreen.tsx satır 30–31:**
   ```typescript
   const EVENT_BADGES: Badge[] = mockBadgesData.achievements;   // Mock!
   const COLLECTION_BADGES: Badge[] = mockBadgesData.bridges;    // Mock!
   ```
   → EP-05 (`GET /users/me/highlight-badges`) → `availableBadges.event` ve `availableBadges.collection` ile değiştirilecek.

3. **BadgeDetail/index.tsx satır 92–104:**
   - "Claim NFT" butonu API çağrısı yapmıyor.
   - → EP-04 (`POST /users/me/collections/badges/:badgeId/claim`) ile bağlanacak.

4. **BadgeDetail/index.tsx — Hardcoded veriler:**
   ```typescript
   // Kazanma Tarihi: "11 July 2025"    → CollectionBadgeApiItem.earnedDate
   // Sahip: "11049"                     → CollectionBadgeApiItem.totalEarned
   // Açıklama: hardcoded dict           → EP-03'ten gelecek description alanı
   ```

5. **ProfileEditScreen.tsx satır 37–43:**
   ```typescript
   // Badge listesi - API'den çekilebilir
   const AVAILABLE_BADGES = [
     { id: 'everyday_consumer', label: 'Everyday Consumer' },
     ...
   ]
   ```
   Bu **farklı bir badge sistemi** — profildeki metin "title/rol" badge'leri. `PUT /users/me/profile`'a `badge: string[]` olarak gönderiliyor. Highlight image badge'lerinden bağımsız.

### Highlight Image Badges vs. Title Badges — İki Farklı Sistem

| Sistem | Ekran | Endpoint | Format | Amaç |
|---|---|---|---|---|
| **Title Badges** | ProfileEditScreen | `PUT /users/me/profile` → `badge: string[]` | Metin ID (ör. `everyday_consumer`) | Profilde isim altında görünen metin etiketler |
| **Highlight Image Badges** | EditHighlightBadgesScreen | EP-05 + EP-06 | UUID (kazanılmış badge ID'si) | Profil kartındaki badge grid (resimli, 4 slot) |

Bu iki sistem **birbiriyle karışmamalı**. `PUT /users/me/profile`'daki `badge[]` alanı title badge'leri için, `PUT /users/me/highlight-badges`'deki `badgeIds[]` ise image highlight badge'leri için.

### EP-06 Sonrası Profil Cache'i

EP-06 save olduktan sonra `GET /users/:id/profile`'daki `badges[]` güncellenmeli. Frontend optimistic update için EP-06 response'unda tam badge objeleri bekliyor (bkz. Bölüm 9, Response Alanları).

### EP-01 için Eksik Frontend Tipi

`CollectionBadgeTask` type'ında `current`, `total`, `isCompleted` alanları tanımlı değil:

```typescript
// src/features/profile/types.ts — Mevcut (eksik):
export interface CollectionBadgeTask {
  id: string;
  title: string;
  type: 'Comment' | 'Like' | 'Share';
  // ❌ current, total, isCompleted eksik
}
```

Backend bu alanları dönse bile frontend görmüyor. `types.ts` güncellenmeli.

### Search / Filtreleme (EP-01)

- `q` parametresi **hem** `brand.items` **hem** `achievement.items` üzerinde çalışır.
- Frontend 500ms debounce ile gönderir (`CollectionsScreen.tsx` satır 62–67).
- EP-05'te (`highlight-badges`) arama parametresi **gerekmez** — tüm liste yüklenir.

### Pagination Notu (EP-01)

- Frontend `hasNextPage: false` olsa bile `fetchNextPage()` çağırabilir (`BridgeBadgesTab.tsx` satır 110–112).
- Backend `cursor` geçersizse veya son sayfa ise: `hasMore: false`, `items: []` dönmeli, hata fırlatmamalı.
