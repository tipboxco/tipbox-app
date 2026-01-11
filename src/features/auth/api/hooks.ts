import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register, login, setupProfile, updateUserInterests, googleLogin } from './authApi';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { RegisterResponse, ApiLoginResponse } from '../types';
import type { SetupProfileRequest, SetupProfileResponse, UpdateUserInterestsResponse } from './authApi';
import { useAppStore } from '../../../store/appStore';
import { notificationService } from '@/src/services/ExpoNotificationService';
import { notificationKeys } from '@/src/features/notifications/api/hooks';

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
      
      // Notification query'lerini invalidate et - login sonrası bildirimler yüklensin
      console.log('📋 Step 4: Notification query\'leri invalidate ediliyor...');
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      console.log('✅ Notification query\'leri invalidate edildi');
      
      // Socket sistemi SocketProvider tarafından otomatik olarak yönetiliyor
      // isAuthenticated=true olduğunda SocketProvider otomatik olarak bağlanacak
      console.log('📋 Step 5: Socket bağlantısı SocketProvider tarafından otomatik yönetiliyor');
      
      console.log('========================================');
    },
    onError: (error) => {
      // Hata durumunda işlemler burada yapılabilir
      console.error('Login error:', error);
    },
  });
};

/**
 * Setup Profile mutation hook
 * Kullanıcı profil bilgilerini kaydetmek için React Query mutation hook'u
 * 
 * @example
 * const setupProfileMutation = useSetupProfile();
 * setupProfileMutation.mutate({ fullName, username, profileImage });
 */
export const useSetupProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<SetupProfileResponse, Error, SetupProfileRequest>({
    mutationFn: setupProfile,
    onSuccess: (data) => {
      // Başarılı profil setup sonrası store'u güncelle
      if (data.user) {
        const { updateUser } = useAppStore.getState();
        updateUser({
          fullName: data.user.fullName,
          avatar: data.user.avatar,
        });
      }

      // Current user query'sini invalidate et
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      
      console.log('[useSetupProfile] ✅ Profile setup successful:', {
        fullName: data.user?.fullName,
        username: data.user?.username,
      });
    },
    onError: (error) => {
      console.error('[useSetupProfile] ❌ Profile setup error:', error);
    },
  });
};

/**
 * Update User Interests mutation hook
 * Kullanıcının ilgi alanlarını güncellemek için React Query mutation hook'u
 * 
 * @example
 * const updateInterestsMutation = useUpdateUserInterests();
 * updateInterestsMutation.mutate(['category-1', 'category-2']);
 */
export const useUpdateUserInterests = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateUserInterestsResponse, Error, string[]>({
    mutationFn: updateUserInterests,
    onSuccess: (data) => {
      // Başarılı interests update sonrası
      console.log('[useUpdateUserInterests] ✅ Interests updated:', {
        interests: data.interests,
        count: data.interests?.length || 0,
      });

      // User interests query'sini invalidate et (varsa)
      queryClient.invalidateQueries({ queryKey: ['user', 'interests'] });
    },
    onError: (error) => {
      console.error('[useUpdateUserInterests] ❌ Update interests error:', error);
    },
  });
};

/**
 * Google Login mutation hook
 * Google OAuth ile giriş yapmak için React Query mutation hook'u
 * 
 * @example
 * const googleLoginMutation = useGoogleLogin();
 * googleLoginMutation.mutate('google-id-token');
 */
export const useGoogleLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<ApiLoginResponse, Error, string>({
    mutationFn: googleLogin,
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
      // │         GOOGLE LOGIN BAŞARILI            │
      // └─────────────────┬───────────────────────┘
      console.log('========================================');
      console.log('✅ GOOGLE LOGIN BAŞARILI');
      console.log('========================================');
      console.log('   - User ID:', data.id);
      console.log('   - Email:', data.email);
      console.log('   - Full Name:', data.fullName);
      console.log('   - Token Length:', data.token.length, 'characters');
      console.log('   - Refresh Token Length:', data.refreshToken.length, 'characters');
      
      // Token kaydetme (login fonksiyonu içinde yapılıyor)
      console.log('📋 Step 1: Token kaydediliyor...');
      console.log('   - SecureStore\'a kaydediliyor');
      
      // Push token retry - Login sonrası pending token'ı tekrar dene
      console.log('📋 Step 2: Pending push token retry...');
      notificationService.retryPendingPushToken().catch((error) => {
        console.warn('[useGoogleLogin] Failed to retry pending push token:', error);
        // Hata olsa bile login devam etsin
      });
      
      // Notification query'lerini invalidate et - login sonrası bildirimler yüklensin
      console.log('📋 Step 3: Notification query\'leri invalidate ediliyor...');
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      console.log('✅ Notification query\'leri invalidate edildi');
      
      // Socket sistemi SocketProvider tarafından otomatik olarak yönetiliyor
      // isAuthenticated=true olduğunda SocketProvider otomatik olarak bağlanacak
      console.log('📋 Step 4: Socket bağlantısı SocketProvider tarafından otomatik yönetiliyor');
      
      console.log('========================================');
    },
    onError: (error) => {
      // Hata durumunda işlemler burada yapılabilir
      console.error('[useGoogleLogin] ❌ Google login error:', error);
    },
  });
};

