import { useMutation } from '@tanstack/react-query';
import { changePassword } from './changePasswordApi';
import type { ChangePasswordRequest, ChangePasswordResponse } from '../types';

/**
 * Query Keys - Settings feature için cache key pattern'leri
 */
export const settingsKeys = {
  all: ['settings'] as const,
};

/**
 * Change Password mutation hook
 * Kullanıcı şifre değiştirme işlemi için React Query mutation hook'u
 * 
 * @example
 * const changePasswordMutation = useChangePassword();
 * changePasswordMutation.mutate({ currentPassword, newPassword });
 */
export const useChangePassword = () => {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
    mutationFn: changePassword,
    onSuccess: (data) => {
      // Başarılı şifre değiştirme sonrası işlemler burada yapılabilir
    },
    onError: (error) => {
      // Hata durumunda işlemler burada yapılabilir
      console.error('Password change error:', error);
    },
  });
};

