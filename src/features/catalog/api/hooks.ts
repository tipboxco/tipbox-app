import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { getCatalogCategories, getCatalogSubCategories, getCatalogProductGroups, getCatalogProducts, getProductDetail, getProductPosts, getProductNews, getNewsDetail } from './catalogApi';
import { getBrandCategories, getBrandsByCategory, getBrandCatalog, getBrandFeed, getBrandProductBook, getBrandSurveys, getBrandTrends, getBrandEvents, getBrandHistory, getBrandStats } from './brandApi';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct, BrandCategory, BrandListItem, BrandCatalogResponse, BrandFeedResponse, BrandProductBookResponse, BrandSurveysResponse, BrandTrendsResponse, BrandEventsResponse, ProductDetail, ProductPostsResponse, ProductNewsResponse, NewsDetail, BrandHistory, BrandStats } from '../types';

/**
 * Query Keys - Catalog feature için cache key pattern'leri
 */
export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  brandCategories: () => [...catalogKeys.all, 'brandCategories'] as const,
  brandList: (categoryId: string) => [...catalogKeys.all, 'brands', categoryId] as const,
  brandCatalog: (brandId: string) => [...catalogKeys.all, 'brandCatalog', brandId] as const,
  brandFeed: (brandId: string, cursor?: string, limit?: number) => 
    [...catalogKeys.all, 'brandFeed', brandId, cursor, limit] as const,
  brandProductBook: (brandId: string) => [...catalogKeys.all, 'brandProductBook', brandId] as const,
  brandSurveys: (brandId: string, limit?: number) => 
    [...catalogKeys.all, 'brandSurveys', brandId, limit] as const,
  brandTrends: (brandId: string, limit?: number) => 
    [...catalogKeys.all, 'brandTrends', brandId, limit] as const,
  brandEvents: (brandId: string, limit?: number) => 
    [...catalogKeys.all, 'brandEvents', brandId, limit] as const,
  brandHistory: (brandId: string) => [...catalogKeys.all, 'brandHistory', brandId] as const,
  brandStats: (brandId: string) => [...catalogKeys.all, 'brandStats', brandId] as const,
  subCategories: (categoryId: string) => [...catalogKeys.all, 'subCategories', categoryId] as const,
  productGroups: (subCategoryId: string) => [...catalogKeys.all, 'productGroups', subCategoryId] as const,
  products: (productGroupId: string) => [...catalogKeys.all, 'products', productGroupId] as const,
  productDetail: (productId: string) => [...catalogKeys.all, 'productDetail', productId] as const,
  productPosts: (productId: string, type?: string, cursor?: string, limit?: number) => 
    [...catalogKeys.all, 'productPosts', productId, type, cursor, limit] as const,
  productNews: (productId: string, cursor?: string, limit?: number) => 
    [...catalogKeys.all, 'productNews', productId, cursor, limit] as const,
  newsDetail: (newsId: string) => [...catalogKeys.all, 'newsDetail', newsId] as const,
};

/**
 * Prefetch helper functions - Catalog verilerini önceden yüklemek için
 */
export const useCatalogPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchSubCategories = useCallback((categoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: catalogKeys.subCategories(categoryId),
      queryFn: () => getCatalogSubCategories(categoryId),
      staleTime: 2 * 60 * 60 * 1000, // 2 saat - dokümana göre backend cache TTL
    });
  }, [queryClient]);

  const prefetchProductGroups = useCallback((subCategoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: catalogKeys.productGroups(subCategoryId),
      queryFn: () => getCatalogProductGroups(subCategoryId),
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
 * Tüm katalog kategorilerini getirir ve cache'ler
 * 
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogCategories();
 */
export const useCatalogCategories = () => {
  return useQuery<CatalogCategory[], Error>({
    queryKey: catalogKeys.categories(),
    queryFn: () => getCatalogCategories(),
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
    retry: 3, // Dokümana göre retry mekanizması
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Get Catalog SubCategories query hook
 * Belirli bir kategoriye ait alt kategorileri getirir ve cache'ler
 * 
 * @param categoryId - Kategori ID'si
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogSubCategories('category-123');
 */
export const useCatalogSubCategories = (categoryId: string | undefined) => {
  return useQuery<CatalogSubCategory[], Error>({
    queryKey: categoryId ? catalogKeys.subCategories(categoryId) : ['catalog', 'subCategories', 'disabled'],
    queryFn: () => {
      if (!categoryId) {
        throw new Error('Category ID is required');
      }
      return getCatalogSubCategories(categoryId);
    },
    enabled: !!categoryId,
    staleTime: 2 * 60 * 60 * 1000, // 2 saat - dokümana göre backend cache TTL
    gcTime: 24 * 60 * 60 * 1000, // 24 saat - cache'de tut
    refetchOnMount: false, // Cache varsa kullan, yoksa fetch et
    refetchOnWindowFocus: false,
    retry: 3, // Dokümana göre retry mekanizması
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};

/**
 * Get Catalog ProductGroups query hook
 * Belirli bir alt kategoriye ait ürün gruplarını getirir ve cache'ler
 * 
 * @param subCategoryId - Alt kategori ID'si
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogProductGroups('subcategory-123');
 */
export const useCatalogProductGroups = (subCategoryId: string | undefined) => {
  return useQuery<CatalogProductGroup[], Error>({
    queryKey: subCategoryId ? catalogKeys.productGroups(subCategoryId) : ['catalog', 'productGroups', 'disabled'],
    queryFn: () => {
      if (!subCategoryId) {
        throw new Error('SubCategory ID is required');
      }
      return getCatalogProductGroups(subCategoryId);
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
 * Get Catalog Products query hook
 * Belirli bir ürün grubuna ait ürünleri getirir ve cache'ler
 * 
 * @param productGroupId - Ürün grubu ID'si
 * @param search - Product adı, marka veya açıklamasında arama (opsiyonel)
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogProducts('productgroup-123', 'iphone');
 */
export const useCatalogProducts = (productGroupId: string | undefined, search?: string) => {
  const hasSearchQuery = !!search && search.trim().length > 0;
  
  return useQuery<CatalogProduct[], Error>({
    queryKey: productGroupId ? [...catalogKeys.products(productGroupId), search] : ['catalog', 'products', 'disabled'],
    queryFn: () => {
      if (!productGroupId) {
        throw new Error('ProductGroup ID is required');
      }
      return getCatalogProducts(productGroupId, search);
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
 *
 * @param brandId - Marka ID'si
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useBrandProductBook('brand-123');
 */
export const useBrandProductBook = (brandId: string | undefined, limit: number = 20) => {
  return useInfiniteQuery<BrandProductBookResponse, Error>({
    queryKey: brandId ? catalogKeys.brandProductBook(brandId) : ['catalog', 'brandProductBook', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getBrandProductBook(brandId, cursor, limit);
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
 * @param productId - Product ID'si
 * @param type - Post type (experience, comments, benchmark) - opsiyonel
 * @param limit - Sayfa başına item sayısı (default: 20)
 * @returns React Query infinite query hook result
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductPosts('product-123', 'experience');
 */
export const useProductPosts = (
  productId: string | undefined,
  type?: 'experience' | 'comments' | 'benchmark',
  limit: number = 20
) => {
  return useInfiniteQuery<ProductPostsResponse, Error>({
    queryKey: productId ? catalogKeys.productPosts(productId, type, undefined, limit) : ['catalog', 'productPosts', 'disabled'],
    queryFn: ({ pageParam }) => {
      if (!productId) {
        throw new Error('Product ID is required');
      }
      const cursor = pageParam as string | undefined;
      return getProductPosts(productId, type, cursor, limit);
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

