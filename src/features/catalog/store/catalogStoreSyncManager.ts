/**
 * Catalog Store Synchronization Manager
 * Ensures useCatalogUIStore and useCatalogNavigationStore stay in sync
 *
 * Problem: Two stores managing overlapping state (selected product, view, etc.)
 * Solution: Sync UI store changes to navigation store for persistence
 */

import { useCatalogUIStore } from './catalogUIStore';
import { useCatalogNavigationStore } from './catalogNavigationStore';

/**
 * Sync product catalog selections from UI store to navigation store
 * This ensures selections are persisted and survive app restarts
 */
export const syncProductCatalogSelectionsToNavStore = () => {
  const uiState = useCatalogUIStore.getState();
  const navStore = useCatalogNavigationStore.getState();

  // Only sync if values actually changed to avoid unnecessary updates
  const hasChanged =
    uiState.selectedProductId !== navStore.productCatalogState.selectedProductId ||
    uiState.selectedSubCategoryId !== navStore.productCatalogState.selectedSubCategoryId ||
    uiState.selectedProductGroupId !== navStore.productCatalogState.selectedProductGroupId ||
    uiState.currentView !== navStore.productCatalogState.currentView;

  if (hasChanged) {
    navStore.setProductCatalogState({
      selectedProductId: uiState.selectedProductId,
      selectedSubCategoryId: uiState.selectedSubCategoryId,
      selectedProductGroupId: uiState.selectedProductGroupId,
      currentView: uiState.currentView,
    });
  }
};

/**
 * Restore product catalog to NavigationStore state
 * Useful when components mount and need to sync with persisted state
 */
export const restoreProductCatalogFromNavStore = () => {
  const navState = useCatalogNavigationStore.getState().productCatalogState;
  const uiStore = useCatalogUIStore.getState();

  // Restore all selections from navigation store
  if (navState.selectedProductId !== undefined) {
    uiStore.setSelectedProduct(navState.selectedProductId);
  }
  if (navState.selectedSubCategoryId !== undefined) {
    uiStore.setSelectedSubCategory(navState.selectedSubCategoryId);
  }
  if (navState.selectedProductGroupId !== undefined) {
    uiStore.setSelectedProductGroup(navState.selectedProductGroupId);
  }
  if (navState.currentView) {
    uiStore.setCurrentView(navState.currentView);
  }
};

/**
 * Clear all catalog selections from both stores
 * Should be called when user navigates away from catalog
 */
export const clearAllCatalogSelections = () => {
  useCatalogUIStore.getState().clearSelection();
  useCatalogNavigationStore.getState().resetProductCatalogState();
};
