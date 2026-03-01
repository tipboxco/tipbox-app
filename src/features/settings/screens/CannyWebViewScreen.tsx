import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Header } from '@/src/components/Header';
import { WebView } from 'react-native-webview';
import { useAppStore } from '@/src/store/appStore';
import { useShallow } from 'zustand/react/shallow';
import { TokenService } from '@/src/services/TokenService';
import type { SettingsStackParamList } from '../navigation';
import { CANNY_CONFIG } from '@/src/config/canny.config';

// Canny URL - Tipbox Canny sayfası (varsayılan)
const DEFAULT_CANNY_URL = 'https://tipbox.canny.io/';

export const CannyWebViewScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SettingsStackParamList, 'CannyWebView'>>();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);

  const params = route.params ?? {};
  const isFeedback = params?.mode === 'feedback';
  const url = params?.url ?? (isFeedback ? CANNY_CONFIG.FEEDBACK_REDIRECT_URL : DEFAULT_CANNY_URL);
  const title = params?.title ?? (isFeedback ? 'Feedback' : 'Vote New Features');

  // Kullanıcı bilgilerini al (Auth için gerekirse)
  const { user } = useAppStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  // Session token'ı yükle (Feedback/redirect için gerekli)
  useEffect(() => {
    const loadToken = async () => {
      const token = await TokenService.getAccessToken();
      setAccessToken(token);
      setIsTokenLoaded(true);
    };
    loadToken();
  }, []);

  const webViewSource = React.useMemo(() => {
    const source: { uri: string; headers?: Record<string, string> } = { uri: url };
    if (accessToken && isFeedback) {
      source.headers = {
        Authorization: `Bearer ${accessToken}`,
      };
    }
    return source;
  }, [url, accessToken, isFeedback]);

  // Feedback modunda token gereklidir; token yoksa hata göster
  const shouldShowWebView = !isFeedback || (isTokenLoaded && accessToken !== null);
  const showAuthError = isFeedback && isTokenLoaded && !accessToken;

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '$backgroundLight0'}>
        <Header
          title={title}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <Box flex={1}>
          {showAuthError ? (
            <Box flex={1} justifyContent="center" alignItems="center" px="$6">
              <Text color={isDark ? '$textDark50' : '$textLight900'} textAlign="center">
                Oturum bulunamadı. Lütfen tekrar giriş yapın.
              </Text>
            </Box>
          ) : !shouldShowWebView ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            </Box>
          ) : (
          <WebView
            source={webViewSource}
            style={{ flex: 1, width: '100%' }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
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
          )}
        </Box>
      </Box>
    </SafeAreaView>
  );
};

export default CannyWebViewScreen;
