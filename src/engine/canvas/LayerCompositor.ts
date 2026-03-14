import type { Layer, BlendMode } from '../../types/drawing';

const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
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

export class LayerCompositor {
  private outputCanvas: HTMLCanvasElement | null = null;
  private outputCtx: CanvasRenderingContext2D | null = null;

  setOutput(canvas: HTMLCanvasElement): void {
    this.outputCanvas = canvas;
    this.outputCtx = canvas.getContext('2d');
  }

  composite(layers: Layer[]): void {
    if (!this.outputCtx || !this.outputCanvas) return;

    const ctx = this.outputCtx;
    const w = this.outputCanvas.width;
    const h = this.outputCanvas.height;

    ctx.clearRect(0, 0, w, h);

    for (const layer of layers) {
      if (!layer.visible || !layer.canvas) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode] || 'source-over';
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }
  }

  renderThumbnail(layer: Layer, size: number = 48): HTMLCanvasElement | null {
    if (!layer.canvas) return null;

    const thumb = document.createElement('canvas');
    const aspect = layer.canvas.width / layer.canvas.height;
    if (aspect > 1) {
      thumb.width = size;
      thumb.height = Math.round(size / aspect);
    } else {
      thumb.height = size;
      thumb.width = Math.round(size * aspect);
    }

    const ctx = thumb.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(layer.canvas, 0, 0, thumb.width, thumb.height);
    return thumb;
  }
}
