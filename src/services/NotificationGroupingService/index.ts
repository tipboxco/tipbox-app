import { useNotificationStore } from '@/src/store/notificationStore';

/**
 * Notification Grouping Service
 * 
 * Advanced notification aggregation:
 * - Debouncing mechanism (1 dakika içindeki aynı tip bildirimleri grupla)
 * - Grouping logic (örn: "X ve 50 kişi daha fotoğrafınızı beğendi")
 * - Rate limiting (spam prevention)
 */
interface NotificationEvent {
  type: string;
  userId?: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  channels: string[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface GroupedNotification {
  groupedTitle: string;
  groupedBody: string;
  count: number;
  type: string;
  lastNotification: NotificationEvent;
}

class NotificationGroupingService {
  private groupingWindow: number = 60000; // 1 dakika (ms)
  private maxGroupSize: number = 50; // Maksimum grup boyutu
  private groupableTypes: Set<string> = new Set([
    'POST_LIKED',
    'POST_COMMENTED',
    'COMMENT_LIKED',
    'NEW_TRUSTER',
    'POST_SHARED',
  ]);

  /**
   * Event'i grupla veya hemen gönder
   * 
   * Groupable types için debouncing yapılır
   * Non-groupable types için hemen gönderilir
   */
  async groupOrSend(event: NotificationEvent): Promise<GroupedNotification | null> {
    // Groupable değilse hemen gönder
    if (!this.groupableTypes.has(event.type)) {
      return null;
    }

    // High priority ise hemen gönder (grouping yapma)
    if (event.priority === 'HIGH') {
      return null;
    }

    // Store'dan mevcut grouped notification'ı kontrol et
    const store = useNotificationStore.getState();
    const existing = store.getGroupedNotification(event.type);

    if (existing) {
      const timeDiff = Date.now() - existing.timestamp.getTime();
      
      // Grouping window içindeyse ve max size'a ulaşmadıysa, gruba ekle
      if (timeDiff < this.groupingWindow && existing.count < this.maxGroupSize) {
        store.addGroupedNotification(event.type, {
          id: event.metadata?.notificationId || Date.now().toString(),
          type: event.type as any,
          title: '',
          message: '',
          read: false,
          createdAt: event.timestamp.toISOString(),
          updatedAt: event.timestamp.toISOString(),
          metadata: event.metadata,
        } as any);

        // Hala grouping window içindeyse, null döndür (henüz gönderme)
        return null;
      } else {
        // Grouping window doldu veya max size'a ulaştı, grouped notification oluştur
        const grouped = this.createGroupedNotification(event.type, existing.count + 1, event);
        
        // Grouped notification'ı temizle
        store.clearGroupedNotification(event.type);
        
        // Yeni event'i yeni grup olarak başlat
        store.addGroupedNotification(event.type, {
          id: event.metadata?.notificationId || Date.now().toString(),
          type: event.type as any,
          title: '',
          message: '',
          read: false,
          createdAt: event.timestamp.toISOString(),
          updatedAt: event.timestamp.toISOString(),
          metadata: event.metadata,
        } as any);

        return grouped;
      }
    } else {
      // İlk event, grubu başlat ama henüz gönderme
      store.addGroupedNotification(event.type, {
        id: event.metadata?.notificationId || Date.now().toString(),
        type: event.type as any,
        title: '',
        message: '',
        read: false,
        createdAt: event.timestamp.toISOString(),
        updatedAt: event.timestamp.toISOString(),
          metadata: event.metadata,
      } as any);

      // İlk event için hemen gönder (grouping yapma)
      return null;
    }
  }

  /**
   * Grouped notification oluştur
   */
  private createGroupedNotification(
    type: string,
    count: number,
    lastEvent: NotificationEvent
  ): GroupedNotification {
    const templates: Record<string, (count: number) => { title: string; body: string }> = {
      POST_LIKED: (count) => ({
        title: 'Beğeniler',
        body: count === 1 
          ? 'Birisi fotoğrafınızı beğendi ❤️'
          : `${count} kişi fotoğrafınızı beğendi ❤️`,
      }),
      POST_COMMENTED: (count) => ({
        title: 'Yorumlar',
        body: count === 1
          ? 'Birisi fotoğrafınıza yorum yaptı 💬'
          : `${count} kişi fotoğrafınıza yorum yaptı 💬`,
      }),
      COMMENT_LIKED: (count) => ({
        title: 'Beğeniler',
        body: count === 1
          ? 'Birisi yorumunuzu beğendi ❤️'
          : `${count} kişi yorumunuzu beğendi ❤️`,
      }),
      NEW_TRUSTER: (count) => ({
        title: 'Yeni Takipçiler',
        body: count === 1
          ? 'Yeni bir takipçiniz var 👥'
          : `${count} yeni takipçiniz var 👥`,
      }),
      POST_SHARED: (count) => ({
        title: 'Paylaşımlar',
        body: count === 1
          ? 'Birisi fotoğrafınızı paylaştı 🔄'
          : `${count} kişi fotoğrafınızı paylaştı 🔄`,
      }),
    };

    const template = templates[type] || ((count) => ({
      title: 'Yeni Bildirimler',
      body: `${count} yeni bildiriminiz var`,
    }));

    const { title, body } = template(count);

    return {
      groupedTitle: title,
      groupedBody: body,
      count,
      type,
      lastNotification: lastEvent,
    };
  }

  /**
   * Pending grouped notifications'ı flush et
   * Grouping window dolduğunda veya app foreground'a geldiğinde çağrılır
   */
  flushPendingGroups(): GroupedNotification[] {
    const store = useNotificationStore.getState();
    const grouped: GroupedNotification[] = [];

    store.groupedNotifications.forEach((group, type) => {
      const timeDiff = Date.now() - group.timestamp.getTime();
      
      // Grouping window dolduysa flush et
      if (timeDiff >= this.groupingWindow || group.count >= this.maxGroupSize) {
        const notification = this.createGroupedNotification(
          type,
          group.count,
          {
            type,
            priority: 'NORMAL',
            channels: ['IN_APP', 'PUSH'],
            metadata: group.lastNotification.metadata,
            timestamp: group.timestamp,
          }
        );
        
        grouped.push(notification);
        store.clearGroupedNotification(type);
      }
    });

    return grouped;
  }

  /**
   * Tüm pending groups'ı temizle
   */
  clearAllGroups(): void {
    const store = useNotificationStore.getState();
    store.clearAllGroupedNotifications();
  }
}

export const notificationGroupingService = new NotificationGroupingService();
