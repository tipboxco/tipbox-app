# TipBox App - TODO & Feedback Task List

> Kullanıcı feedbacklerinden derlenen geliştirme planı.
> **Branch:** `developer` (güncel analiz bu branch üzerinden yapılmıştır)
> Her task altında yapılması gerekenler, etkilenen dosyalar ve tahmini iş gücü (T-shirt size) belirtilmiştir.
> **XS**: < 2 saat | **S**: 2-4 saat | **M**: 4-8 saat (1 gün) | **L**: 1-3 gün | **XL**: 3-5 gün

---

## TASK 1: Explore & Catalog Birleştirme
**Size: L | Priority: HIGH**
**Orijinal Feedback:** Explore ile Catalog birleşsin; catalog explore altında bir sekme olsun diğerleri gibi.

> **MEVCUT DURUM (developer branch):**
> - 6 bottom tab var: Feed, Explore, Catalog, Events, Notifications, Inbox
> - Catalog tam fonksiyonel: Product Catalog (hiyerarşik), Brand Catalog, Brand Selection modları var
> - Explore'da 2 tab mevcut: Hottest, News (PagerView ile)
> - Catalog kendi navigator'ına sahip: CatalogScreen, BrandScreen, BrandProductDetailScreen, vb.
> - Explore ayrı navigator: ExploreScreen + alt ekranlar

### Yapılacaklar
- [ ] Bottom tab'dan "Catalog" sekmesini kaldır (6 tab → 5 tab)
- [ ] ExploreScreen'deki PagerView tab'larına Catalog ekle: `Hottest | News | Katalog`
- [ ] Mevcut CatalogScreen (ProductCatalog + BrandCatalog) içeriğini Explore'un yeni tab'ına entegre et
- [ ] Catalog navigator route'larını Explore navigator altına taşı
- [ ] catalogNavigationStore ve catalogUIStore'un Explore içinden çalışmasını sağla
- [ ] Deep link / route yönlendirmelerini güncelle

### Etkilenen Dosyalar
- `src/navigation/TabNavigator.tsx` — Catalog tab kaldırma
- `src/features/explore/screens/ExploreScreen.tsx` — PagerView'a 3. tab ekleme
- `src/features/explore/navigation.tsx` — Catalog route'ları ekleme
- `src/features/catalog/` — screen'ler korunacak, navigation taşınacak
- `src/store/catalogNavigationStore.ts` — Explore context'inde çalışacak şekilde güncelle

---

## TASK 2: Inventory'yi Drawer Menüye Ekle
**Size: S | Priority: MEDIUM**
**Orijinal Feedback:** Inventory anasayfada buton olmasın. Yan menüye alınsın.

> **MEVCUT DURUM (developer branch):**
> - Inventory bottom tab değil. Profile altında InventoryScreen olarak yaşıyor.
> - Drawer menüde Inventory öğesi **YOK**. Mevcut drawer: Profile, Wallet, Bookmarks, Marketplace, Awards, Help, History, Settings, Logout.
> - Inventory'ye erişim: Profil → Inventory ekranı

### Yapılacaklar
- [ ] DrawerContent'e "Envanterim" menü öğesi ekle (Wallet ile Bookmarks arası uygun)
- [ ] Drawer'dan InventoryScreen'e navigation bağla
- [ ] Feed ekranında Inventory'ye kısayol varsa değerlendir

### Etkilenen Dosyalar
- `src/components/CustomDrawer/DrawerContent.tsx` — yeni menü öğesi + navigation

---

## TASK 3: Wallet'ı Catalog Butonunun Yerine Koy
**Size: XS | Priority: LOW — BÜYÜK ÖLÇÜDE TAMAMLANMIŞ**
**Orijinal Feedback:** Wallet catalog butonu yerine gelsin.

> **MEVCUT DURUM (developer branch):**
> - Wallet **TAM FONKSİYONEL**: Tips tab (bakiye, işlemler), NFT tab (transfer, swap)
> - Wallet drawer menüden erişilebilir (💳 Wallet öğesi)
> - Wallet bottom tab'da **değil** — şu an drawer öğesi
> - Send, Receive, Swap, Claim bottom sheet'leri mevcut

