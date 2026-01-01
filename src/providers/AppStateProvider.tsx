import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * App State Type
 */
type AppStateType = 'active' | 'background' | 'inactive';

/**
 * App State Context Type
 */
interface AppStateContextType {
  /**
   * Mevcut app state
   */
  appState: AppStateType;
  /**
   * Uygulama foreground'da mı?
   */
  isForeground: boolean;
  /**
   * Uygulama background'da mı?
   */
  isBackground: boolean;
}

/**
 * App State Context
 */
const AppStateContext = createContext<AppStateContextType | null>(null);

/**
 * App State Provider Props
 */
interface AppStateProviderProps {
  children: React.ReactNode;
}

/**
 * App State Provider Component
 * 
 * Sorumlulukları:
 * - AppState değişikliklerini dinleme (foreground/background/inactive)
 * - AppState bilgisini context'e sağlama
 * 
 * Bu context AuthContext'ten sonra, NotificationContext ve SocketContext'ten önce olmalı çünkü:
 * - SocketContext appState foreground olduğunda bağlanmalı
 * - NotificationContext appState'e göre davranış değiştirebilir
 */
export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [appState, setAppState] = useState<AppStateType>('active');
  const [isForeground, setIsForeground] = useState(true);
  const [isBackground, setIsBackground] = useState(false);
  // Ref ile appState'i takip et - listener callback'inde doğru değeri görmek için
  const appStateRef = useRef<AppStateType>('active');

  useEffect(() => {
    console.log('[AppStateProvider] ========================================');
    console.log('[AppStateProvider] 📱 App State Provider Initialized');
    console.log('[AppStateProvider] ========================================');

    // İlk app state'i al
    const currentState = AppState.currentState;
    const normalizedState = normalizeAppState(currentState);
    setAppState(normalizedState);
    appStateRef.current = normalizedState;
    setIsForeground(normalizedState === 'active');
    setIsBackground(normalizedState === 'background');

    console.log('[AppStateProvider] ✅ Initial App State:', normalizedState);

    // AppState değişikliklerini dinle
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      const normalizedNextState = normalizeAppState(nextAppState);
      const previousState = appStateRef.current; // Ref'ten önceki state'i al
      
      console.log('[AppStateProvider] ========================================');
      console.log('[AppStateProvider] 🔄 App State Changed');
      console.log('[AppStateProvider] ========================================');
      console.log('[AppStateProvider]    - Previous:', previousState);
      console.log('[AppStateProvider]    - Current:', normalizedNextState);
      
      setAppState(normalizedNextState);
      appStateRef.current = normalizedNextState; // Ref'i güncelle
      setIsForeground(normalizedNextState === 'active');
      setIsBackground(normalizedNextState === 'background');
      
      console.log('[AppStateProvider]    - isForeground:', normalizedNextState === 'active');
      console.log('[AppStateProvider]    - isBackground:', normalizedNextState === 'background');
      console.log('[AppStateProvider] ========================================');
    });

    return () => {
      subscription.remove();
      console.log('[AppStateProvider] 🧹 App State Provider Cleaned Up');
    };
  }, []);

  const value: AppStateContextType = {
    appState,
    isForeground,
    isBackground,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

/**
 * AppStateStatus'u AppStateType'a normalize et
 */
function normalizeAppState(state: AppStateStatus): AppStateType {
  if (state === 'active') {
    return 'active';
  } else if (state === 'background') {
    return 'background';
  } else {
    return 'inactive';
  }
}

/**
 * useAppState Hook
 * App state context'ini kullanmak için hook
 */
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error('useAppState hook must be used within AppStateProvider');
  }

  return context;
};

