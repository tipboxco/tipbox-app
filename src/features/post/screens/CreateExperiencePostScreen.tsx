import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Keyboard, Modal, View, StyleSheet } from 'react-native';
import { Box, useToast, VStack, Text } from '@gluestack-ui/themed';
import { showCustomToast } from '@/src/components/CustomToast';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { FormProvider, SubmitHandler } from 'react-hook-form';
import { useColorMode } from '@/src/hooks/useColorMode';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Header } from '@/src/components/Header';
import { StepOneScreen } from '../components/CreateExperienceSteps/StepOneScreen';
import { StepTwoScreen } from '../components/CreateExperienceSteps/StepTwoScreen';
import { StepThreeScreen } from '../components/CreateExperienceSteps/StepThreeScreen';
import { SelectProduct } from '../components/CreateExperienceSteps/SelectProduct';
import { useExperiencePostForm } from '../hooks/useExperiencePostForm';
import { imagePickerService } from '@/src/services/ExpoImagePickerService';
import { useCreateExperiencePost, useSplitExperience, useGetExperienceOptions } from '../api/hooks';
import { useAddInventoryItem, useInventory } from '@/src/features/profile/api/hooks';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { useDraftStore } from '@/src/store/draftStore';
import { useInventoryProductCheck } from '../hooks/useInventoryProductCheck';
import { useSyncInventoryToStore } from '../hooks/useSyncInventoryToStore';
import { getInventoryDecision } from '../utils/inventoryDecision';
import { mapProductInfoTypeToContextType } from '../types';
import { useAppStore } from '@/src/store/appStore';
import { useQueryClient } from '@tanstack/react-query';
import { profileKeys } from '@/src/features/profile/api/hooks';
import { invalidateCatalogPosts } from '../api/hooks';
import { navigationService } from '@/src/services/NavigationService';
import { ROOT_ROUTES } from '@/src/navigation/constants/rootRoutes';
import { ProductInfoType } from '@/src/types/common';
import type { RootStackParamList } from '@/src/navigation/navigation.types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PostStackParamList } from '../navigation';
import type { ExperiencePostFormData } from '../schemas/experiencePostSchema';

type CreateExperiencePostScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CreateExperiencePostScreenRouteProp = RouteProp<PostStackParamList, 'CreateExperiencePostScreen'>;

/**
 * AI (Gemini) split servisi kullanılamadığında (ör. rate limit/503 ya da geçersiz yanıt)
 * kullanılan yerel sentinel. Bu durumda kullanıcının kendi metni deneyim segmenti olarak
 * kabul edilir; 'Sahibim' + katalogdan ekleme akışı envantere ekleyerek post oluşturur
 * (snippet gerektirmez). ExperienceComposer ile aynı davranış.
 */
const FALLBACK_SNIPPET_ID = 'local-fallback';

