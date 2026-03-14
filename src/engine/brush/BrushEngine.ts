import type { Point, BrushSettings, BrushType, CustomBrush } from '../../types/drawing';
import { computeDynamicStroke, spacedStamps, type StampPoint } from './DynamicStroke';
import { clamp } from '../../utils/math';
import { CustomBrushRenderer } from './CustomBrushRenderer';

export interface BrushRenderer {
  renderStamp(ctx: CanvasRenderingContext2D, stamp: StampPoint, settings: BrushSettings): void;
  renderStroke(ctx: CanvasRenderingContext2D, stamps: StampPoint[], settings: BrushSettings): void;
}

class PenBrushRenderer implements BrushRenderer {
  renderStamp(ctx: CanvasRenderingContext2D, stamp: StampPoint, settings: BrushSettings): void {
    const r = stamp.width / 2;
    ctx.beginPath();
    ctx.arc(stamp.x, stamp.y, r, 0, Math.PI * 2);
    ctx.fillStyle = settings.color;
    ctx.globalAlpha = stamp.opacity;
    ctx.fill();
  }

  renderStroke(ctx: CanvasRenderingContext2D, stamps: StampPoint[], settings: BrushSettings): void {
    if (stamps.length < 2) {
      if (stamps.length === 1) this.renderStamp(ctx, stamps[0], settings);
      return;
    }
    for (const stamp of stamps) {
      this.renderStamp(ctx, stamp, settings);
    }
  }
}

class InkBrushRenderer implements BrushRenderer {
  renderStamp(ctx: CanvasRenderingContext2D, stamp: StampPoint, settings: BrushSettings): void {
    const r = stamp.width / 2;
    ctx.beginPath();
    ctx.arc(stamp.x, stamp.y, r, 0, Math.PI * 2);
    ctx.fillStyle = settings.color;
    ctx.globalAlpha = stamp.opacity;
    ctx.fill();
  }

