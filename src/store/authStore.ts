import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => Promise<void>;
}

// Secure Store keys
const STORAGE_KEYS = {
  USER: 'user_data',
  TOKEN: 'auth_token',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (user: User, token: string) => {
    try {
      // Secure Store'a kaydet
      await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
      
      set({ 
        user, 
        token, 
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login storage error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      // Secure Store'dan sil
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
      
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Logout storage error:', error);
    }
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  checkAuthStatus: async () => {
    try {
      set({ isLoading: true });
      
      const [userString, token] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.USER),
        SecureStore.getItemAsync(STORAGE_KEYS.TOKEN),
      ]);

      if (userString && token) {
        const user = JSON.parse(userString);
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ 
        user: null, 
        token: null, 
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
})); 