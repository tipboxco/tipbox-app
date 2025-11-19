import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { MainNavigator } from './MainNavigator';
import { CustomDrawerContent } from './CustomDrawerContent';
import { useColorMode } from '@/src/hooks/useColorMode';
import { RootStackParamList } from './navigation.types';

const Drawer = createDrawerNavigator<RootStackParamList>();

export const DrawerNavigator = () => {
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
  
    return (
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
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
          swipeEnabled: true,
          swipeEdgeWidth: 50,
        }}
      >
        <Drawer.Screen
          name="Main"
          component={MainNavigator}
          options={{
            drawerItemStyle: { display: 'none' },
  
            // 🔑 v7: Drawer.Screen düzeyinde contentStyle kullan
            // (v6’daki sceneContainerStyle’ın yerini tutar)
            // TS destekli:
            // @ts-expect-error bazı tip sürümlerinde görünmeyebilir ama v7’de çalışır
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Drawer.Navigator>
    );
  };
  