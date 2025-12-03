import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getCatalogCategories, getCatalogSubCategories, getCatalogProductGroups, getCatalogProducts } from './catalogApi';
import { getBrandCategories, getBrandsByCategory, getBrandCatalog, getBrandFeed, getBrandProductBook } from './brandApi';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct, BrandCategory, BrandListItem, BrandCatalogResponse, BrandFeedResponse, BrandProductBookResponse } from '../types';

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
  subCategories: (categoryId: string) => [...catalogKeys.all, 'subCategories', categoryId] as const,
  productGroups: (subCategoryId: string) => [...catalogKeys.all, 'productGroups', subCategoryId] as const,
  products: (productGroupId: string) => [...catalogKeys.all, 'products', productGroupId] as const,
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
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Catalog Products query hook
 * Belirli bir ürün grubuna ait ürünleri getirir ve cache'ler
 * 
 * @param productGroupId - Ürün grubu ID'si
 * @returns React Query hook result
 * 
 * @example
 * const { data, isLoading, error } = useCatalogProducts('productgroup-123');
 */
export const useCatalogProducts = (productGroupId: string | undefined) => {
  return useQuery<CatalogProduct[], Error>({
    queryKey: productGroupId ? catalogKeys.products(productGroupId) : ['catalog', 'products', 'disabled'],
    queryFn: () => {
      if (!productGroupId) {
        throw new Error('ProductGroup ID is required');
      }
      return getCatalogProducts(productGroupId);
    },
    enabled: !!productGroupId,
    staleTime: 0, // Cache yok
    gcTime: 0, // Cache yok
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
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
    staleTime: 0, // Cache yok - veri hemen stale olur
    gcTime: 0, // Cache yok - veri hemen temizlenir
    refetchOnMount: 'always', // Her mount'ta yeniden fetch
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Get Brand Product Book query hook
 * /brands/{brandId}/products endpoint'inden marka ürün listesini getirir
 *
 * @param brandId - Marka ID'si
 * @returns React Query hook result
 *
 * @example
 * const { data, isLoading, error } = useBrandProductBook('brand-123');
 */
export const useBrandProductBook = (brandId: string | undefined) => {
  return useQuery<BrandProductBookResponse, Error>({
    queryKey: brandId ? catalogKeys.brandProductBook(brandId) : ['catalog', 'brandProductBook', 'disabled'],
    queryFn: () => {
      if (!brandId) {
        throw new Error('Brand ID is required');
      }
      return getBrandProductBook(brandId);
    },
    enabled: !!brandId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

