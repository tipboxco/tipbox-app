import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Drawer State Store
 * 
 * CRITICAL RULE: Drawer state navigation state ile ASLA senkronize edilmeyecek.
 * Drawer açık/kapalı durumu sadece user intent, gesture veya header button ile kontrol edilir.
 * 
 * Bu sayede:
 * - Navigation state değiştiğinde drawer state korunur
 * - Stack'ler resetlenmez
 * - Tab'ler re-render olmaz
 * - Gesture arbitration senin kontrolünde
 */
interface DrawerState {
  isOpen: boolean;
  isDragging: boolean; // Carousel ve diğer gesture'ları disable etmek için
  gestureEnabled: boolean; // Drawer gesture'ın aktif olup olmadığı (yatay scroll içeren ekranlarda false)
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setDragging: (dragging: boolean) => void;
  setGestureEnabled: (enabled: boolean) => void;
}

export const useDrawerStore = create<DrawerState>()(
  devtools(
    (set) => ({
      isOpen: false,
      isDragging: false,
      gestureEnabled: true, // Default: enabled (yatay scroll olmayan ekranlarda)
      openDrawer: () => set({ isOpen: true }, false, 'drawer/open'),
      closeDrawer: () => set({ isOpen: false }, false, 'drawer/close'),
      toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen }), false, 'drawer/toggle'),
      setDragging: (dragging: boolean) => set({ isDragging: dragging }, false, 'drawer/setDragging'),
      setGestureEnabled: (enabled: boolean) => set({ gestureEnabled: enabled }, false, 'drawer/setGestureEnabled'),
    }),
    { name: 'DrawerStore' }
  )
);

