import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// Suppress Reanimated warnings from @gorhom/bottom-sheet internal scroll operations
// These warnings are harmless and occur when bottom sheet tries to scroll before ref is initialized
LogBox.ignoreLogs([
  '[Reanimated] Tried to dispatch command "scrollTo" with an uninitialized ref',
]);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);