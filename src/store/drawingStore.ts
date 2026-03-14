import { create } from 'zustand';
import type { BrushSettings, Layer, Stroke, BrushType } from '../types/drawing';
import { DEFAULT_BRUSH_SETTINGS } from '../types/drawing';
import { generateId } from '../utils/math';

interface DrawingState {
  brushSettings: BrushSettings;
  brushType: BrushType;
  layers: Layer[];
  activeLayerId: string;
  strokes: Stroke[];
  canvasWidth: number;
  canvasHeight: number;

  setBrushSettings: (settings: Partial<BrushSettings>) => void;
  setBrushType: (type: BrushType) => void;
  addLayer: () => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  addStroke: (stroke: Stroke) => void;
  removeStroke: (id: string) => void;
  setCanvasSize: (width: number, height: number) => void;
  initLayers: (width: number, height: number) => void;
}

function createLayer(name: string, width: number, height: number): Layer {
  let canvas: OffscreenCanvas | null = null;
  try {
    canvas = new OffscreenCanvas(width, height);
  } catch {
    canvas = null;
  }
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'normal',
    canvas,
  };
}

export const useDrawingStore = create<DrawingState>((set) => ({
  brushSettings: { ...DEFAULT_BRUSH_SETTINGS },
  brushType: 'pen',
  layers: [],
  activeLayerId: '',
  strokes: [],
  canvasWidth: 1920,
  canvasHeight: 1080,

  setBrushSettings: (settings) =>
    set((s) => ({ brushSettings: { ...s.brushSettings, ...settings } })),

  setBrushType: (type) => set({ brushType: type }),

  addLayer: () =>
    set((s) => {
      const layer = createLayer(`Layer ${s.layers.length + 1}`, s.canvasWidth, s.canvasHeight);
      return {
        layers: [...s.layers, layer],
        activeLayerId: layer.id,
      };
    }),

  removeLayer: (id) =>
    set((s) => {
      if (s.layers.length <= 1) return s;
      const newLayers = s.layers.filter((l) => l.id !== id);
      return {
        layers: newLayers,
        activeLayerId: s.activeLayerId === id ? newLayers[0].id : s.activeLayerId,
        strokes: s.strokes.filter((st) => st.layerId !== id),
      };
    }),

  setActiveLayer: (id) => set({ activeLayerId: id }),

  updateLayer: (id, updates) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  moveLayer: (fromIndex, toIndex) =>
    set((s) => {
      const newLayers = [...s.layers];
      const [moved] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, moved);
      return { layers: newLayers };
    }),

  addStroke: (stroke) =>
    set((s) => ({ strokes: [...s.strokes, stroke] })),

  removeStroke: (id) =>
    set((s) => ({ strokes: s.strokes.filter((st) => st.id !== id) })),

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),

  initLayers: (width, height) =>
    set(() => {
      const layer = createLayer('Layer 1', width, height);
      return {
        layers: [layer],
        activeLayerId: layer.id,
        canvasWidth: width,
        canvasHeight: height,
      };
    }),
}));
