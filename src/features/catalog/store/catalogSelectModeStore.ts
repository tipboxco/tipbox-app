import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Catalog Select Mode Store
 * Catalog ekranının select mode durumunu tutar (örn: EventCreatePost'tan yönlendirildiğinde)
 */
interface CatalogSelectModeState {
  selectMode: 'event' | undefined;
  returnScreen: string | undefined;
  
  // Actions
  setSelectMode: (mode: 'event' | undefined, returnScreen?: string) => void;
  clearSelectMode: () => void;
  isSelectMode: () => boolean;
}

export const useCatalogSelectModeStore = create<CatalogSelectModeState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectMode: undefined,
      returnScreen: undefined,
      
      // Set select mode
      setSelectMode: (mode: 'event' | undefined, returnScreen?: string) => {
        set({ 
          selectMode: mode,
          returnScreen: returnScreen,
        });
      },
      
      // Clear select mode
      clearSelectMode: () => {
        set({ 
          selectMode: undefined,
          returnScreen: undefined,
        });
      },
      
      // Check if in select mode
      isSelectMode: () => {
        return get().selectMode !== undefined;
      },
    }),
    { name: 'CatalogSelectModeStore' }
  )
);
