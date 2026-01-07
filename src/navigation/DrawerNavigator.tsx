import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TabNavigator } from './TabNavigator';
import { CustomDrawerContent } from './CustomDrawerContent';
import { useColorMode } from '@/src/hooks/useColorMode';
import type { MainStackParamList } from './types/main.types';

const Drawer = createDrawerNavigator<{ Main: { screen: keyof MainStackParamList } }>();

export const DrawerNavigator = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
  
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ route, navigation }) => {
          // ARCHITECTURE FIX: Dynamic drawer gesture control based on nested stack depth
          // Drawer gesture should be disabled when:
          // 1. Nested stack depth > 0 (detail screens)
          // 2. Modal is open (checked via navigation state)
          const state = navigation.getState();
          const currentRoute = state?.routes[state.index];
          const nestedState = currentRoute?.state;
          const isNested = nestedState && 'index' in nestedState && nestedState.index > 0;
          
          // Check if we're in a detail screen (Post, Profile, MessageDetail, etc.)
          // These screens should disable drawer gesture to prevent conflict with back navigation
          const isDetailScreen = nestedState && 'routes' in nestedState && nestedState.routes && nestedState.routes.length > 0;
          
          return {
            headerShown: false,
            drawerType: 'slide',
            drawerStyle: {
              width: 301,
              backgroundColor: isDark ? '#000000' : '#FFFFFF',
              padding: 0,
              margin: 0,
              borderRightWidth: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              elevation: 0,
              shadowColor: 'transparent',
              overflow: 'hidden',
            },
            drawerHideStatusBarOnOpen: false,
            drawerContentStyle: {
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
              paddingHorizontal: 0,
              paddingVertical: 0,
              margin: 0,
              marginHorizontal: 0,
              marginVertical: 0,
              width: '100%',
              flex: 1,
            },
            drawerActiveTintColor: '#829905',
            drawerInactiveTintColor: isDark ? '#FFFFFF' : '#000000',
            // ARCHITECTURE FIX: Disable drawer gesture on nested screens
            // This prevents drawer gesture from hijacking back navigation intent
            swipeEnabled: !isNested && !isDetailScreen,
            swipeEdgeWidth: 50,
          };
        }}
      >
        <Drawer.Screen
          name="Main"
          component={TabNavigator}
          options={{
            drawerItemStyle: { display: 'none' },
  
            // 🔑 v7: Drawer.Screen düzeyinde contentStyle kullan
            // (v6'daki sceneContainerStyle'ın yerini tutar)
            // TS destekli:
            // @ts-expect-error bazı tip sürümlerinde görünmeyebilir ama v7'de çalışır
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Drawer.Navigator>
    );
  };
  