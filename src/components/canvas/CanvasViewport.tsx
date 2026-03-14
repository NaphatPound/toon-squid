import { useRef, useEffect, useCallback } from 'react';
import { CanvasEngine } from '../../engine/canvas/CanvasEngine';
import { BrushEngine } from '../../engine/brush/BrushEngine';
import { useDrawingStore } from '../../store/drawingStore';
import { useUIStore } from '../../store/uiStore';
import { useBoneStore } from '../../store/boneStore';
import { normalizePointerEvent, getCoalescedPoints, resetInputState } from '../../utils/input';
import { generateId, Matrix2D, Vec2 } from '../../utils/math';
import { renderCursorOverlay } from './CanvasOverlay';
import { computeWorldTransforms, hitTestBone, hitTestBoneJoint, hitTestBoneTip, getBoneTip } from '../../engine/bone/BoneSystem';
import { getPoseAtTime, applyPose } from '../../engine/bone/BonePoseManager';
import type { Point } from '../../types/drawing';
import type { Bone } from '../../types/bone';

const BRUSH_TOOLS = new Set<string>(['pen', 'ink', 'pencil', 'marker', 'eraser']);
const BONE_HIT_THRESHOLD = 14;
const MIN_BONE_LENGTH = 5;

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: '#1a1a1a',
  cursor: 'none',
};

const canvasBaseStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
};

type InteractionMode = 'none' | 'pan' | 'draw' | 'bone-create' | 'bone-move' | 'bone-rotate' | 'bone-resize';

function CanvasViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const engineRef = useRef<CanvasEngine | null>(null);
  const brushEngineRef = useRef<BrushEngine | null>(null);

  const spaceHeldRef = useRef(false);
  const lastCursorRef = useRef({ x: 0, y: 0 });

  // Unified interaction state
  const modeRef = useRef<InteractionMode>('none');
  const panStartRef = useRef({ x: 0, y: 0 });

  // Bone interaction state
  const dragBoneIdRef = useRef<string | null>(null);
  const boneStartDocRef = useRef({ x: 0, y: 0 });
  const boneOrigRef = useRef({ localX: 0, localY: 0, localRotation: 0 });
  // For bone creation: start position in doc coords and parent info
  const boneCreateStartRef = useRef({ x: 0, y: 0 });
  const boneCreateParentIdRef = useRef<string | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const layerCanvas = layerCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!layerCanvas || !overlayCanvas || !container) return;

    const engine = new CanvasEngine();
    const brushEngine = new BrushEngine();
    engineRef.current = engine;
    brushEngineRef.current = brushEngine;

    const rect = container.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    engine.init(layerCanvas, overlayCanvas);
    engine.resize(w, h);
    brushEngine.setPreviewContext(engine.overlay!);

    const { canvasWidth, canvasHeight, initLayers, layers } = useDrawingStore.getState();
    if (layers.length === 0) {
      initLayers(canvasWidth, canvasHeight);
    }
    engine.viewport.fitToCanvas(canvasWidth, canvasHeight, w, h);
    useUIStore.getState().setZoomLevel(engine.viewport.zoom);

    engine.startRenderLoop(
      () => useDrawingStore.getState().layers,
      () => {
        const { skeleton, selectedBoneId, hoveredBoneId, bindings, animations, activeAnimationId, currentTime, isPlaying } = useBoneStore.getState();
        const { appMode } = useUIStore.getState();

        let bones = skeleton?.bones ?? [];

        // Apply animation pose in animate mode (or while playing)
        if (bones.length > 0 && activeAnimationId) {
          const anim = animations.find((a) => a.id === activeAnimationId);
          if (anim && anim.poses.length > 0) {
            const transforms = getPoseAtTime(anim, currentTime);
            bones = applyPose(bones, transforms);
          }
        }

        return {
          bones,
          selectedId: selectedBoneId,
          hoveredId: hoveredBoneId,
          appMode,
          bindings,
        };
      },
      () => {
        const { canvasWidth, canvasHeight } = useDrawingStore.getState();
        return { width: canvasWidth, height: canvasHeight };
      }
    );

    return () => {
      engine.destroy();
      engineRef.current = null;
      brushEngineRef.current = null;
    };
  }, []);

  // --- ResizeObserver ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const engine = engineRef.current;
      if (!engine) return;
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const w = Math.floor(width);
      const h = Math.floor(height);
      if (w <= 0 || h <= 0) return;

      engine.resize(w, h);
      const { canvasWidth, canvasHeight } = useDrawingStore.getState();
      engine.viewport.fitToCanvas(canvasWidth, canvasHeight, w, h);
      useUIStore.getState().setZoomLevel(engine.viewport.zoom);
      engine.invalidate();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // --- Invalidate on store changes ---
  useEffect(() => {
    const unsubDrawing = useDrawingStore.subscribe(() => {
      engineRef.current?.invalidate();
    });
    const unsubBone = useBoneStore.subscribe(() => {
      engineRef.current?.invalidate();
    });
    const unsubUI = useUIStore.subscribe(
      (state) => state.appMode,
      () => { engineRef.current?.invalidate(); }
    );
    return () => { unsubDrawing(); unsubBone(); unsubUI(); };
  }, []);

  // --- Animation playback loop ---
  useEffect(() => {
    let animFrameId = 0;
    let lastTimestamp = 0;

    const tick = (timestamp: number) => {
      const { isPlaying, currentTime, animations, activeAnimationId, setCurrentTime } = useBoneStore.getState();
      if (!isPlaying) {
        lastTimestamp = 0;
        animFrameId = requestAnimationFrame(tick);
        return;
      }

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
        animFrameId = requestAnimationFrame(tick);
        return;
      }

      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const anim = animations.find((a) => a.id === activeAnimationId);
      if (anim) {
        let newTime = currentTime + dt;
        if (anim.loop) {
          newTime = newTime % anim.duration;
        } else if (newTime >= anim.duration) {
          newTime = anim.duration;
          useBoneStore.getState().setIsPlaying(false);
        }
        setCurrentTime(newTime);
        engineRef.current?.invalidate();
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // --- Space key for pan ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceHeldRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // --- Helpers ---
  const getActiveLayerCtx = useCallback((): CanvasRenderingContext2D | null => {
    const { layers, activeLayerId } = useDrawingStore.getState();
    const layer = layers.find((l) => l.id === activeLayerId);
    if (!layer || !layer.canvas || layer.locked) return null;
    return layer.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  }, []);

  const screenToDoc = useCallback((screenX: number, screenY: number) => {
    const engine = engineRef.current;
    const container = containerRef.current;
    if (!engine || !container) return { x: screenX, y: screenY };
    const rect = container.getBoundingClientRect();
    return engine.viewport.screenToDoc(screenX - rect.left, screenY - rect.top);
  }, []);

  const shouldPan = useCallback((e: PointerEvent): boolean => {
    const tool = useUIStore.getState().activeTool;
    if (e.button === 1 || e.buttons === 4) return true;
    if (spaceHeldRef.current) return true;
    if (tool === 'pan') return true;
    return false;
  }, []);

  const getWorldBones = useCallback((): Bone[] => {
    const { skeleton } = useBoneStore.getState();
    if (!skeleton || skeleton.bones.length === 0) return [];
    return computeWorldTransforms(skeleton.bones);
  }, []);

  const drawCursor = useCallback((screenX: number, screenY: number) => {
    const engine = engineRef.current;
    if (!engine || !engine.overlay) return;
    engine.clearOverlay();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const { brushSettings } = useDrawingStore.getState();
    const tool = useUIStore.getState().activeTool;
    renderCursorOverlay(engine.overlay, screenX - rect.left, screenY - rect.top, brushSettings.size, engine.viewport.zoom, tool);
  }, []);

  // Draw bone creation preview on overlay
  const drawBonePreview = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const engine = engineRef.current;
    if (!engine || !engine.overlay) return;
    engine.clearOverlay();

    const ctx = engine.overlay;
    ctx.save();
    const m = engine.viewport.matrix;
    ctx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);

    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > MIN_BONE_LENGTH) {
      const halfWidth = len * 0.2;
      const perpX = (-dy / len) * halfWidth;
      const perpY = (dx / len) * halfWidth;
      const midFraction = 0.25;
      const midX = startX + dx * midFraction;
      const midY = startY + dy * midFraction;

      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(midX + perpX, midY + perpY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(midX - perpX, midY - perpY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(100, 160, 255, 0.3)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(100, 160, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Joint circle at start
      ctx.beginPath();
      ctx.arc(startX, startY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 160, 255, 0.6)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tip circle
      ctx.beginPath();
      ctx.arc(endX, endY, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 160, 255, 0.6)';
      ctx.fill();
    } else {
      // Just show a dot at start
      ctx.beginPath();
      ctx.arc(startX, startY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100, 160, 255, 0.4)';
      ctx.fill();
    }

    ctx.restore();
  }, []);

  // --- Pointer Down ---
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    const brushEngine = brushEngineRef.current;
    if (!engine || !brushEngine) return;

    const nativeEvent = e.nativeEvent;
    const capture = () => (e.target as HTMLCanvasElement).setPointerCapture(nativeEvent.pointerId);

    // Pan mode
    if (shouldPan(nativeEvent)) {
      modeRef.current = 'pan';
      panStartRef.current = { x: nativeEvent.clientX, y: nativeEvent.clientY };
      capture();
      return;
    }

    const tool = useUIStore.getState().activeTool;
    const appMode = useUIStore.getState().appMode;
    const docPt = screenToDoc(nativeEvent.clientX, nativeEvent.clientY);

    // --- Brush tools ---
    if (BRUSH_TOOLS.has(tool)) {
      modeRef.current = 'draw';
      resetInputState();
      const point = normalizePointerEvent(nativeEvent);
      const dp = screenToDoc(point.x, point.y);
      brushEngine.beginStroke({ x: dp.x, y: dp.y, pressure: point.pressure, timestamp: point.timestamp });
      capture();

      const { brushType, brushSettings } = useDrawingStore.getState();
      engine.clearOverlay();
      const overlayCtx = engine.overlay;
      if (overlayCtx) {
        overlayCtx.save();
        const m = engine.viewport.matrix;
        overlayCtx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
        brushEngine.renderPreview(brushType, brushSettings);
        overlayCtx.restore();
      }
      return;
    }

    // --- Bone tool in rig or animate mode ---
    if (tool === 'bone' && (appMode === 'rig' || appMode === 'animate')) {
      const boneStore = useBoneStore.getState();
      const worldBones = getWorldBones();
      const hitThreshold = BONE_HIT_THRESHOLD / engine.viewport.zoom;

      // 1. Hit test joint → move
      const jointHit = hitTestBoneJoint(worldBones, docPt.x, docPt.y, hitThreshold);
      if (jointHit) {
        modeRef.current = 'bone-move';
        dragBoneIdRef.current = jointHit.id;
        boneStartDocRef.current = { x: docPt.x, y: docPt.y };
        boneStore.selectBone(jointHit.id);
        const raw = boneStore.getBone(jointHit.id);
        if (raw) boneOrigRef.current = { localX: raw.localX, localY: raw.localY, localRotation: raw.localRotation };
        capture();
        engine.invalidate();
        return;
      }

      // 2. Hit test tip → resize (change length + rotation)
      const tipHit = hitTestBoneTip(worldBones, docPt.x, docPt.y, hitThreshold);
      if (tipHit) {
        modeRef.current = 'bone-resize';
        dragBoneIdRef.current = tipHit.id;
        boneStartDocRef.current = { x: docPt.x, y: docPt.y };
        boneStore.selectBone(tipHit.id);
        const raw = boneStore.getBone(tipHit.id);
        if (raw) boneOrigRef.current = { localX: raw.localX, localY: raw.localY, localRotation: raw.localRotation };
        capture();
        engine.invalidate();
        return;
      }

      // 3. Hit test body → rotate
      const bodyHit = hitTestBone(worldBones, docPt.x, docPt.y, hitThreshold);
      if (bodyHit) {
        modeRef.current = 'bone-rotate';
        dragBoneIdRef.current = bodyHit.id;
        boneStartDocRef.current = { x: docPt.x, y: docPt.y };
        boneStore.selectBone(bodyHit.id);
        const raw = boneStore.getBone(bodyHit.id);
        if (raw) boneOrigRef.current = { localX: raw.localX, localY: raw.localY, localRotation: raw.localRotation };
        capture();
        engine.invalidate();
        return;
      }

      // 3. No hit → start bone creation (click-and-drag) — only in rig mode
      if (appMode === 'animate') {
        // In animate mode, clicking empty space deselects
        boneStore.selectBone(null);
        return;
      }
      if (!boneStore.skeleton) {
        boneStore.createSkeleton('Skeleton');
      }
      modeRef.current = 'bone-create';
      boneCreateParentIdRef.current = boneStore.selectedBoneId;

      // For child bone, start at parent's tip
      if (boneStore.selectedBoneId) {
        const parentWorld = worldBones.find((b) => b.id === boneStore.selectedBoneId);
        if (parentWorld) {
          const tip = getBoneTip(parentWorld);
          boneCreateStartRef.current = { x: tip.x, y: tip.y };
        } else {
          boneCreateStartRef.current = { x: docPt.x, y: docPt.y };
        }
      } else {
        // Root bone starts at click position
        boneCreateStartRef.current = { x: docPt.x, y: docPt.y };
      }

      capture();
      drawBonePreview(boneCreateStartRef.current.x, boneCreateStartRef.current.y, docPt.x, docPt.y);
      return;
    }

    // --- Select tool ---
    if (tool === 'select') {
      useUIStore.getState().setCursorPosition(docPt.x, docPt.y);
    }
  }, [shouldPan, screenToDoc, getWorldBones, drawBonePreview]);

  // --- Pointer Move ---
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    const brushEngine = brushEngineRef.current;
    const nativeEvent = e.nativeEvent;

    lastCursorRef.current = { x: nativeEvent.clientX, y: nativeEvent.clientY };
    const docPt = screenToDoc(nativeEvent.clientX, nativeEvent.clientY);
    useUIStore.getState().setCursorPosition(Math.round(docPt.x), Math.round(docPt.y));

    if (!engine || !brushEngine) return;

    const mode = modeRef.current;

    // --- Pan ---
    if (mode === 'pan') {
      const dx = nativeEvent.clientX - panStartRef.current.x;
      const dy = nativeEvent.clientY - panStartRef.current.y;
      engine.viewport.pan(dx, dy);
      panStartRef.current = { x: nativeEvent.clientX, y: nativeEvent.clientY };
      useUIStore.getState().setZoomLevel(engine.viewport.zoom);
      engine.invalidate();
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
      return;
    }

    // --- Bone creation preview ---
    if (mode === 'bone-create') {
      drawBonePreview(boneCreateStartRef.current.x, boneCreateStartRef.current.y, docPt.x, docPt.y);
      return;
    }

    // --- Bone move ---
    if (mode === 'bone-move' && dragBoneIdRef.current) {
      const boneStore = useBoneStore.getState();
      const boneId = dragBoneIdRef.current;
      const rawBone = boneStore.getBone(boneId);
      if (!rawBone) return;

      const dx = docPt.x - boneStartDocRef.current.x;
      const dy = docPt.y - boneStartDocRef.current.y;

      if (rawBone.parentId) {
        // Convert world delta to parent local space
        const worldBones = getWorldBones();
        const parentWorld = worldBones.find((b) => b.id === rawBone.parentId);
        if (parentWorld) {
          const parentMatrix = Matrix2D.translation(parentWorld.worldX, parentWorld.worldY)
            .multiply(Matrix2D.rotation(parentWorld.worldRotation));
          const inv = parentMatrix.invert();
          const localDx = inv.a * dx + inv.c * dy;
          const localDy = inv.b * dx + inv.d * dy;
          boneStore.updateBone(boneId, {
            localX: boneOrigRef.current.localX + localDx,
            localY: boneOrigRef.current.localY + localDy,
          });
        }
      } else {
        boneStore.updateBone(boneId, {
          localX: boneOrigRef.current.localX + dx,
          localY: boneOrigRef.current.localY + dy,
        });
      }
      engine.invalidate();
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
      return;
    }

    // --- Bone rotate ---
    if (mode === 'bone-rotate' && dragBoneIdRef.current) {
      const boneStore = useBoneStore.getState();
      const boneId = dragBoneIdRef.current;
      const rawBone = boneStore.getBone(boneId);
      if (!rawBone) return;

      const worldBones = getWorldBones();
      const worldBone = worldBones.find((b) => b.id === boneId);
      if (!worldBone) return;

      const worldAngle = Math.atan2(docPt.y - worldBone.worldY, docPt.x - worldBone.worldX);

      if (rawBone.parentId) {
        const parentWorld = worldBones.find((b) => b.id === rawBone.parentId);
        boneStore.updateBone(boneId, {
          localRotation: worldAngle - (parentWorld?.worldRotation ?? 0),
        });
      } else {
        boneStore.updateBone(boneId, { localRotation: worldAngle });
      }
      engine.invalidate();
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
      return;
    }

    // --- Bone resize (drag tip to change length + rotation) ---
    if (mode === 'bone-resize' && dragBoneIdRef.current) {
      const boneStore = useBoneStore.getState();
      const boneId = dragBoneIdRef.current;
      const rawBone = boneStore.getBone(boneId);
      if (!rawBone) return;

      const worldBones = getWorldBones();
      const worldBone = worldBones.find((b) => b.id === boneId);
      if (!worldBone) return;

      // Distance from joint to cursor = new length
      const dx = docPt.x - worldBone.worldX;
      const dy = docPt.y - worldBone.worldY;
      const newLength = Math.max(MIN_BONE_LENGTH, Math.sqrt(dx * dx + dy * dy));
      const worldAngle = Math.atan2(dy, dx);

      const updates: Partial<Bone> = { length: newLength };
      if (rawBone.parentId) {
        const parentWorld = worldBones.find((b) => b.id === rawBone.parentId);
        updates.localRotation = worldAngle - (parentWorld?.worldRotation ?? 0);
      } else {
        updates.localRotation = worldAngle;
      }

      boneStore.updateBone(boneId, updates);
      engine.invalidate();
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
      return;
    }

    // --- Brush drawing ---
    if (mode === 'draw' && brushEngine.getIsDrawing()) {
      const coalescedPoints = getCoalescedPoints(nativeEvent);
      for (const point of coalescedPoints) {
        const dp = screenToDoc(point.x, point.y);
        brushEngine.addPoint({ x: dp.x, y: dp.y, pressure: point.pressure, timestamp: point.timestamp });
      }

      const { brushType, brushSettings } = useDrawingStore.getState();
      engine.clearOverlay();
      const overlayCtx = engine.overlay;
      if (overlayCtx) {
        overlayCtx.save();
        const m = engine.viewport.matrix;
        overlayCtx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);
        brushEngine.renderPreview(brushType, brushSettings);
        overlayCtx.restore();
      }
      return;
    }

    // --- Idle: bone hover detection ---
    const appMode = useUIStore.getState().appMode;
    const tool = useUIStore.getState().activeTool;
    if ((appMode === 'rig' || appMode === 'animate') && (tool === 'bone' || tool === 'ik')) {
      const worldBones = getWorldBones();
      const hitThreshold = BONE_HIT_THRESHOLD / engine.viewport.zoom;
      const hovered = hitTestBoneJoint(worldBones, docPt.x, docPt.y, hitThreshold)
        ?? hitTestBone(worldBones, docPt.x, docPt.y, hitThreshold);
      const currentHovered = useBoneStore.getState().hoveredBoneId;
      const newId = hovered?.id ?? null;
      if (newId !== currentHovered) {
        useBoneStore.getState().setHoveredBone(newId);
      }
    }

    drawCursor(nativeEvent.clientX, nativeEvent.clientY);
  }, [screenToDoc, drawCursor, getWorldBones, drawBonePreview]);

  // --- Pointer Up ---
  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    const brushEngine = brushEngineRef.current;
    const nativeEvent = e.nativeEvent;

    (e.target as HTMLCanvasElement).releasePointerCapture(nativeEvent.pointerId);

    const mode = modeRef.current;
    modeRef.current = 'none';

    // --- Pan end ---
    if (mode === 'pan') {
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
      return;
    }

    // --- Bone creation end ---
    if (mode === 'bone-create') {
      const docPt = screenToDoc(nativeEvent.clientX, nativeEvent.clientY);
      const startPt = boneCreateStartRef.current;
      const parentId = boneCreateParentIdRef.current;

      const dx = docPt.x - startPt.x;
      const dy = docPt.y - startPt.y;
      let length = Math.sqrt(dx * dx + dy * dy);
      let rotation = Math.atan2(dy, dx);

      // If barely dragged, use default length
      if (length < MIN_BONE_LENGTH) {
        length = 60;
        rotation = 0;
      }

      const boneStore = useBoneStore.getState();
      let newBoneId: string;

      if (parentId) {
        // Child bone: compute local coords relative to parent
        const worldBones = getWorldBones();
        const parentWorld = worldBones.find((b) => b.id === parentId);
        if (parentWorld) {
          const localX = parentWorld.length;
          const localY = 0;
          const localRotation = rotation - parentWorld.worldRotation;
          newBoneId = boneStore.addBone(parentId, localX, localY, length, localRotation);
        } else {
          newBoneId = boneStore.addBone(parentId, 0, 0, length, rotation);
        }
      } else {
        // Root bone at start position
        newBoneId = boneStore.addBone(null, startPt.x, startPt.y, length, rotation);
      }

      // Auto-bind to active layer and auto-weight
      const { activeLayerId } = useDrawingStore.getState();
      if (activeLayerId && newBoneId) {
        boneStore.bindLayerToBone(newBoneId, activeLayerId);
        boneStore.autoWeightLayer(activeLayerId);
      }

      engine?.invalidate();
      engine?.clearOverlay();
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
      return;
    }

    // --- Bone move/rotate/resize end ---
    if (mode === 'bone-move' || mode === 'bone-rotate' || mode === 'bone-resize') {
      dragBoneIdRef.current = null;
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
      return;
    }

    // --- Brush stroke end ---
    if (mode === 'draw' && engine && brushEngine && brushEngine.getIsDrawing()) {
      const points = brushEngine.endStroke();
      if (points.length > 0) {
        const layerCtx = getActiveLayerCtx();
        const { brushType, brushSettings, activeLayerId, addStroke } = useDrawingStore.getState();

        if (layerCtx) {
          brushEngine.renderStrokeToCanvas(layerCtx, points, brushType, brushSettings);
        }

        addStroke({
          id: generateId(),
          points,
          brushType,
          brushSettings: { ...brushSettings },
          layerId: activeLayerId,
        });

        engine.invalidate();
      }

      engine.clearOverlay();
      drawCursor(nativeEvent.clientX, nativeEvent.clientY);
    }
  }, [getActiveLayerCtx, drawCursor, screenToDoc, getWorldBones]);

  // --- Pointer Leave ---
  const onPointerLeave = useCallback(() => {
    engineRef.current?.clearOverlay();
    const { hoveredBoneId } = useBoneStore.getState();
    if (hoveredBoneId) useBoneStore.getState().setHoveredBone(null);
  }, []);

  // --- Scroll wheel zoom ---
  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const engine = engineRef.current;
    if (!engine) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.08 : 1 / 1.08;
    engine.viewport.zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    useUIStore.getState().setZoomLevel(engine.viewport.zoom);
    engine.invalidate();
    drawCursor(e.clientX, e.clientY);
  }, [drawCursor]);

  const onContextMenu = useCallback((e: React.MouseEvent) => { e.preventDefault(); }, []);

  return (
    <div ref={containerRef} style={containerStyle}>
      <canvas ref={layerCanvasRef} style={canvasBaseStyle} />
      <canvas
        ref={overlayCanvasRef}
        style={{ ...canvasBaseStyle, zIndex: 1 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}

export default CanvasViewport;
