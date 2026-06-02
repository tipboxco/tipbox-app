import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { translationService } from '../services/TranslationService';
import { TranslationCacheService } from '../services/TranslationCacheService';

interface UsePostTranslationParams {
  postId: string;
  originalContent: string;
  postLanguage?: string;
  enabled?: boolean;
}

export const usePostTranslation = ({
  postId,
  originalContent,
  postLanguage,
  enabled = true,
}: UsePostTranslationParams) => {
  const { i18n } = useTranslation();
  const [showTranslation, setShowTranslation] = useState(false);
  const [manualTrigger, setManualTrigger] = useState(false);

  // Hedef dil her zaman cihaz/uygulama dili olmalı
  // Kaynak dil otomatik algılanacak (Google API auto-detect)
  const targetLanguage = useMemo(() => {
    return i18n.language?.startsWith('tr') ? 'tr' : 'en';
  }, [i18n.language]);

  // Show translate button only when post language differs from user's language.
  // If postLanguage is not provided, show the button (backward compat).
  const shouldTranslate = useMemo(() => {
    if (!enabled) return false;
    if (!postLanguage) return true;
    const postLang = postLanguage.toLowerCase().slice(0, 2);
    const userLang = targetLanguage.toLowerCase().slice(0, 2);
    return postLang !== userLang;
  }, [enabled, postLanguage, targetLanguage]);

  const {
    data: translatedContent,
    isLoading: isTranslating,
    error,
  } = useQuery({
    queryKey: ['translation', postId, targetLanguage],
    queryFn: async () => {
      // 1. Önce cache'e bak
      const cached = await TranslationCacheService.get(
        postId,
        originalContent,
        'auto',
        targetLanguage
      );

      // Cache'den dönen sonuç orijinal metinle aynıysa bozuk cache - yok say
      if (cached && cached.trim() !== originalContent.trim()) {
        return cached;
      }

      // Bozuk cache varsa temizle
      if (cached) {
        await TranslationCacheService.remove(postId, 'auto', targetLanguage);
      }

      // 2. Cache'de yoksa Google API'ye istek at (sourceLanguage yok, auto-detect)
      const translated = await translationService.translate(
        originalContent,
        targetLanguage
      );

      // 3. Çeviri orijinalden farklıysa cache'e kaydet (aynıysa bozuk sonuç)
      if (translated.trim() !== originalContent.trim()) {
        await TranslationCacheService.set(
          postId,
          originalContent,
          translated,
          'auto',
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