export const CreateExperiencePostScreen = () => {
    const { t } = useTranslation('post');
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';
    const navigation = useNavigation<CreateExperiencePostScreenNavigationProp>();
    const route = useRoute<CreateExperiencePostScreenRouteProp>();
    const { product, fromInventory, experienceOption } = route.params || {};

    // Sync inventory to store
    useSyncInventoryToStore();

    // Get inventory product check hook
    const { inventoryProductIds } = useInventoryProductCheck();
    
    // If product is undefined, start with SelectProduct (step 0), otherwise start with StepOneScreen (step 1)
    const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(product ? 1 : 0);
    const [editingField, setEditingField] = useState<'price' | 'product' | null>(null);
    const [isImagePickerLoading, setIsImagePickerLoading] = useState(false);
    
    const methods = useExperiencePostForm(
      product ? {
        selectedProduct: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          description: product.description,
          image: product.image,
        },
      } : undefined
    );
    const { handleSubmit, formState, validateStep, watch, setValue, getValues } = methods;
    const toast = useToast();
    const createExperiencePostMutation = useCreateExperiencePost();
    const splitExperienceMutation = useSplitExperience();
    const addInventoryItemMutation = useAddInventoryItem();
    const { user } = useAppStore();
    const queryClient = useQueryClient();
    const saveDraft = useDraftStore((s) => s.saveDraft);

    // Experience options (duration, location, purpose) from API
    const { data: experienceOptions } = useGetExperienceOptions();
    const durations = experienceOptions?.durations ?? [];
    const locations = experienceOptions?.locations ?? [];
    const purposes = experienceOptions?.purposes ?? [];

    // Flow store'dan context bilgilerini al
    const contextType = useCreatePostFlowStore((state) => state.contextType);
    const contextId = useCreatePostFlowStore((state) => state.contextId);
    const productInfoSnapshot = useCreatePostFlowStore((state) => state.productInfoSnapshot);
    const setFlowContext = useCreatePostFlowStore((state) => state.setFlowContext);
    const clearFlow = useCreatePostFlowStore((state) => state.clearFlow);
    
    // Context yoksa route'taki product ile set et (örn. Inventory'dan gelince)
    useEffect(() => {
        if ((!contextType || !contextId) && product?.id) {
            setFlowContext(ProductInfoType.PRODUCT, product.id, {
                image: product.image,
                title: product.name ?? '',
                subName: product.brand,
            });
        }
    }, [contextType, contextId, product?.id, product?.image, product?.name, product?.brand, setFlowContext]);
    
    // AI split response'u sakla
    const [experienceSnippetId, setExperienceSnippetId] = useState<string | undefined>(undefined);
    
    // Loading state (sadece spinner için)
    const [isSplitLoading, setIsSplitLoading] = useState(false);
    
    // Çift gönderim engeli: aynı anda yalnızca bir submit çalışsın
    const isSubmittingRef = useRef(false);
    
    const selectedProduct = watch('selectedProduct');
    const step1Duration = watch('step1Duration');
    const selectedCondition = watch('selectedCondition');
    const selectedFrequency = watch('selectedFrequency');
    const experienceText = watch('experienceText');
    const priceRating = watch('priceRating');
    const productRating = watch('productRating');

    // Resolve option IDs to translated display names for Step2/Step3 tags
    const resolveName = (options: { id: string; name: string }[], id: string) => {
        const name = options.find((o) => o.id === id)?.name ?? '';
        if (!name) return '';
        const key = `create.experience.step1.optionNames.${name}`;
        const translated = t(key);
        return translated === key ? name : translated;
    };
    const durationName = useMemo(() => resolveName(durations, step1Duration || ''), [durations, step1Duration, t]);
    const locationName = useMemo(() => resolveName(locations, selectedCondition || ''), [locations, selectedCondition, t]);
    const purposeName = useMemo(() => resolveName(purposes, selectedFrequency || ''), [purposes, selectedFrequency, t]);

    const handleBackPress = () => {
        if (currentStep === 3) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            setCurrentStep(1);
        } else if (currentStep === 1) {
            // If we came from SelectProduct, go back to it, otherwise go to Feed
            if (!product) {
                setCurrentStep(0);
            } else {
                // Navigate to Feed screen
                // ARCHITECTURE FIX: Doğru navigation yapısı: App → MainTabs → FeedScreen
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
                                            state: {
                                                routes: [{ name: 'FeedScreen' }],
                                                index: 0,
                                            },
                                        },
                                    ],
                                    index: 0,
                                },
                            },
                        ],
                    })
                );
            }
        } else if (currentStep === 0) {
            // Navigate to Feed screen
            navigation.dispatch(
                // ARCHITECTURE FIX: Doğru navigation yapısı: App → MainTabs → FeedScreen
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'App',
                            state: {
                                routes: [
                                    {
                                        name: 'MainTabs',
                                        state: {
                                            routes: [{ name: 'FeedScreen' }],
                                            index: 0,
                                        },
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

    // AI split yapılamadığında (backend güncel değil veya Gemini rate limit/503/geçersiz yanıt)
    // kullanıcının kendi metnini ürün deneyimi segmenti olarak kabul et; sentinel snippet ile
    // Step 3 (puanlama) adımını aç ve akış devam etsin. ExperienceComposer ile aynı fallback.
    const applyFallbackSplit = () => {
        setValue('priceExperienceText', '');
        setValue('priceRating', 0);
        setValue('productExperienceText', (experienceText || '').trim());
        setValue('productRating', 0);
        setExperienceSnippetId(FALLBACK_SNIPPET_ID);
        setIsSplitLoading(false);
        setCurrentStep(3);
        showCustomToast(toast, {
            title: t('create.experience.ai.fallbackTitle', 'AI şu an kullanılamıyor'),
            description: t(
                'create.experience.ai.fallbackPrompt',
                'Kendi yorumunuz kullanılacak. Lütfen yıldızlarla puanlayıp paylaşın.'
            ),
            action: 'success',
        });
    };

    const handleNextPress = async () => {
        if (currentStep === 0) {
            const isValid = await validateStep(0);
            if (isValid) {
                setCurrentStep(1);
            }
        } else if (currentStep === 1) {
            const isValid = await validateStep(1);
            if (isValid) {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            const isValid = await validateStep(2);
            if (isValid) {
                // Product ID kontrolü
                if (!selectedProduct?.id) {
                    showCustomToast(toast, {
                        title: t('create.common.errors.title'),
                        description: t('create.experience.validation.productNotSelected'),
                        action: 'error',
                    });
                    return;
                }

                // Experience text kontrolü
                if (!experienceText || experienceText.trim().length < 10) {
                    showCustomToast(toast, {
                        title: t('create.common.errors.title'),
                        description: t('create.experience.validation.experienceTextTooShort'),
                        action: 'error',
                    });
                    return;
                }

                // Gemini AI split isteği - klavyeyi kapat ve loading başlat
                Keyboard.dismiss();
                setIsSplitLoading(true);

                try {
                    console.log('[CreateExperiencePostScreen] 📤 Calling split-experience API...');
                    const response = await splitExperienceMutation.mutateAsync({
                        productId: selectedProduct.id,
                        experienceText: experienceText.trim(),
                    });

                    console.log('[CreateExperiencePostScreen] ✅ Split response received:', response);

                    // CRITICAL DEBUG: Log AI ratings to verify they're different
                    console.log('[CreateExperiencePostScreen] 🤖 AI Split Ratings:', {
                        priceRating: response.priceAndShopping?.rating,
                        productRating: response.productAndUsage?.rating,
                    });

                    // Cümle sonundaki ekstra "(" kaldır (AI bazen ekliyor)
                    const trimTrailingParen = (s: string) => (s || '').replace(/\s*\(\s*$/, '').trim();
                    // AI response'u form'a set et
                    // CRITICAL: AI sadece metni getirir, yıldız sayısını kullanıcı eliyle belirler (0 olarak başlar)
                    if (response.priceAndShopping) {
                        setValue('priceExperienceText', trimTrailingParen(response.priceAndShopping.content));
                        setValue('priceRating', 0); // Kullanıcı eliyle belirlenmeli
                    } else {
                        setValue('priceExperienceText', '');
                        setValue('priceRating', 0);
                    }

                    if (response.productAndUsage) {
                        setValue('productExperienceText', trimTrailingParen(response.productAndUsage.content));
                        setValue('productRating', 0); // Kullanıcı eliyle belirlenmeli
                    } else {
                        setValue('productExperienceText', '');
                        setValue('productRating', 0);
                    }

                    // experienceSnippetId'yi sakla (son adımda kullanılacak)
                    const snippetId = response.experienceSnippetId;
                    const hasValidSnippetId =
                        typeof snippetId === 'string' && snippetId.trim().length > 0;
                    if (!hasValidSnippetId) {
                        // Geçersiz/boş snippet → fallback: kullanıcının kendi metnini kullan
                        applyFallbackSplit();
                        return;
                    }
                    setExperienceSnippetId(snippetId);

                    // Step 3'e geç
                    setIsSplitLoading(false);
                    setCurrentStep(3);
                } catch (error: any) {
                    // AI servisi kullanılamıyor (ör. Gemini rate limit/503 ya da backend güncel değil)
                    // → fallback: kullanıcının kendi metnini deneyim olarak kullan, akış devam etsin.
                    console.error('[CreateExperiencePostScreen] ❌ Split experience error, applying fallback:', error);
                    applyFallbackSplit();
                }
            }
        }
    };

    const handleProductSelect = (selected: { id: string; name: string; brand?: string; description?: string; image: any }) => {
        if (!fromInventory && inventoryProductIds.has(selected.id)) {
            showCustomToast(toast, {
                title: t('create.experience.inventory.alreadyInInventory.title'),
                description: t('create.experience.inventory.alreadyInInventory.description'),
                action: 'info',
            });
        }
        setValue('selectedProduct', selected, { shouldValidate: true });
        setCurrentStep(1);
        if (!contextType || !contextId) {
            setFlowContext(ProductInfoType.PRODUCT, selected.id, {
                image: selected.image,
                title: selected.name ?? '',
                subName: selected.brand,
            });
        }
    };


    const onSubmit: SubmitHandler<ExperiencePostFormData> = async (data) => {
        if (isSubmittingRef.current) {
            return;
        }
        isSubmittingRef.current = true;
        try {
            console.log('[CreateExperiencePostScreen] 📝 Form submitted with data:', data);
            console.log('[CreateExperiencePostScreen] ⭐ CRITICAL: Form ratings at submit time:', {
                priceRating: data.priceRating,
                productRating: data.productRating,
                priceExperienceText: data.priceExperienceText?.substring(0, 30) + '...',
                productExperienceText: data.productExperienceText?.substring(0, 30) + '...',
            });
            
            // ContextType ve contextId kontrolü
            if (!contextType || !contextId) {
                showCustomToast(toast, {
                    title: t('create.common.errors.title'),
                    description: t('create.experience.validation.contextMissing'),
                    action: 'error',
                });
                return;
            }

            // Ürün kontrolü
            if (!data.selectedProduct) {
                showCustomToast(toast, {
                    title: t('create.common.errors.title'),
                    description: t('create.experience.validation.productSelectionRequired'),
                    action: 'error',
                });
                return;
            }
            
            // API contextType'a çevir
        const apiContextType = mapProductInfoTypeToContextType(contextType);
        
        // Experience array'ini oluştur
        const experience = [];

        // Price and shopping experience
        if (data.priceExperienceText && data.priceRating) {
            experience.push({
                type: 'price_and_shopping' as const,
                content: data.priceExperienceText,
                rating: data.priceRating,
            });
        }

        // Product and usage experience
        if (data.productExperienceText && data.productRating) {
            experience.push({
                type: 'product_and_usage' as const,
                content: data.productExperienceText,
                rating: data.productRating,
            });
        }

        // CRITICAL DEBUG: Log experience array to verify ratings are different
        console.log('[CreateExperiencePostScreen] 🔍 Experience array being sent:', JSON.stringify(experience, null, 2));
        console.log('[CreateExperiencePostScreen] 🔍 Form data ratings:', {
            priceRating: data.priceRating,
            productRating: data.productRating,
        });
        
        // Experience array kontrolü
        if (experience.length === 0) {
            showCustomToast(toast, {
                title: t('create.common.errors.title'),
                description: t('create.experience.validation.experienceCategoryRequired'),
                action: 'error',
            });
            return;
        }
        
        // Status'u belirle (experienceOption'a göre)
        // - experienceOption === 'own' → status: 'own' (ürün envantere eklenir veya zaten envanterde ise post paylaşılır)
        // - experienceOption === 'tried' → status: 'tested' (ürün envantere eklenmez, sadece post paylaşılır)
        const status: 'own' | 'tested' = experienceOption === 'own' ? 'own' : 'tested';
        
        // Form already stores IDs from experience options API
        const selectedDurationId = data.step1Duration;
        const selectedLocationId = data.selectedCondition;
        const selectedPurposeId = data.selectedFrequency;
        
        console.log('[CreateExperiencePostScreen] Mapping form values to IDs:', {
            step1Duration: data.step1Duration,
            selectedDurationId: selectedDurationId,
            selectedCondition: data.selectedCondition,
            selectedLocationId: selectedLocationId,
            selectedFrequency: data.selectedFrequency,
            selectedPurposeId: selectedPurposeId,
        });
        
        // Zorunlu alan kontrolü
        if (!selectedDurationId || selectedDurationId.trim() === '') {
            showCustomToast(toast, {
                title: t('create.common.errors.title'),
                description: t('create.experience.validation.durationRequired'),
                action: 'error',
            });
            return;
        }

        if (!selectedLocationId || selectedLocationId.trim() === '') {
            showCustomToast(toast, {
                title: t('create.common.errors.title'),
                description: t('create.experience.validation.locationRequired'),
                action: 'error',
            });
            return;
        }

        if (!selectedPurposeId || selectedPurposeId.trim() === '') {
            showCustomToast(toast, {
                title: t('create.common.errors.title'),
                description: t('create.experience.validation.purposeRequired'),
                action: 'error',
            });
            return;
        }
        
        console.log('[CreateExperiencePostScreen] Submitting with:', {
            contextType: apiContextType,
            contextId: contextId,
            productId: data.selectedProduct?.id,
            selectedDurationId: selectedDurationId,
            selectedLocationId: selectedLocationId,
            selectedPurposeId: selectedPurposeId,
            content: data.experienceText?.substring(0, 50) + '...',
            experience: experience,
            status: status,
            imagesCount: data.selectedImages?.length || 0,
            experienceSnippetId: experienceSnippetId,
            experienceOption: experienceOption,
            fromInventory: fromInventory,
        });

        const willAddToInventory = experienceOption === 'own' && !fromInventory && !!data.selectedProduct?.id;
        console.log('[CreateExperiencePostScreen] 📦 Inventory add check:', {
            willAddToInventory,
            experienceOption,
            fromInventory,
            selectedProductId: data.selectedProduct?.id,
            reason: !willAddToInventory
                ? (experienceOption !== 'own' ? 'experienceOption !== own' : fromInventory ? 'fromInventory=true' : !data.selectedProduct?.id ? 'no selectedProduct.id' : 'unknown')
                : 'ok',
        });
        
        // Track whether inventory endpoint already created the post
        let inventoryCreatedPost = false;

        try {
            // Eğer experienceOption === 'own' VE fromInventory === false (katalogdan seçildi):
            // Envantere ekle - backend POST /inventory ile hem inventory item hem post oluşturur
            if (willAddToInventory) {
                console.log('[CreateExperiencePostScreen] 📦 Adding product to inventory...');
                try {
                    const inventoryPayload: {
                        productId: string;
                        selectedDurationId: string;
                        selectedLocationId: string;
                        selectedPurposeId: string;
                        content: string;
                        experience: typeof experience;
                        status: 'own';
                    } = {
                        productId: data.selectedProduct!.id,
                        selectedDurationId: selectedDurationId,
                        selectedLocationId: selectedLocationId,
                        selectedPurposeId: selectedPurposeId,
                        content: data.experienceText || '',
                        experience: experience,
                        status: 'own' as const,
                    };

                    console.log('[CreateExperiencePostScreen] 📦 Inventory payload:', inventoryPayload);

                    const inventoryResponse = await addInventoryItemMutation.mutateAsync(inventoryPayload);
                    console.log('[CreateExperiencePostScreen] ✅ Product added to inventory:', inventoryResponse);
                    // POST /inventory başarılı → backend post'u zaten oluşturdu
                    inventoryCreatedPost = true;
                } catch (inventoryError: any) {
                    const errMsg =
                        inventoryError?.response?.data?.error?.message ||
                        inventoryError?.response?.data?.message ||
                        inventoryError?.message ||
                        '';
                    const alreadyExists =
                        /inventory already exists|already exists for this product/i.test(errMsg);
                    if (alreadyExists) {
                        // Ürün zaten envanterde; post oluşturmaya devam et (POST /posts/experience ile)
                        console.log('[CreateExperiencePostScreen] 📦 Product already in inventory, continuing to create post separately');
                    } else {
                        console.error('[CreateExperiencePostScreen] ❌ Add to inventory failed:', {
                            message: inventoryError?.message,
                            response: inventoryError?.response?.data,
                            status: inventoryError?.response?.status,
                        });
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

            // POST /inventory başarılıysa post zaten oluşturuldu, tekrar oluşturma
            if (!inventoryCreatedPost) {
                // Fallback snippet yalnızca 'Sahibim' + yeni ürün (envantere ekleme) yolunda geçerlidir;
                // bu yol AI gerektiren createExperiencePost'a düşerse (ör. ürün zaten envanterde) backend
                // gerçek snippet ister. ExperienceComposer ile aynı davranış.
                if (experienceSnippetId === FALLBACK_SNIPPET_ID) {
                    showCustomToast(toast, {
                        title: t('create.experience.ai.fallbackTitle', 'AI şu an kullanılamıyor'),
                        description: t(
                            'create.experience.ai.fallbackUnavailable',
                            'Bu paylaşım için yapay zeka analizi gerekiyor. Lütfen biraz sonra tekrar deneyin.'
                        ),
                        action: 'error',
                    });
                    isSubmittingRef.current = false;
                    return;
                }
                if (!experienceSnippetId || experienceSnippetId.trim() === '') {
                    showCustomToast(toast, {
                        title: t('create.common.errors.title'),
                        description: t('create.experience.ai.splitRequired'),
                        action: 'error',
                    });
                    return;
                }

                const postPayload = {
                    contextType: apiContextType,
                    contextId: contextId,
                    productId: data.selectedProduct?.id,
                    experienceSnippetId: experienceSnippetId,
                    selectedDurationId: selectedDurationId,
                    selectedLocationId: selectedLocationId,
                    selectedPurposeId: selectedPurposeId,
                    content: data.experienceText,
                    experience: experience,
                    status: status,
                    images: data.selectedImages || [],
                };

                console.log('[CreateExperiencePostScreen] 📝 Creating post via /posts/experience...');
                const response = await createExperiencePostMutation.mutateAsync(postPayload);
                console.log('[CreateExperiencePostScreen] ✅ Post created:', response);
            } else {
                console.log('[CreateExperiencePostScreen] ⏭️ Skipping POST /posts/experience — inventory endpoint already created the post');
            }

            // Başarılı toast göster
            showCustomToast(toast, {
                title: t('create.experience.success.title'),
                description: t('create.experience.success.description'),
                action: 'success',
            });
            
            // Invalidate ve refetch: PostsScreen listesinde yeni post görünsün
            if (apiContextType && contextId) {
                invalidateCatalogPosts(queryClient, apiContextType, contextId);
                await queryClient.refetchQueries({
                    queryKey: ['catalog', 'catalogProductPosts', contextId],
                });
            }
            
            // Profil verilerini invalidate et - yeni post görünsün
            if (user?.id) {
                queryClient.invalidateQueries({
                    queryKey: profileKeys.userPosts(user.id),
                });
                queryClient.invalidateQueries({
                    queryKey: profileKeys.userReviews(user.id),
                });
                queryClient.invalidateQueries({
                    queryKey: profileKeys.profile(user.id),
                });
            }
            
            // Save context info before clearing flow
            const savedContextType = contextType;
            const savedContextId = contextId;
            const savedProductInfo = productInfoSnapshot;
            
            // Clear flow context on successful submit
            clearFlow();
            
            // Navigate to PostsScreen if context is available
            // CRITICAL: Clear navigation stack to prevent going back to create post screens
            if (savedContextType && savedContextId && savedProductInfo) {
                // Determine stage from contextType
                let stage: 'SubCategories' | 'ProductGroup' | 'Product' = 'SubCategories';
                switch (savedContextType) {
                    case ProductInfoType.PRODUCT:
                        stage = 'Product';
                        break;
                    case ProductInfoType.PRODUCT_GROUP:
                        stage = 'ProductGroup';
                        break;
                    case ProductInfoType.SUB_CATEGORY:
                        stage = 'SubCategories';
                        break;
                }
                
                // Get current navigation state to preserve App state
                const currentState = navigation.getState();
                const appRoute = currentState?.routes?.find((route) => route.name === 'App');
                
                // Reset navigation stack and navigate to PostsScreen
                // This clears all create post screens from the stack
                navigation.dispatch(
                    CommonActions.reset({
                        index: 1,
                        routes: [
                            {
                                name: 'App',
                                state: appRoute?.state,
                            } as any,
                            {
                                name: ROOT_ROUTES.POST as any,
                                state: {
                                    routes: [
                                        {
                                            name: 'PostsScreen' as any,
                                            params: {
                                                stage,
                                                name: savedProductInfo.title,
                                                productInfo: savedProductInfo,
                                                contextType: savedContextType,
                                                contextId: savedContextId,
                                            },
                                        },
                                    ],
                                    index: 0,
                                },
                            } as any,
                        ],
                    })
                );
            } else if (user?.id) {
                // Fallback: ProfileScreen'e yönlendir
                const currentState = navigation.getState();
                const appRoute = currentState?.routes?.find((route) => route.name === 'App');
                
                navigation.dispatch(
                    CommonActions.reset({
                        index: 1,
                        routes: [
                            {
                                name: 'App',
                                state: appRoute?.state,
                            } as any,
                            {
                                name: 'Profile',
                                params: {
                                    screen: 'ProfileMain',
                                    params: { userId: user.id },
                                },
                            } as any,
                        ],
                    })
                );
            } else {
                // Fallback: Feed ekranına yönlendir
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
                                            state: {
                                                routes: [{ name: 'FeedScreen' }],
                                                index: 0,
                                            },
                                        },
                                    ],
                                    index: 0,
                                },
                            },
                        ],
                    })
                );
            }
        } catch (error: any) {
            console.error('[CreateExperiencePostScreen] ❌ API Error:', error);

            // Backend hata kodlarını ve mesajlarını kontrol et
            const errorCode = error?.response?.data?.code;
            const errorMessage = error?.response?.data?.message;

            if (errorMessage?.includes('envanterinizde bulunmuyor') ||
                errorCode === 'PRODUCT_NOT_IN_INVENTORY') {
                const formData = getValues();
                const selectedProduct = formData.selectedProduct;
                if (selectedProduct) {
                    saveDraft({
                        type: 'experience',
                        experienceOption: experienceOption,
                        productId: selectedProduct.id,
                        productName: selectedProduct.name,
                        productSubName: selectedProduct.brand,
                        productImage: selectedProduct.image,
                        content: formData.productExperienceText || formData.priceExperienceText || '',
                    });
                }
                showCustomToast(toast, {
                    title: 'Taslağa Kaydedildi',
                    description: 'Ürün envanterinizde yok. Taslak kaydedildi, önce ürünü envanterinize ekleyin.',
                    action: 'info',
                });
                navigation.dispatch(
                    CommonActions.navigate({
                        name: 'Main',
                        params: {
                            screen: 'ExploreStack',
                            params: { screen: 'CatalogScreen' },
                        },
                    })
                );
                return;
            }

            // Genel hata
            const fallbackMessage = errorMessage ||
                                error?.message ||
                                t('create.common.errors.general');

            showCustomToast(toast, {
                title: t('create.common.errors.title'),
                description: fallbackMessage,
                action: 'error',
            });
        }
        } finally {
            isSubmittingRef.current = false;
        }
    };

    const handleImagePicker = async () => {
        try {
            setIsImagePickerLoading(true);
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
                const newImageUris = result.assets
                    .map(asset => asset.uri)
                    .filter((uri): uri is string => !!uri);
                
                if (newImageUris.length > 0) {
                    const updatedImages = [...currentImages, ...newImageUris];
                    setValue('selectedImages', updatedImages, { shouldValidate: true });
                } else {
                    showCustomToast(toast, {
                        title: t('create.common.errors.title'),
                        description: t('create.common.validation.imageUriNotFound'),
                        action: 'error',
                    });
                }
            } else if (result.error) {
                showCustomToast(toast, {
                    title: t('create.common.errors.title'),
                    description: result.error,
                    action: 'error',
                });
            }
        } catch (error: any) {
            console.error('Image picker error:', error);
            const errorMessage = error?.message || t('create.common.validation.imagePickerError');
            showCustomToast(toast, {
                title: t('create.common.errors.title'),
                description: errorMessage,
                action: 'error',
            });
        } finally {
            setIsImagePickerLoading(false);
        }
    };

    const handleRemoveImage = (index: number) => {
        const images = watch('selectedImages') || [];
        const newImages = images.filter((_: string, i: number) => i !== index);
        setValue('selectedImages', newImages);
    };

    const handleEditPress = (field: 'price' | 'product') => {
        if (editingField === field) {
            setEditingField(null);
        } else {
            setEditingField(field);
        }
    };

    const handleSavePress = () => {
        setEditingField(null);
    };

    // Check if Next button should be enabled for Step 1
    const isStep1NextEnabled = step1Duration && selectedCondition && selectedFrequency;

    // Check if Next button should be enabled for Step 2
    const isStep2NextEnabled = experienceText && experienceText.trim().length > 0;

    // Check if Share button should be enabled (Both ratings selected, both texts non-empty, and not editing)
    const priceExperienceText = watch('priceExperienceText');
    const productExperienceText = watch('productExperienceText');
    // Fallback (AI kullanılamadı) modunda kullanıcının metni yalnızca ürün segmentine yazılır;
    // bu durumda sadece ürün puanı/metni zorunludur. Aksi halde her iki segment de gereklidir.
    const isFallbackSplit = experienceSnippetId === FALLBACK_SNIPPET_ID;
    const isShareEnabled = (isFallbackSplit
        ? productRating > 0 && !!productExperienceText?.trim()
        : priceRating > 0 && productRating > 0
            && !!priceExperienceText?.trim() && !!productExperienceText?.trim())
        && editingField === null;
    
    // Submit sırasında butonu devre dışı bırak (çift tıklama engeli)
    const isSubmitPending = createExperiencePostMutation.isPending || addInventoryItemMutation.isPending;

    // Check if Next button should be enabled for SelectProduct (product selected)
    const isSelectProductNextEnabled = selectedProduct !== null;

    // Render Step 0 (SelectProduct)
    // No header - AddProductFromCatalog has its own header
    if (currentStep === 0) {
        return (
            <FormProvider {...methods}>
                <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
                    <SelectProduct
                        onProductSelect={handleProductSelect}
                        selectedProduct={selectedProduct}
                        fromInventory={fromInventory}
                        onCancel={handleBackPress}
                    />
                </Box>
            </FormProvider>
        );
    }

    // Render Step 3
    if (currentStep === 3) {
        // Determine button text based on fromInventory and experienceOption
        const getButtonText = () => {
            if (editingField) {
                return t('create.experience.header.save');
            }
            if (fromInventory && experienceOption === 'own') {
                return t('create.experience.header.done');
            }
            return t('create.experience.header.share');
        };

        const buttonText = getButtonText();

        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <FormProvider {...methods}>
                    <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
                        {/* Header */}
                        <Header
                            title={t('create.experience.header.title')}
                            leftAction="back"
                            onLeftActionPress={handleBackPress}
                            rightButton={
                                editingField ? {
                                    text: t('create.experience.header.save'),
                                    backgroundColor: '#D8FF08',
                                    borderWidth: 0,
                                    borderColor: 'transparent',
                                    textColor: '#000000',
                                    fontSize: 14,
                                    borderRadius: 25,
                                    paddingX: 12,
                                    paddingY: 8,
                                    onPress: handleSavePress,
                                } : {
                                    text: buttonText,
                                    backgroundColor: isShareEnabled || isSubmitPending ? '#D0F205' : '#EDEDED',
                                    borderWidth: 1,
                                    borderColor: isShareEnabled || isSubmitPending ? '#B8CC04' : '#B1B1B1',
                                    textColor: isShareEnabled || isSubmitPending ? '#111111' : '#B1B1B1',
                                    fontSize: 14,
                                    borderRadius: 25,
                                    paddingX: 12,
                                    paddingY: 8,
                                    onPress: () => {
                                      Keyboard.dismiss();
                                      handleSubmit(onSubmit)();
                                    },
                                    disabled: isSubmitPending,
                                    loading: isSubmitPending,
                                }
                            }
                        />

                        {/* Step 3 Content */}
                        <StepThreeScreen
                            priceExperienceText={watch('priceExperienceText') || ''}
                            productExperienceText={watch('productExperienceText') || ''}
                            priceRating={priceRating}
                            productRating={productRating}
                            onPriceExperienceTextChange={(text) => setValue('priceExperienceText', text)}
                            onProductExperienceTextChange={(text) => setValue('productExperienceText', text)}
                            onPriceRatingChange={(rating) => setValue('priceRating', rating, { shouldValidate: true })}
                            onProductRatingChange={(rating) => setValue('productRating', rating, { shouldValidate: true })}
                            selectedDuration={durationName}
                            selectedCondition={locationName}
                            selectedFrequency={purposeName}
                            selectedImages={watch('selectedImages') || []}
                            onImagePicker={handleImagePicker}
                            onRemoveImage={handleRemoveImage}
                            onEditPress={handleEditPress}
                            editingField={editingField}
                            selectedProduct={selectedProduct}
                            fromInventory={fromInventory}
                            experienceOption={experienceOption}
                            isImagePickerLoading={isImagePickerLoading}
                        />

                        {/* Gönderim sırasında ekran ortasında loading */}
                        <Modal visible={isSubmitPending} transparent animationType="fade">
                            <View style={styles.loadingOverlay}>
                                <View style={[styles.loadingBox, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                                    <ActivityIndicator size="large" color={isDark ? '#D0F205' : '#829905'} />
                                    <Text color={isDark ? '$textDark50' : '#000000'} fontSize={14} mt={12}>
                                        {t('create.experience.sending')}
                                    </Text>
                                </View>
                            </View>
                        </Modal>
                    </Box>
                </FormProvider>
            </SafeAreaView>
        );
    }

    // Render Step 2
    if (currentStep === 2) {
        const isStep2Loading = isSplitLoading || splitExperienceMutation.isPending;
        const isStep2NextDisabled = !isStep2NextEnabled || isStep2Loading;
        
        return (
            <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
                <FormProvider {...methods}>
                    <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
                        {/* Header */}
                        <Header
                            title={t('create.experience.header.title')}
                            leftAction="back"
                            onLeftActionPress={handleBackPress}
                            rightButton={{
                                text: isStep2Loading ? t('create.experience.header.processing') : t('create.experience.header.next'),
                                backgroundColor: isStep2NextDisabled ? '#EDEDED' : '#D0F205',
                                borderWidth: 1,
                                borderColor: isStep2NextDisabled ? '#B1B1B1' : '#B8CC04',
                                textColor: isStep2NextDisabled ? '#B1B1B1' : '#111111',
                                fontSize: 14,
                                borderRadius: 25,
                                paddingX: 12,
                                paddingY: 8,
                                onPress: handleNextPress,
                                disabled: isStep2NextDisabled,
                            }}
                        />

                        {/* Step 2 Content */}
                        <Box flex={1}>
                            <StepTwoScreen
                                experienceText={experienceText || ''}
                                onExperienceTextChange={(text) => setValue('experienceText', text)}
                                selectedDuration={durationName}
                                selectedCondition={locationName}
                                selectedFrequency={purposeName}
                                selectedImages={watch('selectedImages') || []}
                                onImagePicker={handleImagePicker}
                                onRemoveImage={handleRemoveImage}
                                selectedProduct={selectedProduct}
                            />
                        </Box>

                        {/* Loading Overlay - Modal ile tüm ekranı kaplar, hiçbir yere tıklanamaz */}
                        <Modal visible={isStep2Loading} transparent animationType="fade">
                            <View style={styles.loadingOverlay}>
                                <View style={[styles.loadingBox, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                                    <ActivityIndicator size="large" color={isDark ? '#E2FF46' : '#8B5CF6'} />
                                    <Text color={isDark ? '$textDark50' : '#000000'} fontSize={14} mt={12} fontWeight="$medium">
                                        {t('create.experience.ai.processingContent')}
                                    </Text>
                                </View>
                            </View>
                        </Modal>
                    </Box>
                </FormProvider>
            </SafeAreaView>
        );
    }

    // Render Step 1
    return (
        <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
            <FormProvider {...methods}>
                <Box flex={1} bg={isDark ? '#000000' : '#FFFFFF'}>
                    {/* Header */}
                    <Header
                        title={t('create.experience.header.title')}
                        leftAction="cancel"
                        onLeftActionPress={handleBackPress}
                        rightButton={{
                            text: t('create.experience.header.next'),
                            backgroundColor: isStep1NextEnabled ? '#D0F205' : '#EDEDED',
                            borderWidth: 1,
                            borderColor: isStep1NextEnabled ? '#B8CC04' : '#B1B1B1',
                            textColor: isStep1NextEnabled ? '#111111' : '#B1B1B1',
                            fontSize: 14,
                            borderRadius: 25,
                            paddingX: 12,
                            paddingY: 8,
                            onPress: handleNextPress,
                        }}
                    />

                    {/* Step 1 Content */}
                    <StepOneScreen
                        selectedDuration={step1Duration || ''}
                        selectedCondition={selectedCondition || ''}
                        selectedFrequency={selectedFrequency || ''}
                        onDurationChange={(value) => setValue('step1Duration', value, { shouldValidate: true })}
                        onConditionChange={(value) => setValue('selectedCondition', value, { shouldValidate: true })}
                        onFrequencyChange={(value) => setValue('selectedFrequency', value, { shouldValidate: true })}
                        selectedProduct={selectedProduct}
                        durationOptions={durations}
                        locationOptions={locations}
                        purposeOptions={purposes}
                    />
                </Box>
            </FormProvider>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: {
        paddingHorizontal: 32,
        paddingVertical: 20,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 160,
    },
});
