export type SupportedLanguage = string; // Tüm ISO 639-1 dil kodları

export interface TranslationCacheEntry {
  postId: string;
  originalContent: string;
  translatedContent: string;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number; // Cache zamanı (7 gün TTL için)
  contentHash: string; // İçerik değişikliği kontrolü için
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string; // Auto-detect için optional
}

export interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

export interface TranslationError {
  code: 'NETWORK_ERROR' | 'API_ERROR' | 'QUOTA_EXCEEDED' | 'INVALID_LANGUAGE';
  message: string;
}

