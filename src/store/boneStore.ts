import { create } from 'zustand';
import type { Bone, Skeleton, Animation, Pose, BoneLayerBinding, LayerMesh } from '../types/bone';
import { generateId } from '../utils/math';
import { computeWorldTransforms } from '../engine/bone/BoneSystem';
import { generateLayerMesh } from '../engine/bone/MeshGenerator';

interface BoneState {
  skeleton: Skeleton | null;
  selectedBoneId: string | null;
  hoveredBoneId: string | null;
  animations: Animation[];
  activeAnimationId: string | null;
  currentTime: number;
  isPlaying: boolean;
  bindings: BoneLayerBinding[];
  meshes: LayerMesh[];

  createSkeleton: (name: string) => void;
  addBone: (parentId: string | null, x: number, y: number, length: number, rotation: number) => string;
  removeBone: (id: string) => void;
  reparentBone: (boneId: string, newParentId: string | null) => void;
  updateBone: (id: string, updates: Partial<Bone>) => void;
  selectBone: (id: string | null) => void;
  setHoveredBone: (id: string | null) => void;
  getBone: (id: string) => Bone | undefined;
  getChildBones: (parentId: string) => Bone[];

  addAnimation: (name: string, fps: number, duration: number) => void;
  updateAnimation: (id: string, updates: Partial<Pick<Animation, 'name' | 'fps' | 'duration' | 'loop'>>) => void;
  setActiveAnimation: (id: string | null) => void;
  addPose: (animationId: string, pose: Pose) => void;
  removePose: (animationId: string, poseId: string) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  autoRecord: boolean;
  setAutoRecord: (on: boolean) => void;

  bindLayerToBone: (boneId: string, layerId: string) => void;
  removeBinding: (boneId: string, layerId: string) => void;
  unbindLayer: (layerId: string) => void;
  unbindBone: (boneId: string) => void;
  updateBindingWeight: (boneId: string, layerId: string, weight: number) => void;
  getBindingsForLayer: (layerId: string) => BoneLayerBinding[];
  getBindingsForBone: (boneId: string) => BoneLayerBinding[];
  autoWeightLayer: (layerId: string) => void;
  updateBindPose: (boneId: string) => void;
  generateMesh: (layer: import('../types/drawing').Layer) => void;
  removeMesh: (layerId: string) => void;
  getMesh: (layerId: string) => LayerMesh | undefined;
  showMeshOverlay: boolean;
  setShowMeshOverlay: (show: boolean) => void;
}

