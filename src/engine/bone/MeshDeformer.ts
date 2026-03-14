import type { Bone, LayerMesh, BoneLayerBinding } from '../../types/bone';
import { Matrix2D } from '../../utils/math';

/**
 * Compute deformed vertex positions for a mesh based on current bone transforms.
 * Uses linear blend skinning: each vertex is transformed by a weighted blend
 * of all influencing bones' delta transforms (current vs bind pose).
 */
export function deformMeshVertices(
  mesh: LayerMesh,
  bones: Bone[],
  bindings: BoneLayerBinding[]
): { x: number; y: number }[] {
  // Build bone lookup
  const boneMap = new Map<string, Bone>();
  for (const bone of bones) {
    boneMap.set(bone.id, bone);
  }

  // Build binding lookup (bind pose per bone)
  const bindMap = new Map<string, BoneLayerBinding>();
  for (const b of bindings) {
    bindMap.set(b.boneId, b);
  }

  // Precompute delta matrices for each bone
  const deltaMatrices = new Map<string, Matrix2D>();
  for (const bone of bones) {
    const bind = bindMap.get(bone.id);
    if (!bind) continue;

    // Bind pose matrix
    const bindMatrix = Matrix2D.translation(bind.bindWorldX, bind.bindWorldY)
      .multiply(Matrix2D.rotation(bind.bindWorldRotation))
      .multiply(Matrix2D.scaling(bind.bindScaleX, bind.bindScaleY));

    // Current pose matrix
    const currentMatrix = Matrix2D.translation(bone.worldX, bone.worldY)
      .multiply(Matrix2D.rotation(bone.worldRotation))
      .multiply(Matrix2D.scaling(bone.localScaleX, bone.localScaleY));

    // Delta = current * inverse(bind)
    const delta = currentMatrix.multiply(bindMatrix.invert());
    deltaMatrices.set(bone.id, delta);
  }

  // Deform each vertex
  return mesh.vertices.map((v, i) => {
    const weights = mesh.boneWeights[i];
    if (!weights || weights.length === 0) {
      return { x: v.x, y: v.y };
    }

    let dx = 0, dy = 0;
    let totalW = 0;

    for (const { boneId, weight } of weights) {
      const delta = deltaMatrices.get(boneId);
      if (!delta || weight <= 0) continue;

      // Transform the vertex by this bone's delta
      const tx = delta.a * v.x + delta.c * v.y + delta.tx;
      const ty = delta.b * v.x + delta.d * v.y + delta.ty;

      dx += tx * weight;
      dy += ty * weight;
      totalW += weight;
    }

    if (totalW <= 0) {
      return { x: v.x, y: v.y };
    }

    return { x: dx / totalW, y: dy / totalW };
  });
}

/**
 * Render a deformed mesh by drawing textured triangles.
 * Uses canvas clipping and affine transforms per triangle.
 */
export function renderDeformedMesh(
  ctx: CanvasRenderingContext2D,
  source: OffscreenCanvas,
  mesh: LayerMesh,
  deformedVertices: { x: number; y: number }[]
): void {
  const srcW = source.width;
  const srcH = source.height;

  for (let i = 0; i < mesh.indices.length; i += 3) {
    const i0 = mesh.indices[i];
    const i1 = mesh.indices[i + 1];
    const i2 = mesh.indices[i + 2];

    // Deformed positions
    const p0 = deformedVertices[i0];
    const p1 = deformedVertices[i1];
    const p2 = deformedVertices[i2];

    // UV positions in pixel space
    const uv0 = mesh.uvs[i0];
    const uv1 = mesh.uvs[i1];
    const uv2 = mesh.uvs[i2];
    const s0x = uv0.u * srcW, s0y = uv0.v * srcH;
    const s1x = uv1.u * srcW, s1y = uv1.v * srcH;
    const s2x = uv2.u * srcW, s2y = uv2.v * srcH;

    // Compute the affine transform from source triangle to deformed triangle
    // Source: (s0x,s0y), (s1x,s1y), (s2x,s2y) → Dest: (p0.x,p0.y), (p1.x,p1.y), (p2.x,p2.y)
    const transform = computeTriangleTransform(
      s0x, s0y, s1x, s1y, s2x, s2y,
      p0.x, p0.y, p1.x, p1.y, p2.x, p2.y
    );
    if (!transform) continue;

    ctx.save();

    // Clip to the deformed triangle
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.clip();

    // Apply the affine transform and draw the source image
    ctx.transform(transform.a, transform.b, transform.c, transform.d, transform.tx, transform.ty);
    ctx.drawImage(source, 0, 0);

    ctx.restore();
  }
}

/**
 * Compute the 2D affine transform that maps source triangle to destination triangle.
 * Returns {a, b, c, d, tx, ty} for ctx.transform().
 */
function computeTriangleTransform(
  sx0: number, sy0: number, sx1: number, sy1: number, sx2: number, sy2: number,
  dx0: number, dy0: number, dx1: number, dy1: number, dx2: number, dy2: number
): { a: number; b: number; c: number; d: number; tx: number; ty: number } | null {
  // Solve: dest = M * source
  // [dx0 dy0] = [a c tx] * [sx0 sy0 1]T
  // [dx1 dy1] = [b d ty] * [sx1 sy1 1]T
  // etc.
  const det = (sx0 - sx2) * (sy1 - sy2) - (sx1 - sx2) * (sy0 - sy2);
  if (Math.abs(det) < 1e-10) return null;

  const invDet = 1 / det;

  const a = ((dx0 - dx2) * (sy1 - sy2) - (dx1 - dx2) * (sy0 - sy2)) * invDet;
  const b = ((dy0 - dy2) * (sy1 - sy2) - (dy1 - dy2) * (sy0 - sy2)) * invDet;
  const c = ((dx1 - dx2) * (sx0 - sx2) - (dx0 - dx2) * (sx1 - sx2)) * invDet;
  const d = ((dy1 - dy2) * (sx0 - sx2) - (dy0 - dy2) * (sx1 - sx2)) * invDet;
  const tx = dx0 - a * sx0 - c * sy0;
  const ty = dy0 - b * sx0 - d * sy0;

  return { a, b, c, d, tx, ty };
}

/**
 * Render mesh wireframe overlay for debugging/visualization.
 */
export function renderMeshWireframe(
  ctx: CanvasRenderingContext2D,
  mesh: LayerMesh,
  deformedVertices: { x: number; y: number }[],
  color: string = 'rgba(100, 200, 255, 0.4)'
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  for (let i = 0; i < mesh.indices.length; i += 3) {
    const p0 = deformedVertices[mesh.indices[i]];
    const p1 = deformedVertices[mesh.indices[i + 1]];
    const p2 = deformedVertices[mesh.indices[i + 2]];

    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.stroke();
  }

  // Draw vertices as small dots
  ctx.fillStyle = color;
  for (const v of deformedVertices) {
    ctx.beginPath();
    ctx.arc(v.x, v.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
