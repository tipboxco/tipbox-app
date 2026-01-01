/**
 * Notification Analytics Service
 * 
 * Tracking ve metrics:
 * - Notification received tracking
 * - Notification opened tracking
 * - Notification delivery rate
 * - User engagement metrics
 */
interface AnalyticsEvent {
  notificationId: string;
  type: string;
  source: 'socket' | 'push' | 'api';
  timestamp: Date;
  metadata?: Record<string, any>;
}

class NotificationAnalytics {
  private events: AnalyticsEvent[] = [];
  private maxEvents: number = 100; // Son 100 event'i tut

  /**
   * Notification received tracking
   */
  async trackReceived(
    notificationId: string,
    type: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      notificationId,
      type,
      source: metadata?.source || 'api',
      timestamp: new Date(),
      metadata,
    };

    this.addEvent(event);
    console.log('[NotificationAnalytics] 📊 Notification received:', {
      notificationId,
      type,
      source: event.source,
    });
  }

  /**
   * Notification opened tracking
   */
  async trackOpened(
    notificationId: string,
    type: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      notificationId,
      type,
      source: metadata?.source || 'api',
      timestamp: new Date(),
      metadata: {
        ...metadata,
        action: 'opened',
      },
    };

    this.addEvent(event);
    console.log('[NotificationAnalytics] 📊 Notification opened:', {
      notificationId,
      type,
      source: event.source,
    });
  }

  /**
   * Event ekle
   */
  private addEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    
    // Max events'e ulaştıysa, en eskisini kaldır
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Analytics events'i getir
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Analytics events'i temizle
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Delivery rate hesapla (received / sent)
   * Backend'den sent count alınmalı
   */
  calculateDeliveryRate(sentCount: number): number {
    const receivedCount = this.events.filter(
      (e) => e.metadata?.action !== 'opened'
    ).length;
    
    if (sentCount === 0) return 0;
    return (receivedCount / sentCount) * 100;
  }

  /**
   * Open rate hesapla (opened / received)
   */
  calculateOpenRate(): number {
    const receivedCount = this.events.filter(
      (e) => e.metadata?.action !== 'opened'
    ).length;
    
    const openedCount = this.events.filter(
      (e) => e.metadata?.action === 'opened'
    ).length;
    
    if (receivedCount === 0) return 0;
    return (openedCount / receivedCount) * 100;
  }
}

export const notificationAnalytics = new NotificationAnalytics();
