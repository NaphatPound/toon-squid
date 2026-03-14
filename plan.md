# Toon Squid — Drawing & Animation Web App

## Overview

**Toon Squid** is a browser-based 2D drawing and animation tool built with **React + TypeScript + Vite**. It combines a canvas-based drawing engine with a bone rigging system for character animation. The app features dynamic brush lines with pressure sensitivity, an image/layer system, and a skeletal animation system with FK/IK bone manipulation.

> **Target**: A polished, premium-feeling web application that runs entirely in the browser.  
> **Tech Stack**: React 19, TypeScript, Vite, Zustand (state management), HTML5 Canvas 2D API  
> **Project Path**: `g:\project\open source\drawing\toon squid`

---

## Phase 1: Project Setup & Core Architecture

### 1.1 Initialize Vite + React + TypeScript Project

```bash
cd "g:\project\open source\drawing\toon squid"
npx -y create-vite@latest ./ --template react-ts
npm install
npm install zustand
```

### 1.2 Project Structure

```
toon-squid/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                    # Entry point
│   ├── App.tsx                     # Root layout with panels
│   ├── App.css                     # Global styles (dark theme, premium feel)
│   ├── index.css                   # Reset + CSS variables
│   │
│   ├── types/
│   │   ├── drawing.ts              # Brush, Stroke, Point, Layer types
│   │   ├── bone.ts                 # Bone, Skeleton, Pose types
│   │   └── project.ts             # Project, Canvas, Export types
│   │
│   ├── store/
│   │   ├── drawingStore.ts         # Zustand store for drawing state
│   │   ├── boneStore.ts            # Zustand store for bone/rig state
│   │   ├── uiStore.ts             # Zustand store for UI state (panels, tools)
│   │   └── historyStore.ts         # Undo/Redo history management
│   │
│   ├── engine/
│   │   ├── canvas/
│   │   │   ├── CanvasEngine.ts     # Main canvas rendering engine
│   │   │   ├── ViewportTransform.ts # Pan, zoom, rotation transforms
│   │   │   └── LayerCompositor.ts  # Layer blending & compositing
│   │   │
│   │   ├── brush/
│   │   │   ├── BrushEngine.ts      # Core brush rendering pipeline
│   │   │   ├── DynamicStroke.ts    # Dynamic brush line with pressure/velocity
│   │   │   ├── StrokeSmoothing.ts  # Catmull-Rom & line smoothing
│   │   │   ├── brushes/
│   │   │   │   ├── PenBrush.ts     # Clean vector-like pen
│   │   │   │   ├── InkBrush.ts     # Dynamic ink with thickness variation
│   │   │   │   ├── PencilBrush.ts  # Textured pencil
│   │   │   │   ├── MarkerBrush.ts  # Flat marker
│   │   │   │   └── EraserBrush.ts  # Eraser tool
│   │   │   └── BrushPresets.ts     # Preset configurations
│   │   │
│   │   └── bone/
│   │       ├── BoneSystem.ts       # Bone creation, hierarchy, FK
│   │       ├── IKSolver.ts         # CCD-based IK solver
│   │       ├── BoneRenderer.ts     # Visual bone rendering (diamond shapes)
│   │       ├── BonePoseManager.ts  # Keyframe poses & interpolation
│   │       └── MeshBinding.ts      # Bind image regions to bones
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # Main layout with resizable panels
│   │   │   ├── Toolbar.tsx         # Top toolbar (file, edit, view)
│   │   │   ├── Sidebar.tsx         # Left sidebar (tools)
│   │   │   └── StatusBar.tsx       # Bottom status bar
│   │   │
│   │   ├── canvas/
│   │   │   ├── CanvasViewport.tsx  # Main canvas viewport component
│   │   │   ├── CanvasOverlay.tsx   # Cursor, guides, selection overlay
│   │   │   └── Minimap.tsx         # Navigation minimap
│   │   │
│   │   ├── tools/
│   │   │   ├── ToolPanel.tsx       # Tool selection panel
│   │   │   ├── BrushSettings.tsx   # Brush size, opacity, flow settings
│   │   │   ├── ColorPicker.tsx     # HSV color picker with palette
│   │   │   └── BoneTools.tsx       # Bone creation & manipulation tools
│   │   │
│   │   ├── layers/
│   │   │   ├── LayerPanel.tsx      # Layer list with thumbnails
│   │   │   ├── LayerItem.tsx       # Individual layer row
│   │   │   └── BlendModeSelect.tsx # Blend mode dropdown
│   │   │
│   │   ├── bones/
│   │   │   ├── BoneTreePanel.tsx   # Bone hierarchy tree view
│   │   │   ├── BoneTreeItem.tsx    # Individual bone node
│   │   │   ├── BoneProperties.tsx  # Bone transform properties
│   │   │   └── PosePanel.tsx       # Pose keyframe management
│   │   │
│   │   ├── timeline/
│   │   │   ├── Timeline.tsx        # Animation timeline bar
│   │   │   ├── KeyframeTrack.tsx   # Per-bone keyframe track
│   │   │   └── PlaybackControls.tsx # Play, pause, speed controls
│   │   │
│   │   └── common/
│   │       ├── Slider.tsx          # Reusable slider component
│   │       ├── NumberInput.tsx     # Number input with drag-to-adjust
│   │       ├── IconButton.tsx     # Icon button component
│   │       ├── DropdownMenu.tsx   # Dropdown menu
│   │       ├── Modal.tsx          # Modal dialog
│   │       └── Tooltip.tsx        # Tooltip component
│   │
│   └── utils/
│       ├── math.ts                # Vec2, Matrix2D, lerp, clamp
│       ├── color.ts               # RGB/HSV/HSL conversion
│       ├── geometry.ts            # Line intersection, distance, bezier
│       ├── export.ts              # PNG/PSD export
│       └── input.ts               # Pointer event normalization
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
└── plan.md
```