  renderStroke(ctx: CanvasRenderingContext2D, stamps: StampPoint[], settings: BrushSettings): void {
    if (stamps.length < 2) {
      if (stamps.length === 1) this.renderStamp(ctx, stamps[0], settings);
      return;
    }

    ctx.save();
    ctx.fillStyle = settings.color;
    ctx.globalAlpha = clamp(settings.opacity, 0, 1);
    ctx.beginPath();

    // Build outline from left side going forward, right side going backward
    const leftPoints: { x: number; y: number }[] = [];
    const rightPoints: { x: number; y: number }[] = [];

    for (let i = 0; i < stamps.length; i++) {
      const stamp = stamps[i];
      const r = stamp.width / 2;

      let angle: number;
      if (i === 0) {
        angle = Math.atan2(stamps[1].y - stamp.y, stamps[1].x - stamp.x);
      } else if (i === stamps.length - 1) {
        angle = Math.atan2(stamp.y - stamps[i - 1].y, stamp.x - stamps[i - 1].x);
      } else {
        angle = Math.atan2(stamps[i + 1].y - stamps[i - 1].y, stamps[i + 1].x - stamps[i - 1].x);
      }

      const perpAngle = angle + Math.PI / 2;
      leftPoints.push({
        x: stamp.x + Math.cos(perpAngle) * r,
        y: stamp.y + Math.sin(perpAngle) * r,
      });
      rightPoints.push({
        x: stamp.x - Math.cos(perpAngle) * r,
        y: stamp.y - Math.sin(perpAngle) * r,
      });
    }

    // Draw filled shape
    ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
    for (let i = 1; i < leftPoints.length; i++) {
      ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
    }
    for (let i = rightPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Round caps
    const first = stamps[0];
    const last = stamps[stamps.length - 1];
    ctx.beginPath();
    ctx.arc(first.x, first.y, first.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, last.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class PencilBrushRenderer implements BrushRenderer {
  renderStamp(ctx: CanvasRenderingContext2D, stamp: StampPoint, settings: BrushSettings): void {
    const r = stamp.width / 2;
    // Pencil with grain texture
    const grainAlpha = stamp.opacity * (0.3 + Math.random() * 0.7);
    ctx.beginPath();
    ctx.arc(stamp.x + (Math.random() - 0.5) * 1.5, stamp.y + (Math.random() - 0.5) * 1.5, r * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = settings.color;
    ctx.globalAlpha = grainAlpha;
    ctx.fill();
  }

  renderStroke(ctx: CanvasRenderingContext2D, stamps: StampPoint[], settings: BrushSettings): void {
    for (const stamp of stamps) {
      this.renderStamp(ctx, stamp, settings);
    }
  }
}

class MarkerBrushRenderer implements BrushRenderer {
  renderStamp(ctx: CanvasRenderingContext2D, stamp: StampPoint, settings: BrushSettings): void {
    const w = stamp.width;
    const h = stamp.width * 0.4;
    ctx.save();
    ctx.fillStyle = settings.color;
    ctx.globalAlpha = stamp.opacity * 0.3;
    ctx.fillRect(stamp.x - w / 2, stamp.y - h / 2, w, h);
    ctx.restore();
  }

  renderStroke(ctx: CanvasRenderingContext2D, stamps: StampPoint[], settings: BrushSettings): void {
    for (const stamp of stamps) {
      this.renderStamp(ctx, stamp, settings);
    }
  }
}

class EraserBrushRenderer implements BrushRenderer {
  renderStamp(ctx: CanvasRenderingContext2D, stamp: StampPoint, _settings: BrushSettings): void {
    const r = stamp.width / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(stamp.x, stamp.y, r, 0, Math.PI * 2);
    ctx.globalAlpha = stamp.opacity;
    ctx.fill();
    ctx.restore();
  }

  renderStroke(ctx: CanvasRenderingContext2D, stamps: StampPoint[], settings: BrushSettings): void {
    for (const stamp of stamps) {
      this.renderStamp(ctx, stamp, settings);
    }
  }
}

const customBrushRenderer = new CustomBrushRenderer({
  id: '', name: '', shape: 'circle', spacing: 0.15, scatter: 0,
  rotation: 'none', rotationAngle: 0, sizeJitter: 0, opacityJitter: 0,
  hardness: 0.8, roundness: 1, grainOpacity: 0, grainScale: 1,
  taperStart: 0.15, taperEnd: 0.15, pressureSize: true, pressureOpacity: false,
  dualBrush: false, dualShape: 'circle', dualSizeRatio: 0.5,
});

const RENDERERS: Record<BrushType, BrushRenderer> = {
  pen: new PenBrushRenderer(),
  ink: new InkBrushRenderer(),
  pencil: new PencilBrushRenderer(),
  marker: new MarkerBrushRenderer(),
  eraser: new EraserBrushRenderer(),
  custom: customBrushRenderer,
};

export class BrushEngine {
  private currentPoints: Point[] = [];
  private isDrawing = false;
  private previewCtx: CanvasRenderingContext2D | null = null;

  setPreviewContext(ctx: CanvasRenderingContext2D): void {
    this.previewCtx = ctx;
  }

  setCustomBrush(brush: CustomBrush): void {
    customBrushRenderer.setBrush(brush);
  }

  beginStroke(point: Point): void {
    this.currentPoints = [point];
    this.isDrawing = true;
  }

  addPoint(point: Point): void {
    if (!this.isDrawing) return;
    this.currentPoints.push(point);
  }

  endStroke(): Point[] {
    this.isDrawing = false;
    const points = [...this.currentPoints];
    this.currentPoints = [];
    return points;
  }

  getIsDrawing(): boolean {
    return this.isDrawing;
  }

  getCurrentPoints(): Point[] {
    return this.currentPoints;
  }

  renderStrokeToCanvas(
    ctx: CanvasRenderingContext2D,
    points: Point[],
    brushType: BrushType,
    settings: BrushSettings
  ): void {
    if (points.length === 0) return;

    const stamps = computeDynamicStroke(points, settings);
    const spaced = spacedStamps(stamps, settings.spacing, settings.size);
    const renderer = RENDERERS[brushType];

    ctx.save();
    renderer.renderStroke(ctx, spaced, settings);
    ctx.restore();
  }

  renderPreview(brushType: BrushType, settings: BrushSettings): void {
    if (!this.previewCtx || this.currentPoints.length === 0) return;

    const ctx = this.previewCtx;
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (brushType === 'eraser') {
      // Eraser uses destination-out which is invisible on empty overlay.
      // Show a visible indicator instead.
      this.renderEraserPreview(ctx, settings);
    } else {
      this.renderStrokeToCanvas(ctx, this.currentPoints, brushType, settings);
    }
  }

  private renderEraserPreview(ctx: CanvasRenderingContext2D, settings: BrushSettings): void {
    const stamps = computeDynamicStroke(this.currentPoints, settings);
    const spaced = spacedStamps(stamps, settings.spacing, settings.size);
    if (spaced.length === 0) return;

    ctx.save();
    // Draw semi-transparent white circles showing where erasing will happen
    for (const stamp of spaced) {
      const r = stamp.width / 2;
      ctx.beginPath();
      ctx.arc(stamp.x, stamp.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${stamp.opacity * 0.35})`;
      ctx.fill();
    }
    ctx.restore();
  }
}
