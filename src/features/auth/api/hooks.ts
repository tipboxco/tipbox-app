import { useMutation, useQueryClient, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { register, login, setupProfile, updateUserInterests, googleLogin, verifyEmail, checkUsernameAvailability, getUsernameSuggestions, getUserCategories, getUserAvatars, forgotPassword, verifyResetCode, resetPassword } from './authApi';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { RegisterResponse, ApiLoginResponse } from '../types';
import type { SetupProfileRequest, SetupProfileResponse, UpdateUserInterestsResponse, VerifyEmailRequest, VerifyEmailResponse, UsernameCheckResponse, UsernameSuggestionsResponse, UserCategory, UserCategoryPaginationResponse, GetUserAvatarsResponse, ForgotPasswordResponse, VerifyResetCodeRequest, VerifyResetCodeResponse, ResetPasswordRequest, ResetPasswordResponse } from './authApi';
import { useAppStore } from '../../../store/appStore';
import { notificationService } from '@/src/services/ExpoNotificationService';
import { notificationKeys } from '@/src/features/notifications/api/hooks';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { TokenService } from '@/src/services/TokenService';
import { updateTokenCache } from '@/src/services/ApiService/interceptors';

/**
 * Query Keys - Auth feature için cache key pattern'leri
 */
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'currentUser'] as const,
  userCategories: () => [...authKeys.all, 'userCategories'] as const,
  userAvatars: () => [...authKeys.all, 'userAvatars'] as const,
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
      
      // Sadece list ve unreadCount invalidate et (cache'i tamamen silmeden refetch)
      console.log('📋 Step 4: Notification list ve unreadCount refetch...');
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
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
 * Verify Email mutation hook
 * Email doğrulama kodu ile email'i doğrular ve token alır
 * 
 * @example
 * const verifyEmailMutation = useVerifyEmail();
 * verifyEmailMutation.mutate({ email, code });
 */
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyEmailResponse, Error, VerifyEmailRequest>({
    mutationFn: verifyEmail,
    onSuccess: async (data) => {
      // Token'ı store'a kaydet
      if (data.token) {
        // Eğer refreshToken varsa login fonksiyonunu kullan, yoksa sadece token'ı kaydet
        if (data.refreshToken) {
          await useAppStore.getState().login({
            id: '', // VerifyEmail'de user bilgisi yok, setupProfile'da alınacak
            fullName: '',
            email: '',
            avatar: undefined,
            token: data.token,
            refreshToken: data.refreshToken,
          });
        } else {
          // Sadece access token varsa, TokenService ile kaydet
          await TokenService.setAccessToken(data.token);
          // Token cache'i güncelle
          updateTokenCache(data.token);
          // Temp user olarak işaretle (setupProfile sonrası tamamlanacak)
          useAppStore.getState().setTempUser(
            {
              id: '',
              name: '',
              email: '',
              isGuest: false,
            },
            data.token
          );
        }
      }

      console.log('[useVerifyEmail] ✅ Email verification successful');
    },
    onError: (error) => {
      console.error('[useVerifyEmail] ❌ Email verification error:', error);
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
      // Current user query'sini invalidate et
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      console.log('[useSetupProfile] ✅ Profile setup successful:', {
        userId: data.user?.id,
        userName: data.user?.name,
        message: data.message,
      });
    },
    onError: (error) => {
      console.error('[useSetupProfile] ❌ Profile setup error:', error);
    },
  });
};

/**
 * Check Username Availability query hook
 * Username'in müsait olup olmadığını kontrol eder
 * 
 * @param username - Kontrol edilecek username
 * @param enabled - Query'nin aktif olup olmayacağı
 * @example
 * const { data, isLoading } = useCheckUsernameAvailability('username', true);
 */
export const useCheckUsernameAvailability = (username: string, enabled: boolean = true) => {
  return useQuery<UsernameCheckResponse, Error>({
    queryKey: ['username', 'check', username],
    queryFn: () => checkUsernameAvailability(username),
    enabled: Boolean(enabled && username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username)),
    staleTime: 60 * 1000, // 1 dakika aynı username için tekrar istek atma
    gcTime: 5 * 60 * 1000, // 5 dakika cache'de tut
  });
};

