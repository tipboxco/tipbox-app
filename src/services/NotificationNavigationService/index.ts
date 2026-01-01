import type { Notification, NotificationType, NotificationMetadata } from '@/src/features/notifications/api/types';
import { navigationRef } from '@/src/providers/NotificationProvider';
import { CommonActions } from '@react-navigation/native';
import { getPostDetail, type PostDetailResponse } from '@/src/features/post/api/postApi';
import { getFeed } from '@/src/features/feed/api/feedApi';
import { toImageSource } from '@/src/utils';
import type { PostCardData } from '@/src/types/PostCard';
import { ProductInfoType } from '@/src/types/common';

/**
 * NotificationItem - Her notification type için gerekli parametreleri ve navigation bilgisini içerir
 */
export interface NotificationItem {
  // Notification bilgileri
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  
  // Navigation için gerekli parametreler (type'a göre değişir)
  params: NotificationItemParams;
}

/**
 * NotificationItemParams - Notification type'a göre farklı parametreler
 */
export interface NotificationItemParams {
  // Post ile ilgili bildirimler için
  postId?: string;
  commentId?: string;
  
  // User/Profile ile ilgili bildirimler için
  userId?: string;
  
  // Mesaj ile ilgili bildirimler için
  threadId?: string;
  messageId?: string;
  
  // Expert Request ile ilgili bildirimler için
  requestId?: string;
  
  // Badge/Achievement ile ilgili bildirimler için
  badgeId?: string;
  achievementId?: string;
  
  // Event ile ilgili bildirimler için
  eventId?: string;
  
  // Wallet/Tips ile ilgili bildirimler için
  amount?: number;
  
  // Metadata'dan gelen ek bilgiler
  userName?: string;
  userAvatar?: string;
  userTitle?: string;
  expertName?: string;
  expertTitle?: string;
  expertAvatar?: string;
}

/**
 * Notification Navigation Service
 * 
 * NotificationItem'dan navigation action oluşturur ve navigate eder.
 */
