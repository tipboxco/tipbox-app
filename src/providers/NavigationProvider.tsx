import React, { createContext, useContext, useRef, useEffect } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { navigationService } from '@/src/services/NavigationService';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
import type { NavigationGuards } from '@/src/services/NavigationService/types';

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

  // NavigationService'e ref'i ve guards'ı bağla
  useEffect(() => {
    // Type assertion: NavigationService expects non-null ref, but we handle null checks internally
    navigationService.setNavigationRef(navigationRef as React.RefObject<NavigationContainerRef<RootStackParamList>>);
    
    // Guards pattern: Store bağımlılığını kaldırmak için
    // NavigationService store'ları bilmez, sadece guard fonksiyonlarını kullanır
    const guards: NavigationGuards = {
      isUserBusy: () => {
        const { useAppStore } = require('@/src/store/appStore');
        return useAppStore.getState().isUserBusy;
      },
      getBusyReason: () => {
        const { useAppStore } = require('@/src/store/appStore');
        return useAppStore.getState().busyReason || null;
      },
      setPendingNavigation: (navigation) => {
        const { useNotificationStore } = require('@/src/store/notificationStore');
        useNotificationStore.getState().setPendingNavigation(navigation);
      },
      getPendingNavigation: () => {
        const { useNotificationStore } = require('@/src/store/notificationStore');
        return useNotificationStore.getState().getPendingNavigation();
      },
    };
    
    navigationService.setGuards(guards);
    
    if (__DEV__) {
    }
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

