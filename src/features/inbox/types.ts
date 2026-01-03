/**
 * Inbox Message - /messages endpoint'inden gelen mesaj listesi elemani
 * Backend'den gelen response formatı (BACKEND_GEREKSINIMLERI_DM_THREAD.md'ye göre güncellendi)
 */
export interface InboxMessage {
  id: string; // Thread ID
  recipientUserId: string; // ✅ Backend'den gelen: Karşı tarafın (diğer kullanıcının) ID'si
  senderName: string;
  senderTitle?: string;
  senderAvatar: string | null;
  lastMessage: string;
  timestamp: string; // ISO string
  isUnread: boolean;
  unreadCount: number;
  threadType?: 'DM' | 'SUPPORT'; // ✅ Opsiyonel: Thread tipi bilgisi (iyileştirme)
}


