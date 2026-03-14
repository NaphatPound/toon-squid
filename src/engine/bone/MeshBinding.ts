import type { Bone } from '../../types/bone';
import { Matrix2D, Vec2, distance } from '../../utils/math';

/**
 * Represents a mesh bound to a bone for skeletal deformation.
 * Each vertex has a position and corresponding weight value indicating
 * the influence of the bound bone on that vertex.
 */
export interface MeshBinding {
  boneId: string;
  layerId: string;
  weights: number[];
  vertices: { x: number; y: number }[];
}

/**
 * Create a default mesh binding for a bone and image layer.
 * Generates a rectangular mesh around the bone with 4 corner vertices
 * and uniform weights.
 *
 * @param bone - The bone to bind to (must have computed world transforms).
 * @param layerId - The ID of the image layer to bind.
 * @returns A new MeshBinding with default rectangular vertices.
 */
export function createBinding(bone: Bone, layerId: string): MeshBinding {
  const halfWidth = bone.length * 0.3;
  const cos = Math.cos(bone.worldRotation);
  const sin = Math.sin(bone.worldRotation);

  // Perpendicular direction
  const perpX = -sin * halfWidth;
  const perpY = cos * halfWidth;

  // Tip position
  const tipX = bone.worldX + cos * bone.length;
  const tipY = bone.worldY + sin * bone.length;

  // Generate a quad around the bone: top-left, top-right, bottom-right, bottom-left
  const vertices: { x: number; y: number }[] = [
    { x: bone.worldX + perpX, y: bone.worldY + perpY },     // Joint left
    { x: bone.worldX - perpX, y: bone.worldY - perpY },     // Joint right
    { x: tipX - perpX, y: tipY - perpY },                    // Tip right
    { x: tipX + perpX, y: tipY + perpY },                    // Tip left
  ];

  // Uniform full weights for a single-bone binding
  const weights = vertices.map(() => 1.0);

  return {
    boneId: bone.id,
    layerId,
    weights,
    vertices,
  };
}

/**
 * Compute deformed vertex positions based on the transform delta between
 * the bone's current state and its original (bind pose) state.
 *
 * The deformation transforms each vertex from the original bone's local space
 * to the current bone's local space, respecting per-vertex weights.
 *
 * @param binding - The mesh binding containing vertices and weights.
 * @param bone - The bone in its current (posed) state with world transforms.
 * @param originalBone - The bone in its original (bind pose) state.
 * @returns Array of deformed vertex positions in world space.
 */
export function deformMesh(
  binding: MeshBinding,
  bone: Bone,
  originalBone: Bone
): { x: number; y: number }[] {
  // Build the bind pose (original) world matrix and its inverse
  const originalMatrix = buildWorldMatrix(originalBone);
  const originalInverse = originalMatrix.invert();

  // Build the current pose world matrix
  const currentMatrix = buildWorldMatrix(bone);

  // The deformation matrix: transforms from bind-pose world space to current world space
  // vertex_deformed = CurrentWorldMatrix * InverseOriginalWorldMatrix * vertex_original
  const deformMatrix = currentMatrix.multiply(originalInverse);

  return binding.vertices.map((vertex, i) => {
    const weight = binding.weights[i];
    const original = new Vec2(vertex.x, vertex.y);

    if (weight <= 0) {
      return { x: vertex.x, y: vertex.y };
    }

    // Apply the deformation
    const deformed = deformMatrix.transformPoint(original);

    if (weight >= 1) {
      return { x: deformed.x, y: deformed.y };
    }

    // Blend between original and deformed based on weight
    return {
      x: vertex.x + (deformed.x - vertex.x) * weight,
      y: vertex.y + (deformed.y - vertex.y) * weight,
    };
  });
}

/**
 * Automatically compute per-vertex weights for multiple bones based on
 * proximity. Each vertex gets a weight array with one entry per bone.
 *
 * Uses inverse-distance weighting: vertices closer to a bone receive
 * higher weight from that bone. Weights for each vertex are normalized
 * so they sum to 1.
 *
 * @param vertices - Array of vertex positions to compute weights for.
 * @param bones - Array of bones that can influence the vertices.
 * @returns A 2D array [vertexIndex][boneIndex] of normalized weights.
 */
export function computeWeights(
  vertices: { x: number; y: number }[],
  bones: Bone[]
): number[][] {
  if (bones.length === 0) {
    return vertices.map(() => []);
  }

  const weights: number[][] = [];

  for (const vertex of vertices) {
    const boneWeights: number[] = [];

    for (const bone of bones) {
      // Distance from vertex to bone segment (joint to tip)
      const dist = pointToBoneDistance(vertex.x, vertex.y, bone);

      // Inverse distance weight with a small epsilon to avoid division by zero
      const epsilon = 0.001;
      boneWeights.push(1.0 / (dist + epsilon));
    }

    // Normalize weights so they sum to 1
    const totalWeight = boneWeights.reduce((sum, w) => sum + w, 0);

    if (totalWeight > 0) {
      weights.push(boneWeights.map((w) => w / totalWeight));
    } else {
      // Fallback: equal distribution
      const equal = 1.0 / bones.length;
      weights.push(bones.map(() => equal));
    }
  }

  return weights;
}

/**
 * Build a world transform matrix from a bone's world position and rotation.
 */
function buildWorldMatrix(bone: Bone): Matrix2D {
  return Matrix2D.translation(bone.worldX, bone.worldY)
    .multiply(Matrix2D.rotation(bone.worldRotation))
    .multiply(Matrix2D.scaling(bone.localScaleX, bone.localScaleY));
}

/**
 * Compute the shortest distance from a point to a bone's line segment
 * (from joint origin to tip).
 */
function pointToBoneDistance(px: number, py: number, bone: Bone): number {
  const tipX = bone.worldX + Math.cos(bone.worldRotation) * bone.length;
  const tipY = bone.worldY + Math.sin(bone.worldRotation) * bone.length;

  const dx = tipX - bone.worldX;
  const dy = tipY - bone.worldY;
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
