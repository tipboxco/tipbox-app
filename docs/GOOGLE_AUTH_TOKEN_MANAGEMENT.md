# Google Auth Token ve Session Yönetimi

## Mevcut Token Yönetim Akışı

### 1. Google Login Akışı

```
1. Kullanıcı "Google ile Giriş" butonuna tıklar
   ↓
2. GoogleService.login() çağrılır
   - Firebase OAuth akışı başlatılır
   - Google'dan ID token alınır
   - Firebase Authentication ile credential oluşturulur
   - Firebase ID token alınır
   ↓
3. googleLogin API çağrısı yapılır
   - Backend'e Firebase ID token gönderilir
   - Backend JWT access token + refresh token döndürür
   ↓
4. useGoogleLogin hook -> onSuccess
   - AppStore.login() çağrılır
   ↓
5. AppStore.login()
   - TokenService.setTokens() ile SecureStore'a kaydedilir
   - User bilgileri AppStore'a kaydedilir
   - isAuthenticated = true yapılır
```

### 2. Token Saklama Yapısı

#### TokenService (SecureStore)
- **Access Token**: Backend'den gelen JWT token
- **Refresh Token**: Token yenileme için kullanılan token
- **Storage**: Expo SecureStore (güvenli, şifrelenmiş)
- **Cache**: Memory cache (performans için)

#### AppStore (Zustand + Persist)
- **User Bilgileri**: id, fullName, email, avatar
- **Access Token**: Memory'de tutulur (cache)
- **isAuthenticated**: Authentication durumu

### 3. Token Kullanımı

#### API İstekleri
- **ApiService Interceptor**: Her istekte Access Token otomatik eklenir
- **Token Cache**: Memory cache'den okunur (SecureStore okuma yok)
- **Token Refresh**: 401 hatası alındığında otomatik refresh edilir

#### Session Yönetimi
- **App Başlatma**: AuthProvider token'ları SecureStore'dan okur
- **Token Kontrolü**: Token varsa ve user bilgileri varsa authenticated
- **Logout**: Token'lar SecureStore'dan silinir, cache temizlenir

## Mevcut Kod Yapısı

### TokenService
```typescript
// src/services/TokenService/index.ts
TokenService.setTokens(accessToken, refreshToken)  // Token'ları kaydet
TokenService.getAccessToken()                      // Access token al
TokenService.getRefreshToken()                     // Refresh token al
TokenService.clearTokens()                          // Token'ları temizle
```

### AppStore
```typescript
// src/store/appStore.ts
useAppStore.getState().login({
  id, fullName, email, avatar,
  token, refreshToken
})
```

### Google Login Hook
```typescript
// src/features/auth/api/hooks.ts
const googleLoginMutation = useGoogleLogin();
googleLoginMutation.mutateAsync(firebaseIdToken);
```

## Öneriler

### 1. Firebase Token'ını da Saklama (Opsiyonel)

Eğer Firebase token'ını da saklamak isterseniz:

```typescript
// TokenService'e eklenebilir
const FIREBASE_ID_TOKEN_KEY = 'firebase_id_token';

async setFirebaseIdToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(FIREBASE_ID_TOKEN_KEY, token);
}

async getFirebaseIdToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(FIREBASE_ID_TOKEN_KEY);
}
```

**Not**: Şu anki yapıda Firebase token'ı sadece login sırasında kullanılıyor, backend'e gönderiliyor ve backend JWT token döndürüyor. Firebase token'ını saklamaya gerek yok çünkü backend JWT token kullanılıyor.

### 2. Session Süresi Yönetimi

Token'ların expire olma durumunu kontrol etmek için:

```typescript
// TokenService'e eklenebilir
async isTokenExpired(): Promise<boolean> {
  const token = await this.getAccessToken();
  if (!token) return true;
  
  // JWT decode edip expire time kontrol et
  const decoded = jwt.decode(token);
  return decoded.exp < Date.now() / 1000;
}
```

**Not**: Mevcut yapıda token refresh interceptor otomatik olarak 401 hatası alındığında token'ı yeniliyor.

### 3. Multi-Device Session Yönetimi

Eğer birden fazla cihazda session yönetimi yapmak isterseniz:

- Backend'den device listesi alınabilir
- Her device için ayrı session token saklanabilir
- Logout'ta tüm device'lardan çıkış yapılabilir

## Güvenlik Notları

1. **SecureStore Kullanımı**: Token'lar SecureStore'da şifrelenmiş olarak saklanıyor ✅
2. **Memory Cache**: Token'lar memory'de cache'leniyor ama SecureStore'dan okunuyor ✅
3. **Token Refresh**: Otomatik token refresh mekanizması var ✅
4. **Logout**: Logout'ta tüm token'lar temizleniyor ✅

## Test Senaryoları

1. **Normal Login**: Google login -> Token kaydedilir -> API istekleri çalışır
2. **Token Refresh**: Token expire olur -> Otomatik refresh -> Yeni token kaydedilir
3. **Logout**: Logout -> Token'lar temizlenir -> isAuthenticated = false
4. **App Restart**: App kapanıp açılır -> Token'lar SecureStore'dan okunur -> Session devam eder

## Sorun Giderme

### Token Bulunamıyor
- SecureStore'dan token okunamıyorsa: `TokenService.getAccessToken()` kontrol et
- Cache'de token yoksa: SecureStore'dan oku ve cache'e kaydet

### Token Expire Oluyor
- 401 hatası alınıyorsa: Token refresh interceptor otomatik yeniler
- Refresh token yoksa: Kullanıcıyı login ekranına yönlendir

### Session Kayboluyor
- AppStore persist çalışmıyorsa: Zustand persist config kontrol et
- Token'lar SecureStore'da ama user bilgileri yoksa: Token'lar temizlenir (güvenlik)
