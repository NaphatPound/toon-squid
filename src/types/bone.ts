export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  localX: number;
  localY: number;
  localRotation: number;
  localScaleX: number;
  localScaleY: number;
  worldX: number;
  worldY: number;
  worldRotation: number;
  length: number;
  boundImageId: string | null;
  color: string;
  visible: boolean;
}

export interface Skeleton {
  id: string;
  name: string;
  bones: Bone[];
  rootBoneId: string;
}

export interface BoneTransform {
  rotation: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

export interface Pose {
  id: string;
  name: string;
  time: number;
  boneTransforms: Record<string, BoneTransform>;
}

export interface Animation {
  id: string;
  name: string;
  duration: number;
  fps: number;
  poses: Pose[];
  loop: boolean;
}

/**
 * Binding between a bone and a layer. Records the bone's world transform
 * at bind time so we can compute the delta when animating.
 */
export interface BoneLayerBinding {
  boneId: string;
  layerId: string;
  /** Bone world position at bind time */
  bindWorldX: number;
  bindWorldY: number;
  /** Bone world rotation at bind time */
  bindWorldRotation: number;
  /** Bone world scale at bind time */
  bindScaleX: number;
  bindScaleY: number;
  /** Influence weight 0..1 */
  weight: number;
}
