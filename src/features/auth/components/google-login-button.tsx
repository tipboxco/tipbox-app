import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ButtonText, HStack, Icon, useToast } from '@gluestack-ui/themed';
import { Mail } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { API_CONFIG } from '@/src/config/api.config';
import { showCustomToast } from '@/src/components/CustomToast';
import { apiService } from '@/src/services/ApiService';
import { useAppStore } from '@/src/store/appStore';

// iOS için gerekli
WebBrowser.maybeCompleteAuthSession();

type GoogleAuthCallbackPayload = {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  fullName?: string | null;
  avatar?: string | null;
};

type Auth0MobileUrlsResponse = {
  urls?: {
    google?: string;
    login?: string;
    logout?: string;
    status?: string;
  };
  baseUrl?: string;
  host?: string;
};

export type GoogleLoginButtonProps = {
  redirectPath?: string;
  buttonText?: string;
};

export function GoogleLoginButton({
  redirectPath = 'auth/callback',
  buttonText = 'Continue with Google',
}: GoogleLoginButtonProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // openAuthSessionAsync + Linking event aynı callback'i iki kez tetikleyebilir
  const hasHandledCallbackRef = useRef(false);

  const redirectUri = useMemo(() => Linking.createURL(redirectPath), [redirectPath]);

  const parseGoogleAuthCallbackUrl = (url: string): GoogleAuthCallbackPayload | null => {
    try {
      const parsed = Linking.parse(url);
      const qp = (parsed?.queryParams || {}) as Record<string, unknown>;

      const token =
        (typeof qp.token === 'string' ? qp.token : undefined) ?? url.match(/token=([^&]+)/)?.[1];

      const refreshToken =
        (typeof qp.refreshToken === 'string' ? qp.refreshToken : undefined) ??
        url.match(/refreshToken=([^&]+)/)?.[1];

      const userId =
        (typeof qp.userId === 'string' ? qp.userId : undefined) ??
        url.match(/userId=([^&]+)/)?.[1];

      const email =
        (typeof qp.email === 'string' ? qp.email : undefined) ?? url.match(/email=([^&]+)/)?.[1];

      const fullName =
        (typeof qp.fullName === 'string' ? qp.fullName : undefined) ??
        url.match(/fullName=([^&]+)/)?.[1];

      const avatar =
        (typeof qp.avatar === 'string' ? qp.avatar : undefined) ?? url.match(/avatar=([^&]+)/)?.[1];

      if (!token || !refreshToken || !userId || !email) return null;

      return {
        token: decodeURIComponent(token),
        refreshToken: decodeURIComponent(refreshToken),
        userId: decodeURIComponent(userId),
        email: decodeURIComponent(email),
        fullName: fullName ? decodeURIComponent(fullName) : null,
        avatar: avatar ? decodeURIComponent(avatar) : null,
      };
    } catch (error) {
      console.error('[GoogleLoginButton] ❌ Failed to parse callback URL:', error);
      return null;
    }
  };

  const handleCallbackUrl = async (url: string) => {
    try {
      if (hasHandledCallbackRef.current) return;

      const payload = parseGoogleAuthCallbackUrl(url);
      if (!payload) {
        showCustomToast(toast, {
          title: 'Google Login Failed',
          description: 'Token/refreshToken veya kullanıcı bilgileri alınamadı.',
          action: 'error',
          duration: 4000,
        });
        return;
      }

      if (__DEV__) {
        console.log('[GoogleLoginButton] ✅ Auth callback payload:', {
          userId: payload.userId,
          email: payload.email,
          hasToken: !!payload.token,
          hasRefreshToken: !!payload.refreshToken,
        });
      }

      await useAppStore.getState().login({
        id: payload.userId,
        fullName: payload.fullName || payload.email.split('@')[0] || 'Kullanıcı',
        email: payload.email,
        avatar: payload.avatar || undefined,
        token: payload.token,
        refreshToken: payload.refreshToken,
      });

      hasHandledCallbackRef.current = true;

      showCustomToast(toast, {
        title: 'Google ile başarıyla giriş yapıldı!',
        action: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('[GoogleLoginButton] ❌ Google login error:', error);

      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        'Google ile giriş yapılırken bir hata oluştu';

      showCustomToast(toast, {
        title: 'Google Login Failed',
        description: errorMessage,
        action: 'error',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startGoogleLogin = async () => {
    try {
      setIsLoading(true);
      hasHandledCallbackRef.current = false;

      // (Opsiyonel ama önerilir) Backend'den URL'leri al: /auth0/mobile/urls
      // Backend redirect_url parametresi ile tam URL'yi üretir.
      let authUrl = `${API_CONFIG.BASE_URL}/auth0/mobile/google?redirect_url=${encodeURIComponent(redirectUri)}`;

      try {
        const { data } = await apiService
          .getClient()
          .get<Auth0MobileUrlsResponse>('/auth0/mobile/urls', {
            params: { redirect_url: redirectUri },
          });

        if (data?.urls?.google) authUrl = data.urls.google;

        if (__DEV__) {
          console.log('[GoogleLoginButton] 🔗 Auth0 mobile URLs:', data);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn(
            '[GoogleLoginButton] ⚠️ Failed to fetch /auth0/mobile/urls, using fallback:',
            error
          );
        }
      }

      if (__DEV__) {
        console.log('[GoogleLoginButton] 🔐 Starting Google login:', {
          authUrl,
          redirectUri,
        });
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (__DEV__) {
        console.log('[GoogleLoginButton] 📱 WebBrowser result:', result);
      }

      if (result.type === 'success' && result.url) {
        await handleCallbackUrl(result.url);
        return;
      }

      if (result.type === 'cancel') {
        setIsLoading(false);
        return;
      }

      showCustomToast(toast, {
        title: 'Google Login Failed',
        description: 'Giriş işlemi tamamlanamadı.',
        action: 'error',
        duration: 4000,
      });
      setIsLoading(false);
    } catch (error: any) {
      console.error('[GoogleLoginButton] ❌ Failed to start Google login:', error);

      const errorMessage = error?.message || 'Google ile giriş yapılırken bir hata oluştu';
      showCustomToast(toast, {
        title: 'Google Login Failed',
        description: errorMessage,
        action: 'error',
        duration: 4000,
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      const { url } = event;

      if (__DEV__) {
        console.log('[GoogleLoginButton] 🔗 Linking URL event:', url);
      }

      if (url && (url.includes(redirectPath) || url.includes('token='))) {
        handleCallbackUrl(url).catch((error) => {
          console.error('[GoogleLoginButton] ❌ Failed to handle callback URL:', error);
        });
      }
    });

    return () => subscription.remove();
  }, [redirectPath]);

  return (
    <Button
      variant="outline"
      h={44}
      rounded="$lg"
      borderColor="$gray400"
      borderWidth={1}
      onPress={startGoogleLogin}
      isDisabled={isLoading}
      opacity={isLoading ? 0.5 : 1}
    >
      <HStack space="md" alignItems="center">
        <Icon as={Mail} size="md" color="$textLight600" />
        <ButtonText color="$textLight600" fontWeight="$bold">
          {isLoading ? 'Signing in...' : buttonText}
        </ButtonText>
      </HStack>
    </Button>
  );
}

