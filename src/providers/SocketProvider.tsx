import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/src/services/SocketService';
import { useAppStore } from '@/src/store/appStore';
import { useAuth } from './AuthProvider';
import { useAppState } from './AppStateProvider';
import type { Socket } from 'socket.io-client';
import type {
  ThreadJoinedEvent,
  ThreadLeftEvent,
  ThreadJoinErrorEvent,
  MessageSendErrorEvent,
  MessageSentEvent,
  MessageReadEvent,
} from '@/src/services/SocketService/types';

/**
 * Socket Context Type
 */
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  // Socket event listeners
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback?: (data: any) => void) => void;
  emit: (event: string, data: any) => void;
  // Thread operations
  joinThread: (threadId: string) => void;
  leaveThread: (threadId: string) => void;
  markThreadRead: (threadId: string) => void;
  // Message operations
  sendMessage: (recipientId: string, message: string) => void; // recipientId kullanır (dokümana göre)
  sendSupportMessage: (threadId: string, message: string) => void;
  markMessageAsRead: (messageId: string) => void;
  // Typing operations
  startTyping: (threadId: string) => void;
  stopTyping: (threadId: string) => void;
  // Support request operations
  acceptSupportRequest: (requestId: string) => void;
  rejectSupportRequest: (requestId: string) => void;
  cancelSupportRequest: (requestId: string) => void;
  // Connection operations
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Socket Context
 */
const SocketContext = createContext<SocketContextType | null>(null);

/**
 * Socket Provider Props
 */
interface SocketProviderProps {
  children: React.ReactNode;
}

/**
 * Socket Provider Component
 * Tüm uygulamada socket bağlantısını yönetir
 * 
 * Kritik Bağlantı Kuralları:
 * - Auth hazır olmadan bağlanmaz
 * - Authenticated olmadan bağlanmaz
 * - AppState foreground olmadan bağlanmaz
 * - Background'a geçince disconnect eder
 * - Foreground'a dönünce tekrar bağlanır
 * 
 * @example
 * ```tsx
 * <SocketProvider>
 *   <App />
 * </SocketProvider>
 * ```
 */
