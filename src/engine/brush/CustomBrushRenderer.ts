import type { BrushSettings, CustomBrush, StampShape } from '../../types/drawing';
import type { StampPoint } from './DynamicStroke';
import type { BrushRenderer } from './BrushEngine';
import { clamp, distance } from '../../utils/math';
import { getTemplateImage } from './ImageStamps';

/**
 * Renders a single stamp shape at the given position.
 */
function drawShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  shape: StampShape,
  hardness: number,
  roundness: number,
  color: string,
  alpha: number
): void {
  ctx.save();
  ctx.translate(x, y);

  if (roundness < 1) {
    ctx.scale(1, roundness);
  }

  ctx.globalAlpha = alpha;

  if (hardness < 1 && shape === 'circle') {
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(clamp(hardness, 0.01, 0.99), color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    switch (shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star': {
        ctx.beginPath();
        const spikes = 5;
        const inner = radius * 0.4;
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? radius : inner;
          const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'scatter-dots': {
        const count = Math.max(3, Math.floor(radius * 1.5));
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * radius;
          const dotR = Math.max(0.5, radius * 0.1 * (0.5 + Math.random()));
          ctx.beginPath();
          ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'image':
        // Image template rendering is handled in renderStroke.
        // Fallback to a small circle for single-point strokes.
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  ctx.restore();
}

/**
 * Apply grain texture effect to the canvas area
 */
function applyGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  grainOpacity: number,
  grainScale: number
): void {
  if (grainOpacity <= 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = grainOpacity;

  const step = Math.max(1, Math.floor(grainScale * 2));

  for (let gy = -radius; gy < radius; gy += step) {
    for (let gx = -radius; gx < radius; gx += step) {
      if (Math.random() > 0.5) {
        const dotSize = Math.max(0.5, step * 0.4);
        ctx.fillStyle = 'white';
        ctx.fillRect(x + gx, y + gy, dotSize, dotSize);
      }
    }
  }

  ctx.restore();
}

/**
 * Custom brush renderer that supports Procreate-like brush properties
 * and image-template brushes.
 */
export class CustomBrushRenderer implements BrushRenderer {
  private brush: CustomBrush;

  constructor(brush: CustomBrush) {
    this.brush = brush;
  }

  setBrush(brush: CustomBrush): void {
    this.brush = brush;
  }

  /** Returns true if the current brush uses an image template. */
  isImageBrush(): boolean {
    return this.brush.shape === 'image' && !!this.brush.imageStampId;
  }

  renderStamp(ctx: CanvasRenderingContext2D, stamp: StampPoint, settings: BrushSettings): void {
    const b = this.brush;
    let r = stamp.width / 2;

    if (b.sizeJitter > 0) {
      r *= 1 - b.sizeJitter * 0.5 + Math.random() * b.sizeJitter;
    }

    let opacity = stamp.opacity;
    if (b.opacityJitter > 0) {
      opacity *= 1 - b.opacityJitter + Math.random() * b.opacityJitter;
    }

    let sx = stamp.x;
    let sy = stamp.y;
    if (b.scatter > 0) {
      const scatterDist = b.scatter * stamp.width;
      const angle = Math.random() * Math.PI * 2;
      sx += Math.cos(angle) * scatterDist * Math.random();
      sy += Math.sin(angle) * scatterDist * Math.random();
    }

    ctx.save();
    ctx.translate(sx, sy);

    if (b.rotation === 'random') {
      ctx.rotate(Math.random() * Math.PI * 2);
    } else if (b.rotation === 'none' && b.rotationAngle !== 0) {
      ctx.rotate(b.rotationAngle * Math.PI / 180);
    }

    ctx.translate(-sx, -sy);

    drawShape(ctx, sx, sy, r, b.shape, b.hardness, b.roundness, settings.color, opacity);

    if (b.grainOpacity > 0) {
      applyGrain(ctx, sx, sy, r, b.grainOpacity * 0.3, b.grainScale);
    }

    if (b.dualBrush) {
      const dualR = r * b.dualSizeRatio;
      drawShape(ctx, sx, sy, dualR, b.dualShape, b.hardness, b.roundness, settings.color, opacity * 0.5);
    }

    ctx.restore();
  }

  // ──────────────────────────────────────────────────────────
  //  Image-template rendering
  //
  //  The template image is VERTICAL:
  //    Image Y (top→bottom) = along the body part (hip → foot)
  //    Image X (left→right) = width / thickness of the body part
  //
  //  We slice the image into thin horizontal strips and lay each
  //  strip along the stroke path, rotated to follow curves.
  //  Drawing stops once the full image has been revealed.
  // ──────────────────────────────────────────────────────────

  private renderImageTemplate(
    ctx: CanvasRenderingContext2D,
    stamps: StampPoint[],
    settings: BrushSettings
  ): void {
    const b = this.brush;
    const img = getTemplateImage(b.imageStampId);
    if (!img || stamps.length < 2) {
      this.renderStampsDefault(ctx, stamps, settings);
      return;
    }

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const brushWidth = settings.size;
    const scale = brushWidth / imgW;
    const mappedLength = imgH * scale;

    // Calculate segment lengths
    const segLengths: number[] = [0];
    let totalLength = 0;
    for (let i = 1; i < stamps.length; i++) {
      const d = distance(stamps[i - 1].x, stamps[i - 1].y, stamps[i].x, stamps[i].y);
      segLengths.push(d);
      totalLength += d;
    }

    const drawLength = Math.min(totalLength, mappedLength);
    if (drawLength < 1) return;

    // Render onto a temp canvas so that within the stroke, earlier
    // slices (start of the image) stay on top of later slices.
    // We use 'destination-over' which draws BEHIND existing pixels.
    const canvasW = ctx.canvas.width;
    const canvasH = ctx.canvas.height;
    const tmp = new OffscreenCanvas(canvasW, canvasH);
    const tctx = tmp.getContext('2d');
    if (!tctx) return;

    let distSoFar = 0;

    for (let i = 1; i < stamps.length; i++) {
      if (distSoFar >= drawLength) break;

      const ax = stamps[i - 1].x;
      const ay = stamps[i - 1].y;
      const bx = stamps[i].x;
      const by = stamps[i].y;
      const segLen = segLengths[i];

      if (segLen < 0.5) { distSoFar += segLen; continue; }

      const remaining = drawLength - distSoFar;
      const usedLen = Math.min(segLen, remaining);
      const angle = Math.atan2(by - ay, bx - ax);

      const srcY = (distSoFar / mappedLength) * imgH;
      const srcH = (usedLen / mappedLength) * imgH;

      // After the very first slice, switch to destination-over so
      // each new slice is drawn BEHIND the already-drawn ones.
      if (distSoFar > 0) {
        tctx.globalCompositeOperation = 'destination-over';
      }

      tctx.save();
      tctx.translate(ax, ay);
      tctx.rotate(angle - Math.PI / 2);
      tctx.drawImage(
        img,
        0, srcY, imgW, Math.max(1, srcH),
        -brushWidth / 2, 0, brushWidth, usedLen + 0.5
      );
      tctx.restore();

      distSoFar += segLen;
    }

    // Composite the temp canvas onto the real layer canvas (source-over)
    ctx.save();
    ctx.globalAlpha = clamp(settings.opacity, 0, 1);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }

  /** Default stamp-by-stamp rendering (non-image brushes). */
  private renderStampsDefault(
    ctx: CanvasRenderingContext2D,
    stamps: StampPoint[],
    settings: BrushSettings
  ): void {
    const b = this.brush;
    const totalStamps = stamps.length;
    const taperStartCount = Math.floor(totalStamps * b.taperStart);
    const taperEndCount = Math.floor(totalStamps * b.taperEnd);

    for (let i = 0; i < stamps.length; i++) {
      const stamp = { ...stamps[i] };

      if (i < taperStartCount && taperStartCount > 0) {
        stamp.width *= (i + 1) / (taperStartCount + 1);
      }
      if (i >= totalStamps - taperEndCount && taperEndCount > 0) {
        stamp.width *= (totalStamps - i) / (taperEndCount + 1);
      }

      if (b.rotation === 'follow-stroke' && i < stamps.length - 1) {
        const next = stamps[Math.min(i + 1, stamps.length - 1)];
        const prev = stamps[Math.max(i - 1, 0)];
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        ctx.save();
        ctx.translate(stamp.x, stamp.y);
        ctx.rotate(angle);
        ctx.translate(-stamp.x, -stamp.y);
        this.renderStamp(ctx, stamp, settings);
        ctx.restore();
      } else {
        this.renderStamp(ctx, stamp, settings);
      }
    }
  }

  renderStroke(ctx: CanvasRenderingContext2D, stamps: StampPoint[], settings: BrushSettings): void {
    if (stamps.length === 0) return;

    // Image template brushes use a completely different rendering path
    if (this.brush.shape === 'image' && this.brush.imageStampId) {
      this.renderImageTemplate(ctx, stamps, settings);
      return;
    }

    this.renderStampsDefault(ctx, stamps, settings);
  }
}
