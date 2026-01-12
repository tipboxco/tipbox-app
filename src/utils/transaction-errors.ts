/**
 * Transaction Error Codes
 * 
 * Backend'den gelen hata kodları
 * Web2: Backend validation hatları
 * Web3: Blockchain + Backend hataları
 */
export enum TransactionErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  AMOUNT_TOO_LOW = 'AMOUNT_TOO_LOW',
  AMOUNT_TOO_HIGH = 'AMOUNT_TOO_HIGH',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT = 'TRANSACTION_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // NFT Specific
  NFT_NOT_FOUND = 'NFT_NOT_FOUND',
  NFT_NOT_OWNED = 'NFT_NOT_OWNED',
  NFT_ALREADY_LISTED = 'NFT_ALREADY_LISTED',
  INVALID_PRICE = 'INVALID_PRICE',
  
  // Swap Specific
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  SLIPPAGE_TOO_HIGH = 'SLIPPAGE_TOO_HIGH',
  PAIR_NOT_FOUND = 'PAIR_NOT_FOUND',
  
  // Rewards Specific
  NO_PENDING_REWARDS = 'NO_PENDING_REWARDS',
  REWARD_ALREADY_CLAIMED = 'REWARD_ALREADY_CLAIMED',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Transaction Error Messages (Türkçe)
 * 
 * Kullanıcı dostu hata mesajları
 */
export const TransactionErrorMessages: Record<TransactionErrorCode, string> = {
  [TransactionErrorCode.INSUFFICIENT_BALANCE]: 'Yetersiz bakiye. Lütfen bakiyenizi kontrol edin.',
  [TransactionErrorCode.INVALID_RECIPIENT]: 'Geçersiz alıcı. Lütfen doğru bir kullanıcı seçin.',
  [TransactionErrorCode.INVALID_AMOUNT]: 'Geçersiz miktar. Lütfen geçerli bir miktar girin.',
  [TransactionErrorCode.AMOUNT_TOO_LOW]: 'Miktar çok düşük. Minimum gönderim miktarını kontrol edin.',
  [TransactionErrorCode.AMOUNT_TOO_HIGH]: 'Miktar çok yüksek. Maksimum gönderim miktarını kontrol edin.',
  [TransactionErrorCode.WALLET_NOT_FOUND]: 'Cüzdan bulunamadı. Lütfen tekrar giriş yapın.',
  [TransactionErrorCode.TRANSACTION_FAILED]: 'İşlem başarısız oldu. Lütfen tekrar deneyin.',
  [TransactionErrorCode.TRANSACTION_TIMEOUT]: 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
  [TransactionErrorCode.NETWORK_ERROR]: 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
  [TransactionErrorCode.SERVER_ERROR]: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  [TransactionErrorCode.UNAUTHORIZED]: 'Yetkiniz yok. Lütfen tekrar giriş yapın.',
  [TransactionErrorCode.RATE_LIMIT_EXCEEDED]: 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.',
  
  // NFT
  [TransactionErrorCode.NFT_NOT_FOUND]: 'NFT bulunamadı.',
  [TransactionErrorCode.NFT_NOT_OWNED]: 'Bu NFT size ait değil.',
  [TransactionErrorCode.NFT_ALREADY_LISTED]: 'Bu NFT zaten listelendi.',
  [TransactionErrorCode.INVALID_PRICE]: 'Geçersiz fiyat. Lütfen geçerli bir fiyat girin.',
  
  // Swap
  [TransactionErrorCode.INSUFFICIENT_LIQUIDITY]: 'Yetersiz likidite. Daha küçük bir miktar deneyin.',
  [TransactionErrorCode.SLIPPAGE_TOO_HIGH]: 'Slippage çok yüksek. Lütfen ayarları kontrol edin.',
  [TransactionErrorCode.PAIR_NOT_FOUND]: 'Swap çifti bulunamadı.',
  
  // Rewards
  [TransactionErrorCode.NO_PENDING_REWARDS]: 'Bekleyen ödül yok.',
  [TransactionErrorCode.REWARD_ALREADY_CLAIMED]: 'Bu ödül zaten talep edildi.',
  
  // Generic
  [TransactionErrorCode.UNKNOWN_ERROR]: 'Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.',
};

/**
 * Handle Transaction Error
 * 
 * Axios error'u parse eder ve kullanıcı dostu mesaj döner
 * 
 * @param error - Axios error veya any error
 * @returns Türkçe hata mesajı
 */
export const handleTransactionError = (error: any): string => {
  console.error('[Transaction Error]:', error);
  
  // Backend'den gelen error response
  if (error?.response?.data) {
    const { code, message } = error.response.data;
    
    // Error code varsa mesajını dön
    if (code && TransactionErrorMessages[code as TransactionErrorCode]) {
      return TransactionErrorMessages[code as TransactionErrorCode];
    }
    
    // Backend'den gelen custom message varsa onu dön
    if (message && typeof message === 'string') {
      return message;
    }
  }
  
  // HTTP status code'a göre generic mesaj
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return TransactionErrorMessages[TransactionErrorCode.INVALID_AMOUNT];
      case 401:
        return TransactionErrorMessages[TransactionErrorCode.UNAUTHORIZED];
      case 403:
        return 'Bu işlemi yapmaya yetkiniz yok.';
      case 404:
        return 'İstenen kaynak bulunamadı.';
      case 429:
        return TransactionErrorMessages[TransactionErrorCode.RATE_LIMIT_EXCEEDED];
      case 500:
      case 502:
      case 503:
        return TransactionErrorMessages[TransactionErrorCode.SERVER_ERROR];
      case 504:
        return TransactionErrorMessages[TransactionErrorCode.TRANSACTION_TIMEOUT];
    }
  }
  
  // Network error
  if (error?.message === 'Network Error' || !error?.response) {
    return TransactionErrorMessages[TransactionErrorCode.NETWORK_ERROR];
  }
  
  // Timeout error
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return TransactionErrorMessages[TransactionErrorCode.TRANSACTION_TIMEOUT];
  }
  
  // Generic error
  return TransactionErrorMessages[TransactionErrorCode.UNKNOWN_ERROR];
};

/**
 * Get Error Color
 * 
 * Hata tipine göre renk döner
 */
export const getErrorColor = (errorCode?: TransactionErrorCode): string => {
  if (!errorCode) return '#F44336';
  
  switch (errorCode) {
    case TransactionErrorCode.INSUFFICIENT_BALANCE:
    case TransactionErrorCode.AMOUNT_TOO_LOW:
    case TransactionErrorCode.AMOUNT_TOO_HIGH:
      return '#FF9800'; // Orange (warning)
    
    case TransactionErrorCode.NETWORK_ERROR:
    case TransactionErrorCode.TRANSACTION_TIMEOUT:
      return '#2196F3'; // Blue (info)
    
    default:
      return '#F44336'; // Red (error)
  }
};

/**
 * Is Retryable Error
 * 
 * Hata retry edilebilir mi?
 */
export const isRetryableError = (errorCode?: TransactionErrorCode): boolean => {
  if (!errorCode) return false;
  
  const retryableErrors = [
    TransactionErrorCode.NETWORK_ERROR,
    TransactionErrorCode.TRANSACTION_TIMEOUT,
    TransactionErrorCode.SERVER_ERROR,
  ];
  
  return retryableErrors.includes(errorCode);
};

