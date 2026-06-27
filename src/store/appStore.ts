import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TokenService } from '../services/TokenService';
import { WalletService } from '../services/WalletService';
import { ImageCacheService } from '../services/ImageCacheService';
import { apiService } from '../services/ApiService';
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
type ColorMode = 'light' | 'dark' | 'system';

interface User {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  isGuest?: boolean;
}

interface SelectedCategory {
  categoryId: string;
  subCategoryIds: string[];
}

interface AppState {
  // Auth State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  user: User | null;
  accessToken: string | null;

  // Wallet State (Web2-Ready)
  walletId: string | null;
  walletIdentifier: string | null;
  walletBalance: number | null;

  // Theme State
  colorMode: ColorMode;

  // App State Awareness - Kritik ekranlarda navigation'ı defer etmek için
  isUserBusy: boolean;
  busyReason?: 'form' | 'payment' | 'critical-action' | string;

  // Active Thread ID - MessageDetail ekranındayken aktif thread ID'si (notification kontrolü için)
  activeThreadId: string | null;

  // Setup Profile State - Route params yerine global state kullanımı
  selectedCategories: SelectedCategory[];
  
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
  
  // Wallet Actions
  setWalletBalance: (balance: number) => void;

  // Setup Profile Actions
  setSelectedCategories: (categories: SelectedCategory[]) => void;
  clearSelectedCategories: () => void;
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
        
        // Initial Wallet State
        walletId: null,
        walletIdentifier: null,
        walletBalance: null,
        
        // Initial Theme State
        colorMode: 'light',
        
        // Initial App State Awareness
        isUserBusy: false,
        busyReason: undefined,
        
        // Initial Active Thread ID
        activeThreadId: null,

        // Initial Setup Profile State
        selectedCategories: [],
        
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
            
            // User bilgilerini store'a kaydet — isAuthenticated burada set edilir
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

            // Wallet oluşturma login akışını bloklamasın: fire-and-forget
            // Bu çağrı başarısız olsa bile isAuthenticated değişmez
            console.log('[AppStore] 📋 Wallet oluşturuluyor (arka planda)...');
            WalletService.createWallet(userData.id)
              .then((wallet) => {
                console.log('[AppStore] ✅ Wallet oluşturuldu:', wallet.walletId);
                set({
                  walletId: wallet.walletId,
                  walletIdentifier: wallet.walletIdentifier,
                });
              })
              .catch((walletError) => {
                console.warn('[AppStore] ⚠️ Wallet oluşturulamadı (login etkilenmez):', walletError?.message);
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
          console.error('🔴 [appStore.logout] ÇAĞRILDI — çağıran: ', new Error().stack?.split('\n')[2]?.trim());

          try {
          } catch (error: any) {
            const hasResponse = Boolean(error?.response);
            if (!hasResponse) {
              set({ isLoading: false, error: error as Error });
              return;
            }
            // Cevap geldi ama non-2xx olabilir; yine de logout akışına devam et
          }

          try {
            // Çıkış request'i sonuçlanmadan kullanıcıyı logout etme
            // UX: bu sırada loading gösterilebilir
            set({ isLoading: true, error: null });

            // ÖNCE: Backend'e logout bildirimi gönder (token'lar temizlenmeden önce)
            // - Eğer server cevap dönerse (2xx veya error response), logout akışına devam edilir
            // - Eğer cevap dönmezse (network error/timeout), logout yapılmaz
          

            // SONRA: State'i güncelle (kullanıcı çıkış görsün)
            set({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              walletId: null,
              walletIdentifier: null,
              walletBalance: null,
              selectedCategories: [],
              isLoading: false,
              error: null,
            });

            // SONRA: Token'ları SecureStore'dan temizle (kritik - güvenlik)
            await TokenService.clearTokens();
            clearTokenCache(); // PERFORMANCE FIX: Clear token cache
            
            // CRITICAL: React Query cache'i temizle (user-specific data)
            // Lazy import to break circular dependency
            try {
              const { queryClient } = require('../providers/QueryProvider');
              queryClient.clear(); // Tüm cache'i temizle (logout sonrası eski kullanıcı verileri görünmemeli)
            } catch (queryError) {
              // QueryClient yüklenemezse silent fail (kritik değil)
              console.warn('[logout] QueryClient clear failed:', queryError);
            }
            
            // ARKA PLANDA: Wallet ve image cache temizleme (await etmeden)
            // Kullanıcı zaten çıkış yaptı, bu işlemler arka planda tamamlanabilir
            Promise.all([
              (async () => {
                try {
                  await WalletService.clearWallet();
                } catch (error) {
                  // Silent fail
                }
              })(),
              (async () => {
                try {
                  await ImageCacheService.clearAll();
                } catch (error) {
                  // Silent fail
                }
              })(),
            ]).catch(() => {
              // Silent fail
            });
          } catch (error) {
            // Hata olsa bile state'i güncelle (kullanıcı çıkış yapmış sayılır)
            set({
              isAuthenticated: false,
              user: null,
              accessToken: null,
              walletId: null,
              walletIdentifier: null,
              walletBalance: null,
              selectedCategories: [],
              isLoading: false,
              error: error as Error,
            });
          }
        },
        
        // Theme Actions
        toggleColorMode: () =>
          set((state) => ({
            colorMode: state.colorMode === 'light' ? 'dark' : state.colorMode === 'dark' ? 'system' : 'light',
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
        
        // Wallet Actions
        setWalletBalance: (balance: number) => {
          set({ walletBalance: balance });
          console.log('[AppStore] 💰 Wallet balance updated:', balance);
        },

        // Setup Profile Actions
        setSelectedCategories: (categories: SelectedCategory[]) => {
          set({ selectedCategories: categories });
          console.log('[AppStore] 📂 Selected categories updated:', categories.length, 'categories');
        },

        clearSelectedCategories: () => {
          set({ selectedCategories: [] });
          console.log('[AppStore] 🗑️ Selected categories cleared');
        },
      }),
      {
        name: 'app-storage',
        // CRITICAL FIX: Temporarily disable DebouncedAsyncStorage to debug infinite loop
        // If this fixes the issue, the problem is in DebouncedAsyncStorage
        storage: createJSONStorage(() => AsyncStorage),
        // storage: createJSONStorage(() => debouncedStorage as any),
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user,
          accessToken: state.accessToken,
          colorMode: state.colorMode,
          walletId: state.walletId,
          walletIdentifier: state.walletIdentifier,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
