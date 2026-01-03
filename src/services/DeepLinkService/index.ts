import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { RootStackParamList } from '@/src/navigation/types/root.types';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { TAB_ROUTES } from '@/src/navigation/constants/tabRoutes';

/**
 * Deep Link Service
 * 
 * Advanced deep linking yönetimi:
 * - URL schema parsing (tipboxapp://)
 * - Initial URL handling (killed state)
 * - Notification data parsing
 * - Navigation route mapping (RootStackParamList uyumlu)
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
          // Tab route'a yönlendir (NotificationStack)
          return { screen: TAB_ROUTES.NOTIFICATION, params };

        case 'messages':
        case 'inbox':
          if (parts[1] === 'thread' && parts[2]) {
            // GlobalStackGroup - MessageDetail
            return {
              screen: ROOT_ROUTES.MESSAGE_DETAIL,
              params: {
                messageId: parts[2],
                threadId: parts[2],
                recipientUserId: parts[2],
              },
            };
          }
          // Tab route'a yönlendir (InboxStack)
          return { screen: TAB_ROUTES.INBOX, params };

        case 'posts':
        case 'post':
          if (parts[1]) {
            // GlobalStackGroup - Post
            return {
              screen: ROOT_ROUTES.POST,
              params: {
                screen: 'PostDetailScreen',
                params: {
                  postData: { id: parts[1] },
                  type: 'post',
                },
              },
            };
          }
          // Tab route'a yönlendir (FeedStack)
          return { screen: TAB_ROUTES.FEED, params };

        case 'profile':
        case 'user':
          // GlobalStackGroup - Profile
          if (parts[1] === 'user' && parts[2]) {
            return {
              screen: ROOT_ROUTES.PROFILE,
              params: {
                screen: 'ProfileMain',
                params: {
                  userId: parts[2],
                },
              },
            };
          } else if (parts[1]) {
            return {
              screen: ROOT_ROUTES.PROFILE,
              params: {
                screen: 'ProfileMain',
                params: {
                  userId: parts[1],
                },
              },
            };
          }
          return {
            screen: ROOT_ROUTES.PROFILE,
            params: {
              screen: 'ProfileMain',
              params: {},
            },
          };

        case 'events':
          // Tab route'a yönlendir (EventsStack)
          if (parts[1]) {
            return {
              screen: TAB_ROUTES.EVENTS,
              params: {
                screen: 'EventDetail',
                params: {
                  eventId: parts[1],
                },
              },
            };
          }
          return { screen: TAB_ROUTES.EVENTS, params };

        case 'wallet':
          // GlobalStackGroup - Wallet
          return { screen: ROOT_ROUTES.WALLET, params: { screen: 'WalletScreen' } };

        case 'settings':
          // Root route - Settings
          if (parts[1]) {
            params.tab = parts[1];
          }
          return { screen: ROOT_ROUTES.SETTINGS, params };

        case 'catalog':
          // Tab route'a yönlendir (CatalogStack)
          if (parts[1] === 'brands') {
            // CatalogScreen'e brand view ile navigate et
            return {
              screen: TAB_ROUTES.CATALOG,
              params: {
                screen: 'CatalogScreen',
                params: { view: 'brands' },
              },
            };
          } else if (parts[1] === 'products') {
            // CatalogScreen'e product view ile navigate et
            return {
              screen: TAB_ROUTES.CATALOG,
              params: {
                screen: 'CatalogScreen',
                params: { view: 'products' },
              },
            };
          }
          // Default: CatalogScreen
          return { screen: TAB_ROUTES.CATALOG, params };

        case 'brands':
          // Catalog stack içinde BrandDetailScreen
          if (parts[1]) {
            return {
              screen: TAB_ROUTES.CATALOG,
              params: {
                screen: 'BrandDetailScreen',
                params: { brandId: parts[1] },
              },
            };
          }
          // Brand list view
          return {
            screen: TAB_ROUTES.CATALOG,
            params: {
              screen: 'CatalogScreen',
              params: { view: 'brands' },
            },
          };

        case 'products':
          // Catalog stack içinde BrandProductDetailScreen
          if (parts[1]) {
            return {
              screen: TAB_ROUTES.CATALOG,
              params: {
                screen: 'BrandProductDetailScreen',
                params: { productId: parts[1] },
              },
            };
          }
          // Product list view
          return {
            screen: TAB_ROUTES.CATALOG,
            params: {
              screen: 'CatalogScreen',
              params: { view: 'products' },
            },
          };

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
        
        // Post notification - GlobalStackGroup
        if (metadata.postId) {
          return {
            screen: ROOT_ROUTES.POST,
            params: {
              screen: 'PostDetailScreen',
              params: {
                postData: { id: metadata.postId },
                type: 'post',
              },
            },
          };
        }

        // Message notification - GlobalStackGroup
        if (metadata.threadId) {
          return {
            screen: ROOT_ROUTES.MESSAGE_DETAIL,
            params: {
              messageId: metadata.threadId,
              threadId: metadata.threadId,
              recipientUserId: metadata.userId || metadata.threadId,
            },
          };
        }

        // Profile notification - GlobalStackGroup
        if (metadata.userId) {
          return {
            screen: ROOT_ROUTES.PROFILE,
            params: {
              screen: 'ProfileMain',
              params: { userId: metadata.userId },
            },
          };
        }

        // Event notification - Tab route
        if (metadata.eventId) {
          return {
            screen: TAB_ROUTES.EVENTS,
            params: {
              screen: 'EventDetail',
              params: { eventId: metadata.eventId },
            },
          };
        }
      }

      // 4. Type-based fallback
      if (data.type) {
        const type = data.type as string;
        
        if (type.includes('MESSAGE') || type.includes('DM')) {
          return { screen: TAB_ROUTES.INBOX };
        }
        
        if (type.includes('POST') || type.includes('COMMENT')) {
          return { screen: TAB_ROUTES.FEED };
        }
        
        if (type.includes('TRUST') || type.includes('FOLLOW')) {
          return {
            screen: ROOT_ROUTES.PROFILE,
            params: {
              screen: 'ProfileMain',
              params: { userId: data.userId },
            },
          };
        }
      }

      // Default: Notifications screen (Tab route)
      return { screen: TAB_ROUTES.NOTIFICATION };
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