---

## Phase 2: Core Drawing Engine

### 2.1 Types (`src/types/drawing.ts`)

```typescript
export interface Point {
  x: number;
  y: number;
  pressure: number;  // 0-1, from pen tablet or simulated
  timestamp: number;
}

export interface BrushSettings {
  size: number;          // 1-200px
  opacity: number;       // 0-1
  flow: number;          // 0-1 (paint density per stamp)
  spacing: number;       // 0.05-2.0 (as fraction of brush size)
  smoothing: number;     // 0-1 (stroke stabilization strength)
  pressureSize: boolean; // pressure affects size
  pressureOpacity: boolean; // pressure affects opacity
  hardness: number;      // 0-1 (soft vs hard edge)
  color: string;         // hex color
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
  opacity: number;         // 0-1
  blendMode: BlendMode;
  canvas: OffscreenCanvas; // Each layer has its own offscreen canvas
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';
```

### 2.2 Dynamic Brush Line Engine (`src/engine/brush/DynamicStroke.ts`)

This is the **core feature** — the dynamic brush line that produces natural, pressure-sensitive strokes.

**Algorithm:**
1. **Input Pipeline**: Collect pointer events → normalize pressure (mouse = simulated velocity-based pressure) → feed into smoothing filter
2. **Stroke Smoothing** (`StrokeSmoothing.ts`): Use **Catmull-Rom spline interpolation** between input points, then apply a **moving average filter** (configurable window size based on `smoothing` setting)
3. **Dynamic Width Calculation**: At each interpolated point:
   - Base width = `brushSize * pressure` (if pressure-size enabled)
   - Add velocity-based thinning: faster strokes = thinner lines (like real ink)
   - Apply **smoothed width transition** to avoid abrupt width changes
4. **Stamp-Based Rendering**: Walk along the smoothed path at `spacing` intervals:
   - At each stamp position, draw a circle/shape with computed width and opacity
   - For `pen` brush: use `ctx.arc()` with `hardness` controlling gaussian falloff
   - For `ink` brush: connect stamps with quadratic bezier fills between left/right edges
   - For `pencil` brush: add grain texture via noise-modulated alpha
5. **Tapered Ends**: First and last N stamps have reduced size for natural start/end tapering

**Key Implementation Details:**
- Use `PointerEvent` API with `getCoalescedEvents()` for high-resolution pen input
- Simulate pressure from mouse using velocity: `pressure = 1.0 - clamp(velocity / maxVelocity, 0, 0.7)`
- Render strokes to per-layer `OffscreenCanvas` for non-destructive editing
- Use `requestAnimationFrame` for smooth real-time rendering

### 2.3 Canvas Viewport (`src/components/canvas/CanvasViewport.tsx`)

- **Dual-canvas architecture**:
  - Bottom canvas: composited layers (rendered by `LayerCompositor`)
  - Top canvas: current stroke preview + cursor + bone overlay
- **Viewport Transform**: Pan (middle-click/Space+drag), Zoom (scroll wheel toward cursor), supports `ViewportTransform.ts` class
- **Coordinate systems**: Screen → Canvas → Document space conversions
- **Cursor**: Custom canvas cursor showing brush size with dynamic preview

