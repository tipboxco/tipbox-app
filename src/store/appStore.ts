import { create } from 'zustand';
import type { Theme, Language } from '@/src/types';

interface AppState {
  theme: Theme;
  language: Language;
  isOnline: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useAppStore = create<AppState>()(set => ({
  theme: 'light',
  language: 'tr',
  isOnline: true,
  setTheme: (theme: Theme) => set({ theme }),
  setLanguage: (language: Language) => set({ language }),
  setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
}));
