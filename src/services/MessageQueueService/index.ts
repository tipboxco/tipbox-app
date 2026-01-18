/**
 * Message Queue Service
 * Offline durumda gönderilen mesajları queue'ya ekler ve online olduğunda gönderir
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '@/src/services/ApiService';
import { sendDirectMessage } from '@/src/features/inbox/api/messagesApi';

const QUEUE_STORAGE_KEY = '@message_queue';
const MAX_QUEUE_SIZE = 100; // Maksimum queue boyutu

export interface QueuedMessage {
  id: string; // Unique message ID
  threadId: string;
  recipientUserId: string;
  message: string;
  timestamp: string; // ISO 8601
  type: 'message' | 'image' | 'tips' | 'support_request';
  mediaUri?: string; // For image/file messages
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  tipsAmount?: number; // For tips messages
  retryCount: number; // Retry sayısı
  createdAt: string; // Queue'ya eklendiği zaman
}

class MessageQueueService {
  private static instance: MessageQueueService;
  private queue: QueuedMessage[] = [];
  private isProcessing = false;
  private listeners: Array<(queue: QueuedMessage[]) => void> = [];

  private constructor() {
    this.loadQueue();
  }

  public static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  /**
   * Queue'yu AsyncStorage'dan yükle
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[MessageQueueService] ❌ Error loading queue:', error);
      this.queue = [];
    }
  }

  /**
   * Queue'yu AsyncStorage'a kaydet
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch (error) {
      console.error('[MessageQueueService] ❌ Error saving queue:', error);
    }
  }

  /**
   * Queue'ya mesaj ekle
   */
  public async enqueue(message: Omit<QueuedMessage, 'id' | 'retryCount' | 'createdAt'>): Promise<string> {
    // Queue boyutu kontrolü
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // En eski mesajı kaldır
      this.queue.shift();
    }

    const queuedMessage: QueuedMessage = {
      ...message,
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(queuedMessage);
    await this.saveQueue();

    console.log('[MessageQueueService] ✅ Message queued:', queuedMessage.id);
    return queuedMessage.id;
  }

  /**
   * Queue'dan mesaj kaldır
   */
  public async dequeue(messageId: string): Promise<void> {
    this.queue = this.queue.filter((msg) => msg.id !== messageId);
    await this.saveQueue();
    console.log('[MessageQueueService] ✅ Message dequeued:', messageId);
  }

  /**
   * Queue'daki tüm mesajları getir
   */
  public getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  /**
   * Queue'yu temizle
   */
  public async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('[MessageQueueService] ✅ Queue cleared');
  }

  /**
   * Queue'daki mesajları işle (online olduğunda çağrılır)
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('[MessageQueueService] ⚠️ Queue processing already in progress');
      return;
    }

    if (this.queue.length === 0) {
      console.log('[MessageQueueService] ℹ️ Queue is empty');
      return;
    }

    this.isProcessing = true;
    console.log('[MessageQueueService] 📤 Processing queue:', this.queue.length, 'messages');

    const messagesToProcess = [...this.queue];
    
    for (const message of messagesToProcess) {
      try {
        // Mesajı gönder
        await this.sendMessage(message);
        
        // Başarılı olursa queue'dan kaldır
        await this.dequeue(message.id);
      } catch (error: any) {
        console.error('[MessageQueueService] ❌ Error sending queued message:', error);
        
        // Retry count'u artır
        message.retryCount += 1;
        
        // Maksimum retry sayısına ulaşıldıysa queue'dan kaldır
        const MAX_RETRIES = 3;
        if (message.retryCount >= MAX_RETRIES) {
          console.error('[MessageQueueService] ❌ Max retries reached, removing message:', message.id);
          await this.dequeue(message.id);
        } else {
          // Retry count'u güncelle
          const index = this.queue.findIndex((msg) => msg.id === message.id);
          if (index !== -1) {
            this.queue[index] = message;
            await this.saveQueue();
          }
        }
      }
    }

    this.isProcessing = false;
    console.log('[MessageQueueService] ✅ Queue processing completed');
  }

  /**
   * Mesajı gönder (API call)
   */
  private async sendMessage(message: QueuedMessage): Promise<void> {
    if (message.type === 'message') {
      await sendDirectMessage({
        recipientUserId: message.recipientUserId,
        message: message.message,
        timestamp: message.timestamp,
      });
    } else if (message.type === 'image' && message.mediaUri) {
      // Image upload için uploadMedia kullan
      const { uploadMedia } = await import('@/src/features/inbox/api/messagesApi');
      await uploadMedia(
        message.threadId,
        message.mediaUri,
        message.mediaType || 'image',
        message.message
      );
    } else {
      throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  /**
   * Queue listener ekle
   */
  public addListener(listener: (queue: QueuedMessage[]) => void): () => void {
    this.listeners.push(listener);
    // İlk çağrıda mevcut queue'yu gönder
    listener(this.getQueue());
    
    // Cleanup function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Listener'ları bilgilendir
   */
  private notifyListeners(): void {
    const queue = this.getQueue();
    this.listeners.forEach((listener) => {
      try {
        listener(queue);
      } catch (error) {
        console.error('[MessageQueueService] ❌ Error notifying listener:', error);
      }
    });
  }

  /**
   * Queue boyutunu getir
   */
  public getQueueSize(): number {
    return this.queue.length;
  }
}

export const messageQueueService = MessageQueueService.getInstance();
