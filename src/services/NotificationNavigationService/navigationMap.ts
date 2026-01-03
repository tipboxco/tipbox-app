import type { NotificationType } from '@/src/features/notifications/api/types';
import type { NotificationItemParams } from './index';

/**
 * Navigation Map Configuration
 * 
 * Backend'den gelen NotificationType değerlerini uygulamanın ekranlarıyla eşleştirir.
 * Bu yapı, kodun sürdürülebilirliği için hayati önem taşır.
 * 
 * Her bildirim tipi için:
 * - Hedef ekran
 * - Gerekli parametreler
 * - Fallback davranışı
 */
export interface NavigationMapEntry {
  /** Hedef ekran yolu (nested navigation için) */
  screen: string;
  /** Nested navigation params */
  params?: {
    screen: string;
    params?: {
      screen: string;
      params?: Record<string, any>;
    };
  };
  /** Gerekli parametreler (validation için) */
  requiredParams?: (keyof NotificationItemParams)[];
  /** Fallback ekran (gerekli parametreler yoksa) */
  fallback?: {
    screen: string;
    params?: Record<string, any>;
  };
}

/**
 * Notification Type -> Navigation Map
 * 
 * Tüm bildirim tipleri için navigation yapılandırması
 */
export const NOTIFICATION_NAVIGATION_MAP: Record<NotificationType, NavigationMapEntry> = {
  // Post Etkileşim Bildirimleri
  POST_LIKED: {
    screen: 'Main',
    params: {
      screen: 'Post',
      params: {
        screen: 'PostDetailScreen',
        params: {},
      },
    },
    requiredParams: ['postId'],
  },
  POST_COMMENTED: {
    screen: 'Main',
    params: {
      screen: 'Post',
      params: {
        screen: 'PostDetailScreen',
        params: {},
      },
    },
    requiredParams: ['postId'],
  },
  POST_SHARED: {
    screen: 'Main',
    params: {
      screen: 'Post',
      params: {
        screen: 'PostDetailScreen',
        params: {},
      },
    },
    requiredParams: ['postId'],
  },
  POST_FAVORITED: {
    screen: 'Main',
    params: {
      screen: 'Post',
      params: {
        screen: 'PostDetailScreen',
        params: {},
      },
    },
    requiredParams: ['postId'],
  },

  // Comment Etkileşim Bildirimleri
  COMMENT_LIKED: {
    screen: 'Main',
    params: {
      screen: 'Post',
      params: {
        screen: 'PostDetailScreen',
        params: {},
      },
    },
    requiredParams: ['postId'],
  },
  COMMENT_REPLIED: {
    screen: 'Main',
    params: {
      screen: 'Post',
      params: {
        screen: 'PostDetailScreen',
        params: {},
      },
    },
    requiredParams: ['postId'],
  },

  // Trust & Follow Bildirimleri
  NEW_TRUSTER: {
    screen: 'Main',
    params: {
      screen: 'Profile',
      params: {
        screen: 'ProfileMain',
        params: {},
      },
    },
    requiredParams: ['userId'],
  },
  NEW_TRUSTED_BY: {
    screen: 'Main',
    params: {
      screen: 'Profile',
      params: {
        screen: 'ProfileMain',
        params: {},
      },
    },
    requiredParams: ['userId'],
  },

  // Mesajlaşma Bildirimleri
  NEW_MESSAGE: {
    screen: 'Main',
    params: {
      screen: 'Inbox',
      params: {
        screen: 'MessageDetailScreen',
        params: {},
      },
    },
    requiredParams: ['threadId'],
    fallback: {
      screen: 'Main',
      params: {
        screen: 'Inbox',
        params: {
          screen: 'InboxScreen',
        },
      },
    },
  },
  DM_REQUEST_RECEIVED: {
    screen: 'Main',
    params: {
      screen: 'Inbox',
      params: {
        screen: 'MessageDetailScreen',
        params: {},
      },
    },
    requiredParams: ['threadId'],
    fallback: {
      screen: 'Main',
      params: {
        screen: 'Inbox',
        params: {
          screen: 'InboxScreen',
        },
      },
    },
  },
  DM_REQUEST_ACCEPTED: {
    screen: 'Main',
    params: {
      screen: 'Inbox',
      params: {
        screen: 'MessageDetailScreen',
        params: {},
      },
    },
    requiredParams: ['threadId'],
    fallback: {
      screen: 'Main',
      params: {
        screen: 'Inbox',
        params: {
          screen: 'InboxScreen',
        },
      },
    },
  },

  // Gamification Bildirimleri
  NEW_BADGE: {
    screen: 'Main',
    params: {
      screen: 'Profile',
      params: {
        screen: 'ProfileMain',
        params: {},
      },
    },
  },
  ACHIEVEMENT_UNLOCKED: {
    screen: 'Main',
    params: {
      screen: 'Profile',
      params: {
        screen: 'ProfileMain',
        params: {},
      },
    },
  },
  REWARD_EARNED: {
    screen: 'Main',
    params: {
      screen: 'Wallet',
      params: {
        screen: 'WalletScreen',
      },
    },
  },

  // Expert Request Bildirimleri
  EXPERT_REQUEST_AVAILABLE: {
    screen: 'Main',
    params: {
      screen: 'Inbox',
      params: {
        screen: 'SupportMessageDetail',
        params: {},
      },
    },
    requiredParams: ['requestId'],
    fallback: {
      screen: 'Main',
      params: {
        screen: 'Inbox',
        params: {
          screen: 'InboxScreen',
        },
      },
    },
  },
  EXPERT_REQUEST_ANSWERED: {
    screen: 'Main',
    params: {
      screen: 'Inbox',
      params: {
        screen: 'SupportMessageDetail',
        params: {},
      },
    },
    requiredParams: ['requestId'],
    fallback: {
      screen: 'Main',
      params: {
        screen: 'Inbox',
        params: {
          screen: 'InboxScreen',
        },
      },
    },
  },

  // Sistem Bildirimleri
  SYSTEM_ANNOUNCEMENT: {
    screen: 'Main',
    params: {
      screen: 'Feed',
      params: {
        screen: 'FeedScreen',
      },
    },
  },
  TIPS_RECEIVED: {
    screen: 'Main',
    params: {
      screen: 'Wallet',
      params: {
        screen: 'WalletScreen',
      },
    },
  },
  TIPS_SENT: {
    screen: 'Main',
    params: {
      screen: 'Wallet',
      params: {
        screen: 'WalletScreen',
      },
    },
  },
};

