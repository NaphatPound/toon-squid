import { ViewportTransform } from './ViewportTransform';
import { LayerCompositor } from './LayerCompositor';
import type { Layer } from '../../types/drawing';
import type { Bone, BoneLayerBinding } from '../../types/bone';
import { renderBones } from '../bone/BoneRenderer';
import { computeWorldTransforms } from '../bone/BoneSystem';

export class CanvasEngine {
  public viewport: ViewportTransform;
  public compositor: LayerCompositor;
  private layerCanvas: HTMLCanvasElement | null = null;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private layerCtx: CanvasRenderingContext2D | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private animFrameId: number = 0;
  private needsRender = true;

  constructor() {
    this.viewport = new ViewportTransform();
    this.compositor = new LayerCompositor();
  }

  init(layerCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement): void {
    this.layerCanvas = layerCanvas;
    this.overlayCanvas = overlayCanvas;
    this.layerCtx = layerCanvas.getContext('2d');
    this.overlayCtx = overlayCanvas.getContext('2d');
    this.compositor.setOutput(layerCanvas);
  }

  get overlay(): CanvasRenderingContext2D | null {
    return this.overlayCtx;
  }

  resize(width: number, height: number): void {
    if (this.layerCanvas) {
      this.layerCanvas.width = width;
      this.layerCanvas.height = height;
    }
    if (this.overlayCanvas) {
      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;
    }
    this.invalidate();
  }

  invalidate(): void {
    this.needsRender = true;
  }

  render(
    layers: Layer[],
    boneData?: { bones: Bone[]; selectedId: string | null; hoveredId: string | null; appMode: string; bindings: BoneLayerBinding[] },
    docSize?: { width: number; height: number }
  ): void {
    if (!this.layerCtx || !this.layerCanvas) return;

    const ctx = this.layerCtx;
    const w = this.layerCanvas.width;
    const h = this.layerCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.save();

    // Apply viewport transform
    const m = this.viewport.matrix;
    ctx.setTransform(m.a, m.b, m.c, m.d, m.tx, m.ty);

    // Draw checkerboard background for canvas area (use document dimensions)
    const docW = docSize?.width ?? w;
    const docH = docSize?.height ?? h;
    this.drawCheckerboard(ctx, docW, docH);

    // Build binding lookup and compute world bones once
    let worldBones: Bone[] = [];
    const bindingMap = new Map<string, BoneLayerBinding[]>();
    if (boneData && boneData.bones.length > 0) {
      worldBones = computeWorldTransforms(boneData.bones);
      if (boneData.bindings) {
        for (const binding of boneData.bindings) {
          const list = bindingMap.get(binding.layerId);
          if (list) {
            list.push(binding);
          } else {
            bindingMap.set(binding.layerId, [binding]);
          }
        }
      }
    }

    // Build a bone lookup for fast access
    const boneMap = new Map<string, Bone>();
    for (const bone of worldBones) {
      boneMap.set(bone.id, bone);
    }

    // Composite layers
    for (const layer of layers) {
      if (!layer.visible || !layer.canvas) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = this.getCompositeOp(layer.blendMode);

      // Apply blended bone transforms if this layer is bound to bones
      const layerBindings = bindingMap.get(layer.id);
      if (layerBindings && layerBindings.length > 0) {
        this.applyMultiBoneTransform(ctx, layerBindings, boneMap);
      }

      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }

    // Render bones overlay (visible in all modes, interactive in rig & animate)
    if (boneData && worldBones.length > 0) {
      if (boneData.appMode === 'rig' || boneData.appMode === 'animate') {
        renderBones(ctx, worldBones, boneData.selectedId, boneData.hoveredId);
      } else {
        // Show bones as subtle overlay in draw mode
        ctx.save();
        ctx.globalAlpha = 0.3;
        renderBones(ctx, worldBones, null, null);
        ctx.restore();
      }
    }

    ctx.restore();
    this.needsRender = false;
  }

