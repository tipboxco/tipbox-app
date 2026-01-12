import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Catalog UI State Store
 * Catalog sayfasındaki seçimleri tutar (Product, ProductGroup, SubCategory)
 * State management kurallarına göre: Feature store (src/features/catalog/store/)
 */
interface CatalogUIState {
  // Selected IDs (prefer IDs over full objects per rules)
  selectedProductId: string | undefined;
  selectedSubCategoryId: string | undefined;
  selectedProductGroupId: string | undefined;
  
  // Current view state
  currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
  
  // Actions
  setSelectedProduct: (productId: string | undefined) => void;
  setSelectedSubCategory: (subCategoryId: string | undefined) => void;
  setSelectedProductGroup: (productGroupId: string | undefined) => void;
  setCurrentView: (view: 'categories' | 'subcategories' | 'productgroups' | 'products') => void;
  clearSelection: () => void;
  
  // Helper: Get ID by type
  getContextId: (type: 'product' | 'product_group' | 'sub_category') => string | undefined;
}

export const useCatalogUIStore = create<CatalogUIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedProductId: undefined,
      selectedSubCategoryId: undefined,
      selectedProductGroupId: undefined,
      currentView: 'categories',
      
      // Set selected product ID
      setSelectedProduct: (productId: string | undefined) => {
        const current = get().selectedProductId;
        if (current !== productId) {
          set({ selectedProductId: productId });
        }
      },
      
      // Set selected sub category ID
      setSelectedSubCategory: (subCategoryId: string | undefined) => {
        const current = get().selectedSubCategoryId;
        if (current !== subCategoryId) {
          set({ selectedSubCategoryId: subCategoryId });
        }
      },
      
      // Set selected product group ID
      setSelectedProductGroup: (productGroupId: string | undefined) => {
        const current = get().selectedProductGroupId;
        if (current !== productGroupId) {
          set({ selectedProductGroupId: productGroupId });
        }
      },
      
      // Set current view
      setCurrentView: (view: 'categories' | 'subcategories' | 'productgroups' | 'products') => {
        const current = get().currentView;
        if (current !== view) {
          set({ currentView: view });
        }
      },
      
      // Clear all selections
      clearSelection: () => {
        set({
          selectedProductId: undefined,
          selectedSubCategoryId: undefined,
          selectedProductGroupId: undefined,
          currentView: 'categories',
        });
      },
      
      // Helper: Get context ID by type
      getContextId: (type: 'product' | 'product_group' | 'sub_category') => {
        const state = get();
        switch (type) {
          case 'product':
            return state.selectedProductId;
          case 'product_group':
            return state.selectedProductGroupId;
          case 'sub_category':
            return state.selectedSubCategoryId;
          default:
            return undefined;
        }
      },
    }),
    { name: 'CatalogUIStore' }
  )
);

