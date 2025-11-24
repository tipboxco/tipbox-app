import { useQuery } from '@tanstack/react-query';
import { getCatalogCategories, getCatalogSubCategories, getCatalogProductGroups, getCatalogProducts } from './catalogApi';
import type { CatalogCategory, CatalogSubCategory, CatalogProductGroup, CatalogProduct } from '../types';

/**
 * Query Keys - Catalog feature için cache key pattern'leri
 */
export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
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