### 2.4 Layer System (`src/engine/canvas/LayerCompositor.ts`)

- Each layer is an `OffscreenCanvas`
- Composite all visible layers using `globalCompositeOperation` for blend modes
- Layer thumbnails: render 48px previews on demand
- Max 32 layers per project

---

## Phase 3: Bone Rigging System

### 3.1 Types (`src/types/bone.ts`)

```typescript
export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  // Position relative to parent (local space)
  localX: number;
  localY: number;
  localRotation: number;  // radians
  localScaleX: number;
  localScaleY: number;
  // Computed world-space transforms
  worldX: number;
  worldY: number;
  worldRotation: number;
  // Bone length (distance to tail)
  length: number;
  // Optional: bound image region
  boundImageId: string | null;
  // Display
  color: string;
  visible: boolean;
}

export interface Skeleton {
  id: string;
  name: string;
  bones: Bone[];
  rootBoneId: string;
}

export interface Pose {
  id: string;
  name: string;
  time: number;  // keyframe time in seconds
  boneTransforms: Map<string, {
    rotation: number;
    scaleX: number;
    scaleY: number;
    translateX: number;
    translateY: number;
  }>;
}

export interface Animation {
  id: string;
  name: string;
  duration: number;    // seconds
  fps: number;         // 12, 24, 30, 60
  poses: Pose[];       // keyframes
  loop: boolean;
}
```

### 3.2 Bone System (`src/engine/bone/BoneSystem.ts`)

**Core Features:**
- **Bone Creation**: Click to place root bone, drag to set length/angle. Click existing bone tip to create child bone
- **Hierarchy**: Tree structure with parent-child relationships. Children inherit parent transforms (FK)
- **Forward Kinematics**: When parent bone rotates, all children follow. Use matrix multiplication chain:
  ```
  WorldTransform = Parent.WorldTransform × Local.Transform
  ```
- **World Transform Computation**: Traverse bone tree from root, computing cumulative transforms
- **Bone Selection**: Click on bones to select, show transform gizmo

### 3.3 IK Solver (`src/engine/bone/IKSolver.ts`)

**CCD (Cyclic Coordinate Descent) IK Algorithm:**
1. For a chain of bones (e.g., shoulder → elbow → wrist):
2. Starting from the end effector's parent, working back to the chain root:
   a. Calculate angle from current bone's world position to target
   b. Calculate angle from current bone's world position to end effector
   c. Rotate current bone by the difference
3. Repeat for N iterations (10-20) or until end effector is close enough to target
4. Apply angle constraints per bone (optional min/max rotation limits)

### 3.4 Bone Renderer (`src/engine/bone/BoneRenderer.ts`)

- Draw bones as **diamond/kite shapes** (4-point polygon: joint → left edge → tip → right edge)
- Width proportional to bone length (typically 20% of length)
- Color-coded: selected = cyan, hovered = yellow, default = white semi-transparent
- Draw joint circles at bone origins
- Draw IK target handles as crosshairs

### 3.5 Mesh Binding (`src/engine/bone/MeshBinding.ts`)

- **Image-to-Bone Binding**: Assign image layers/regions to specific bones
- When bone transforms, the bound image transforms with it (rotation + translation around bone origin)
- Support for basic mesh deformation: define a quad mesh over the image, deform vertices based on nearest bone weights
- **Bone weights**: Simple automatic weight assignment based on distance from bone

---

## Phase 4: UI Components & Layout

### 4.1 App Layout (`src/components/layout/AppLayout.tsx`)

```
┌──────────────────────────────────────────────────────┐
│  Toolbar (File, Edit, View, Help)            [Mode]  │
├────────┬───────────────────────────────┬─────────────┤
│        │                               │  Properties │
│  Tool  │                               │  - Brush    │
│  Panel │     Canvas Viewport           │  - Bone     │
│        │     (main drawing area)       │  - Layer    │
│  Brush │                               │             │
│  Color │                               │  Bone Tree  │
│        │                               │             │
├────────┼───────────────────────────────┤             │
│        │  Timeline (animation)          │             │
└────────┴───────────────────────────────┴─────────────┘
│  Status Bar (cursor pos, zoom, frame)                │
└──────────────────────────────────────────────────────┘
```

### 4.2 Design System

