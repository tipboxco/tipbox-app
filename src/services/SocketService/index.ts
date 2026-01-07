import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../../config/api.config';
import { TokenService } from '../TokenService';

/**
 * SocketService - Basit Socket.IO Bağlantı Yönetimi
 * Socket.IO resmi Expo örneğine göre basitleştirilmiş versiyon
 * Reference: https://github.com/socketio/socket.io/tree/main/examples/expo-example
 */
class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Socket bağlantısını kurar
   * Sunucuya bağlanırken farklı configler gerekebilir (HTTPS/WSS, polling fallback, vb.)
   * 
   * ÖNEMLİ: Token yoksa sessizce return eder (login ekranında hata göstermez)
   */
  public async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('[SocketService] ✅ Already connected');
      return;
    }

    try {
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        // Token yoksa sessizce return et - login ekranında hata gösterme
        // Bu normal bir durum: kullanıcı henüz login olmamış
        return;
      }

      // Socket BASE_URL üzerinden çalışır (tüm servisler aynı URL'i kullanır)
      const socketUrl = API_CONFIG.BASE_URL;
      const isHttps = socketUrl.startsWith('https://');
      const isWss = socketUrl.startsWith('wss://');
      
      console.log('[SocketService] 🔌 Connecting to:', socketUrl, {
        isHttps,
        isWss,
      });
      
      const extraHeaders: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      };

      // Ngrok header
      if (socketUrl.includes('ngrok')) {
        extraHeaders['ngrok-skip-browser-warning'] = 'true';
      }

      // Eğer mevcut socket varsa, önce temizle
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      // Transport ayarları: Sunucuya bağlanırken polling fallback ekle
      // HTTPS/WSS üzerinden bağlanırken bazen WebSocket başarısız olabilir
      const transports = isHttps || isWss 
        ? ['websocket', 'polling'] // HTTPS/WSS için polling fallback ekle
        : ['websocket']; // HTTP için sadece websocket

      // Socket.IO bağlantısı - Docker + Sunucu için optimize edilmiş
      // Reference: https://socket.io/how-to/use-with-react-native
      this.socket = io(socketUrl, {
        auth: {
          token: accessToken,
        },
        extraHeaders,
        path: '/socket.io/',
        transports, // WebSocket öncelikli, polling fallback (HTTPS için)
        forceNew: true, // Yeni bağlantı zorla (Docker için önemli)
        reconnection: false, // Manuel reconnection yönetimi
        timeout: 20000,
        // HTTPS/WSS için upgrade'i açık bırak (polling'den websocket'e upgrade olabilir)
        upgrade: isHttps || isWss ? true : false,
        // Sunucuya bağlanırken CORS ve SSL ayarları
        withCredentials: false,
        // React Native için ek ayarlar
        reconnectionAttempts: 0, // Manuel reconnection yönetimi
        reconnectionDelay: 1000,
      });

      // Event handlers - sadece bir kez ekle
      this.socket.once('connect', () => {
        console.log('[SocketService] ✅ Connected:', {
          socketId: this.socket?.id,
          transport: this.socket?.io?.engine?.transport?.name,
        });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] ❌ Disconnected:', reason);
      });

      this.socket.once('connect_error', (error) => {
        // Sadece development modunda detaylı log (login ekranında hata göstermemek için)
        if (__DEV__) {
          console.error('[SocketService] ❌ Connection error:', {
            message: error.message,
            type: (error as any).type,
            description: (error as any).description,
            context: (error as any).context,
            url: socketUrl,
          });
        }
      });

      // DEBUG: Tüm socket event'lerini log'la (sadece development için)
      if (__DEV__) {
        // Socket.IO'da onAny metodu yok, bu yüzden manuel olarak dinleyeceğiz
        // Önemli event'leri log'la
        const logEvent = (eventName: string) => {
          this.socket?.on(eventName, (data: any) => {
            console.log(`[SocketService] 📨 Event received: ${eventName}`, {
              data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
            });
          });
        };

        // Bilinen event'leri log'la
        ['notification', 'new_notification', 'notifications', 'message', 'new_message'].forEach(logEvent);
      }

    } catch (error) {
      console.error('[SocketService] ❌ Connect failed:', error);
      throw error;
    }
  }

  /**
   * Socket bağlantısını kapatır
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] 🔌 Disconnected');
    }
  }

  /**
   * Socket instance'ını döndürür
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Bağlantı durumunu kontrol eder
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Event listener ekler
   */
  public on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }

  /**
   * Event listener kaldırır
   */
  public off(event: string, callback?: (data: any) => void): void {
    this.socket?.off(event, callback);
  }

  /**
   * Event emit eder
   */
  public emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  /**
   * Thread room'una katılır
   */
  public joinThread(threadId: string): void {
    this.socket?.emit('join_thread', { threadId });
  }

  /**
   * Thread room'undan ayrılır
   */
  public leaveThread(threadId: string): void {
    this.socket?.emit('leave_thread', { threadId });
  }

  /**
   * Mesaj gönderir
   * Dokümana göre: send_message event'i recipientId bekliyor
   */
  public sendMessage(recipientId: string, message: string): void {
    console.log('[SocketService] 📤 Emitting send_message:', { recipientId, message });
    this.socket?.emit('send_message', { recipientId, message });
  }

  /**
   * Support mesajı gönderir
   */
  public sendSupportMessage(threadId: string, message: string): void {
    this.socket?.emit('send_support_message', { threadId, message });
  }

  /**
   * Thread'deki tüm mesajları okundu işaretler
   */
  public markThreadRead(threadId: string): void {
    this.socket?.emit('mark_thread_read', { threadId });
  }

  /**
   * Support request'i accept eder
   */
  public acceptSupportRequest(requestId: string): void {
    this.socket?.emit('accept_support_request', { requestId });
  }

  /**
   * Support request'i reject eder
   */
  public rejectSupportRequest(requestId: string): void {
    this.socket?.emit('reject_support_request', { requestId });
  }

  /**
   * Support request'i iptal eder
   */
  public cancelSupportRequest(requestId: string): void {
    this.socket?.emit('cancel_support_request', { requestId });
  }

  /**
   * Mesajı okundu olarak işaretler
   */
  public markMessageAsRead(messageId: string): void {
    this.socket?.emit('mark_message_read', { messageId });
  }

  /**
   * Typing başlatır
   */
  public startTyping(threadId: string): void {
    this.socket?.emit('typing_start', { threadId });
  }

  /**
   * Typing durdurur
   */
  public stopTyping(threadId: string): void {
    this.socket?.emit('typing_stop', { threadId });
  }

  /**
   * Notification event listener ekler
   * Backend'den gelebilecek farklı event adlarını da dinler
   */
  public onNotification(callback: (notification: any) => void): void {
    // Wrapper callback - tüm event'leri tek bir callback'e yönlendir
    const wrappedCallback = (data: any) => {
      if (__DEV__) {
        console.log('[SocketService] 🔍 Notification event received:', {
          event: 'notification',
          data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data,
        });
      }
      callback(data);
    };
    
    // Ana event adı
    this.on('notification', wrappedCallback);
    
    // Alternatif event adları (backend farklı event adı kullanıyor olabilir)
    // Bu event'ler de aynı callback'i çağırır
    this.on('new_notification', wrappedCallback);
    this.on('notifications', wrappedCallback);
  }

  /**
   * Connect event listener ekler
   */
  public onConnected(callback: () => void): void {
    this.on('connect', callback);
  }

  /**
   * Disconnect event listener ekler
   */
  public onDisconnected(callback: (reason?: string) => void): void {
    this.on('disconnect', callback);
  }

  /**
   * New message event listener ekler
   */
  public onNewMessage(callback: (data: any) => void): void {
    this.on('new_message', callback);
  }

  /**
   * Message sent event listener ekler
   */
  public onMessageSent(callback: (data: any) => void): void {
    this.on('message_sent', callback);
  }

  /**
   * Thread joined event listener ekler
   */
  public onThreadJoined(callback: (data: { threadId: string }) => void): void {
    this.on('thread_joined', callback);
  }

  /**
   * User typing event listener ekler
   */
  public onUserTyping(callback: (data: { userId: string; threadId: string; isTyping: boolean }) => void): void {
    this.on('user_typing', callback);
  }

  /**
   * Message read event listener ekler
   */
  public onMessageRead(callback: (data: { messageId: string; threadId: string; readBy: string; timestamp: string }) => void): void {
    this.on('message_read', callback);
  }

  /**
   * Thread read event listener ekler
   */
  public onThreadRead(callback: (data: { threadId: string; readBy: string; timestamp: string }) => void): void {
    this.on('thread_read', callback);
  }

  /**
   * Support request accepted event listener ekler
   */
  public onSupportRequestAccepted(callback: (data: { requestId: string; threadId: string; timestamp: string }) => void): void {
    this.on('support_request_accepted', callback);
  }

  /**
   * Support request rejected event listener ekler
   */
  public onSupportRequestRejected(callback: (data: { requestId: string; timestamp: string }) => void): void {
    this.on('support_request_rejected', callback);
  }

  /**
   * Support request cancelled event listener ekler
   */
  public onSupportRequestCancelled(callback: (data: { requestId: string; timestamp: string }) => void): void {
    this.on('support_request_cancelled', callback);
  }

  /**
   * Connected event listener ekler (backend'den gelen connected event)
   */
  public onConnectedEvent(callback: (data: { message: string; userId: string; userEmail: string }) => void): void {
    this.on('connected', callback);
  }
}

export const socketService = SocketService.getInstance();