export class NotificationNavigationService {
  /**
   * Notification'dan NotificationItem oluşturur
   * 
   * @param notification - Notification objesi
   * @returns NotificationItem
   */
  static createNotificationItem(notification: Notification): NotificationItem {
    // Backend'den artık navigation objesi gelmiyor, sadece metadata (data) içinde ID'ler var
    // Tüm ID'leri metadata'dan alıyoruz
    const params: NotificationItemParams = {
      // Post parametreleri - metadata'dan al
      postId: notification.metadata?.postId,
      commentId: notification.metadata?.commentId,
      
      // User parametreleri - metadata'dan al
      userId: notification.metadata?.userId,
      
      // Message parametreleri - metadata'dan al
      threadId: notification.metadata?.threadId,
      messageId: notification.metadata?.threadId, // threadId aynı zamanda messageId olarak kullanılabilir
      
      // Request parametreleri - metadata'dan al
      requestId: notification.metadata?.requestId,
      
      // Badge/Achievement parametreleri - metadata'dan al
      badgeId: notification.metadata?.badgeId,
      achievementId: notification.metadata?.achievementId,
      
      // Event parametreleri - metadata'dan al
      eventId: notification.metadata?.eventId,
      
      // Amount parametreleri - metadata'dan al
      amount: notification.metadata?.amount,
      
      // User metadata - metadata'dan al
      userName: notification.metadata?.userName,
      userAvatar: notification.metadata?.userAvatar,
      userTitle: notification.metadata?.userTitle,
      expertName: notification.metadata?.expertName,
      expertTitle: notification.metadata?.expertTitle,
      expertAvatar: notification.metadata?.expertAvatar,
    };

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      params,
    };
  }

  /**
   * NotificationItem'dan navigation action oluşturur
   * 
   * @param item - NotificationItem
   * @returns Navigation action veya null
   */
  static getNavigationAction(item: NotificationItem): { screen: string; params?: Record<string, any> } | null {
    const { type, params } = item;

    switch (type) {
      // Post ile ilgili bildirimler -> PostDetailScreen
      case 'POST_LIKED':
      case 'POST_COMMENTED':
      case 'POST_SHARED':
      case 'POST_FAVORITED':
        if (params.postId) {
          // PostDetailScreen'e navigate et (postId ile post fetch edilecek)
          // navigate() fonksiyonunda post fetch edilecek
          return {
            screen: 'Main',
            params: {
              screen: 'Post',
              params: {
                screen: 'PostDetailScreen',
                params: { 
                  postId: params.postId, // postId geçiliyor, navigate()'de fetch edilecek
                },
              },
            },
          };
        }
        return null;

      // Comment ile ilgili bildirimler -> PostDetailScreen (comment'e scroll)
      case 'COMMENT_LIKED':
      case 'COMMENT_REPLIED':
        if (params.postId) {
          // PostDetailScreen'e navigate et (postId ile post fetch edilecek)
          return {
            screen: 'Main',
            params: {
              screen: 'Post',
              params: {
                screen: 'PostDetailScreen',
                params: {
                  postId: params.postId, // postId geçiliyor, navigate()'de fetch edilecek
                  commentId: params.commentId,
                },
              },
            },
          };
        }
        return null;

      // Mesaj bildirimleri -> MessageDetailScreen
      case 'NEW_MESSAGE':
      case 'DM_REQUEST_RECEIVED':
      case 'DM_REQUEST_ACCEPTED':
        // threadId metadata'dan alınır (backend'den data.threadId olarak gelir)
        const threadId = params.threadId || params.messageId;
        // senderId metadata.userId olarak map edilir (backend'den data.senderId -> metadata.userId)
        // Backend'den gelen data.senderId, notificationsApi.ts'de metadata.userId olarak map ediliyor
        const senderId = params.userId; // metadata.userId = data.senderId
        const senderName = params.userName || 'Kullanıcı';
        const senderTitle = params.userTitle || '';
        const senderAvatar = params.userAvatar || null;
        
        if (threadId && senderId) {
          return {
            screen: 'Main',
            params: {
              screen: 'Inbox', // MainStackParamList'teki Inbox (buildFeatureStack wrapper içindeki screen)
              params: {
                screen: 'MessageDetailScreen', // InboxNavigator içindeki screen
                params: {
                  messageId: threadId, // MessageDetailScreen threadId'yi messageId olarak kullanıyor
                  recipientUserId: senderId, // Mesaj gönderilecek kullanıcı ID'si (senderId)
                  senderName: senderName,
                  senderTitle: senderTitle,
                  senderAvatar: senderAvatar,
                },
              },
            },
          };
        }
        // ThreadId veya senderId yoksa InboxScreen'e git
        return {
          screen: 'Main',
          params: {
            screen: 'Inbox', // MainStackParamList'teki Inbox
            params: {
              screen: 'InboxScreen', // InboxNavigator içindeki screen
            },
          },
        };

      // Trust bildirimleri -> ProfileScreen
      case 'NEW_TRUSTER':
      case 'NEW_TRUSTED_BY':
        if (params.userId) {
          return {
            screen: 'Main',
            params: {
              screen: 'Profile',
              params: {
                screen: 'ProfileMain',
                params: { userId: params.userId },
              },
            },
          };
        }
        return null;

      // Badge/Achievement bildirimleri -> ProfileScreen (badges section)
      case 'NEW_BADGE':
      case 'ACHIEVEMENT_UNLOCKED':
        return {
          screen: 'Main',
          params: {
            screen: 'Profile',
            params: {
              screen: 'ProfileMain',
              params: {
                userId: params.userId, // Kendi profili için undefined
              },
            },
          },
        };

      // TIPS bildirimleri -> WalletScreen
      case 'TIPS_RECEIVED':
      case 'TIPS_SENT':
      case 'REWARD_EARNED':
        return {
          screen: 'Main',
          params: {
            screen: 'Wallet',
            params: {
              screen: 'WalletScreen',
            },
          },
        };

      // Expert Request bildirimleri -> SupportMessageDetail
      case 'EXPERT_REQUEST_AVAILABLE':
      case 'EXPERT_REQUEST_ANSWERED':
        if (params.requestId || params.threadId) {
          return {
            screen: 'Main',
            params: {
              screen: 'Inbox',
              params: {
                screen: 'SupportMessageDetail',
                params: {
                  requestId: params.requestId || params.threadId,
                  recipientUserId: params.userId,
                  expertName: params.expertName || params.userName || 'Uzman',
                  expertTitle: params.expertTitle || params.userTitle || '',
                  expertAvatar: params.expertAvatar || params.userAvatar || null,
                },
              },
            },
          };
        }
        return {
          screen: 'Main',
          params: {
            screen: 'Inbox',
            params: {
              screen: 'InboxScreen',
            },
          },
        };

      // System Announcement -> FeedScreen
      case 'SYSTEM_ANNOUNCEMENT':
        return {
          screen: 'Main',
          params: {
            screen: 'Feed', // MainStackParamList'teki Feed
            params: {
              screen: 'FeedScreen', // FeedNavigator içindeki screen
            },
          },
        };

      // Event bildirimleri -> EventDetail veya EventsScreen
      case 'EVENT_STARTED':
      case 'EVENT_ENDING_SOON':
      case 'EVENT_COMPLETED':
      case 'EVENT_REWARD_AVAILABLE':
        if (params.eventId) {
          return {
            screen: 'Main',
            params: {
              screen: 'Events', // MainStackParamList'teki Events
              params: {
                screen: 'EventDetail', // EventsNavigator içindeki screen
                params: {
                  eventId: params.eventId,
                },
              },
            },
          };
        }
        // EventId yoksa EventsScreen'e git
        return {
          screen: 'Main',
          params: {
            screen: 'Events', // MainStackParamList'teki Events
            params: {
              screen: 'EventsScreen', // EventsNavigator içindeki screen
            },
          },
        };

      default:
        console.warn('[NotificationNavigationService] Unknown notification type:', type);
        return null;
    }
  }

  /**
   * Notification'a tıklandığında navigate eder
   * PostId varsa post'u fetch edip postData ile navigate eder
   * 
   * @param notification - Notification objesi
   * @returns Promise<boolean> - Başarılı olursa true
   */
  static async navigate(notification: Notification): Promise<boolean> {
    try {
      console.log('[NotificationNavigationService] 🚀 Starting navigation for notification:', notification.id);
      console.log('[NotificationNavigationService] 📋 Notification type:', notification.type);
      console.log('[NotificationNavigationService] 📋 Notification metadata (data):', notification.metadata);
      // Backend'den artık navigation objesi gelmiyor, sadece metadata (data) içinde ID'ler var

      // 1. Ready Check (Retry Mekanizması ile) - Race condition'ı önlemek için
      let retryCount = 0;
      const maxRetries = 10;
      const retryDelay = 200; // 200ms

      while ((!navigationRef.current || !navigationRef.current.isReady()) && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`[NotificationNavigationService] ⏳ Waiting for navigation to be ready... (${retryCount}/${maxRetries})`);
        }
      }

      if (!navigationRef.current) {
        console.error('[NotificationNavigationService] ❌ Navigation ref is not ready after retries. NavigationContainer may not be mounted yet.');
        return false;
      }

      if (!navigationRef.current.isReady()) {
        console.error('[NotificationNavigationService] ❌ NavigationContainer is not ready after 2 seconds.');
        return false;
      }

      console.log('[NotificationNavigationService] ✅ Navigation is ready, proceeding with navigation');

      // Notification'dan NotificationItem oluştur
      const item = this.createNotificationItem(notification);
      console.log('[NotificationNavigationService] 📦 Created NotificationItem:', {
        type: item.type,
        params: item.params,
      });
      
      // Navigation action oluştur
      let navigationAction = this.getNavigationAction(item);
      console.log('[NotificationNavigationService] 🎯 Initial navigation action:', navigationAction);

      if (!navigationAction) {
        console.warn('[NotificationNavigationService] No navigation action found for notification:', notification.id);
        return false;
      }

      // PostDetailScreen'e navigate edilecekse ve postId varsa, post'u fetch et
      // Navigation action Main -> Post -> PostDetailScreen formatında olmalı
      if (
        navigationAction.screen === 'Main' &&
        navigationAction.params?.screen === 'Post' &&
        navigationAction.params.params?.screen === 'PostDetailScreen' &&
        navigationAction.params.params.params?.postId
      ) {
        const postId = navigationAction.params.params.params.postId;
        const commentId = navigationAction.params.params.params.commentId;

        console.log('[NotificationNavigationService] 📥 PostId found:', postId);
        if (commentId) {
          console.log('[NotificationNavigationService] 💬 CommentId found:', commentId);
        }

        try {
          console.log('[NotificationNavigationService] 📥 Fetching post data for postId:', postId);
          const postDetailResponse = await getPostDetail(postId);
          console.log('[NotificationNavigationService] ✅ Post data fetched:', {
            id: postDetailResponse.id,
            contextType: postDetailResponse.contextType,
          });
          
          // PostDetailResponse'ı PostCardData formatına dönüştür
          const postCardData: PostCardData = {
            id: postDetailResponse.id,
            user: {
              id: postDetailResponse.user.id,
              name: postDetailResponse.user.name,
              title: postDetailResponse.user.title,
              avatar: toImageSource(postDetailResponse.user.avatar) || require('@/assets/avatar/ozan.png'),
            },
            content: postDetailResponse.content,
            images: postDetailResponse.images
              ?.map((img) => toImageSource(img))
              .filter((img): img is NonNullable<typeof img> => !!img) || [],
            stats: postDetailResponse.stats,
            createdAt: postDetailResponse.createdAt,
            contextType: postDetailResponse.contextType 
              ? (postDetailResponse.contextType === 'product' ? ProductInfoType.PRODUCT :
                 postDetailResponse.contextType === 'product_group' ? ProductInfoType.PRODUCT_GROUP :
                 postDetailResponse.contextType === 'sub_category' ? ProductInfoType.SUB_CATEGORY :
                 ProductInfoType.PRODUCT)
              : undefined,
            contextData: postDetailResponse.contextData ? {
              id: postDetailResponse.contextData.id,
              name: postDetailResponse.contextData.name,
              subName: postDetailResponse.contextData.subName,
              image: postDetailResponse.contextData.image,
              isOwned: postDetailResponse.contextData.isOwned || false,
            } : undefined,
          };

          // Post type'ını belirle (Backend'den type gelmiyorsa default 'post')
          // contextType'a göre de belirlenebilir ama şimdilik 'post' kullanıyoruz
          const postType = postDetailResponse.type === 'tipsAndTricks' ? 'tipsAndTricks' :
                          postDetailResponse.type === 'question' ? 'question' :
                          postDetailResponse.type === 'benchmark' ? 'benchmark' :
                          postDetailResponse.type === 'experience' ? 'experience' :
                          postDetailResponse.type === 'update' ? 'update' :
                          'post';

          // Navigation action'ı postCardData ile güncelle (Main -> Post -> PostDetailScreen formatında)
          navigationAction = {
            screen: 'Main',
            params: {
              screen: 'Post',
              params: {
                screen: 'PostDetailScreen',
                params: {
                  postData: postCardData,
                  type: postType,
                  // commentId varsa ekle (comment'e scroll için)
                  ...(commentId && { commentId }),
                },
              },
            },
          };
          
          console.log('[NotificationNavigationService] ✅ Post data fetched and converted successfully, updated navigation action');
        } catch (error) {
          const status = (error as any)?.response?.status;
          const is404 = status === 404;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // 404 hatası - Post silinmiş veya bulunamıyor olabilir
          if (is404) {
            console.warn('[NotificationNavigationService] ⚠️ Post not found (404):', {
              postId,
              status: 404,
              note: 'Post may have been deleted or does not exist',
            });
          } else {
            console.error('[NotificationNavigationService] ❌ Failed to fetch post data:', {
              postId,
              status,
              message: errorMessage,
            });
          }
          
          // Post fetch başarısız olursa Feed'den post'u bulmayı dene
          try {
            console.log('[NotificationNavigationService] 🔍 Trying to find post in feed as fallback...');
            const feedData = await getFeed(undefined, 50); // İlk 50 post'u al
            
            // Feed'de post'u ara
            const foundPost = feedData.items.find(
              (item) => item.data.id === postId
            );
            
            if (foundPost) {
              console.log('[NotificationNavigationService] ✅ Post found in feed! Using feed data.');
              const postData = foundPost.data;
              
              // Post type'ını belirle
              const postType = postData.type === 'tipsAndTricks' ? 'tipsAndTricks' :
                              postData.type === 'question' ? 'question' :
                              postData.type === 'benchmark' ? 'benchmark' :
                              postData.type === 'experience' ? 'experience' :
                              postData.type === 'update' ? 'update' :
                              'post';

              // Navigation action'ı postData ile güncelle
              navigationAction = {
                screen: 'Main',
                params: {
                  screen: 'Post',
                  params: {
                    screen: 'PostDetailScreen',
                    params: {
                      postData: postData,
                      type: postType,
                      ...(commentId && { commentId }),
                    },
                  },
                },
              };
              console.log('[NotificationNavigationService] ✅ Post data from feed, navigating to PostDetailScreen');
            } else {
              console.warn('[NotificationNavigationService] ⚠️ Post not found in feed, redirecting to FeedScreen', {
                postId,
                feedItemCount: feedData.items.length,
                note: 'Post may have been deleted or is not in the first 50 feed items',
              });
              // Post feed'de de yoksa FeedScreen'e yönlendir
              navigationAction = {
                screen: 'Main',
                params: {
                  screen: 'Feed', // MainStackParamList'teki Feed
                  params: {
                    screen: 'FeedScreen', // FeedNavigator içindeki screen
                    params: { highlightPostId: postId },
                  },
                },
              };
            }
          } catch (feedError) {
            console.error('[NotificationNavigationService] ❌ Failed to fetch feed:', {
              error: feedError instanceof Error ? feedError.message : 'Unknown error',
              postId,
            });
            // Feed fetch de başarısız olursa FeedScreen'e yönlendir
            navigationAction = {
              screen: 'Main',
              params: {
                screen: 'Feed', // MainStackParamList'teki Feed
                params: {
                  screen: 'FeedScreen', // FeedNavigator içindeki screen
                  params: { highlightPostId: postId },
                },
              },
            };
            console.log('[NotificationNavigationService] 🔄 Final fallback to FeedScreen with postId:', postId);
          }
        }
      } else {
        console.log('[NotificationNavigationService] ℹ️ Not a PostDetailScreen navigation or postId not found');
      }

      // Navigate et
      console.log('[NotificationNavigationService] 🎬 Final navigation action:', JSON.stringify(navigationAction, null, 2));
      
      // NavigationContainer hazır mı tekrar kontrol et (fetch işlemleri sırasında değişmiş olabilir)
      if (!navigationRef.current || !navigationRef.current.isReady()) {
        console.error('[NotificationNavigationService] ❌ NavigationContainer is not ready after data fetch.');
        return false;
      }

      // 4. Kritik Değişiklik: CommonActions.navigate ile dispatch et
      // Nested stack'lerde CommonActions.navigate daha güvenilir çalışır
      try {
        const action = CommonActions.navigate({
          name: navigationAction.screen as never,
          params: navigationAction.params as never,
        });
        
        navigationRef.current.dispatch(action);
        console.log('[NotificationNavigationService] ✅ Navigated successfully using CommonActions.navigate');
        console.log('[NotificationNavigationService] ✅ Target:', navigationAction.screen, JSON.stringify(navigationAction.params, null, 2));
        return true;
      } catch (error) {
        console.error('[NotificationNavigationService] ❌ CommonActions.navigate failed:', error);
        // Fallback: Direkt navigate dene
        try {
          navigationRef.current.navigate(navigationAction.screen as any, navigationAction.params as any);
          console.log('[NotificationNavigationService] ✅ Direct navigate fallback successful');
          return true;
        } catch (directError) {
          console.error('[NotificationNavigationService] ❌ Direct navigate also failed:', directError);
          return false;
        }
      }
    } catch (error) {
      console.error('[NotificationNavigationService] ❌ Navigation error:', error);
      return false;
    }
  }
}
