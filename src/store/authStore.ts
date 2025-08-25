import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  isGuest?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  accessToken: string | null;
  login: (user: User, accessToken: string) => void;
  setTempUser: (user: User, accessToken: string) => void;
  completeRegistration: () => void;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      accessToken: null,

      setTempUser: (user: User, accessToken: string) => {
        set({
          user,
          accessToken,
          isAuthenticated: false,
          error: null,
        });
      },

      completeRegistration: () => {
        set((state) => ({
          isAuthenticated: true,
        }));
      },

      login: (user: User, accessToken: string) => {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          error: null,
        });
      },

      loginAsGuest: async () => {
        try {
          set({ isLoading: true, error: null });
          // Simüle edilmiş misafir girişi
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({
            isAuthenticated: true,
            isLoading: false,
            user: {
              name: 'Misafir Kullanıcı',
              isGuest: true,
            },
            accessToken: null,
          });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true, error: null });
          await new Promise(resolve => setTimeout(resolve, 500));
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);