- **Theme**: Dark mode by default, glassmorphism panels
- **Colors**:
  - Background: `#0d1117` (deep dark)
  - Panel BG: `rgba(22, 27, 34, 0.85)` with `backdrop-filter: blur(12px)`
  - Accent: `#58a6ff` (blue), `#7c3aed` (purple), `#10b981` (green)
  - Text: `#e6edf3` (primary), `#8b949e` (secondary)
  - Selection: `#388bfd33`
- **Typography**: Google Font `Inter` for UI, monospace for numbers
- **Borders**: `1px solid rgba(255, 255, 255, 0.08)`
- **Animations**: All panels and tools have `transition: 0.2s ease`, hover scales, glow effects
- **Icons**: Use inline SVG icons or a small icon set (Lucide icons via copy-paste SVG)

### 4.3 Key Components

1. **ToolPanel**: Vertical icon bar — Select, Pen, Ink, Pencil, Marker, Eraser, Bone, IK, Pan, Zoom
2. **BrushSettings**: Size slider (1-200), Opacity slider (0-100%), Flow, Smoothing, Pressure toggles
3. **ColorPicker**: HSV wheel + lightness bar, recent colors, hex input
4. **LayerPanel**: Draggable layer list, visibility toggle, lock, opacity, blend mode
5. **BoneTreePanel**: Collapsible tree view of bone hierarchy, drag to reparent
6. **Timeline**: Horizontal track, scrubber, keyframe diamonds, play/pause

---

## Phase 5: Animation System

### 5.1 Timeline Component (`src/components/timeline/Timeline.tsx`)

- Horizontal scrollable timeline with frame markers
- Each bone has a track row showing keyframe diamonds
- Scrubber (playhead) can be dragged
- Keyframe operations: add (at current frame), delete, copy, paste

### 5.2 Pose Interpolation (`src/engine/bone/BonePoseManager.ts`)

- **Linear interpolation** for translation and scale
- **SLERP-like angle interpolation** for rotation (shortest path)
- Easing curves: linear, ease-in, ease-out, ease-in-out (cubic bezier)
- Onion skinning: ghost previous/next poses at reduced opacity

### 5.3 Playback (`src/components/timeline/PlaybackControls.tsx`)

- Play, pause, stop, loop toggle
- FPS selector: 12, 24, 30, 60
- Frame-by-frame stepping (← →)
- Export as sprite sheet (PNG grid) or GIF (using gifjs or similar)

---

## Phase 6: Export & File System

### 6.1 Project Save/Load

- Save as JSON: all layer data (base64 canvas), bone hierarchy, keyframes
- IndexedDB for auto-save / crash recovery
- Export project as `.tsquid` (JSON + embedded images)

### 6.2 Image Export

- Export current frame as **PNG** (transparent or with background)
- Export animation as **sprite sheet** (grid layout)
- Export animation as **GIF** (using a web worker for encoding)

---

## Implementation Order for Claude Code

Execute these steps IN ORDER. Each step should be a complete, testable unit.

### Step 1: Project Init
```bash
cd "g:\project\open source\drawing\toon squid"
npx -y create-vite@latest ./ --template react-ts
npm install
npm install zustand
```

### Step 2: Design System & Layout
Create `index.css` with CSS variables, dark theme, glassmorphism tokens.
Create `App.css` with layout grid.
Create `AppLayout.tsx` with the 4-panel layout (toolbar, sidebar, canvas area, properties).
Create common components: `Slider.tsx`, `NumberInput.tsx`, `IconButton.tsx`, `Tooltip.tsx`.

### Step 3: Math & Utility Foundation
Create `src/utils/math.ts` (Vec2 class, Matrix2D, lerp, clamp, distance, angle functions).
Create `src/utils/color.ts` (RGB↔HSV↔HSL conversion).
Create `src/utils/geometry.ts` (line-line intersection, point-to-line distance, bezier evaluation).
Create `src/utils/input.ts` (pointer event normalization, pressure simulation from mouse).

### Step 4: Canvas Viewport
Create `ViewportTransform.ts` (pan, zoom, screen↔document coordinate conversion).
Create `CanvasViewport.tsx` with dual-canvas architecture (layer canvas + overlay canvas).
Implement pan (middle-click/Space+drag), zoom (scroll wheel toward cursor).
Create `CanvasOverlay.tsx` for cursor rendering.

### Step 5: Drawing Store & Layer System
Create `src/types/drawing.ts` with all drawing types.
Create `drawingStore.ts` (Zustand) with brush settings, strokes, layers, active layer.
Create `LayerCompositor.ts` with OffscreenCanvas per layer, blend mode compositing.
Create `LayerPanel.tsx` and `LayerItem.tsx` components.

