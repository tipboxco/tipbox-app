import React from 'react';
import { Box } from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { WebView } from 'react-native-webview';
import { useAppStore } from '@/src/store/appStore';
import { useShallow } from 'zustand/react/shallow';

// Canny URL - Bu URL'i environment variable'dan alabilirsiniz
const CANNY_URL = 'https://canny.io'; // Gerçek Canny URL'inizi buraya ekleyin

export const CannyWebViewScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();

  // Kullanıcı bilgilerini al (Auth için gerekirse)
  const { user } = useAppStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  // Canny URL'ini kullanıcı bilgileriyle oluştur (gerekirse)
  // Örnek: const cannyUrl = `${CANNY_URL}?user=${user?.id}&email=${user?.email}`;
  const cannyUrl = CANNY_URL;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title="Vote New Features"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <Box flex={1}>
          <WebView
            source={{ uri: cannyUrl }}
            style={{ flex: 1 }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            // Auth için kullanıcı bilgilerini inject edebilirsiniz
            injectedJavaScript={user ? `
              // Kullanıcı bilgilerini Canny'ye göndermek için
              // window.postMessage({ type: 'USER_INFO', user: ${JSON.stringify(user)} }, '*');
            ` : undefined}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView HTTP error: ', nativeEvent);
            }}
          />
        </Box>
      </Box>
    </SafeAreaView>
  );
};

export default CannyWebViewScreen;
