import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '../TokenService';
import { useAppStore } from '../../store/appStore';

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
 */
export const updateTokenCache = (token: string | null): void => {
  cachedAccessToken = token;
};

/**
 * Clear token cache (called on logout)
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

  // Request Interceptor - JWT Token ekleme
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
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

      // Log request details for /messages/tips endpoint
      if (config.url?.includes('/messages/tips')) {
        console.log('[ApiInterceptor] 📤 Request Interceptor - /messages/tips:', {
          url: config.url,
          method: config.method,
          baseURL: config.baseURL,
          fullURL: `${config.baseURL}${config.url}`,
          data: config.data,
          headers: {
            'Content-Type': config.headers['Content-Type'],
            'Authorization': config.headers.Authorization ? 'Bearer ***' : undefined,
          },
        });
      }

      return config;
    },
    (error) => {
      console.error('[ApiInterceptor] ❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor - Token refresh
  client.interceptors.response.use(
    (response) => {
      // Log response details for /messages/tips endpoint
      if (response.config.url?.includes('/messages/tips')) {
        console.log('[ApiInterceptor] ✅ Response Interceptor - /messages/tips:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers,
        });
      }
      return response;
    },
    async (error: AxiosError) => {
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

          // Store'u güncelle (eğer user varsa)
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
          // Refresh başarısız, tüm token'ları temizle ve logout yap
          processQueue(refreshError as AxiosError, null);
          clearTokenCache(); // PERFORMANCE FIX: Clear cache on refresh failure
          await TokenService.clearTokens();
          useAppStore.getState().logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