  /**
   * Apply blended transforms from multiple bones to a layer.
   * Each bone contributes translation, rotation, and scale weighted by its binding weight.
   * The final transform is a weighted blend of all bone influences.
   */
  private applyMultiBoneTransform(
    ctx: CanvasRenderingContext2D,
    bindings: BoneLayerBinding[],
    boneMap: Map<string, Bone>
  ): void {
    // Accumulate weighted deltas from all bones
    let totalWeight = 0;
    let blendedDeltaX = 0;
    let blendedDeltaY = 0;
    let blendedDeltaRotation = 0;
    let blendedScaleX = 0;
    let blendedScaleY = 0;
    // Weighted average pivot point
    let pivotX = 0;
    let pivotY = 0;

    for (const binding of bindings) {
      if (binding.weight <= 0) continue;
      const bone = boneMap.get(binding.boneId);
      if (!bone) continue;

      const w = binding.weight;
      totalWeight += w;

      blendedDeltaX += (bone.worldX - binding.bindWorldX) * w;
      blendedDeltaY += (bone.worldY - binding.bindWorldY) * w;
      blendedDeltaRotation += (bone.worldRotation - binding.bindWorldRotation) * w;
      blendedScaleX += (bone.localScaleX / binding.bindScaleX) * w;
      blendedScaleY += (bone.localScaleY / binding.bindScaleY) * w;
      pivotX += binding.bindWorldX * w;
      pivotY += binding.bindWorldY * w;
    }

    if (totalWeight <= 0) return;

    // Normalize
    const invTotal = 1 / totalWeight;
    blendedDeltaX *= invTotal;
    blendedDeltaY *= invTotal;
    blendedDeltaRotation *= invTotal;
    blendedScaleX *= invTotal;
    blendedScaleY *= invTotal;
    pivotX *= invTotal;
    pivotY *= invTotal;

    // Apply transform around the blended pivot point
    ctx.translate(pivotX + blendedDeltaX, pivotY + blendedDeltaY);
    ctx.rotate(blendedDeltaRotation);
    ctx.scale(blendedScaleX, blendedScaleY);
    ctx.translate(-pivotX, -pivotY);
  }

  clearOverlay(): void {
    if (!this.overlayCtx || !this.overlayCanvas) return;
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
  }

  private drawCheckerboard(ctx: CanvasRenderingContext2D, docW: number, docH: number): void {
    const size = 16;
    ctx.save();
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, docW, docH);
    ctx.fillStyle = '#3d3d3d';
    for (let y = 0; y < docH; y += size) {
      for (let x = 0; x < docW; x += size) {
        if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
          ctx.fillRect(x, y, size, size);
        }
      }
    }
    ctx.restore();
  }

  private getCompositeOp(blendMode: string): GlobalCompositeOperation {
    const map: Record<string, GlobalCompositeOperation> = {
      'normal': 'source-over',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'darken': 'darken',
      'lighten': 'lighten',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'hard-light': 'hard-light',
      'soft-light': 'soft-light',
      'difference': 'difference',
      'exclusion': 'exclusion',
    };
    return map[blendMode] || 'source-over';
  }

  startRenderLoop(getLayers: () => Layer[], getBoneData?: () => { bones: Bone[]; selectedId: string | null; hoveredId: string | null; appMode: string; bindings: BoneLayerBinding[] }, getDocSize?: () => { width: number; height: number }): void {
    const loop = () => {
      if (this.needsRender) {
        this.render(getLayers(), getBoneData?.(), getDocSize?.());
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  stopRenderLoop(): void {
    cancelAnimationFrame(this.animFrameId);
  }

  destroy(): void {
    this.stopRenderLoop();
    this.layerCanvas = null;
    this.overlayCanvas = null;
    this.layerCtx = null;
    this.overlayCtx = null;
  }
}
