import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface WalletState {
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  devtools((set) => ({
    isConnected: false,
    connect: () => set({ isConnected: true }),
    disconnect: () => set({ isConnected: false }),
  }))
);


