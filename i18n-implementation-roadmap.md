# 🌍 i18n Implementation Roadmap

## ✅ TAMAMLANAN
- **Auth Stack** (10 ekran) - %100 ✅
- **Infrastructure** (i18n config, provider, hook) - %100 ✅
- **Locale Files** (8 namespace created) - %100 ✅

---

## 🚀 UYGULAMA SIRASI

### PHASE 1: YÜKSEK ÖNCELİK (26 ekran)
**Kullanıcı her gün kullanıyor, kritik flow**

#### 1️⃣ FEED STACK (1 ekran) - ~5K token
- FeedScreen.tsx

#### 2️⃣ WALLET STACK (16 ekran) - ~80K token
**Screens (6):**
- WalletScreen.tsx
- SwapScreen.tsx
- NftAssetsScreen.tsx
- NftAssetDetailScreen.tsx
- NftTransferScreen.tsx
- SelectFriendScreen.tsx

**Components/BottomSheets (10):**
- SendBottomSheet/index.tsx (kalan kısımlar)
- ClaimBottomSheet/index.tsx
- ReceiveBottomSheet/index.tsx
- SendFriendBottomSheet/index.tsx
- SuccessBottomSheet/index.tsx
- SwapBottomSheet/index.tsx
- NftTransferBottomSheet/index.tsx
- NftTransferUserBottomSheet/index.tsx
- NFTFilterBottomSheet/index.tsx
- NFTSortBottomSheet/index.tsx
- TransactionFilterBottomSheet/index.tsx
- TransactionPeriodBottomSheet/index.tsx

#### 3️⃣ SETTINGS STACK (18 ekran) - ~90K token
**Screens (12):**
- SettingsScreen.tsx
- ChangePasswordScreen.tsx
- ForgotPasswordScreen.tsx
- PrivacySettingsScreen.tsx
- NotificationSettingsScreen.tsx
- TwoFactorAuthScreen.tsx
- GoogleAuthenticatorSetupScreen.tsx
- GoogleAuthenticatorVerifyScreen.tsx
- SMSVerificationScreen.tsx
- SMSVerifyCodeScreen.tsx
- PaymentAndSubscriptionScreen.tsx
- SupportSettingsScreen.tsx
- CannyWebViewScreen.tsx

**Components/Tabs (5):**
- PaymentTab.tsx
- SubscriptionTab.tsx
- AddPaymentMethodBottomSheet/index.tsx
- ChangePasswordBottomSheet/index.tsx
- YourDevicesBottomSheet/index.tsx

**PHASE 1 TOPLAM:** 35 ekran, ~175K token

---

### PHASE 2: ORTA ÖNCELİK (39 ekran)
**İçerik oluşturma ve sosyal özellikler**

#### 4️⃣ POST STACK (20 ekran) - ~110K token
**Screens (9):**
- PostsScreen.tsx
- PostDetailScreen.tsx
- CreatePostScreen.tsx
- CreateExperiencePostScreen.tsx
- CreateUpdatePostScreen.tsx
- CreateBenchmarkPostScreen.tsx
- CreateQuestionPostScreen.tsx
- CreateTipsAndTrickPostScreen.tsx
- SelectExperienceForUpdateScreen.tsx

**Components/BottomSheets (11):**
- CommentBottomSheet/index.tsx
- ShareBottomSheet/index.tsx
- PostShareBottomSheet/index.tsx
- ShareToTrustedBottomSheet/index.tsx
- FilterSortBottomSheet/index.tsx
- CameraScreen/index.tsx
- CreateExperienceSteps/StepOneScreen.tsx
- CreateExperienceSteps/StepTwoScreen.tsx
- CreateExperienceSteps/StepThreeScreen.tsx
- CreateExperienceSteps/OptionSelectBottomSheet.tsx

#### 5️⃣ PROFILE STACK (10 ekran) - ~55K token
**Screens (7):**
- ProfileScreen.tsx
- ProfileEditScreen.tsx
- InventoryScreen.tsx
- InventoryDetailScreen.tsx
- CollectionsScreen.tsx
- EditHighlightBadgesScreen.tsx
- SuggestedUsersScreen.tsx
- Trust_TrusterListScreen.tsx

**Components (2):**
- BadgeDetailModal/index.tsx
- ProfileBadgeBottomSheet/index.tsx

#### 6️⃣ EVENTS STACK (9 ekran) - ~50K token
**Screens (4):**
- EventsScreen.tsx
- EventDetailScreen.tsx
- RewardsBadgesScreen.tsx
- CollectionDetailScreen.tsx

