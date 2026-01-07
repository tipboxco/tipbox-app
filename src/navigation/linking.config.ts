import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './navigation.types';

/**
 * Deep Linking Configuration
 * 
 * React Navigation için deep linking yapılandırması.
 * Uygulama kapalıyken (killed state) bildirimlere tıklandığında
 * doğru ekrana yönlendirme yapar.
 * 
 * URL Format: tipboxapp://<screen>/<params>
 * 
 * Örnekler:
 * - tipboxapp://post/123 -> PostDetailScreen (postId: 123)
 * - tipboxapp://user/456 -> ProfileScreen (userId: 456)
 * - tipboxapp://notifications -> NotificationsScreen
 * - tipboxapp://inbox/thread/789 -> MessageDetailScreen (threadId: 789)
 */
export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'tipboxapp://',
    'https://tipbox.app',
    'https://*.tipbox.app',
  ],
  config: {
    screens: {
      // Root level screens
      Auth: {
        screens: {
          Welcome: 'welcome',
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          VerifyCode: 'verify-code',
          ResetPassword: 'reset-password',
          SetupProfile: 'setup-profile',
          SelectCategories: 'select-categories',
        },
      },
      Main: {
        screens: {
          // Feed Tab
          Feed: {
            screens: {
              FeedScreen: 'feed',
            },
          },
          // Explore Tab
          Explore: {
            screens: {
              ExploreScreen: 'explore',
            },
          },
          // Catalog Tab
          Catalog: {
            screens: {
              CatalogScreen: 'catalog',
            },
          },
          // Events Tab
          Events: {
            screens: {
              EventsScreen: 'events',
              EventDetailScreen: {
                path: 'event/:eventId',
                parse: {
                  eventId: (eventId: string) => eventId,
                },
              },
            },
          },
          // Notification Tab
          Notification: {
            screens: {
              NotificationsScreen: 'notifications',
            },
          },
          // Inbox Tab
          Inbox: {
            screens: {
              InboxScreen: 'inbox',
              MessageDetailScreen: {
                path: 'inbox/thread/:threadId',
                parse: {
                  threadId: (threadId: string) => threadId,
                },
              },
              SupportMessageDetail: {
                path: 'inbox/support/:requestId',
                parse: {
                  requestId: (requestId: string) => requestId,
                },
              },
            },
          },
          // Profile Tab
          Profile: {
            screens: {
              ProfileMain: {
                path: 'user/:userId?',
                parse: {
                  userId: (userId: string) => userId || undefined,
                },
              },
            },
          },
          // Post Stack (Shared)
          Post: {
            screens: {
              PostDetailScreen: {
                path: 'post/:postId',
                parse: {
                  postId: (postId: string) => postId,
                  commentId: (commentId: string) => commentId || undefined,
                },
              },
            },
          },
          // Bookmarks Tab
          Bookmarks: {
            screens: {
              BookmarksScreen: 'bookmarks',
            },
          },
          // Marketplace Tab
          Marketplace: {
            screens: {
              MarketPlaceScreen: 'marketplace',
            },
          },
          // Wallet Tab
          Wallet: {
            screens: {
              WalletScreen: 'wallet',
            },
          },
        },
      },
      // Settings Stack
      Settings: {
        screens: {
          SettingsScreen: 'settings',
        },
      },
      // MoreSchoise Stack
      MoreSchoise: {
        screens: {
          MoreSchoiseScreen: 'more-schoise',
        },
      },
    },
  },
  // Initial route name (optional)
  // initialRouteName: 'Main',
};





