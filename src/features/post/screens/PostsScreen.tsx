import React, { useRef, useMemo, useCallback, useState } from 'react';
import { Platform, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, ScrollView, VStack, Pressable, Text } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import { useBottomOffset, toImageSource, DEFAULT_USER_AVATAR } from '@/src/utils';
import { useFeed, useFeedFiltered } from '@/src/features/feed/api/hooks';
import { useSubCategoryPosts, useProductGroupPosts, useCatalogProductPosts } from '@/src/features/catalog/api/hooks';
import { mapProductInfoTypeToContextType } from '../types';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { ProfilePost } from '@/src/features/profile/types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { UpdateApiItem, UpdateCardData } from '@/src/types/UpdateCard';
import type { PostCardData } from '@/src/types/PostCard';
import type { BenchmarkCardData, BenchmarkProduct } from '@/src/types/BenchmarkCard';
import type { TipsCardData, TipsCategory, TipsProduct } from '@/src/types/TipsAndTricksCard';
import type { QuestionCardData, QuestionCardCategory, QuestionCardProduct } from '@/src/types/QuestionCard';
import type { ReviewCardData, ReviewCardContentItem } from '@/src/types/ReviewsCard';
import { FeedSkeleton } from '@/src/components/Skeletons';
import { CardType } from '@/src/types/common';
import { FilterSortBottomSheet, type FilterSortState } from '../components/FilterSortBottomSheet';
import { mapPostTypeToTag, mapPostTypeToCatalogType, mapSortToBackend } from '../utils/postTypeMapping';
import type { FeedFilterParams } from '@/src/features/feed/api/feedApi';

type PostsScreenRouteProp = RouteProp<PostStackParamList, 'PostsScreen'>;
type PostsScreenNavigationProp = NativeStackNavigationProp<PostStackParamList>;

