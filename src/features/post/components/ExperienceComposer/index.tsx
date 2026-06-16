import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Keyboard, ActivityIndicator, TextInput } from 'react-native';
import { Box, VStack, HStack, Text, Pressable, useToast } from '@gluestack-ui/themed';
import { ChevronDownIcon, TagIcon, CubeIcon } from 'react-native-heroicons/outline';
import { StarIcon as StarIconSolid } from 'react-native-heroicons/solid';
import { FormProvider } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { showCustomToast } from '@/src/components/CustomToast';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import { OptionSelectBottomSheet, type OptionSelectBottomSheetOption } from '../CreateExperienceSteps/OptionSelectBottomSheet';
import { ControlledTextarea } from '../FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../FormFields/ControlledImagePicker';
import { useExperiencePostForm } from '../../hooks/useExperiencePostForm';
import { useCreateExperiencePost, useSplitExperience, useGetExperienceOptions, invalidateCatalogPosts } from '../../api/hooks';
import { useAddInventoryItem } from '@/src/features/profile/api/hooks';
import { useSyncInventoryToStore } from '../../hooks/useSyncInventoryToStore';
import { useCreatePostFlowStore } from '../../store/createPostFlowStore';
import { mapProductInfoTypeToContextType } from '../../types';
import { ProductInfoType } from '@/src/types/common';
import { navigateAfterPostCreate } from '../../utils/navigateAfterPostCreate';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import type { ExperienceOption } from '../../api/postApi';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExperiencePostFormData } from '../../schemas/experiencePostSchema';

export interface ExperienceComposerHandle {
  submit: () => void;
}

export interface ExperienceComposerProductContext {
  id: string;
  name: string;
  brand?: string;
  subName?: string;
  image?: any;
}

interface ExperienceComposerProps {
  productContext?: ExperienceComposerProductContext | null;
  onStateChange?: (state: { canShare: boolean; isLoading: boolean }) => void;
}

const TRIGGER_HEIGHT = 44;

/**
 * Deneyim (experience) paylaşımının kompakt, inline composer'ı.
 * - Ürün tanımlama alanı YOK (ürün CreatePostScreen'deki context picker'dan gelir).
 * - Metin ve görsel için CreatePostScreen ile AYNI paylaşılan core input'lar
 *   (ControlledTextarea / ControlledImagePicker) kullanılır — tekrar yok.
 * - Akış: durum (Sahibim/Denedim) → süre/konum/amaç → deneyim metni → AI analiz
 *   → fiyat/ürün puanlama → Paylaş. Parent Header'a ref ile bağlanır.
 */
