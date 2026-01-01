import React, { createContext, useContext, useEffect, useState } from 'react';
import { TokenService } from '@/src/services/TokenService';
import { useAppStore } from '@/src/store/appStore';

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
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAppStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = await TokenService.getAccessToken();
        setIsAuthReady(true);
        setIsLoading(false);
      } catch (error) {
        console.error('[AuthProvider] Auth initialization error:', error);
        setIsAuthReady(true);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    isAuthReady,
    isAuthenticated,
    isLoading,
  };

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

