export interface TranslationServiceConfig {
  apiKey: string;
  defaultSourceLanguage: string;
  timeout: number;
}

export interface ITranslationService {
  translate(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string>;
  detectLanguage(text: string): Promise<string>;
}