### Step 6: Brush Engine
Create `BrushEngine.ts` (stamp-based rendering pipeline).
Create `DynamicStroke.ts` (pressure+velocity dynamic width, tapered ends).
Create `StrokeSmoothing.ts` (Catmull-Rom interpolation + moving average).
Implement brush types: `PenBrush.ts`, `InkBrush.ts`, `PencilBrush.ts`, `MarkerBrush.ts`, `EraserBrush.ts`.
Create `BrushSettings.tsx` UI panel.

### Step 7: Enhanced Tools
Create `ColorPicker.tsx` (HSV wheel, recent colors, hex input).
Create `ToolPanel.tsx` (tool selection with icons).
Implement `Toolbar.tsx` (File/Edit/View menus).
Create `StatusBar.tsx` (cursor position, zoom level, active tool).

### Step 8: Bone System
Create `src/types/bone.ts` with bone/skeleton/pose types.
Create `boneStore.ts` (Zustand) with bone hierarchy management.
Create `BoneSystem.ts` (create, delete, reparent bones, FK transform computation).
Create `BoneRenderer.ts` (diamond shape rendering on overlay canvas).
Create `BoneTreePanel.tsx` and `BoneTreeItem.tsx` (hierarchy view).
Create `BoneProperties.tsx` (transform editor).
Create `BoneTools.tsx` (bone creation/selection tools).

### Step 9: IK & Mesh Binding
Create `IKSolver.ts` (CCD IK algorithm with angle constraints).
Create `MeshBinding.ts` (bind images to bones, weight painting, deformation).
Add IK mode to bone tools (click+drag bone end → IK solve).

### Step 10: Animation Timeline
Create `src/types/project.ts` with animation types.
Create `BonePoseManager.ts` (keyframe storage, interpolation, easing).
Create `Timeline.tsx`, `KeyframeTrack.tsx`, `PlaybackControls.tsx`.
Implement onion skinning for animation preview.

### Step 11: Undo/Redo & History
Create `historyStore.ts` with action-based undo/redo (max 50 steps).
Integrate history with drawing (stroke add/remove) and bone (transform changes) actions.

### Step 12: Export & Polish
Create `export.ts` (PNG export, sprite sheet export).
Implement project save/load (JSON to IndexedDB).
Add keyboard shortcuts (B=brush, E=eraser, Space=pan, Ctrl+Z=undo, etc.).
Polish animations, transitions, loading states.

---

## Design Reference Notes

### From klecks (sister project)
- Brush architecture: 7 brush types with alpha textures and pressure
- Input pipeline: `CoalescedExploder → PinchZoomer → DoubleTapper → OnePointerLimiter`
- History: tile-based 256px undo/redo with 1GB memory cap
- Layer blend modes: 16 modes via `globalCompositeOperation`

### From PixelBasher (sister project)
- **Zustand store pattern**: Single store with actions, history push before mutations
- **Canvas viewport pattern**: `screenToDoc()` / `docToScreen()` coordinate conversion
- **Selection system**: Hit-test → selection state → visual feedback loop
- **Tool modes**: Enum-based tool switching with cursor changes

### From VRM Bone Rigging KI
- Bone hierarchy with parent-child FK chain
- CCD IK solver with angle constraints
- Bone space conventions and transform propagation
- Mirroring logic for symmetrical rigs

---

## Verification Plan

### Run Dev Server
```bash
cd "g:\project\open source\drawing\toon squid"
npm run dev
```

### Manual Testing Checklist
1. **Drawing**: Open browser → select Pen tool → draw on canvas → verify smooth dynamic lines with tapering
2. **Pressure**: Use pen tablet (or verify mouse velocity simulation) → strokes should vary in width
3. **Layers**: Add/remove layers → toggle visibility → change blend modes → verify compositing
4. **Viewport**: Pan (middle-click), Zoom (scroll) → verify smooth navigation
5. **Bones**: Switch to Bone tool → click to create bones → verify parent-child hierarchy
6. **FK**: Rotate parent bone → verify children follow
7. **IK**: Enable IK → drag end effector → verify chain solves
8. **Timeline**: Add keyframes → scrub timeline → verify pose interpolation
9. **Export**: Export PNG → verify correct output
10. **Undo/Redo**: Draw strokes, add bones → Ctrl+Z/Ctrl+Y → verify proper undo/redo
