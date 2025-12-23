const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// socket.io-client için source extensions ekle
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// Node.js modüllerini exclude et (React Native'de çalışmaz)
config.resolver.blockList = [
  /node_modules\/xmlhttprequest-ssl\/lib\/XMLHttpRequest\.js$/,
  /node_modules\/engine\.io-client\/build\/esm\/transports\/polling-xhr\.node\.js$/,
];

// react-native-reanimated plugin'ini ekle
config.resolver.plugins = [
  ...(config.resolver.plugins || []),
  'react-native-reanimated/plugin',
];

// web-streams-polyfill için resolver ayarları
// web-streams-polyfill 4.x versiyonunda ponyfill/es6 yolu yok, dist/ponyfill.js kullanılıyor
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // xmlhttprequest-ssl yerine browser fetch kullan (Node.js modülü)
  if (moduleName === 'xmlhttprequest-ssl' || moduleName === 'xmlhttprequest-ssl/lib/XMLHttpRequest') {
    return {
      type: 'empty',
    };
  }

  // polling-xhr.node.js yerine polling-xhr.js kullan (browser versiyonu)
  if (moduleName === './transports/polling-xhr.node.js') {
    try {
      const pollingXhrPath = require.resolve('engine.io-client/build/esm/transports/polling-xhr.js');
      return {
        filePath: pollingXhrPath,
        type: 'sourceFile',
      };
    } catch (error) {
      // Fallback: varsayılan çözümlemeyi kullan
    }
  }

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

  // socket.io-client / engine.io-client için resolver ayarları
  // engine.io-client/build/esm/contrib/parseuri.js dosyasını çözümle
  if (moduleName === './contrib/parseuri.js') {
    try {
      // Relative path'ten absolute path'e çevir
      const parseUriPath = require.resolve('engine.io-client/build/esm/contrib/parseuri.js');
      return {
        filePath: parseUriPath,
        type: 'sourceFile',
      };
    } catch (error) {
      // Fallback: varsayılan çözümlemeyi kullan
    }
  }

  // engine.io-client için diğer relative import'ları çözümle
  if (moduleName.startsWith('./') && context.originModulePath && context.originModulePath.includes('engine.io-client')) {
    try {
      const path = require('path');
      const fs = require('fs');
      const originDir = path.dirname(context.originModulePath);
      const resolvedPath = path.resolve(originDir, moduleName);
      if (fs.existsSync(resolvedPath)) {
        return {
          filePath: resolvedPath,
          type: 'sourceFile',
        };
      }
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