/**
 * Notification type'a göre navigation action oluşturur
 * 
 * @param type - Notification type
 * @param params - Notification params
 * @returns Navigation action veya null
 */
export function createNavigationAction(
  type: NotificationType,
  params: NotificationItemParams
): { screen: string; params?: Record<string, any> } | null {
  const mapEntry = NOTIFICATION_NAVIGATION_MAP[type];

  if (!mapEntry) {
    console.warn('[NavigationMap] Unknown notification type:', type);
    return null;
  }

  // Gerekli parametreleri kontrol et
  if (mapEntry.requiredParams) {
    const missingParams = mapEntry.requiredParams.filter(
      (param) => !params[param]
    );

    if (missingParams.length > 0) {
      console.warn(
        `[NavigationMap] Missing required params for ${type}:`,
        missingParams
      );

      // Fallback varsa onu kullan
      if (mapEntry.fallback) {
        return mapEntry.fallback;
      }

      return null;
    }
  }

  // Navigation action oluştur
  const action: { screen: string; params?: Record<string, any> } = {
    screen: mapEntry.screen,
    params: mapEntry.params,
  };

  // Parametreleri ekle
  if (mapEntry.params?.params?.params) {
    // Deep nested params
    const deepParams = mapEntry.params.params.params;
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof NotificationItemParams];
      if (value !== undefined && value !== null) {
        deepParams[key] = value;
      }
    });
  } else if (mapEntry.params?.params) {
    // Nested params
    const nestedParams = mapEntry.params.params;
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof NotificationItemParams];
      if (value !== undefined && value !== null) {
        if (!nestedParams.params) {
          nestedParams.params = {};
        }
        nestedParams.params[key] = value;
      }
    });
  }

  return action;
}



