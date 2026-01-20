import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BreadcrumbItem } from '@/src/types/breadcrumb';

/**
 * Catalog Navigation State Store
 * ProductCatalog ve BrandCatalog arasındaki geçişlerde state'i tutar
 * - En son hangi catalog'da gezindiğimizi tutar (product/brand)
 * - Her catalog tipi için index ve state bilgisini tutar
 * - Tab'lar arasında gezinince state kaybolmaz (persist)
 */
interface ProductCatalogState {
  currentView: 'categories' | 'subcategories' | 'productgroups' | 'products';
  selectedCategoryId?: string;
  selectedSubCategoryId?: string;
  selectedProductGroupId?: string;
  selectedProductId?: string;
  breadcrumbItems: BreadcrumbItem[];
}

interface BrandCatalogState {
  currentStep: 'categories' | 'brands';
  selectedCategoryId?: string;
  breadcrumbItems: BreadcrumbItem[];
}

interface CatalogNavigationState {
  // En son hangi catalog'da gezindiğimiz
  lastCatalogType: 'product' | 'brand';
  
  // ProductCatalog state
  productCatalogState: ProductCatalogState;
  
  // BrandCatalog state
  brandCatalogState: BrandCatalogState;
  
  // Actions
  setLastCatalogType: (type: 'product' | 'brand') => void;
  
  // ProductCatalog actions
  setProductCatalogState: (state: Partial<ProductCatalogState>) => void;
  resetProductCatalogState: () => void;
  
  // BrandCatalog actions
  setBrandCatalogState: (state: Partial<BrandCatalogState>) => void;
  resetBrandCatalogState: () => void;
  
  // Helper: Get current catalog state
  getCurrentCatalogState: () => ProductCatalogState | BrandCatalogState;
}

const initialProductCatalogState: ProductCatalogState = {
  currentView: 'categories',
  breadcrumbItems: [],
};

const initialBrandCatalogState: BrandCatalogState = {
  currentStep: 'categories',
  breadcrumbItems: [],
};

export const useCatalogNavigationStore = create<CatalogNavigationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        lastCatalogType: 'product',
        productCatalogState: initialProductCatalogState,
        brandCatalogState: initialBrandCatalogState,
        
        // Set last catalog type
        setLastCatalogType: (type: 'product' | 'brand') => {
          set({ lastCatalogType: type });
        },
        
        // ProductCatalog actions
        setProductCatalogState: (partialState: Partial<ProductCatalogState>) => {
          set((state) => ({
            productCatalogState: {
              ...state.productCatalogState,
              ...partialState,
            },
          }));
        },
        
        resetProductCatalogState: () => {
          set({ productCatalogState: initialProductCatalogState });
        },
        
        // BrandCatalog actions
        setBrandCatalogState: (partialState: Partial<BrandCatalogState>) => {
          set((state) => ({
            brandCatalogState: {
              ...state.brandCatalogState,
              ...partialState,
            },
          }));
        },
        
        resetBrandCatalogState: () => {
          set({ brandCatalogState: initialBrandCatalogState });
        },
        
        // Helper: Get current catalog state
        getCurrentCatalogState: () => {
          const state = get();
          return state.lastCatalogType === 'product'
            ? state.productCatalogState
            : state.brandCatalogState;
        },
      }),
      {
        name: 'catalog-navigation-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          lastCatalogType: state.lastCatalogType,
          productCatalogState: state.productCatalogState,
          brandCatalogState: state.brandCatalogState,
        }),
      }
    ),
    { name: 'CatalogNavigationStore' }
  )
);

// Export store instance for getState() access outside of components
export const catalogNavigationStore = useCatalogNavigationStore;
