export class Vec2 {
  x: number;
  y: number;
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  static from(x: number, y: number): Vec2 {
    return new Vec2(x, y);
  }

  static zero(): Vec2 {
    return new Vec2(0, 0);
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y);
  }

  sub(v: Vec2): Vec2 {
    return new Vec2(this.x - v.x, this.y - v.y);
  }

  mul(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  div(s: number): Vec2 {
    return new Vec2(this.x / s, this.y / s);
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vec2): number {
    return this.x * v.y - this.y * v.x;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  normalize(): Vec2 {
    const len = this.length();
    if (len === 0) return new Vec2(0, 0);
    return this.div(len);
  }

  distanceTo(v: Vec2): number {
    return this.sub(v).length();
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle: number): Vec2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  lerp(v: Vec2, t: number): Vec2 {
    return new Vec2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  equals(v: Vec2): boolean {
    return this.x === v.x && this.y === v.y;
  }
}

export class Matrix2D {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
  constructor(
    a: number = 1, b: number = 0,
    c: number = 0, d: number = 1,
    tx: number = 0, ty: number = 0
  ) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    this.tx = tx;
    this.ty = ty;
  }

  static identity(): Matrix2D {
    return new Matrix2D();
  }

  static translation(x: number, y: number): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, x, y);
  }

  static rotation(angle: number): Matrix2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Matrix2D(cos, sin, -sin, cos, 0, 0);
  }

  static scaling(sx: number, sy: number): Matrix2D {
    return new Matrix2D(sx, 0, 0, sy, 0, 0);
  }

  multiply(m: Matrix2D): Matrix2D {
    return new Matrix2D(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.tx + this.c * m.ty + this.tx,
      this.b * m.tx + this.d * m.ty + this.ty
    );
  }

  transformPoint(p: Vec2): Vec2 {
    return new Vec2(
      this.a * p.x + this.c * p.y + this.tx,
      this.b * p.x + this.d * p.y + this.ty
    );
  }

  invert(): Matrix2D {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) return Matrix2D.identity();
    const invDet = 1 / det;
    return new Matrix2D(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.ty - this.d * this.tx) * invDet,
      (this.b * this.tx - this.a * this.ty) * invDet
    );
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export function shortestAngleDiff(from: number, to: number): number {
  return normalizeAngle(to - from);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}
