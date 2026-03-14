import type { Bone } from '../../types/bone';
import { Matrix2D, Vec2, distance } from '../../utils/math';

/**
 * Build the local transform matrix for a bone.
 * Order: Translate(localX, localY) * Rotate(localRotation) * Scale(localScaleX, localScaleY)
 */
function buildLocalMatrix(bone: Bone): Matrix2D {
  return Matrix2D.translation(bone.localX, bone.localY)
    .multiply(Matrix2D.rotation(bone.localRotation))
    .multiply(Matrix2D.scaling(bone.localScaleX, bone.localScaleY));
}

/**
 * Extract world rotation from a 2D transform matrix.
 * Uses atan2 on the first column to recover the rotation angle.
 */
function extractRotation(m: Matrix2D): number {
  return Math.atan2(m.b, m.a);
}

/**
 * Build a map from bone ID to bone for fast lookup.
 */
function buildBoneMap(bones: Bone[]): Map<string, Bone> {
  const map = new Map<string, Bone>();
  for (const bone of bones) {
    map.set(bone.id, bone);
  }
  return map;
}

/**
 * Topologically sort bones so that parents always appear before children.
 * This ensures we can compute world transforms in a single forward pass.
 */
function topologicalSort(bones: Bone[]): Bone[] {
  const boneMap = buildBoneMap(bones);
  const sorted: Bone[] = [];
  const visited = new Set<string>();

  function visit(bone: Bone): void {
    if (visited.has(bone.id)) return;

    if (bone.parentId !== null) {
      const parent = boneMap.get(bone.parentId);
      if (parent) {
        visit(parent);
      }
    }

    visited.add(bone.id);
    sorted.push(bone);
  }

  for (const bone of bones) {
    visit(bone);
  }

  return sorted;
}

/**
 * Compute world transforms for all bones by traversing from roots to leaves.
 * WorldTransform = Parent.WorldTransform x Local.Transform
 * Returns a new array of bones with updated worldX, worldY, worldRotation.
 */
export function computeWorldTransforms(bones: Bone[]): Bone[] {
  const sorted = topologicalSort(bones);
  const worldMatrices = new Map<string, Matrix2D>();
  const result: Bone[] = [];

  for (const bone of sorted) {
    const localMatrix = buildLocalMatrix(bone);
    let worldMatrix: Matrix2D;

    if (bone.parentId === null) {
      worldMatrix = localMatrix;
    } else {
      const parentWorld = worldMatrices.get(bone.parentId);
      if (parentWorld) {
        worldMatrix = parentWorld.multiply(localMatrix);
      } else {
        worldMatrix = localMatrix;
      }
    }

    worldMatrices.set(bone.id, worldMatrix);

    const origin = worldMatrix.transformPoint(Vec2.zero());
    const worldRotation = extractRotation(worldMatrix);

    result.push({
      ...bone,
      worldX: origin.x,
      worldY: origin.y,
      worldRotation,
    });
  }

  return result;
}

/**
 * Get the chain of bones from the root down to the bone with the given ID.
 * Returns an array ordered from root ancestor to the target bone.
 */
export function getBoneChain(bones: Bone[], boneId: string): Bone[] {
  const boneMap = buildBoneMap(bones);
  const chain: Bone[] = [];
  let current = boneMap.get(boneId);

  while (current) {
    chain.unshift(current);
    if (current.parentId === null) break;
    current = boneMap.get(current.parentId);
  }

  return chain;
}

/**
 * Get the world position of a bone's tip (the end point opposite the joint).
 * The tip extends from the bone's world origin along its world rotation by its length.
 */
export function getBoneTip(bone: Bone): { x: number; y: number } {
  return {
    x: bone.worldX + Math.cos(bone.worldRotation) * bone.length,
    y: bone.worldY + Math.sin(bone.worldRotation) * bone.length,
  };
}

/**
 * Hit test on bone tip positions (the end point of each bone).
 * Returns the nearest bone whose tip is within the threshold distance, or null.
 */
export function hitTestBoneTip(
  bones: Bone[],
  x: number,
  y: number,
  threshold: number
): Bone | null {
  let closestBone: Bone | null = null;
  let closestDist = Infinity;

  for (const bone of bones) {
    if (!bone.visible) continue;

    const tip = getBoneTip(bone);
    const dist = distance(x, y, tip.x, tip.y);

    if (dist < threshold && dist < closestDist) {
      closestDist = dist;
      closestBone = bone;
    }
  }

  return closestBone;
}

/**
 * Find the nearest bone to a given point within the distance threshold.
 * Tests against the bone's line segment (from joint origin to tip).
 * Returns null if no bone is within the threshold.
 */
export function hitTestBone(
  bones: Bone[],
  x: number,
  y: number,
  threshold: number
): Bone | null {
  let closestBone: Bone | null = null;
  let closestDist = Infinity;

  for (const bone of bones) {
    if (!bone.visible) continue;

    const tip = getBoneTip(bone);
    const dist = pointToSegmentDistance(x, y, bone.worldX, bone.worldY, tip.x, tip.y);

    if (dist < threshold && dist < closestDist) {
      closestDist = dist;
      closestBone = bone;
    }
  }

  return closestBone;
}

/**
 * Hit test specifically on bone joint positions (the origin/pivot point of each bone).
 * Returns the nearest bone whose joint is within the threshold distance, or null.
 */
export function hitTestBoneJoint(
  bones: Bone[],
  x: number,
  y: number,
  threshold: number
): Bone | null {
  let closestBone: Bone | null = null;
  let closestDist = Infinity;

  for (const bone of bones) {
    if (!bone.visible) continue;

    const dist = distance(x, y, bone.worldX, bone.worldY);

    if (dist < threshold && dist < closestDist) {
      closestDist = dist;
      closestBone = bone;
    }
  }

  return closestBone;
}

/**
 * Compute the shortest distance from point (px, py) to line segment (ax, ay)-(bx, by).
 */
function pointToSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return distance(px, py, ax, ay);
  }

  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = ax + t * dx;
  const projY = ay + t * dy;

  return distance(px, py, projX, projY);
}
