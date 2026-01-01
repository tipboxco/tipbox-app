import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register, login } from './authApi';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { RegisterResponse, ApiLoginResponse } from '../types';
import { useAppStore } from '../../../store/appStore';
import { notificationService } from '@/src/services/ExpoNotificationService';
// Socket bağlantısı adım adım test edilecek

/**
 * Query Keys - Auth feature için cache key pattern'leri
 */
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
};

/**
 * Register mutation hook
 * Kullanıcı kayıt işlemi için React Query mutation hook'u
 * 
 * @example
 * const registerMutation = useRegister();
 * registerMutation.mutate({ email, password, name });
 */
export const useRegister = () => {
  return useMutation<RegisterResponse, Error, RegisterCredentials>({
    mutationFn: register,
    onSuccess: (data) => {
      // Başarılı kayıt sonrası işlemler burada yapılabilir
    },
    onError: (error) => {
      // Hata durumunda işlemler burada yapılabilir
      console.error('Registration error:', error);
    },
  });
};

/**
 * Login mutation hook
 * Kullanıcı giriş işlemi için React Query mutation hook'u
 * 
 * @example
 * const loginMutation = useLogin();
 * loginMutation.mutate({ email, password });
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiLoginResponse, Error, LoginCredentials>({
    mutationFn: login,
    onSuccess: async (data) => {
      // App store'u güncelle - login fonksiyonu token'ları SecureStore'a kaydeder
      await useAppStore.getState().login({
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        avatar: data.avatar,
        token: data.token,
        refreshToken: data.refreshToken,
      });

      // Current user query'sini set et
      queryClient.setQueryData(authKeys.currentUser(), {
        id: data.id,
        name: data.fullName,
        email: data.email,
        isGuest: false,
      });

      // ┌─────────────────────────────────────────┐
      // │         LOGIN BAŞARILI                    │
      // └─────────────────┬───────────────────────┘
      console.log('========================================');
      console.log('✅ LOGIN BAŞARILI');
      console.log('========================================');
      console.log('   - User ID:', data.id);
      console.log('   - Email:', data.email);
      console.log('   - Full Name:', data.fullName);
      console.log('   - Token Length:', data.token.length, 'characters');
      console.log('   - Refresh Token Length:', data.refreshToken.length, 'characters');
      
      // Token kaydetme (login fonksiyonu içinde yapılıyor)
      console.log('📋 Step 1: Token kaydediliyor...');
      console.log('   - SecureStore\'a kaydediliyor');
      
      // Socket bağlantısı adım adım test edilecek
      console.log('📋 Step 2: Socket bağlantısı adım adım test edilecek');
      
      // Push token retry - Login sonrası pending token'ı tekrar dene
      console.log('📋 Step 3: Pending push token retry...');
      notificationService.retryPendingPushToken().catch((error) => {
        console.warn('[useLogin] Failed to retry pending push token:', error);
        // Hata olsa bile login devam etsin
      });
      
      console.log('========================================');
    },
    onError: (error) => {
      // Hata durumunda işlemler burada yapılabilir
      console.error('Login error:', error);
    },
  });
};

