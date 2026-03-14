import { create } from 'zustand';

export type HistoryActionType =
  | 'stroke-add'
  | 'stroke-remove'
  | 'layer-add'
  | 'layer-remove'
  | 'bone-transform'
  | 'bone-add'
  | 'bone-remove';

export interface HistoryAction {
  type: HistoryActionType;
  data: unknown;
  undo: () => void;
  redo: () => void;
}

interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  maxHistory: number;

  push: (action: HistoryAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: 50,

  push: (action) =>
    set((s) => {
      const past = [...s.past, action];
      if (past.length > s.maxHistory) past.shift();
      return { past, future: [] };
    }),

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const action = past[past.length - 1];
    action.undo();
    set({
      past: past.slice(0, -1),
      future: [action, ...future],
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const action = future[0];
    action.redo();
    set({
      past: [...past, action],
      future: future.slice(1),
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  clear: () => set({ past: [], future: [] }),
}));