export const useBoneStore = create<BoneState>((set, get) => ({
  skeleton: null,
  selectedBoneId: null,
  hoveredBoneId: null,
  animations: [],
  activeAnimationId: null,
  currentTime: 0,
  isPlaying: false,
  bindings: [],
  meshes: [],
  showMeshOverlay: true,

  createSkeleton: (name) =>
    set({
      skeleton: {
        id: generateId(),
        name,
        bones: [],
        rootBoneId: '',
      },
    }),

  addBone: (parentId, x, y, length, rotation) => {
    const boneId = generateId();
    const bone: Bone = {
      id: boneId,
      name: `Bone ${(get().skeleton?.bones.length ?? 0) + 1}`,
      parentId,
      localX: x,
      localY: y,
      localRotation: rotation,
      localScaleX: 1,
      localScaleY: 1,
      worldX: x,
      worldY: y,
      worldRotation: rotation,
      length,
      boundImageId: null,
      color: 'rgba(100, 160, 255, 0.6)',
      visible: true,
    };

    set((s) => {
      if (!s.skeleton) return s;
      const bones = [...s.skeleton.bones, bone];
      return {
        skeleton: {
          ...s.skeleton,
          bones,
          rootBoneId: parentId === null ? boneId : s.skeleton.rootBoneId,
        },
        selectedBoneId: boneId,
      };
    });

    return boneId;
  },

  removeBone: (id) =>
    set((s) => {
      if (!s.skeleton) return s;
      // Remove bone and all children recursively
      const toRemove = new Set<string>();
      const collectChildren = (parentId: string) => {
        toRemove.add(parentId);
        s.skeleton!.bones
          .filter((b) => b.parentId === parentId)
          .forEach((b) => collectChildren(b.id));
      };
      collectChildren(id);

      const bones = s.skeleton.bones.filter((b) => !toRemove.has(b.id));
      return {
        skeleton: { ...s.skeleton, bones },
        selectedBoneId: s.selectedBoneId && toRemove.has(s.selectedBoneId) ? null : s.selectedBoneId,
        bindings: s.bindings.filter((b) => !toRemove.has(b.boneId)),
      };
    }),

  reparentBone: (boneId, newParentId) =>
    set((s) => {
      if (!s.skeleton) return s;
      // Prevent parenting to self or to own descendant
      if (boneId === newParentId) return s;
      const isDescendant = (parentId: string, childId: string): boolean => {
        const children = s.skeleton!.bones.filter((b) => b.parentId === parentId);
        for (const c of children) {
          if (c.id === childId) return true;
          if (isDescendant(c.id, childId)) return true;
        }
        return false;
      };
      if (newParentId && isDescendant(boneId, newParentId)) return s;

      // Compute current world position to preserve visual position
      const worldBones = computeWorldTransforms(s.skeleton.bones);
      const worldBone = worldBones.find((b) => b.id === boneId);
      if (!worldBone) return s;

      let newLocalX = worldBone.worldX;
      let newLocalY = worldBone.worldY;
      let newLocalRotation = worldBone.worldRotation;

      if (newParentId) {
        const parentWorld = worldBones.find((b) => b.id === newParentId);
        if (parentWorld) {
          // Convert world position to parent's local space
          const cos = Math.cos(-parentWorld.worldRotation);
          const sin = Math.sin(-parentWorld.worldRotation);
          const dx = worldBone.worldX - parentWorld.worldX;
          const dy = worldBone.worldY - parentWorld.worldY;
          newLocalX = cos * dx - sin * dy;
          newLocalY = sin * dx + cos * dy;
          newLocalRotation = worldBone.worldRotation - parentWorld.worldRotation;
        }
      }

      return {
        skeleton: {
          ...s.skeleton,
          bones: s.skeleton.bones.map((b) =>
            b.id === boneId
              ? { ...b, parentId: newParentId, localX: newLocalX, localY: newLocalY, localRotation: newLocalRotation }
              : b
          ),
        },
      };
    }),

  updateBone: (id, updates) =>
    set((s) => {
      if (!s.skeleton) return s;
      return {
        skeleton: {
          ...s.skeleton,
          bones: s.skeleton.bones.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        },
      };
    }),

  selectBone: (id) => set({ selectedBoneId: id }),
  setHoveredBone: (id) => set({ hoveredBoneId: id }),

  getBone: (id) => get().skeleton?.bones.find((b) => b.id === id),

  getChildBones: (parentId) =>
    get().skeleton?.bones.filter((b) => b.parentId === parentId) ?? [],

  addAnimation: (name, fps, duration) =>
    set((s) => {
      const anim: Animation = {
        id: generateId(),
        name,
        duration,
        fps,
        poses: [],
        loop: true,
      };
      return {
        animations: [...s.animations, anim],
        activeAnimationId: anim.id,
      };
    }),

  updateAnimation: (id, updates) =>
    set((s) => ({
      animations: s.animations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  setActiveAnimation: (id) => set({ activeAnimationId: id }),

  addPose: (animationId, pose) =>
    set((s) => ({
      animations: s.animations.map((a) =>
        a.id === animationId ? { ...a, poses: [...a.poses, pose] } : a
      ),
    })),

  removePose: (animationId, poseId) =>
    set((s) => ({
      animations: s.animations.map((a) =>
        a.id === animationId
          ? { ...a, poses: a.poses.filter((p) => p.id !== poseId) }
          : a
      ),
    })),

  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  autoRecord: false,
  setAutoRecord: (on) => set({ autoRecord: on }),

  bindLayerToBone: (boneId, layerId) => {
    const { skeleton, bindings } = get();
    if (!skeleton) return;

    // Already bound? skip
    if (bindings.some((b) => b.boneId === boneId && b.layerId === layerId)) return;

    // Compute world transforms to get bind pose
    const worldBones = computeWorldTransforms(skeleton.bones);
    const bone = worldBones.find((b) => b.id === boneId);
    if (!bone) return;

    const binding: BoneLayerBinding = {
      boneId,
      layerId,
      bindWorldX: bone.worldX,
      bindWorldY: bone.worldY,
      bindWorldRotation: bone.worldRotation,
      bindScaleX: bone.localScaleX,
      bindScaleY: bone.localScaleY,
      weight: 1.0,
    };
    set((s) => ({
      bindings: [...s.bindings, binding],
    }));
  },

  removeBinding: (boneId, layerId) =>
    set((s) => ({
      bindings: s.bindings.filter(
        (b) => !(b.boneId === boneId && b.layerId === layerId)
      ),
    })),

  unbindLayer: (layerId) =>
    set((s) => ({
      bindings: s.bindings.filter((b) => b.layerId !== layerId),
    })),

  unbindBone: (boneId) =>
    set((s) => ({
      bindings: s.bindings.filter((b) => b.boneId !== boneId),
    })),

  updateBindingWeight: (boneId, layerId, weight) =>
    set((s) => ({
      bindings: s.bindings.map((b) =>
        b.boneId === boneId && b.layerId === layerId
          ? { ...b, weight: Math.max(0, Math.min(1, weight)) }
          : b
      ),
    })),

  getBindingsForLayer: (layerId) =>
    get().bindings.filter((b) => b.layerId === layerId),

  getBindingsForBone: (boneId) =>
    get().bindings.filter((b) => b.boneId === boneId),

  setShowMeshOverlay: (show) => set({ showMeshOverlay: show }),

  generateMesh: (layer) => {
    const { skeleton, bindings } = get();
    if (!skeleton || skeleton.bones.length === 0) return;

    // Get bones bound to this layer
    const layerBindings = bindings.filter((b) => b.layerId === layer.id);
    if (layerBindings.length === 0) return;

    // Get world-transformed bones
    const worldBones = computeWorldTransforms(skeleton.bones);
    // Only use bones that are bound to this layer
    const boundBoneIds = new Set(layerBindings.map((b) => b.boneId));
    const relevantBones = worldBones.filter((b) => boundBoneIds.has(b.id));

    const mesh = generateLayerMesh(layer, relevantBones);
    if (!mesh) return;

    set((s) => ({
      meshes: [...s.meshes.filter((m) => m.layerId !== layer.id), mesh],
    }));
  },

  removeMesh: (layerId) =>
    set((s) => ({
      meshes: s.meshes.filter((m) => m.layerId !== layerId),
    })),

  getMesh: (layerId) =>
    get().meshes.find((m) => m.layerId === layerId),

  updateBindPose: (boneId) => {
    const { skeleton } = get();
    if (!skeleton) return;

    const worldBones = computeWorldTransforms(skeleton.bones);
    const bone = worldBones.find((b) => b.id === boneId);
    if (!bone) return;

    set((s) => ({
      bindings: s.bindings.map((b) =>
        b.boneId === boneId
          ? {
              ...b,
              bindWorldX: bone.worldX,
              bindWorldY: bone.worldY,
              bindWorldRotation: bone.worldRotation,
              bindScaleX: bone.localScaleX,
              bindScaleY: bone.localScaleY,
            }
          : b
      ),
    }));
  },

  autoWeightLayer: (layerId) => {
    const { skeleton, bindings } = get();
    if (!skeleton) return;

    const layerBindings = bindings.filter((b) => b.layerId === layerId);
    if (layerBindings.length <= 1) {
      // Single bone → weight = 1.0
      if (layerBindings.length === 1) {
        set((s) => ({
          bindings: s.bindings.map((b) =>
            b.layerId === layerId ? { ...b, weight: 1.0 } : b
          ),
        }));
      }
      return;
    }

    // Compute world transforms for distance calculation
    const worldBones = computeWorldTransforms(skeleton.bones);

    // Find the center of all bound bones' bind positions as reference
    let cx = 0, cy = 0;
    for (const lb of layerBindings) {
      cx += lb.bindWorldX;
      cy += lb.bindWorldY;
    }
    cx /= layerBindings.length;
    cy /= layerBindings.length;

    // Compute inverse-distance weights from each bone to the center
    const epsilon = 0.001;
    const rawWeights: number[] = [];
    for (const lb of layerBindings) {
      const bone = worldBones.find((b) => b.id === lb.boneId);
      if (!bone) {
        rawWeights.push(epsilon);
        continue;
      }
      // Use bone length as influence radius — longer bones get more weight
      const boneInfluence = bone.length > 0 ? bone.length : 1;
      // Inverse distance from bone midpoint to center
      const midX = bone.worldX + Math.cos(bone.worldRotation) * bone.length * 0.5;
      const midY = bone.worldY + Math.sin(bone.worldRotation) * bone.length * 0.5;
      const dist = Math.sqrt((midX - cx) ** 2 + (midY - cy) ** 2);
      rawWeights.push(boneInfluence / (dist + epsilon));
    }

    // Normalize so weights sum to 1
    const total = rawWeights.reduce((s, w) => s + w, 0);

    set((s) => ({
      bindings: s.bindings.map((b) => {
        if (b.layerId !== layerId) return b;
        const idx = layerBindings.findIndex(
          (lb) => lb.boneId === b.boneId && lb.layerId === b.layerId
        );
        if (idx < 0) return b;
        return { ...b, weight: total > 0 ? rawWeights[idx] / total : 1 / layerBindings.length };
      }),
    }));
  },
}));
