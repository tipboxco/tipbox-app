import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorMode = 'light' | 'dark';

interface ThemeState {
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colorMode: 'light',
      toggleColorMode: () =>
        set((state) => ({
          colorMode: state.colorMode === 'light' ? 'dark' : 'light',
        })),
      setColorMode: (mode) => set({ colorMode: mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 