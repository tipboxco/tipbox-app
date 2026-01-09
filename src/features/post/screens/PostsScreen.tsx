import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Platform, FlatList, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box, VStack, Pressable, Text } from '@gluestack-ui/themed';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useColorMode } from '@/src/hooks/useColorMode';
import { Header } from '@/src/components/Header';
import { ProductInfoCard } from '@/src/components/ProductInfoCard';
import { ProductInfoType } from '@/src/types/common';
import { CreateButton } from '../components/CreateButton';
import PostCard from '@/src/components/PostCards/PostCard';
import { CreatePostBottomSheet } from '@/src/components/CreatePostBottomSheet';
import type { PostStackParamList } from '../navigation';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGlobalBottomSheet } from '@/src/hooks/useGlobalBottomSheet';
import { useBottomOffset } from '@/src/utils';
import { useFeed } from '@/src/features/feed/api/hooks';
import { mapProductInfoTypeToContextType } from '../types';
import type { FeedApiItem } from '@/src/features/feed/api/feedApi';
import type { ProfilePost } from '@/src/features/profile/types';
import { toImageSource } from '@/src/utils';
import { FeedSkeleton } from '@/src/components/Skeletons';

const MEDUSA_BASE_URL =
  process.env.EXPO_PUBLIC_MEDUSA_URL || 'http://192.168.1.26:8090'; // fallback
const MEDUSA_API_KEY =
  process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY ||
  'pk_cfe68434d1ee0dd82890fcfe492a3472656dbea641266cb02f3dae8b204de65e';

// Yeni ürün tipi, API'den gelen şekle uygun
type MedusaApiProductImage = {
  id: string;
  url: string;
  metadata?: any;
  rank?: number;
  product_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type MedusaApiProductOptionValue = {
  id: string;
  value: string;
  metadata?: any;
  option_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};
type MedusaApiProductOption = {
  id: string;
  title: string;
  metadata?: any;
  product_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  values: MedusaApiProductOptionValue[];
};
// Diğer alanlar da eklenebilir gerekirse
type MedusaApiProduct = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  handle?: string;
  is_giftcard?: boolean;
  discountable?: boolean;
  thumbnail?: string;
  collection_id?: string | null;
  type_id?: string | null;
  weight?: number | null;
  length?: number | null;
  height?: number | null;
  width?: number | null;
  hs_code?: string | null;
  origin_country?: string | null;
  mid_code?: string | null;
  material?: string | null;
  created_at?: string;
  updated_at?: string;
  type?: any;
  collection?: any;
  options?: MedusaApiProductOption[];
  tags?: any[];
  images?: MedusaApiProductImage[];
  variants?: any[];
  categories?: any[];
};

// API'den gelen ürünü çeken hook
function useMedusaProduct(productId?: string) {
  const [product, setProduct] = useState<MedusaApiProduct | null>(null);
  const [loading, setLoading] = useState<boolean>(!!productId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`${MEDUSA_BASE_URL}/store/products/${productId}`, {
      headers: {
        'x-publishable-api-key': MEDUSA_API_KEY,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Ürün bulunamadı');
        return res.json();
      })
      .then(data => {
        setProduct(data.product);
      })
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [productId]);

  return { product, loading, error };
}

type PostsScreenRouteProp = RouteProp<PostStackParamList, 'PostsScreen'>;
type PostsScreenNavigationProp = NativeStackNavigationProp<PostStackParamList>;

