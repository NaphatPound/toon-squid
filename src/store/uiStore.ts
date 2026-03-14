import { create } from 'zustand';
import type { ToolType, AppMode } from '../types/project';

interface UIState {
  activeTool: ToolType;
  appMode: AppMode;
  showTimeline: boolean;
  showBoneTree: boolean;
  showLayerPanel: boolean;
  cursorPosition: { x: number; y: number };
  zoomLevel: number;
  setActiveTool: (tool: ToolType) => void;
  setAppMode: (mode: AppMode) => void;
  toggleTimeline: () => void;
  toggleBoneTree: () => void;
  toggleLayerPanel: () => void;
  setCursorPosition: (x: number, y: number) => void;
  setZoomLevel: (zoom: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: 'pen',
  appMode: 'draw',
  showTimeline: false,
  showBoneTree: true,
  showLayerPanel: true,
  cursorPosition: { x: 0, y: 0 },
  zoomLevel: 1,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setAppMode: (mode) => set({ appMode: mode }),
  toggleTimeline: () => set((s) => ({ showTimeline: !s.showTimeline })),
  toggleBoneTree: () => set((s) => ({ showBoneTree: !s.showBoneTree })),
  toggleLayerPanel: () => set((s) => ({ showLayerPanel: !s.showLayerPanel })),
  setCursorPosition: (x, y) => set({ cursorPosition: { x, y } }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
}));
