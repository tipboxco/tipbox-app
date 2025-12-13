import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Navigation UI State Store
 * Global UI state için: Tab bar visibility, screen tracking, modal states
 * State management kurallarına göre: Global store (src/store/)
 */
interface NavigationUIState {
  // Tab bar visibility
  isTabBarVisible: boolean;
  
  // Camera state
  isCameraOpen: boolean;
  
  // Current screen tracking (optional, for analytics/debugging)
  currentScreenName: string | undefined;
  
  // Actions
  setTabBarVisible: (visible: boolean) => void;
  setCameraOpen: (open: boolean) => void;
  setCurrentScreen: (screenName: string | undefined) => void;
  reset: () => void;
}

const initialState = {
  isTabBarVisible: true,
  isCameraOpen: false,
  currentScreenName: undefined,
};

export const useNavigationUIStore = create<NavigationUIState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setTabBarVisible: (visible: boolean) => {
        set({ isTabBarVisible: visible });
      },
      
      setCameraOpen: (open: boolean) => {
        set({ 
          isCameraOpen: open,
          // Kamera açıkken tab bar'ı otomatik gizle
          isTabBarVisible: !open,
        });
      },
      
      setCurrentScreen: (screenName: string | undefined) => {
        set({ currentScreenName: screenName });
      },
      
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'NavigationUIStore' }
  )
);

