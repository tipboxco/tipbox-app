# API Mimari Analizi ve Öneriler

## 📊 Mevcut Durum Analizi

### ✅ Güçlü Yönler

1. **ApiService Yapısı** ✅
   - Singleton pattern doğru kullanılmış
   - Merkezi Axios client yönetimi var
   - `src/services/ApiService` altında iyi organize edilmiş

2. **Config Yapısı** ✅
   - `src/config/api.config.ts` merkezi yapılandırma için uygun
   - ENDPOINTS yapısı genişletilebilir

3. **Feature-Based API Yapısı** ✅
   - `src/features/profile/api` örneği doğru yaklaşım
   - Her feature kendi endpoint'lerini tanımlayabilir

4. **Shared API'ler** ✅
   - `src/services/ApiService/shared` cross-feature API'ler için uygun

### ❌ Eksikler ve Sorunlar

1. **React Query Kurulu Değil** ❌
   - `package.json`'da `@tanstack/react-query` yok
   - Cache yönetimi için gerekli

2. **JWT Token Interceptor Eksik** ❌
   - `useApiInterceptors` sadece log yapıyor
   - Authorization header'a token eklenmiyor
   - Token yönetimi yok

3. **Refresh Token Mekanizması Yok** ❌
   - 401 durumunda otomatik refresh yok
   - Token expire olduğunda kullanıcı logout oluyor

4. **SecureStore Kullanımı Yok** ❌
   - Token'lar `AsyncStorage`'da (güvenlik riski)
   - Workspace rules'da SecureStore belirtilmiş ama kullanılmıyor

5. **Workspace Rules Uyumsuzluğu** ⚠️
   - Rules `/src/api` klasöründen bahsediyor
   - Mevcut yapı `/src/services/ApiService` kullanıyor
   - Rules güncellenmeli veya yapı taşınmalı

## 🎯 Önerilen Mimari

### 1. ApiService Kullanımı

**✅ EVET, ApiService kullanılmalı!**

Nedenleri:
- Singleton pattern ile tek Axios instance garantisi
- Merkezi interceptor yönetimi
- Service abstraction pattern'e uygun
- Workspace rules'daki "services altında abstract" kuralına uyuyor

**Önerilen Yapı:**
```
src/
├── services/
│   └── ApiService/
│       ├── index.ts              # Singleton ApiService
│       ├── types.ts              # Type definitions
│       ├── interceptors.ts       # JWT + Refresh token interceptors
│       ├── hooks/
│       │   └── useApiInterceptors.ts  # (Kaldırılabilir - direkt interceptor kullan)
│       └── shared/               # Cross-feature API'ler
│           └── user/
│               └── userApi.ts
├── config/
│   └── api.config.ts             # API_CONFIG ve ENDPOINTS
└── features/
    └── <feature>/
        └── api/
            ├── index.ts          # Export all
            ├── <feature>Api.ts   # Endpoint functions
            └── hooks.ts          # React Query hooks
```

### 2. React Query Entegrasyonu

**Kurulum:**
```bash
npm install @tanstack/react-query
```

**Yapılandırma:**
```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 dakika
      cacheTime: 10 * 60 * 1000, // 10 dakika
      retry: 1,
    },
  },
});
```

**Feature API Örneği:**
```typescript
// src/features/profile/api/profileApi.ts
import { apiService } from '../../../services/ApiService';
import { ENDPOINTS } from '../../../config/api.config';

export const getProfile = async (id: string) => {
  const response = await apiService.getClient().get(
    ENDPOINTS.USERS.BY_ID(id)
  );
  return response.data;
};

// src/features/profile/api/hooks.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { getProfile, updateProfile } from './profileApi';

export const useProfile = (id: string) => {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: () => getProfile(id),
  });
};

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: updateProfile,
  });
};
```

### 3. JWT Token Interceptor

**Token Storage Service:**
```typescript
// src/services/TokenService/index.ts
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const TokenService = {
  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  
  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  
  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
```

**Interceptor:**
```typescript
// src/services/ApiService/interceptors.ts
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiService } from './index';
import { TokenService } from '../TokenService';
import { ENDPOINTS } from '../../config/api.config';
import { useAuthStore } from '../../store/authStore';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setupApiInterceptors = () => {
  // Request Interceptor - Token ekle
  apiService.getClient().interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await TokenService.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor - Refresh token
  apiService.getClient().interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // 401 hatası ve daha önce retry edilmemişse
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Zaten refresh işlemi devam ediyorsa, queue'ya ekle
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return apiService.getClient()(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await TokenService.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token');
          }

          // Refresh token ile yeni access token al
          const response = await apiService.getClient().post(
            ENDPOINTS.AUTH.REFRESH,
            { refreshToken }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Yeni token'ları kaydet
          await TokenService.setTokens(accessToken, newRefreshToken);
          
          // Store'u güncelle
          useAuthStore.getState().login(
            useAuthStore.getState().user!,
            accessToken
          );

          processQueue(null, accessToken);

          // Orijinal request'i yeni token ile tekrar dene
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiService.getClient()(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as AxiosError, null);
          // Refresh başarısız, logout yap
          await TokenService.clearTokens();
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
```

### 4. Feature API Yapısı Örneği

```typescript
// src/features/events/api/eventsApi.ts
import { apiService } from '../../../services/ApiService';
import { ENDPOINTS } from '../../../config/api.config';

export interface Event {
  id: string;
  title: string;
  date: string;
}

export interface GetEventsParams {
  page?: number;
  limit?: number;
}

export const getEvents = async (params?: GetEventsParams): Promise<Event[]> => {
  const response = await apiService.getClient().get('/events', { params });
  return response.data.data;
};

export const getEventById = async (id: string): Promise<Event> => {
  const response = await apiService.getClient().get(`/events/${id}`);
  return response.data.data;
};

// src/features/events/api/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvents, getEventById, Event } from './eventsApi';

export const useEvents = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => getEvents(params),
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: () => getEventById(id),
    enabled: !!id,
  });
};
```

## 📝 Yapılması Gerekenler

### Öncelik 1: Temel Altyapı
1. ✅ React Query kurulumu
2. ✅ TokenService oluştur (SecureStore ile)
3. ✅ JWT interceptor'ları ekle
4. ✅ Refresh token mekanizması

### Öncelik 2: Feature Entegrasyonu
1. ✅ Her feature için `api/` klasörü oluştur
2. ✅ Endpoint fonksiyonları yaz
3. ✅ React Query hooks oluştur
4. ✅ Screen'lerde kullan

### Öncelik 3: Workspace Rules Güncelleme
1. ⚠️ Rules'da `/src/api` yerine `/src/services/ApiService` belirt
2. ⚠️ SecureStore kullanımını doğrula

## 🎯 Sonuç

**ApiService kullanılmalı mı?** ✅ **EVET!**

Mevcut `ApiService` yapısı:
- ✅ Doğru konumlandırılmış (`src/services` altında)
- ✅ Singleton pattern ile güvenli
- ✅ Genişletilebilir yapı
- ✅ Workspace rules'a uygun (service abstraction)

**Eksikler:**
- React Query entegrasyonu
- JWT token yönetimi
- Refresh token mekanizması
- SecureStore kullanımı

**Önerilen Yaklaşım:**
1. Mevcut `ApiService` yapısını koru
2. React Query ekle
3. Token yönetimini güçlendir
4. Feature-based API yapısını standartlaştır

