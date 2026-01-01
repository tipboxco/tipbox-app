import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * Deep Link Service
 * 
 * Advanced deep linking yönetimi:
 * - URL schema parsing (tipboxapp://)
 * - Initial URL handling (killed state)
 * - Notification data parsing
 * - Navigation route mapping
 */
class DeepLinkService {
  private scheme: string = 'tipboxapp';
  private prefix: string;

  constructor() {
    this.prefix = `${this.scheme}://`;
  }

  /**
   * Initial URL'yi al (killed state için)
   * App killed state'den açıldığında notification'dan gelen URL'yi yakalar
   */
  async getInitialURL(): Promise<string | null> {
    try {
      const url = await Linking.getInitialURL();
      if (url && url.startsWith(this.prefix)) {
        console.log('[DeepLinkService] 📱 Initial URL:', url);
        return url;
      }
      return null;
    } catch (error) {
      console.error('[DeepLinkService] ❌ Error getting initial URL:', error);
      return null;
    }
  }

  /**
   * URL change listener ekle (foreground state için)
   */
  addURLListener(callback: (url: string) => void): () => void {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url && url.startsWith(this.prefix)) {
        console.log('[DeepLinkService] 📱 URL changed:', url);
        callback(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }

  /**
   * URL'yi parse et ve route bilgisine dönüştür
   * 
   * URL Format: tipboxapp://<screen>/<params>
   * 
   * Örnekler:
   * - tipboxapp://notifications/123
   * - tipboxapp://messages/thread/456
   * - tipboxapp://posts/789
   * - tipboxapp://profile/user/123
   */
  parseURL(url: string): { screen: string; params?: Record<string, any> } | null {
    try {
      if (!url.startsWith(this.prefix)) {
        return null;
      }

      const path = url.replace(this.prefix, '');
      const parts = path.split('/').filter(Boolean);

      if (parts.length === 0) {
        return { screen: 'Home' };
      }

      const screen = parts[0];
      const params: Record<string, any> = {};

      // Route mapping - screen name'e göre params parse et
      switch (screen) {
        case 'notifications':
          if (parts[1]) {
            params.notificationId = parts[1];
          }
          return { screen: 'Notifications', params };

        case 'messages':
        case 'inbox':
          if (parts[1] === 'thread' && parts[2]) {
            return {
              screen: 'MessageDetail',
              params: {
                threadId: parts[2],
                recipientUserId: parts[2], // Fallback
              },
            };
          }
          return { screen: 'Inbox', params };

        case 'posts':
        case 'post':
          if (parts[1]) {
            return {
              screen: 'PostDetail',
              params: {
                postId: parts[1],
              },
            };
          }
          return { screen: 'Feed', params };

        case 'profile':
        case 'user':
          if (parts[1] === 'user' && parts[2]) {
            return {
              screen: 'Profile',
              params: {
                userId: parts[2],
              },
            };
          } else if (parts[1]) {
            return {
              screen: 'Profile',
              params: {
                userId: parts[1],
              },
            };
          }
          return { screen: 'Profile', params };

        case 'events':
          if (parts[1]) {
            return {
              screen: 'EventDetail',
              params: {
                eventId: parts[1],
              },
            };
          }
          return { screen: 'Events', params };

        case 'wallet':
          return { screen: 'Wallet', params };

        case 'settings':
          if (parts[1]) {
            params.tab = parts[1];
          }
          return { screen: 'Settings', params };

        default:
          // Fallback: screen name olarak kullan
          return { screen: screen.charAt(0).toUpperCase() + screen.slice(1), params };
      }
    } catch (error) {
      console.error('[DeepLinkService] ❌ Error parsing URL:', error);
      return null;
    }
  }

  /**
   * Notification data'dan route oluştur
   * 
   * Notification data formatı:
   * {
   *   navigation: {
   *     screen: 'PostDetail',
   *     params: { postId: '123' }
   *   }
   * }
   * 
   * Veya URL formatı:
   * {
   *   url: 'tipboxapp://posts/123'
   * }
   */
  parseNotificationData(data: Record<string, any>): { screen: string; params?: Record<string, any> } | null {
    try {
      // 1. Direct navigation data (öncelikli)
      if (data.navigation && data.navigation.screen) {
        return {
          screen: data.navigation.screen,
          params: data.navigation.params || {},
        };
      }

      // 2. URL formatı
      if (data.url && typeof data.url === 'string') {
        return this.parseURL(data.url);
      }

      // 3. Metadata'dan route oluştur (fallback)
      if (data.metadata) {
        const metadata = data.metadata;
        
        // Post notification
        if (metadata.postId) {
          return {
            screen: 'PostDetail',
            params: { postId: metadata.postId },
          };
        }

        // Message notification
        if (metadata.threadId) {
          return {
            screen: 'MessageDetail',
            params: {
              threadId: metadata.threadId,
              recipientUserId: metadata.userId || metadata.threadId,
            },
          };
        }

        // Profile notification
        if (metadata.userId) {
          return {
            screen: 'Profile',
            params: { userId: metadata.userId },
          };
        }

        // Event notification
        if (metadata.eventId) {
          return {
            screen: 'EventDetail',
            params: { eventId: metadata.eventId },
          };
        }
      }

      // 4. Type-based fallback
      if (data.type) {
        const type = data.type as string;
        
        if (type.includes('MESSAGE') || type.includes('DM')) {
          return { screen: 'Inbox' };
        }
        
        if (type.includes('POST') || type.includes('COMMENT')) {
          return { screen: 'Feed' };
        }
        
        if (type.includes('TRUST') || type.includes('FOLLOW')) {
          return { screen: 'Profile', params: { userId: data.userId } };
        }
      }

      // Default: Notifications screen
      return { screen: 'Notifications' };
    } catch (error) {
      console.error('[DeepLinkService] ❌ Error parsing notification data:', error);
      return null;
    }
  }

  /**
   * URL oluştur (test için veya programatik deep link oluşturma)
   */
  createURL(screen: string, params?: Record<string, any>): string {
    const base = `${this.prefix}${screen.toLowerCase()}`;
    
    if (!params || Object.keys(params).length === 0) {
      return base;
    }

    // Basit params ekleme (query string yerine path-based)
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}/${value}`)
      .join('/');

    return `${base}/${paramString}`;
  }
}

export const deepLinkService = new DeepLinkService();
