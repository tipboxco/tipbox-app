import { NavigatorScreenParams } from '@react-navigation/native';
import { TabParamList } from './tab.types';

/**
 * Drawer Navigator Param List
 * 
 * CRITICAL: Drawer sadece MainTabs'ı içerir
 * Diğer tüm ekranlar RootStack'te (modal/overlay)
 */
export type DrawerParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
};

