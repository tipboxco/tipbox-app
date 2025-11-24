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

  // Response Interceptor - Token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
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

