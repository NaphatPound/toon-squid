import type { Point } from '../../types/drawing';
import { Vec2 } from '../../utils/math';
import { catmullRomPoint } from '../../utils/geometry';

export function smoothPoints(points: Point[], smoothing: number): Point[] {
  if (points.length < 3) return points;

  const windowSize = Math.max(1, Math.round(smoothing * 5));
  const smoothed: Point[] = [];

  for (let i = 0; i < points.length; i++) {
    let sx = 0, sy = 0, sp = 0;
    let count = 0;

    for (let j = Math.max(0, i - windowSize); j <= Math.min(points.length - 1, i + windowSize); j++) {
      sx += points[j].x;
      sy += points[j].y;
      sp += points[j].pressure;
      count++;
    }

    smoothed.push({
      x: sx / count,
      y: sy / count,
      pressure: sp / count,
      timestamp: points[i].timestamp,
    });
  }

  return smoothed;
}

export function interpolatePoints(points: Point[], density: number = 2): Point[] {
  if (points.length < 2) return points;

  const result: Point[] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const v0 = new Vec2(p0.x, p0.y);
    const v1 = new Vec2(p1.x, p1.y);
    const v2 = new Vec2(p2.x, p2.y);
    const v3 = new Vec2(p3.x, p3.y);

    const dist = v1.distanceTo(v2);
    const steps = Math.max(1, Math.ceil(dist * density));

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const pt = catmullRomPoint(v0, v1, v2, v3, t);
      const pressure = p1.pressure + (p2.pressure - p1.pressure) * t;
      const timestamp = p1.timestamp + (p2.timestamp - p1.timestamp) * t;

      result.push({
        x: pt.x,
        y: pt.y,
        pressure,
        timestamp,
      });
    }
  }

  return result;
}
