/**
 * Message Item Types
 */

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageDetailItem {
  id: string;
  text: string;
  timestamp: string;
  isSent: boolean;
  senderName?: string;
  senderAvatar?: any;
  type?: 'message' | 'support_request' | 'tips' | 'image';
  supportRequest?: {
    supportType: string;
    message: string;
    amount: number;
    status: 'pending' | 'accepted' | 'rejected' | 'canceled' | 'awaiting_completion' | 'completed' | 'reported';
    requestId?: string;
    threadId?: string | null;
    fromUserId?: string;
    toUserId?: string;
  };
  tipsAmount?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  thumbnailUrl?: string | null | undefined;
  isRead?: boolean;
  readAt?: string;
  status?: MessageStatus;
  deliveredAt?: string;
  uploadStatus?: 'uploading' | 'uploaded' | 'failed';
  uploadProgress?: number;
  isDeleted?: boolean;
  isEditing?: boolean;
  editedAt?: string;
  replyToMessageId?: string;
  replyToMessage?: {
    id: string;
    text: string;
    senderName?: string;
    senderAvatar?: any;
  };
  senderId?: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
}

export interface MessageItemProps {
  item: MessageDetailItem;
  index: number;
  messages: MessageDetailItem[];
  isDark: boolean;
  params: {
    senderName: string;
    senderTitle: string;
    senderAvatar: any;
  };
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, text: string) => void;
  onReply?: (message: MessageDetailItem) => void;
  onReact?: (messageId: string, emoji: string) => void;
  expandedSupportRequests?: { [key: string]: boolean };
  onToggleSupportRequest?: (id: string) => void;
  onAcceptSupportRequest?: (requestId: string) => void;
  onRejectSupportRequest?: (requestId: string) => void;
  onCancelSupportRequest?: (requestId: string) => void;
  onGoToSupportChat?: (supportThreadId: string, requestId: string) => void;
  currentUserId?: string;
}
