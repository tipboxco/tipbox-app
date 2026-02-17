/**
 * Hook for automatic synchronization of catalog UI store with navigation store
 * Ensures selections are automatically persisted without manual intervention
 */

import { useEffect } from 'react';
import { useCatalogUIStore } from './catalogUIStore';
import { syncProductCatalogSelectionsToNavStore } from './catalogStoreSyncManager';

/**
 * useAutoSyncCatalogState - Automatically sync UI store changes to navigation store
 * Call this hook in components that interact with the catalog to ensure persistence
 */
export const useAutoSyncCatalogState = () => {
  useEffect(() => {
    // Subscribe to UI store changes
    const unsubscribe = useCatalogUIStore.subscribe(
      (state) => state, // Watch all state
      () => {
        // Auto-sync to navigation store whenever UI store changes
        syncProductCatalogSelectionsToNavStore();
      }
    );

    return unsubscribe;
  }, []);
};
