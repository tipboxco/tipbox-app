import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../../config/api.config';
import { TokenService } from '../TokenService';
import type {
  NewMessageEvent,
  MessageSentEvent,
  MessageReadEvent,
  TypingEvent,
  ThreadJoinedEvent,
  ThreadLeftEvent,
  ThreadJoinErrorEvent,
  MessageSendErrorEvent,
  SocketConnectedEvent,
  // Legacy types
  SocketMessageEvent,
} from './types';

/**
 * SocketService
 * Socket.IO bağlantısını yönetir ve JWT authentication ile bağlanır
 */
class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Socket bağlantısını kurar
   * JWT token ile authentication yapar
   */
  public async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('[SocketService] Connection already in progress');
      return;
    }

    // Eğer max reconnect attempts'a ulaşıldıysa, tekrar deneme
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[SocketService] Max reconnection attempts reached previously. Resetting and retrying...');
      this.reconnectAttempts = 0;
    }

    try {
      this.isConnecting = true;

      // Access token'ı al
      const accessToken = await TokenService.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Socket.IO bağlantısını kur
      // Socket.IO otomatik olarak http/https'yi ws/wss'ye çevirir
      const socketUrl = API_CONFIG.BASE_URL;
      
      console.log('[SocketService] Connecting to:', socketUrl);
      console.log('[SocketService] Access token available:', !!accessToken);

      this.socket = io(socketUrl, {
        // Authentication - Socket.IO server'ın beklediği formata göre ayarla
        auth: {
          token: accessToken,
        },
        // Authorization header olarak da gönder (bazı server'lar bunu bekler)
        extraHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        // Socket.IO pathname - Backend'de /socket.io/ olarak ayarlandı
        path: '/socket.io/',
        // React Native için hem websocket hem polling dene
        transports: ['websocket', 'polling'],
        // Timeout ayarları - Backend'de 20 saniye olarak ayarlandı
        timeout: 20000, // 20 saniye
        // Reconnection ayarları
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        // Force new connection
        forceNew: false,
        // Auto connect
        autoConnect: true,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('[SocketService] Connected to server, socket ID:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      // Backend bağlantı onayı (dokümantasyona göre)
      this.socket.on('connected', (data: { message: string; userId: string; userEmail: string }) => {
        console.log('[SocketService] Backend connection confirmed:', data);
        console.log('[SocketService] User ID:', data.userId);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[SocketService] Disconnected:', reason);
        this.isConnecting = false;
        
        // Eğer server tarafından kesildiyse (token geçersiz olabilir)
        if (reason === 'io server disconnect') {
          console.warn('[SocketService] Server disconnected the connection. Possible reasons:');
          console.warn('  - Token expired or invalid');
          console.warn('  - Server restart');
          console.warn('  - Authentication failed');
        }
      });

      this.socket.on('connect_error', (error) => {
        this.isConnecting = false;
        this.reconnectAttempts++;
        
        // Token geçersizse veya authentication hatası varsa
        if (error.message.includes('Authentication') || error.message.includes('Unauthorized') || error.message.includes('token')) {
          console.error('[SocketService] Authentication error:', error.message);
          console.warn('[SocketService] Token may be invalid or expired. Please re-login.');
          // Token hatası varsa reconnect denemelerini durdur
          this.reconnectAttempts = this.maxReconnectAttempts;
          this.disconnect();
          return;
        }
        
        // İlk hatalarda sadece uyarı ver
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          console.warn(`[SocketService] Connection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} failed:`, error.message);
          console.warn(`[SocketService] Retrying in ${Math.min(1000 * this.reconnectAttempts, 5000)}ms...`);
        } else {
          // Son denemede detaylı hata logla
          console.error('[SocketService] Max reconnection attempts reached');
          console.error('[SocketService] Connection error details:', {
            message: error.message,
            type: error.type,
            description: error.description,
            url: socketUrl,
          });
          console.warn('[SocketService] Possible causes:');
          console.warn('  - Backend socket server is not running');
          console.warn('  - Network connectivity issues');
          console.warn('  - Invalid or expired access token');
          console.warn('  - Incorrect socket URL or path');
          console.warn('[SocketService] Socket features disabled. Application will continue with REST API only.');
          // Son denemede bağlantıyı kapat ama uygulama çalışmaya devam eder
          this.disconnect();
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log('[SocketService] Reconnected after', attemptNumber, 'attempts');
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`[SocketService] Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
        this.reconnectAttempts = attemptNumber;
      });

      this.socket.on('reconnect_error', (error) => {
        console.warn(`[SocketService] Reconnection error (attempt ${this.reconnectAttempts}):`, error.message);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('[SocketService] All reconnection attempts failed');
        console.warn('[SocketService] Socket features disabled. Using REST API only.');
        this.reconnectAttempts = this.maxReconnectAttempts;
      });

    } catch (error) {
      console.error('[SocketService] Error connecting:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Socket bağlantısını kapatır
   */
  public disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Socket event listener ekler
   * @param event - Event adı (örn: 'new_message', 'message_sent')
   * @param callback - Event handler fonksiyonu
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('[SocketService] Socket not connected, cannot add listener for:', event);
      return;
    }

    this.socket.on(event, callback);
    console.log('[SocketService] Added listener for:', event);
  }

  /**
   * Socket event listener kaldırır
   * @param event - Event adı
   * @param callback - Event handler fonksiyonu (opsiyonel)
   */
  public off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
    console.log('[SocketService] Removed listener for:', event);
  }

  /**
   * Socket event emit eder (server'a mesaj gönderir)
   * @param event - Event adı
   * @param data - Gönderilecek veri
   */
  public emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Socket not connected, cannot emit:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Socket bağlantı durumunu kontrol eder
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Socket instance'ını döndürür (gelişmiş kullanım için)
   */
  public getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Thread room'una katılır
   * @param threadId - Thread ID
   * @param onJoined - Başarılı katılım callback'i (opsiyonel)
   * @param onError - Hata callback'i (opsiyonel)
   */
  public joinThread(
    threadId: string,
    onJoined?: (data: ThreadJoinedEvent) => void,
    onError?: (error: ThreadJoinErrorEvent) => void
  ): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Socket not connected, cannot join thread:', threadId);
      return;
    }

    this.socket.emit('join_thread', threadId);
    console.log('[SocketService] Joining thread:', threadId);

    // Başarılı katılım onayını dinle
    if (onJoined) {
      this.socket.once('thread_joined', (data: ThreadJoinedEvent) => {
        console.log('[SocketService] Thread joined:', data.threadId);
        onJoined(data);
      });
    }

    // Hata durumunu dinle
    if (onError) {
      this.socket.once('thread_join_error', (error: ThreadJoinErrorEvent) => {
        console.error('[SocketService] Thread join error:', error.reason);
        onError(error);
      });
    }
  }

  /**
   * Thread room'undan ayrılır
   * @param threadId - Thread ID
   */
  public leaveThread(threadId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leave_thread', threadId);
    console.log('[SocketService] Leaving thread:', threadId);
  }

  /**
   * Mesaj gönderir (Socket üzerinden - önerilen yöntem)
   * @param threadId - Thread ID
   * @param message - Mesaj içeriği
   * @param onSent - Mesaj gönderildi callback'i (opsiyonel)
   * @param onError - Hata callback'i (opsiyonel)
   */
  public sendMessage(
    threadId: string,
    message: string,
    onSent?: (data: MessageSentEvent) => void,
    onError?: (error: MessageSendErrorEvent) => void
  ): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Socket not connected, cannot send message');
      return;
    }

    this.socket.emit('send_message', {
      threadId,
      message,
    });
    console.log('[SocketService] Sending message to thread:', threadId);

    // Mesaj gönderildi onayını dinle
    if (onSent) {
      this.socket.once('message_sent', (data: MessageSentEvent) => {
        console.log('[SocketService] Message sent:', data.messageId);
        onSent(data);
      });
    }

    // Hata durumunu dinle
    if (onError) {
      this.socket.once('message_send_error', (error: MessageSendErrorEvent) => {
        console.error('[SocketService] Message send error:', error.reason);
        onError(error);
      });
    }
  }

  /**
   * Typing indicator başlatır
   * @param threadId - Thread ID
   */
  public startTyping(threadId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing_start', { threadId });
  }

  /**
   * Typing indicator durdurur
   * @param threadId - Thread ID
   */
  public stopTyping(threadId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing_stop', { threadId });
  }

  /**
   * Mesajı okundu olarak işaretler
   * @param messageId - Message ID
   * @param callback - Response callback (optional)
   */
  public markMessageAsRead(
    messageId: string,
    callback?: (response: { success?: boolean; error?: string }) => void
  ): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Socket not connected, cannot mark message as read');
      return;
    }

    if (callback) {
      this.socket.emit('mark_message_read', { messageId }, callback);
    } else {
      this.socket.emit('mark_message_read', { messageId });
    }
    console.log('[SocketService] Marking message as read:', messageId);
  }
}

export const socketService = SocketService.getInstance();

