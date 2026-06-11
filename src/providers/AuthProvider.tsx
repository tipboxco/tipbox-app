import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { TokenService } from '@/src/services/TokenService';
import { useAppStore } from '@/src/store/appStore';
import { initializeTokenCache, updateTokenCache, clearTokenCache } from '@/src/services/ApiService/interceptors';

/**
 * Auth Context Type
 */
interface AuthContextType {
  /**
   * Auth durumu hazır mı? (token okundu, auth state belirlendi)
   */
  isAuthReady: boolean;
  /**
   * Kullanıcı authenticated mı?
   */
  isAuthenticated: boolean;
  /**
   * Auth state yükleniyor mu?
   */
  isLoading: boolean;
}

/**
 * Auth Context
 */
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth Provider Component
 * Token okuma ve auth state yönetimi
 * 
 * Performance Optimizations:
 * - Parallel token reads (Promise.all) to reduce blocking time
 * - Memoized context value to prevent unnecessary re-renders
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAppStore();
  
  // PERFORMANCE FIX: Initialization guard - StrictMode'da çift render'ı önler
  // useRef ile initialization flag'i tutuyoruz (re-render'da korunur)
  const initializationRef = useRef(false);
  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // PERFORMANCE FIX: Guard - eğer zaten initialize edildiyse tekrar etme
    if (initializationRef.current) {
      return;
    }

    // Guard flag'ini set et (StrictMode'da 2. render'da bu guard çalışır)
    initializationRef.current = true;

    const initializeAuth = async () => {
      try {
        // Zustand persist, AsyncStorage'dan async olarak rehydrate olur.
        // AuthProvider mount olduğunda bu işlem henüz tamamlanmamış olabilir.
        // Rehydrate bitmeden okursak user: null gelir → token'lar yanlışlıkla silinir.
        if (!useAppStore.persist?.hasHydrated?.()) {
          await new Promise<void>((resolve) => {
            const unsub = useAppStore.persist?.onFinishHydration?.(() => {
              unsub?.();
              resolve();
            });
            // Güvenlik için: 3 saniye içinde hydrate olmazsa devam et
            setTimeout(resolve, 3000);
          });
        }

        // PERFORMANCE FIX: Parallel token reads instead of sequential
        // This reduces blocking time by ~50% (both reads happen simultaneously)
        const [accessToken, refreshToken] = await Promise.all([
          TokenService.getAccessToken(),
          TokenService.getRefreshToken(),
        ]);

        // PERFORMANCE FIX: Initialize token cache for API interceptor
        // This avoids SecureStore reads on every API request
        await initializeTokenCache();

        // AppStore'dan mevcut state'i al (rehydrate tamamlandıktan sonra)
        const appState = useAppStore.getState();

        console.log('[AuthProvider] 🔍 Auth state check:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasUser: !!appState.user,
          userId: appState.user?.id || '(none)',
          isAuthenticated: appState.isAuthenticated,
        });

        // Token varsa ve user bilgileri de varsa, authenticated olarak işaretle
        if (accessToken && refreshToken) {
          // PERFORMANCE FIX: Update token cache
          updateTokenCache(accessToken);

          // Eğer user bilgileri AsyncStorage'da varsa (persist'ten gelmiş), authenticated yap
          if (appState.user && appState.user.id && appState.user.id.length > 0) {
            console.log('[AuthProvider] ✅ Oturum geri yüklendi:', appState.user.id);
            useAppStore.setState({
              isAuthenticated: true,
              accessToken: accessToken,
            });
          } else {
            // Token var ama user yok - token'ları temizle (güvenlik için)
            console.warn('[AuthProvider] ⚠️ Token var ama user yok → token temizleniyor');
            await TokenService.clearTokens();
            clearTokenCache(); // PERFORMANCE FIX: Clear cache
            useAppStore.setState({
              isAuthenticated: false,
              accessToken: null,
              user: null,
            });
          }
        } else {
          // Token yoksa authenticated değil
          console.log('[AuthProvider] ℹ️ Token yok → login ekranı');
          clearTokenCache(); // PERFORMANCE FIX: Clear cache
          useAppStore.setState({
            isAuthenticated: false,
            accessToken: null,
          });
        }
        
        setIsAuthReady(true);
        setIsLoading(false);
      } catch (error) {
        console.error('[AuthProvider] ❌ Auth initialization error:', error);
        setIsAuthReady(true);
        setIsLoading(false);
      }
    };

    // PERFORMANCE FIX: Promise'i ref'te sakla - eğer 2. render olursa aynı promise'i kullan
    if (!initializationPromiseRef.current) {
      initializationPromiseRef.current = initializeAuth();
    }
    
    // Promise tamamlandığında ref'i temizle (cleanup için)
    initializationPromiseRef.current.finally(() => {
      // Promise tamamlandı, ref'i temizle
    });
  }, []);

  // PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  // Only re-render children when actual auth state changes
  const value: AuthContextType = useMemo(
    () => ({
      isAuthReady,
      isAuthenticated,
      isLoading,
    }),
    [isAuthReady, isAuthenticated, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth hook must be used within AuthProvider');
  }

  return context;
};

