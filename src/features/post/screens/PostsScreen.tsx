import React, { useRef, useMemo, useCallback, useState } from 'react';
import { Platform, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, Pressable, Text } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { CreateButton } from '../components/CreateButton';
import PostCard from '@/src/components/PostCards/PostCard';
import TipsAndTricksPostCard from '@/src/components/PostCards/TipsAndTricksPostCard';
import QuestionPostCard from '@/src/components/PostCards/QuestionPostCard';
import BenchmarkPostCard from '@/src/components/PostCards/BenchmarkPostCard';
import ExperiencePostCard from '@/src/components/PostCards/ExperiencePostCard';
import UpdatePostCard from '@/src/components/PostCards/UpdatePostCard';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import type { PostStackParamList } from '../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useCreatePostFlowStore } from '../store/createPostFlowStore';
import { useCatalogUIStore } from '@/src/features/catalog/store/catalogUIStore';
import { useBottomOffset, toImageSource, DEFAULT_USER_AVATAR, isSameImageSource } from '@/src/utils';
import { useSubCategoryPosts, useProductGroupPosts, useCatalogProductPosts } from '@/src/features/catalog/api/hooks';
import { mapProductInfoTypeToContextType } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateCatalogPosts } from '../api/hooks';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { ProfilePost } from '@/src/features/profile/types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ExperiencePostApiItem } from '@/src/types/ExperienceCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ExperiencePostCardData, ExperiencePostCardContentItem } from '@/src/types/ExperienceCard';
import { FeedSkeleton } from '@/src/components/Skeletons';
import { CardType } from '@/src/types/common';
import { FilterSortBottomSheet, type FilterSortState } from '../components/FilterSortBottomSheet';
import { mapPostTypeToFilter } from '../utils/postTypeMapping';

type PostsScreenRouteProp = RouteProp<PostStackParamList, 'PostsScreen'>;
type PostsScreenNavigationProp = NativeStackNavigationProp<PostStackParamList>;

