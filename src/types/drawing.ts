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

export type BrushType = 'pen' | 'ink' | 'pencil' | 'marker' | 'eraser' | 'custom';

/** Shape source for custom brush stamps */
export type StampShape = 'circle' | 'square' | 'diamond' | 'star' | 'scatter-dots' | 'image';

/** Custom brush definition (Procreate-like) */
export interface CustomBrush {
  id: string;
  name: string;
  /** Stamp shape */
  shape: StampShape;
  /** Stamp spacing (0.01 - 2.0, fraction of brush size) */
  spacing: number;
  /** Scatter amount (0 = none, 1 = max) */
  scatter: number;
  /** Rotation mode */
  rotation: 'none' | 'follow-stroke' | 'random';
  /** Rotation angle offset in degrees (for 'none' mode) */
  rotationAngle: number;
  /** Size jitter (0-1, random size variation) */
  sizeJitter: number;
  /** Opacity jitter (0-1, random opacity variation) */
  opacityJitter: number;
  /** Hardness/edge softness (0 = soft, 1 = hard) */
  hardness: number;
  /** Roundness (1 = circle, 0.1 = flat ellipse) */
  roundness: number;
  /** Grain/texture opacity (0 = no grain, 1 = full grain) */
  grainOpacity: number;
  /** Grain scale */
  grainScale: number;
  /** Taper at start (0-1) */
  taperStart: number;
  /** Taper at end (0-1) */
  taperEnd: number;
  /** Pressure affects size */
  pressureSize: boolean;
  /** Pressure affects opacity */
  pressureOpacity: boolean;
  /** Dual brush: blend two stamps */
  dualBrush: boolean;
  /** Dual brush shape */
  dualShape: StampShape;
  /** Dual brush size ratio */
  dualSizeRatio: number;
  /** Image stamp id (for shape === 'image', built-in templates) */
  imageStampId: string;
  /** User-uploaded image as data URL (for shape === 'image') */
  imageDataUrl: string;
}

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
