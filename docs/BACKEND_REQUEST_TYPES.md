# Backend Request Types - Detaylı API İstek Formatları

Bu dokümantasyon, mobil uygulamanın backend'e gönderdiği tüm request type'larını, endpoint'leri, HTTP method'larını ve detaylı formatları içermektedir.

---

## 📋 İçindekiler

1. [Authentication Endpoints](#1-authentication-endpoints)
2. [User Profile Endpoints](#2-user-profile-endpoints)
3. [User Interests Endpoints](#3-user-interests-endpoints)
4. [Type Definitions](#4-type-definitions)

---

## 1. Authentication Endpoints

### 1.1. Kullanıcı Kaydı (Register)

**Endpoint:** `POST /auth/register`

**Authentication:** Gerekli değil

**Request Type:**
```typescript
interface RegisterCredentials {
  email: string;        // Email adresi (required, valid email format)
  password: string;    // Şifre (required, min 8 karakter)
  name: string;        // Kullanıcı adı (required, geçici olarak email'den oluşturuluyor)
}
```

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "user"
}
```

**Response Type:**
```typescript
interface ApiRegisterResponse {
  id: string;
  fullName: string;
  email: string;
  message: string;
}
```

**Response Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "user",
  "email": "user@example.com",
  "message": "Kayıt işlemi başarıyla tamamlandı"
}
```

**Error Responses:**
- `400`: Geçersiz istek formatı
- `409`: Email zaten kayıtlı
- `500`: Email gönderilemedi

---

### 1.2. Kullanıcı Girişi (Login)

**Endpoint:** `POST /auth/login`

**Authentication:** Gerekli değil

**Request Type:**
```typescript
interface LoginCredentials {
  email: string;       // Email adresi (required)
  password: string;    // Şifre (required)
}
```

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response Type:**
```typescript
interface ApiLoginResponse {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;     // Avatar URL (optional)
  token: string;       // JWT Access Token
  refreshToken: string; // JWT Refresh Token
}
```

**Response Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "Ömer Faruk",
  "email": "user@example.com",
  "avatar": "http://api-test.tipbox.co:9000/tipbox-media/profile-pictures/1/uuid.jpg",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Geçersiz istek formatı
- `401`: Geçersiz email/şifre veya email doğrulanmamış

---

### 1.3. Email Doğrulama (Verify Email)

**Endpoint:** `POST /auth/verify-email`

**Authentication:** Gerekli değil

**Request Type:**
```typescript
interface VerifyEmailRequest {
  email: string;       // Email adresi (required)
  code: string;        // 6 haneli doğrulama kodu (required)
}
```

**Request Example:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response Type:**
```typescript
interface VerifyEmailResponse {
  success: boolean;
  token: string;       // JWT Access Token
  message: string;
}
```

**Response Example:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Email doğrulama başarılı"
}
```

**Error Responses:**
- `400`: Geçersiz istek formatı
- `404`: Geçersiz veya süresi dolmuş kod

---

### 1.4. Kullanıcı Bilgilerini Getir (Get Current User)

**Endpoint:** `GET /auth/me`

**Authentication:** Bearer Token gerekli

**Request:** Body yok, sadece Authorization header

**Response Type:**
```typescript
interface CurrentUser {
  id: number;
  email: string;
  name: string;
  status: string;          // "ACTIVE" | "INACTIVE" | "SUSPENDED"
  auth0Id: string | null;
  walletAddress: string | null;
  kycStatus: string;       // "VERIFIED" | "PENDING" | "REJECTED"
  createdAt: string;       // ISO 8601 date string
  updatedAt: string;        // ISO 8601 date string
}
```

**Response Example:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Ömer Faruk",
  "status": "ACTIVE",
  "auth0Id": null,
  "walletAddress": null,
  "kycStatus": "VERIFIED",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401`: Unauthorized (token geçersiz veya süresi dolmuş)

---

### 1.5. Şifre Sıfırlama Kodu Gönder (Forgot Password)

**Endpoint:** `POST /auth/forgot-password`

**Authentication:** Gerekli değil

**Request Type:**
```typescript
interface ForgotPasswordRequest {
  mail: string;        // Email adresi (required, backend "mail" field'ı bekliyor)
}
```

**Request Example:**
```json
{
  "mail": "user@example.com"
}
```

**Response Type:**
```typescript
interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Şifre sıfırlama kodu gönderildi."
}
```

**Error Responses:**
- `400`: Geçersiz istek formatı
- `404`: Email bulunamadı

---

### 1.6. Şifre Sıfırlama Kodunu Doğrula (Verify Reset Code)

**Endpoint:** `POST /auth/verify-reset-code`

**Authentication:** Gerekli değil

**Request Type:**
```typescript
interface VerifyResetCodeRequest {
  mail: string;       // Email adresi (required)
  code: string;      // 6 haneli doğrulama kodu (required)
}
```

**Request Example:**
```json
{
  "mail": "user@example.com",
  "code": "123456"
}
```

**Response Type:**
```typescript
interface VerifyResetCodeResponse {
  success: boolean;
  message: string;
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Kod doğrulandı"
}
```

**Error Responses:**
- `400`: Geçersiz istek formatı
- `404`: Geçersiz veya süresi dolmuş kod

---

### 1.7. Şifre Sıfırla (Reset Password)

**Endpoint:** `POST /auth/reset-password`

**Authentication:** Gerekli değil

**Request Type:**
```typescript
interface ResetPasswordRequest {
  email: string;      // Email adresi (required)
  password: string;   // Yeni şifre (required, min 8 karakter)
}
```

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "newPassword123"
}
```

**Response Type:**
```typescript
interface ResetPasswordResponse {
  success: boolean;
  message: string;
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Şifre başarıyla sıfırlandı"
}
```

**Error Responses:**
- `400`: Geçersiz istek formatı
- `404`: Email bulunamadı

---

### 1.8. Kullanıcı Çıkışı (Logout)

**Endpoint:** `POST /auth/logout`

**Authentication:** Bearer Token gerekli

**Request:** Body yok, sadece Authorization header

**Response Type:**
```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Çıkış başarılı"
}
```

**Error Responses:**
- `401`: Unauthorized

---

### 1.9. Google OAuth ile Giriş (Google Login)

**Endpoint:** `POST /auth/google`

**Authentication:** Gerekli değil

**Request Type:**
```typescript
interface GoogleLoginRequest {
  idToken: string;     // Firebase Authentication'dan alınan ID token (required)
}
```

**Request Example:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Type:**
```typescript
interface ApiLoginResponse {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  token: string;
  refreshToken: string;
}
```

**Response Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fullName": "John Doe",
  "email": "john.doe@gmail.com",
  "avatar": "https://lh3.googleusercontent.com/...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Geçersiz ID token
- `401`: Google authentication başarısız

---

## 2. User Profile Endpoints

### 2.1. Profil Kurulumu (Setup Profile)

**Endpoint:** `PUT /users/profile`

**Authentication:** Bearer Token gerekli

**Content-Type:** `multipart/form-data`

**Request Type:**
```typescript
interface SetupProfileRequest {
  fullName: string;           // Tam ad (required, min 2 karakter)
  username: string;           // Kullanıcı adı (required, min 3 karakter, alphanumeric + . _)
  profileImage?: string;      // Profil fotoğrafı URI (optional)
}
```

**Request Format (FormData):**
```
fullName: string
username: string
profileImage: File (optional)
  - uri: string (React Native file URI)
  - type: string (image/jpeg, image/png, etc.)
  - name: string (filename)
