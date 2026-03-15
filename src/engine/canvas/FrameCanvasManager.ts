/**
 * Manages per-frame canvas data for frame-by-frame drawing layers.
 *
 * Each frame-by-frame layer stores an ImageData snapshot per frame.
 * When the animation frame changes, the current canvas is saved and
 * the target frame's content is restored.
 */

/** key = "layerId:frame" */
const frameStore = new Map<string, ImageData>();

function key(layerId: string, frame: number): string {
  return `${layerId}:${frame}`;
}

/**
 * Save the current canvas content for a specific frame.
 */
export function saveFrame(
  layerId: string,
  frame: number,
  canvas: OffscreenCanvas
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  frameStore.set(key(layerId, frame), data);
}

/**
 * Restore a frame's content onto the canvas.
 * Clears the canvas first, then draws the stored data (if any).
 */
export function restoreFrame(
  layerId: string,
  frame: number,
  canvas: OffscreenCanvas
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const data = frameStore.get(key(layerId, frame));
  if (data) {
    ctx.putImageData(data, 0, 0);
  }
}

/**
 * Check if a frame has any saved content.
 */
export function hasFrameData(layerId: string, frame: number): boolean {
  return frameStore.has(key(layerId, frame));
}

/**
 * Get all frame numbers that have data for a layer.
 */
export function getLayerFrames(layerId: string): number[] {
  const prefix = `${layerId}:`;
  const frames: number[] = [];
  for (const k of frameStore.keys()) {
    if (k.startsWith(prefix)) {
      frames.push(parseInt(k.substring(prefix.length), 10));
    }
  }
  return frames.sort((a, b) => a - b);
}

/**
 * Delete all frame data for a layer.
 */
export function deleteLayerFrames(layerId: string): void {
  const prefix = `${layerId}:`;
  for (const k of frameStore.keys()) {
    if (k.startsWith(prefix)) {
      frameStore.delete(k);
    }
  }
}

/**
 * Delete a single frame's data.
 */
export function deleteFrame(layerId: string, frame: number): void {
  frameStore.delete(key(layerId, frame));
}
