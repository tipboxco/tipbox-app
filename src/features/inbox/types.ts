/**
 * Inbox Message - /inbox endpoint'inden gelen mesaj listesi elemani
 * Backend'den gelen response formatı (yeni API yapısına göre güncellendi)
 */
export interface InboxMessage {
  id: string; // Thread ID
  recipientUserId: string; // ✅ Backend'den gelen: Karşı tarafın (diğer kullanıcının) ID'si
  senderName: string;
  senderTitle: string | null; // ✅ Yeni yapıda null olabilir
  senderAvatar: string | null;
  lastMessage: string | null; // ✅ Yeni yapıda null olabilir
  timestamp: string; // ISO string
  isUnread: boolean;
  unreadCount: number;
  threadType?: 'DM' | 'SUPPORT'; // ✅ Opsiyonel: Thread tipi bilgisi
  isMuted?: boolean; // ✅ Opsiyonel: Thread muted mu?
}


