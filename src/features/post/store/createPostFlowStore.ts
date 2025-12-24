import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ProductInfoType } from '@/src/types/common';

/**
 * Minimal product info snapshot for UI display only
 * NOT persisted, short-lived, TTL-based
 */
interface ProductInfoSnapshot {
  image: any;
  title: string;
  subName?: string;
}

interface CreatePostFlowState {
  // Flow context - IDs preferred over full objects
  contextType: ProductInfoType | undefined;
  contextId: string | undefined;
  
  // Minimal snapshot for UI display only (short-lived)
  productInfoSnapshot: ProductInfoSnapshot | undefined;
  
  // TTL for automatic cleanup (30 minutes)
  expiresAt: number | undefined;
  
  // Actions
  setFlowContext: (
    contextType: ProductInfoType,
    contextId: string,
    productInfoSnapshot?: ProductInfoSnapshot
  ) => void;
  clearFlow: () => void;
  
  // Helper to check if flow context is valid and not expired
  isValid: () => boolean;
}

// TTL: 30 minutes
const FLOW_TTL_MS = 30 * 60 * 1000;

export const useCreatePostFlowStore = create<CreatePostFlowState>()(
  devtools(
    (set, get) => ({
      // Initial state
      contextType: undefined,
      contextId: undefined,
      productInfoSnapshot: undefined,
      expiresAt: undefined,
      
      // Set flow context with TTL
      setFlowContext: (
        contextType: ProductInfoType,
        contextId: string,
        productInfoSnapshot?: ProductInfoSnapshot
      ) => {
        const expiresAt = Date.now() + FLOW_TTL_MS;
        set({
          contextType,
          contextId,
          productInfoSnapshot,
          expiresAt,
        });
      },
      
      // Clear flow context (called on cancel/submit/back)
      clearFlow: () => {
        set({
          contextType: undefined,
          contextId: undefined,
          productInfoSnapshot: undefined,
          expiresAt: undefined,
        });
      },
      
      // Check if flow context is valid and not expired
      isValid: () => {
        const state = get();
        if (!state.contextType || !state.contextId) {
          return false;
        }
        
        // Check TTL
        if (state.expiresAt && Date.now() > state.expiresAt) {
          // Auto-clear expired flow
          get().clearFlow();
          return false;
        }
        
        return true;
      },
    }),
    { name: 'CreatePostFlowStore' }
  )
);

