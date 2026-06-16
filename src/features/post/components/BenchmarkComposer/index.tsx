import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Box, VStack, HStack, Text, Pressable, useToast } from '@gluestack-ui/themed';
import { FormProvider, useFormContext, SubmitHandler } from 'react-hook-form';
import { useNavigation } from '@react-navigation/native';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { showCustomToast } from '@/src/components/CustomToast';
import { useBenchmarkPostForm } from '../../hooks/useBenchmarkPostForm';
import { ControlledTextarea } from '../FormFields/ControlledTextarea';
import { useCreateBenchmarkPost } from '../../api/hooks';
import { navigateAfterPostCreate } from '../../utils/navigateAfterPostCreate';
import { useCreatePostFlowStore } from '../../store/createPostFlowStore';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BenchmarkPostFormData } from '../../schemas/benchmarkPostSchema';

export interface BenchmarkComposerHandle {
  submit: () => void;
}

export interface BenchmarkComposerProductContext {
  id: string;
  name: string;
  brand?: string;
  subName?: string;
  image?: any;
  productGroupId?: string;
}

interface BenchmarkComposerProps {
  /** İlk ürün (ekrandaki bağlam ürünü) */
  productContext?: BenchmarkComposerProductContext | null;
  /** Paylaş butonunun aktif/yüklenme durumunu parent'a bildirir */
  onStateChange?: (state: { canShare: boolean; isLoading: boolean }) => void;
}

/**
 * İki ürün de seçiliyken "hangisini öneriyorsun?" (selectedChoice) kompakt
 * segmented seçimi. Her iki ürün seçim input'u CreatePostScreen'de (paylaşılan
 * ProductSelectInput + core ProductPicker) yönetilir.
 */
const BenchmarkWinnerField: React.FC = () => {
  const { t } = useTranslation('post');
  const { watch, setValue } = useFormContext<BenchmarkPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const selectedProduct1 = watch('selectedProduct1');
  const selectedProduct2 = watch('selectedProduct2');
  const selectedChoice = watch('selectedChoice');

  if (!selectedProduct1 || !selectedProduct2) return null;

  return (
    <VStack px={16} space="xs">
      <Text color={isDark ? '$textDark400' : '#B9B9B9'} fontSize="$sm" fontWeight="$bold">
        {t('create.benchmark.whichBetter', 'Hangisini öneriyorsun?')}
      </Text>
      <HStack space="sm">
        {[
          { key: 'product1' as const, product: selectedProduct1 },
          { key: 'product2' as const, product: selectedProduct2 },
        ].map(({ key, product }) => {
          const selected = selectedChoice === key;
          return (
            <Pressable key={key} flex={1} onPress={() => setValue('selectedChoice', key, { shouldValidate: true })}>
              <Box
                h={44}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                px="$2"
                bg={selected ? (isDark ? '#2A2E15' : '#EDF2C9') : isDark ? '#2A2A2A' : '#F2F2F2'}
                borderWidth={selected ? 1.5 : 1}
                borderColor={selected ? '#B8CC04' : isDark ? '#2A2A2A' : '#F2F2F2'}
              >
                <Text fontSize={13} fontWeight="$semibold" color={selected ? '#758600' : '#9D9D9D'} numberOfLines={1}>
                  {product.brand ? `${product.brand} ${product.name}` : product.name}
                </Text>
              </Box>
            </Pressable>
          );
        })}
      </HStack>
    </VStack>
  );
};

/**
 * Benchmark paylaşımının kompakt, inline composer'ı. Ürün seçimleri (1. ve 2.)
 * CreatePostScreen'deki paylaşılan ProductSelectInput + core ProductPicker ile
 * yapılır; bu composer winner seçimi + açıklama + submit'i yönetir. Parent
 * Header "Paylaş" butonuna `ref` ile bağlanır.
 */
