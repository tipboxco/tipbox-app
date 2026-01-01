/**
 * Inbox Message - /messages endpoint'inden gelen mesaj listesi elemani
 */
export interface InboxMessage {
  id: string;
  senderName: string;
  senderTitle?: string;
  senderAvatar: string | null;
  lastMessage: string;
  timestamp: string; // ISO string
  isUnread: boolean;
  unreadCount: number;
}


