export interface Message {
  id: string;
  senderName: string;
  senderTitle: string;
  senderAvatar: any;
  lastMessage: string;
  timestamp: string;
  isUnread: boolean;
  unreadCount?: number;
}

export interface MessageCategory {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InboxData {
  categories: MessageCategory[];
  messages: Message[];
}
