## NotebookLM İçin Ekran–Endpoint–Response Haritası

- Proje: Expo RN, Axios tek client `apiService`, React Query.
- Base URL: `http://192.168.1.155:3000`.
- Auth interceptor: Authorization Bearer, 401 → `/auth/refresh`; `/users/settings/change-password` refresh yapmaz.

### Auth
- `/auth/register` (POST) → `{ id, fullName, email, message? }`
- `/auth/login` (POST) → `{ id, fullName, email, avatar, token, refreshToken }`
- `/auth/refresh` (POST) → `{ accessToken, refreshToken? }`

### Tablar ve Paylaşılan Stack
- Tablar: Feed, Explore, Catalog, Events, Notifications, Inbox.
- Paylaşılan stack: Profile, Post, Bookmarks, Marketplace, Wallet; ayrıca Settings, MoreSchoise.

### Feed
- `FeedScreen` → `useFeed` → `/feed?cursor&limit`
- Response: `{ items: [{ type, data }], pagination: { cursor?, hasMore, limit } }`
  - type ∈ `post | experience | benchmark | tipsAndTricks | question | update`
  - data tipleri: ProfilePost, ReviewApiItem, BenchmarkApiItem, TipsApiItem, QuestionApiItem, UpdateApiItem.

### Explore
- `useHottest` → `/explore/hottest?cursor&limit` → FeedApiResponse.
- `useMarketplaceBanners` → `/explore/marketplace-banners` → `[{ title, description, imageUrl, linkUrl }]`.
- `useExploreEvents` → `/explore/events?limit` → `{ items: EventApiItem[], pagination }` (eventId, title, description, image, dates, interaction, participants[], eventType).
- `useNewBrands` → `/explore/brands/new?limit` → `{ items: [{ brandId, title, description, images }], pagination }`.
- `useNewProducts` → `/explore/products/new?limit` → `{ items: [{ productId, title, description, images }], pagination }`.

### Catalog
- Product kataloğu:
  - `/catalog/categories` → CatalogCategory[]
  - `/catalog/categories/{categoryId}/sub-categories` → CatalogSubCategory[]
  - `/catalog/sub-categories/{subCategoryId}/product-groups` → CatalogProductGroup[]
  - `/catalog/product-groups/{productGroupId}/products` → CatalogProduct[]
- Brand akışları:
  - `/brands/categories` → BrandCategory[]
  - `/brands/categories/{categoryId}/brands` → BrandListItem[]
  - `/brands/{brandId}/catalog` → BrandCatalogResponse
  - `/brands/{brandId}/feed?cursor&limit` → BrandFeedResponse (feed union)
  - `/brands/{brandId}/trends?cursor&limit` → BrandTrendsResponse (feed union)
  - `/brands/{brandId}/products` → BrandProductBookResponse
  - `/brands/{brandId}/surveys?cursor&limit` → { items: Survey[], pagination } (status normalize: view_results)
  - `/brands/{brandId}/events?cursor&limit` → { items: Event[], pagination }
- `BrandHistoryScreen`: şu an mock veri; gerçek endpoint tanımlı değil (puan/badge geçmişi, survey/paylaşım/event sayıları). Seed üretirken backend’e karar verilirse muhtemel yol: `/brands/{brandId}/history` (puan toplamı, badge listesi, pointsHistory[]).

### Events
- Liste:
  - `/events/active?cursor&limit`
  - `/events/upcoming?cursor&limit`
  - `/events/achievements?cursor&limit`
  - `/events/limited`
- Detay & post:
  - `/events/{eventId}`
  - `/events/{eventId}/posts?cursor&limit` → FeedApiResponse (union)

### Inbox
- `/messages` → InboxMessage[]

### Bookmarks
- `/users/{userId}/bookmarks` → BookmarkApiItem[] (benchmark | post | tipsAndTricks | question)

### Marketplace
- `/marketplace/listings?search&minPrice&maxPrice&type&rarity&limit&offset&orderBy` → MarketplaceListingsApiResponse
- `/marketplace/my-nfts` → UserNFTsApiResponse

### Profile
- Profil & inventory:
  - `/users/{userId}/profile` → UserProfile
  - `/inventory` → InventoryItem[]
- Feed sekmeleri:
  - `/users/{userId}/feed?cursor&limit` → { items: ProfileFeedItem[], pagination }
  - `/users/{userId}/reviews?cursor&limit` → { items: ProfileReview[], pagination }
  - `/users/{userId}/benchmarks?cursor&limit` → { items: ProfileBenchmark[], pagination }
  - `/users/{userId}/tips?cursor&limit` → { items: ProfileTipsAndTricks[], pagination }
  - `/users/{userId}/questions?cursor&limit` → { items: ProfileReplies[], pagination }
- Collections:
  - `/users/{userId}/collections/achievements?cursor&limit` → { items: Achievement[], pagination }
  - `/users/{userId}/collections/bridges?q&cursor&limit` → { items: Bridge[], pagination }
- Trust:
  - `/users/{userId}/trusts?q?` → TrustUser[]
  - `/users/{userId}/trusters?q?` → TrusterUser[]
  - `/users/trust` (POST { targetUserId })
  - `/users/trusts/{targetUserId}` (DELETE)

### Post Stack
- Detay/oluşturma ekranları mevcut; gerçek backend endpoint tanımlı değil, feed union tipleri ile aynı veri bekleniyor (post/experience/benchmark/tips/question/update).

### Notifications
- Şu an API çağrısı yok (mock).

### Settings
- `/users/settings/change-password` (POST { currentPassword, newPassword }) → ChangePasswordResponse (401’de refresh yok).

### Wallet & MoreSchoise
- Şu an API yok; WalletService yerel durum okuyor, MoreSchoise statik.

### Seed İçin İlişki Notları
- Kimlikler: content id’leri (`id`), kullanıcı (`user.id`), bağlam (`contextData.id`, `product.id`, `relatedPost.id`), event (`eventId`), brand (`brandId`), catalog hiyerarşisi (`categoryId`, `subCategoryId`, `productGroupId`, `productId`).
- Trust operasyonları: `targetUserId`.
- Marketplace: listing/NFT id’leri, limit/offset.
- Achievements: `id`, `status`, `current`, `total`.

