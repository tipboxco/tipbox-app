/**
 * Firebase Configuration
 * Firebase projesi için config ayarları
 * 
 * Environment variables'dan Firebase config bilgilerini alır
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  FIREBASE_API_KEY, 
  FIREBASE_AUTH_DOMAIN, 
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID 
} from '@env';

/**
 * Firebase config object
 * Firebase Console'dan alınan config değerleri
 */
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

// Firebase app instance'ı (singleton pattern)
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

/**
 * Firebase app instance'ını al veya oluştur
 */
export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    const apps = getApps();
    if (apps.length === 0) {
      firebaseApp = initializeApp(firebaseConfig);
    } else {
      firebaseApp = apps[0];
    }
  }
  return firebaseApp;
};

/**
 * Firebase Auth instance'ını al veya oluştur
 */
export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    const app = getFirebaseApp();
    firebaseAuth = getAuth(app);
  }
  return firebaseAuth;
};

/**
 * Firebase config'in doğru yapılandırıldığını kontrol et
 */
export const validateFirebaseConfig = (): boolean => {
  const requiredFields = [
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
  ];

  const missingFields = requiredFields.filter((field) => !field);

  if (missingFields.length > 0) {
    console.warn('[FirebaseConfig] ⚠️ Bazı Firebase config değerleri eksik:', {
      missingFields: missingFields.length,
    });
    return false;
  }

  return true;
};