export const PostsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<PostsScreenNavigationProp>();
  const route = useRoute<PostsScreenRouteProp>();
  
  const { stage, name, productInfo, selectedProduct, contextType, contextId } = route.params;
  const selectedProductPayload = selectedProduct
    ? {
        id: selectedProduct.id,
        name: selectedProduct.name,
        description: selectedProduct.description,
        image: selectedProduct.image,
      }
    : undefined;

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
      return contextId;
    }
    
    const selectedProductId = useCatalogUIStore.getState().selectedProductId;
    const selectedSubCategoryId = useCatalogUIStore.getState().selectedSubCategoryId;
    const selectedProductGroupId = useCatalogUIStore.getState().selectedProductGroupId;
    
    switch (feedContextType) {
      case 'product':
        return selectedProductId || selectedProduct?.id;
      case 'product_group':
        return selectedProductGroupId;
      case 'sub_category':
        return selectedSubCategoryId;
      default:
        return undefined;
    }
  }, [contextId, feedContextType, selectedProduct]);

  // Determine which API to use based on context type
  // Use catalog posts endpoints for better hierarchical feed support
  const subCategoryPostsQuery = useSubCategoryPosts(
    feedContextType === 'sub_category' ? feedContextId : undefined,
    filters.postType ? mapPostTypeToCatalogType(filters.postType) : undefined,
    20
  );

  const productGroupPostsQuery = useProductGroupPosts(
    feedContextType === 'product_group' ? feedContextId : undefined,
    filters.postType ? mapPostTypeToCatalogType(filters.postType) : undefined,
    20
  );

  const catalogProductPostsQuery = useCatalogProductPosts(
    feedContextType === 'product' ? feedContextId : undefined,
    filters.postType ? mapPostTypeToCatalogType(filters.postType) : undefined,
    20
  );

  // Use filtered feed if filters are applied, otherwise use catalog posts endpoints
  const hasFilters = filters.postType !== undefined && filters.postType !== 'All' || filters.sort !== undefined;
  
  const filteredFeedQuery = useFeedFiltered(
    20,
    hasFilters ? {
      tags: filters.postType && filters.postType !== 'All' 
        ? [mapPostTypeToTag(filters.postType)].filter((tag): tag is string => !!tag)
        : undefined,
      sort: filters.sort ? mapSortToBackend(filters.sort) : undefined,
    } as FeedFilterParams : undefined,
    feedContextType,
    feedContextId,
    hasFilters // Only enable if filters are applied
  );

  // Select the appropriate query based on context type
  const activeQuery = useMemo(() => {
    if (hasFilters && feedContextType) {
      return filteredFeedQuery;
    }
    
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
    hasFilters,
    subCategoryPostsQuery,
    productGroupPostsQuery,
    catalogProductPostsQuery,
    filteredFeedQuery,
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

  // Flatten all pages into a single array and remove duplicates by ID
  const feedItems = useMemo(() => {
    if (!data?.pages) return [];
    
    const allItems = data.pages.flatMap((page) => page.items);
    
    // Remove duplicates by ID
    const uniqueItemsMap = new Map<string, FeedApiItem>();
    for (const item of allItems) {
      const itemId = item.data.id;
      if (!uniqueItemsMap.has(itemId)) {
        uniqueItemsMap.set(itemId, item);
      }
    }
    
    return Array.from(uniqueItemsMap.values());
  }, [data?.pages]);

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
        animateOnMount: false,
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
        fromInventory: experienceOption === 'own',
        experienceOption: experienceOption,
      });
    } else if (type === 'comparison') {
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
    };
  }, []);

  const mapExperienceToCardData = useCallback((item: ReviewApiItem & { type: 'experience' }): ReviewCardData => {
    const defaultPostImage = require('@/assets/defaultImages/default-post.png');
    const defaultAvatar = require('@/assets/avatar/default-useravatar.png');
    const avatarSource = toImageSource(item.user?.avatar) || defaultAvatar;
    const productImage = item.contextData?.image
      ? toImageSource(item.contextData.image)
      : defaultPostImage;

    const content: ReviewCardContentItem[] = (item.content && Array.isArray(item.content))
      ? item.content
        .filter((contentItem) => contentItem != null)
        .map((contentItem) => ({
          tag: {
            icon: 'tag',
            title: contentItem?.title || '',
          },
          text: contentItem?.content || '',
          rating: Array(5)
            .fill(false)
            .map((_, index) => index < (contentItem?.rating || 0)),
        }))
      : [];

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
        action: 'wrote a review',
      },
      contextData: {
        id: item.contextData?.id || '',
        name: item.contextData?.name || '',
        subName: item.contextData?.subName || '',
        image: productImage || defaultPostImage,
        isOwned: item.contextData?.isOwned || false,
      },
      content,
      tags: Array.isArray(item.tags) ? item.tags : [],
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

  // Render feed item based on type (similar to FeedScreen)
  const renderFeedItem = useCallback((item: FeedApiItem) => {
    // Safety check
    if (!item || !item.data || !item.data.id) {
      return null;
    }

    const itemId = item.data.id;

    // Use string comparison for type matching
    switch (item.type) {
      case CardType.EXPERIENCE:
      case 'experience':
        if ('contextData' in item.data && 'content' in item.data && Array.isArray(item.data.content)) {
          return (
            <Box px={16} py={8} key={itemId}>
              <ExperiencePostCard
                data={mapExperienceToCardData(item.data as ReviewApiItem & { type: 'experience' })}
              />
            </Box>
          );
        }
        return null;
      case CardType.POST:
      case 'post':
        return (
          <Box px={16} py={8} key={itemId}>
            <PostCard
              data={mapFeedToCardData(item.data as ProfilePost)}
              hideProduct={true}
            />
          </Box>
        );
      case CardType.BENCHMARK:
      case 'benchmark':
        return (
          <Box px={16} py={8} key={itemId}>
            <BenchmarkPostCard
              data={mapBenchmarkToCardData(item.data as BenchmarkApiItem & { type: 'benchmark' })}
            />
          </Box>
        );
      case CardType.QUESTION:
      case 'question':
        if ('contextType' in item.data && 'contextData' in item.data && 'isBoosted' in item.data) {
          return (
            <Box px={16} py={8} key={itemId}>
              <QuestionPostCard
                data={mapQuestionToCardData(item.data as QuestionApiItem & { type: 'question' })}
              />
            </Box>
          );
        }
        return null;
      case CardType.TIPS_AND_TRICKS:
      case 'tipsAndTricks':
        return (
          <Box px={16} py={8} key={itemId}>
            <TipsAndTricksPostCard
              data={mapTipsToCardData(item.data as TipsApiItem & { type: 'tipsAndTricks' })}
            />
          </Box>
        );
      case CardType.UPDATE:
      case 'update':
        return (
          <Box px={16} py={8} key={itemId}>
            <UpdatePostCard
              data={mapUpdateToCardData(item.data as UpdateApiItem & { type: 'update' })}
            />
          </Box>
        );
      default:
        return null;
    }
  }, [mapFeedToCardData, mapExperienceToCardData, mapBenchmarkToCardData, mapQuestionToCardData, mapTipsToCardData, mapUpdateToCardData]);

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
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
      {/* Header */}
      <Header
        title={name}
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
            renderItem={({ item }) => renderFeedItem(item)}
            keyExtractor={(item) => item.data.id}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.1}
            ListFooterComponent={() => {
              if (!isFetchingNextPage) return null;
              return (
                <Box py={20} alignItems="center">
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                </Box>
              );
            }}
            contentContainerStyle={{ paddingBottom: bottomOffset }}
            showsVerticalScrollIndicator={false}
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

