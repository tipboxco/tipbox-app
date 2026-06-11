import 'react-i18next';
import common_en from '@/src/locales/en/common.json';
import auth_en from '@/src/locales/en/auth.json';
import wallet_en from '@/src/locales/en/wallet.json';
import feed_en from '@/src/locales/en/feed.json';
import events_en from '@/src/locales/en/events.json';
import settings_en from '@/src/locales/en/settings.json';
import inbox_en from '@/src/locales/en/inbox.json';
import profile_en from '@/src/locales/en/profile.json';
import post_en from '@/src/locales/en/post.json';
import explore_en from '@/src/locales/en/explore.json';
import marketplace_en from '@/src/locales/en/marketplace.json';
import catalog_en from '@/src/locales/en/catalog.json';
import notifications_en from '@/src/locales/en/notifications.json';

// Extend react-i18next module to provide type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common_en;
      auth: typeof auth_en;
      wallet: typeof wallet_en;
      feed: typeof feed_en;
      events: typeof events_en;
      settings: typeof settings_en;
      inbox: typeof inbox_en;
      profile: typeof profile_en;
      post: typeof post_en;
      explore: typeof explore_en;
      marketplace: typeof marketplace_en;
      catalog: typeof catalog_en;
      notifications: typeof notifications_en;
    };
  }
}
