import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { TokenService } from '../TokenService';
import { useAppStore } from '../../store/appStore';

/**
 * Token refresh sırasında bekleyen request'leri tutar
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string) => void;
  reject: (error?: any) => void;
}> = [];

/**
 * Network error retry yapılandırması
 */
const NETWORK_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 saniye
  MAX_DELAY: 5000, // 5 saniye
  BACKOFF_MULTIPLIER: 2,
};

/**
 * Retry yapılmayacak endpoint'ler (login, register gibi kritik işlemler)
 */
const NO_RETRY_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/notifications/push-token', // Push token kayıt işlemi kendi retry mekanizmasına sahip
];

/**
 * Network error olup olmadığını kontrol eder
 */
const isNetworkError = (error: AxiosError): boolean => {
  // Network error: response yok veya message "Network Error" içeriyor
  return (
    !error.response &&
    (error.message === 'Network Error' ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND'))
  );
};

/**
 * Endpoint retry yapılabilir mi kontrol eder
 */
const shouldRetryEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return !NO_RETRY_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

/**
 * Exponential backoff ile delay hesaplar
 */
const calculateDelay = (attempt: number): number => {
  const delay = NETWORK_RETRY_CONFIG.INITIAL_DELAY * Math.pow(NETWORK_RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt);
  return Math.min(delay, NETWORK_RETRY_CONFIG.MAX_DELAY);
};

/**
 * Bekleyen request'leri işler (başarılı veya hatalı)
 */
const processQueue = (error: AxiosError | null, token: string | null = null) => {
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
        const token = await TokenService.getAccessToken();
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

  // Response Interceptor - Token refresh ve Network error retry
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _networkRetryCount?: number;
      };

      // Network error retry mekanizması
      if (isNetworkError(error) && originalRequest && shouldRetryEndpoint(originalRequest.url)) {
        const retryCount = originalRequest._networkRetryCount || 0;

        // Max retry sayısına ulaşılmadıysa tekrar dene
        if (retryCount < NETWORK_RETRY_CONFIG.MAX_RETRIES) {
          originalRequest._networkRetryCount = retryCount + 1;
          const delay = calculateDelay(retryCount);

          console.warn(
            `[ApiInterceptor] 🌐 Network error, retrying (${retryCount + 1}/${NETWORK_RETRY_CONFIG.MAX_RETRIES}) in ${delay}ms...`,
            {
              url: originalRequest.url,
              method: originalRequest.method,
            }
          );

          // Exponential backoff ile bekle ve tekrar dene
          await new Promise((resolve) => setTimeout(resolve, delay));

          try {
            return await client(originalRequest);
          } catch (retryError) {
            // Retry de başarısız oldu, son deneme değilse devam et
            if (retryCount + 1 < NETWORK_RETRY_CONFIG.MAX_RETRIES) {
              return Promise.reject(retryError);
            }
            // Son deneme de başarısız oldu, hatayı döndür
            console.error(
              `[ApiInterceptor] ❌ Network error after ${NETWORK_RETRY_CONFIG.MAX_RETRIES} retries:`,
              {
                url: originalRequest.url,
                method: originalRequest.method,
                error: retryError,
              }
            );
            return Promise.reject(retryError);
          }
        } else {
          // Max retry sayısına ulaşıldı
          console.error(
            `[ApiInterceptor] ❌ Network error: Max retries (${NETWORK_RETRY_CONFIG.MAX_RETRIES}) reached`,
            {
              url: originalRequest.url,
              method: originalRequest.method,
            }
          );
        }
      }

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