export const PostsScreen = () => {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigation = useNavigation<PostsScreenNavigationProp>();
  const route = useRoute<PostsScreenRouteProp>();

  // Get productId from params
  const { productId } = route.params as any; // adapt to your navigation types
  // Also, optionally continue to support other params
  const { stage, name, productInfo, selectedProduct, contextType, contextId } = route.params;

  // Fetch product from Medusa using new API key, etc.
  const { product, loading: productLoading, error: productError } = useMedusaProduct(productId);

  // Global bottom sheet hook
  const { openBottomSheet, closeBottomSheet } = useGlobalBottomSheet();

  // Bottom offset for bottom sheet padding
  const bottomOffset = useBottomOffset({ includeTabBar: false, extraPadding: 8 });
  // Bottom sheet state
  const [bottomSheetKey, setBottomSheetKey] = useState(0);

  // For feed (can still use contextId/contextType logic as before for demo)
  const feedContextType = useMemo((): 'product' | undefined => {
    // Always use product context if productId is present
    if (productId) return 'product';
    return undefined;
  }, [productId]);
  const feedContextId = useMemo((): string | undefined => {
    if (productId) return productId;
    return undefined;
  }, [productId]);

  // Feed API hook with product context
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

  const handleFilterPress = () => {
    // Handle filter/sort action
    console.log('Filter/Sort pressed');
  };

  // Optional: adapt this for post creation with productId
  const handlePostTypeSelect = useCallback((type: string, experienceOption?: 'own' | 'tried') => {
    closeBottomSheet();

    // Navigasyon ayarları ve diğer akışlar olduğu gibi bırakıldı
    navigation.navigate('CreatePostScreen', {
      contextType: ProductInfoType.PRODUCT,
      productInfo: product
        ? {
            image: product.images && product.images.length > 0
              ? product.images[0].url
              : (product.thumbnail ?? undefined),
            title: product.title,
            subName: product.subtitle,
          }
        : undefined,
      // Diğer payload parametreleri gerekiyorsa ekleyin
    });
  }, [navigation, product, closeBottomSheet]);

  const handleCreatePress = useCallback(() => {
    setBottomSheetKey(prev => prev + 1);
    openBottomSheet(
      <CreatePostBottomSheet
        key={bottomSheetKey + 1}
        onClose={closeBottomSheet}
        onPostTypeSelect={handlePostTypeSelect}
        onViewChange={(view) => {
          console.log('BottomSheet view changed:', view);
        }}
        stage="products"
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
  }, [openBottomSheet, closeBottomSheet, bottomSheetKey, handlePostTypeSelect]);

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
      <Box flex={1} bg={isDark ? '$backgroundDark950' : '#FAFAFA'}>
        {/* Header */}
        <Header
          title={product?.title || name || ""}
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
          {/* Product Info Card ve detay: */}
          <Box px="$4" py="$2">
            {/* Show loading, error, or the ProductInfoCard */}
            {productLoading ? (
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$md">
                Ürün yükleniyor...
              </Text>
            ) : productError ? (
              <Text color="#CE4A4A" fontSize="$md" fontWeight="$bold">
                {productError.message}
              </Text>
            ) : product ? (
              <>
                <ProductInfoCard
                  image={product.thumbnail || undefined}
                  title={product.title}
                  subName={product.subtitle || ''}
                  size="big"
                  type={ProductInfoType.PRODUCT}
                />
                {/* Ürün galerisi (varsa çoklu görsel) */}
                {product.images && product.images.length > 1 && (
                  <ScrollView
                    horizontal
                    style={{ marginTop: 12 }}
                    showsHorizontalScrollIndicator={false}
                  >
                    {product.images.map((img, idx) => (
                      <Box key={img.id || idx} mr={idx === product.images.length - 1 ? 0 : 10}>
                        <Image
                          source={{ uri: img.url }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 8,
                            backgroundColor: isDark ? '#333' : '#eee',
                          }}
                          resizeMode="contain"
                        />
                      </Box>
                    ))}
                  </ScrollView>
                )}
                {/* Açıklama alanı */}
                {product.description ? (
                  <Box mt={12}>
                    <Text
                      fontSize="$sm"
                      color={isDark ? '$textDark300' : '$textLight700'}
                      style={{ lineHeight: 20 }}
                    >
                      {product.description}
                    </Text>
                  </Box>
                ) : null}
              </>
            ) : (
              <Text color={isDark ? '$textDark400' : '$textLight500'} fontSize="$md">
                Ürün bulunamadı.
              </Text>
            )}
          </Box>

          {/* Feed Items */}
          {isLoading && !data?.pages?.[0] ? (
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
                Henüz bu ürün için gönderi bulunmuyor.
              </Text>
            </Box>
          ) : (
            <FlatList
              data={feedItems}
              renderItem={({ item }) => {
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
                              avatar: toImageSource((item.data as ProfilePost).user.avatar) || require('@/assets/avatar/ozan.png'),
                            },
                            content: Array.isArray((item.data as ProfilePost).content)
                              ? (item.data as ProfilePost).content.map((c: any) => c.content || '').join(' ')
                              : ((item.data as ProfilePost).content || ''),
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

        {/* Create Button - Sadece Product varsa göster */}
        {product && (
          <CreateButton onPress={handleCreatePress} />
        )}
      </Box>
    </SafeAreaView>
  );
};
