import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DraftPostType = 'experience' | 'tips' | 'benchmark' | 'update' | 'question' | 'free';

export interface Draft {
  id: string;
  type: DraftPostType;
  experienceOption?: 'own' | 'tried';
  productId?: string;
  productName?: string;
  productSubName?: string;
  productImage?: any;
  content?: string;
  createdAt: string;
}

interface DraftState {
  drafts: Draft[];
  saveDraft: (draft: Omit<Draft, 'id' | 'createdAt'>) => string;
  updateDraft: (id: string, changes: Partial<Omit<Draft, 'id' | 'createdAt'>>) => void;
  deleteDraft: (id: string) => void;
  clearDrafts: () => void;
  getDraft: (id: string) => Draft | undefined;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: [],

      saveDraft: (draft) => {
        const id = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newDraft: Draft = {
          ...draft,
          id,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ drafts: [newDraft, ...state.drafts].slice(0, 20) }));
        return id;
      },

      updateDraft: (id, changes) => {
        set((state) => ({
          drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...changes } : d)),
        }));
      },

      deleteDraft: (id) => {
        set((state) => ({ drafts: state.drafts.filter((d) => d.id !== id) }));
      },

      clearDrafts: () => set({ drafts: [] }),

      getDraft: (id) => get().drafts.find((d) => d.id === id),
    }),
    {
      name: 'tipbox-drafts',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
