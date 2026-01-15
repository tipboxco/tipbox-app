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
    'https://auth.expo.io', // Expo OAuth proxy için
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
      // Main Application - AppDrawerNavigator (Drawer → Tab hierarchy)
      App: {
        screens: {
          MainTabs: {
            screens: {
              // Feed Tab - ARCHITECTURE FIX: FeedStack is now a Tab.Screen that uses FeedNavigator
              FeedStack: 'feed',
              // Explore Tab
              ExploreStack: {
                screens: {
                  Explore: {
                    screens: {
                      ExploreScreen: 'explore',
                    },
                  },
                },
              },
              // Catalog Tab
              CatalogStack: {
                screens: {
                  Catalog: {
                    screens: {
                      CatalogScreen: 'catalog',
                    },
                  },
                },
              },
              // Events Tab
              EventsStack: {
                screens: {
                  Events: {
                    screens: {
                      EventsScreen: 'events',
                    },
                  },
                },
              },
              // Notification Tab
              NotificationStack: {
                screens: {
                  Notification: {
                    screens: {
                      NotificationsScreen: 'notifications',
                    },
                  },
                },
              },
              // Inbox Tab
              InboxStack: {
                screens: {
                  Inbox: {
                    screens: {
                      InboxScreen: 'inbox',
                    },
                  },
                },
              },
            },
          },
        },
      },
      // Root Level Detail Screens - Direct access from RootStack
      // CRITICAL: These screens are at RootStack level, not under Main/App
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
      Bookmarks: {
        screens: {
          BookMarksScreen: 'bookmarks',
        },
      },
      Marketplace: {
        screens: {
          MarketPlaceScreen: 'marketplace',
        },
      },
      Wallet: {
        screens: {
          WalletScreen: 'wallet',
        },
      },
      Event: {
        screens: {
          EventDetailScreen: {
            path: 'event/:eventId',
            parse: {
              eventId: (eventId: string) => eventId,
            },
          },
        },
      },
      MessageDetail: {
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
      // Modal Screens
      Settings: {
        screens: {
          SettingsScreen: 'settings',
        },
      },
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







