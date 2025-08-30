const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// react-native-reanimated plugin'ini ekle
config.resolver.plugins = [
  ...(config.resolver.plugins || []),
  'react-native-reanimated/plugin',
];

module.exports = withNativeWind(config, { input: './global.css' });