export const ExperienceComposer = forwardRef<ExperienceComposerHandle, ExperienceComposerProps>(
  ({ productContext, onStateChange }, ref) => {
    const { t } = useTranslation('post');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const toast = useToast();
    const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
    const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });

    useSyncInventoryToStore();

    const methods = useExperiencePostForm(
      productContext
        ? {
            selectedProduct: {
              id: productContext.id,
              name: productContext.name,
              brand: productContext.brand,
              description: productContext.subName,
              image: productContext.image,
            },
          }
        : undefined,
    );
    const { handleSubmit, setValue, getValues, watch, validateStep } = methods;

    const createExperiencePostMutation = useCreateExperiencePost();
    const splitExperienceMutation = useSplitExperience();
    const addInventoryItemMutation = useAddInventoryItem();
    const { user } = useAppStore();
    const queryClient = useQueryClient();

    const { data: experienceOptions } = useGetExperienceOptions();
    const durations = experienceOptions?.durations ?? [];
    const locations = experienceOptions?.locations ?? [];
    const purposes = experienceOptions?.purposes ?? [];

    const contextType = useCreatePostFlowStore(state => state.contextType);
    const contextId = useCreatePostFlowStore(state => state.contextId);
    const productInfoSnapshot = useCreatePostFlowStore(state => state.productInfoSnapshot);
    const clearFlow = useCreatePostFlowStore(state => state.clearFlow);

    const [experienceOption, setExperienceOption] = useState<'own' | 'tried'>('own');
    const [experienceSnippetId, setExperienceSnippetId] = useState<string | undefined>(undefined);
    const [isSplitLoading, setIsSplitLoading] = useState(false);
    const [isImagePickerLoading, setIsImagePickerLoading] = useState(false);
    const isSubmittingRef = useRef(false);

    const selectedProduct = watch('selectedProduct');
    const step1Duration = watch('step1Duration');
    const selectedCondition = watch('selectedCondition');
    const selectedFrequency = watch('selectedFrequency');
    const experienceText = watch('experienceText');
    const priceRating = watch('priceRating');
    const productRating = watch('productRating');
    const priceExperienceText = watch('priceExperienceText');
    const productExperienceText = watch('productExperienceText');

    // ---- Süre / Konum / Amaç select'leri (StepOne mantığı, inline) ----
    const translateName = useCallback(
      (name: string): string => {
        const key = `create.experience.step1.optionNames.${name}`;
        const translated = t(key);
        return translated === key ? name : translated;
      },
      [t],
    );
    const toSheetOptions = useCallback(
      (options: ExperienceOption[]): OptionSelectBottomSheetOption[] =>
        options.map(opt => ({ label: translateName(opt.name), value: opt.id })),
      [translateName],
    );
    const findName = useCallback(
      (options: ExperienceOption[], id: string): string => {
        const name = options.find(opt => opt.id === id)?.name ?? '';
        return name ? translateName(name) : '';
      },
      [translateName],
    );

    const durationDisplay = useMemo(() => findName(durations, step1Duration || ''), [findName, durations, step1Duration]);
    const locationDisplay = useMemo(() => findName(locations, selectedCondition || ''), [findName, locations, selectedCondition]);
    const purposeDisplay = useMemo(() => findName(purposes, selectedFrequency || ''), [findName, purposes, selectedFrequency]);

    const openSelectSheet = useCallback(
      (title: string, options: OptionSelectBottomSheetOption[], value: string, onChange: (v: string) => void) => {
        openBottomSheet(
          <OptionSelectBottomSheet title={title} options={options} selectedValue={value} onSelect={onChange} onClose={closeBottomSheet} />,
          {
            enableDynamicSizing: false,
            snapPoints: ['40%'],
            enablePanDownToClose: true,
            enableOverDrag: false,
            enableHandlePanningGesture: true,
            enableContentPanningGesture: true,
            animateOnMount: true,
            paddingBottom: bottomOffset,
          },
        );
      },
      [openBottomSheet, closeBottomSheet, bottomOffset],
    );

    const renderSelectTrigger = (label: string, displayValue: string, onPress: () => void) => (
      <Pressable onPress={onPress}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
          borderWidth={1}
          borderColor={isDark ? '#333333' : '#E9E9E9'}
          borderRadius={10}
          height={TRIGGER_HEIGHT}
          px="$3"
        >
          <Text fontSize={14} fontWeight="$medium" color={displayValue ? (isDark ? '$textDark50' : '#000000') : '#8C8C8C'} flex={1}>
            {displayValue || label}
          </Text>
          <ChevronDownIcon width={20} height={20} color={isDark ? '#FFFFFF' : '#000000'} />
        </Box>
      </Pressable>
    );

    // ---- Görsel seçimi (paylaşılan ControlledImagePicker için handler'lar) ----
    const handleImagePicker = async () => {
      setIsImagePickerLoading(true);
      try {
        const currentImages = getValues('selectedImages') || [];
        const remainingSlots = 10 - currentImages.length;
        if (remainingSlots <= 0) {
          showCustomToast(toast, {
            title: t('create.toast.limitExceeded.title'),
            description: t('create.toast.limitExceeded.description'),
            action: 'error',
          });
          return;
        }
        const result = await imagePickerService.pickMultipleFromGallery(remainingSlots);
        if (result.success && result.assets && result.assets.length > 0) {
          const uris = result.assets.map(a => a.uri).filter((u): u is string => !!u);
          if (uris.length > 0) setValue('selectedImages', [...currentImages, ...uris], { shouldValidate: false });
        } else if (result.error) {
          showCustomToast(toast, { title: t('create.common.errors.title'), description: result.error, action: 'error' });
        }
      } catch (error: any) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: error?.message || t('create.common.validation.imagePickerError'),
          action: 'error',
        });
      } finally {
        setIsImagePickerLoading(false);
      }
    };

    const handleRemoveImage = (index: number) => {
      const currentImages = getValues('selectedImages') || [];
      setValue(
        'selectedImages',
        currentImages.filter((_, i) => i !== index),
        { shouldValidate: false },
      );
    };

    // ---- AI split ----
    const handleAnalyze = async () => {
      const isValid = await validateStep(1);
      if (!isValid) return;
      if (!selectedProduct?.id) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: t('create.experience.validation.productNotSelected'),
          action: 'error',
        });
        return;
      }
      if (!experienceText || experienceText.trim().length < 10) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: t('create.experience.validation.experienceTextTooShort'),
          action: 'error',
        });
        return;
      }
      Keyboard.dismiss();
      setIsSplitLoading(true);
      try {
        const response = await splitExperienceMutation.mutateAsync({
          productId: selectedProduct.id,
          experienceText: experienceText.trim(),
        });
        const trimTrailingParen = (s: string) => (s || '').replace(/\s*\(\s*$/, '').trim();
        setValue('priceExperienceText', response.priceAndShopping ? trimTrailingParen(response.priceAndShopping.content) : '');
        setValue('priceRating', 0);
        setValue('productExperienceText', response.productAndUsage ? trimTrailingParen(response.productAndUsage.content) : '');
        setValue('productRating', 0);
        const snippetId = response.experienceSnippetId;
        if (typeof snippetId !== 'string' || snippetId.trim().length === 0) {
          showCustomToast(toast, {
            title: t('create.common.errors.title'),
            description: t('create.experience.ai.structureError'),
            action: 'error',
          });
          return;
        }
        setExperienceSnippetId(snippetId);
      } catch (error: any) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: error?.message || t('create.experience.ai.generalError'),
          action: 'error',
        });
      } finally {
        setIsSplitLoading(false);
      }
    };

    const onSubmit = async (data: ExperiencePostFormData) => {
      if (isSubmittingRef.current) return;
      const resolvedContextType = contextType ?? ProductInfoType.PRODUCT;
      const resolvedContextId = contextId ?? data.selectedProduct?.id;
      if (!resolvedContextId || !data.selectedProduct?.id) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: t('create.experience.validation.productSelectionRequired'),
          action: 'error',
        });
        return;
      }
      const apiContextType = mapProductInfoTypeToContextType(resolvedContextType);

      const experience: Array<{ type: 'price_and_shopping' | 'product_and_usage'; content: string; rating: number }> = [];
      if (data.priceExperienceText && data.priceRating) {
        experience.push({ type: 'price_and_shopping', content: data.priceExperienceText, rating: data.priceRating });
      }
      if (data.productExperienceText && data.productRating) {
        experience.push({ type: 'product_and_usage', content: data.productExperienceText, rating: data.productRating });
      }
      if (experience.length === 0) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: t('create.experience.validation.experienceCategoryRequired'),
          action: 'error',
        });
        return;
      }

      const selectedDurationId = data.step1Duration;
      const selectedLocationId = data.selectedCondition;
      const selectedPurposeId = data.selectedFrequency;
      if (!selectedDurationId || !selectedLocationId || !selectedPurposeId) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: t('create.experience.validation.durationRequired'),
          action: 'error',
        });
        return;
      }

      isSubmittingRef.current = true;
      const status: 'own' | 'tested' = experienceOption === 'own' ? 'own' : 'tested';
      const willAddToInventory = experienceOption === 'own' && !!data.selectedProduct?.id;
      let inventoryCreatedPost = false;

      try {
        if (willAddToInventory) {
          try {
            await addInventoryItemMutation.mutateAsync({
              productId: data.selectedProduct.id,
              selectedDurationId,
              selectedLocationId,
              selectedPurposeId,
              content: data.experienceText || '',
              experience,
              status: 'own' as const,
            });
            inventoryCreatedPost = true;
          } catch (inventoryError: any) {
            const errMsg =
              inventoryError?.response?.data?.error?.message ||
              inventoryError?.response?.data?.message ||
              inventoryError?.message ||
              '';
            const alreadyExists = /inventory already exists|already exists for this product/i.test(errMsg);
            if (!alreadyExists) {
              showCustomToast(toast, {
                title: t('create.experience.inventory.addError.title'),
                description: errMsg || t('create.experience.inventory.addError.description'),
                action: 'error',
              });
              isSubmittingRef.current = false;
              return;
            }
          }
        }

        if (!inventoryCreatedPost) {
          if (!experienceSnippetId || experienceSnippetId.trim() === '') {
            showCustomToast(toast, {
              title: t('create.common.errors.title'),
              description: t('create.experience.ai.splitRequired'),
              action: 'error',
            });
            isSubmittingRef.current = false;
            return;
          }
          await createExperiencePostMutation.mutateAsync({
            contextType: apiContextType,
            contextId: resolvedContextId,
            productId: data.selectedProduct?.id,
            experienceSnippetId,
            selectedDurationId,
            selectedLocationId,
            selectedPurposeId,
            content: data.experienceText,
            experience,
            status,
            images: data.selectedImages || [],
          });
        }

        showCustomToast(toast, {
          title: t('create.experience.success.title'),
          description: t('create.experience.success.description'),
          action: 'success',
        });
        if (apiContextType && resolvedContextId) {
          invalidateCatalogPosts(queryClient, apiContextType, resolvedContextId);
        }
        const savedProductInfo = productInfoSnapshot;
        clearFlow();
        navigateAfterPostCreate(navigation, {
          contextType: resolvedContextType,
          contextId: resolvedContextId,
          productInfo: savedProductInfo,
          userId: user?.id,
        });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || t('create.common.errors.general');
        showCustomToast(toast, { title: t('create.common.errors.title'), description: errorMessage, action: 'error' });
      } finally {
        isSubmittingRef.current = false;
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => handleSubmit(onSubmit)(),
    }));

    const hasRatedEntry =
      (Boolean(priceExperienceText) && (priceRating ?? 0) > 0) || (Boolean(productExperienceText) && (productRating ?? 0) > 0);
    const canShare =
      !!experienceSnippetId && hasRatedEntry && !!step1Duration && !!selectedCondition && !!selectedFrequency && !!selectedProduct;
    const isLoading = createExperiencePostMutation.isPending || addInventoryItemMutation.isPending || isSplitLoading;

    useEffect(() => {
      onStateChange?.({ canShare, isLoading });
    }, [canShare, isLoading, onStateChange]);

    const analyzeEnabled =
      !!selectedProduct &&
      !!step1Duration &&
      !!selectedCondition &&
      !!selectedFrequency &&
      (experienceText?.trim().length ?? 0) >= 10 &&
      !isSplitLoading;

    // ---- Puanlama yıldızları ----
    const renderStars = (rating: number, onChange: (r: number) => void) => (
      <HStack space="xs">
        {[1, 2, 3, 4, 5].map(star => (
          <Pressable key={star} onPress={() => onChange(star)}>
            <StarIconSolid width={24} height={24} color={star <= (rating ?? 0) ? '#829905' : '#E9E9E9'} />
          </Pressable>
        ))}
      </HStack>
    );

    const renderExperienceRatingCard = (
      Icon: typeof TagIcon,
      title: string,
      text: string,
      onTextChange: (v: string) => void,
      placeholder: string,
      rating: number,
      onRatingChange: (r: number) => void,
    ) => (
      <Box
        bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
        borderWidth={1}
        borderColor={isDark ? '#333333' : '#E9E9E9'}
        borderRadius={10}
        overflow="hidden"
      >
        <VStack px={16} py={8} space="xs">
          <HStack alignItems="center" space="xs">
            <Icon width={18} height={18} color={isDark ? '#FFFFFF' : '#000000'} />
            <Text fontSize={14} fontWeight="$semibold" color={isDark ? '$textDark50' : '#3B3B3B'}>
              {title}
            </Text>
          </HStack>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#8C8C8C"
            value={text}
            onChangeText={onTextChange}
            multiline
            scrollEnabled={false}
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: isDark ? '#F5F5F5' : '#000000',
              textAlignVertical: 'top',
              minHeight: 56,
              padding: 0,
            }}
          />
          {renderStars(rating, onRatingChange)}
        </VStack>
      </Box>
    );

    return (
      <FormProvider {...methods}>
        <VStack space="md">
          {/* Ürün durumu: Sahibim / Test Ettim — segmented radio butonlar */}
          <HStack px={16} space="sm">
            {[
              { value: 'own' as const, label: t('create.experience.inventory.iOwn', 'Sahibim') },
              { value: 'tried' as const, label: t('create.experience.inventory.iTried', 'Test Ettim') },
            ].map(({ value, label }) => {
              const selected = experienceOption === value;
              return (
                <Pressable
                  key={value}
                  flex={1}
                  onPress={() => setExperienceOption(value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Box
                    h={48}
                    borderRadius={10}
                    alignItems="center"
                    justifyContent="center"
                    bg={selected ? (isDark ? '#2A2E15' : '#EDF2C9') : isDark ? '#2A2A2A' : '#F2F2F2'}
                    borderWidth={selected ? 1.5 : 1}
                    borderColor={selected ? '#B8CC04' : isDark ? '#2A2A2A' : '#F2F2F2'}
                  >
                    <Text fontSize={14} fontWeight="$semibold" color={selected ? '#758600' : '#9D9D9D'}>
                      {label}
                    </Text>
                  </Box>
                </Pressable>
              );
            })}
          </HStack>

          {/* Süre / Konum / Amaç */}
          <VStack px={16} space="xs">
            {renderSelectTrigger(t('create.experience.step1.selectDuration'), durationDisplay, () =>
              openSelectSheet(t('create.experience.step1.selectDuration'), toSheetOptions(durations), step1Duration || '', v => setValue('step1Duration', v, { shouldValidate: true })),
            )}
            {renderSelectTrigger(t('create.experience.step1.selectLocation'), locationDisplay, () =>
              openSelectSheet(t('create.experience.step1.selectLocation'), toSheetOptions(locations), selectedCondition || '', v => setValue('selectedCondition', v, { shouldValidate: true })),
            )}
            {renderSelectTrigger(t('create.experience.step1.selectPurpose'), purposeDisplay, () =>
              openSelectSheet(t('create.experience.step1.selectPurpose'), toSheetOptions(purposes), selectedFrequency || '', v => setValue('selectedFrequency', v, { shouldValidate: true })),
            )}
          </VStack>

          {/* Deneyim metni — paylaşılan core input */}
          <VStack px={16} space="xs">
            <ControlledTextarea
              name="experienceText"
              placeholder={t('create.experience.step2.experiencePlaceholder')}
              maxLength={500}
              label={t('create.experience.step2.experience')}
            />
          </VStack>

          {/* Görseller — paylaşılan core input */}
          <VStack px={16} space="xs">
            <ControlledImagePicker
              name="selectedImages"
              label={t('create.experience.step2.images')}
              maxImages={10}
              onImagePicker={handleImagePicker}
              onRemoveImage={handleRemoveImage}
              isLoading={isImagePickerLoading}
            />
          </VStack>

          {/* AI analiz / split */}
          {!experienceSnippetId && (
            <VStack px={16}>
              <Pressable
                onPress={handleAnalyze}
                disabled={!analyzeEnabled}
                bg={analyzeEnabled ? '#D0F205' : '#EDEDED'}
                borderWidth={1}
                borderColor={analyzeEnabled ? '#B8CC04' : '#B1B1B1'}
                borderRadius={25}
                h={48}
                alignItems="center"
                justifyContent="center"
              >
                {isSplitLoading ? (
                  <ActivityIndicator size="small" color="#111111" />
                ) : (
                  <Text color={analyzeEnabled ? '#111111' : '#B1B1B1'} fontSize="$sm" fontWeight="$semibold">
                    {t('create.experience.ai.analyze', 'AI ile analiz et')}
                  </Text>
                )}
              </Pressable>
            </VStack>
          )}

          {/* Fiyat / Ürün deneyimi + puanlama (analiz sonrası) */}
          {!!experienceSnippetId && (
            <VStack px={16} space="md">
              {renderExperienceRatingCard(
                TagIcon,
                t('create.experience.step3.priceAndShopping'),
                priceExperienceText || '',
                v => setValue('priceExperienceText', v),
                t('create.experience.step3.priceExperiencePlaceholder'),
                priceRating,
                r => setValue('priceRating', r, { shouldValidate: true }),
              )}
              {renderExperienceRatingCard(
                CubeIcon,
                t('create.experience.step3.productAndUsage'),
                productExperienceText || '',
                v => setValue('productExperienceText', v),
                t('create.experience.step3.productExperiencePlaceholder'),
                productRating,
                r => setValue('productRating', r, { shouldValidate: true }),
              )}
            </VStack>
          )}
        </VStack>
      </FormProvider>
    );
  },
);

ExperienceComposer.displayName = 'ExperienceComposer';
