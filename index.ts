import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

// Sentry'yi en başta başlat (error tracking için)
import { initSentry } from './src/config/sentry.config';
initSentry();

import App from './App';

// Suppress warnings
LogBox.ignoreLogs([
  // Reanimated warnings from @gorhom/bottom-sheet internal scroll operations
  // These warnings are harmless and occur when bottom sheet tries to scroll before ref is initialized
  '[Reanimated] Tried to dispatch command "scrollTo" with an uninitialized ref',
  // SafeAreaView deprecated warning - Proje zaten react-native-safe-area-context kullanıyor
  // Bu uyarı muhtemelen bir third-party dependency'den geliyor
  'SafeAreaView has been deprecated',
  // Expo Notifications Expo Go limitation - Development build kullanılıyor, bu uyarı sadece Expo Go için geçerli
  'expo-notifications: Android Push notifications',
  'expo-notifications',
  'functionality is not fully supported in Expo Go',
  // Sentry warnings - Development'ta Sentry devre dışı olduğu için bu uyarılar önemsiz
  '[Sentry]',
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);