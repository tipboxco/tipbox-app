import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Box,
  ScrollView,
  VStack,
  HStack,
  Text,
  Pressable,
  useToast,
} from '@gluestack-ui/themed';
import {
  ChevronRight,
  XCircle,
  Info,
  PencilLine,
  HelpCircle,
  Lightbulb,
  Star,
  BarChart2,
} from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';
import { showCustomToast } from '@/src/components/CustomToast';
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
} from '@react-navigation/native';
import { FormProvider, Controller, useFormContext } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { CachedImage } from '@/src/components/CachedImage';
import { ProductInfoType } from '@/src/types/common';
import { useCategoryPostForm } from '../hooks/useCategoryPostForm';
import { ControlledTextarea } from '../components/FormFields/ControlledTextarea';
import { ControlledImagePicker } from '../components/FormFields/ControlledImagePicker';
import {
  PostTypeSelector,
  type PostTypeOption,
} from '../components/PostTypeSelector';
import { BoostSwitchField } from '../components/BoostSwitchField';
import {
  BenchmarkComposer,
  type BenchmarkComposerHandle,
} from '../components/BenchmarkComposer';
import {
  ExperienceComposer,
  type ExperienceComposerHandle,
} from '../components/ExperienceComposer';
import { ProductSelectInput } from '../components/ProductSelectInput';
import {
  BENEFIT_CATEGORIES,
  type BenefitCategoryValue,
} from '../constants/benefitCategories';
import {
  useCreateFreePost,
  useCreateQuestionPost,
  useCreateTipsAndTricksPost,
  useBoostPrice,
  invalidateCatalogPosts,
} from '../api/hooks';
import { mapProductInfoTypeToContextType } from '../types';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { useSyncInventoryToStore } from '../hooks/useSyncInventoryToStore';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { isInsufficientBalanceError, parseTipsBalance } from '../utils/paywall';
import { InsufficientBalanceSheet } from '../components/InsufficientBalanceSheet';
import { useWalletBalance } from '@/src/features/wallet/api/hooks';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { navigateAfterPostCreate } from '../utils/navigateAfterPostCreate';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { CameraScreen } from '../components/CameraScreen';
import { useNavigationUIStore } from '@/src/store/navigationUIStore';
import * as ImageManipulator from 'expo-image-manipulator';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PostStackParamList } from '../navigation';
import type {
  CategoryPostFormData,
  CategoryPostType,
} from '../schemas/categoryPostSchema';

type CreatePostScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;
type CreatePostScreenRouteProp = RouteProp<
  PostStackParamList,
  'CreatePostScreen'
>;

type ContextKind = 'product' | 'category';
type ComposerType =
  | 'general'
  | 'question'
  | 'tips'
  | 'experience'
  | 'benchmark';

/** Bağlam türüne göre seçilebilen paylaşım tipleri */
const CATEGORY_TYPE_OPTIONS: PostTypeOption[] = [
  {
    value: 'general',
    labelKey: 'create.typeSelector.general',
    Icon: PencilLine,
  },
  {
    value: 'question',
    labelKey: 'create.typeSelector.question',
    Icon: HelpCircle,
  },
  {
    value: 'tips',
    labelKey: 'create.typeSelector.tipsAndTricks',
    Icon: Lightbulb,
  },
];
const PRODUCT_TYPE_OPTIONS: PostTypeOption[] = [
  {
    value: 'experience',
    labelKey: 'create.typeSelector.experience',
    Icon: Star,
  },
  {
    value: 'question',
    labelKey: 'create.typeSelector.question',
    Icon: HelpCircle,
  },
  {
    value: 'tips',
    labelKey: 'create.typeSelector.tipsAndTricks',
    Icon: Lightbulb,
  },
  {
    value: 'benchmark',
    labelKey: 'create.typeSelector.benchmark',
    Icon: BarChart2,
  },
];
const INLINE_TYPES: ComposerType[] = ['general', 'question', 'tips'];

