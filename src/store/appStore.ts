import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  language: 'tr' | 'en';
  isOnline: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'tr' | 'en') => void;
  setOnlineStatus: (status: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  language: 'tr',
  isOnline: true,
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  setOnlineStatus: (isOnline) => set({ isOnline }),
})); 