import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerNavigator } from './DrawerNavigator';
import { navigationRef, navigate } from '@/src/providers/NotificationProvider';
import { deepLinkService } from '@/src/services/DeepLinkService';
import { linkingConfig } from './linking.config';

const Navigation = () => {
  // Initial URL handling (killed state)
  // Not: React Navigation'ın linking config'i zaten initial URL'i handle ediyor,
  // burada sadece fallback olarak manuel handling yapıyoruz
  useEffect(() => {
    const handleInitialURL = async () => {
      const url = await deepLinkService.getInitialURL();
      if (url) {
        const route = deepLinkService.parseURL(url);
        if (route) {
          // Navigation ref hazır olana kadar bekle
          const navigateWithDelay = () => {
            if (navigationRef.current) {
              navigate(route.screen, route.params);
              console.log('[Navigation] ✅ Initial deep link navigated:', route);
            } else {
              setTimeout(navigateWithDelay, 500);
            }
          };
          navigateWithDelay();
        }
      }
    };

    handleInitialURL();
  }, []);

  // URL change listener (foreground state)
  useEffect(() => {
    const removeListener = deepLinkService.addURLListener((url) => {
      const route = deepLinkService.parseURL(url);
      if (route) {
        navigate(route.screen, route.params);
        console.log('[Navigation] ✅ Deep link navigated:', route);
      }
    });

    return removeListener;
  }, []);

  return (
    <NavigationContainer 
      ref={navigationRef} 
      linking={linkingConfig}
      onReady={() => {
        console.log('[Navigation] ✅ NavigationContainer is ready');
      }}
    >
      <DrawerNavigator />
    </NavigationContainer>
  );
};

export default Navigation;