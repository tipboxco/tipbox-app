import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenService } from '../services/TokenService';
import { WalletService } from '../services/WalletService';
import { ImageCacheService } from '../services/ImageCacheService';
import { updateTokenCache, clearTokenCache } from '../services/ApiService/interceptors';

// PERFORMANCE FIX: Debounced AsyncStorage wrapper to reduce I/O overhead
// Batches multiple writes into single AsyncStorage operation
class DebouncedAsyncStorage {
  private writeQueue: Map<string, string> = new Map();
  private writeTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 300; // 300ms debounce window

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    // Add to queue
    this.writeQueue.set(key, value);

    // Clear existing timeout
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    // Set new timeout
    this.writeTimeout = setTimeout(async () => {
      // Batch write all queued items
      const items = Array.from(this.writeQueue.entries());
      this.writeQueue.clear();

      // Use multiSet for better performance (single I/O operation)
      if (items.length > 0) {
        await AsyncStorage.multiSet(items);
      }

      this.writeTimeout = null;
    }, this.DEBOUNCE_MS);
  }

  async removeItem(key: string): Promise<void> {
    // Remove from queue if pending
    this.writeQueue.delete(key);
    return await AsyncStorage.removeItem(key);
  }
}

const debouncedStorage = new DebouncedAsyncStorage();

// Socket bağlantısı adım adım test edilecek

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
  
  // App State Awareness - Kritik ekranlarda navigation'ı defer etmek için
  isUserBusy: boolean;
  busyReason?: 'form' | 'payment' | 'critical-action' | string;
  
  // Active Thread ID - MessageDetail ekranındayken aktif thread ID'si (notification kontrolü için)
  activeThreadId: string | null;
  
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
  
  // App State Actions
  setUserBusy: (busy: boolean, reason?: string) => void;
  
  // Active Thread Actions
  setActiveThreadId: (threadId: string | null) => void;
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
        
        // Initial App State Awareness
        isUserBusy: false,
        busyReason: undefined,
        
        // Initial Active Thread ID
        activeThreadId: null,
        
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
            const loginStartTime = Date.now();
            set({ isLoading: true, error: null });
            
            console.log('[AppStore] 📋 Login işlemi başlatılıyor...');
            
            // Token'ları SecureStore'a kaydet
            console.log('[AppStore] 📋 Token\'lar SecureStore\'a kaydediliyor...');
            const tokenSaveStartTime = Date.now();
            await TokenService.setTokens(userData.token, userData.refreshToken);
            const tokenSaveTime = Date.now() - tokenSaveStartTime;
            console.log('[AppStore] ✅ Token\'lar kaydedildi');
            console.log('[AppStore]    - Access Token Length:', userData.token.length);
            console.log('[AppStore]    - Refresh Token Length:', userData.refreshToken.length);
            console.log('[AppStore]    - Save Time:', tokenSaveTime, 'ms');
            
            // PERFORMANCE FIX: Update token cache for API interceptor
            updateTokenCache(userData.token);
            
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
            
            const loginTime = Date.now() - loginStartTime;
            console.log('[AppStore] ✅ Login işlemi tamamlandı');
            console.log('[AppStore]    - Total Time:', loginTime, 'ms');
            console.log('[AppStore]    - isAuthenticated: true');
          } catch (error) {
            console.error('[AppStore] ❌ Login hatası:', error);
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
            const logoutStartTime = Date.now();
            console.log('========================================');
            console.log('🚪 LOGOUT İŞLEMİ BAŞLATILIYOR');
            console.log('========================================');
            
            set({ isLoading: true, error: null });
            
            // Token'ları SecureStore'dan temizle
            console.log('📋 Step 1: Token\'lar temizleniyor...');
            const tokenClearStartTime = Date.now();
            await TokenService.clearTokens();
            clearTokenCache(); // PERFORMANCE FIX: Clear token cache
            const tokenClearTime = Date.now() - tokenClearStartTime;
            console.log('✅ Token\'lar temizlendi');
            console.log('   - Clear Time:', tokenClearTime, 'ms');
            
            // Wallet connection bilgisini AsyncStorage'dan temizle
            console.log('📋 Step 2: Wallet bağlantısı temizleniyor...');
            const walletClearStartTime = Date.now();
            await WalletService.clearWalletConnection();
            const walletClearTime = Date.now() - walletClearStartTime;
            console.log('✅ Wallet bağlantısı temizlendi');
            console.log('   - Clear Time:', walletClearTime, 'ms');
            
            // Image cache'i temizle (kullanıcıya özel görselleri kaldırmak için)
            console.log('📋 Step 3: Image cache temizleniyor...');
            const imageCacheClearStartTime = Date.now();
            await ImageCacheService.clearAll();
            const imageCacheClearTime = Date.now() - imageCacheClearStartTime;
            console.log('✅ Image cache temizlendi');
            console.log('   - Clear Time:', imageCacheClearTime, 'ms');
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              isLoading: false,
              error: null,
            });
            
            const logoutTime = Date.now() - logoutStartTime;
            console.log('========================================');
            console.log('✅ LOGOUT İŞLEMİ TAMAMLANDI');
            console.log('========================================');
            console.log('   - Total Time:', logoutTime, 'ms');
            console.log('   - isAuthenticated: false');
            console.log('   - User: null');
            console.log('   - Access Token: null');
            console.log('   - Login ekranı gösterilecek');
            console.log('========================================');
          } catch (error) {
            console.error('❌ Logout hatası:', error);
            set({ error: error as Error, isLoading: false });
          }
        },
        
        // Theme Actions
        toggleColorMode: () =>
          set((state) => ({
            colorMode: state.colorMode === 'light' ? 'dark' : 'light',
          })),
        
        setColorMode: (mode: ColorMode) => set({ colorMode: mode }),
        
        // App State Actions
        setUserBusy: (busy: boolean, reason?: string) => {
          set({
            isUserBusy: busy,
            busyReason: busy ? reason : undefined,
          });
          console.log('[AppStore] 🔒 User busy state:', busy, reason || '');
        },
        
        // Active Thread Actions
        setActiveThreadId: (threadId: string | null) => {
          set({ activeThreadId: threadId });
          console.log('[AppStore] 💬 Active thread ID set:', threadId);
        },
      }),
      {
        name: 'app-storage',
        // PERFORMANCE FIX: Use debounced storage to reduce AsyncStorage I/O
        // Multiple state changes within 300ms are batched into single write
        storage: createJSONStorage(() => debouncedStorage as any),
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
