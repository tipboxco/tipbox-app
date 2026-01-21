import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { translationService } from '../services/TranslationService';
import { TranslationCacheService } from '../services/TranslationCacheService';

interface UsePostTranslationParams {
  postId: string;
  originalContent: string;
  targetLanguage: string;
  sourceLanguage?: string;
  enabled?: boolean;
}

export const usePostTranslation = ({
  postId,
  originalContent,
  targetLanguage,
  sourceLanguage = 'en',
  enabled = true,
}: UsePostTranslationParams) => {
  const [showTranslation, setShowTranslation] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);

  // Aynı dil ise çeviri yapma
  const shouldTranslate = targetLanguage !== sourceLanguage && enabled;

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

