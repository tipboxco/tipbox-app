import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '../TokenService';
import { Sentry } from '../../config/sentry.config';
// ARCHITECTURE FIX: Lazy import to break circular dependency
// appStore imports interceptors (updateTokenCache, clearTokenCache)
// interceptors imports appStore (useAppStore.getState())
// Solution: Use require() for lazy import at runtime

/**
 * PERFORMANCE FIX: Memory cache for access token
 * Avoids SecureStore I/O on every request (significant performance improvement)
 */
let cachedAccessToken: string | null = null;
let isTokenCacheInitialized = false;

/**
 * Initialize token cache from SecureStore (called once on app start)
 */
export const initializeTokenCache = async (): Promise<void> => {
  if (isTokenCacheInitialized) return;
  
  try {
    cachedAccessToken = await TokenService.getAccessToken();
    isTokenCacheInitialized = true;
  } catch (error) {
    console.error('[ApiInterceptor] ❌ Error initializing token cache:', error);
  }
};

/**
 * Update token cache (called after token refresh or login)
 * 
 * CACHE INVALIDATION: This function should be called:
 * - After successful login (appStore.login)
 * - After successful token refresh (interceptors.ts:248)
 * - When token is updated externally
 */
export const updateTokenCache = (token: string | null): void => {
  cachedAccessToken = token;
  // If token is null, mark cache as uninitialized to force SecureStore read on next request
  if (token === null) {
    isTokenCacheInitialized = false;
  }
};

/**
 * Clear token cache (called on logout or token expiration)
 * 
 * CACHE INVALIDATION: This function should be called:
 * - On logout (appStore.logout)
 * - On token refresh failure (interceptors.ts:268)
 * - When token is explicitly invalidated
 */
export const clearTokenCache = (): void => {
  cachedAccessToken = null;
  isTokenCacheInitialized = false;
};

/**
 * Get access token from cache or SecureStore (fallback)
 */
const getCachedAccessToken = async (): Promise<string | null> => {
  // If cache is initialized, use cached value
  if (isTokenCacheInitialized && cachedAccessToken !== null) {
    return cachedAccessToken;
  }
  
  // Fallback to SecureStore (shouldn't happen in normal flow)
  const token = await TokenService.getAccessToken();
  cachedAccessToken = token;
  isTokenCacheInitialized = true;
  return token;
};

/**
 * Token refresh sırasında bekleyen request'leri tutar
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string) => void;
  reject: (error?: any) => void;
}> = [];

/**
 * Bekleyen request'leri işler (başarılı veya hatalı)
 */
const processQueue = (error: AxiosError | null, token: string | null = null) => {
  // failedQueue undefined olabilir, kontrol et
  if (!failedQueue || !Array.isArray(failedQueue)) {
    console.warn('[ApiInterceptor] ⚠️ failedQueue is not an array, initializing...');
    failedQueue = [];
    return;
  }
  
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token || undefined);
    }
  });
  failedQueue = [];
};

/**
 * JWT ve Refresh Token Interceptor'larını kurar
 * - Request Interceptor: Her request'e Authorization header ekler
 * - Response Interceptor: 401 hatası durumunda token'ı yeniler
 * 
 * @param client - Axios instance (circular dependency'yi önlemek için parametre olarak geçiliyor)
 */
