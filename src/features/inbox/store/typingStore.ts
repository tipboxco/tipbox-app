/**
 * Per-thread typing state store.
 * Subscribers are notified only for their threadId, so typing updates
 * do not cause full list re-renders (only the affected row re-renders).
 */
export type TypingInfo = { userId: string; userName?: string } | null;

type Listener = (value: TypingInfo) => void;

const state: Record<string, TypingInfo> = {};
const listeners: Record<string, Set<Listener>> = {};

function getListenersForThread(threadId: string): Set<Listener> {
  if (!listeners[threadId]) {
    listeners[threadId] = new Set();
  }
  return listeners[threadId];
}

export const inboxTypingStore = {
  getTyping(threadId: string): TypingInfo {
    return state[threadId] ?? null;
  },

  setTyping(threadId: string, value: TypingInfo): void {
    const prev = state[threadId] ?? null;
    if (value === prev && (value == null || (value.userId === prev.userId && value.userName === prev.userName))) {
      return;
    }
    if (value == null) {
      delete state[threadId];
    } else {
      state[threadId] = value;
    }
    getListenersForThread(threadId).forEach((cb) => cb(value));
  },

  subscribe(threadId: string, callback: Listener): () => void {
    const set = getListenersForThread(threadId);
    set.add(callback);
    callback(state[threadId] ?? null);
    return () => {
      set.delete(callback);
    };
  },
};