**Components (5):**
- BadgeBottomSheet/index.tsx
- BadgeDetailModal/index.tsx
- CollectionsBottomSheet/index.tsx
- CollectionCardModal/index.tsx
- CreateEventPostBottomSheet/index.tsx
- FilterBottomSheet/index.tsx

#### 7️⃣ INBOX STACK (6 ekran) - ~35K token
**Screens (3):**
- InboxScreen.tsx
- MessagesScreen.tsx
- SupportRequestsScreen.tsx

**Components (3):**
- OneOnOneSupportBottomSheet/index.tsx
- OneOnOneSupportRequestModal/index.tsx
- SendTipsBottomSheet/index.tsx
- CloseSupportRequestModal/index.tsx
- TipsSuccessModal/index.tsx

**PHASE 2 TOPLAM:** 45 ekran, ~250K token

---

### PHASE 3: DÜŞÜK ÖNCELİK (32 ekran)
**Ek özellikler, daha az kullanılan ekranlar**

#### 8️⃣ CATALOG STACK (14 ekran) - ~70K token
**Screens (14):**
- CatalogScreen.tsx
- ProductCatalogScreen.tsx
- BrandScreen.tsx
- BrandDetailScreen.tsx
- BrandProductBookScreen.tsx
- BrandProductDetailScreen.tsx
- BrandHistoryScreen.tsx
- BrandPostListScreen.tsx
- BrandEventsScreen.tsx
- BrandEventsDetailScreen.tsx
- BrandSurveyListScreen.tsx
- SurveyScreen.tsx
- SurveyParticipationScreen.tsx
- NewsDetailScreen.tsx

#### 9️⃣ MARKETPLACE STACK (8 ekran) - ~45K token
**Screens (5):**
- MarketPlaceScreen.tsx
- MarketPlaceScreen.web.tsx
- NFTDetailScreen.tsx
- NFTSellScreen.tsx
- SelectNFTScreen.tsx

**Components (3):**
- NFTFilterBottomSheet/index.tsx
- NFTListingSuccessBottomSheet/index.tsx
- NFTPurchaseSuccessBottomSheet/index.tsx

#### 🔟 NOTIFICATIONS STACK (2 ekran) - ~10K token
**Screens (1):**
- NotificationsScreen.tsx

**Components (1):**
- LikedUsersBottomSheet.tsx

#### 1️⃣1️⃣ DİĞER KÜÇÜK STACK'LER (4 ekran) - ~20K token
- BookMarksScreen.tsx
- ExploreScreen.tsx
- MoreSchoiseScreen.tsx
- SocketTestScreen.tsx

**PHASE 3 TOPLAM:** 28 ekran, ~145K token

---

## 📊 GENEL ÖZET

| Phase | Stack'ler | Ekran Sayısı | Tahmini Token | Öncelik |
|-------|-----------|--------------|---------------|---------|
| **Phase 1** | Feed + Wallet + Settings | 35 | ~175K | 🔴 Yüksek |
| **Phase 2** | Post + Profile + Events + Inbox | 45 | ~250K | 🟡 Orta |
| **Phase 3** | Catalog + Marketplace + Notifications + Diğer | 32 | ~145K | 🟢 Düşük |
| **TOPLAM** | 11 Stack | **112** | **~570K** | - |

---

## 🎯 ÖNERİ

**BAŞLANGIÇ:** Phase 1 - Feed + Wallet + Settings (35 ekran)
- En kritik kullanıcı flow'ları
- Günlük kullanım alanları
- ~175K token ile bitirilebilir

**Sonra:** Phase 2 - İçerik ve sosyal özellikler
**Son:** Phase 3 - Ek özellikler

---

## 💡 HIZLI START SEÇENEKLERİ

### Seçenek A: Tek Tek İlerle
Her stack'i tek tek tamamla, test et, commit et.

### Seçenek B: Paralel İlerle (Önerilen)
Task tool ile birden fazla stack'i aynı anda migrate et.

### Seçenek C: Karma Yaklaşım
- Phase 1'i paralel tamamla (3 stack birden)
- Phase 2 ve 3'ü tek tek ilerle

---

## 📝 NOTLAR

- Her stack için ayrı commit atılacak
- Locale dosyaları stack başlamadan önce güncellenecek
- Test edilmemiş stack'ler production'a gitmeyecek
