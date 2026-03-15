import { create } from 'zustand';
import type { BrushSettings, Layer, Stroke, BrushType, CustomBrush } from '../types/drawing';
import { DEFAULT_BRUSH_SETTINGS } from '../types/drawing';
import { generateId } from '../utils/math';

const BRUSHES_KEY = 'toon-squid-custom-brushes';

function loadCustomBrushes(): CustomBrush[] {
  try {
    const stored = localStorage.getItem(BRUSHES_KEY);
    if (stored) {
      const brushes: CustomBrush[] = JSON.parse(stored);
      // Migrate: add imageStampId if missing
      for (const b of brushes) {
        if (b.imageStampId === undefined) b.imageStampId = '';
        if (b.imageDataUrl === undefined) b.imageDataUrl = '';
      }
      // Remove old/obsolete image brushes from previous iterations
      const obsoleteIds = new Set(['stamp-leg', 'stamp-arm', 'stamp-head', 'stamp-body', 'tpl-arm', 'tpl-head', 'tpl-body']);
      const filtered = brushes.filter((b) => !obsoleteIds.has(b.id));
      // Check if image template brushes exist, if not add defaults
      const hasImageStamps = filtered.some((b) => b.shape === 'image');
      if (!hasImageStamps) {
        const defaults = getDefaultCustomBrushes();
        const imageStampDefaults = defaults.filter((b) => b.shape === 'image');
        filtered.push(...imageStampDefaults);
      }
      return filtered;
    }
  } catch { /* ignore */ }
  return getDefaultCustomBrushes();
}

function saveCustomBrushes(brushes: CustomBrush[]) {
  try {
    localStorage.setItem(BRUSHES_KEY, JSON.stringify(brushes));
  } catch { /* ignore */ }
}

function createDefaultBrush(): CustomBrush {
  return {
    id: generateId(),
    name: 'New Brush',
    shape: 'circle',
    spacing: 0.15,
    scatter: 0,
    rotation: 'none',
    rotationAngle: 0,
    sizeJitter: 0,
    opacityJitter: 0,
    hardness: 0.8,
    roundness: 1,
    grainOpacity: 0,
    grainScale: 1,
    taperStart: 0.15,
    taperEnd: 0.15,
    pressureSize: true,
    pressureOpacity: false,
    dualBrush: false,
    dualShape: 'circle',
    dualSizeRatio: 0.5,
    imageStampId: '',
    imageDataUrl: '',
  };
}

function getDefaultCustomBrushes(): CustomBrush[] {
  return [
    { ...createDefaultBrush(), id: 'soft-round', name: 'Soft Round', hardness: 0.3, spacing: 0.08 },
    { ...createDefaultBrush(), id: 'hard-round', name: 'Hard Round', hardness: 1, spacing: 0.1 },
    { ...createDefaultBrush(), id: 'flat-brush', name: 'Flat Brush', roundness: 0.3, rotation: 'follow-stroke', spacing: 0.1, hardness: 0.9 },
    { ...createDefaultBrush(), id: 'spray-paint', name: 'Spray Paint', shape: 'scatter-dots', scatter: 0.8, sizeJitter: 0.6, opacityJitter: 0.5, spacing: 0.05, hardness: 1 },
    { ...createDefaultBrush(), id: 'charcoal', name: 'Charcoal', shape: 'square', rotation: 'random', scatter: 0.15, sizeJitter: 0.2, grainOpacity: 0.7, grainScale: 1.5, hardness: 0.5, spacing: 0.08 },
    { ...createDefaultBrush(), id: 'calligraphy', name: 'Calligraphy', roundness: 0.15, rotationAngle: 45, hardness: 1, spacing: 0.05, taperStart: 0.3, taperEnd: 0.4 },
    // Image template brushes (progressive drawing along stroke)
    { ...createDefaultBrush(), id: 'tpl-leg', name: 'Leg', shape: 'image', imageStampId: 'leg', spacing: 0.05, hardness: 1, pressureSize: false, taperStart: 0, taperEnd: 0 },
  ];
}

interface DrawingState {
  brushSettings: BrushSettings;
  brushType: BrushType;
  customBrushes: CustomBrush[];
  activeCustomBrushId: string | null;
  layers: Layer[];
  activeLayerId: string;
  strokes: Stroke[];
  canvasWidth: number;
  canvasHeight: number;

  setBrushSettings: (settings: Partial<BrushSettings>) => void;
  setBrushType: (type: BrushType) => void;
  addCustomBrush: () => string;
  updateCustomBrush: (id: string, updates: Partial<CustomBrush>) => void;
  deleteCustomBrush: (id: string) => void;
  setActiveCustomBrush: (id: string) => void;
  duplicateCustomBrush: (id: string) => string;
  addLayer: () => void;
  addFrameLayer: () => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;
  addStroke: (stroke: Stroke) => void;
  removeStroke: (id: string) => void;
  setCanvasSize: (width: number, height: number) => void;
  initLayers: (width: number, height: number) => void;
}

function createLayer(name: string, width: number, height: number, isFrameByFrame = false): Layer {
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
    isFrameByFrame,
  };
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
  brushSettings: { ...DEFAULT_BRUSH_SETTINGS },
  brushType: 'pen',
  customBrushes: loadCustomBrushes(),
  activeCustomBrushId: null,
  layers: [],
  activeLayerId: '',
  strokes: [],
  canvasWidth: 1920,
  canvasHeight: 1080,

  setBrushSettings: (settings) =>
    set((s) => ({ brushSettings: { ...s.brushSettings, ...settings } })),

  setBrushType: (type) => set({ brushType: type }),

  addCustomBrush: () => {
    const brush = createDefaultBrush();
    set((s) => {
      const newBrushes = [...s.customBrushes, brush];
      saveCustomBrushes(newBrushes);
      return { customBrushes: newBrushes, activeCustomBrushId: brush.id, brushType: 'custom' as BrushType };
    });
    return brush.id;
  },

  updateCustomBrush: (id, updates) =>
    set((s) => {
      const newBrushes = s.customBrushes.map((b) => b.id === id ? { ...b, ...updates } : b);
      saveCustomBrushes(newBrushes);
      return { customBrushes: newBrushes };
    }),

  deleteCustomBrush: (id) =>
    set((s) => {
      const newBrushes = s.customBrushes.filter((b) => b.id !== id);
      saveCustomBrushes(newBrushes);
      return {
        customBrushes: newBrushes,
        activeCustomBrushId: s.activeCustomBrushId === id ? null : s.activeCustomBrushId,
        brushType: s.activeCustomBrushId === id ? 'pen' : s.brushType,
      };
    }),

  setActiveCustomBrush: (id) =>
    set({ activeCustomBrushId: id, brushType: 'custom' as BrushType }),

  duplicateCustomBrush: (id) => {
    const original = get().customBrushes.find((b) => b.id === id);
    if (!original) return '';
    const dup: CustomBrush = { ...original, id: generateId(), name: `${original.name} Copy` };
    set((s) => {
      const newBrushes = [...s.customBrushes, dup];
      saveCustomBrushes(newBrushes);
      return { customBrushes: newBrushes, activeCustomBrushId: dup.id };
    });
    return dup.id;
  },

  addLayer: () =>
    set((s) => {
      const layer = createLayer(`Layer ${s.layers.length + 1}`, s.canvasWidth, s.canvasHeight);
      return {
        layers: [...s.layers, layer],
        activeLayerId: layer.id,
      };
    }),

  addFrameLayer: () =>
    set((s) => {
      const layer = createLayer(`Frame Layer ${s.layers.length + 1}`, s.canvasWidth, s.canvasHeight, true);
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