export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { isAuthenticated } = useAppStore();
  const { isAuthReady } = useAuth();
  const { isForeground } = useAppState();
  const connectionAttemptRef = useRef(false);
  const connectionErrorRef = useRef(false);
  const maxRetriesRef = useRef(0);
  const lastAttemptTimeRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_COOLDOWN = 10000; // 10 saniye bekle

  // PERFORMANCE FIX: Socket state updates via event listeners instead of polling
  // Polling every 1 second is wasteful - use event-driven approach
  useEffect(() => {
    const updateSocketState = () => {
      const socketInstance = socketService.getSocket();
      setSocket(socketInstance);
      setIsConnected(socketService.isConnected());
    };

    // İlk state güncellemesi
    updateSocketState();

    // PERFORMANCE FIX: Use event listeners instead of polling interval
    // Socket service already emits connect/disconnect events
    // We'll rely on those events in the connection management effect below
    // This eliminates unnecessary 1-second polling overhead
  }, []);

  // Socket bağlantı yönetimi: Auth + AppState kontrolü
  useEffect(() => {
    // Log spam'i azalt - sadece önemli durumlarda log

    // Auth hazır değilse bekle (login ekranında hata göstermemek için sessizce return)
    if (!isAuthReady) {
      // Login ekranında hata göstermemek için sessizce return et
      return;
    }

    // Authenticated değilse bağlanma (login ekranında hata göstermemek için sessizce return)
    if (!isAuthenticated) {
      // Eğer bağlıysa disconnect et (sessizce, hata loglamadan)
      if (isConnected) {
        disconnect();
      }
      return;
    }

    // AppState foreground değilse bağlanma
    if (!isForeground) {
      // Eğer bağlıysa disconnect et
      if (isConnected) {
        disconnect();
      }
      return;
    }

    // Tüm koşullar sağlandı: Auth ready + Authenticated + Foreground
    // Bağlantı zaten varsa tekrar bağlanma
    if (isConnected) {
      return;
    }

    if (isConnecting) {
      return;
    }

    if (connectionAttemptRef.current) {
      return; // Sessizce çık, log spam'i önle
    }

    // Max retry kontrolü - sonsuz döngüyü önle
    if (maxRetriesRef.current >= MAX_RETRIES) {
      const timeSinceLastAttempt = Date.now() - lastAttemptTimeRef.current;
      if (timeSinceLastAttempt < RETRY_COOLDOWN) {
        // Cooldown süresi dolmadı, sessizce bekle (log spam'i önle)
        return;
      }
      // Cooldown doldu, retry sayacını sıfırla
      maxRetriesRef.current = 0;
      connectionErrorRef.current = false;
    }

    connectionAttemptRef.current = true;
    maxRetriesRef.current += 1;
    lastAttemptTimeRef.current = Date.now();
    
    connect()
      .then(() => {
        // connect() başarılı, socket event'i state'i güncelleyecek
        // isConnected kontrolü socket event'inden gelecek
      })
      .catch((error) => {
        // Sadece authenticated olduğunda hata logla (login ekranında hata göstermemek için)
        if (isAuthenticated && isAuthReady) {
          console.error('[SocketProvider] ❌ Connection failed:', error.message);
        }
        connectionErrorRef.current = true;
        
      })
      .finally(() => {
        connectionAttemptRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, isAuthenticated, isForeground, isConnected, isConnecting]);

  // Socket event listener'ları - socketService'den dinle
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      // Bağlantı başarılı olunca retry sayacını sıfırla
      maxRetriesRef.current = 0;
      connectionErrorRef.current = false;
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated]);

  // Socket event listener ekleme
  const on = useCallback((event: string, callback: (data: any) => void) => {
    socketService.on(event, callback);
  }, []);

  // Socket event listener kaldırma
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    socketService.off(event, callback);
  }, []);

  // Socket event emit
  const emit = useCallback((event: string, data: any) => {
    socketService.emit(event, data);
  }, []);

  // Thread operations
  const joinThread = useCallback((threadId: string) => {
    socketService.joinThread(threadId);
  }, []);

  const leaveThread = useCallback((threadId: string) => {
    socketService.leaveThread(threadId);
  }, []);

  // Message operations
  // Not: sendMessage recipientId kullanır (dokümana göre)
  const sendMessage = useCallback((recipientId: string, message: string) => {
    socketService.sendMessage(recipientId, message);
  }, []);

  const markMessageAsRead = useCallback((messageId: string) => {
    socketService.markMessageAsRead(messageId);
  }, []);

  // Typing operations
  const startTyping = useCallback((threadId: string) => {
    socketService.startTyping(threadId);
  }, []);

  const stopTyping = useCallback((threadId: string) => {
    socketService.stopTyping(threadId);
  }, []);

  // Thread read operation
  const markThreadRead = useCallback((threadId: string) => {
    socketService.markThreadRead(threadId);
  }, []);

  // Support message operation
  const sendSupportMessage = useCallback((threadId: string, message: string) => {
    socketService.sendSupportMessage(threadId, message);
  }, []);

  // Support request operations
  const acceptSupportRequest = useCallback((requestId: string) => {
    socketService.acceptSupportRequest(requestId);
  }, []);

  const rejectSupportRequest = useCallback((requestId: string) => {
    socketService.rejectSupportRequest(requestId);
  }, []);

  const cancelSupportRequest = useCallback((requestId: string) => {
    socketService.cancelSupportRequest(requestId);
  }, []);

  // Connection operations – Promise-based event listener (no polling / UI freeze)
  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      await socketService.connect();
      const socketInstance = socketService.getSocket();
      if (!socketInstance) {
        setIsConnected(false);
        throw new Error('Socket not available');
      }

      // Resolve when 'connect' fires or already connected; reject on timeout (no blocking loop)
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          socketInstance.off('connect', onConnect);
          reject(new Error('Socket connection timeout'));
        }, 5000);
        const onConnect = () => {
          clearTimeout(timeout);
          socketInstance.off('connect', onConnect);
          resolve();
        };
        socketInstance.on('connect', onConnect);
        if (socketInstance.connected) {
          clearTimeout(timeout);
          socketInstance.off('connect', onConnect);
          resolve();
        }
      });

      // Disconnect handler: connection drop tespiti ve reconnection UI için state güncelle
      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        setSocket(null);
      });

      setSocket(socketInstance);
      setIsConnected(true);
    } catch (error) {
      setIsConnected(false);
      throw error; // Hata fırlat ki retry mekanizması çalışsın
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // Context value
  const value: SocketContextType = {
    socket,
    isConnected,
    isConnecting,
    on,
    off,
    emit,
    joinThread,
    leaveThread,
    markThreadRead,
    sendMessage,
    sendSupportMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    acceptSupportRequest,
    rejectSupportRequest,
    cancelSupportRequest,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * useSocket Hook
 * Socket context'ini kullanmak için hook
 * 
 * @example
 * ```tsx
 * const { socket, isConnected, sendMessage } = useSocket();
 * ```
 */
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket hook must be used within SocketProvider');
  }
  
  return context;
};

