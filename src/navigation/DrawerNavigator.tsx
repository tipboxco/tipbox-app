import React, { useCallback } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TabNavigator } from './TabNavigator';
import { DrawerContent } from '@/src/components/CustomDrawer/DrawerContent';
import type { DrawerParamList } from './types/drawer.types';

const Drawer = createDrawerNavigator<DrawerParamList>();

/**
 * AppDrawerNavigator
 * 
 * CRITICAL: Drawer, Tab'lerin DIŞINDA ve ÜSTÜNDE olmalı
 * 
 * Twitter/X Pattern:
 * - Drawer → Tab (DOĞRU)
 * - Tab → Drawer (YANLIŞ - gesture ownership kaybı)
 * 
 * Gesture ownership drawer'da kalır
 * swipeEdgeWidth ile edge swipe kontrolü
 * 
 * PERFORMANCE FIX: DrawerContent memoized, drawerType optimized
 */
export const AppDrawerNavigator = () => {
  // PERFORMANCE FIX: Memoize drawerContent render - gereksiz re-render'ları önle
  const renderDrawerContent = useCallback(
    (props: any) => <DrawerContent {...props} />,
    []
  );

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'slide', // ARCHITECTURE FIX: 'slide' drawer'ı ekranı kaydırarak açar, gesture conflicts'i azaltır
        drawerPosition: 'left',
        overlayColor: 'rgba(0,0,0,0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 25, // ARCHITECTURE FIX: Edge-only swipe (20-30 range) prevents conflicts with horizontal/vertical gestures
        drawerStyle: {
          width: '75%', // Optimal drawer width
          zIndex: 10000, // FIX: Drawer'ın SafeAreaView'in üstünde görünmesi için (SafeAreaView zIndex: 100)
          elevation: 10000, // Android için elevation
        },
        // CRITICAL: Production-grade animation config - Twitter/X hızında
        drawerHideStatusBarOnOpen: false, // Status bar'ı gizleme (titreme önleme)
        keyboardDismissMode: 'on-drag', // Keyboard'u drawer açılırken dismiss et (UX iyileştirmesi)
        // React Navigation DrawerNavigator'ın kendi animasyonu kullanılır
        // Native driver ile optimize edilmiş, hızlı ve smooth
        // drawerType: 'slide' → Drawer ekranı kaydırarak açar, gesture ownership daha net
      }}
      drawerContent={renderDrawerContent}
    >
      <Drawer.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          swipeEnabled: true,
        }}
      />
    </Drawer.Navigator>
  );
};

