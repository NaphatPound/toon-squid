import type { Bone } from '../../types/bone';
import { angle, normalizeAngle } from '../../utils/math';
import { computeWorldTransforms, getBoneTip } from './BoneSystem';

/** Optional per-bone angle constraints for IK solving. */
export interface IKConstraint {
  boneId: string;
  minAngle: number;
  maxAngle: number;
}

/**
 * Solve inverse kinematics using Cyclic Coordinate Descent (CCD).
 *
 * The algorithm iteratively adjusts each bone in the chain (from end effector's
 * parent back to the chain root) to minimize the distance between the end effector
 * and the target position.
 *
 * @param bones - All bones in the skeleton (with current world transforms).
 * @param chainIds - Ordered array of bone IDs forming the IK chain, from root to end effector.
 * @param targetX - Target world X position.
 * @param targetY - Target world Y position.
 * @param iterations - Maximum number of CCD iterations (default: 10).
 * @param constraints - Optional angle constraints per bone.
 * @returns New bone array with updated local rotations and recomputed world transforms.
 */
export function solveIK(
  bones: Bone[],
  chainIds: string[],
  targetX: number,
  targetY: number,
  iterations: number = 10,
  constraints?: IKConstraint[]
): Bone[] {
  if (chainIds.length < 2) return bones;

  // Build a mutable copy of all bones
  let workingBones = bones.map((b) => ({ ...b }));

  // Build constraint lookup
  const constraintMap = new Map<string, IKConstraint>();
  if (constraints) {
    for (const c of constraints) {
      constraintMap.set(c.boneId, c);
    }
  }

  const endEffectorId = chainIds[chainIds.length - 1];
  const convergenceThreshold = 0.5;

  for (let iter = 0; iter < iterations; iter++) {
    // Recompute world transforms each iteration
    workingBones = computeWorldTransforms(workingBones);

    // Check convergence: distance from end effector tip to target
    const endEffector = findBone(workingBones, endEffectorId);
    if (!endEffector) break;

    const effectorTip = getBoneTip(endEffector);
    const dx = targetX - effectorTip.x;
    const dy = targetY - effectorTip.y;

    if (dx * dx + dy * dy < convergenceThreshold * convergenceThreshold) {
      break;
    }

    // Iterate from end effector's parent back to chain root
    for (let i = chainIds.length - 2; i >= 0; i--) {
      const boneId = chainIds[i];
      const boneIndex = workingBones.findIndex((b) => b.id === boneId);
      if (boneIndex === -1) continue;

      // Recompute world transforms to get fresh positions after previous adjustments
      workingBones = computeWorldTransforms(workingBones);
      const updatedBone = findBone(workingBones, boneId)!;
      const updatedEndEffector = findBone(workingBones, endEffectorId)!;
      const currentTip = getBoneTip(updatedEndEffector);

      // Angle from this bone's world position to the current end effector tip
      const angleToEffector = angle(
        updatedBone.worldX,
        updatedBone.worldY,
        currentTip.x,
        currentTip.y
      );

      // Angle from this bone's world position to the target
      const angleToTarget = angle(
        updatedBone.worldX,
        updatedBone.worldY,
        targetX,
        targetY
      );

      // The rotation delta needed
      let rotationDelta = normalizeAngle(angleToTarget - angleToEffector);

      // Apply the delta to the bone's local rotation
      let newLocalRotation = normalizeAngle(
        workingBones[boneIndex].localRotation + rotationDelta
      );

      // Apply angle constraints if specified
      const constraint = constraintMap.get(boneId);
      if (constraint) {
        newLocalRotation = clampAngle(
          newLocalRotation,
          constraint.minAngle,
          constraint.maxAngle
        );
      }

      workingBones[boneIndex] = {
        ...workingBones[boneIndex],
        localRotation: newLocalRotation,
      };
    }
  }

  // Final world transform computation
  return computeWorldTransforms(workingBones);
}

/**
 * Find a bone by ID in the bone array.
 */
function findBone(bones: Bone[], id: string): Bone | null {
  return bones.find((b) => b.id === id) ?? null;
}

/**
 * Clamp an angle (in radians) to the range [minAngle, maxAngle].
 * Angles are normalized before clamping.
 */
function clampAngle(angle: number, minAngle: number, maxAngle: number): number {
  const normalized = normalizeAngle(angle);
  const min = normalizeAngle(minAngle);
  const max = normalizeAngle(maxAngle);

  // Handle the simple case where min < max (no wraparound)
  if (min <= max) {
    if (normalized < min) return min;
    if (normalized > max) return max;
    return normalized;
  }

  // Wraparound case: valid range spans across -PI/PI boundary
  if (normalized >= min || normalized <= max) {
    return normalized;
  }

  // Find which boundary is closer
  const distToMin = Math.abs(normalizeAngle(normalized - min));
  const distToMax = Math.abs(normalizeAngle(normalized - max));
  return distToMin < distToMax ? min : max;
}
