import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { translationService } from '../services/TranslationService';
import { TranslationCacheService } from '../services/TranslationCacheService';

interface UsePostTranslationParams {
  postId: string;
  originalContent: string;
  enabled?: boolean;
}

/**
 * Basit Türkçe tespit heuristic'i.
 * Türkçeye özgü karakterler veya yaygın Türkçe kelimeler içeriyorsa true döner.
 */
const detectIsTurkish = (text: string): boolean => {
  // Türkçeye özgü karakterler (ş, ğ, ç, ı, İ, Ş, Ğ, Ç)
  if (/[şŞğĞıİçÇ]/.test(text)) return true;
  // Yaygın Türkçe kelimeler
  const turkishWords = /\b(ve|bir|bu|ile|için|olan|gibi|daha|çok|ama|ancak|fakat|değil|olarak|kadar|nasıl|neden|bence|güzel|iyi|kötü|benim|senin|onun|ürün|telefon|ekran|çünkü|oldu|aldım|yaptım|kullanıyorum|tavsiye|denedim|memnunum)\b/i;
  return turkishWords.test(text);
};

export const usePostTranslation = ({
  postId,
  originalContent,
  enabled = true,
}: UsePostTranslationParams) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);

  // İçerik diline göre kaynak ve hedef dili otomatik belirle
  const { sourceLanguage, targetLanguage } = useMemo(() => {
    const isTurkish = detectIsTurkish(originalContent);
    return {
      sourceLanguage: isTurkish ? 'tr' : 'en',
      targetLanguage: isTurkish ? 'en' : 'tr',
    };
  }, [originalContent]);

  const shouldTranslate = enabled;

  const {
    data: translatedContent,
    isLoading: isTranslating,
    error,
  } = useQuery({
    queryKey: ['translation', postId, sourceLanguage, targetLanguage],
    queryFn: async () => {
      // 1. Önce cache'e bak
      const cached = await TranslationCacheService.get(
        postId,
        originalContent,
        sourceLanguage,
        targetLanguage
      );

      if (cached) {
        return cached;
      }

      // 2. Cache'de yoksa Google API'ye istek at
      const translated = await translationService.translate(
        originalContent,
        targetLanguage,
        sourceLanguage
      );

      // 3. Çeviriyi cache'e kaydet
      await TranslationCacheService.set(
        postId,
        originalContent,
        translated,
        sourceLanguage,
        targetLanguage
      );

      return translated;
    },
    enabled: Boolean(shouldTranslate && manualTrigger), // Sadece manuel tetiklendiğinde çalış
    staleTime: Infinity, // Cache sonsuza kadar fresh
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 gün (React Query cache)
  });

  const toggleTranslation = () => {
    if (!manualTrigger) {
      // İlk tıklamada çeviriyi tetikle
      setManualTrigger(true);
      setShowTranslation(true);
    } else {
      // Her tıklamada çeviriyi göster/gizle
      setShowTranslation(!showTranslation);
    }
  };

  return {
    translatedContent: translatedContent || '',
    isTranslating,
    error,
    showTranslation,
    toggleTranslation,
    shouldTranslate,
  };
};
