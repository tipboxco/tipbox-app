import React, { createContext, useContext, useRef, useEffect } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import type { RootStackParamList } from '@/src/navigation/types/root.types';

/**
 * Navigation Context Type
 */
interface NavigationContextType {
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>;
}

/**
 * Navigation Context
 */
const NavigationContext = createContext<NavigationContextType | null>(null);

/**
 * Navigation Provider Props
 */
interface NavigationProviderProps {
  children: React.ReactNode;
}

/**
 * Navigation Provider
 * 
 * Navigation ref'i yönetir ve NavigationService'e bağlar.
 * UI bağlamından bağımsız navigation için merkezi nokta.
 * 
 * Kullanım:
 * ```tsx
 * <NavigationProvider>
 *   <NavigationContainer ref={navigationRef}>
 *     <App />
 *   </NavigationContainer>
 * </NavigationProvider>
 * ```
 */
export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // NavigationService'e ref'i bağla
  useEffect(() => {
    // Type assertion: NavigationService expects non-null ref, but we handle null checks internally
    navigationService.setNavigationRef(navigationRef as React.RefObject<NavigationContainerRef<RootStackParamList>>);
    console.log('[NavigationProvider] ✅ Navigation ref set to NavigationService');
  }, []);

  const value: NavigationContextType = {
    navigationRef: navigationRef as React.RefObject<NavigationContainerRef<RootStackParamList>>,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * useNavigationRef Hook
 * Navigation ref'i kullanmak için hook
 */
export const useNavigationRef = (): React.RefObject<NavigationContainerRef<RootStackParamList>> => {
  const context = useContext(NavigationContext);
  
  if (!context) {
    throw new Error('useNavigationRef must be used within NavigationProvider');
  }
  
  return context.navigationRef;
};

/**
 * Navigation ref export (backward compatibility)
 * NotificationProvider ve diğer servisler için
 */
export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

