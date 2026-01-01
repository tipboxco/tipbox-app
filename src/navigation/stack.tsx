import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types/main.types';

/**
 * Feature Stack Navigator
 * TabNavigator içindeki feature stack'ler için kullanılır
 * 
 * Not: Bu stack sadece feature screens içerir, shared screens YOK
 * Shared screens RootNavigator'da GlobalStackGroup içinde tanımlı
 */
export const Stack = createNativeStackNavigator<MainStackParamList>();

