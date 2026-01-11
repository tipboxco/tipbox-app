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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { GoogleUser, GoogleAuthResult, GoogleServiceState } from './types';

// WebBrowser'ı tamamlandığında kapat
WebBrowser.maybeCompleteAuthSession();

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

      // Expo Google provider ile OAuth akışını başlat
      const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: this.getClientIdForPlatform(),
        scopes: ['openid', 'profile', 'email'],
        redirectUri: this.getRedirectUri(),
      });

      // OAuth akışını başlat
      const result = await promptAsync();

      // Kullanıcı iptal ettiyse
      if (result.type === 'cancel' || result.type === 'dismiss') {
        throw new Error('Google girişi kullanıcı tarafından iptal edildi');
      }

      // Hata durumu
      if (result.type === 'error') {
        throw new Error(result.error?.message || 'Google girişi sırasında bir hata oluştu');
      }

      // Başarılı - ID token'ı al
      if (result.type === 'success' && result.params?.id_token) {
        const idToken = result.params.id_token;
        const accessToken = result.params.access_token;

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
          accessToken: accessToken,
          user,
        };
      }

      throw new Error('Google girişi başarısız: ID token alınamadı');
    } catch (error) {
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
    const { FIREBASE_WEB_CLIENT_ID } = require('@env');
    
    if (!FIREBASE_WEB_CLIENT_ID) {
      throw new Error(
        'FIREBASE_WEB_CLIENT_ID environment variable tanımlı değil. ' +
        'Firebase Console > Authentication > Sign-in method > Google > Web SDK configuration\'dan alın.'
      );
    }

    return FIREBASE_WEB_CLIENT_ID;
  }

  /**
   * Redirect URI'yi döndür
   */
  private getRedirectUri(): string {
    // Expo için redirect URI
    return `${Platform.OS === 'web' ? window.location.origin : 'tipboxapp://'}`;
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