export const setupApiInterceptors = (client: AxiosInstance) => {

  // Request Interceptor - JWT Token ekleme ve FormData Content-Type yönetimi
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // FormData kontrolü - React Native'de FormData gönderirken Content-Type header'ını kaldır
      // Axios otomatik olarak multipart/form-data boundary ekler
      // CRITICAL: Request formatı için - field adı 'avatar' (küçük harf) ve multipart/form-data olmalı
      if (config.data && (config.data instanceof FormData || config.data?.constructor?.name === 'FormData')) {
        // Content-Type header'ını tamamen kaldır - Axios otomatik olarak doğru boundary ile multipart/form-data ekleyecek
        if (config.headers) {
          // Tüm Content-Type varyasyonlarını kaldır
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
          delete config.headers['Content-type'];
          // Axios'un otomatik olarak multipart/form-data boundary eklemesine izin ver
        }
        // Log for debugging
        if (__DEV__) {
          console.log('[ApiInterceptor] FormData detected, Content-Type header removed - Axios will add multipart/form-data automatically');
        }
      }

      // Token gerektirmeyen endpoint'ler (login, register gibi)
      const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
      const isPublicEndpoint = publicEndpoints.some((endpoint) =>
        config.url?.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        // PERFORMANCE FIX: Use cached token instead of SecureStore read
        // This reduces I/O overhead by ~90% (memory read vs SecureStore read)
        const token = await getCachedAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response Interceptor - Unwrap standardized response format + Token refresh
  client.interceptors.response.use(
    (response) => {
      // Backend standart format: { success: true, data: T }
      // Interceptor otomatik olarak 'data' alanini unwrap eder
      // Boylece tum API fonksiyonlari dogrudan T tipini alir
      if (
        response.data &&
        typeof response.data === 'object' &&
        response.data.success === true &&
        'data' in response.data
      ) {
        if (__DEV__) {
          console.log(`[ApiInterceptor] 📦 Unwrapping response: ${response.config.url}`);
        }
        // CRITICAL: React Query undefined kabul etmiyor
        // data field'ı undefined ise null döndür
        response.data = response.data.data !== undefined ? response.data.data : null;
      }
      return response;
    },
    async (error: AxiosError) => {
      // Error response format normalization
      // Eski format: { error: { message: '...' } } veya { error: '...' }
      // Yeni format: { success: false, message: '...' }
      // Eski formattan yeni formata normalize et (geri uyumluluk)
      if (error.response?.data && typeof error.response.data === 'object') {
        const errorData = error.response.data as Record<string, any>;
        if (!('success' in errorData) && 'error' in errorData) {
          if (typeof errorData.error === 'string') {
            (error.response.data as any).message = errorData.error;
            (error.response.data as any).success = false;
          } else if (typeof errorData.error === 'object' && errorData.error?.message) {
            (error.response.data as any).message = errorData.error.message;
            (error.response.data as any).success = false;
          }
        }
      }

      // Log error response details for /messages/tips endpoint
      if (error.config?.url?.includes('/messages/tips')) {
        console.error('[ApiInterceptor] ❌ Response Error - /messages/tips:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          request: {
            url: error.config.url,
            method: error.config.method,
            data: error.config.data,
          },
        });
      }
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // 401 hatası ve daha önce retry edilmemişse
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Public endpoint'lerde refresh yapma
        const publicEndpoints = ['/auth/login', '/auth/register'];
        const isPublicEndpoint = publicEndpoints.some((endpoint) =>
          originalRequest.url?.includes(endpoint)
        );

        if (isPublicEndpoint) {
          return Promise.reject(error);
        }

        // Change password endpoint'i için 401 hatası, token geçersizliği değil
        // muhtemelen yanlış current password anlamına geliyor
        // Bu durumda refresh token yapmadan direkt hatayı döndür
        const skipRefreshEndpoints = ['/users/settings/change-password'];
        const shouldSkipRefresh = skipRefreshEndpoints.some((endpoint) =>
          originalRequest.url?.includes(endpoint)
        );

        if (shouldSkipRefresh) {
          return Promise.reject(error);
        }

        // Zaten refresh işlemi devam ediyorsa, queue'ya ekle
        if (isRefreshing) {
          // failedQueue undefined olabilir, kontrol et
          if (!failedQueue || !Array.isArray(failedQueue)) {
            console.warn('[ApiInterceptor] ⚠️ failedQueue is not an array during refresh, initializing...');
            failedQueue = [];
          }
          
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers && token) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await TokenService.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Refresh token ile yeni access token al
          // Not: Refresh endpoint'ine token eklenmemeli (public endpoint)
          const response = await client.post<{
            accessToken: string;
            refreshToken?: string;
          }>(
            '/auth/refresh',
            { refreshToken },
            {
              headers: {
                Authorization: undefined, // Token eklenmemeli
              },
            }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Yeni token'ları kaydet
          if (newRefreshToken) {
            await TokenService.setTokens(accessToken, newRefreshToken);
          } else {
            await TokenService.setAccessToken(accessToken);
          }

          // PERFORMANCE FIX: Update token cache immediately
          updateTokenCache(accessToken);

          // ARCHITECTURE FIX: Lazy import to break circular dependency
          // Store'u güncelle (eğer user varsa)
          const { useAppStore } = require('../../store/appStore');
          const appState = useAppStore.getState();
          if (appState.user && appState.accessToken) {
            // Access token'ı güncelle (user bilgileri aynı kalır)
            useAppStore.setState({ accessToken });
          }

          // Bekleyen request'leri başarıyla işle
          processQueue(null, accessToken);

          // Orijinal request'i yeni token ile tekrar dene
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          // ARCHITECTURE FIX: Lazy import to break circular dependency
          // Refresh başarısız, tüm token'ları temizle ve logout yap
          processQueue(refreshError as AxiosError, null);
          clearTokenCache(); // PERFORMANCE FIX: Clear cache on refresh failure
          await TokenService.clearTokens();
          
          // CRITICAL: Logout'u await etmeden çağır (sonsuz döngü önleme)
          // Logout fonksiyonu zaten state'i güncelliyor, burada sadece tetikliyoruz
          const { useAppStore } = require('../../store/appStore');
          // Logout'u arka planda çağır (await etme - sonsuz döngü riski)
          useAppStore.getState().logout().catch((error: any) => {
            console.error('[interceptors] Logout error (silent):', error);
          });
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Sentry Error Tracking - Sadece kritik hatalar için
      // Filtrelenen hatalar: 401 (auth), 404 (not found), network errors
      const shouldTrackError =
        error.response?.status && // Response var mı?
        error.response.status >= 500 && // 5xx server errors
        !error.message?.includes('Network request failed') && // Network hatası değil
        !error.message?.includes('timeout'); // Timeout değil

      if (shouldTrackError) {
        Sentry.captureException(error, {
          tags: {
            type: 'api_error',
            status: error.response?.status?.toString() || 'unknown',
            endpoint: error.config?.url || 'unknown',
          },
          contexts: {
            api: {
              url: error.config?.url,
              method: error.config?.method,
              status: error.response?.status,
              statusText: error.response?.statusText,
            },
          },
        });
      }

      return Promise.reject(error);
    }
  );
};

