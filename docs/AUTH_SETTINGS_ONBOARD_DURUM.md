# Auth & Settings Onboard Ekranları Durum Raporu

## 📋 Özet

Bu rapor, **Auth** ve **Settings** feature'larındaki onboard ekranlarının durumunu, stack bağlantılarını ve endpoint entegrasyonlarını kontrol eder.

---

## 🔍 1. Onboard Ekranları Kontrolü

### ❌ Onboard Ekranları Yok

**Sonuç:** Projede **onboard** adında bir ekran bulunmamaktadır.

**Arama Sonuçları:**
- `**/onboard*.tsx` → 0 dosya
- `**/onboard*.ts` → 0 dosya
- `grep -i "onboard"` → 0 eşleşme

---

## 🔐 2. Auth Feature - Stack Bağlantıları

### ✅ Auth Stack'e Bağlı Ekranlar

**Dosya:** `src/features/auth/navigation.tsx`

**AuthNavigator Stack Yapısı:**
```typescript
AuthNavigator
  ├─→ Welcome (initialRouteName)
  ├─→ Login
  ├─→ Register
  ├─→ ForgotPassword
  ├─→ VerifyCode
  ├─→ ResetPassword
  ├─→ SetupProfile (gestureEnabled: false) ✅
  └─→ SelectCategories (gestureEnabled: false) ✅
```

**Durum:**
- ✅ `SetupProfile` → Auth stack'e bağlı
- ✅ `SelectCategories` → Auth stack'e bağlı
- ✅ RootNavigator'da `Auth` olarak tanımlı

**Not:** `SetupProfile` ve `SelectCategories` ekranları **onboard ekranları değil**, kayıt sonrası **setup ekranlarıdır**.

---

## ⚙️ 3. Settings Feature - Stack Bağlantıları

### ✅ Settings Stack'e Bağlı Ekranlar

**Dosya:** `src/features/settings/navigation.tsx`

**SettingsNavigator Stack Yapısı:**
```typescript
SettingsNavigator
  ├─→ SettingsScreen (initialRouteName)
  ├─→ ForgotPassword
  ├─→ NotificationSettings
  ├─→ PrivacySettings
  ├─→ SupportSettings
  └─→ PaymentAndSubscription
```

**Durum:**
- ✅ Settings stack'e bağlı
- ✅ RootNavigator'da `Settings` olarak tanımlı
- ❌ Onboard ekranı yok

---

## 🔌 4. Endpoint Bağlantıları

### ❌ Auth - SetupProfileScreen

**Dosya:** `src/features/auth/screens/SetupProfileScreen.tsx`

**Durum:**
```typescript
const handleNext = () => {
  if (fullName && isUsernameValid) {
    console.log('Profile setup:', { fullName, username, profileImage });
    // TODO: API entegrasyonu yapılacak ❌
    navigation.navigate('SelectCategories');
  }
};
```

**Sorun:**
- ❌ API entegrasyonu yok
- ❌ Endpoint çağrısı yok
- ❌ Profile bilgileri backend'e gönderilmiyor

**Gerekli Endpoint:**
- `PUT /users/profile` veya `POST /auth/setup-profile`
- Parametreler: `fullName`, `username`, `profileImage`

---

### ❌ Auth - SelectCategoriesScreen

**Dosya:** `src/features/auth/screens/SelectCategoriesScreen.tsx`

**Durum:**
```typescript
const handleNext = () => {
  if (selectedSubCategories.length > 0) {
    console.log('Selected categories:', selectedSubCategories);
    // TODO: API entegrasyonu yapılacak ❌
    
    // Kullanıcıyı giriş yapmış olarak işaretle
    completeRegistration();
    
    // Ana ekrana yönlendir
    navigation.reset({ ... });
  }
};
```

**Sorun:**
- ❌ API entegrasyonu yok
- ❌ Endpoint çağrısı yok
- ❌ Seçilen kategoriler backend'e gönderilmiyor
- ⚠️ Sadece `completeRegistration()` çağrılıyor (local state update)

**Gerekli Endpoint:**
- `POST /users/interests` veya `PUT /users/categories`
- Parametreler: `subCategoryIds: string[]`

---

### ✅ Settings - Endpoint Bağlantıları

**Durum:** Tüm settings ekranları endpoint'lere bağlı

