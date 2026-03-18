import { useEffect } from 'react';
import { useInventory } from '@/src/features/profile/api/hooks';
import { useCreatePostFlowStore } from '@/src/features/post/store/createPostFlowStore';
import { useAppStore } from '@/src/store/appStore';

/**
 * Hook to sync inventory product IDs from API to store
 * Should be called on app load or when inventory data changes
 * Automatically caches IDs in store for fast lookups
 */
export const useSyncInventoryToStore = () => {
  const { user } = useAppStore();
  const { data: inventoryData, isLoading: isInventoryLoading } = useInventory(user?.id || '', 100);
  const setInventoryProductIds = useCreatePostFlowStore(
    (state) => state.setInventoryProductIds
  );

  useEffect(() => {
    // CRITICAL FIX: Safe array flatMap to prevent Hermes crash (NULL pointer dereference)
    if (inventoryData?.pages && Array.isArray(inventoryData.pages)) {
      // Extract all product IDs from inventory pages
      const productIds = new Set(
        inventoryData.pages
          .flatMap((page) => {
            // Ensure page and page.items exist
            if (!page?.items || !Array.isArray(page.items)) {
              return [];
            }
            return page.items;
          })
          .map((item) => item?.productId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      );

      // Update store with new IDs
      setInventoryProductIds(productIds);
    }
  }, [inventoryData, setInventoryProductIds]);

  return {
    isLoading: isInventoryLoading,
    inventoryData,
    syncComplete: !!inventoryData && !isInventoryLoading,
  };
};