```

**Request Example (JavaScript/TypeScript):**
```typescript
const formData = new FormData();
formData.append('fullName', 'Ömer Faruk Demiral');
formData.append('username', 'omer.demiral');
formData.append('profileImage', {
  uri: 'file:///path/to/image.jpg',
  type: 'image/jpeg',
  name: 'profile.jpg',
});
```

**Response Type:**
```typescript
interface SetupProfileResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    avatar?: string;           // Avatar URL
  };
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Profil başarıyla oluşturuldu",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "fullName": "Ömer Faruk Demiral",
    "username": "omer.demiral",
    "avatar": "http://api-test.tipbox.co:9000/tipbox-media/profile-pictures/1/uuid.jpg"
  }
}
```

**Notlar:**
- `profileImage` opsiyoneldir. Avatar seçim ekranından gelen veri:
  - `avatar://{id}` formatında ise backend'e avatar ID olarak gönderilir
  - URI formatında ise FormData ile dosya olarak gönderilir
- Backend, görseli işleyip URL döndürür
- Username validation: `/^[a-zA-Z0-9._]{3,}$/` regex pattern'i ile kontrol edilir

**Error Responses:**
- `400`: Geçersiz istek formatı veya validation hatası
- `401`: Unauthorized
- `409`: Username zaten kullanılıyor
- `413`: Dosya boyutu çok büyük (max 5MB önerilir)

