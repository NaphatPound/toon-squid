import type { Bone, LayerMesh } from '../../types/bone';
import type { Layer } from '../../types/drawing';
import { distance } from '../../utils/math';
import { getBoneTip } from './BoneSystem';

const DEFAULT_CELL_SIZE = 30;

/**
 * Generate a grid mesh for a layer based on its non-transparent content.
 * Scans the layer's canvas to find the content bounding box,
 * then creates a subdivided grid mesh covering that area.
 */
export function generateLayerMesh(
  layer: Layer,
  bones: Bone[],
  cellSize: number = DEFAULT_CELL_SIZE
): LayerMesh | null {
  if (!layer.canvas) return null;

  const canvasW = layer.canvas.width;
  const canvasH = layer.canvas.height;
  if (canvasW === 0 || canvasH === 0) return null;

  // Find content bounding box by scanning alpha channel
  const ctx = layer.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  if (!ctx) return null;

  const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
  const bounds = findContentBounds(imageData);

  // If no content, use full canvas
  const bx = bounds ? bounds.x : 0;
  const by = bounds ? bounds.y : 0;
  const bw = bounds ? bounds.w : canvasW;
  const bh = bounds ? bounds.h : canvasH;

  // Add padding around content
  const pad = cellSize;
  const x0 = Math.max(0, bx - pad);
  const y0 = Math.max(0, by - pad);
  const x1 = Math.min(canvasW, bx + bw + pad);
  const y1 = Math.min(canvasH, by + bh + pad);
  const meshW = x1 - x0;
  const meshH = y1 - y0;

  // Compute grid resolution
  const cols = Math.max(2, Math.ceil(meshW / cellSize) + 1);
  const rows = Math.max(2, Math.ceil(meshH / cellSize) + 1);

  // Generate vertices and UVs
  const vertices: { x: number; y: number }[] = [];
  const uvs: { u: number; v: number }[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t_col = col / (cols - 1);
      const t_row = row / (rows - 1);
      const vx = x0 + t_col * meshW;
      const vy = y0 + t_row * meshH;
      vertices.push({ x: vx, y: vy });
      uvs.push({ u: vx / canvasW, v: vy / canvasH });
    }
  }

  // Generate triangle indices (2 triangles per cell)
  const indices: number[] = [];
  for (let row = 0; row < rows - 1; row++) {
    for (let col = 0; col < cols - 1; col++) {
      const tl = row * cols + col;
      const tr = tl + 1;
      const bl = (row + 1) * cols + col;
      const br = bl + 1;
      // Triangle 1: top-left, bottom-left, top-right
      indices.push(tl, bl, tr);
      // Triangle 2: top-right, bottom-left, bottom-right
      indices.push(tr, bl, br);
    }
  }

  // Auto-compute bone weights per vertex
  const boneWeights = computeVertexBoneWeights(vertices, bones);

  return {
    layerId: layer.id,
    vertices,
    uvs,
    indices,
    boneWeights,
    cols,
    rows,
  };
}

/**
 * Find the bounding box of non-transparent pixels in an ImageData.
 */
function findContentBounds(
  imageData: ImageData
): { x: number; y: number; w: number; h: number } | null {
  const { width, height, data } = imageData;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  // Sample every 4th pixel for performance
  const step = 4;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return null;

  return {
    x: minX,
    y: minY,
    w: maxX - minX + step,
    h: maxY - minY + step,
  };
}

/**
 * Compute bone weights for each vertex using inverse-distance weighting.
 * Each vertex gets weights from all bones, normalized to sum to 1.
 */
function computeVertexBoneWeights(
  vertices: { x: number; y: number }[],
  bones: Bone[]
): { boneId: string; weight: number }[][] {
  if (bones.length === 0) {
    return vertices.map(() => []);
  }

  return vertices.map((v) => {
    const epsilon = 0.001;
    const rawWeights: { boneId: string; weight: number }[] = [];
    let totalWeight = 0;

    for (const bone of bones) {
      const dist = pointToBoneSegmentDist(v.x, v.y, bone);
      // Use bone length as influence multiplier
      const influence = (bone.length > 0 ? bone.length : 1);
      const w = influence / (dist + epsilon);
      rawWeights.push({ boneId: bone.id, weight: w });
      totalWeight += w;
    }

    // Normalize
    if (totalWeight > 0) {
      for (const rw of rawWeights) {
        rw.weight /= totalWeight;
      }
    }

    // Filter out very small weights for performance
    return rawWeights.filter((rw) => rw.weight > 0.01);
  });
}

/**
 * Distance from a point to a bone's line segment (joint to tip).
 */
function pointToBoneSegmentDist(px: number, py: number, bone: Bone): number {
  const tip = getBoneTip(bone);
  const dx = tip.x - bone.worldX;
  const dy = tip.y - bone.worldY;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return distance(px, py, bone.worldX, bone.worldY);
  }

  let t = ((px - bone.worldX) * dx + (py - bone.worldY) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = bone.worldX + t * dx;
  const projY = bone.worldY + t * dy;

  return distance(px, py, projX, projY);
}
