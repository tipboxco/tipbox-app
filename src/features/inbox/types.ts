/**
 * Son mesajda paylaşılan post özeti – GET /inbox listesinde.
 * Backend: product ise productName + imageUrl; product group ise productGroupName + productGroupImageUrl gelir.
 */
export interface LastMessageSharedPost {
  postId: string;
  postType: string; // QUESTION | UPDATE | EXPERIENCE | COMPARE | TIPS | FREE
  title?: string;
  content?: string;
  /** Product görseli (product ise) */
  imageUrl?: string | null;
  productName?: string | null;
  /** Product group ise: product group adı ve görseli */
  productGroupName?: string | null;
  productGroupImageUrl?: string | null;
  subCategoryName?: string | null;
}

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
  /** Son mesaj shared post ise backend bu alanı doldurur; liste satırında lastMessage yeterli, bu opsiyonel */
  lastMessageSharedPost?: LastMessageSharedPost | null;
}


