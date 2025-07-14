import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@/src/types';
import type { AuthState } from '@/src/features/auth/types';

// SecureStore adapter for Zustand persist
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setToken: (token: string) => {
        set({ accessToken: token });
      },

      loginAsGuest: async () => {
        set({ isLoading: true });

        try {
          // Geçici guest token oluştur
          const guestToken = `guest_token_${Date.now()}`;
          const guestUser: User = {
            id: `guest_${Date.now()}`,
            name: 'Misafir Kullanıcı',
            isGuest: true,
          };

          set({
            user: guestUser,
            accessToken: guestToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Guest login error:', error);
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await SecureStore.deleteItemAsync('auth-storage');
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Logout error:', error);
          set({ isLoading: false });
        }
      },

      checkAuthStatus: async () => {
        set({ isLoading: true });

        try {
          const storedData = await SecureStore.getItemAsync('auth-storage');
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            const { user, accessToken } = parsedData.state;

            if (user && accessToken) {
              set({
                user,
                accessToken,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Check auth status error:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);