### Yapılacaklar
- [ ] Task 1'de Catalog tab kaldırıldığında, Wallet'ı bottom tab olarak ekle (opsiyonel)
- [ ] Veya mevcut drawer erişimi yeterli mi değerlendir

> **KARAR GEREKLİ:** Wallet bottom tab mı olacak yoksa drawer'dan erişim yeterli mi?

### Etkilenen Dosyalar
- `src/navigation/TabNavigator.tsx` — opsiyonel tab ekleme

---

## TASK 4: Feed Filtrelerini Kaldır → Explore'a Taşı
**Size: M | Priority: HIGH**
**Orijinal Feedback:** Ana sayfa feed içerisindeki filtreler kalksın. Onu da explorer tarafına alın.

> **MEVCUT DURUM (developer branch):**
> - Feed'de **çalışan** filtre sistemi var: FeedFilterChips (Interests, Tags, Category, Sort)
> - Filtreler bottom sheet ile açılıyor (FeedFilterSheet)
> - Filtreli feed için ayrı endpoint: `/feed/filtered`
> - Bu filtreler **gerçekten çalışıyor**, mock değil.

### Yapılacaklar
- [ ] FeedScreen'den FeedFilterChips ve FeedFilterSheet'i kaldır
- [ ] Filtreleme mantığını ExploreScreen'e taşı
- [ ] Feed'in sadece tab-bazlı basit akış göstermesini sağla (Task 5 ile birlikte)
- [ ] useFeedFiltered hook'unu Explore'dan da çağrılabilir yap

### Etkilenen Dosyalar
- `src/features/feed/screens/FeedScreen.tsx` — FilterChips/FilterSheet kaldırma
- `src/features/feed/components/` — FeedFilterChips, FeedFilterSheet taşıma
- `src/features/explore/screens/ExploreScreen.tsx` — filtre entegrasyonu
- `src/features/feed/api/` — useFeedFiltered hook Explore'da da kullanılacak

---

## TASK 5: Feed'e Kaydırmalı Kategori Tabları Ekle (X/Twitter Tarzı)
**Size: L | Priority: HIGH**
**Orijinal Feedback:** Trusting | For you | Tips | Questions | bla bla şeklinde kaydırmalı (X platformundaki gibi)

