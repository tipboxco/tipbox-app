import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { translationService } from '../services/TranslationService';
import { TranslationCacheService } from '../services/TranslationCacheService';

interface UsePostTranslationParams {
  postId: string;
  originalContent: string;
  enabled?: boolean;
}

export const usePostTranslation = ({
  postId,
  originalContent,
  enabled = true,
}: UsePostTranslationParams) => {
  const { i18n } = useTranslation();
  const [showTranslation, setShowTranslation] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);

  // Uygulama diline göre hedef dili belirle
  // Uygulama TR ise → EN'e çevir, uygulama EN ise → TR'ye çevir
  const { sourceLanguage, targetLanguage } = useMemo(() => {
    const appLanguage = i18n.language?.startsWith('tr') ? 'tr' : 'en';
    return {
      sourceLanguage: appLanguage,
      targetLanguage: appLanguage === 'tr' ? 'en' : 'tr',
    };
  }, [i18n.language]);

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

      // Cache'den dönen sonuç orijinal metinle aynıysa bozuk cache - yok say
      if (cached && cached.trim() !== originalContent.trim()) {
        return cached;
      }

      // Bozuk cache varsa temizle
      if (cached) {
        await TranslationCacheService.remove(postId, sourceLanguage, targetLanguage);
      }

      // 2. Cache'de yoksa Google API'ye istek at
      const translated = await translationService.translate(
        originalContent,
        targetLanguage,
        sourceLanguage
      );

      // 3. Çeviri orijinalden farklıysa cache'e kaydet (aynıysa bozuk sonuç)
      if (translated.trim() !== originalContent.trim()) {
        await TranslationCacheService.set(
          postId,
          originalContent,
          translated,
          sourceLanguage,
          targetLanguage
        );
      }

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
