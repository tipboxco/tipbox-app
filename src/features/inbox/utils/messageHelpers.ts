/**
 * Message Helper Functions
 * Mesaj formatlama ve yardımcı fonksiyonlar
 */

/**
 * Güvenli tarih formatlama fonksiyonu
 */
export const formatMessageTime = (dateInput: string | Date | null | undefined): string => {
  try {
    if (!dateInput) {
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Eğer string ise ve zaten saat formatındaysa (HH:MM veya HH:MM:SS), direkt döndür
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      // Sadece saat formatı kontrolü: HH:MM veya HH:MM:SS (boşluk olmadan)
      const timePattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
      if (timePattern.test(trimmed)) {
        // Zaten saat formatında, direkt döndür (uyarı verme)
        const parts = trimmed.split(':');
        return `${parts[0].padStart(2, '0')}:${parts[1]}`;
      }
    }
    
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    
    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      // Saat formatı kontrolü zaten yukarıda yapıldı, buraya gelmemeli
      // Eğer buraya geldiyse, geçersiz bir tarih formatı var demektir
      // Ancak console.warn'i kaldırıyoruz çünkü bu durum normal (backend'den saat formatında gelebilir)
      return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    // Hata durumunda sadece error log'u, uyarı değil
    if (__DEV__) {
      console.error('[MessageDetail] Date formatting error:', error, 'Input:', dateInput);
    }
    return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
};

/**
 * Date header formatı (Bugün, Dün, veya tarih)
 */
export const formatDateHeader = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.getTime() === today.getTime()) {
      return 'Bugün';
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Dün';
    } else {
      const day = date.getDate();
      const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch (error) {
    console.error('[MessageDetail] Date header formatting error:', error);
    return '';
  }
};

/**
 * Relative time formatı (2 dakika önce, 1 saat önce)
 */
export const formatRelativeTime = (timestamp: string | Date): string => {
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Az önce';
    } else if (diffMins < 60) {
      return `${diffMins} dakika önce`;
    } else if (diffHours < 24) {
      return `${diffHours} saat önce`;
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return formatDateHeader(timestamp);
    }
  } catch (error) {
    console.error('[MessageDetail] Relative time formatting error:', error);
    return '';
  }
};

/**
 * Mesaj gruplama helper - mesajların aynı gönderen ve zaman aralığında olup olmadığını kontrol eder
 */
export interface MessageGroupInfo {
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export interface MessageItem {
  id: string;
  timestamp: string;
  senderId?: string;
  isSent: boolean;
}

export const getMessageGroup = (
  messages: MessageItem[],
  index: number
): MessageGroupInfo => {
  const currentMessage = messages[index];
  if (!currentMessage) return { isFirstInGroup: true, isLastInGroup: true };
  
  const prevMessage = index > 0 ? messages[index - 1] : null;
  const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
  
  // Aynı gönderen kontrolü
  const isSameSender = prevMessage && 
    prevMessage.senderId === currentMessage.senderId &&
    prevMessage.isSent === currentMessage.isSent;
  
  // Zaman farkı kontrolü (5 dakika = 300000 ms)
  const TIME_THRESHOLD = 5 * 60 * 1000; // 5 dakika
  const isWithinTimeThreshold = prevMessage && 
    Math.abs(new Date(currentMessage.timestamp).getTime() - new Date(prevMessage.timestamp).getTime()) < TIME_THRESHOLD;
  
  // İlk mesaj mı? (önceki mesaj farklı gönderen veya zaman farkı çok fazla)
  const isFirstInGroup = !isSameSender || !isWithinTimeThreshold;
  
  // Son mesaj mı? (sonraki mesaj farklı gönderen veya zaman farkı çok fazla)
  const isLastInGroup = !nextMessage || 
    nextMessage.senderId !== currentMessage.senderId ||
    nextMessage.isSent !== currentMessage.isSent ||
    Math.abs(new Date(nextMessage.timestamp).getTime() - new Date(currentMessage.timestamp).getTime()) >= TIME_THRESHOLD;
  
  return { isFirstInGroup, isLastInGroup };
};

/**
 * Timestamp'i güvenli şekilde Date'e çevirir
 * Eğer timestamp sadece saat formatındaysa (HH:MM), geçersiz tarih döner
 */
export const safeParseTimestamp = (timestamp: string | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Eğer sadece saat formatındaysa (HH:MM), geçersiz tarih döndür
  if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    const timePattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    if (timePattern.test(trimmed)) {
      // Sadece saat formatında, geçersiz tarih döndür
      return new Date(NaN);
    }
  }
  
  return new Date(timestamp);
};

/**
 * Date separator gösterilip gösterilmeyeceğini kontrol eder
 */
export const shouldShowDateSeparator = (
  currentMessage: MessageItem,
  prevMessage: MessageItem | null
): boolean => {
  if (!prevMessage) return true;
  
  const currentDate = safeParseTimestamp(currentMessage.timestamp);
  const prevDate = safeParseTimestamp(prevMessage.timestamp);
  
  // Geçersiz tarihler için separator göster
  if (isNaN(currentDate.getTime()) || isNaN(prevDate.getTime())) {
    return true;
  }
  
  // Aynı gün ise separator gösterme
  return (
    currentDate.getDate() !== prevDate.getDate() ||
    currentDate.getMonth() !== prevDate.getMonth() ||
    currentDate.getFullYear() !== prevDate.getFullYear()
  );
};
