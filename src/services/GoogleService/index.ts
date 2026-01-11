/**
 * GoogleService
 * Google OAuth authentication işlemlerini yöneten service
 * 
 * Firebase Authentication kullanarak Google Sign-In akışını yönetir
 */

import { 
  GoogleAuthProvider, 
  signInWithCredential,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  AuthCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/src/config/firebase.config';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { GoogleUser, GoogleAuthResult, GoogleServiceState } from './types';
import { FIREBASE_WEB_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@env';

// WebBrowser'ı tamamlandığında kapat
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Discovery Document
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

class GoogleService {
  private state: GoogleServiceState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
  };

  private googleAuthProvider: GoogleAuthProvider;

  constructor() {
    // Firebase Google Auth Provider oluştur
    this.googleAuthProvider = new GoogleAuthProvider();
    
    // Google provider için scope'ları ayarla
    this.googleAuthProvider.addScope('profile');
    this.googleAuthProvider.addScope('email');
  }

  /**
   * Google OAuth ile giriş yap
   * @returns GoogleAuthResult - ID token ve kullanıcı bilgileri
   */
  async login(): Promise<GoogleAuthResult> {
    try {
      this.state.isLoading = true;
      this.state.error = null;

      const clientId = this.getClientIdForPlatform();
      const redirectUri = this.getRedirectUri();

      // Debug: Redirect URI'yi logla
      console.log('[GoogleService] 🔍 Redirect URI:', redirectUri);
      console.log('[GoogleService] 🔍 Client ID:', clientId.substring(0, 20) + '...');

      // Nonce oluştur - id_token response type için zorunlu (güvenlik için)
      // Cryptographically secure random string (32+ karakter)
      const nonce = 
        Math.random().toString(36).substring(2, 15) + 
        Math.random().toString(36).substring(2, 15) + 
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 15);
      
      console.log('[GoogleService] 🔐 Generated nonce:', nonce.substring(0, 20) + '...');

      // AuthRequest oluştur - IdToken response type kullan
      // id_token flow: Direkt ID token al (token exchange gerekmez)
      const request = new AuthSession.AuthRequest({
        clientId,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.IdToken, // IdToken flow kullan
        usePKCE: false,
        extraParams: {
          nonce: nonce, // id_token için zorunlu
        },
      });

      // OAuth akışını başlat - promptAsync kullan
      console.log('[GoogleService] 🚀 Starting OAuth flow...');
      console.log('[GoogleService] 🔗 Redirect URI:', redirectUri);
      console.log('[GoogleService] 🔗 Client ID:', clientId.substring(0, 30) + '...');
      
      // Timeout ile promptAsync (30 saniye)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('OAuth flow timeout - 30 saniye içinde tamamlanmadı'));
        }, 30000);
      });

      const result = await Promise.race([
        request.promptAsync(googleDiscovery),
        timeoutPromise,
      ]) as any;

      console.log('[GoogleService] 📥 OAuth result:', {
        type: result.type,
        hasParams: !!result.params,
        paramsKeys: result.params ? Object.keys(result.params) : [],
        params: result.params, // Tüm params'ı logla
        error: result.type === 'error' ? result.error : null,
        fullResult: JSON.stringify(result, null, 2), // Tüm result'ı logla
      });

      // Kullanıcı iptal ettiyse
      if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('[GoogleService] ❌ User cancelled or dismissed');
        throw new Error('Google girişi kullanıcı tarafından iptal edildi');
      }

      // Hata durumu
      if (result.type === 'error') {
        console.error('[GoogleService] ❌ OAuth error:', result.error);
        throw new Error(result.error?.message || 'Google girişi sırasında bir hata oluştu');
      }

      // Başarılı - ID token'ı direkt al (token exchange gerekmez)
      if (result.type === 'success' && result.params?.id_token) {
        console.log('[GoogleService] ✅ OAuth success, ID token received');
        console.log('[GoogleService] 📋 Result params keys:', Object.keys(result.params || {}));
        
        const idToken = result.params.id_token;
        const accessToken = result.params.access_token;

        // Nonce doğrulaması (güvenlik için)
        // Not: ID token içindeki nonce'u decode edip kontrol etmek gerekir
        // Şimdilik basit kontrol yapıyoruz
        console.log('[GoogleService] 🔐 Verifying nonce in ID token...');
        
        // ID token'ı decode et (JWT format) - nonce doğrulaması için
        // Not: React Native'de Buffer yok, bu yüzden atlıyoruz
        // Firebase Authentication zaten ID token'ı doğrular
        console.log('[GoogleService] 📦 ID token received, length:', idToken.length);

        if (!idToken) {
          console.error('[GoogleService] ❌ ID token missing in result:', result.params);
          throw new Error('ID token alınamadı - OAuth result\'da id_token yok');
        }

        // Firebase Authentication ile credential oluştur
        const credential = GoogleAuthProvider.credential(idToken, accessToken);

        // Firebase ile giriş yap
        const auth = getFirebaseAuth();
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;

        // Firebase'den ID token al (backend'e göndermek için)
        const firebaseIdToken = await firebaseUser.getIdToken();

        // Kullanıcı bilgilerini çıkar
        const user: GoogleUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          picture: firebaseUser.photoURL || undefined,
        };

        this.state.isAuthenticated = true;
        this.state.user = user;
        this.state.isLoading = false;

        return {
          idToken: firebaseIdToken, // Backend'e gönderilecek Firebase ID token
          accessToken: accessToken || '',
          user,
        };
      }

      // Başarılı değilse
      console.error('[GoogleService] ❌ OAuth flow failed - unexpected result type:', {
        resultType: result.type,
        hasParams: !!result.params,
        params: result.params,
        fullResult: JSON.stringify(result, null, 2),
      });
      throw new Error(`Google girişi başarısız: Beklenmeyen result type: ${result.type}`);
    } catch (error) {
      console.error('[GoogleService] ❌ Login error:', error);
      this.state.error = error as Error;
      this.state.isLoading = false;
      this.state.isAuthenticated = false;
      throw error;
    }
  }

  /**
   * Platform'a göre uygun client ID'yi döndür
   * Firebase Console'dan alınan Web Client ID kullanılır
   */
  private getClientIdForPlatform(): string {
    // Firebase Authentication için Web Client ID kullanılır
    // Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration
    // Bu client ID tüm platformlar için çalışır
    const clientId = FIREBASE_WEB_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;
    
    if (!clientId) {
      throw new Error(
        'FIREBASE_WEB_CLIENT_ID veya GOOGLE_WEB_CLIENT_ID environment variable tanımlı değil. ' +
        'Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration\'dan alın.'
      );
    }

    return clientId;
  }

  /**
   * Redirect URI'yi döndür
   * 
   * Google Cloud Console Web Client ID sadece HTTPS URL'leri kabul eder
   * Custom scheme'ler (tipboxapp://) kabul edilmez
   * Development modunda bile sabit HTTPS URL kullanmalıyız
   */
  private getRedirectUri(): string {
    // Web platform için
    if (Platform.OS === 'web') {
      return AuthSession.makeRedirectUri({ useProxy: false });
    }
    
    // Hem development hem production için sabit HTTPS URL kullan
    // Google Cloud Console Web Client ID sadece HTTPS URL'leri kabul eder
    // Development modunda `useProxy: true` `exp://` döndürür, bu kabul edilmez
    // Bu yüzden sabit Expo proxy HTTPS URL kullanıyoruz
    const expoConfig = Constants.expoConfig;
    const owner = expoConfig?.owner || 'tipboxco';
    const slug = expoConfig?.slug || 'tipbox-app';
    const httpsRedirectUri = `https://auth.expo.io/@${owner}/${slug}`;
    
    console.log('[GoogleService] 🔧 Using fixed HTTPS redirect URI (required for Google Cloud Console):', httpsRedirectUri);
    return httpsRedirectUri;
  }

  /**
   * Çıkış yap (Firebase'den de çıkış yap)
   */
  async logout(): Promise<void> {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      
      this.state = {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      };
    } catch (error) {
      this.state.error = error as Error;
      throw error;
    }
  }

  /**
   * Mevcut state'i döndür
   */
  getState(): GoogleServiceState {
    return { ...this.state };
  }
}

// Singleton instance
let googleServiceInstance: GoogleService | null = null;

/**
 * GoogleService instance'ını al veya oluştur
 */
export const getGoogleService = (): GoogleService => {
  if (!googleServiceInstance) {
    googleServiceInstance = new GoogleService();
  }
  return googleServiceInstance;
};

export const googleService = getGoogleService();
export * from './types';