---

## 3. User Interests Endpoints

### 3.1. Kullanıcı İlgi Alanlarını Güncelle (Update User Interests)

**Endpoint:** `POST /users/interests`

**Authentication:** Bearer Token gerekli

**Request Type:**
```typescript
interface UpdateUserInterestsRequest {
  subCategoryIds: string[];   // Seçilen sub category ID'leri (required, min 1 item)
}
```

**Request Example:**
```json
{
  "subCategoryIds": [
    "category-1-sub-1",
    "category-1-sub-2",
    "category-2-sub-1"
  ]
}
```

**Response Type:**
```typescript
interface UpdateUserInterestsResponse {
  success: boolean;
  message: string;
  interests?: string[];        // Güncellenmiş interest ID'leri
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "İlgi alanları başarıyla güncellendi",
  "interests": [
    "category-1-sub-1",
    "category-1-sub-2",
    "category-2-sub-1"
  ]
}
```

**Notlar:**
- `subCategoryIds` array'i en az 1 eleman içermelidir
- Backend, geçersiz category ID'lerini filtreler ve sadece geçerli olanları kaydeder
- Kullanıcı kayıt sonrası setup akışında bu endpoint çağrılır

**Error Responses:**
- `400`: Geçersiz istek formatı veya boş array
- `401`: Unauthorized
- `404`: Geçersiz category ID'leri

---

## 4. Type Definitions

### 4.1. Shared Types

```typescript
// Register Credentials
interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Login Credentials
interface LoginCredentials {
  email: string;
  password: string;
}

// API Login Response (Backend'den gelen ham response)
interface ApiLoginResponse {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  token: string;
  refreshToken: string;
}

// API Register Response (Backend'den gelen ham response)
interface ApiRegisterResponse {
  id: string;
  fullName: string;
  email: string;
  message: string;
}

// Register Response (Transform edilmiş response)
interface RegisterResponse {
  user: {
    id: string;
    name: string;
    email: string;
    isGuest: false;
  };
  message: string;
}
```

---

## 5. Request Flow Examples

### 5.1. Kayıt Akışı (Registration Flow)

```
1. POST /auth/register
   Request: { email, password, name }
   Response: { id, fullName, email, message }

2. POST /auth/verify-email
   Request: { email, code }
   Response: { success, token, message }

3. PUT /users/profile
   Request: FormData { fullName, username, profileImage? }
   Response: { success, message, user }

4. POST /users/interests
   Request: { subCategoryIds: [...] }
   Response: { success, message, interests }
```

### 5.2. Giriş Akışı (Login Flow)

```
1. POST /auth/login
   Request: { email, password }
   Response: { id, fullName, email, avatar, token, refreshToken }

   veya

1. POST /auth/google
   Request: { idToken }
   Response: { id, fullName, email, avatar, token, refreshToken }
```

### 5.3. Şifre Sıfırlama Akışı (Password Reset Flow)

```
1. POST /auth/forgot-password
   Request: { mail }
   Response: { success, message }

2. POST /auth/verify-reset-code
   Request: { mail, code }
   Response: { success, message }

3. POST /auth/reset-password
   Request: { email, password }
   Response: { success, message }
```

---

## 6. Önemli Notlar

### 6.1. Authentication Headers

Tüm authenticated endpoint'ler için:
```
Authorization: Bearer {accessToken}
```

