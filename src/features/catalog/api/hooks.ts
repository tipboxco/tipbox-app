import { useQuery, useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { getCatalogCategories, getCatalogSubCategories, getCatalogProductGroups, getCatalogProducts, getProductDetail, getProductPosts, getProductNews, getNewsDetail, getSubCategoryPosts, getProductGroupPosts, getCatalogProductPosts, likeNews, unlikeNews, shareNews, favoriteNews, unfavoriteNews, searchGlobalProducts, type CatalogPaginationResponse } from './catalogApi';
import { getBrandCategories, getBrandsByCategory, getBrandCatalog, getBrandFeed, getBrandProductBook, getBrandSurveys, getBrandTrends, getBrandEvents, getBrandHistory, getBrandStats, getBrandProductGroupProducts, searchGlobalBrands, joinBrand, leaveBrand } from './brandApi';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct, BrandCategory, BrandListItem, BrandCatalogResponse, BrandFeedResponse, BrandProductBookResponse, BrandSurveysResponse, BrandTrendsResponse, BrandEventsResponse, ProductDetail, ProductPostsResponse, ProductNewsResponse, NewsDetail, BrandHistory, BrandStats, NewsCommentCreateRequest, NewsCommentsResponse, NewsCommentCreateResponse, NewsShareRequest, NewsShareResponse, NewsApiResponse, BrandProductGroupProductsResponse, GlobalProductSearchResponse, GlobalBrandSearchResponse } from '../types';

/**
 * Query Keys - Catalog feature için cache key pattern'leri
 */
export const catalogKeys = {
  all: ['catalog'] as const,
  categories: (cursor?: string, limit?: number) => [...catalogKeys.all, 'categories', cursor, limit] as const,
  brandCategories: () => [...catalogKeys.all, 'brandCategories'] as const,
  brandList: (categoryId: string) => [...catalogKeys.all, 'brands', categoryId] as const,
  brandCatalog: (brandId: string) => [...catalogKeys.all, 'brandCatalog', brandId] as const,
  brandFeed: (brandId: string, cursor?: string, limit?: number) => 
    [...catalogKeys.all, 'brandFeed', brandId, cursor, limit] as const,
  brandProductBook: (brandId: string, search?: string) => [...catalogKeys.all, 'brandProductBook', brandId, search] as const,
  brandSurveys: (brandId: string, limit?: number) => 
    [...catalogKeys.all, 'brandSurveys', brandId, limit] as const,
  brandTrends: (brandId: string, limit?: number) => 
    [...catalogKeys.all, 'brandTrends', brandId, limit] as const,
  brandEvents: (brandId: string, limit?: number) => 
    [...catalogKeys.all, 'brandEvents', brandId, limit] as const,
  brandHistory: (brandId: string) => [...catalogKeys.all, 'brandHistory', brandId] as const,
  brandStats: (brandId: string) => [...catalogKeys.all, 'brandStats', brandId] as const,
  subCategories: (categoryId: string, cursor?: string, limit?: number) => [...catalogKeys.all, 'subCategories', categoryId, cursor, limit] as const,
  productGroups: (subCategoryId: string, cursor?: string, limit?: number) => [...catalogKeys.all, 'productGroups', subCategoryId, cursor, limit] as const,
  products: (productGroupId: string) => [...catalogKeys.all, 'products', productGroupId] as const,
  productDetail: (productId: string) => [...catalogKeys.all, 'productDetail', productId] as const,
  productPosts: (productId: string, type?: string, cursor?: string, limit?: number) => 
    [...catalogKeys.all, 'productPosts', productId, type, cursor, limit] as const,
  // Not: productPosts query key'inde filter ve sort parametreleri type içinde tutuluyor (geriye dönük uyumluluk)
  productNews: (productId: string, cursor?: string, limit?: number) => 
    [...catalogKeys.all, 'productNews', productId, cursor, limit] as const,
  newsDetail: (newsId: string) => [...catalogKeys.all, 'newsDetail', newsId] as const,
  // Catalog Posts endpoints
  subCategoryPosts: (subCategoryId: string, filter?: string, sort?: string, cursor?: string, limit?: number) =>
    [...catalogKeys.all, 'subCategoryPosts', subCategoryId, filter, sort, cursor, limit] as const,
  productGroupPosts: (productGroupId: string, filter?: string, sort?: string, cursor?: string, limit?: number) =>
    [...catalogKeys.all, 'productGroupPosts', productGroupId, filter, sort, cursor, limit] as const,
  catalogProductPosts: (productId: string, filter?: string, sort?: string, cursor?: string, limit?: number) =>
    [...catalogKeys.all, 'catalogProductPosts', productId, filter, sort, cursor, limit] as const,
  // Brand Product Group Products
  brandProductGroupProducts: (productGroupId: string, cursor?: string, limit?: number) =>
    [...catalogKeys.all, 'brandProductGroupProducts', productGroupId, cursor, limit] as const,
  // Global Product Search
  globalProductSearch: (search: string, cursor?: string, limit?: number) =>
    [...catalogKeys.all, 'globalProductSearch', search, cursor, limit] as const,
  // Global Brand Search
  globalBrandSearch: (search: string, cursor?: string, limit?: number) =>
    [...catalogKeys.all, 'globalBrandSearch', search, cursor, limit] as const,
};

/**
 * Prefetch helper functions - Catalog verilerini önceden yüklemek için
 */
