import { NavigatorScreenParams } from '@react-navigation/native';
import { AuthStackParamList } from '@/src/features/auth/navigation';
import { SettingsStackParamList } from '@/src/features/settings/navigation';
import { MoreSchoiseStackParamList } from '@/src/features/moreSchoise/navigation';
import { MainStackParamList } from './main.types';
import { ProfileStackParamList } from '@/src/features/profile/navigation';
import { PostStackParamList } from '@/src/features/post/navigation';
import { WalletStackParamList } from '@/src/features/wallet/navigation';
import { BookmarksStackParamList } from '@/src/features/bookmarks/navigation';
import { MarketplaceStackParamList } from '@/src/features/marketplace/navigation';
import { EventStackParamList } from '@/src/features/events/EventNavigator';
import { NewsStackParamList } from '@/src/features/catalog/NewsNavigator';
import { InboxStackParamList } from '@/src/features/inbox/navigation';
import { DrawerParamList } from './drawer.types';

/**
 * Root Stack Param List
 * Uygulamanın en üst seviye navigator'ı için type tanımlamaları
 * 
 * ARCHITECTURE CHANGE: MainDrawer kaldırıldı, MainTabs eklendi.
 * Drawer artık custom overlay olarak NavigationContainer dışında render edilir.
 * 
 * Yapı:
 * - Auth: Authentication flow
 * - MainTabs: Ana uygulama (TabNavigator)
 * - Modal Screens: Settings, MoreSchoise
 * - Overlay Screens: Post, Profile, Wallet, Bookmarks, Marketplace, MessageDetail
 */
export type RootStackParamList = {
  // Authentication
  Auth: NavigatorScreenParams<AuthStackParamList>;
  
  // Main Application - AppDrawerNavigator (Drawer → Tab hierarchy)
  App: NavigatorScreenParams<DrawerParamList>;
  
  // Settings & MoreSchoise
  Settings: NavigatorScreenParams<SettingsStackParamList>;
  MoreSchoise: NavigatorScreenParams<MoreSchoiseStackParamList>;
  
  // GlobalStackGroup - Deep-Dive Screens
  // Bu ekranlar hangi tab açık olursa olsun Root'tan açılır
  Post: NavigatorScreenParams<PostStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Wallet: NavigatorScreenParams<WalletStackParamList>;
  Bookmarks: NavigatorScreenParams<BookmarksStackParamList>;
  Marketplace: NavigatorScreenParams<MarketplaceStackParamList>;
  Event: NavigatorScreenParams<EventStackParamList>;
  News: NavigatorScreenParams<NewsStackParamList>;
  
  // MessageDetail - Inbox'tan bağımsız, global screen
  MessageDetail: {
    messageId: string;
    threadId?: string;
    recipientUserId?: string;
    senderName?: string;
    senderTitle?: string;
    senderAvatar?: any;
    openSendTips?: boolean; // Send tips bottom sheet'i açılsın mı?
  };
  
  // SupportMessageDetail - Expert request için
  SupportMessageDetail: {
    requestId?: string;
    threadId?: string | null;
    expertName: string;
    expertTitle: string;
    expertAvatar: any;
    userName?: string;
    userTitle?: string;
    userAvatar?: any;
    recipientUserId?: string;
    status?: 'pending' | 'active' | 'awaiting_completion' | 'completed' | 'finalized' | 'reported';
  };
  
  // CollectionDetail - Collection detail screen (accessible from Profile, Events, etc.)
  CollectionDetail: {
    collectionId: string;
  };

  // ProductCatalog - Standalone product catalog screen (inventory FAB)
  ProductCatalog: undefined;

  // ProductSelect - Global product selection screen
  ProductSelect: {
    returnScreen?: string;
    eventId?: string;
    eventType?: string;
    experienceOption?: 'own' | 'tried';
    /** Benchmark: hangi form alanına yazılacak (selectedProduct1 | selectedProduct2) */
    selectedProductField?: 'selectedProduct1' | 'selectedProduct2';
    /** Benchmark: dönüşte korunacak ilk ürün */
    initialProduct?: { id: string; name: string; brand?: string; subName?: string; image: any; productGroupId?: string };
    /** Benchmark: product group filtreleme (sadece aynı product group'taki ürünleri göster) */
    productGroupFilter?: string;
  };

};

