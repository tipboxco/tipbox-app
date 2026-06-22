import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Keyboard,
  TextInput,
} from 'react-native';
import { Box, ScrollView, VStack, HStack, Text, Pressable } from '@gluestack-ui/themed';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TagIcon, CubeIcon } from 'react-native-heroicons/outline';
import { StarIcon as StarIconSolid } from 'react-native-heroicons/solid';

import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useToast } from '@gluestack-ui/themed';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { showCustomToast } from '@/src/components/CustomToast';
import { useSplitExperience, useCreateUpdatePost } from '../api/hooks';
import { navigateAfterPostCreate } from '../utils/navigateAfterPostCreate';
import { useAppStore } from '@/src/store/appStore';
import type { PostStackParamList } from '../navigation';

type UpdateRatingNavigationProp = NativeStackNavigationProp<PostStackParamList>;
type UpdateRatingRouteProp = RouteProp<PostStackParamList, 'UpdateRating'>;

/**
 * Gemini AI split servisi kullanılamadığında (503/rate limit) yerel sentinel.
 * Bu durumda kullanıcının kendi metni "Ürün ve Kullanım" segmenti olur ve snippet gönderilmez.
 */
const FALLBACK_SNIPPET_ID = 'local-fallback';

/**
 * Update puanlama (AI split) ekranı — experience akışının update karşılığı.
 * Akış: CreateUpdatePostScreen'de içerik girilir → "Devam Et" → bu ekran açılır →
 * mount'ta split çalışır (fallback dahil) → kullanıcı segmentleri puanlar → Paylaş ile
 * update gönderisi (segmentli) oluşturulur.
 */
