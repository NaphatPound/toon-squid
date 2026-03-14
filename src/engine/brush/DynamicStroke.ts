import type { Point, BrushSettings } from '../../types/drawing';
import { clamp, distance } from '../../utils/math';
import { smoothPoints, interpolatePoints } from './StrokeSmoothing';

export interface StampPoint {
  x: number;
  y: number;
  width: number;
  opacity: number;
  pressure: number;
}

export function computeDynamicStroke(
  rawPoints: Point[],
  settings: BrushSettings
): StampPoint[] {
  if (rawPoints.length === 0) return [];

  // 1. Smooth input points
  const smoothed = smoothPoints(rawPoints, settings.smoothing);

  // 2. Interpolate for density
  const interpolated = interpolatePoints(smoothed, 1 / Math.max(0.05, settings.spacing));

  // 3. Compute stamps
  const stamps: StampPoint[] = [];
  const totalPoints = interpolated.length;
  const taperLength = Math.min(10, Math.floor(totalPoints * 0.15));

  for (let i = 0; i < totalPoints; i++) {
    const pt = interpolated[i];

    // Velocity-based thinning
    let velocity = 0;
    if (i > 0) {
      const prev = interpolated[i - 1];
      const dt = (pt.timestamp - prev.timestamp) / 1000;
      if (dt > 0) {
        velocity = distance(pt.x, pt.y, prev.x, prev.y) / dt;
      }
    }
    const velocityFactor = 1.0 - clamp(velocity / 2000, 0, 0.5);

    // Width calculation
    let width = settings.size;
    if (settings.pressureSize) {
      width *= pt.pressure;
    }
    width *= velocityFactor;

    // Taper at start and end
    if (i < taperLength) {
      width *= (i + 1) / (taperLength + 1);
    }
    if (i >= totalPoints - taperLength) {
      width *= (totalPoints - i) / (taperLength + 1);
    }

    width = Math.max(0.5, width);

    // Opacity
    let opacity = settings.opacity * settings.flow;
    if (settings.pressureOpacity) {
      opacity *= pt.pressure;
    }

    stamps.push({
      x: pt.x,
      y: pt.y,
      width,
      opacity: clamp(opacity, 0, 1),
      pressure: pt.pressure,
    });
  }

  return stamps;
}

export function spacedStamps(stamps: StampPoint[], spacing: number, brushSize: number): StampPoint[] {
  if (stamps.length === 0) return [];

  const minDist = Math.max(1, brushSize * spacing);
  const result: StampPoint[] = [stamps[0]];
  let accumulated = 0;

  for (let i = 1; i < stamps.length; i++) {
    const dist = distance(stamps[i - 1].x, stamps[i - 1].y, stamps[i].x, stamps[i].y);
    accumulated += dist;

    if (accumulated >= minDist) {
      result.push(stamps[i]);
      accumulated = 0;
    }
  }

  return result;
}
