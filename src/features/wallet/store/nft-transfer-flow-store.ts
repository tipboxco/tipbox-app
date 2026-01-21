import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface NftTransferRecipientSnapshot {
  id: string;
  name: string;
  userName?: string;
  avatar?: any;
}

interface NftTransferFlowState {
  nftId: string | undefined;
  listingId: string | undefined;
  listingStatus: string | undefined; // e.g. "ACTIVE"
  recipient: NftTransferRecipientSnapshot | undefined;

  // TTL for automatic cleanup
  expiresAt: number | undefined;

  // Actions
  setTransferNft: (data: { nftId: string; listingId?: string; listingStatus?: string }) => void;
  setRecipient: (recipient: NftTransferRecipientSnapshot) => void;
  clear: () => void;

  // Helper
  isValid: () => boolean;
}

// TTL: 15 minutes (short-lived UI flow)
const FLOW_TTL_MS = 15 * 60 * 1000;

export const useNftTransferFlowStore = create<NftTransferFlowState>()(
  devtools(
    (set, get) => ({
      nftId: undefined,
      listingId: undefined,
      listingStatus: undefined,
      recipient: undefined,
      expiresAt: undefined,

      setTransferNft: (data) => {
        const expiresAt = Date.now() + FLOW_TTL_MS;
        set({
          nftId: data.nftId,
          listingId: data.listingId,
          listingStatus: data.listingStatus,
          expiresAt,
        });
      },

      setRecipient: (recipient: NftTransferRecipientSnapshot) => {
        const expiresAt = Date.now() + FLOW_TTL_MS;
        set({ recipient, expiresAt });
      },

      clear: () => {
        set({
          nftId: undefined,
          listingId: undefined,
          listingStatus: undefined,
          recipient: undefined,
          expiresAt: undefined,
        });
      },

      isValid: () => {
        const state = get();
        if (!state.nftId || !state.recipient) return false;
        if (state.expiresAt && Date.now() > state.expiresAt) {
          get().clear();
          return false;
        }
        return true;
      },
    }),
    { name: 'NftTransferFlowStore' }
  )
);