### 6.2. Content-Type

- JSON endpoint'ler: `application/json`
- File upload endpoint'ler: `multipart/form-data`

### 6.3. Error Handling

Tüm endpoint'ler standart HTTP status code'ları kullanır:
- `200`: Success
- `400`: Bad Request (validation hatası)
- `401`: Unauthorized (token geçersiz)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `500`: Internal Server Error

### 6.4. Token Management

- Access Token: Kısa ömürlü (örn: 15 dakika)
- Refresh Token: Uzun ömürlü (örn: 7 gün)
- Token refresh otomatik olarak interceptor tarafından yönetilir
- 401 response alındığında otomatik refresh denemesi yapılır

### 6.5. File Upload

- Maksimum dosya boyutu: 5MB (backend tarafında kontrol edilir)
- Desteklenen formatlar: JPG, PNG, GIF, WebP, HEIC
- React Native'de FormData kullanılır
- Dosya URI'si `file://` veya `content://` ile başlar

---

## 7. Backend'den İstenen Detaylar

Aşağıdaki konularda backend ekibinden detaylı bilgi istenmelidir:

### 7.1. Setup Profile Endpoint

1. **Avatar ID Formatı:**
   - Avatar seçim ekranından gelen `avatar://{id}` formatı nasıl işlenecek?
   - Avatar ID'leri backend'de nasıl saklanıyor?
   - Avatar listesi için endpoint var mı? (`GET /avatars` gibi)

2. **Profile Image Upload:**
   - Maksimum dosya boyutu tam olarak ne kadar?
   - Desteklenen formatların tam listesi nedir?
   - Image compression backend'de mi yapılıyor yoksa client-side'da mı?
   - Avatar ve profile image arasındaki fark nedir?

3. **Username Validation:**
   - Username için özel kurallar var mı? (örn: rezerve kelimeler)
   - Username case-sensitive mi?
   - Minimum/maksimum karakter sayısı nedir?

### 7.2. User Interests Endpoint

1. **Category Structure:**
   - Category ve sub-category yapısı nasıl?
   - Category listesi için endpoint var mı? (`GET /categories` gibi)
   - Kullanıcı kaç kategori seçebilir? (min/max limit)

2. **Interest Management:**
   - İlgi alanları daha sonra güncellenebilir mi?
   - İlgi alanları silinebilir mi?
   - İlgi alanlarına göre içerik filtreleme nasıl çalışıyor?

### 7.3. Authentication Endpoints

1. **Token Expiry:**
   - Access token ve refresh token'ın tam expiry süreleri nedir?
   - Token refresh mekanizması nasıl çalışıyor?
   - Refresh token'ın kendisi expire olursa ne oluyor?

2. **Email Verification:**
   - Verification code'un geçerlilik süresi ne kadar?
   - Verification code kaç kez deneme hakkı var?
   - Verification code yeniden gönderilebilir mi?

3. **Password Reset:**
   - Reset code'un geçerlilik süresi ne kadar?
   - Reset code kaç kez deneme hakkı var?
   - Reset code yeniden gönderilebilir mi?

### 7.4. Error Response Format

1. **Standard Error Format:**
   - Tüm endpoint'lerde error response formatı aynı mı?
   - Error mesajları hangi dilde? (Türkçe/İngilizce)
   - Validation error'ları detaylı field bazında mı dönüyor?

2. **Error Codes:**
   - Custom error code'lar var mı?
   - Error code'ların dokümantasyonu var mı?

---

## 8. Test Senaryoları

### 8.1. Setup Profile Test Cases

1. ✅ Valid request with profile image
2. ✅ Valid request without profile image
3. ✅ Valid request with avatar ID
4. ❌ Invalid username (special characters)
5. ❌ Duplicate username
6. ❌ Too large image file
7. ❌ Invalid image format

### 8.2. User Interests Test Cases

1. ✅ Valid request with multiple categories
2. ✅ Valid request with single category
3. ❌ Empty array
4. ❌ Invalid category IDs
5. ❌ Non-existent category IDs

---

**Son Güncelleme:** 2024-01-15
**Versiyon:** 1.0.0