**API Dosyaları:**
- ✅ `src/features/settings/api/changePasswordApi.ts` → `/users/settings/change-password`
- ✅ `src/features/settings/api/notificationsApi.ts` → `/users/settings/notifications`
- ✅ `src/features/settings/api/privacyApi.ts` → `/users/settings/privacy`
- ✅ `src/features/settings/api/supportSessionPriceApi.ts` → `/users/settings/support-session-price`
- ✅ `src/features/settings/api/devicesApi.ts` → `/users/devices`

**Ekranlar:**
- ✅ `SettingsScreen` → Endpoint'ler bağlı
- ✅ `NotificationSettingsScreen` → `getNotificationSettings()`, `updateNotificationSettings()`
- ✅ `PrivacySettingsScreen` → `getPrivacySettings()`, `updatePrivacySettings()`
- ✅ `SupportSettingsScreen` → `getSupportSessionPrice()`, `updateSupportSessionPrice()`
- ✅ `PaymentAndSubscriptionScreen` → Endpoint'ler bağlı

---

## 📊 5. Özet Tablo

| Feature | Ekran | Stack Bağlantısı | Endpoint Bağlantısı | Durum |
|---------|-------|------------------|---------------------|-------|
| **Auth** | SetupProfile | ✅ Auth Stack | ❌ Yok | 🔴 Eksik |
| **Auth** | SelectCategories | ✅ Auth Stack | ❌ Yok | 🔴 Eksik |
| **Settings** | Tüm Ekranlar | ✅ Settings Stack | ✅ Bağlı | ✅ Tamam |

---

## 🚨 6. Kritik Sorunlar

### 1. SetupProfileScreen - API Entegrasyonu Eksik

**Sorun:**
- Kullanıcı profil bilgileri (fullName, username, profileImage) backend'e gönderilmiyor
- Sadece local state'te tutuluyor

**Çözüm:**
```typescript
// src/features/auth/api/authApi.ts
export const setupProfile = async (data: {
  fullName: string;
  username: string;
  profileImage?: string;
}): Promise<void> => {
  const formData = new FormData();
  formData.append('fullName', data.fullName);
  formData.append('username', data.username);
  if (data.profileImage) {
    formData.append('profileImage', {
      uri: data.profileImage,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);
  }
  
  await apiService.getClient().put('/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

---

### 2. SelectCategoriesScreen - API Entegrasyonu Eksik

**Sorun:**
- Seçilen kategoriler backend'e gönderilmiyor
- Sadece `completeRegistration()` çağrılıyor (local state update)

**Çözüm:**
```typescript
// src/features/auth/api/authApi.ts
export const updateUserInterests = async (subCategoryIds: string[]): Promise<void> => {
  await apiService.getClient().post('/users/interests', {
    subCategoryIds,
  });
};
```

---

## ✅ 7. Öneriler

### 1. SetupProfileScreen için
1. `setupProfile` endpoint fonksiyonu oluştur (`src/features/auth/api/authApi.ts`)
2. `useSetupProfile` mutation hook'u oluştur (`src/features/auth/api/hooks.ts`)
3. `SetupProfileScreen`'de mutation'ı kullan
4. Başarılı olursa `SelectCategories` ekranına yönlendir

### 2. SelectCategoriesScreen için
1. `updateUserInterests` endpoint fonksiyonu oluştur (`src/features/auth/api/authApi.ts`)
2. `useUpdateUserInterests` mutation hook'u oluştur (`src/features/auth/api/hooks.ts`)
3. `SelectCategoriesScreen`'de mutation'ı kullan
4. Başarılı olursa `completeRegistration()` çağır ve ana ekrana yönlendir

---

## 📝 8. Sonuç

### ✅ Tamamlanan
- ✅ Auth stack yapısı doğru
- ✅ Settings stack yapısı doğru
- ✅ Settings endpoint'leri bağlı

### ❌ Eksikler
- ❌ Onboard ekranları yok (gerekli değil, setup ekranları var)
- ❌ SetupProfileScreen API entegrasyonu yok
- ❌ SelectCategoriesScreen API entegrasyonu yok

### 🎯 Öncelik
1. **Yüksek:** SelectCategoriesScreen API entegrasyonu (kullanıcı kayıt akışında kritik)
2. **Yüksek:** SetupProfileScreen API entegrasyonu (kullanıcı kayıt akışında kritik)

---

**Rapor Tarihi:** 2024-12-19  
**Kontrol Eden:** AI Assistant  
**Durum:** 🔴 Eksik Endpoint Entegrasyonları









