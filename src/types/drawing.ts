export interface Point {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface BrushSettings {
  size: number;
  opacity: number;
  flow: number;
  spacing: number;
  smoothing: number;
  pressureSize: boolean;
  pressureOpacity: boolean;
  hardness: number;
  color: string;
}

export interface Stroke {
  id: string;
  points: Point[];
  brushType: BrushType;
  brushSettings: BrushSettings;
  layerId: string;
}

export type BrushType = 'pen' | 'ink' | 'pencil' | 'marker' | 'eraser';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  canvas: OffscreenCanvas | null;
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  size: 8,
  opacity: 1,
  flow: 1,
  spacing: 0.15,
  smoothing: 0.5,
  pressureSize: true,
  pressureOpacity: false,
  hardness: 0.8,
  color: '#e6edf3',
};
