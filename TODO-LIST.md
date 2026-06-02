# TipBox App - TODO & Feedback Task List

> Kullanıcı feedbacklerinden derlenen geliştirme planı.
> **Branch:** `developer` (güncel analiz bu branch üzerinden yapılmıştır)
> Her task altında yapılması gerekenler, etkilenen dosyalar ve tahmini iş gücü (T-shirt size) belirtilmiştir.
> **XS**: < 2 saat | **S**: 2-4 saat | **M**: 4-8 saat (1 gün) | **L**: 1-3 gün | **XL**: 3-5 gün

---

## TASK 1: Explore & Catalog Birleştirme ✅
**Size: L | Priority: HIGH — TAMAMLANDI**
**Orijinal Feedback:** Explore ile Catalog birleşsin; catalog explore altında bir sekme olsun diğerleri gibi.

> **MEVCUT DURUM (developer branch):**
> - CatalogScreen ExploreScreen içine entegre edildi
> - Catalog bottom tab'dan kaldırıldı, Explore altında tab olarak yaşıyor
> - Catalog navigator route'ları Explore altına taşındı

### Yapılacaklar
- [x] Bottom tab'dan "Catalog" sekmesini kaldır (6 tab → 5 tab)
- [x] ExploreScreen'deki PagerView tab'larına Catalog ekle: `Hottest | News | Katalog`
- [x] Mevcut CatalogScreen (ProductCatalog + BrandCatalog) içeriğini Explore'un yeni tab'ına entegre et
- [x] Catalog navigator route'larını Explore navigator altına taşı
- [x] catalogNavigationStore ve catalogUIStore'un Explore içinden çalışmasını sağla
- [x] Deep link / route yönlendirmelerini güncelle

### Etkilenen Dosyalar
- `src/navigation/TabNavigator.tsx` — Catalog tab kaldırma
- `src/features/explore/screens/ExploreScreen.tsx` — PagerView'a 3. tab ekleme
- `src/features/explore/navigation.tsx` — Catalog route'ları ekleme
- `src/features/catalog/` — screen'ler korunacak, navigation taşınacak
- `src/store/catalogNavigationStore.ts` — Explore context'inde çalışacak şekilde güncelle

---

## TASK 2: Inventory'yi Drawer Menüye Ekle ✅
**Size: S | Priority: MEDIUM — TAMAMLANDI**
**Orijinal Feedback:** Inventory anasayfada buton olmasın. Yan menüye alınsın.

> **MEVCUT DURUM (developer branch):**
> - DrawerContent.tsx'te "Envanterim" menü öğesi eklendi (`t('drawer.menuItems.inventory')`)
> - Drawer'dan InventoryList navigasyonu bağlandı

### Yapılacaklar
- [x] DrawerContent'e "Envanterim" menü öğesi ekle (Wallet ile Bookmarks arası uygun)
- [x] Drawer'dan InventoryScreen'e navigation bağla
- [x] Feed ekranında Inventory'ye kısayol varsa değerlendir

### Etkilenen Dosyalar
- `src/components/CustomDrawer/DrawerContent.tsx` — yeni menü öğesi + navigation

---

## TASK 3: Wallet'ı Bottom Tab'a Ekle ✅
**Size: XS | Priority: LOW — TAMAMLANDI**
**Orijinal Feedback:** wallet ortada olacak şekilde ayarla. feed, explorer, wallet, events, inbox olsun. notification appheader'da button olsun.

> **MEVCUT DURUM (developer branch):**
> - WalletNavigator import'u eklendi, icon switch case eklendi
> - TabNavigator'da hâlâ TypeScript hataları var (handleNotificationsTabPress kalıntısı)
> - Header'a notification bell eklenmedi

### Yapılacaklar
- [x] WalletNavigator import et
- [x] WalletStack icon (WalletIcon solid/outline) renderTabBarIcon'a ekle
- [x] Tab.Screens'e WalletStack ekle, sıra: Feed → Explore → Wallet → Events → Inbox
- [x] NotificationStack'i hidden tab olarak bırak (`tabBarButton: () => null`)
- [x] handleNotificationsTabPress kalıntısını temizle (TypeScript hataları gider)
- [x] Header'a notification bell butonu ekle (BellIcon + badge)
- [x] FeedScreen'de unreadCount hesapla, Header'a geçir

### Etkilenen Dosyalar
- `src/navigation/TabNavigator.tsx` — tab ekleme + temizlik
- `src/components/Header/index.tsx` — notification bell
- `src/features/feed/screens/FeedScreen.tsx` — unreadCount → Header

---