export const useCatalogPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchSubCategories = useCallback((categoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: catalogKeys.subCategories(categoryId, undefined, 100),
      queryFn: () => getCatalogSubCategories(categoryId, undefined, 100),
      staleTime: 2 * 60 * 60 * 1000, // 2 saat - dokümana göre backend cache TTL
    });
  }, [queryClient]);

  const prefetchProductGroups = useCallback((subCategoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: catalogKeys.productGroups(subCategoryId, undefined, 20),
      queryFn: () => getCatalogProductGroups(subCategoryId, undefined, 20),
      staleTime: 2 * 60 * 60 * 1000, // 2 saat - dokümana göre backend cache TTL
    });
  }, [queryClient]);

  const prefetchProducts = useCallback((productGroupId: string) => {
    queryClient.prefetchQuery({
      queryKey: catalogKeys.products(productGroupId),
      queryFn: () => getCatalogProducts(productGroupId),
      staleTime: 60 * 60 * 1000, // 1 saat - dokümana göre backend cache TTL
    });
  }, [queryClient]);

  return {
    prefetchSubCategories,
    prefetchProductGroups,
    prefetchProducts,
  };
};

/**
 * Get Catalog Categories query hook
 * Tüm katalog kategorilerini getirir
 * 
 * @param limit - Maksimum item sayısı (default: 1000)
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogCategories();
 */
