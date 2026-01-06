import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/src/store/appStore';

/**
 * useAuthStatus Hook
 * 
 * Memoized authentication status hook.
 * RootNavigator gibi kritik component'lerde re-render'ı minimize etmek için.
 * 
 * @returns {boolean} isAuthenticated - Kullanıcı authenticated mı?
 * 
 * @example
 * ```tsx
 * const isAuthenticated = useAuthStatus();
 * ```
 */
export const useAuthStatus = (): boolean => {
  return useAppStore(
    useShallow((state) => state.isAuthenticated)
  );
};