export const BenchmarkComposer = forwardRef<BenchmarkComposerHandle, BenchmarkComposerProps>(
  ({ productContext, onStateChange }, ref) => {
    const { t } = useTranslation('post');
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const methods = useBenchmarkPostForm();
    const { handleSubmit, formState, setValue, watch } = methods;
    const toast = useToast();
    const createBenchmarkPostMutation = useCreateBenchmarkPost();
    const isSubmittingRef = useRef(false);
    const { user } = useAppStore();
    const queryClient = useQueryClient();
    const clearFlow = useCreatePostFlowStore(state => state.clearFlow);
    const compareProduct = useCreatePostFlowStore(state => state.compareProduct);

    const selectedProduct1 = watch('selectedProduct1');
    const selectedProduct2 = watch('selectedProduct2');
    const selectedChoice = watch('selectedChoice');
    const postText = watch('postText');

    // 1. ürünü (bağlam ürünü) forma yaz
    useEffect(() => {
      if (!productContext) return;
      const nameParts = productContext.name.split(' ');
      const brand = nameParts.length > 1 ? nameParts[0] : productContext.brand;
      const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : productContext.name;
      setValue(
        'selectedProduct1',
        {
          id: productContext.id,
          name: productName,
          brand,
          subName: productContext.subName ?? '',
          image: productContext.image,
          isOwned: false,
          productGroupId: productContext.productGroupId || '',
        } as any,
        { shouldValidate: true },
      );
    }, [productContext, setValue]);

    // 2. ürünü core ProductPicker'dan gelen store.compareProduct ile senkronla
    useEffect(() => {
      if (compareProduct) {
        const nameParts = compareProduct.title.split(' ');
        const brand = nameParts.length > 1 ? nameParts[0] : undefined;
        const productName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : compareProduct.title;
        setValue(
          'selectedProduct2',
          {
            id: compareProduct.productId,
            name: productName,
            brand,
            subName: compareProduct.subName ?? '',
            image: compareProduct.image,
            isOwned: false,
            productGroupId: '',
          } as any,
          { shouldValidate: true },
        );
      } else {
        setValue('selectedProduct2', null as any, { shouldValidate: true });
        if (watch('selectedChoice') === 'product2') setValue('selectedChoice', undefined as any, { shouldValidate: true });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [compareProduct, setValue]);

    const onSubmit: SubmitHandler<BenchmarkPostFormData> = async data => {
      if (isSubmittingRef.current) return;
      if (!data.selectedProduct1?.id || !data.selectedProduct2?.id) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: t('create.benchmark.validation.twoProductsRequired'),
          action: 'error',
        });
        return;
      }
      const description = (data.postText || '').trim();
      if (!description) {
        showCustomToast(toast, {
          title: t('create.common.errors.title'),
          description: t('create.benchmark.validation.descriptionRequired'),
          action: 'error',
        });
        return;
      }
      isSubmittingRef.current = true;
      try {
        await createBenchmarkPostMutation.mutateAsync({
          contextType: 'product',
          contextId: data.selectedProduct1.id,
          description,
          products: [
            { productId: data.selectedProduct1.id, isSelected: true },
            { productId: data.selectedProduct2.id, isSelected: true },
          ],
          images: data.selectedImages || [],
        });

        showCustomToast(toast, {
          title: t('create.benchmark.success.title'),
          description: t('create.benchmark.success.description'),
          action: 'success',
        });
        clearFlow();

        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: profileKeys.userPosts(user.id) });
          queryClient.invalidateQueries({ queryKey: profileKeys.profile(user.id) });
          queryClient.invalidateQueries({ queryKey: profileKeys.userBenchmarks(user.id) });
        }

        navigateAfterPostCreate(navigation, { userId: user?.id });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || t('create.common.errors.general');
        showCustomToast(toast, { title: t('create.common.errors.title'), description: errorMessage, action: 'error' });
      } finally {
        isSubmittingRef.current = false;
      }
    };

    useImperativeHandle(ref, () => ({
      submit: () => {
        const submitHandler = handleSubmit as unknown as (cb: SubmitHandler<BenchmarkPostFormData>) => () => void;
        submitHandler(onSubmit)();
      },
    }));

    const canShare =
      formState.isValid &&
      Boolean(postText?.trim?.()) &&
      Boolean(selectedProduct1) &&
      Boolean(selectedProduct2) &&
      (selectedChoice === 'product1' || selectedChoice === 'product2');
    const isLoading = createBenchmarkPostMutation.isPending;

    useEffect(() => {
      onStateChange?.({ canShare, isLoading });
    }, [canShare, isLoading, onStateChange]);

    return (
      <FormProvider {...methods}>
        <VStack space="md">
          <BenchmarkWinnerField />
          <VStack px={16} space="xs">
            <ControlledTextarea
              name="postText"
              placeholder={t('create.benchmark.placeholders.description')}
              maxLength={500}
              label={t('create.benchmark.labels.description')}
            />
          </VStack>
        </VStack>
      </FormProvider>
    );
  },
);

BenchmarkComposer.displayName = 'BenchmarkComposer';
