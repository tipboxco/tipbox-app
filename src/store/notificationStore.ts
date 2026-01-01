import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Notification } from '@/src/features/notifications/api/types';

/**
 * Notification Store
 * 
 * Advanced state management for notifications:
 * - Realtime notification state (Socket.IO events)
 * - Optimistic updates
 * - Notification grouping state
 * - Unread count cache
 * 
 * State Management Rules:
 * - Zustand holds CLIENT STATE (UI state, realtime flags)
 * - React Query holds SERVER STATE (API data, cache)
 * - This store syncs with React Query but provides instant UI updates
 */
interface NotificationStoreState {
  // Realtime notification state (Socket.IO events)
  realtimeNotifications: Map<string, Notification>;
  
  // Notification grouping state
  groupedNotifications: Map<string, {
    type: string;
    count: number;
    lastNotification: Notification;
    timestamp: Date;
  }>;
  
  // Unread count cache (optimistic)
  unreadCountCache: number | null;
  
  // Last notification timestamp (for debouncing)
  lastNotificationTime: Date | null;
  
  // Actions
  addRealtimeNotification: (notification: Notification) => void;
  removeRealtimeNotification: (notificationId: string) => void;
  clearRealtimeNotifications: () => void;
  
  // Grouping actions
  addGroupedNotification: (type: string, notification: Notification) => void;
  getGroupedNotification: (type: string) => {
    count: number;
    lastNotification: Notification;
    timestamp: Date;
  } | null;
  clearGroupedNotification: (type: string) => void;
  clearAllGroupedNotifications: () => void;
  
  // Unread count actions
  setUnreadCountCache: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  clearUnreadCountCache: () => void;
  
  // Helper: Get all realtime notifications as array
  getRealtimeNotificationsArray: () => Notification[];
  
  // Helper: Check if notification is grouped
  isNotificationGrouped: (type: string) => boolean;
}

export const useNotificationStore = create<NotificationStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      realtimeNotifications: new Map(),
      groupedNotifications: new Map(),
      unreadCountCache: null,
      lastNotificationTime: null,

      // Add realtime notification (from Socket.IO)
      addRealtimeNotification: (notification) => {
        set((state) => {
          const newMap = new Map(state.realtimeNotifications);
          newMap.set(notification.id, notification);
          
          return {
            realtimeNotifications: newMap,
            lastNotificationTime: new Date(),
          };
        });
      },

      // Remove realtime notification
      removeRealtimeNotification: (notificationId) => {
        set((state) => {
          const newMap = new Map(state.realtimeNotifications);
          newMap.delete(notificationId);
          return { realtimeNotifications: newMap };
        });
      },

      // Clear all realtime notifications
      clearRealtimeNotifications: () => {
        set({
          realtimeNotifications: new Map(),
          lastNotificationTime: null,
        });
      },

      // Add grouped notification
      addGroupedNotification: (type, notification) => {
        set((state) => {
          const newMap = new Map(state.groupedNotifications);
          const existing = newMap.get(type);
          
          if (existing) {
            // Increment count and update last notification
            newMap.set(type, {
              type,
              count: existing.count + 1,
              lastNotification: notification,
              timestamp: new Date(),
            });
          } else {
            // Create new group
            newMap.set(type, {
              type,
              count: 1,
              lastNotification: notification,
              timestamp: new Date(),
            });
          }
          
          return { groupedNotifications: newMap };
        });
      },

      // Get grouped notification
      getGroupedNotification: (type) => {
        const state = get();
        const grouped = state.groupedNotifications.get(type);
        if (!grouped) return null;
        
        return {
          count: grouped.count,
          lastNotification: grouped.lastNotification,
          timestamp: grouped.timestamp,
        };
      },

      // Clear grouped notification
      clearGroupedNotification: (type) => {
        set((state) => {
          const newMap = new Map(state.groupedNotifications);
          newMap.delete(type);
          return { groupedNotifications: newMap };
        });
      },

      // Clear all grouped notifications
      clearAllGroupedNotifications: () => {
        set({ groupedNotifications: new Map() });
      },

      // Set unread count cache
      setUnreadCountCache: (count) => {
        set({ unreadCountCache: count });
      },

      // Increment unread count (optimistic update)
      incrementUnreadCount: () => {
        set((state) => ({
          unreadCountCache: state.unreadCountCache !== null 
            ? state.unreadCountCache + 1 
            : 1,
        }));
      },

      // Decrement unread count (optimistic update)
      decrementUnreadCount: () => {
        set((state) => ({
          unreadCountCache: state.unreadCountCache !== null && state.unreadCountCache > 0
            ? state.unreadCountCache - 1
            : 0,
        }));
      },

      // Clear unread count cache
      clearUnreadCountCache: () => {
        set({ unreadCountCache: null });
      },

      // Helper: Get all realtime notifications as array
      getRealtimeNotificationsArray: () => {
        const state = get();
        return Array.from(state.realtimeNotifications.values());
      },

      // Helper: Check if notification is grouped
      isNotificationGrouped: (type) => {
        const state = get();
        return state.groupedNotifications.has(type);
      },
    }),
    { name: 'NotificationStore' }
  )
);

