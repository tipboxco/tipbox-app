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
import { useFeed } from '@/src/features/feed/api/hooks';
import { mapProductInfoTypeToContextType } from '../types';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { ProfilePost } from '@/src/features/profile/types';
import type { BenchmarkApiItem } from '@/src/types/BenchmarkCard';
import type { TipsApiItem } from '@/src/types/TipsAndTricksCard';
import type { QuestionApiItem } from '@/src/types/QuestionCard';
import type { ReviewApiItem } from '@/src/types/ReviewsCard';
import type { UpdateApiItem } from '@/src/types/UpdateCard';
import { FeedSkeleton } from '@/src/components/Skeletons';

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

  // Feed API hook with context
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useFeed(20, feedContextType, feedContextId);

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

  const handleFilterPress = () => {
    // Handle filter/sort action
    console.log('Filter/Sort pressed');
  };

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
            renderItem={({ item }) => {
              // FeedScreen'deki render mantığını kullan
              // Şimdilik basit bir render yapalım, daha sonra FeedScreen'deki mapping fonksiyonlarını ekleyebiliriz
              switch (item.type) {
                case 'post':
                  return (
                    <Box px={16} py={8}>
                      <PostCard
                        data={{
                          id: (item.data as ProfilePost).id,
                          user: {
                            id: (item.data as ProfilePost).user.id,
                            name: (item.data as ProfilePost).user.name,
                            title: (item.data as ProfilePost).user.title,
                            avatar: toImageSource((item.data as ProfilePost).user.avatar) || DEFAULT_USER_AVATAR,
                          },
                          content: (() => {
                            const postContent = (item.data as ProfilePost).content;
                            if (Array.isArray(postContent)) {
                              return postContent.map((c: any) => c?.content || '').join(' ');
                            }
                            return typeof postContent === 'string' ? postContent : '';
                          })(),
                          images: (item.data as ProfilePost).images?.map((img) => toImageSource(img)).filter((img): img is NonNullable<typeof img> => !!img),
                          stats: (item.data as ProfilePost).stats,
                          createdAt: (item.data as ProfilePost).createdAt,
                          contextType: (item.data as ProfilePost).contextType,
                          contextData: (item.data as ProfilePost).contextData,
                        }}
                        hideProduct={true}
                      />
                    </Box>
                  );
                default:
                  return null;
              }
            }}
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