export const UpdateRatingScreen: React.FC = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<UpdateRatingNavigationProp>();
  const route = useRoute<UpdateRatingRouteProp>();
  const { t } = useTranslation('post');
  const toast = useToast();
  const { user } = useAppStore();
  const draft = route.params?.draft;

  const splitExperienceMutation = useSplitExperience();
  const createUpdatePostMutation = useCreateUpdatePost();

  const [snippetId, setSnippetId] = useState<string | undefined>(undefined);
  const [isSplitLoading, setIsSplitLoading] = useState(true);
  const [priceText, setPriceText] = useState('');
  const [priceRating, setPriceRating] = useState(0);
  const [productText, setProductText] = useState('');
  const [productRating, setProductRating] = useState(0);
  const didRunSplitRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // Fallback: kullanıcının kendi metni "Ürün ve Kullanım" segmenti olur.
  const applyFallback = useCallback(() => {
    setPriceText('');
    setPriceRating(0);
    setProductText((draft?.content || '').trim());
    setProductRating(0);
  }, [draft?.content]);

  // Mount'ta AI split çalıştır — hata akışı engellemez (fallback).
  useEffect(() => {
    if (!draft || didRunSplitRef.current) return;
    didRunSplitRef.current = true;
    Keyboard.dismiss();
    const trimTrailingParen = (s: string) =>
      (s || '').replace(/\s*\(\s*$/, '').trim();
    (async () => {
      try {
        const response = await splitExperienceMutation.mutateAsync({
          productId: draft.productId,
          experienceText: (draft.content || '').trim(),
        });
        const id = response.experienceSnippetId;
        if (typeof id !== 'string' || id.trim().length === 0) {
          applyFallback();
          setSnippetId(FALLBACK_SNIPPET_ID);
        } else {
          setPriceText(
            response.priceAndShopping
              ? trimTrailingParen(response.priceAndShopping.content)
              : ''
          );
          setProductText(
            response.productAndUsage
              ? trimTrailingParen(response.productAndUsage.content)
              : ''
          );
          setSnippetId(id);
        }
      } catch {
        applyFallback();
        setSnippetId(FALLBACK_SNIPPET_ID);
      } finally {
        setIsSplitLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasRatedEntry =
    (Boolean(priceText) && priceRating > 0) ||
    (Boolean(productText) && productRating > 0);

  const handleShare = useCallback(async () => {
    if (isSubmittingRef.current || !draft) return;
    if (!hasRatedEntry) {
      showCustomToast(toast, {
        title: t('create.experience.ai.ratePromptTitle', 'Puanlama gerekli'),
        description: t(
          'create.experience.ai.ratePrompt',
          'Lütfen deneyiminizi yıldızlarla puanlayıp tekrar paylaşın.'
        ),
        action: 'error',
      });
      return;
    }

    const experience: Array<{
      type: 'price_and_shopping' | 'product_and_usage';
      content: string;
      rating: number;
    }> = [];
    if (priceText && priceRating > 0) {
      experience.push({
        type: 'price_and_shopping',
        content: priceText,
        rating: priceRating,
      });
    }
    if (productText && productRating > 0) {
      experience.push({
        type: 'product_and_usage',
        content: productText,
        rating: productRating,
      });
    }

    isSubmittingRef.current = true;
    try {
      const realSnippetId =
        snippetId && snippetId !== FALLBACK_SNIPPET_ID ? snippetId : undefined;
      await createUpdatePostMutation.mutateAsync({
        contextType: 'product',
        contextId: draft.contextId || '',
        content: draft.content,
        experiencePostId: draft.experiencePostId,
        experience,
        experienceSnippetId: realSnippetId,
        images: draft.selectedImages || [],
      });

      showCustomToast(toast, {
        title: t('create.update.success.postCreated.title'),
        description: t('create.update.success.postCreated.description'),
        action: 'success',
      });

      navigateAfterPostCreate(navigation, {
        contextType: ProductInfoType.PRODUCT,
        contextId: draft.contextId || draft.productId,
        productInfo: {
          image: draft.productImage,
          title: draft.productTitle,
          subName: draft.productSubName,
        },
        userId: user?.id,
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        t('create.common.errors.general');
      showCustomToast(toast, {
        title: t('create.common.errors.title'),
        description: errorMessage,
        action: 'error',
      });
    } finally {
      isSubmittingRef.current = false;
    }
  }, [
    draft,
    hasRatedEntry,
    priceText,
    priceRating,
    productText,
    productRating,
    snippetId,
    createUpdatePostMutation,
    navigation,
    toast,
    t,
    user?.id,
  ]);

  const bgColor = isDark ? '#1A1A1A' : '#FAFAFA';
  const isShareLoading = createUpdatePostMutation.isPending;

  if (!draft) {
    navigation.goBack();
    return null;
  }

  const renderStars = (rating: number, onChange: (r: number) => void) => (
    <HStack space="sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange(star)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <StarIconSolid
            width={36}
            height={36}
            color={star <= rating ? '#829905' : '#E9E9E9'}
          />
        </Pressable>
      ))}
    </HStack>
  );

  const renderRatingCard = (
    Icon: typeof TagIcon,
    title: string,
    text: string,
    onTextChange: (v: string) => void,
    placeholder: string,
    rating: number,
    onRatingChange: (r: number) => void
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
          <Text
            fontSize={14}
            fontWeight="$semibold"
            color={isDark ? '$textDark50' : '#3B3B3B'}
          >
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
        <Text
          fontSize={13}
          fontWeight="$semibold"
          color={isDark ? '$textDark400' : '#6B7280'}
          mt="$1"
        >
          {t('create.experience.step3.rateExperience')}
        </Text>
        {renderStars(rating, onRatingChange)}
      </VStack>
    </Box>
  );

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: bgColor }}
    >
      <Box flex={1}>
        <Header
          title={t('create.experience.rateStepTitle', 'Deneyimini puanla')}
          leftAction="back"
          onLeftActionPress={() => navigation.goBack()}
          rightButton={{
            text: t('create.header.share'),
            backgroundColor: '#D0F205',
            borderWidth: 1,
            borderColor: '#B8CC04',
            textColor: '#111111',
            fontSize: 11,
            borderRadius: 25,
            paddingX: 10,
            paddingY: 10,
            onPress: handleShare,
            loading: isShareLoading,
          }}
        />
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        >
          <VStack px={16} space="md">
            {/* Ürün preview kartı */}
            <Box
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor={isDark ? '#333333' : '#E9E9E9'}
              borderRadius={10}
              p={12}
            >
              <ProductInfoCard
                image={draft.productImage}
                title={draft.productTitle}
                subName={draft.productSubName}
                size="big"
                type={ProductInfoType.PRODUCT}
              />
            </Box>

            {isSplitLoading ? (
              <VStack alignItems="center" py="$6" space="sm">
                <ActivityIndicator size="small" color="#829905" />
                <Text fontSize="$sm" color={isDark ? '#9CA3AF' : '#6B7280'}>
                  {t('create.experience.ai.processingContent')}
                </Text>
              </VStack>
            ) : (
              <>
                {renderRatingCard(
                  TagIcon,
                  t('create.experience.step3.priceAndShopping'),
                  priceText,
                  setPriceText,
                  t('create.experience.step3.priceExperiencePlaceholder'),
                  priceRating,
                  setPriceRating
                )}
                {renderRatingCard(
                  CubeIcon,
                  t('create.experience.step3.productAndUsage'),
                  productText,
                  setProductText,
                  t('create.experience.step3.productExperiencePlaceholder'),
                  productRating,
                  setProductRating
                )}
              </>
            )}
          </VStack>
        </ScrollView>
      </Box>
    </SafeAreaView>
  );
};

export default UpdateRatingScreen;
