import { Vec2 } from './math';

export function pointToLineDistance(
  point: Vec2,
  lineStart: Vec2,
  lineEnd: Vec2
): number {
  const line = lineEnd.sub(lineStart);
  const len = line.length();
  if (len === 0) return point.distanceTo(lineStart);

  const t = Math.max(0, Math.min(1, point.sub(lineStart).dot(line) / (len * len)));
  const projection = lineStart.add(line.mul(t));
  return point.distanceTo(projection);
}

export function lineLineIntersection(
  a1: Vec2, a2: Vec2,
  b1: Vec2, b2: Vec2
): Vec2 | null {
  const d1 = a2.sub(a1);
  const d2 = b2.sub(b1);
  const cross = d1.cross(d2);

  if (Math.abs(cross) < 1e-10) return null;

  const d = b1.sub(a1);
  const t = d.cross(d2) / cross;
  const u = d.cross(d1) / cross;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return a1.add(d1.mul(t));
  }
  return null;
}

export function evaluateBezier(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  t: number
): Vec2 {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return new Vec2(
    mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
  );
}

export function evaluateQuadraticBezier(
  p0: Vec2, p1: Vec2, p2: Vec2,
  t: number
): Vec2 {
  const mt = 1 - t;
  return new Vec2(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
  );
}

export function catmullRomPoint(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  t: number, alpha: number = 0.5
): Vec2 {
  const t2 = t * t;
  const t3 = t2 * t;

  const f0 = -alpha * t3 + 2 * alpha * t2 - alpha * t;
  const f1 = (2 - alpha) * t3 + (alpha - 3) * t2 + 1;
  const f2 = (alpha - 2) * t3 + (3 - 2 * alpha) * t2 + alpha * t;
  const f3 = alpha * t3 - alpha * t2;

  return new Vec2(
    f0 * p0.x + f1 * p1.x + f2 * p2.x + f3 * p3.x,
    f0 * p0.y + f1 * p1.y + f2 * p2.y + f3 * p3.y
  );
}

export function pointInRect(
  px: number, py: number,
  rx: number, ry: number,
  rw: number, rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}