export const PostsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<PostsScreenNavigationProp>();
  const route = useRoute<PostsScreenRouteProp>();
  
  // PERFORMANCE FIX: Memoize route params to prevent unnecessary re-renders
  const routeParams = useMemo(() => route.params, [route.params]);
  const { stage, name, productInfo, selectedProduct, contextType, contextId } = routeParams;
  
  // Capitalize first letter of name for header
  const capitalizedName = useMemo(() => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [name]);
  
  const selectedProductPayload = useMemo(() => {
    if (!selectedProduct) return undefined;
    return {
      id: selectedProduct.id,
      name: selectedProduct.name,
      description: selectedProduct.description,
      image: selectedProduct.image,
    };
  }, [selectedProduct]);

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();
  
  // Bottom offset for bottom sheet padding
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  
  // Bottom sheet state
  const [bottomSheetKey, setBottomSheetKey] = useState(0);

  // Filter/Sort state
  const [filters, setFilters] = useState<FilterSortState>({
    postType: undefined,
    sort: undefined,
  });
  
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Determine contextType and contextId for feed API
  const feedContextType = useMemo((): 'sub_category' | 'product_group' | 'product' | undefined => {
    // Priority: route params > stage
    if (contextType) {
      return mapProductInfoTypeToContextType(contextType);
    }
    
    switch (stage) {
      case 'Product':
        return 'product';
      case 'ProductGroup':
        return 'product_group';
      case 'SubCategories':
        return 'sub_category';
      default:
        return undefined;
    }
  }, [contextType, stage]);

  const feedContextId = useMemo((): string | undefined => {
    // Priority: route params > store > selectedProduct
    if (contextId) {
      if (__DEV__) {
        console.log('[PostsScreen] ✅ Using contextId from route params:', contextId);
      }
      return contextId;
    }
    
    const selectedProductId = useCatalogUIStore.getState().selectedProductId;
    const selectedSubCategoryId = useCatalogUIStore.getState().selectedSubCategoryId;
    const selectedProductGroupId = useCatalogUIStore.getState().selectedProductGroupId;
    
    let result: string | undefined;
    switch (feedContextType) {
      case 'product':
        result = selectedProductId || selectedProduct?.id;
        break;
      case 'product_group':
        result = selectedProductGroupId;
        break;
      case 'sub_category':
        result = selectedSubCategoryId;
        break;
      default:
        result = undefined;
    }
    
    if (__DEV__) {
      console.log('[PostsScreen] 🔍 Feed Context ID calculated:', {
        feedContextType,
        contextId,
        selectedProductId,
        selectedProductGroupId,
        selectedSubCategoryId,
        selectedProductFromPayload: selectedProduct?.id,
        result,
      });
    }
    
    return result;
  }, [contextId, feedContextType, selectedProduct]);

  // Determine which API to use based on context type
  // Use catalog posts endpoints for better hierarchical feed support
  // Map frontend post type to backend filter parameter
  const rawBackendFilter = filters.postType && filters.postType !== 'All' 
    ? mapPostTypeToFilter(filters.postType, feedContextType || 'sub_category')
    : 'all';
  
  // Filter out invalid filter values based on context type
  const backendFilter = useMemo(() => {
    if (!rawBackendFilter || rawBackendFilter === 'all') return 'all';
    
    // Sub category and product group only support: all, free, tips_and_tricks, questions
    if (feedContextType === 'sub_category' || feedContextType === 'product_group') {
      if (['free', 'tips_and_tricks', 'questions'].includes(rawBackendFilter)) {
        return rawBackendFilter as 'free' | 'tips_and_tricks' | 'questions';
      }
      return 'all';
    }
    
    // Product supports all filter types
    if (feedContextType === 'product') {
      return rawBackendFilter as 'free' | 'tips_and_tricks' | 'questions' | 'updates' | 'benchmarks' | 'reviews';
    }
    
    return 'all';
  }, [rawBackendFilter, feedContextType]);
  
  // Map frontend sort to backend sort parameter
  const backendSort = useMemo(() => {
    const sort = filters.sort || 'newest';
    if (sort === 'popular') {
      return 'most_popular' as const;
    }
    return sort as 'newest' | 'oldest' | 'most_popular';
  }, [filters.sort]);

  // Type-safe filter values for sub category and product group
  const subCategoryProductGroupFilter = useMemo(() => {
    if (backendFilter === 'all') return undefined;
    if (['free', 'tips_and_tricks', 'questions'].includes(backendFilter)) {
      return backendFilter as 'free' | 'tips_and_tricks' | 'questions';
    }
    return undefined;
  }, [backendFilter]);

  const subCategoryPostsQuery = useSubCategoryPosts(
    feedContextType === 'sub_category' ? feedContextId : undefined,
    subCategoryProductGroupFilter,
    backendSort !== 'newest' ? backendSort : undefined,
    20
  );

  const productGroupPostsQuery = useProductGroupPosts(
    feedContextType === 'product_group' ? feedContextId : undefined,
    subCategoryProductGroupFilter,
    backendSort !== 'newest' ? backendSort : undefined,
    20
  );

  // Type-safe filter value for product
  const productFilter = useMemo(() => {
    if (backendFilter === 'all') return undefined;
    if (['free', 'tips_and_tricks', 'questions', 'updates', 'benchmarks', 'reviews'].includes(backendFilter)) {
      return backendFilter as 'free' | 'tips_and_tricks' | 'questions' | 'updates' | 'benchmarks' | 'reviews';
    }
    return undefined;
  }, [backendFilter]);

  const catalogProductPostsQuery = useCatalogProductPosts(
    feedContextType === 'product' ? feedContextId : undefined,
    productFilter,
    backendSort !== 'newest' ? backendSort : undefined,
    20
  );

  // Debug: Log query state for product posts
  React.useEffect(() => {
    if (feedContextType === 'product' && feedContextId) {
      if (__DEV__) {
        console.log('[PostsScreen] 🔍 Product Posts Query State:', {
          feedContextType,
          feedContextId,
          productFilter,
          backendSort,
          isLoading: catalogProductPostsQuery.isLoading,
          isError: catalogProductPostsQuery.isError,
          error: catalogProductPostsQuery.error,
          hasData: !!catalogProductPostsQuery.data,
          pagesCount: catalogProductPostsQuery.data?.pages?.length || 0,
          totalItems: catalogProductPostsQuery.data?.pages?.reduce((acc, page) => acc + (page.items?.length || 0), 0) || 0,
        });
      }
    }
  }, [feedContextType, feedContextId, productFilter, backendSort, catalogProductPostsQuery]);

  // Select the appropriate query based on context type
  // Catalog posts endpoints now support filter and sort parameters directly
  const activeQuery = useMemo(() => {
    switch (feedContextType) {
      case 'sub_category':
        return subCategoryPostsQuery;
      case 'product_group':
        return productGroupPostsQuery;
      case 'product':
        return catalogProductPostsQuery;
      default:
        return null;
    }
  }, [
    feedContextType,
    subCategoryPostsQuery,
    productGroupPostsQuery,
    catalogProductPostsQuery,
  ]);

  // Extract data from active query
  const queryResult = activeQuery || {
    data: undefined,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    error: null,
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = queryResult;

  // PERFORMANCE FIX: Optimize feedItems calculation - lazy evaluation
  // Only calculate when data is available, use early return for empty state
  const feedItems = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) {
      if (__DEV__) {
        console.log('[PostsScreen] ⚠️ No data pages:', {
          hasData: !!data,
          pagesLength: data?.pages?.length || 0,
          feedContextType,
          feedContextId,
        });
      }
      return [];
    }
    
    // PERFORMANCE FIX: Use Set for faster duplicate checking
    const seenIds = new Set<string>();
    const uniqueItems: FeedApiItem[] = [];
    
    // Iterate through pages and items once
    for (const page of data.pages) {
      if (!page.items || page.items.length === 0) {
        if (__DEV__) {
          console.log('[PostsScreen] ⚠️ Empty page items:', {
            pageItemsLength: page.items?.length || 0,
            pagePagination: page.pagination,
          });
        }
        continue;
      }
      
      for (const item of page.items) {
        const itemId = item.data?.id;
        if (itemId && !seenIds.has(itemId)) {
          seenIds.add(itemId);
          uniqueItems.push(item);
        } else if (__DEV__) {
          console.log('[PostsScreen] ⚠️ Skipping item:', {
            hasItemId: !!itemId,
            isDuplicate: itemId ? seenIds.has(itemId) : false,
            itemType: item.type,
            itemDataId: item.data?.id,
          });
        }
      }
    }
    
    if (__DEV__) {
      console.log('[PostsScreen] ✅ Feed items calculated:', {
        totalItems: uniqueItems.length,
        feedContextType,
        feedContextId,
        pagesCount: data.pages.length,
        itemsPerPage: data.pages.map(p => p.items?.length || 0),
      });
    }
    
    return uniqueItems;
  }, [data?.pages, feedContextType, feedContextId]);

  // Convert stage from PostsScreen to CatalogStage format
  const getCatalogStage = useCallback((): 'subcategories' | 'productgroups' | 'products' | undefined => {
    switch (stage) {
      case 'SubCategories':
        return 'subcategories';
      case 'ProductGroup':
        return 'productgroups';
      case 'Product':
        return 'products';
      default:
        return undefined;
    }
  }, [stage]);

  const handleFilterPress = useCallback(() => {
    // Reset bottom sheet key to remount component
    setBottomSheetKey(prev => prev + 1);
    
    openBottomSheet(
      <FilterSortBottomSheet
        key={bottomSheetKey + 1}
        contextType={feedContextType || 'sub_category'}
        initialFilters={filters}
        onFilterChange={(newFilters) => {
          setFilters(newFilters);
        }}
        onClose={closeBottomSheet}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: true,
        paddingBottom: bottomOffset,
        onChange: (index: number) => {
          if (index === -1) {
            setBottomSheetKey(prev => prev + 1);
          }
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, feedContextType, filters, bottomOffset]);

  const handlePostTypeSelect = useCallback((type: string, experienceOption?: 'own' | 'tried') => {
    console.log('Post type selected:', type, 'experienceOption:', experienceOption);
    
    // Close bottom sheet first
    closeBottomSheet();
    
    // Navigate to appropriate screen based on post type
    if (type === 'free') {
      // CatalogUIStore'dan ID'leri al
      const selectedProductId = useCatalogUIStore.getState().selectedProductId;
      const selectedSubCategoryId = useCatalogUIStore.getState().selectedSubCategoryId;
      const selectedProductGroupId = useCatalogUIStore.getState().selectedProductGroupId;
      
      // Route params'tan type'ı al (fallback için contextType da kontrol et)
      let determinedContextType: ProductInfoType | undefined = contextType;
      let determinedContextId: string | undefined = contextId; // Backward compatibility için route params'tan al
      
      // Eğer contextType yoksa stage'den belirle
      if (!determinedContextType) {
        switch (stage) {
          case 'Product':
            determinedContextType = ProductInfoType.PRODUCT;
            break;
          case 'ProductGroup':
            determinedContextType = ProductInfoType.PRODUCT_GROUP;
            break;
          case 'SubCategories':
            determinedContextType = ProductInfoType.SUB_CATEGORY;
            break;
        }
      }
      
      // Type'a göre store'dan ID'yi al (route params fallback)
      if (!determinedContextId && determinedContextType) {
        switch (determinedContextType) {
          case ProductInfoType.PRODUCT:
            determinedContextId = selectedProductId || selectedProduct?.id;
            break;
          case ProductInfoType.PRODUCT_GROUP:
            determinedContextId = selectedProductGroupId;
            break;
          case ProductInfoType.SUB_CATEGORY:
            determinedContextId = selectedSubCategoryId;
            break;
        }
      }
      
      // Store'da ID yoksa hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[PostsScreen] ❌ Missing contextType or contextId. Type:', determinedContextType, 'ID:', determinedContextId);
        // TODO: Show error toast/modal to user
        return;
      }
      
      // Save to flow store
      const setFlowContext = useCreatePostFlowStore.getState().setFlowContext;
      setFlowContext(determinedContextType, determinedContextId, productInfo ? {
        image: productInfo.image,
        title: productInfo.title,
        subName: productInfo.subName,
      } : undefined);
      
      navigation.navigate('CreatePostScreen', {
        contextType: determinedContextType,
        // contextId artık route params'tan gönderilmiyor, store'dan okunacak
        productInfo,
      });
    } else if (type === 'tips') {
      // CatalogUIStore'dan ID'leri al
      const selectedProductId = useCatalogUIStore.getState().selectedProductId;
      const selectedSubCategoryId = useCatalogUIStore.getState().selectedSubCategoryId;
      const selectedProductGroupId = useCatalogUIStore.getState().selectedProductGroupId;
      
      // Route params'tan type'ı al (fallback için contextType da kontrol et)
      let determinedContextType: ProductInfoType | undefined = contextType;
      let determinedContextId: string | undefined = contextId; // Backward compatibility için route params'tan al
      
      // Eğer contextType yoksa stage'den belirle
      if (!determinedContextType) {
        switch (stage) {
          case 'Product':
            determinedContextType = ProductInfoType.PRODUCT;
            break;
          case 'ProductGroup':
            determinedContextType = ProductInfoType.PRODUCT_GROUP;
            break;
          case 'SubCategories':
            determinedContextType = ProductInfoType.SUB_CATEGORY;
            break;
        }
      }
      
      // Type'a göre store'dan ID'yi al (route params fallback)
      if (!determinedContextId && determinedContextType) {
        switch (determinedContextType) {
          case ProductInfoType.PRODUCT:
            determinedContextId = selectedProductId || selectedProduct?.id;
            break;
          case ProductInfoType.PRODUCT_GROUP:
            determinedContextId = selectedProductGroupId;
            break;
          case ProductInfoType.SUB_CATEGORY:
            determinedContextId = selectedSubCategoryId;
            break;
        }
      }
      
      // Store'da ID yoksa hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[PostsScreen] ❌ Missing contextType or contextId for tips. Type:', determinedContextType, 'ID:', determinedContextId);
        // TODO: Show error toast/modal to user
        return;
      }
      
      // Save to flow store
      const setFlowContext = useCreatePostFlowStore.getState().setFlowContext;
      setFlowContext(determinedContextType, determinedContextId, productInfo ? {
        image: productInfo.image,
        title: productInfo.title,
        subName: productInfo.subName,
      } : undefined);
      
      navigation.navigate('CreateTipsAndTrickPostScreen');
    } else if (type === 'question') {
      // CatalogUIStore'dan ID'leri al
      const selectedProductId = useCatalogUIStore.getState().selectedProductId;
      const selectedSubCategoryId = useCatalogUIStore.getState().selectedSubCategoryId;
      const selectedProductGroupId = useCatalogUIStore.getState().selectedProductGroupId;
      
      // Route params'tan type'ı al (fallback için contextType da kontrol et)
      let determinedContextType: ProductInfoType | undefined = contextType;
      let determinedContextId: string | undefined = contextId; // Backward compatibility için route params'tan al
      
      // Eğer contextType yoksa stage'den belirle
      if (!determinedContextType) {
        switch (stage) {
          case 'Product':
            determinedContextType = ProductInfoType.PRODUCT;
            break;
          case 'ProductGroup':
            determinedContextType = ProductInfoType.PRODUCT_GROUP;
            break;
          case 'SubCategories':
            determinedContextType = ProductInfoType.SUB_CATEGORY;
            break;
        }
      }
      
      // Type'a göre store'dan ID'yi al (route params fallback)
      if (!determinedContextId && determinedContextType) {
        switch (determinedContextType) {
          case ProductInfoType.PRODUCT:
            determinedContextId = selectedProductId || selectedProduct?.id;
            break;
          case ProductInfoType.PRODUCT_GROUP:
            determinedContextId = selectedProductGroupId;
            break;
          case ProductInfoType.SUB_CATEGORY:
            determinedContextId = selectedSubCategoryId;
            break;
        }
      }
      
      // Store'da ID yoksa hata göster
      if (!determinedContextType || !determinedContextId) {
        console.error('[PostsScreen] ❌ Missing contextType or contextId for question. Type:', determinedContextType, 'ID:', determinedContextId);
        // TODO: Show error toast/modal to user
        return;
      }
      
      // Save to flow store
      const setFlowContext = useCreatePostFlowStore.getState().setFlowContext;
      setFlowContext(determinedContextType, determinedContextId, productInfo ? {
        image: productInfo.image,
        title: productInfo.title,
        subName: productInfo.subName,
      } : undefined);
      
      navigation.navigate('CreateQuestionPostScreen');
    } else if (type === 'experience') {
      navigation.navigate('CreateExperiencePostScreen', {
        product: selectedProductPayload,
        fromInventory: false,
        experienceOption: experienceOption,
      });
    } else if (type === 'benchmark') {
      navigation.navigate('CreateBenchmarkPostScreen', {
        product: selectedProductPayload,
      });
    } else if (type === 'update') {
      navigation.navigate('CreateUpdatePostScreen', {
        product: selectedProductPayload,
      });
    }
    // Handle other post types here if needed
  }, [navigation, selectedProductPayload, closeBottomSheet, contextType, contextId, stage, productInfo, selectedProduct]);

  // Mapping functions (from FeedScreen)
  const mapFeedToCardData = useCallback((item: ProfilePost): PostCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    
    const contentString = Array.isArray(item.content)
      ? item.content
        .filter((contentItem) => contentItem != null)
        .map((contentItem) => contentItem?.content || '')
        .join(' ')
      : (item.content || '');

    const mappedImages = Array.isArray(item.images)
      ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
      : [];
    
    const images = mappedImages;

    const contextImage = item.contextData?.image
      ? (toImageSource(item.contextData.image) || defaultPostImage)
      : defaultPostImage;
    const contextData = item.contextData
      ? {
          ...item.contextData,
          image: contextImage,
        }
      : undefined;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png'),
      },
      content: contentString,
      images,
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: item.contextType,
      contextData,
      source: item.source,
    };
  }, []);

  const mapExperienceToCardData = useCallback((item: ExperiencePostApiItem & { type: 'experience' }): ExperiencePostCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const defaultAvatar = require('@/assets/avatar/default-useravatar.png');
    const avatarSource = toImageSource(item.user?.avatar) || defaultAvatar;
    const ctx = item.contextData as { product?: { id?: string; name?: string; image?: string | null; subName?: string; isOwned?: boolean } } | undefined;
    const rawProduct = ctx?.product ?? item.contextData ?? item.product;
    const productImage = rawProduct?.image
      ? toImageSource(rawProduct.image)
      : defaultPostImage;

    const trimTrailingParen = (s: string) => (s || '').replace(/\s*\(\s*$/, '').trim();
    const contentBlocks = item.experienceContent ?? (Array.isArray(item.content) ? item.content : []);
    const content: ExperiencePostCardContentItem[] = Array.isArray(contentBlocks)
      ? contentBlocks
        .filter((contentItem) => contentItem != null)
        .map((contentItem) => {
          const title = contentItem?.title || '';
          const icon: 'tag' | 'package' = (title.toLowerCase().includes('product') || title.toLowerCase().includes('usage')) ? 'package' : 'tag';
          return {
            tag: { icon, title },
            text: trimTrailingParen(contentItem?.content || ''),
            rating: Array(5)
              .fill(false)
              .map((_, index) => index < (contentItem?.rating || 0)),
          };
        })
      : [];

    const mappedImages = Array.isArray(item.images)
      ? item.images
          .map((img) => toImageSource(img))
          .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
      : [];
    // Carousel'de sadece kullanıcı yüklediği görseller; ürün görseli gösterilmez
    const images = mappedImages.filter((img) => !isSameImageSource(img, productImage));

    const isOwned = item.status === 'own' || rawProduct?.isOwned || false;
    // 3 tag: duration, condition (location), purpose. API tags yoksa/eksikse *Name alanlarından doldur.
    const tagsFromApi = Array.isArray(item.tags) ? item.tags : [];
    const tags =
      tagsFromApi.length >= 3
        ? tagsFromApi
        : [item.durationName, item.locationName, item.purposeName].filter((s): s is string => !!s);
    const subNameRaw = rawProduct?.subName ?? '';
    const subName = subNameRaw && !/^Status:\s*(tested|own)$/i.test(String(subNameRaw)) ? subNameRaw : '';
    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
        action: isOwned ? 'Added new product and experiences to inventory!' : undefined,
      },
      contextData: {
        id: rawProduct?.id || '',
        name: rawProduct?.name || '',
        subName,
        image: productImage || defaultPostImage,
        isOwned,
      },
      content,
      tags,
      images,
      stats: item.stats,
      createdAt: item.createdAt,
    };
  }, []);

  const mapBenchmarkToCardData = useCallback((item: BenchmarkApiItem & { type: 'benchmark' }): BenchmarkCardData => {
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

    const products: BenchmarkProduct[] = (item.products && Array.isArray(item.products))
      ? item.products
        .filter((p) => p != null)
        .map((p) => ({
          id: p?.id || '',
          name: p?.name || '',
          subName: p?.subName || '',
          image: toImageSource(p?.image) || require('@/assets/inventory/product_01.png'),
          isOwned: p?.isOwned || false,
          choice: p?.choice || false,
        }))
      : [];

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      products,
      content: item.content || '',
      stats: item.stats,
      createdAt: item.createdAt,
    };
  }, []);

  const mapTipsToCardData = useCallback((item: TipsApiItem & { type: 'tipsAndTricks' }): TipsCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

    if (!item.contextData) {
      const mappedImages = Array.isArray(item.images)
        ? item.images
            .map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
        : [];
      const images = mappedImages;

      return {
        id: item.id || '',
        user: {
          id: item.user?.id || '',
          name: item.user?.name || '',
          title: item.user?.title || '',
          avatar: avatarSource,
        },
        category: {
          id: '',
          name: '',
          subCategory: '',
          image: require('@/assets/inventory/product_01.png'),
          product: {
            id: '',
            name: '',
            subName: '',
            image: require('@/assets/inventory/product_01.png'),
          },
        },
        content: item.content || '',
        images,
        stats: item.stats,
        tag: item.tag,
        createdAt: item.createdAt,
      };
    }

    const productImage = toImageSource(item.contextData.image);
    const product: TipsProduct = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subName: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
    };

    const category: TipsCategory = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subCategory: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
      product,
    };

    const mappedImages = Array.isArray(item.images)
      ? item.images
          .map((img) => toImageSource(img))
          .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
      : [];
    const images = mappedImages;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      category,
      content: item.content || '',
      images,
      stats: item.stats,
      tag: item.tag,
      createdAt: item.createdAt,
    };
  }, []);

  const mapQuestionToCardData = useCallback((item: QuestionApiItem & { type: 'question' }): QuestionCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const avatarSource = toImageSource(item.user?.avatar) || require('@/assets/avatar/default-useravatar.png');

    if (!item.contextData) {
      const mappedImages = Array.isArray(item.images)
        ? item.images
            .map((img) => toImageSource(img))
            .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
        : [];
      const images = mappedImages;

      return {
        id: item.id || '',
        user: {
          id: item.user?.id || '',
          name: item.user?.name || '',
          title: item.user?.title || '',
          avatar: avatarSource,
        },
        category: {
          id: '',
          name: '',
          subCategory: '',
          image: require('@/assets/inventory/product_01.png'),
          product: {
            id: '',
            name: '',
            subName: '',
            image: require('@/assets/inventory/product_01.png'),
          },
        },
        content: item.content || '',
        isBoosted: item.isBoosted || false,
        images,
        stats: item.stats,
        createdAt: item.createdAt,
      };
    }

    const productImage = toImageSource(item.contextData.image);
    const product: QuestionCardProduct = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subName: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
    };

    const category: QuestionCardCategory = {
      id: item.contextData.id || '',
      name: item.contextData.name || '',
      subCategory: item.contextData.subName || '',
      image: productImage || require('@/assets/inventory/product_01.png'),
      product,
    };

    const mappedImages = Array.isArray(item.images)
      ? item.images
          .map((img) => toImageSource(img))
          .filter((imgSource): imgSource is NonNullable<typeof imgSource> => !!imgSource)
      : [];
    const images = mappedImages;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      category,
      content: item.content || '',
      isBoosted: item.isBoosted || false,
      images,
      stats: item.stats,
      createdAt: item.createdAt,
    };
  }, []);

  const mapUpdateToCardData = useCallback((item: UpdateApiItem & { type: 'update' }): UpdateCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const avatarSource = toImageSource(item.user.avatar) || require('@/assets/avatar/default-useravatar.png');

    let productInfoType: ProductInfoType = ProductInfoType.PRODUCT;
    if (item.contextType === 'product_group') {
      productInfoType = ProductInfoType.PRODUCT_GROUP;
    } else if (item.contextType === 'sub_category') {
      productInfoType = ProductInfoType.SUB_CATEGORY;
    }

    if (!item.relatedPost) {
      const mappedImages = Array.isArray(item.images)
        ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
        : [];
      const images = mappedImages;

      return {
        id: item.id,
        user: {
          id: item.user.id,
          name: item.user.name,
          title: item.user.title,
          avatar: avatarSource,
        },
        stats: item.stats,
        createdAt: item.createdAt,
        contextType: productInfoType,
        product: {
          id: '',
          name: '',
          subName: '',
          image: require('@/assets/inventory/product_01.png'),
          isOwned: false,
        },
        content: item.content || '',
        images,
        relatedPost: undefined,
      };
    }

    const relatedPostContent = (item.relatedPost?.content && Array.isArray(item.relatedPost.content))
      ? item.relatedPost.content
        .filter((contentItem) => contentItem != null)
        .map((contentItem) => {
          const ratingArray: number[] = Array(5).fill(0);
          const ratingValue = Math.min(Math.max(Math.round((contentItem?.rating || 0) / 20), 0), 5);
          for (let i = 0; i < ratingValue; i++) {
            ratingArray[i] = 1;
          }

          return {
            tag: {
              icon: 'tag',
              title: contentItem?.title || '',
            },
            text: contentItem?.content || '',
            rating: ratingArray,
          };
        })
      : [];

    const mappedImages = Array.isArray(item.images)
      ? item.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
      : [];
    const images = mappedImages;

    return {
      id: item.id || '',
      user: {
        id: item.user?.id || '',
        name: item.user?.name || '',
        title: item.user?.title || '',
        avatar: avatarSource,
      },
      stats: item.stats,
      createdAt: item.createdAt,
      contextType: productInfoType,
      product: {
        id: item.relatedPost?.product?.id || '',
        name: item.relatedPost?.product?.name || '',
        subName: item.relatedPost?.product?.subName || '',
        image: toImageSource(item.relatedPost?.product?.image) || require('@/assets/inventory/product_01.png'),
        isOwned: item.relatedPost?.product?.isOwned || false,
      },
      content: item.content || '',
      images,
      relatedPost: item.relatedPost ? {
        id: item.relatedPost.id || '',
        product: {
          id: item.relatedPost.product?.id || '',
          name: item.relatedPost.product?.name || '',
          subName: item.relatedPost.product?.subName || '',
          image: toImageSource(item.relatedPost.product?.image) || require('@/assets/inventory/product_01.png'),
          isOwned: item.relatedPost.product?.isOwned || false,
        },
        content: relatedPostContent,
        tags: (item.relatedPost.tags && Array.isArray(item.relatedPost.tags)) ? item.relatedPost.tags : [],
        images: (() => {
          const relatedPostImages = (item.relatedPost?.images && Array.isArray(item.relatedPost.images))
            ? item.relatedPost.images.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img)
            : [];
          return relatedPostImages.length > 0 ? relatedPostImages : [defaultPostImage];
        })(),
      } : undefined,
    };
  }, []);

  // PERFORMANCE FIX: Memoize ListFooterComponent
  const ListFooterComponent = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box py={20} alignItems="center">
        <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
      </Box>
    );
  }, [isFetchingNextPage, isDark]);

  // PERFORMANCE FIX: Memoize contentContainerStyle - FeedScreen ile aynı yapı
  // BUG FIX: paddingBottom eklenmeli - FeedScreen'de bottomPadding kullanılıyor
  const contentContainerStyle = useMemo(
    () => ({ paddingHorizontal: 16, paddingTop: 8, paddingBottom: bottomOffset }),
    [bottomOffset]
  );

  // PERFORMANCE FIX: Memoize keyExtractor
  const keyExtractor = useCallback((item: FeedApiItem) => item.data.id, []);

  // Render feed item based on type (similar to FeedScreen)
  // PERFORMANCE FIX: FeedScreen ile aynı yapı - Box wrapper yok, sadece component return
  const renderFeedItem = useCallback(({ item }: { item: FeedApiItem }) => {
    // Safety check
    if (!item || !item.data || !item.data.id) {
      if (__DEV__) {
        console.log('[PostsScreen] ⚠️ Invalid item in renderFeedItem:', {
          hasItem: !!item,
          hasData: !!item?.data,
          hasId: !!item?.data?.id,
          itemType: item?.type,
        });
      }
      return null;
    }

    const itemId = item.data.id;
    
    // Eğer tüm gönderiler aynı product'a aitse (feedContextType === 'product'), 
    // product content'ini gizle çünkü zaten üstte ProductInfoCard gösteriliyor
    const shouldHideProduct = feedContextType === 'product';
    
    if (__DEV__) {
      console.log('[PostsScreen] 🎨 Rendering feed item:', {
        itemId,
        itemType: item.type,
        dataType: item.data.type,
        hasContextType: 'contextType' in item.data,
        hasContextData: 'contextData' in item.data,
        hasIsBoosted: 'isBoosted' in item.data,
        feedContextType,
        shouldHideProduct,
      });
    }

    // Use string comparison for type matching
    switch (item.type) {
      case CardType.EXPERIENCE:
      case 'experience':
        const expData = item.data as ExperiencePostApiItem;
        if (('contextData' in item.data || 'product' in item.data) && (Array.isArray(expData.experienceContent) || Array.isArray(expData.content))) {
          return (
            <ExperiencePostCard
              key={itemId}
              data={mapExperienceToCardData(item.data as ExperiencePostApiItem & { type: 'experience' })}
              hideProduct={shouldHideProduct}
            />
          );
        }
        return null;
      case CardType.POST:
      case 'post':
        return (
          <PostCard
            key={itemId}
            data={mapFeedToCardData(item.data as ProfilePost)}
            hideProduct={shouldHideProduct}
          />
        );
      case CardType.BENCHMARK:
      case 'benchmark':
        return (
          <BenchmarkPostCard
            key={itemId}
            data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
          />
        );
      case CardType.QUESTION:
      case 'question':
        // Check if item has required fields for question post
        if ('contextType' in item.data && 'contextData' in item.data) {
          // isBoosted is optional, so we don't require it
          return (
            <QuestionPostCard
              key={itemId}
              data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
              hideProduct={shouldHideProduct}
            />
          );
        }
        if (__DEV__) {
          console.log('[PostsScreen] ⚠️ Question item missing required fields:', {
            hasContextType: 'contextType' in item.data,
            hasContextData: 'contextData' in item.data,
            itemData: item.data,
          });
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
      case 'tipsAndTricks':
        return (
          <TipsAndTricksPostCard
            key={itemId}
            data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
            hideProduct={shouldHideProduct}
          />
        );
      case CardType.UPDATE:
      case 'update':
        return (
          <UpdatePostCard
            key={itemId}
            data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
            hideProduct={shouldHideProduct}
          />
        );
      default:
        return null;
    }
  }, [mapFeedToCardData, mapExperienceToCardData, mapBenchmarkToCardData, mapQuestionToCardData, mapTipsToCardData, mapUpdateToCardData, feedContextType]);

  // Query client for invalidating queries
  const queryClient = useQueryClient();

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate queries first to ensure fresh data
      if (feedContextType && feedContextId) {
        invalidateCatalogPosts(queryClient, feedContextType, feedContextId);
      }
      
      // Refetch active query - this will fetch fresh data from the beginning
      if (activeQuery) {
        await activeQuery.refetch();
      }
    } catch (error) {
      console.error('[PostsScreen] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeQuery, feedContextType, feedContextId, queryClient]);

  // Refetch query when screen comes into focus (e.g., after creating a post)
  useFocusEffect(
    useCallback(() => {
      // Refetch active query when screen is focused
      // This ensures that newly created posts appear immediately
      if (activeQuery && feedContextId) {
        // Small delay to ensure navigation is complete
        const timer = setTimeout(() => {
          activeQuery.refetch();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [activeQuery, feedContextId])
  );

  const handleCreatePress = useCallback(() => {
    // Reset bottom sheet key to remount component and reset view
    setBottomSheetKey(prev => prev + 1);
    
    openBottomSheet(
      <CreatePostBottomSheet
        key={bottomSheetKey + 1}
        onClose={closeBottomSheet}
        onPostTypeSelect={handlePostTypeSelect}
        onViewChange={(view) => {
          // View change is handled internally by CreatePostBottomSheet
    console.log('BottomSheet view changed:', view);
        }}
        stage={getCatalogStage()}
      />,
      {
        enablePanDownToClose: true,
        enableOverDrag: false,
        enableHandlePanningGesture: true,
        enableContentPanningGesture: true,
        animateOnMount: false, // PERFORMANCE FIX: Disabled for instant opening
        paddingBottom: bottomOffset,
        onChange: (index: number) => {
          // Reset bottom sheet key when sheet closes to reset view state
          if (index === -1) {
            setBottomSheetKey(prev => prev + 1);
          }
        },
      }
    );
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, getCatalogStage, handlePostTypeSelect]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      {/* Header */}
      <Header
        title={capitalizedName}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable onPress={handleFilterPress}>
            <Feather
              name="filter"
              size={24}
              color={isDark ? '#FFFFFF' : '#000000'}
            />
          </Pressable>
        }
      />

      {/* Content */}
      <Box flex={1}>
        {/* Product Info Card */}
        <Box px="$4" py="$2">
          <ProductInfoCard
            image={productInfo.image}
            title={productInfo.title}
            subName={productInfo.subName}
            size="big"
            type={contextType || ProductInfoType.SUB_CATEGORY}
          />
        </Box>

        {/* Feed Items */}
        {isLoading && feedItems.length === 0 ? (
          <FeedSkeleton count={5} />
        ) : error ? (
          <Box flex={1} justifyContent="center" alignItems="center" px="$4">
            <VStack space="md" alignItems="center">
              <Text color="#CE4A4A" fontSize="$md" fontWeight="$bold">
                Feed Yüklenemedi
              </Text>
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm" textAlign="center">
                {error.message || 'Bilinmeyen bir hata oluştu'}
              </Text>
            </VStack>
          </Box>
        ) : feedItems.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center" px="$4">
            <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$sm">
              No posts found for this context yet.
            </Text>
          </Box>
        ) : (
          <FlatList
            data={feedItems}
            renderItem={renderFeedItem}
            keyExtractor={keyExtractor}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.1}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={isDark ? '#FFFFFF' : '#000000'}
                colors={isDark ? ['#FFFFFF'] : ['#000000']}
                progressBackgroundColor={isDark ? '#1A1A1A' : '#FFFFFF'}
              />
            }
            ListFooterComponent={ListFooterComponent}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}
            // PERFORMANCE FIX: Optimize initial render
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            // PERFORMANCE FIX: extraData ile re-render kontrolü
            extraData={feedItems.length}
          />
        )}
      </Box>

      {/* Create Button - Sadece Product stage'inde göster */}
      {stage === 'Product' && (
        <CreateButton onPress={handleCreatePress} />
      )}

      </Box>
    </SafeAreaView>
  );
};

