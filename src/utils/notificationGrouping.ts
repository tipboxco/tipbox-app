import type { Notification } from '@/src/features/notifications/api/types';

/**
 * Gruplanabilir bildirim tipleri
 * Aynı post/comment için birden fazla bildirim geldiğinde gruplanır
 */
const GROUPABLE_TYPES: Set<string> = new Set([
  'POST_LIKED',
  'POST_COMMENTED',
  'POST_SHARED',
  'POST_FAVORITED',
  'COMMENT_LIKED',
  'COMMENT_REPLIED',
  'NEW_TRUSTER',
  'NEW_TRUSTED_BY',
]);

/**
 * Gruplanmış bildirim interface'i
 */
export interface GroupedNotification {
  id: string; // Primary notification ID (en son gelen)
  type: string;
  postId?: string;
  commentId?: string;
  primaryUser: {
    id?: string;
    username?: string;
    avatar?: string | null;
  };
  otherUsers: Array<{
    id?: string;
    username?: string;
    avatar?: string | null;
  }>;
  count: number; // Toplam kullanıcı sayısı
  createdAt: string; // En son bildirimin tarihi
  read: boolean; // Tüm bildirimler okundu mu?
  data?: any; // Primary notification'ın data objesi
  imageUrl?: string | null; // Post/comment image
}

/**
 * Bildirimleri grupla (Instagram benzeri)
 * 
 * Aynı postId ve type'a sahip bildirimleri tek bir bildirimde birleştirir
 * Örnek: "Julia ve 5 kişi daha gönderini beğendi"
 * 
 * @param notifications - Gruplanacak bildirimler
 * @returns Gruplanmış bildirimler ve normal bildirimler
 */
export function groupNotificationsByActivity(
  notifications: Notification[]
): Array<Notification | GroupedNotification> {
  if (!notifications || notifications.length === 0) {
    return [];
  }

  // Gruplanabilir bildirimleri bul ve grupla
  const groupedMap = new Map<string, Notification[]>();
  const ungrouped: Notification[] = [];

  notifications.forEach((notification) => {
    // Gruplanabilir mi?
    if (!GROUPABLE_TYPES.has(notification.type)) {
      ungrouped.push(notification);
      return;
    }

    // Post veya comment ID'si var mı?
    const postId = notification.data?.postId;
    const commentId = notification.data?.commentId;
    
    if (!postId && !commentId) {
      // ID yoksa gruplama yapma
      ungrouped.push(notification);
      return;
    }

    // Grup key'i oluştur: type + postId/commentId
    const groupKey = `${notification.type}:${postId || commentId}`;

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, []);
    }
    groupedMap.get(groupKey)!.push(notification);
  });

  // Gruplanmış bildirimleri oluştur
  const grouped: Array<Notification | GroupedNotification> = [];

  groupedMap.forEach((notificationGroup, groupKey) => {
    // Tek bildirim varsa gruplama yapma
    if (notificationGroup.length === 1) {
      ungrouped.push(notificationGroup[0]);
      return;
    }

    // Tarihe göre sırala (en yeni en başta)
    notificationGroup.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const primaryNotification = notificationGroup[0];
    const otherNotifications = notificationGroup.slice(1);

    // Primary user (en son beğenen)
    const primaryUser = {
      id: primaryNotification.userId || primaryNotification.data?.likerId || primaryNotification.data?.commenterId || primaryNotification.data?.userId,
      username: primaryNotification.username || primaryNotification.data?.likerName || primaryNotification.data?.commenterName || primaryNotification.data?.userName || 'User',
      avatar: primaryNotification.avatar || primaryNotification.data?.userAvatar || null,
    };

    // Diğer kullanıcılar (avatar ve isim)
    const otherUsers = otherNotifications
      .map((notif) => ({
        id: notif.userId || notif.data?.likerId || notif.data?.commenterId || notif.data?.userId,
        username: notif.username || notif.data?.likerName || notif.data?.commenterName || notif.data?.userName || 'User',
        avatar: notif.avatar || notif.data?.userAvatar || null,
      }))
      .filter((user) => user.id && user.id !== primaryUser.id) // Duplicate'leri filtrele
      .slice(0, 5); // Maksimum 5 kullanıcı göster

    // Tüm bildirimler okundu mu?
    const allRead = notificationGroup.every((n) => n.read);

    // Gruplanmış bildirim oluştur
    const groupedNotification: GroupedNotification = {
      id: primaryNotification.id,
      type: primaryNotification.type,
      postId: primaryNotification.data?.postId,
      commentId: primaryNotification.data?.commentId,
      primaryUser,
      otherUsers,
      count: notificationGroup.length,
      createdAt: primaryNotification.createdAt,
      read: allRead,
      data: primaryNotification.data,
      imageUrl: primaryNotification.imageUrl || primaryNotification.data?.imageUrl || null,
    };

    grouped.push(groupedNotification);
  });

  // Gruplanmış ve gruplanmamış bildirimleri birleştir
  // Tarihe göre sırala (en yeni en başta)
  const allNotifications = [...grouped, ...ungrouped];
  allNotifications.sort((a, b) => {
    const dateA = 'createdAt' in a ? new Date(a.createdAt).getTime() : 0;
    const dateB = 'createdAt' in b ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  return allNotifications;
}

/**
 * Gruplanmış bildirim mesajı oluştur
 * 
 * @param groupedNotification - Gruplanmış bildirim
 * @returns Mesaj string'i
 */
export function getGroupedNotificationMessage(
  groupedNotification: GroupedNotification
): string {
  const { primaryUser, count, type } = groupedNotification;
  const username = primaryUser.username || 'User';
  const otherCount = count - 1;

  switch (type) {
    case 'POST_LIKED':
      if (otherCount === 0) {
        return `${username} liked your post`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} liked your post`;

    case 'POST_COMMENTED':
      if (otherCount === 0) {
        return `${username} commented on your post`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} commented on your post`;

    case 'POST_SHARED':
      if (otherCount === 0) {
        return `${username} shared your post`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} shared your post`;

    case 'POST_FAVORITED':
      if (otherCount === 0) {
        return `${username} favorited your post`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} favorited your post`;

    case 'COMMENT_LIKED':
      if (otherCount === 0) {
        return `${username} liked your comment`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} liked your comment`;

    case 'COMMENT_REPLIED':
      if (otherCount === 0) {
        return `${username} replied to your comment`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} replied to your comment`;

    case 'NEW_TRUSTER':
      if (otherCount === 0) {
        return `${username} started following you`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} started following you`;

    case 'NEW_TRUSTED_BY':
      if (otherCount === 0) {
        return `${username} is following you`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} are following you`;

    default:
      if (otherCount === 0) {
        return `${username} interacted with your content`;
      }
      return `${username} and ${otherCount} ${otherCount === 1 ? 'other' : 'others'} interacted with your content`;
  }
}

/**
 * Gruplanmış bildirim mi kontrol et
 */
export function isGroupedNotification(
  notification: Notification | GroupedNotification
): notification is GroupedNotification {
  return 'count' in notification && 'primaryUser' in notification;
}
