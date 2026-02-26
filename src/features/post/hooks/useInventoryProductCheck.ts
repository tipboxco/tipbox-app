import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { useCallback } from 'react';

/**
 * Hook to check if a product is in user's inventory
 * Uses store-cached inventory IDs for fast O(1) lookup
 */
export const useInventoryProductCheck = () => {
  const inventoryProductIds = useCreatePostFlowStore(
    (state) => state.inventoryProductIds
  );
  const isProductInInventory = useCreatePostFlowStore(
    (state) => state.isProductInInventory
  );

  /**
   * Check if product is in inventory
   */
  const checkProduct = useCallback(
    (productId?: string): boolean => {
      if (!productId) return false;
      return isProductInInventory(productId);
    },
    [isProductInInventory]
  );

  /**
   * Get count of products in inventory
   */
  const getInventoryCount = useCallback((): number => {
    return inventoryProductIds.size;
  }, [inventoryProductIds]);

  /**
   * Check if any products are in inventory
   */
  const hasInventory = useCallback((): boolean => {
    return inventoryProductIds.size > 0;
  }, [inventoryProductIds]);

  return {
    checkProduct,
    getInventoryCount,
    hasInventory,
    inventoryProductIds,
  };
};