## TASK 4: Feed Filtrelerini Kaldır → Explore'a Taşı ✅
**Size: M | Priority: HIGH — TAMAMLANDI**
**Orijinal Feedback:** Ana sayfa feed içerisindeki filtreler kalksın. Onu da explorer tarafına alın.

> **MEVCUT DURUM (developer branch):**
> - FeedScreen'den FeedFilterChips ve FeedFilterSheet kaldırıldı
> - Feed artık sadece PagerView tab'larıyla çalışıyor (Task 5 ile birlikte tamamlandı)

### Yapılacaklar
- [x] FeedScreen'den FeedFilterChips ve FeedFilterSheet'i kaldır
- [x] Filtreleme mantığını ExploreScreen'e taşı
- [x] Feed'in sadece tab-bazlı basit akış göstermesini sağla (Task 5 ile birlikte)
- [x] useFeedFiltered hook'unu Explore'dan da çağrılabilir yap

### Etkilenen Dosyalar
- `src/features/feed/screens/FeedScreen.tsx` — FilterChips/FilterSheet kaldırma
- `src/features/feed/components/` — FeedFilterChips, FeedFilterSheet taşıma
- `src/features/explore/screens/ExploreScreen.tsx` — filtre entegrasyonu
- `src/features/feed/api/` — useFeedFiltered hook Explore'da da kullanılacak

---

## TASK 5: Feed'e Kaydırmalı Kategori Tabları Ekle (X/Twitter Tarzı) ✅
**Size: L | Priority: HIGH — TAMAMLANDI**
**Orijinal Feedback:** Trusting | For you | Tips | Questions | bla bla şeklinde kaydırmalı (X platformundaki gibi)

> **MEVCUT DURUM (developer branch):**
> - FeedScreen'de PagerView + scrollable tab bar eklendi
> - FEED_TABS array ile tab yapısı çalışıyor
> - Her tab kendi useFeedFiltered query'sini çalıştırıyor

### Yapılacaklar
- [x] FeedScreen'e PagerView + üst scrollable tab bar ekle
- [x] Tab'lar: `Trusting | For You | Tips | Questions | Reviews | Benchmarks | Updates`
- [x] Her tab kendi feed query'sini çalıştırsın (useFeedFiltered + tab parametreleri)
- [x] "Trusting" tab: `interests: [MUTUAL_TRUST, TRUSTER]`
- [x] "For You" tab: `interests: [CATEGORY_MATCH, ENGAGEMENT_HIGH]`
- [x] Tür tab'ları: ilgili `tags` parametresi ile filtreleme
- [x] Aktif tab indicator animasyonu (Explore'daki Reanimated pattern referans)

### Etkilenen Dosyalar
- `src/features/feed/screens/FeedScreen.tsx` — PagerView + tab bar
- `src/features/feed/components/` — yeni FeedTabBar bileşeni
- `src/features/feed/api/` — useFeedFiltered hook zaten var

---

## TASK 6: Kategori/Ürün Görsellerinde Performans İyileştirmesi ✅
**Size: S | Priority: MEDIUM — TAMAMLANDI (tüm alt görevler)**
**Orijinal Feedback:** Kategori/ürün resimleri geç yükleniyor. Cache çözüm lazım. Kategori görselleri ikon olmalı.

> **MEVCUT DURUM (developer branch):**
> - CachedImage, BrandCard ve BrandInfoCard bileşenlerinde kullanılıyor

### Yapılacaklar
- [x] CachedImage'ın kategori görsellerinde kullanıldığını doğrula
- [x] Kategori görselleri için fallback placeholder ikon ekle (ImageIcon from lucide)
- [x] Progressive loading (blurhash) desteği ekle (expo-image placeholder)
- [x] Prefetch stratejisi: prefetchImages() utility fonksiyonu eklendi

### Etkilenen Dosyalar
- `src/features/catalog/` — kategori/ürün görsellerinde CachedImage kontrolü
- CachedImage bileşeni — blurhash/placeholder desteği

---

## TASK 7: Taslak (Draft) Sistemi Ekleme ✅
**Size: M | Priority: HIGH — TAMAMLANDI (tüm alt görevler)**
**Orijinal Feedback:** Envanterinde yoksa bile taslağa atsın, envantere girince seçtirsin.

> **MEVCUT DURUM (developer branch):**
> - `draftStore.ts` oluşturuldu (Zustand + AsyncStorage persist)
> - CreatePostBottomSheet'te draft listesi ve useDraftStore entegre edildi

### Yapılacaklar
- [x] `draftStore.ts` oluştur (Zustand + AsyncStorage persist)
- [x] Post oluşturma sırasında "Taslağa Kaydet" butonu ekle
- [x] Taslakları gösterme/yükleme UI'ı (CreatePostBottomSheet'te "Taslaklar" bölümü)
- [x] Taslak silme ve düzenleme
- [x] Envanterde yoksa → taslağa kaydet + "Envantere ekle" yönlendirmesi