/** Tips & Tricks benefit kategori seçici (yalnızca 'tips' tipinde gösterilir) */
const BenefitCategorySelectField: React.FC<{
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}> = ({ showModal, setShowModal }) => {
  const { t } = useTranslation('post');
  const { control, watch } = useFormContext<CategoryPostFormData>();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const selectedCategory = watch('selectedCategory');

  return (
    <Controller
      name='selectedCategory'
      control={control}
      render={({ field: { onChange }, fieldState: { error } }) => (
        <VStack space='xs' position='relative'>
          <Text
            color={isDark ? '$textDark400' : '#A3A3A3'}
            fontSize='$sm'
            fontWeight='$semibold'
          >
            {t('create.tipsAndTricks.labels.category')}
          </Text>
          <Pressable onPress={() => setShowModal(!showModal)}>
            <Box
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor={error ? '#CE4A4A' : '#E9E9E9'}
              borderRadius={10}
              height={44}
              px={16}
              justifyContent='center'
            >
              <HStack
                flex={1}
                alignItems='center'
                justifyContent='space-between'
              >
                <Text
                  color={
                    selectedCategory
                      ? isDark
                        ? '$textDark50'
                        : '#000000'
                      : isDark
                        ? '#8C8C8C'
                        : '#8C8C8C'
                  }
                  fontSize='$sm'
                  fontWeight='$medium'
                  flex={1}
                >
                  {selectedCategory
                    ? t(
                        BENEFIT_CATEGORIES.find(
                          cat => cat.value === selectedCategory
                        )?.labelKey ?? ''
                      )
                    : t('create.tipsAndTricks.placeholders.categorySelect')}
                </Text>
                <Feather
                  name={showModal ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isDark ? '#FFFFFF' : '#000000'}
                />
              </HStack>
            </Box>
          </Pressable>

          {showModal && (
            <Box
              position='absolute'
              top={58}
              left={0}
              right={0}
              bg={isDark ? '$backgroundDark800' : '#FDFDFD'}
              borderWidth={1}
              borderColor={isDark ? '#333333' : '#E9E9E9'}
              borderBottomLeftRadius={5}
              borderBottomRightRadius={5}
              zIndex={1000}
              overflow='hidden'
            >
              <VStack>
                {BENEFIT_CATEGORIES.map((category, index) => (
                  <Box key={category.value}>
                    {index > 0 && <Box height={1} bg='#E9E9E9' width='100%' />}
                    <Pressable
                      onPress={() => {
                        onChange(category.value);
                        setShowModal(false);
                      }}
                    >
                      <HStack px='$3' py='$3' alignItems='center' space='sm'>
                        <Feather
                          name={category.icon}
                          size={18}
                          color={isDark ? '#FFFFFF' : '#2F2F2F'}
                        />
                        <Text
                          color={isDark ? '$textDark50' : '#2F2F2F'}
                          fontSize='$sm'
                          fontWeight='$medium'
                        >
                          {t(category.labelKey)}
                        </Text>
                      </HStack>
                    </Pressable>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          {error && (
            <Text color='#CE4A4A' fontSize='$xs' px={2}>
              {error.message}
            </Text>
          )}
        </VStack>
      )}
    />
  );
};

export const CreatePostScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { t } = useTranslation('post');
  const navigation = useNavigation<CreatePostScreenNavigationProp>();
  const route = useRoute<CreatePostScreenRouteProp>();
  const methods = useCategoryPostForm({
    postType: (route.params?.initialType as CategoryPostType) ?? 'general',
  });
  const { handleSubmit, formState, trigger, setValue } = methods;
  const createFreePostMutation = useCreateFreePost();
  const createQuestionPostMutation = useCreateQuestionPost();
  const createTipsPostMutation = useCreateTipsAndTricksPost();
  const toast = useToast();
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  const isSubmittingRef = useRef(false);
  const { user, walletBalance: storeBalance } = useAppStore();
  const queryClient = useQueryClient();
  const [showCamera, setShowCamera] = useState(false);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Açılış bağlam türü: feed create bottom sheet'inden gelen initialContextKind, yoksa 'category'.
  // Radio grubu gizli olduğundan bağlam türü bu değerle sabittir (picker seçimi normalize eder).
  const initialContextKind: ContextKind =
    route.params?.initialContextKind ?? 'category';
  const [contextKind, setContextKind] =
    useState<ContextKind>(initialContextKind);
  // Seçili paylaşım tipi: verilen initialType, yoksa bağlam türüne göre varsayılan (ürün→experience, kategori→general)
  const [composerType, setComposerType] = useState<ComposerType>(
    (route.params?.initialType as ComposerType) ??
      (initialContextKind === 'product' ? 'experience' : 'general')
  );

  // Benchmark inline composer kontrolü (kendi formu var; Header "Paylaş" buna delege olur)
  const benchmarkRef = useRef<BenchmarkComposerHandle>(null);
  const [benchmarkState, setBenchmarkState] = useState<{
    canShare: boolean;
    isLoading: boolean;
  }>({
    canShare: false,
    isLoading: false,
  });
  const handleBenchmarkStateChange = useCallback(
    (s: { canShare: boolean; isLoading: boolean }) => setBenchmarkState(s),
    []
  );

  // Experience inline composer kontrolü
  const experienceRef = useRef<ExperienceComposerHandle>(null);
  const [experienceState, setExperienceState] = useState<{
    canShare: boolean;
    isLoading: boolean;
    readyToPost: boolean;
    step: 'form' | 'rate';
  }>({
    canShare: false,
    isLoading: false,
    readyToPost: false,
    step: 'form',
  });
  const handleExperienceStateChange = useCallback(
    (s: {
      canShare: boolean;
      isLoading: boolean;
      readyToPost: boolean;
      step: 'form' | 'rate';
    }) => setExperienceState(s),
    []
  );

  // Boost (yalnızca question tipinde gösterilir; hook'lar koşulsuz çağrılır)
  const {
    data: boostPriceData,
    isLoading: isLoadingBoostPrice,
    error: boostPriceError,
  } = useBoostPrice();
  const { data: walletBalance } = useWalletBalance();
  const availableTips =
    storeBalance !== null && storeBalance !== undefined
      ? storeBalance
      : walletBalance?.balance || 0;

  // Global navigation UI store'dan kamera state'ini yönet
  const setCameraOpen = useNavigationUIStore(state => state.setCameraOpen);
  useEffect(() => {
    setCameraOpen(showCamera);
    return () => {
      setCameraOpen(false);
    };
  }, [showCamera, setCameraOpen]);

  // Context resolution: flow store (valid) öncelikli, sonra route params
  const contextType = useCreatePostFlowStore(state => state.contextType);
  const contextId = useCreatePostFlowStore(state => state.contextId);
  const productInfoSnapshot = useCreatePostFlowStore(
    state => state.productInfoSnapshot
  );
  const isValidFlow = useCreatePostFlowStore(state => state.isValid());
  const clearFlow = useCreatePostFlowStore(state => state.clearFlow);
  const compareProduct = useCreatePostFlowStore(state => state.compareProduct);
  const setCompareProduct = useCreatePostFlowStore(
    state => state.setCompareProduct
  );
  const isProductInInventory = useCreatePostFlowStore(
    state => state.isProductInInventory
  );
  // Envanter ürün ID'lerini store'a senkronla (disabled tip mantığı için gerekli)
  useSyncInventoryToStore();

  const routeParams = route.params || {};
  const finalContextType =
    isValidFlow && contextType ? contextType : routeParams.contextType;
  const finalContextId =
    isValidFlow && contextId ? contextId : routeParams.contextId;
  const finalProductInfo =
    isValidFlow && productInfoSnapshot
      ? productInfoSnapshot
      : routeParams.productInfo;

  // Ürün bağlamında, seçili ürün envanterde mi? Envanter gerektiren tipler buna göre kilitlenir.
  const selectedProductInInventory =
    finalContextType === ProductInfoType.PRODUCT && !!finalContextId
      ? isProductInInventory(finalContextId)
      : false;
  // 'experience' (Sahibim) ürünü envantere ekleyen yol olduğundan her zaman açık;
  // question/tips/benchmark ürün envanterde değilse devre dışı.
  const disabledTypeValues = useMemo<string[]>(() => {
    if (contextKind !== 'product' || selectedProductInInventory) return [];
    return ['question', 'tips', 'benchmark'];
  }, [contextKind, selectedProductInInventory]);

  // Seçili tip devre dışı kaldıysa (ör. ürün envanterde değil) 'experience'a düş.
  useEffect(() => {
    if (disabledTypeValues.includes(composerType)) {
      setComposerType('experience');
    }
  }, [disabledTypeValues, composerType]);

  // Ürün envanterde değilse: alert yerine kullanıcıyı 'Deneyim' (Sahibim) akışına yönlendir —
  // ekleme yolu budur. Hem devre dışı tipe dokunma hem de CTA banner bu aksiyonu kullanır.
  const handleAddToInventoryCta = useCallback(() => {
    setComposerType('experience');
  }, []);
  // Ürün bağlamı + seçili ürün + envanterde değil → envantere ekleme CTA banner'ı göster
  const showInventoryCta = disabledTypeValues.length > 0 && !!finalContextId;
  // Experience 'rate' (AI split puanlama) adımında ekranda yalnızca split bölümü görünsün:
  // üst bağlam seçici + tip seçici + CTA gizlenir.
  const hideContextUi =
    composerType === 'experience' && experienceState.step === 'rate';

  const typeOptions =
    contextKind === 'product' ? PRODUCT_TYPE_OPTIONS : CATEGORY_TYPE_OPTIONS;

  const handleOpenProductPicker = useCallback(() => {
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'ProductPicker',
      params: { returnTo: 'CreatePostScreen' },
    });
  }, []);

  const handleOpenCategoryPicker = useCallback(() => {
    navigationService.navigate(ROOT_ROUTES.POST, {
      screen: 'CategorySearch',
      params: { returnTo: 'CreatePostScreen' },
    });
  }, []);

  const handleClearContext = useCallback(() => {
    clearFlow();
  }, [clearFlow]);

  // Paywall: yetersiz TIPS bakiyesi hatasında toast yerine cüzdana yönlendiren bottom sheet aç.
  const showInsufficientBalancePaywall = useCallback(
    (error: unknown) => {
      const { available, required } = parseTipsBalance(error);
      openBottomSheet(
        <InsufficientBalanceSheet
          available={available}
          required={required}
          onGoToWallet={() => {
            closeBottomSheet();
            navigationService.navigate(ROOT_ROUTES.WALLET, {
              screen: 'WalletScreen',
            });
          }}
          onCancel={closeBottomSheet}
        />,
        {
          enableDynamicSizing: false,
          snapPoints: ['45%'],
          enablePanDownToClose: true,
        }
      );
    },
    [openBottomSheet, closeBottomSheet]
  );

  const handleTypeChange = (value: string) => {
    const type = value as ComposerType;
    setShowCategoryModal(false);
    setComposerType(type);
    if (INLINE_TYPES.includes(type)) {
      setValue('postType', type as CategoryPostType, { shouldValidate: true });
    }
  };

  // Picker'dan bağlam seçilip dönüldüğünde radio türünü ve composer tipini normalize et
  useEffect(() => {
    if (!finalContextType) return;
    const kind: ContextKind =
      finalContextType === ProductInfoType.PRODUCT ? 'product' : 'category';
    setContextKind(kind);
    setComposerType(prev => {
      const validValues = (
        kind === 'product' ? PRODUCT_TYPE_OPTIONS : CATEGORY_TYPE_OPTIONS
      ).map(o => o.value);
      return validValues.includes(prev)
        ? prev
        : ((kind === 'product' ? 'experience' : 'general') as ComposerType);
    });
  }, [finalContextType]);

  const handleBackPress = () => {
    clearFlow();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'App',
              state: {
                routes: [
                  {
                    name: 'MainTabs',
                    state: { routes: [{ name: 'CatalogStack' }], index: 0 },
                  },
                ],
                index: 0,
              },
            },
          ],
        })
      );
    }
  };

  const handleImagePicker = () => {
    const currentImages = methods.getValues('selectedImages') || [];
    const remainingSlots = 10 - currentImages.length;
    if (remainingSlots <= 0) {
      showCustomToast(toast, {
        title: t('create.toast.limitExceeded.title'),
        description: t('create.toast.limitExceeded.description'),
        action: 'error',
      });
      return;
    }
    setShowCamera(true);
  };

  const handlePhotoTaken = async (uri: string) => {
    const currentImages = methods.getValues('selectedImages') || [];
    methods.setValue('selectedImages', [...currentImages, uri], {
      shouldValidate: false,
    });
    setLastPhotoUri(uri);
    setShowCamera(false);

    try {
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      const updatedImages = methods.getValues('selectedImages') || [];
      const index = updatedImages.indexOf(uri);
      if (index !== -1) {
        updatedImages[index] = compressedImage.uri;
        methods.setValue('selectedImages', [...updatedImages], {
          shouldValidate: false,
        });
        setLastPhotoUri(compressedImage.uri);
      }
    } catch (error) {
      console.error('[CreatePostScreen] Image compression error:', error);
    }
  };

  const displayLastPhotoUri =
    lastPhotoUri ||
    (() => {
      const imgs = methods.getValues('selectedImages') || [];
      return imgs.length > 0 ? imgs[imgs.length - 1] : null;
    })();

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const onSubmit = async (data: CategoryPostFormData) => {
    if (isSubmittingRef.current) return;
    if (!finalContextType || !finalContextId) {
      showCustomToast(toast, {
        title: t('create.toast.error.title'),
        description: t('create.toast.error.description'),
        action: 'error',
      });
      return;
    }
    isSubmittingRef.current = true;

    const apiContextType = mapProductInfoTypeToContextType(finalContextType);
    const images = data.selectedImages || [];

    try {
      let successTitle = t('create.toast.postCreated.title');
      let successDescription = t('create.toast.postCreated.description');

      if (data.postType === 'question') {
        await createQuestionPostMutation.mutateAsync({
          contextType: apiContextType,
          contextId: finalContextId,
          description: data.text,
          boostEnabled: data.boostEnabled,
          images,
        });
        successTitle = t('create.question.success.title');
        successDescription = t('create.question.success.description');
      } else if (data.postType === 'tips') {
        await createTipsPostMutation.mutateAsync({
          contextType: apiContextType,
          contextId: finalContextId.trim(),
          description: data.text,
          benefitCategory: data.selectedCategory as BenefitCategoryValue,
          images,
        });
        successTitle = t('create.tipsAndTricks.success.title');
        successDescription = t('create.tipsAndTricks.success.description');
      } else {
        await createFreePostMutation.mutateAsync({
          contextType: apiContextType,
          contextId: finalContextId,
          description: data.text,
          images,
        });
      }

      showCustomToast(toast, {
        title: successTitle,
        description: successDescription,
        action: 'success',
      });

      if (apiContextType && finalContextId) {
        invalidateCatalogPosts(queryClient, apiContextType, finalContextId);
      }
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.userPosts(user.id),
          refetchType: 'none',
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.profile(user.id),
          refetchType: 'none',
        });
      }

      const savedContextType = finalContextType;
      const savedContextId = finalContextId;
      const savedProductInfo = finalProductInfo;
      clearFlow();

      navigateAfterPostCreate(navigation, {
        contextType: savedContextType,
        contextId: savedContextId,
        productInfo: savedProductInfo,
        userId: user?.id,
      });
    } catch (error: any) {
      console.error('[CreatePostScreen] ❌ API Error:', error);
      // Yetersiz TIPS bakiyesi (paywall): hata toast'ı yerine cüzdana yönlendiren sheet aç.
      if (isInsufficientBalanceError(error)) {
        showInsufficientBalancePaywall(error);
        return;
      }
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        t('create.toast.error.description');
      showCustomToast(toast, {
        title: t('create.toast.error.title'),
        description: errorMessage,
        action: 'error',
      });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleSharePress = () => {
    Keyboard.dismiss();

    // Benchmark: inline composer'ın kendi submit'ini tetikle
    if (composerType === 'benchmark') {
      benchmarkRef.current?.submit();
      return;
    }

    // Experience: inline composer'ın kendi submit'ini tetikle
    if (composerType === 'experience') {
      experienceRef.current?.submit();
      return;
    }

    trigger().then(isValid => {
      if (isValid) {
        handleSubmit(onSubmit)();
      } else {
        const errors = formState.errors as Record<
          string,
          { message?: string } | undefined
        >;
        const firstError =
          errors?.text?.message ||
          errors?.selectedCategory?.message ||
          errors?.selectedImages?.message ||
          (
            Object.values(errors).find(e => e?.message) as
              | { message?: string }
              | undefined
          )?.message ||
          t('create.toast.validation.description');
        showCustomToast(toast, {
          title: t('create.toast.validation.title'),
          description: firstError,
          action: 'error',
          duration: 3000,
        });
      }
    });
  };

  const isInlineType = INLINE_TYPES.includes(composerType);
  const isShareEnabled =
    composerType === 'benchmark'
      ? benchmarkState.canShare
      : composerType === 'experience'
        ? experienceState.canShare
        : isInlineType
          ? formState.isValid
          : !!finalContextId;
  const isShareLoading =
    createFreePostMutation.isPending ||
    createQuestionPostMutation.isPending ||
    createTipsPostMutation.isPending ||
    benchmarkState.isLoading ||
    experienceState.isLoading;

  // Tipe göre metin alanı etiket/placeholder
  const textLabel =
    composerType === 'question'
      ? t('create.question.labels.description')
      : composerType === 'tips'
        ? t('create.tipsAndTricks.labels.description')
        : t('create.form.postDescription');
  const textPlaceholder =
    composerType === 'question'
      ? t('create.question.placeholders.description')
      : composerType === 'tips'
        ? t('create.tipsAndTricks.placeholders.description')
        : t('create.form.postPlaceholder');

  return (
    <>
      {showCamera ? (
        <CameraScreen
          onPhotoTaken={handlePhotoTaken}
          onClose={handleCameraClose}
          lastPhotoUri={displayLastPhotoUri}
        />
      ) : (
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={{ flex: 1 }}
        >
          <FormProvider {...methods}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
                {/* Header */}
                <Header
                  title={t('create.header.title')}
                  leftAction='cancel'
                  onLeftActionPress={handleBackPress}
                  rightButton={{
                    text:
                      composerType === 'experience' &&
                      !experienceState.readyToPost
                        ? t('create.header.continue', 'Devam Et')
                        : t('create.header.share'),
                    backgroundColor:
                      isShareEnabled || isShareLoading ? '#D0F205' : '#EDEDED',
                    borderWidth: 1,
                    borderColor:
                      isShareEnabled || isShareLoading ? '#B8CC04' : '#B1B1B1',
                    textColor:
                      isShareEnabled || isShareLoading ? '#111111' : '#B1B1B1',
                    fontSize: 11,
                    borderRadius: 25,
                    paddingX: 10,
                    paddingY: 10,
                    onPress: handleSharePress,
                    loading: isShareLoading,
                  }}
                />

                {/* Content */}
                <ScrollView
                  flex={1}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps='handled'
                  onScrollBeginDrag={() => setShowCategoryModal(false)}
                >
                  <VStack space='md' pt={12} pb={100}>
                    {/* Bağlam türü (Ürün/Kategori) feed create bottom sheet'inde seçilir;
                        burada radio gösterilmez, sadece seçim input'u gösterilir.
                        Experience 'rate' adımında üst seçiciler gizlenir (sadece split görünür). */}
                    {!hideContextUi && (
                      <VStack px={16} space='sm'>
                        {/* 1. ürün/kategori seçim input'u (paylaşılan component) */}
                        <ProductSelectInput
                          value={
                            finalProductInfo
                              ? {
                                  image: finalProductInfo.image,
                                  title: finalProductInfo.title,
                                  subName: finalProductInfo.subName,
                                }
                              : null
                          }
                          placeholder={
                            contextKind === 'product'
                              ? t(
                                  'create.context.selectProduct',
                                  'Envanterden ürün seç'
                                )
                              : t(
                                  'create.context.selectCategory',
                                  'Kategori seç'
                                )
                          }
                          onPress={
                            contextKind === 'product'
                              ? handleOpenProductPicker
                              : handleOpenCategoryPicker
                          }
                          onClear={handleClearContext}
                        />

                        {/* 2. ürün seçim input'u — yalnızca benchmark + ürün bağlamında, 1.'in hemen altında.
                          AYNI core ProductPicker ekranını çağırır (target='compare'). */}
                        {composerType === 'benchmark' &&
                          contextKind === 'product' && (
                            <ProductSelectInput
                              value={
                                compareProduct
                                  ? {
                                      image: compareProduct.image,
                                      title: compareProduct.title,
                                      subName: compareProduct.subName,
                                    }
                                  : null
                              }
                              placeholder={t(
                                'create.benchmark.selectCompareProduct'
                              )}
                              onPress={() =>
                                navigationService.navigate(ROOT_ROUTES.POST, {
                                  screen: 'ProductPicker',
                                  params: {
                                    returnTo: 'CreatePostScreen',
                                    target: 'compare',
                                    // 2. ürün, 1. ürünün ürün grubuyla (kategori) sınırlandırılır
                                    restrictProductGroupId:
                                      productInfoSnapshot?.productGroupId,
                                  },
                                })
                              }
                              onClear={() => setCompareProduct(null)}
                            />
                          )}
                      </VStack>
                    )}

                    {/* 2) Paylaşım tipi seçici — bağlam türüne göre (kategori: 3, ürün: 4) */}
                    {!hideContextUi && (
                      <PostTypeSelector
                        options={typeOptions}
                        value={composerType}
                        onChange={handleTypeChange}
                        disabledValues={disabledTypeValues}
                        onDisabledPress={handleAddToInventoryCta}
                      />
                    )}

                    {/* Envantere ekleme CTA — ürün envanterde değilken (alert yerine inline yönlendirme) */}
                    {!hideContextUi && showInventoryCta && (
                      <Pressable px={16} onPress={handleAddToInventoryCta}>
                        <HStack
                          alignItems='center'
                          space='sm'
                          bg={isDark ? '#2A2A2A' : '#FFFFFF'}
                          borderWidth={1}
                          borderColor={isDark ? '#333333' : '#E9E9E9'}
                          borderRadius={10}
                          px={12}
                          py={12}
                        >
                          <Info size={20} color='#829905' />
                          <VStack flex={1} space='xs'>
                            <Text
                              fontSize='$sm'
                              fontWeight='$semibold'
                              color={isDark ? '#FFFFFF' : '#111111'}
                            >
                              {t(
                                'create.inventoryCta.title',
                                'Ürün envanterinde değil'
                              )}
                            </Text>
                            <Text
                              fontSize='$xs'
                              color={isDark ? '#9CA3AF' : '#6B7280'}
                            >
                              {t(
                                'create.inventoryCta.description',
                                'Soru, ipucu veya karşılaştırma paylaşmak için önce ürünü envanterine ekle.'
                              )}
                            </Text>
                          </VStack>
                          {composerType !== 'experience' && (
                            <Box bg='#D0F205' borderRadius={20} px={12} py={8}>
                              <Text
                                fontSize='$xs'
                                fontWeight='$semibold'
                                color='#111111'
                              >
                                {t('create.inventoryCta.action', 'Ekle')}
                              </Text>
                            </Box>
                          )}
                        </HStack>
                      </Pressable>
                    )}

                    {/* 3) Tipe özel alanlar */}
                    {isInlineType ? (
                      <>
                        {/* Açıklama */}
                        <VStack px={16} space='xs'>
                          <ControlledTextarea
                            name='text'
                            placeholder={textPlaceholder}
                            maxLength={500}
                            label={textLabel}
                          />
                        </VStack>

                        {/* Tips → benefit kategori */}
                        {composerType === 'tips' && (
                          <VStack px={16} space='xs'>
                            <BenefitCategorySelectField
                              showModal={showCategoryModal}
                              setShowModal={setShowCategoryModal}
                            />
                          </VStack>
                        )}

                        {/* Görseller */}
                        <VStack px={16} space='xs'>
                          <ControlledImagePicker
                            name='selectedImages'
                            label={t('create.form.images')}
                            maxImages={10}
                            onImagePicker={handleImagePicker}
                            onRemoveImage={index => {
                              const currentImages =
                                methods.getValues('selectedImages') || [];
                              const newImages = currentImages.filter(
                                (_: any, i: number) => i !== index
                              );
                              methods.setValue('selectedImages', newImages, {
                                shouldValidate: false,
                              });
                            }}
                          />
                        </VStack>

                        {/* Question → boost */}
                        {composerType === 'question' && (
                          <VStack px={16} space='xs'>
                            <Text
                              color={isDark ? '$textDark400' : '#A3A3A3'}
                              fontSize='$sm'
                              fontWeight='$bold'
                              mb={8}
                            >
                              {t('create.question.labels.boostSection')}
                            </Text>

                            {boostPriceError ? (
                              <Box py='$4' alignItems='center'>
                                <Text
                                  color={isDark ? '$red500' : '#EF4444'}
                                  fontSize='$sm'
                                >
                                  {t('create.question.boost.errorLoading')}
                                </Text>
                              </Box>
                            ) : (
                              <BoostSwitchField
                                boostPrice={boostPriceData?.price}
                                isLoadingPrice={isLoadingBoostPrice}
                                availableTips={availableTips}
                              />
                            )}

                            <HStack alignItems='center' space='xs' mt={12}>
                              <Info
                                size={18}
                                color={isDark ? '#FFFFFF' : '#A3A3A3'}
                              />
                              <Text
                                color={isDark ? '$textDark400' : '#A3A3A3'}
                                fontSize='$sm'
                                fontWeight='$medium'
                              >
                                {t('create.question.boost.tipsAvailable', {
                                  tips: Math.floor(availableTips),
                                })}
                              </Text>
                            </HStack>
                          </VStack>
                        )}
                      </>
                    ) : composerType === 'benchmark' ? (
                      // Benchmark → inline kompakt composer (kendi formu + ikinci ürün bottom-sheet)
                      <BenchmarkComposer
                        ref={benchmarkRef}
                        productContext={
                          finalContextId
                            ? {
                                id: finalContextId,
                                name: finalProductInfo?.title ?? '',
                                subName: finalProductInfo?.subName,
                                image: finalProductInfo?.image,
                              }
                            : null
                        }
                        onStateChange={handleBenchmarkStateChange}
                      />
                    ) : (
                      // Experience → inline kompakt composer (durum + süre/konum/amaç + metin + AI analiz + puanlama)
                      <ExperienceComposer
                        ref={experienceRef}
                        productContext={
                          finalContextId
                            ? {
                                id: finalContextId,
                                name: finalProductInfo?.title ?? '',
                                subName: finalProductInfo?.subName,
                                image: finalProductInfo?.image,
                              }
                            : null
                        }
                        onStateChange={handleExperienceStateChange}
                      />
                    )}
                  </VStack>
                </ScrollView>
              </Box>
            </KeyboardAvoidingView>
          </FormProvider>
        </SafeAreaView>
      )}
    </>
  );
};
