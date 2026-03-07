const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Sentry config ile başla (source maps için Debug ID injection)
const config = getSentryExpoConfig(__dirname);

// Socket.IO client için gerekli: mjs, cjs extension'ları ekle
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Node.js spesifik dosyaları block et (React Native'de çalışmaz)
config.resolver.blockList = [
  /.*\.node\.js$/, // .node.js uzantılı dosyalar Node.js'e özgü
];

// react-native-reanimated plugin'ini ekle
config.resolver.plugins = [
  ...(config.resolver.plugins || []),
  'react-native-reanimated/plugin',
];

module.exports = withNativeWind(config, { input: './global.css' });