> **MEVCUT DURUM (developer branch):**
> - Feed'de tab yapısı **YOK** — tek bir akış (filtre ile daraltılabilir)
> - Mevcut filtre Interest tipleri: CATEGORY_MATCH, MUTUAL_TRUST, ENGAGEMENT_HIGH, NEW_USER, BOOSTED, TRUSTER
> - Mevcut filtre Tags: Review, Benchmark, Tips, Question, Experience, Update
> - `/feed` (normal) ve `/feed/filtered` (filtreli) endpoint'leri çalışıyor
> - PagerView kütüphanesi projede zaten kullanılıyor (Explore, Wallet, Profile'da)
> - Mevcut filtre altyapısı tab yapısına **doğrudan dönüştürülebilir**.

### Açıklamalar
- **"Trusting" tab:** Trust ettiğin kişilerin paylaşımları → `interests: [MUTUAL_TRUST, TRUSTER]`
- **"For You" tab:** Recommendation engine → `interests: [CATEGORY_MATCH, ENGAGEMENT_HIGH]`
- **Tür tab'ları:** Tips → `tags: ['Tips']`, Questions → `tags: ['Question']`, vb.

### Yapılacaklar
- [ ] FeedScreen'e PagerView + üst scrollable tab bar ekle
- [ ] Tab'lar: `Trusting | For You | Tips | Questions | Reviews | Benchmarks | Updates`
- [ ] Her tab kendi feed query'sini çalıştırsın (useFeedFiltered + tab parametreleri)
- [ ] "Trusting" tab: `interests: [MUTUAL_TRUST, TRUSTER]`
- [ ] "For You" tab: `interests: [CATEGORY_MATCH, ENGAGEMENT_HIGH]`
- [ ] Tür tab'ları: ilgili `tags` parametresi ile filtreleme
- [ ] Aktif tab indicator animasyonu (Explore'daki Reanimated pattern referans)

### Etkilenen Dosyalar
- `src/features/feed/screens/FeedScreen.tsx` — PagerView + tab bar
- `src/features/feed/components/` — yeni FeedTabBar bileşeni
- `src/features/feed/api/` — useFeedFiltered hook zaten var

---

## TASK 6: Kategori/Ürün Görsellerinde Performans İyileştirmesi
**Size: S | Priority: MEDIUM — KISMEN TAMAMLANMIŞ**
**Orijinal Feedback:** Kategori/ürün resimleri geç yükleniyor. Cache çözüm lazım. Kategori görselleri ikon olmalı.

> **MEVCUT DURUM (developer branch):**
> - **CachedImage bileşeni zaten mevcut** — image caching implemente edilmiş.
> - Kategori görselleri content editörden gelen image'lar.

### Yapılacaklar
- [ ] CachedImage'ın kategori görsellerinde kullanıldığını doğrula
- [ ] Kategori görselleri için fallback placeholder ikon ekle (yüklenemezse)
- [ ] Progressive loading (blurhash) desteği ekle
- [ ] Prefetch stratejisi: görünür alan dışı görselleri önceden yükle

### Etkilenen Dosyalar
- `src/features/catalog/` — kategori/ürün görsellerinde CachedImage kontrolü
- CachedImage bileşeni — blurhash/placeholder desteği

---

## TASK 7: Taslak (Draft) Sistemi Ekleme
**Size: M | Priority: HIGH — FAB ve POST OLUŞTURMA MEVCUT**
**Orijinal Feedback:** Envanterinde yoksa bile taslağa atsın, envantere girince seçtirsin.

> **MEVCUT DURUM (developer branch):**
> - **FAB butonu MEVCUT**: ExpertButton — sağ alt köşe
> - **CreatePostBottomSheet MEVCUT**: 6 post türü seçimi
> - **Post oluşturma ekranları TAM**: 6 ayrı ekran (Experience, Tips, Benchmark, Update, Question, Free)
> - **createPostFlowStore** mevcut
> - **Eksik:** Draft/taslak sistemi yok

### Yapılacaklar
- [ ] `draftStore.ts` oluştur (Zustand + AsyncStorage persist)
- [ ] Post oluşturma sırasında "Taslağa Kaydet" butonu ekle
- [ ] Envanterde yoksa → taslağa kaydet + "Envantere ekle" yönlendirmesi
- [ ] Taslakları gösterme/yükleme UI'ı (CreatePostBottomSheet'te "Taslaklar" bölümü)
- [ ] Taslak silme ve düzenleme

### Etkilenen Dosyalar
- `src/store/draftStore.ts` — yeni store
- `src/features/post/` — taslak kaydetme/yükleme
- `src/components/CreatePostBottomSheet/` — taslak listesi

---

## TASK 8: Dark Mode — Auto Mode Ekleme
**Size: S | Priority: LOW — %90 TAMAMLANMIŞ**
**Orijinal Feedback:** Dark mode, dark mode!

> **MEVCUT DURUM (developer branch):**
> - Dark mode **TAM İMPLEMENTE**: useColorMode(), appStore.colorMode, tüm ekranlarda isDark styling
> - **Eksik:** Sistem temasını otomatik takip (auto mode)

### Yapılacaklar
- [ ] Auto mode ekle: React Native Appearance API ile sistem temasını takip
- [ ] Settings'de 3 seçenek: Light / Dark / System
- [ ] Hardcoded renk kullanan bileşen varsa tespit et

### Etkilenen Dosyalar
- `src/store/appStore.ts` — auto mode ('light' | 'dark' | 'system')
- Settings ekranı — 3'lü seçim

---

## TASK 9: Profil Stat Satırına Items Ekleme
**Size: S | Priority: MEDIUM — %70 TAMAMLANMIŞ**
**Orijinal Feedback:** Profile: xx posts, 23 Trust, 1662 truster | 123 items (tıklanabilir)

> **MEVCUT DURUM (developer branch):**
> - Profil header'da stat'lar **MEVCUT**: Posts, Trust, Truster
> - Drawer'da da stats gösteriliyor
> - 7 profil tab'ı var, Inventory ayrı ekran

### Yapılacaklar
- [ ] Stat satırına "Items" (envanter sayısı) ekle — tıklanabilir → InventoryScreen
- [ ] Mevcut stat sayılarını da tıklanabilir yap (Trust → TrustList, Truster → TrusterList)

### Etkilenen Dosyalar
- `src/features/profile/screens/ProfileScreen.tsx` — stat satırı
- `src/features/profile/components/` — stat bileşeni

---

## TASK 10: Rozet (Badge) Tasarımı İyileştirmesi
**Size: S | Priority: LOW**
**Orijinal Feedback:** Rozetler kare formunda ve kötü tasarım. Rozet gibi rozet lazım.

> **MEVCUT DURUM (developer branch):**
> - Badge sistemi mevcut: BadgeDetail, CollectionDetailScreen, RewardsBadgesScreen
> - EditHighlightBadgesScreen — rozet öne çıkarma
> - Profil'de Badges ve Collections tab'ları var

### Yapılacaklar
- [ ] Rozet görsellerini dairesel/kalkan formuna geçir
- [ ] Rozet seviye sistemi tasarımı (bronz, gümüş, altın)
- [ ] Koleksiyon kartları için ayrı format

### Etkilenen Dosyalar
- Badge bileşenleri — tasarım güncelleme
- `src/features/events/screens/RewardsBadgesScreen.tsx`

---

## TASK 11: Post Kart Tasarımı İyileştirmesi
**Size: L | Priority: HIGH**
**Orijinal Feedback:** Post tasarımları berbat. Segmentasyon feed'de gereksiz. Tag'ler çok büyük. Ürün ismi kötü yerleşmiş. Etkileşim ikonları bir tarafa toplanmış.

> **MEVCUT DURUM (developer branch):**
> - 6 post kart bileşeni: PostCard, BenchmarkPostCard, QuestionPostCard, TipsAndTricksPostCard, ExperiencePostCard, UpdatePostCard
> - Her kartta: user info, content, tags, product info, interaction buttons
> - ExperiencePostCard'da split content blocks (segmentasyon) mevcut
> - AnimatedCounter, PostContextMenu mevcut

> **EXTRA BİLGİ LAZIM:**
> - AI metin düzeltmesi otomatik mi, öneri mi?
> - Segmentasyon detayda nasıl gösterilmeli?
> - Hedef tasarım için referans/mockup var mı?

### 11a: Orijinal Metin Gösterimi (Feed'de)
- [ ] ExperiencePostCard'da segmented block'ları feed'de gizle, orijinal metin göster
- [ ] Segmentasyonu sadece PostDetailScreen'de göster

### 11b: Tag Boyut ve Yerleşim
- [ ] Tag pill boyutlarını küçült (tüm 6 kart bileşeninde)
- [ ] Tutarlı UX yerleşim

### 11c: Ürün İsmi Yerleşimi
- [ ] Kullanıcı adı + ünvan ile çakışmayacak konumlandırma

### 11d: Etkileşim İkonları Eşit Dağıtım
- [ ] Like, Comment, Share, Bookmark → `justifyContent: 'space-between'`
- [ ] Tüm 6 kart bileşeninde tutarlı uygulama

### Etkilenen Dosyalar
- `src/components/PostCards/` — tüm 6 post kart bileşeni
- `src/features/post/screens/PostDetailScreen.tsx`

---

## TASK 12: Translate Butonu Mantık Düzeltmesi
**Size: S | Priority: MEDIUM**
**Orijinal Feedback:** Translate butonu sadece farklı dildeki postlarda görünsün. Çeviri yönü yanlış.

> **MEVCUT DURUM (developer branch):**
> - i18n sistemi TAM: react-i18next, TR/EN, cache (TTL: 7 gün, contentHash)
> - Translation type'ında source language detection mevcut

### Yapılacaklar
- [ ] `post.language !== user.appLanguage` kontrolü ekle
- [ ] Sadece farklı dil ise Translate butonunu göster
- [ ] Çeviri hedef dilini kullanıcı diline sabitle

### Etkilenen Dosyalar
- `src/components/PostCards/` — translate buton koşulu

---

## TASK 13: Reply/Yorum Zinciri Takibi
**Size: M | Priority: MEDIUM**
**Orijinal Feedback:** Reply'ın hangi içeriğe cevap olduğu görünmüyor. Zincir takibi yok.

> **MEVCUT DURUM (developer branch):**
> - CommentsCard TAM: like, edit, delete, swipe gesture, double-tap
> - Profil'de "Replies" tab'ı mevcut
> - **Eksik:** Reply context — "X'in yazısına yanıt" bilgisi yok

### Yapılacaklar
- [ ] Reply'larda kaynak context ekle: "X'in [ürün] hakkındaki yazısına yanıt"
- [ ] Orijinal post'a tıklanabilir navigasyon linki
- [ ] Profil Replies tab'ında context göster

### Etkilenen Dosyalar
- `src/components/CommentsCard/` — reply context
- `src/features/profile/screens/ProfileScreen.tsx` — Replies tab

---

## TASK 14: Envantere Ekle Kısayolu
**Size: S | Priority: MEDIUM**
**Orijinal Feedback:** "Envanterinizde yok" uyarısının yanında "envantere ekle" butonu olsa iyi.

> **MEVCUT DURUM (developer branch):**
> - Catalog tam fonksiyonel, ürün detay ekranları mevcut
> - Inventory sistemi çalışıyor

### Yapılacaklar
- [ ] "Envanterinizde yok" uyarısına "Envantere Ekle" butonu ekle
- [ ] Tek tıkla ekleme + deneyim girişine yönlendirme

### Etkilenen Dosyalar
- `src/features/catalog/` — ürün detay ekranları

---

## TASK 15: AI Segmentasyon + Orijinal Metin Tutma
**Size: M | Priority: HIGH**
**Orijinal Feedback:** AI segmentasyonu orijinali de tutmalı. Orijinal metin tıklanabilir olmalı.

> **MEVCUT DURUM (developer branch):**
> - ExperiencePostCard'da split content blocks (segmentasyon) mevcut

### Yapılacaklar
- [ ] Backend: originalText + segmentedText ayrı alanlar olarak tut
- [ ] Feed'de orijinal metin göster (Task 11a)
- [ ] PostDetailScreen'de "Orijinali Gör" toggle

### Etkilenen Dosyalar
- Backend — veri modeli
- `src/components/PostCards/ExperiencePostCard/`
- `src/features/post/screens/PostDetailScreen.tsx`

---

## TASK 16: Locational Trends (Explore İçinde)
**Size: L | Priority: LOW**
**Orijinal Feedback:** Locational trends explore tarafında olacak (Twitter gibi).

> **MEVCUT DURUM (developer branch):**
> - Explore'da 2 tab: Hottest, News
> - Task 1 ile Katalog tab'ı da eklenecek

### Yapılacaklar
- [ ] Explore PagerView'a "Trendler" tab'ı ekle
- [ ] Konum bazlı trend listesi (ülke/şehir)
- [ ] Backend: location-based trending API

### Etkilenen Dosyalar
- `src/features/explore/screens/ExploreScreen.tsx`
- Backend — trending API

---

## TASK 17: Support Özelliği Düzeltmesi
**Size: S | Priority: LOW**
**Orijinal Feedback:** X kişi Y'den support istiyor, istenen kişi kapatıp puanlama yapabiliyor.

> **MEVCUT DURUM (developer branch):**
> - Support sistemi KAPSAMLI: SupportRequestsScreen, SupportMessageDetail (119KB)
> - Socket entegrasyonlu gerçek zamanlı mesajlaşma

> **EXTRA BİLGİ LAZIM:**
> - Bug mı, feature request mi? Kimin kapatıp puanlayabileceği netleşmeli.

### Yapılacaklar
- [ ] SupportMessageDetail'da kapatma/puanlama yetkisini incele ve düzelt
- [ ] Backend: support request kapatma yetkisi kontrolü

### Etkilenen Dosyalar
- `src/features/inbox/screens/SupportMessageDetail.tsx`
- Backend — support logic

---

## TASK 18: Kategori/Ürün Kullanıcı Önerme + Moderasyon
**Size: XL | Priority: LOW**
**Orijinal Feedback:** Kategoriler/ürünler kullanıcı eklemesine açık olsun. Moderasyon onayı gereksin.

### Açıklama
"Topluluk" = kullanıcı topluluğu (insanlar). Kullanıcıların yeni kategori/ürün önerebilmesi, moderasyon onayıyla eklenmesi.

### Yapılacaklar
- [ ] "Aradığını bulamadın mı? Öner!" butonu (catalog/arama sonuçlarında)
- [ ] Kullanıcı öneri formu
- [ ] Moderasyon kuyruğu (admin panel)
- [ ] Öneri durumu bildirimi (notification sistemi mevcut)
- [ ] Backend: suggestion API + moderation endpoints

### Etkilenen Dosyalar
- `src/features/catalog/` — öneri formu
- Backend — suggestion/moderation modülü

---

# UYGULAMA SIRASI & BAĞIMLILIKLAR

```
Phase 1 - Navigation Refactoring (Öncelik: Yüksek)
├── Task 1:  Explore & Catalog Birleştirme         [L]
├── Task 2:  Inventory → Drawer Menüye Ekle        [S]  (paralel)
├── Task 3:  Wallet Tab (karar gerekli)             [XS] (Task 1'e bağımlı)
└── Task 4:  Feed Filtreleri → Explore'a Taşı       [M]  (Task 1'e bağımlı)

Phase 2 - Feed & Post Improvements (Öncelik: Yüksek)
├── Task 5:  Kaydırmalı Feed Tab'ları               [L]  (Task 4 sonrası)
├── Task 11: Post Kart Tasarım İyileştirmesi        [L]  (4 alt-task)
├── Task 15: AI Segmentasyon + Orijinal Metin       [M]  (Task 11a ile)
└── Task 12: Translate Mantığı                      [S]

Phase 3 - UX Polish (Öncelik: Orta)
├── Task 7:  Taslak (Draft) Sistemi                 [M]
├── Task 9:  Profil Stat — Items Ekleme             [S]
├── Task 10: Rozet Tasarımı                         [S]
├── Task 13: Reply Zinciri Takibi                   [M]
├── Task 14: Envantere Ekle Kısayolu                [S]
├── Task 8:  Dark Mode Auto Mode                    [S]
└── Task 6:  Image Placeholder/Cache                [S]

Phase 4 - Advanced Features (Öncelik: Düşük)
├── Task 16: Locational Trends                      [L]
├── Task 17: Support Düzeltme                       [S]
└── Task 18: Kullanıcı Ürün Önerme + Moderasyon    [XL]
```

## TOPLAM TAHMİNİ İŞ GÜCÜ

| Phase | Task Sayısı | Tahmini Süre |
|-------|-------------|-------------|
| Phase 1 | 4 task | ~1 hafta |
| Phase 2 | 4 task | ~2 hafta |
| Phase 3 | 7 task | ~1.5 hafta |
| Phase 4 | 3 task | ~2 hafta |
| **TOPLAM** | **18 task** | **~6-7 hafta** |

> **Not:** developer branch'indeki mevcut ilerleme sayesinde toplam süre azaldı (~8 hafta → ~6-7 hafta).
> Backend gerektiren task'lar (5, 13, 15, 16, 18) için backend koordinasyonu gerekir.

---

## ZATEN TAMAMLANMIŞ / %80+ TAMAMLANMIŞ ÖZELLİKLER

| Feedback | Durum | Detay |
|----------|-------|-------|
| Wallet | ✅ Tam | Tips, NFT, send/receive/swap fonksiyonel |
| Dark Mode | ✅ %90 | Tam implementasyon, sadece auto mode eksik |
| + Butonu | ✅ %80 | FAB + 6 post türü oluşturma, taslak sistemi eksik |
| Profil İstatistikleri | ✅ %70 | Posts/Trust/Truster var, Items sayısı eksik |
| Yorum Sistemi | ✅ Tam | CommentsCard: like, edit, delete, swipe |
| i18n / Çeviri | ✅ Tam | react-i18next, TR/EN, cache sistemi |
| Inventory | ✅ Fonksiyonel | Profil altından erişilebilir |
