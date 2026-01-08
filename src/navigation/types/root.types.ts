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
import { InboxStackParamList } from '@/src/features/inbox/navigation';

/**
 * Root Stack Param List
 * Uygulamanın en üst seviye navigator'ı için type tanımlamaları
 * 
 * Yapı:
 * - Auth: Authentication flow
 * - MainDrawer: Ana uygulama (TabNavigator + Drawer)
 * - Settings: Ayarlar
 * - MoreSchoise: MoreSchoise ekranı
 * - GlobalStackGroup: Deep-dive screens (Post, Profile, Wallet, vb.)
 */
export type RootStackParamList = {
  // Authentication
  Auth: NavigatorScreenParams<AuthStackParamList>;
  
  // Main Application (TabNavigator + Drawer)
  MainDrawer: NavigatorScreenParams<MainStackParamList>;
  
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
  
  // MessageDetail - Inbox'tan bağımsız, global screen
  MessageDetail: {
    messageId: string;
    threadId?: string;
    recipientUserId?: string;
    senderName?: string;
    senderTitle?: string;
    senderAvatar?: any;
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
};

