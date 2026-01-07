import axios from 'axios';
import { GOOGLE_TRANSLATE_API_KEY } from '@env';
import {
  TranslationServiceConfig,
  ITranslationService,
} from './types';

class TranslationService implements ITranslationService {
  private static instance: TranslationService;
  private config: TranslationServiceConfig;
  private apiEndpoint = 'https://translation.googleapis.com/language/translate/v2';

  private constructor() {
    this.config = {
      apiKey: GOOGLE_TRANSLATE_API_KEY,
      defaultSourceLanguage: 'en', // App İngilizce
      timeout: 10000, // 10 saniye
    };

    // API key kontrolü
    if (!this.config.apiKey || this.config.apiKey === 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
      console.error('[TranslationService] ❌ GOOGLE_TRANSLATE_API_KEY eksik veya geçersiz!');
      throw new Error('GOOGLE_TRANSLATE_API_KEY .env dosyasında tanımlanmalı');
    }
  }

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Metni hedef dile çevirir
   * Google Cloud Translation API REST endpoint kullanır
   */
  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string> {
    try {
      console.log('[TranslationService] 🔄 Translating...');
      console.log('[TranslationService]    - Source:', sourceLanguage);
      console.log('[TranslationService]    - Target:', targetLanguage);
      console.log('[TranslationService]    - Text length:', text.length);

      const response = await axios.post(
        this.apiEndpoint,
        {
          q: text,
          target: targetLanguage,
          source: sourceLanguage,
          format: 'text',
        },
        {
          params: {
            key: this.config.apiKey,
          },
          timeout: this.config.timeout,
        }
      );

      const translatedText = response.data.data.translations[0].translatedText;
      
      console.log('[TranslationService] ✅ Translation successful');
      return translatedText;
    } catch (error: any) {
      console.error('[TranslationService] ❌ Translation error:', error);

      // Hata tipine göre özel mesajlar
      if (error.response?.status === 403) {
        throw new Error('Çeviri kotası aşıldı. Lütfen daha sonra tekrar deneyin.');
      }
      if (error.response?.status === 400) {
        throw new Error('Geçersiz dil kodu.');
      }
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('İnternet bağlantısı hatası. Lütfen kontrol edin.');
      }

      throw new Error('Çeviri yapılırken bir hata oluştu.');
    }
  }

  /**
   * Metindeki dili otomatik algılar
   * Google Cloud Translation API detection endpoint kullanır
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://translation.googleapis.com/language/translate/v2/detect',
        {
          q: text,
        },
        {
          params: {
            key: this.config.apiKey,
          },
          timeout: this.config.timeout,
        }
      );

      const detectedLanguage = response.data.data.detections[0][0].language;
      console.log('[TranslationService] 🔍 Detected language:', detectedLanguage);
      return detectedLanguage;
    } catch (error) {
      console.error('[TranslationService] ❌ Language detection error:', error);
      return this.config.defaultSourceLanguage; // Fallback to English
    }
  }
}

export const translationService = TranslationService.getInstance();
export * from './types';

