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
        drawerType: 'front', // CRITICAL: 'front' drawer'ı ekranın üzerinde overlay olarak açar, ekranı kaydırmaz
        drawerPosition: 'left',
        overlayColor: 'rgba(0,0,0,0.5)',
        swipeEnabled: true,
        swipeEdgeWidth: 50, // CRITICAL: Edge swipe genişliği (default: 32)
        drawerStyle: {
          width: '75%', // Optimal drawer width
        },
        // CRITICAL: Production-grade animation config - Twitter/X hızında
        drawerHideStatusBarOnOpen: false, // Status bar'ı gizleme (titreme önleme)
        keyboardDismissMode: 'on-drag', // Keyboard'u drawer açılırken dismiss et (UX iyileştirmesi)
        // React Navigation DrawerNavigator'ın kendi animasyonu kullanılır
        // Native driver ile optimize edilmiş, hızlı ve smooth
        // drawerType: 'front' → Drawer ekranın üzerinde overlay olarak açılır, ekran yerinde kalır
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

