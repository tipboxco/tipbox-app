import { useMutation, useQueryClient } from '@tanstack/react-query';
import { register, login } from './authApi';
import type { RegisterCredentials, LoginCredentials } from '../../../types/auth';
import type { RegisterResponse, LoginResponse } from '../types';
import { TokenService } from '../../../services/TokenService';
import { useAuthStore } from '../../../store/authStore';

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
      console.log('Registration successful:', data);
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

  return useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: login,
    onSuccess: async (data) => {
      // Token'ları SecureStore'a kaydet
      if (data.accessToken && data.refreshToken) {
        await TokenService.setTokens(data.accessToken, data.refreshToken);
      }

      // Auth store'u güncelle
      useAuthStore.getState().login(data.user, data.accessToken);

      // Current user query'sini set et
      queryClient.setQueryData(authKeys.currentUser(), data.user);

      console.log('Login successful:', data);
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });
};

