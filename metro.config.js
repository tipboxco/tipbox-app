const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// react-native-reanimated plugin'ini ekle
config.resolver.plugins = [
  ...(config.resolver.plugins || []),
  'react-native-reanimated/plugin',
];

// web-streams-polyfill için resolver ayarları
// web-streams-polyfill 4.x versiyonunda ponyfill/es6 yolu yok, dist/ponyfill.js kullanılıyor
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // web-streams-polyfill/ponyfill/es6 için özel çözümleme (yeni versiyon için)
  if (moduleName === 'web-streams-polyfill/ponyfill/es6') {
    try {
      // Yeni versiyonda dist/ponyfill.js kullanılıyor
      const ponyfillPath = require.resolve('web-streams-polyfill/dist/ponyfill.js');
      return {
        filePath: ponyfillPath,
        type: 'sourceFile',
      };
    } catch (error) {
      // Fallback: varsayılan çözümlemeyi kullan
    }
  }
  // Varsayılan çözümlemeyi kullan
  if (defaultResolver) {
    return defaultResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