export const useCatalogCategories = (limit: number = 100) => {
  return useQuery<CatalogPaginationResponse<CatalogCategory>, Error>({
    queryKey: catalogKeys.categories(undefined, limit),
    queryFn: () => getCatalogCategories(undefined, limit),
    staleTime: 24 * 60 * 60 * 1000, // 24 saat - dokümana göre backend cache TTL
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 gün - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: 3, // Dokümana göre retry mekanizması
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Get Brand Categories query hook
 * /brands/categories endpoint'inden marka kategorilerini getirir ve cache'ler
 *
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useBrandCategories();
 */
export const useBrandCategories = () => {
  return useQuery<BrandCategory[], Error>({
    queryKey: catalogKeys.brandCategories(),
    queryFn: () => getBrandCategories(),
    staleTime: 24 * 60 * 60 * 1000, // 24 saat - kategoriler nadiren değişir
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 gün - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: 3, // Dokümana göre retry mekanizması
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Get Brands by Category query hook
 * Seçili brand kategorisine göre /brands/categories/{category_id}/brands endpoint'inden brand listesini getirir
 *
 * @param categoryId - Seçili brand kategorisinin ID'si
 * @returns React Query hook result
 */
export const useBrandsByCategory = (categoryId: string | undefined) => {
  return useQuery<BrandListItem[], Error>({
    queryKey: categoryId ? catalogKeys.brandList(categoryId) : ['catalog', 'brands', 'disabled'],
    queryFn: () => {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      return getBrandsByCategory(categoryId);
    },
    enabled: !!categoryId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - brand listeleri nadiren değişir
    gcTime: 24 * 60 * 60 * 1000, // 24 saat - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // 404 hatası için retry yapma (kategori bulunamadı - geçici bir hata değil)
      if (error?.response?.status === 404) {
        return false;
      }
      // Diğer hatalar için 3 kez retry yap
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Get Catalog SubCategories query hook
 * Belirli bir kategoriye ait alt kategorileri getirir
 * 
 * @param categoryId - Kategori ID'si
 * @param limit - Maksimum item sayısı (default: 1000)
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogSubCategories('category-123');
 */
export const useCatalogSubCategories = (categoryId: string | undefined, limit: number = 100) => {
  const query = useQuery<CatalogPaginationResponse<CatalogSubCategory>, Error>({
    queryKey: categoryId ? catalogKeys.subCategories(categoryId, undefined, limit) : ['catalog', 'subCategories', 'disabled'],
    queryFn: () => {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      return getCatalogSubCategories(categoryId, undefined, limit);
    },
    enabled: !!categoryId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - dokümana göre backend cache TTL
    gcTime: 24 * 60 * 60 * 1000, // 24 saat - cache'de tut
    refetchOnMount: 'always', // FIX: Her mount'ta refetch yap - cache'deki boş veriyi önlemek için
    refetchOnWindowFocus: false,
    retry: 3, // Dokümana göre retry mekanizması
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
  
  // DEBUG: React Query response'unu log'la
  if (__DEV__) {
    useEffect(() => {
      console.log('[useCatalogSubCategories] 🔍 React Query State:', {
        categoryId,
        limit,
        enabled: !!categoryId,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        hasData: !!query.data,
        dataType: typeof query.data,
        itemsCount: query.data?.items?.length || 0,
        data: query.data,
      });
      
      if (query.data) {
        console.log('[useCatalogSubCategories] 📦 React Query Data:', {
          categoryId,
          limit,
          itemsCount: query.data.items?.length || 0,
          items: query.data.items?.map(item => ({ subCategoryId: item.subCategoryId, name: item.name })) || [],
          pagination: query.data.pagination,
        });
      }
      if (query.isError) {
        console.error('[useCatalogSubCategories] ❌ React Query Error:', {
          categoryId,
          limit,
          error: query.error,
        });
      }
    }, [query.data, query.isLoading, query.isFetching, query.isError, query.error, categoryId, limit]);
  }
  
  return query;
};

/**
 * Get Catalog ProductGroups query hook
 * Belirli bir alt kategoriye ait ürün gruplarını getirir (20'şerli pagination)
 * 
 * @param subCategoryId - Alt kategori ID'si
 * @param limit - Maksimum item sayısı (default: 20, max: 50)
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogProductGroups('subcategory-123');
 */
export const useCatalogProductGroups = (subCategoryId: string | undefined, limit: number = 20) => {
  // Backend limit constraint: 1-50 arası olmalı
  const validLimit = Math.min(Math.max(limit, 1), 50);
  
  return useQuery<CatalogPaginationResponse<CatalogProductGroup>, Error>({
    queryKey: subCategoryId ? catalogKeys.productGroups(subCategoryId, undefined, validLimit) : ['catalog', 'productGroups', 'disabled'],
    queryFn: () => {
      if (!subCategoryId) {
        throw new Error('SubCategory ID is required');
      }
      return getCatalogProductGroups(subCategoryId, undefined, validLimit);
    },
    enabled: !!subCategoryId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - dokümana göre backend cache TTL
    gcTime: 24 * 60 * 60 * 1000, // 24 saat - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: 3, // Dokümana göre retry mekanizması
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Get Catalog Products infinite query hook
 * Belirli bir ürün grubuna ait ürünleri infinite scroll ile getirir (16 şarlı pagination)
 * 
 * @param productGroupId - Ürün grubu ID'si
 * @param search - Product adı, marka veya açıklamasında arama (opsiyonel)
 * @param limit - Sayfa başına item sayısı (default: 16)
 * @returns React Query infinite query hook result
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useCatalogProducts('productgroup-123', 'iphone', 16);
 */
export const useCatalogProducts = (
  productGroupId: string | undefined,
  search?: string,
  limit: number = 16
) => {
  const hasSearchQuery = !!search && search.trim().length > 0;
  
  return useInfiniteQuery<CatalogPaginationResponse<CatalogProduct>, Error>({
    queryKey: productGroupId 
      ? [...catalogKeys.products(productGroupId), search, limit] 
      : ['catalog', 'products', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!productGroupId) {
        throw new Error('ProductGroup ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getCatalogProducts(productGroupId, search, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!productGroupId,
    staleTime: hasSearchQuery ? 0 : 60 * 60 * 1000, // Search varsa 0, yoksa 1 saat
    gcTime: hasSearchQuery ? 0 : 24 * 60 * 60 * 1000, // Search varsa cache yok, yoksa 24 saat
    refetchOnMount: hasSearchQuery ? 'always' : false, // Search varsa her zaman refetch
    refetchOnWindowFocus: hasSearchQuery, // Search varsa focus'ta refetch
    retry: hasSearchQuery ? 0 : 3, // Search varsa retry yok, yoksa 3 kez
    retryDelay: hasSearchQuery ? undefined : (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Global Product Search infinite query hook
 * Tüm product grupları arasında arama yapar ve sonuçları product group bazında gruplar
 * 
 * BACKEND ENDPOINT TALEBİ:
 * Bu hook, /catalog/products/search endpoint'ini kullanır.
 * Backend'de bu endpoint henüz mevcut olmayabilir.
 * 
 * @param search - Product adı, marka veya açıklamasında arama (zorunlu)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGlobalProductSearch('iphone', 20);
 */
export const useGlobalProductSearch = (
  search: string | undefined,
  limit: number = 20
) => {
  const hasSearchQuery = !!search && search.trim().length > 0;
  
  return useInfiniteQuery<GlobalProductSearchResponse, Error>({
    queryKey: hasSearchQuery 
      ? catalogKeys.globalProductSearch(search, undefined, limit)
      : ['catalog', 'globalProductSearch', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!search || search.trim().length === 0) {
        throw new Error('Search query is required');
      }
      const cursor = pageParam as string | undefined;
      return searchGlobalProducts(search, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: hasSearchQuery,
    staleTime: 0, // Search sonuçları her zaman fresh olmalı
    gcTime: 0, // Search sonuçları cache'lenmemeli
    refetchOnMount: 'always', // Her zaman refetch
    refetchOnWindowFocus: true, // Focus'ta refetch
    retry: 0, // Search için retry yok
  });
};

/**
 * Global Brand Search infinite query hook
 * Tüm brand kategorileri arasında arama yapar ve sonuçları category bazında gruplar
 * 
 * BACKEND ENDPOINT TALEBİ:
 * Bu hook, /brands/search endpoint'ini kullanır.
 * Backend'de bu endpoint henüz mevcut olmayabilir.
 * 
 * @param search - Brand adında arama (zorunlu)
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGlobalBrandSearch('apple', 20);
 */
export const useGlobalBrandSearch = (
  search: string | undefined,
  limit: number = 20
) => {
  const hasSearchQuery = !!search && search.trim().length > 0;
  
  return useInfiniteQuery<GlobalBrandSearchResponse, Error>({
    queryKey: hasSearchQuery 
      ? catalogKeys.globalBrandSearch(search, undefined, limit)
      : ['catalog', 'globalBrandSearch', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!search || search.trim().length === 0) {
        throw new Error('Search query is required');
      }
      const cursor = pageParam as string | undefined;
      return searchGlobalBrands(search, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: hasSearchQuery,
    staleTime: 0, // Search sonuçları her zaman fresh olmalı
    gcTime: 0, // Search sonuçları cache'lenmemeli
    refetchOnMount: 'always', // Her zaman refetch
    refetchOnWindowFocus: true, // Focus'ta refetch
    retry: 0, // Search için retry yok
  });
};

/**
 * Get Brand Catalog query hook
 * /brands/{brandId}/catalog endpoint'inden marka katalog bilgilerini getirir
 *
 * @param brandId - Marka ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useBrandCatalog('brand-123');
 */
export const useBrandCatalog = (brandId: string | undefined) => {
  return useQuery<BrandCatalogResponse, Error>({
    queryKey: brandId ? catalogKeys.brandCatalog(brandId) : ['catalog', 'brandCatalog', 'disabled'],
    queryFn: () => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      return getBrandCatalog(brandId);
    },
    enabled: !!brandId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: 3, // Dokümana göre retry mekanizması
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

type BrandJoinLeaveContext = { previous: BrandCatalogResponse | undefined };

/**
 * Join Brand mutation - Optimistic update ile anında UI günceller, hata durumunda rollback
 */
export const useJoinBrand = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, BrandJoinLeaveContext>({
    mutationFn: (brandId: string) => joinBrand(brandId),
    onMutate: async (brandId) => {
      await queryClient.cancelQueries({ queryKey: catalogKeys.brandCatalog(brandId) });
      const previous = queryClient.getQueryData<BrandCatalogResponse>(catalogKeys.brandCatalog(brandId));
      queryClient.setQueryData<BrandCatalogResponse>(catalogKeys.brandCatalog(brandId), (old) => {
        if (!old) return old;
        return { ...old, isJoined: true, followers: old.followers + 1 };
      });
      return { previous };
    },
    onError: (_, brandId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(catalogKeys.brandCatalog(brandId), context.previous);
      }
    },
    onSettled: (_, __, brandId) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.brandCatalog(brandId) });
    },
  });
};

/**
 * Leave Brand mutation - Optimistic update ile anında UI günceller, hata durumunda rollback
 */
export const useLeaveBrand = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, BrandJoinLeaveContext>({
    mutationFn: (brandId: string) => leaveBrand(brandId),
    onMutate: async (brandId) => {
      await queryClient.cancelQueries({ queryKey: catalogKeys.brandCatalog(brandId) });
      const previous = queryClient.getQueryData<BrandCatalogResponse>(catalogKeys.brandCatalog(brandId));
      queryClient.setQueryData<BrandCatalogResponse>(catalogKeys.brandCatalog(brandId), (old) => {
        if (!old) return old;
        return { ...old, isJoined: false, followers: Math.max(0, old.followers - 1) };
      });
      return { previous };
    },
    onError: (_, brandId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(catalogKeys.brandCatalog(brandId), context.previous);
      }
    },
    onSettled: (_, __, brandId) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.brandCatalog(brandId) });
    },
  });
};

/**
 * Get Brand Feed infinite query hook
 * /brands/{brandId}/feed endpoint'inden marka feed postlarını infinite scroll ile getirir
 *
 * @param brandId - Marka ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandFeed('brand-123');
 */
export const useBrandFeed = (brandId: string | undefined, limit: number = 20) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId ? catalogKeys.brandFeed(brandId, undefined, limit) : ['catalog', 'brandFeed', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getBrandFeed(brandId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Brand Surveys infinite query hook
 * /brands/{brandId}/surveys endpoint'inden marka survey listesini infinite scroll ile getirir
 *
 * @param brandId - Marka ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandSurveys('brand-123');
 */
export const useBrandSurveys = (brandId: string | undefined, limit: number = 20) => {
  return useInfiniteQuery<BrandSurveysResponse, Error>({
    queryKey: brandId ? catalogKeys.brandSurveys(brandId, limit) : ['catalog', 'brandSurveys', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getBrandSurveys(brandId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Brand Trends infinite query hook
 * /brands/{brandId}/trends endpoint'inden marka trend içeriklerini infinite scroll ile getirir
 *
 * @param brandId - Marka ID'si
 * @param limit - Sayfa başına item sayısı (default: 5)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandTrends('brand-123');
 */
export const useBrandTrends = (brandId: string | undefined, limit: number = 5) => {
  return useInfiniteQuery<BrandTrendsResponse, Error>({
    queryKey: brandId ? catalogKeys.brandTrends(brandId, limit) : ['catalog', 'brandTrends', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getBrandTrends(brandId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Brand Product Book infinite query hook
 * /brands/{brandId}/groups endpoint'inden marka ürün gruplarını infinite scroll ile getirir
 * Search parametresi ile sadece eşleşen ürünleri içeren gruplar getirir
 *
 * @param brandId - Marka ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @param search - Product adında arama (opsiyonel) - Sadece eşleşen ürünleri içeren gruplar getirir
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandProductBook('brand-123');
 * // Arama ile:
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandProductBook('brand-123', 20, 'iphone');
 */
export const useBrandProductBook = (brandId: string | undefined, limit: number = 20, search?: string) => {
  const hasSearchQuery = !!search && search.trim().length > 0;
  
  return useInfiniteQuery<BrandProductBookResponse, Error>({
    queryKey: brandId ? [...catalogKeys.brandProductBook(brandId), search] : ['catalog', 'brandProductBook', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getBrandProductBook(brandId, cursor, limit, search);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Brand Events infinite query hook
 * /brands/{brandId}/events endpoint'inden marka event listesini infinite scroll ile getirir
 *
 * @param brandId - Marka ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandEvents('brand-123');
 */
export const useBrandEvents = (brandId: string | undefined, limit: number = 20) => {
  return useInfiniteQuery<BrandEventsResponse, Error>({
    queryKey: brandId ? catalogKeys.brandEvents(brandId, limit) : ['catalog', 'brandEvents', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getBrandEvents(brandId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Product Detail query hook
 * /products/{productId} endpoint'inden product detay bilgilerini getirir
 *
 * @param productId - Product ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useProductDetail('product-123');
 */
export const useProductDetail = (productId: string | undefined) => {
  return useQuery<ProductDetail, Error>({
    queryKey: productId ? catalogKeys.productDetail(productId) : ['catalog', 'productDetail', 'disabled'],
    queryFn: () => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      return getProductDetail(productId);
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Product Posts infinite query hook
 * /products/{productId}/posts endpoint'inden product postlarını infinite scroll ile getirir
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - reviews: Sadece Experience (Review) gönderileri
 * - benchmarks: Sadece Benchmark gönderileri
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 * 
 * Geriye Dönük Uyumluluk:
 * type parametresi otomatik olarak filter'a dönüştürülüyor:
 * - type=tips → filter=tips_and_tricks
 * - type=experience → filter=reviews
 * - type=benchmark → filter=benchmarks
 *
 * @param productId - Product ID'si
 * @param filter - Post filter (all | reviews | benchmarks | tips_and_tricks) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param type - Post type (experience, comments, benchmark, tips) - opsiyonel, geriye dönük uyumluluk için (filter'a dönüştürülür)
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductPosts('product-123', 'reviews', 'newest');
 * // veya geriye dönük uyumluluk için:
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductPosts('product-123', undefined, undefined, 'experience');
 */
export const useProductPosts = (
  productId: string | undefined,
  filter?: 'all' | 'reviews' | 'benchmarks' | 'tips_and_tricks',
  sort?: 'newest' | 'oldest' | 'most_popular',
  type?: 'experience' | 'comments' | 'benchmark' | 'tips',
  limit: number = 20
) => {
  return useInfiniteQuery<ProductPostsResponse, Error>({
    // Query key'e filter ve sort parametrelerini ekle (cache için önemli)
    queryKey: productId 
      ? [...catalogKeys.all, 'productPosts', productId, filter || 'all', sort || 'newest', type || 'none', limit] 
      : ['catalog', 'productPosts', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getProductPosts(productId, filter, sort, type, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!productId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get Product News infinite query hook
 * /products/{productId}/news endpoint'inden product haberlerini infinite scroll ile getirir
 *
 * @param productId - Product ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductNews('product-123');
 */
export const useProductNews = (
  productId: string | undefined,
  limit: number = 20
) => {
  return useInfiniteQuery<ProductNewsResponse, Error>({
    queryKey: productId ? catalogKeys.productNews(productId, undefined, limit) : ['catalog', 'productNews', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getProductNews(productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!productId,
    // Screen-based caching: Ekran değişimlerinde anında yüklenmiş ekran göster
    staleTime: 2 * 60 * 60 * 1000,  // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000,    // 4 saat - cache'de tut
    refetchOnMount: false,     // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false, // Ekran değişimlerinde refetch yapma
    retry: 1,
  });
};

/**
 * Get News Detail query hook
 * /news/{newsId} endpoint'inden news detay bilgilerini getirir
 *
 * @param newsId - News ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useNewsDetail('news-123');
 */
export const useNewsDetail = (newsId: string | undefined) => {
  return useQuery<NewsDetail, Error>({
    queryKey: newsId ? catalogKeys.newsDetail(newsId) : ['catalog', 'newsDetail', 'disabled'],
    queryFn: () => {
      if (!newsId) {
        throw new Error('News ID is required');
      }
      return getNewsDetail(newsId);
    },
    enabled: !!newsId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Brand History query hook
 * /brands/{brandId}/history endpoint'inden marka geçmişi bilgilerini getirir
 *
 * @param brandId - Marka ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useBrandHistory('brand-123');
 */
export const useBrandHistory = (brandId: string | undefined) => {
  return useQuery<BrandHistory, Error>({
    queryKey: brandId ? catalogKeys.brandHistory(brandId) : ['catalog', 'brandHistory', 'disabled'],
    queryFn: () => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      return getBrandHistory(brandId);
    },
    enabled: !!brandId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Brand Stats query hook
 * /brands/{brandId}/stats endpoint'inden marka istatistiklerini getirir
 *
 * @param brandId - Marka ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useBrandStats('brand-123');
 */
export const useBrandStats = (brandId: string | undefined) => {
  return useQuery<BrandStats, Error>({
    queryKey: brandId ? catalogKeys.brandStats(brandId) : ['catalog', 'brandStats', 'disabled'],
    queryFn: () => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      return getBrandStats(brandId);
    },
    enabled: !!brandId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Sub Category Posts infinite query hook
 * /catalog/sub-categories/:subCategoryId/posts endpoint'inden sub category postlarını infinite scroll ile getirir
 * 
 * Hiyerarşik Feed Mantığı:
 * - Sub category'ye ait gönderiler
 * - Alt product group'ların gönderileri
 * - Alt product'ların gönderileri (sadece Free, Tips, Question)
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - free: Sadece Free gönderiler
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * - questions: Sadece Question gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 *
 * @param subCategoryId - Sub category ID'si
 * @param filter - Post filter (all | free | tips_and_tricks | questions) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSubCategoryPosts('sub-category-123', 'tips_and_tricks', 'newest');
 */
export const useSubCategoryPosts = (
  subCategoryId: string | undefined,
  filter?: 'all' | 'free' | 'tips_and_tricks' | 'questions',
  sort?: 'newest' | 'oldest' | 'most_popular',
  limit: number = 20
) => {
  return useInfiniteQuery({
    queryKey: subCategoryId ? catalogKeys.subCategoryPosts(subCategoryId, filter, sort, undefined, limit) : ['catalog', 'subCategoryPosts', 'disabled'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      if (!subCategoryId) {
        throw new Error('SubCategory ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getSubCategoryPosts(subCategoryId, filter, sort, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      const items = Array.isArray(lastPage.items) ? lastPage.items : [];
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        if (lastItem && typeof lastItem === 'object' && 'data' in lastItem) {
          const itemData = lastItem.data;
          if (itemData && typeof itemData === 'object' && 'id' in itemData && itemData.id) {
            return lastPage.pagination.cursor || String(itemData.id);
          }
        }
      }
      return lastPage.pagination.cursor || undefined;
    },
    enabled: !!subCategoryId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat
    gcTime: 4 * 60 * 60 * 1000, // 4 saat
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Product Group Posts infinite query hook
 * /catalog/product-groups/:productGroupId/posts endpoint'inden product group postlarını infinite scroll ile getirir
 * 
 * Hiyerarşik Feed Mantığı:
 * - Product group'a ait gönderiler
 * - Alt product'ların gönderileri (sadece Free, Tips, Question)
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - free: Sadece Free gönderiler
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * - questions: Sadece Question gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 *
 * @param productGroupId - Product group ID'si
 * @param filter - Post filter (all | free | tips_and_tricks | questions) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductGroupPosts('product-group-123', 'tips_and_tricks', 'newest');
 */
export const useProductGroupPosts = (
  productGroupId: string | undefined,
  filter?: 'all' | 'free' | 'tips_and_tricks' | 'questions',
  sort?: 'newest' | 'oldest' | 'most_popular',
  limit: number = 20
) => {
  return useInfiniteQuery({
    queryKey: productGroupId ? catalogKeys.productGroupPosts(productGroupId, filter, sort, undefined, limit) : ['catalog', 'productGroupPosts', 'disabled'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      if (!productGroupId) {
        throw new Error('ProductGroup ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getProductGroupPosts(productGroupId, filter, sort, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      const items = Array.isArray(lastPage.items) ? lastPage.items : [];
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        if (lastItem && typeof lastItem === 'object' && 'data' in lastItem) {
          const itemData = lastItem.data;
          if (itemData && typeof itemData === 'object' && 'id' in itemData && itemData.id) {
            return lastPage.pagination.cursor || String(itemData.id);
          }
        }
      }
      return lastPage.pagination.cursor || undefined;
    },
    enabled: !!productGroupId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat
    gcTime: 4 * 60 * 60 * 1000, // 4 saat
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Catalog Product Posts infinite query hook
 * /catalog/products/:productId/posts endpoint'inden product postlarını infinite scroll ile getirir
 * 
 * Filter Parametreleri:
 * - all: Tüm gönderiler (default)
 * - free: Sadece Free gönderiler
 * - tips_and_tricks: Sadece Tips & Tricks gönderileri
 * - questions: Sadece Question gönderileri
 * - updates: Sadece Update gönderileri
 * - benchmarks: Sadece Benchmark gönderileri
 * - reviews: Sadece Experience (Review) gönderileri
 * 
 * Sort Parametreleri:
 * - newest: En yeni önce (default)
 * - oldest: En eski önce
 * - most_popular: Beğeni + yorum + kaydetme sayısına göre
 *
 * @param productId - Product ID'si
 * @param filter - Post filter (all | free | tips_and_tricks | questions | updates | benchmarks | reviews) - opsiyonel, default: all
 * @param sort - Sort order (newest | oldest | most_popular) - opsiyonel, default: newest
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useCatalogProductPosts('product-123', 'reviews', 'newest');
 */
export const useCatalogProductPosts = (
  productId: string | undefined,
  filter?: 'all' | 'free' | 'tips_and_tricks' | 'questions' | 'updates' | 'benchmarks' | 'reviews',
  sort?: 'newest' | 'oldest' | 'most_popular',
  limit: number = 20
) => {
  return useInfiniteQuery({
    queryKey: productId ? catalogKeys.catalogProductPosts(productId, filter, sort, undefined, limit) : ['catalog', 'catalogProductPosts', 'disabled'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getCatalogProductPosts(productId, filter, sort, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }
      if (!lastPage.pagination.hasMore) {
        return undefined;
      }
      const items = Array.isArray(lastPage.items) ? lastPage.items : [];
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        if (lastItem && typeof lastItem === 'object' && 'data' in lastItem) {
          const itemData = lastItem.data;
          if (itemData && typeof itemData === 'object' && 'id' in itemData && itemData.id) {
            return lastPage.pagination.cursor || String(itemData.id);
          }
        }
      }
      return lastPage.pagination.cursor || undefined;
    },
    enabled: !!productId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat
    gcTime: 4 * 60 * 60 * 1000, // 4 saat
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * useBrandProductNewsDetail - Brand product news detay bilgilerini getirir
 * /brands/{brandId}/products/{productId}/news/{newsId} endpoint'inden news detay bilgilerini getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param newsId - News ID'si
 * @returns React Query hook result
 */
export const useBrandProductNewsDetail = (
  brandId: string | undefined,
  productId: string | undefined,
  newsId: string | undefined
) => {
  return useQuery<NewsDetail, Error>({
    queryKey: brandId && productId && newsId
      ? [...catalogKeys.all, 'brandProductNewsDetail', brandId, productId, newsId]
      : ['catalog', 'brandProductNewsDetail', 'disabled'],
    queryFn: async () => {
      if (!brandId || !productId || !newsId) {
        throw new Error('Brand ID, Product ID and News ID are required');
      }
      const { getBrandProductNewsDetail } = await import('./brandApi');
      return getBrandProductNewsDetail(brandId, productId, newsId);
    },
    enabled: !!brandId && !!productId && !!newsId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - cache invalid olana kadar backend'e istek atma
    gcTime: 4 * 60 * 60 * 1000, // 4 saat - cache'de tut
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Like News mutation hook
 * /news/{newsId}/like endpoint'ine POST request gönderir
 *
 * @returns React Query mutation hook
 */
export const useLikeNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NewsApiResponse, Error, { newsId: string; brandId?: string; productId?: string }>({
    mutationFn: ({ newsId }) => likeNews(newsId),
    onSuccess: (_, { newsId, brandId, productId }) => {
      // News detail'i invalidate et
      queryClient.invalidateQueries({ queryKey: catalogKeys.newsDetail(newsId) });
      // Brand product news detail'i de invalidate et (eğer varsa)
      if (brandId && productId) {
        queryClient.invalidateQueries({ 
          queryKey: [...catalogKeys.all, 'brandProductNewsDetail', brandId, productId, newsId] 
        });
      }
    },
  });
};

/**
 * Unlike News mutation hook
 * /news/{newsId}/like endpoint'ine DELETE request gönderir
 *
 * @returns React Query mutation hook
 */
export const useUnlikeNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NewsApiResponse, Error, { newsId: string; brandId?: string; productId?: string }>({
    mutationFn: ({ newsId }) => unlikeNews(newsId),
    onSuccess: (_, { newsId, brandId, productId }) => {
      // News detail'i invalidate et
      queryClient.invalidateQueries({ queryKey: catalogKeys.newsDetail(newsId) });
      // Brand product news detail'i de invalidate et (eğer varsa)
      if (brandId && productId) {
        queryClient.invalidateQueries({ 
          queryKey: [...catalogKeys.all, 'brandProductNewsDetail', brandId, productId, newsId] 
        });
      }
    },
  });
};

/**
 * Get Brand Product News Comments query hook
 * /brands/{brandId}/products/{productId}/news/{newsId}/comments endpoint'inden news yorumlarını getirir
 *
 * @param brandId - Brand ID'si
 * @param productId - Product ID'si
 * @param newsId - News ID'si
 * @param limit - Sayfa başına yorum sayısı (default: 50)
 * @param offset - Offset değeri (default: 0)
 * @returns React Query hook result
 */
export const useBrandProductNewsComments = (
  brandId: string | undefined,
  productId: string | undefined,
  newsId: string | undefined,
  limit: number = 50,
  offset: number = 0
) => {
  return useQuery<NewsCommentsResponse, Error>({
    queryKey: (brandId && productId && newsId) 
      ? [...catalogKeys.all, 'brandProductNewsComments', brandId, productId, newsId, limit, offset] 
      : ['catalog', 'brandProductNewsComments', 'disabled'],
    queryFn: async () => {
      if (!brandId || !productId || !newsId) {
        throw new Error('Brand ID, Product ID and News ID are required');
      }
      const { getBrandProductNewsComments } = await import('./brandApi');
      return getBrandProductNewsComments(brandId, productId, newsId, limit, offset);
    },
    enabled: !!brandId && !!productId && !!newsId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat
    gcTime: 4 * 60 * 60 * 1000, // 4 saat
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Create Brand Product News Comment mutation hook
 * /brands/{brandId}/products/{productId}/news/{newsId}/comment endpoint'ine POST request gönderir
 *
 * @returns React Query mutation hook
 */
export const useCreateBrandProductNewsComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NewsCommentCreateResponse, Error, { brandId: string; productId: string; newsId: string; request: NewsCommentCreateRequest }>({
    mutationFn: async ({ brandId, productId, newsId, request }) => {
      const { createBrandProductNewsComment } = await import('./brandApi');
      return createBrandProductNewsComment(brandId, productId, newsId, request);
    },
    onSuccess: (_, variables) => {
      // Brand product news comments'ı invalidate et
      queryClient.invalidateQueries({ 
        queryKey: [...catalogKeys.all, 'brandProductNewsComments', variables.brandId, variables.productId, variables.newsId] 
      });
      // Brand product news detail'i invalidate et (commentsCount güncellenmesi için)
      queryClient.invalidateQueries({ 
        queryKey: [...catalogKeys.all, 'brandProductNewsDetail', variables.brandId, variables.productId, variables.newsId] 
      });
    },
  });
};

/**
 * Share News mutation hook
 * /news/{newsId}/share endpoint'ine POST request gönderir
 *
 * @returns React Query mutation hook
 */
export const useShareNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NewsShareResponse, Error, { newsId: string; request: NewsShareRequest; brandId?: string; productId?: string }>({
    mutationFn: ({ newsId, request }) => shareNews(newsId, request),
    onSuccess: (_, { newsId, brandId, productId }) => {
      // News detail'i invalidate et (sharesCount güncellenmesi için)
      queryClient.invalidateQueries({ queryKey: catalogKeys.newsDetail(newsId) });
      // Brand product news detail'i de invalidate et (eğer varsa)
      if (brandId && productId) {
        queryClient.invalidateQueries({ 
          queryKey: [...catalogKeys.all, 'brandProductNewsDetail', brandId, productId, newsId] 
        });
      }
    },
  });
};

/**
 * Favorite News mutation hook
 * /news/{newsId}/favorite endpoint'ine POST request gönderir
 *
 * @returns React Query mutation hook
 */
export const useFavoriteNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NewsApiResponse, Error, { newsId: string; brandId?: string; productId?: string }>({
    mutationFn: ({ newsId }) => favoriteNews(newsId),
    onSuccess: (_, { newsId, brandId, productId }) => {
      // News detail'i invalidate et (favoritesCount güncellenmesi için)
      queryClient.invalidateQueries({ queryKey: catalogKeys.newsDetail(newsId) });
      // Brand product news detail'i de invalidate et (eğer varsa)
      if (brandId && productId) {
        queryClient.invalidateQueries({ 
          queryKey: [...catalogKeys.all, 'brandProductNewsDetail', brandId, productId, newsId] 
        });
      }
    },
  });
};

/**
 * Unfavorite News mutation hook
 * /news/{newsId}/favorite endpoint'ine DELETE request gönderir
 *
 * @returns React Query mutation hook
 */
export const useUnfavoriteNews = () => {
  const queryClient = useQueryClient();
  
  return useMutation<NewsApiResponse, Error, { newsId: string; brandId?: string; productId?: string }>({
    mutationFn: ({ newsId }) => unfavoriteNews(newsId),
    onSuccess: (_, { newsId, brandId, productId }) => {
      // News detail'i invalidate et (favoritesCount güncellenmesi için)
      queryClient.invalidateQueries({ queryKey: catalogKeys.newsDetail(newsId) });
      // Brand product news detail'i de invalidate et (eğer varsa)
      if (brandId && productId) {
        queryClient.invalidateQueries({ 
          queryKey: [...catalogKeys.all, 'brandProductNewsDetail', brandId, productId, newsId] 
        });
      }
    },
  });
};

/**
 * Get Brand Product Group Products infinite query hook
 * /brands/groups/{productGroupId}/products endpoint'inden product group'a göre ürünleri infinite scroll ile getirir
 *
 * @param productGroupId - Product Group ID'si
 * @param limit - Sayfa başına item sayısı (default: 20, max: 50)
 * @returns React Query infinite query hook result
 */
export const useBrandProductGroupProducts = (
  productGroupId: string | undefined,
  limit: number = 20
) => {
  return useInfiniteQuery<BrandProductGroupProductsResponse, Error>({
    queryKey: productGroupId ? catalogKeys.brandProductGroupProducts(productGroupId, undefined, limit) : ['catalog', 'brandProductGroupProducts', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!productGroupId) {
        throw new Error('Product Group ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getBrandProductGroupProducts(productGroupId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!productGroupId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat
    gcTime: 4 * 60 * 60 * 1000, // 4 saat
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * useBrandProductDetail - Brand product detay bilgilerini getirir
 * /brands/{brandId}/products/{productId} endpoint'ini kullanır
 */
export const useBrandProductDetail = (brandId: string | undefined, productId: string | undefined) => {
  return useQuery({
    queryKey: brandId && productId ? [...catalogKeys.all, 'brandProductDetail', brandId, productId] : ['catalog', 'brandProductDetail', 'disabled'],
    queryFn: async () => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const { getBrandProductDetail } = await import('./brandApi');
      return getBrandProductDetail(brandId, productId);
    },
    enabled: !!brandId && !!productId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
  });
};

/**
 * useBrandProductFeed - Brand product feed postlarını getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/feed endpoint'ini kullanır
 * Lazy loading: enabled parametresi ile kontrol edilir
 */
export const useBrandProductFeed = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20,
  enabled: boolean = true
) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductFeed', brandId, productId, limit] 
      : ['catalog', 'brandProductFeed', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductFeed } = await import('./brandApi');
      return getBrandProductFeed(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId && enabled,
    staleTime: 2 * 60 * 1000, // 2 dakika
    gcTime: 5 * 60 * 1000, // 5 dakika
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * useBrandProductReviews - Brand product review postlarını getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/reviews endpoint'ini kullanır
 * Lazy loading: enabled parametresi ile kontrol edilir
 */
export const useBrandProductReviews = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20,
  enabled: boolean = false
) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductReviews', brandId, productId, limit] 
      : ['catalog', 'brandProductReviews', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductReviews } = await import('./brandApi');
      return getBrandProductReviews(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId && enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika - pull to refresh'e kadar cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Mount'ta tekrar fetch etme, cache'ten kullan
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  });
};

/**
 * useBrandProductBenchmarks - Brand product benchmark postlarını getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/benchmarks endpoint'ini kullanır
 * Lazy loading: enabled parametresi ile kontrol edilir
 */
export const useBrandProductBenchmarks = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20,
  enabled: boolean = false
) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductBenchmarks', brandId, productId, limit] 
      : ['catalog', 'brandProductBenchmarks', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductBenchmarks } = await import('./brandApi');
      return getBrandProductBenchmarks(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId && enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika - pull to refresh'e kadar cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Mount'ta tekrar fetch etme, cache'ten kullan
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  });
};

/**
 * useBrandProductTips - Brand product tips postlarını getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/tips endpoint'ini kullanır
 * Lazy loading: enabled parametresi ile kontrol edilir
 */
export const useBrandProductTips = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20,
  enabled: boolean = false
) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductTips', brandId, productId, limit] 
      : ['catalog', 'brandProductTips', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductTips } = await import('./brandApi');
      return getBrandProductTips(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId && enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika - pull to refresh'e kadar cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Mount'ta tekrar fetch etme, cache'ten kullan
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  });
};

/**
 * useBrandProductQuestions - Brand product question postlarını getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/questions endpoint'ini kullanır
 * Lazy loading: enabled parametresi ile kontrol edilir
 */
export const useBrandProductQuestions = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20,
  enabled: boolean = false
) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductQuestions', brandId, productId, limit] 
      : ['catalog', 'brandProductQuestions', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductQuestions } = await import('./brandApi');
      return getBrandProductQuestions(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId && enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika - pull to refresh'e kadar cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Mount'ta tekrar fetch etme, cache'ten kullan
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  });
};

/**
 * useBrandProductExperiences - Brand product experience postlarını getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/experiences endpoint'ini kullanır
 */
export const useBrandProductExperiences = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20
) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductExperiences', brandId, productId, limit] 
      : ['catalog', 'brandProductExperiences', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductExperiences } = await import('./brandApi');
      return getBrandProductExperiences(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId, // Arka planda yüklenecek
    staleTime: 5 * 60 * 1000, // 5 dakika - pull to refresh'e kadar cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Mount'ta tekrar fetch etme, cache'ten kullan
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  });
};

/**
 * useBrandProductComparisons - Brand product comparison postlarını getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/comparisons endpoint'ini kullanır
 */
export const useBrandProductComparisons = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20
) => {
  return useInfiniteQuery<BrandFeedResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductComparisons', brandId, productId, limit] 
      : ['catalog', 'brandProductComparisons', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductComparisons } = await import('./brandApi');
      return getBrandProductComparisons(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId, // Arka planda yüklenecek
    staleTime: 5 * 60 * 1000, // 5 dakika - pull to refresh'e kadar cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Mount'ta tekrar fetch etme, cache'ten kullan
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  });
};

/**
 * useBrandProductNews - Brand product news'lerini getirir (infinite scroll)
 * /brands/{brandId}/products/{productId}/news endpoint'ini kullanır
 * Lazy loading: enabled parametresi ile kontrol edilir
 */
export const useBrandProductNews = (
  brandId: string | undefined,
  productId: string | undefined,
  limit: number = 20,
  enabled: boolean = false
) => {
  return useInfiniteQuery<ProductNewsResponse, Error>({
    queryKey: brandId && productId 
      ? [...catalogKeys.all, 'brandProductNews', brandId, productId, limit] 
      : ['catalog', 'brandProductNews', 'disabled'],
    queryFn: async ({ pageParam }) => {
      if (!brandId || !productId) {
        throw new Error('Brand ID and Product ID are required');
      }
      const cursor = pageParam as string | undefined;
      const { getBrandProductNews } = await import('./brandApi');
      return getBrandProductNews(brandId, productId, cursor, limit);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination?.hasMore) {
        return undefined;
      }
      return lastPage.pagination?.cursor;
    },
    enabled: !!brandId && !!productId && enabled,
    staleTime: 5 * 60 * 1000, // 5 dakika - pull to refresh'e kadar cache'te tut
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Mount'ta tekrar fetch etme, cache'ten kullan
    refetchOnWindowFocus: false, // Window focus'ta fetch etme
  });
};
