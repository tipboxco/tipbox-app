/**
 * Socket Event Types
 * Backend dokümantasyonuna göre: FRONTEND_SOCKET_CONFIGURATION.md
 */

// Backend connection confirmation
export interface SocketConnectedEvent {
  message: string;
  userId: string;
  userEmail: string;
}

// Message Events
export interface NewMessageEvent {
  messageId: string;
  threadId: string;
  senderId: string;
  recipientId: string;
  message: string;
  messageType: 'message' | 'support-request' | 'send-tips';
  timestamp: string; // ISO 8601
  context?: 'DM' | 'SUPPORT';
  amount?: number; // For send-tips
}

export interface MessageSentEvent extends NewMessageEvent {}

export interface MessageReadEvent {
  messageId: string;
  threadId: string;
  readBy: string;
  timestamp: string;
}

// Typing Events
export interface TypingEvent {
  userId: string;
  threadId: string;
  isTyping: boolean;
}

// Thread Events
export interface ThreadJoinedEvent {
  threadId: string;
}

export interface ThreadLeftEvent {
  threadId: string;
}

export interface ThreadJoinErrorEvent {
  threadId: string;
  reason: string;
}

// Error Events
export interface MessageSendErrorEvent {
  reason: string;
}

// Legacy types (backward compatibility)
export interface SocketMessageEvent extends NewMessageEvent {
  context: 'DM';
}

export interface SocketSendTipsEvent extends NewMessageEvent {
  messageType: 'send-tips';
  amount: number;
}

export interface SocketSupportRequestEvent extends NewMessageEvent {
  messageType: 'support-request';
}

