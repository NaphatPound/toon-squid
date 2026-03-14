import type { Bone } from '../../types/bone';
import { getBoneTip } from './BoneSystem';

const COLOR_SELECTED = '#e3b341';
const COLOR_HOVERED = '#f0d070';
const COLOR_DEFAULT = 'rgba(100, 160, 255, 0.6)';
const JOINT_RADIUS = 4;
const BONE_WIDTH_RATIO = 0.2;
const CROSSHAIR_SIZE = 8;

/**
 * Render the bone overlay onto a canvas context.
 * Draws each visible bone as a diamond/kite shape with joint circles.
 *
 * @param ctx - The 2D canvas rendering context for the overlay layer.
 * @param bones - Array of bones with computed world transforms.
 * @param selectedId - ID of the currently selected bone, or null.
 * @param hoveredId - ID of the currently hovered bone, or null.
 */
export function renderBones(
  ctx: CanvasRenderingContext2D,
  bones: Bone[],
  selectedId: string | null,
  hoveredId: string | null
): void {
  ctx.save();

  // Draw bone shapes (back to front: default, then hovered, then selected)
  for (const bone of bones) {
    if (!bone.visible) continue;
    if (bone.id === selectedId || bone.id === hoveredId) continue;
    drawBoneShape(ctx, bone, bone.color || COLOR_DEFAULT);
  }

  // Draw hovered bone on top of defaults
  if (hoveredId) {
    const hoveredBone = bones.find((b) => b.id === hoveredId);
    if (hoveredBone && hoveredBone.visible && hoveredId !== selectedId) {
      drawBoneShape(ctx, hoveredBone, COLOR_HOVERED);
    }
  }

  // Draw selected bone on top of everything
  if (selectedId) {
    const selectedBone = bones.find((b) => b.id === selectedId);
    if (selectedBone && selectedBone.visible) {
      drawBoneShape(ctx, selectedBone, COLOR_SELECTED);
    }
  }

  // Draw joint circles and tip handles for all visible bones
  for (const bone of bones) {
    if (!bone.visible) continue;

    const color =
      bone.id === selectedId
        ? COLOR_SELECTED
        : bone.id === hoveredId
          ? COLOR_HOVERED
          : bone.color || COLOR_DEFAULT;

    drawJointCircle(ctx, bone.worldX, bone.worldY, color);

    // Draw tip handle (smaller circle at bone end for resizing)
    const tip = getBoneTip(bone);
    drawTipHandle(ctx, tip.x, tip.y, color);
  }

  ctx.restore();
}

/**
 * Draw a single bone as a diamond/kite shape.
 * The four vertices are: joint (origin), left edge, tip, right edge.
 * Width is proportional to bone length.
 */
function drawBoneShape(
  ctx: CanvasRenderingContext2D,
  bone: Bone,
  color: string
): void {
  if (bone.length <= 0) return;

  const tip = getBoneTip(bone);
  const halfWidth = bone.length * BONE_WIDTH_RATIO;

  // Direction vector from joint to tip
  const dx = tip.x - bone.worldX;
  const dy = tip.y - bone.worldY;

  // Perpendicular vector (normalized and scaled by halfWidth)
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const perpX = (-dy / len) * halfWidth;
  const perpY = (dx / len) * halfWidth;

  // The widest point is at ~25% along the bone length
  const midFraction = 0.25;
  const midX = bone.worldX + dx * midFraction;
  const midY = bone.worldY + dy * midFraction;

  // Four points: joint, left edge, tip, right edge
  ctx.beginPath();
  ctx.moveTo(bone.worldX, bone.worldY); // Joint (origin)
  ctx.lineTo(midX + perpX, midY + perpY); // Left edge
  ctx.lineTo(tip.x, tip.y); // Tip
  ctx.lineTo(midX - perpX, midY - perpY); // Right edge
  ctx.closePath();

  // Fill with semi-transparent version of the color
  ctx.fillStyle = colorWithAlpha(color, 0.3);
  ctx.fill();

  // Stroke outline
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/**
 * Draw a small filled circle at a bone's joint position.
 */
function drawJointCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  ctx.beginPath();
  ctx.arc(x, y, JOINT_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Draw a small diamond handle at a bone's tip for resizing.
 */
function drawTipHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  const s = 3;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * Draw an IK target handle as a crosshair at the given position.
 */
export function renderIKTarget(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string = COLOR_SELECTED
): void {
  ctx.save();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(x - CROSSHAIR_SIZE, y);
  ctx.lineTo(x + CROSSHAIR_SIZE, y);
  ctx.stroke();

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(x, y - CROSSHAIR_SIZE);
  ctx.lineTo(x, y + CROSSHAIR_SIZE);
  ctx.stroke();

  // Small circle at center
  ctx.beginPath();
  ctx.arc(x, y, CROSSHAIR_SIZE * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Convert a CSS color string to one with a specified alpha value.
 * Supports hex (#rrggbb), rgba, and named-style rgba fallback.
 */
function colorWithAlpha(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  // Handle existing rgba - replace the alpha
  const rgbaMatch = color.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)/
  );
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
  }

  // Fallback: return as-is
  return color;
}