/**
 * Get Username Suggestions query hook
 * Username için öneriler getirir
 * 
 * @param username - Temel username
 * @param limit - Öneri sayısı
 * @param enabled - Query'nin aktif olup olmayacağı
 * @example
 * const { data, isLoading } = useUsernameSuggestions('username', 5, true);
 */
export const useUsernameSuggestions = (username: string, limit: number = 5, enabled: boolean = true) => {
  return useQuery<UsernameSuggestionsResponse, Error>({
    queryKey: ['username', 'suggestions', username, limit],
    queryFn: () => getUsernameSuggestions(username, limit),
    enabled: Boolean(enabled && username.length >= 3),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Get User Avatars query hook
 * Avatar seçim ekranı için varsayılan avatar listesini getirir
 *
 * @returns React Query hook result
 * @example
 * const { data, isLoading, error } = useUserAvatars();
 */
export const useUserAvatars = () => {
  return useQuery<GetUserAvatarsResponse, Error>({
    queryKey: authKeys.userAvatars(),
    queryFn: getUserAvatars,
    staleTime: 10 * 60 * 1000, // 10 dakika
    gcTime: 60 * 60 * 1000, // 1 saat
  });
};

/**
 * Get User Categories infinite query hook
 * Kullanıcı kategori seçimi için kategorileri 10'arlı pagination ile getirir
 *
 * @param limit - Sayfa başına item sayısı (default: 10)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, isLoading, error, fetchNextPage, hasNextPage } = useUserCategories();
 */
export const useUserCategories = (limit: number = 10) => {
  return useInfiniteQuery<UserCategoryPaginationResponse, Error>({
    queryKey: [...authKeys.userCategories(), limit],
    queryFn: ({ pageParam }) => {
      const cursor = pageParam as string | undefined;
      return getUserCategories(cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) return undefined;
      return lastPage.pagination?.cursor;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 saat - kategoriler nadiren değişir
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 gün - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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
      // Current user ve profile cache'ini invalidate et - interests profilde gösteriliyor
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
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
      
      // Sadece list ve unreadCount invalidate et (cache'i tamamen silmeden refetch)
      console.log('📋 Step 3: Notification list ve unreadCount refetch...');
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
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

/**
 * Forgot Password mutation hook
 * Şifre sıfırlama kodu göndermek için React Query mutation hook'u
 * 
 * @example
 * const forgotPasswordMutation = useForgotPassword();
 * forgotPasswordMutation.mutate('user@example.com');
 */
export const useForgotPassword = () => {
  return useMutation<ForgotPasswordResponse, Error, string>({
    mutationFn: forgotPassword,
    onSuccess: (data) => {
      console.log('[useForgotPassword] ✅ Password reset code sent:', data.message);
    },
    onError: (error) => {
      console.error('[useForgotPassword] ❌ Forgot password error:', error);
    },
  });
};

/**
 * Verify Reset Code mutation hook
 * Şifre sıfırlama kodunu doğrulamak için React Query mutation hook'u
 * 
 * @example
 * const verifyResetCodeMutation = useVerifyResetCode();
 * verifyResetCodeMutation.mutate({ mail: 'user@example.com', code: '123456' });
 */
export const useVerifyResetCode = () => {
  return useMutation<VerifyResetCodeResponse, Error, VerifyResetCodeRequest>({
    mutationFn: verifyResetCode,
    onSuccess: (data) => {
      console.log('[useVerifyResetCode] ✅ Reset code verified:', data.message);
    },
    onError: (error) => {
      console.error('[useVerifyResetCode] ❌ Verify reset code error:', error);
    },
  });
};

/**
 * Reset Password mutation hook
 * Şifreyi sıfırlamak için React Query mutation hook'u
 * 
 * @example
 * const resetPasswordMutation = useResetPassword();
 * resetPasswordMutation.mutate({ email: 'user@example.com', password: 'newPassword123' });
 */
export const useResetPassword = () => {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationFn: resetPassword,
    onSuccess: (data) => {
      console.log('[useResetPassword] ✅ Password reset successful:', data.message);
    },
    onError: (error) => {
      console.error('[useResetPassword] ❌ Reset password error:', error);
    },
  });
};

