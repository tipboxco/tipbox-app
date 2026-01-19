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
  private isEnabled: boolean = false;

  private constructor() {
    this.config = {
      apiKey: GOOGLE_TRANSLATE_API_KEY || '',
      defaultSourceLanguage: 'en', // App İngilizce
      timeout: 10000, // 10 saniye
    };

    // API key kontrolü - hata fırlatmak yerine service'i devre dışı bırak
    if (!this.config.apiKey || this.config.apiKey === 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX' || this.config.apiKey.trim() === '') {
      console.warn('[TranslationService] ⚠️ GOOGLE_TRANSLATE_API_KEY eksik veya geçersiz! Translation service devre dışı.');
      this.isEnabled = false;
    } else {
      this.isEnabled = true;
      console.log('[TranslationService] ✅ Translation service aktif');
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
    // Service devre dışıysa orijinal metni döndür
    if (!this.isEnabled) {
      console.warn('[TranslationService] ⚠️ Translation service devre dışı, orijinal metin döndürülüyor');
      return text;
    }

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
    // Service devre dışıysa default language döndür
    if (!this.isEnabled) {
      console.warn('[TranslationService] ⚠️ Translation service devre dışı, default language döndürülüyor');
      return this.config.defaultSourceLanguage;
    }

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

  /**
   * Service'in aktif olup olmadığını kontrol eder
   */
  get enabled(): boolean {
    return this.isEnabled;
  }
}

export const translationService = TranslationService.getInstance();
export * from './types';