### Etkilenen Dosyalar
- `src/store/draftStore.ts` — yeni store
- `src/features/post/` — taslak kaydetme/yükleme
- `src/components/CreatePostBottomSheet/` — taslak listesi

---

## TASK 8: Dark Mode — Auto Mode Ekleme ✅
**Size: S | Priority: LOW — TAMAMLANDI (tüm alt görevler)**
**Orijinal Feedback:** Dark mode, dark mode!

> **MEVCUT DURUM (developer branch):**
> - appStore'da `'system'` seçeneği eklendi
> - `toggleColorMode` artık light → dark → system döngüsüyle çalışıyor

### Yapılacaklar
- [x] Auto mode ekle: React Native Appearance API ile sistem temasını takip
- [x] Settings'de 3 seçenek: Light / Dark / System
- [x] Hardcoded renk kullanan bileşen tespit edildi + `src/constants/colors.ts` tema dosyası oluşturuldu

### Etkilenen Dosyalar
- `src/store/appStore.ts` — auto mode ('light' | 'dark' | 'system')
- Settings ekranı — 3'lü seçim

---

## TASK 9: Profil Stat Satırına Items Ekleme ✅
**Size: S | Priority: MEDIUM — TAMAMLANDI**
**Orijinal Feedback:** Profile: xx posts, 23 Trust, 1662 truster | 123 items (tıklanabilir)

> **MEVCUT DURUM (developer branch):**
> - ProfileScreen stat satırında Items sayısı (`itemsCount`) eklendi
> - Tüm stat'lar tıklanabilir

### Yapılacaklar
- [x] Stat satırına "Items" (envanter sayısı) ekle — tıklanabilir → InventoryScreen
- [x] Mevcut stat sayılarını da tıklanabilir yap (Trust → TrustList, Truster → TrusterList)

### Etkilenen Dosyalar
- `src/features/profile/screens/ProfileScreen.tsx` — stat satırı
- `src/features/profile/components/` — stat bileşeni

---

## TASK 10: Rozet (Badge) Tasarımı İyileştirmesi ✅
**Size: S | Priority: LOW — TAMAMLANDI**
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

## TASK 11: Post Kart Tasarımı İyileştirmesi 🔄
**Size: L | Priority: HIGH — BÜYÜK ÖLÇÜDE TAMAMLANDI**
**Orijinal Feedback:** Post tasarımları berbat. Segmentasyon feed'de gereksiz. Tag'ler çok büyük. Ürün ismi kötü yerleşmiş. Etkileşim ikonları bir tarafa toplanmış.

> **MEVCUT DURUM (developer branch):**
> - 11a, 11b, 11d tamamlandı; 11c kısmen

### 11a: Orijinal Metin Gösterimi (Feed'de) ✅
- [x] ExperiencePostCard'da segmented block'ları feed'de gizle, orijinal metin göster
- [x] Segmentasyonu sadece PostDetailScreen'de göster

### 11b: Tag Boyut ve Yerleşim ✅
- [x] Tag pill boyutlarını küçült (fontSize=10, minimal boyut)
- [x] Tutarlı UX yerleşim

### 11c: Ürün İsmi Yerleşimi 🔄
- [ ] Kullanıcı adı + ünvan ile çakışmayacak konumlandırma (ProductInfoCard konumu doğrulanmadı)

### 11d: Etkileşim İkonları Eşit Dağıtım ✅
- [x] Like, Comment, Share, Bookmark → `justifyContent: 'space-between'`
- [ ] Tüm 6 kart bileşeninde tutarlı uygulama (sadece ExperiencePostCard doğrulandı)

### Etkilenen Dosyalar
- `src/components/PostCards/` — tüm 6 post kart bileşeni
- `src/features/post/screens/PostDetailScreen.tsx`

---

## TASK 12: Translate Butonu Mantık Düzeltmesi ✅
**Size: S | Priority: MEDIUM — TAMAMLANDI**
**Orijinal Feedback:** Translate butonu sadece farklı dildeki postlarda görünsün. Çeviri yönü yanlış.

> **MEVCUT DURUM (developer branch):**
> - `shouldTranslate` koşulu eklendi, `usePostTranslation` hook dil kontrolü yapıyor

### Yapılacaklar
- [x] `post.language !== user.appLanguage` kontrolü ekle
- [x] Sadece farklı dil ise Translate butonunu göster
- [x] Çeviri hedef dilini kullanıcı diline sabitle

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
