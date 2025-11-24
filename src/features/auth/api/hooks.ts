import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register, login } from './authApi';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { RegisterResponse, ApiLoginResponse } from '../types';
import { useAppStore } from '../../../store/appStore';

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
    },
    onError: (error) => {
      // Hata durumunda işlemler burada yapılabilir
      console.error('Login error:', error);
    },
  });
};

