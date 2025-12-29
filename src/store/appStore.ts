import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenService } from '../services/TokenService';
import { WalletService } from '../services/WalletService';
import { socketService } from '../services/SocketService';

// Types
type ColorMode = 'light' | 'dark';

interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  isGuest?: boolean;
}

interface AppState {
  // Auth State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  accessToken: string | null;
  
  // Theme State
  colorMode: ColorMode;
  
  // Auth Actions
  login: (userData: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
    token: string;
    refreshToken: string;
  }) => Promise<void>;
  setTempUser: (user: User, accessToken: string) => void;
  completeRegistration: () => void;
  loginAsGuest: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  logout: () => Promise<void>;
  
  // Theme Actions
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial Auth State
        isAuthenticated: false,
        isLoading: false,
        error: null,
        user: null,
        accessToken: null,
        
        // Initial Theme State
        colorMode: 'light',
        
        // Auth Actions
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
        
        login: async (userData) => {
          try {
            set({ isLoading: true, error: null });
            
            // Token'ları SecureStore'a kaydet
            await TokenService.setTokens(userData.token, userData.refreshToken);
            
            // User bilgilerini store'a kaydet
            set({
              user: {
                id: userData.id,
                fullName: userData.fullName,
                email: userData.email,
                avatar: userData.avatar,
              },
              accessToken: userData.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Error during login:', error);
            set({ error: error as Error, isLoading: false });
          }
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
                id: 'guest',
                fullName: 'Misafir Kullanıcı',
                email: 'guest@tipbox.co',
                isGuest: true,
              },
              accessToken: null,
            });
          } catch (error) {
            set({ error: error as Error, isLoading: false });
          }
        },
        
        updateUser: (userData: Partial<User>) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          }));
        },
        
        logout: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // Socket bağlantısını kapat
            socketService.disconnect();
            
            // Token'ları SecureStore'dan temizle
            await TokenService.clearTokens();
            
            // Wallet connection bilgisini AsyncStorage'dan temizle
            await WalletService.clearWalletConnection();
            
            await new Promise(resolve => setTimeout(resolve, 500));
            set({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            console.error('Error during logout:', error);
            set({ error: error as Error, isLoading: false });
          }
        },
        
        // Theme Actions
        toggleColorMode: () =>
          set((state) => ({
            colorMode: state.colorMode === 'light' ? 'dark' : 'light',
          })),
        
        setColorMode: (mode: ColorMode) => set({ colorMode: mode }),
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          accessToken: state.accessToken,
          colorMode: state.colorMode,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
