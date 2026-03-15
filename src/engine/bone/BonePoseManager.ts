import type { Bone, BoneTransform, Animation, Pose } from '../../types/bone';
import { lerp as lerpNum, normalizeAngle, shortestAngleDiff, clamp } from '../../utils/math';

/**
 * Interpolate between two poses at parameter t (0 = poseA, 1 = poseB).
 * Uses linear interpolation for translation and scale, and shortest-path
 * angle interpolation for rotation.
 *
 * @param poseA - The starting pose.
 * @param poseB - The ending pose.
 * @param t - Interpolation parameter in [0, 1].
 * @returns A merged set of bone transforms blending both poses.
 */
export function interpolatePoses(
  poseA: Pose,
  poseB: Pose,
  t: number
): Record<string, BoneTransform> {
  const result: Record<string, BoneTransform> = {};

  // Collect all bone IDs present in either pose
  const allBoneIds = new Set<string>([
    ...Object.keys(poseA.boneTransforms),
    ...Object.keys(poseB.boneTransforms),
  ]);

  const identity: BoneTransform = {
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    translateX: 0,
    translateY: 0,
  };

  for (const boneId of allBoneIds) {
    const a = poseA.boneTransforms[boneId] ?? identity;
    const b = poseB.boneTransforms[boneId] ?? identity;

    result[boneId] = interpolateTransform(a, b, t);
  }

  return result;
}

/**
 * Interpolate between two individual BoneTransforms.
 */
function interpolateTransform(
  a: BoneTransform,
  b: BoneTransform,
  t: number
): BoneTransform {
  // Shortest-path rotation interpolation
  const rotDiff = shortestAngleDiff(a.rotation, b.rotation);
  const rotation = normalizeAngle(a.rotation + rotDiff * t);

  return {
    rotation,
    scaleX: lerpNum(a.scaleX, b.scaleX, t),
    scaleY: lerpNum(a.scaleY, b.scaleY, t),
    translateX: lerpNum(a.translateX, b.translateX, t),
    translateY: lerpNum(a.translateY, b.translateY, t),
  };
}

/**
 * Get the interpolated bone transforms at a specific time in an animation.
 * Finds the two surrounding keyframe poses and interpolates between them.
 *
 * @param animation - The animation containing keyframe poses.
 * @param time - The current time (in seconds) to evaluate.
 * @returns The interpolated bone transforms at the given time.
 */
export function getPoseAtTime(
  animation: Animation,
  time: number
): Record<string, BoneTransform> {
  const poses = animation.poses;

  if (poses.length === 0) {
    return {};
  }

  // Handle looping: wrap time within [0, duration)
  let evalTime = time;
  if (animation.loop && animation.duration > 0) {
    evalTime = ((time % animation.duration) + animation.duration) % animation.duration;
  } else {
    evalTime = clamp(time, 0, animation.duration);
  }

  // Sort poses by time for safe interpolation
  const sorted = [...poses].sort((a, b) => a.time - b.time);

  // Before first keyframe → rest pose (no effect)
  if (evalTime < sorted[0].time) {
    return {};
  }

  // Exactly at first keyframe
  if (sorted.length === 1 || evalTime <= sorted[0].time) {
    // With only one keyframe, only apply it at its exact time
    // (within half-frame tolerance)
    const frameDur = 1 / animation.fps;
    if (sorted.length === 1 && Math.abs(evalTime - sorted[0].time) > frameDur * 0.5) {
      return {};
    }
    return { ...sorted[0].boneTransforms };
  }

  // After last keyframe
  if (evalTime > sorted[sorted.length - 1].time) {
    if (animation.loop && sorted.length >= 2) {
      // Interpolate from last keyframe back to first for looping
      const lastPose = sorted[sorted.length - 1];
      const firstPose = sorted[0];
      const segmentDuration = animation.duration - lastPose.time + firstPose.time;

      if (segmentDuration > 0) {
        const segmentT = (evalTime - lastPose.time) / segmentDuration;
        return interpolatePoses(lastPose, firstPose, clamp(segmentT, 0, 1));
      }
    }
    // Non-looping: no effect after last keyframe → rest pose
    return {};
  }

  // Find surrounding keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    const poseA = sorted[i];
    const poseB = sorted[i + 1];

    if (evalTime >= poseA.time && evalTime <= poseB.time) {
      const segmentDuration = poseB.time - poseA.time;

      if (segmentDuration === 0) {
        return { ...poseB.boneTransforms };
      }

      const t = (evalTime - poseA.time) / segmentDuration;
      return interpolatePoses(poseA, poseB, t);
    }
  }

  // Fallback (should not reach here)
  return { ...sorted[sorted.length - 1].boneTransforms };
}

/**
 * Apply bone transforms to a bone array, updating local transform properties.
 * Returns a new array with the transforms applied (does not mutate the input).
 *
 * @param bones - The skeleton bones to apply transforms to.
 * @param transforms - A mapping of bone ID to transform overrides.
 * @returns New bone array with local transforms updated.
 */
export function applyPose(
  bones: Bone[],
  transforms: Record<string, BoneTransform>
): Bone[] {
  return bones.map((bone) => {
    const transform = transforms[bone.id];
    if (!transform) return bone;

    return {
      ...bone,
      localRotation: transform.rotation,
      localScaleX: transform.scaleX,
      localScaleY: transform.scaleY,
      localX: transform.translateX,
      localY: transform.translateY,
    };
  });
}

/**
 * Apply an easing function to an interpolation parameter.
 *
 * @param t - Input value in [0, 1].
 * @param type - Easing type.
 * @returns Eased value in [0, 1].
 */
export function ease(
  t: number,
  type: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
): number {
  const clamped = clamp(t, 0, 1);

  switch (type) {
    case 'linear':
      return clamped;

    case 'ease-in':
      // Quadratic ease-in: accelerating from zero velocity
      return clamped * clamped;

    case 'ease-out':
      // Quadratic ease-out: decelerating to zero velocity
      return clamped * (2 - clamped);

    case 'ease-in-out':
      // Quadratic ease-in-out: acceleration until halfway, then deceleration
      if (clamped < 0.5) {
        return 2 * clamped * clamped;
      }
      return -1 + (4 - 2 * clamped) * clamped;

    default:
      return clamped;
  }
}
