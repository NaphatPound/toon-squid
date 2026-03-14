import { Vec2, Matrix2D, clamp } from '../../utils/math';

export class ViewportTransform {
  private _x = 0;
  private _y = 0;
  private _zoom = 1;
  private _rotation = 0;
  private _matrix: Matrix2D = Matrix2D.identity();
  private _inverse: Matrix2D = Matrix2D.identity();
  private _dirty = true;

  get x(): number { return this._x; }
  get y(): number { return this._y; }
  get zoom(): number { return this._zoom; }
  get rotation(): number { return this._rotation; }

  get matrix(): Matrix2D {
    if (this._dirty) this.recompute();
    return this._matrix;
  }

  get inverse(): Matrix2D {
    if (this._dirty) this.recompute();
    return this._inverse;
  }

  private recompute(): void {
    this._matrix = Matrix2D.translation(this._x, this._y)
      .multiply(Matrix2D.rotation(this._rotation))
      .multiply(Matrix2D.scaling(this._zoom, this._zoom));
    this._inverse = this._matrix.invert();
    this._dirty = false;
  }

  pan(dx: number, dy: number): void {
    this._x += dx;
    this._y += dy;
    this._dirty = true;
  }

  panTo(x: number, y: number): void {
    this._x = x;
    this._y = y;
    this._dirty = true;
  }

  zoomAt(factor: number, screenX: number, screenY: number): void {
    const newZoom = clamp(this._zoom * factor, 0.05, 64);
    const actualFactor = newZoom / this._zoom;

    this._x = screenX - (screenX - this._x) * actualFactor;
    this._y = screenY - (screenY - this._y) * actualFactor;
    this._zoom = newZoom;
    this._dirty = true;
  }

  setZoom(zoom: number): void {
    this._zoom = clamp(zoom, 0.05, 64);
    this._dirty = true;
  }

  setRotation(angle: number): void {
    this._rotation = angle;
    this._dirty = true;
  }

  screenToDoc(screenX: number, screenY: number): Vec2 {
    return this.inverse.transformPoint(new Vec2(screenX, screenY));
  }

  docToScreen(docX: number, docY: number): Vec2 {
    return this.matrix.transformPoint(new Vec2(docX, docY));
  }

  reset(): void {
    this._x = 0;
    this._y = 0;
    this._zoom = 1;
    this._rotation = 0;
    this._dirty = true;
  }

  fitToCanvas(canvasW: number, canvasH: number, viewW: number, viewH: number): void {
    const scaleX = viewW / canvasW;
    const scaleY = viewH / canvasH;
    this._zoom = Math.min(scaleX, scaleY) * 0.9;
    this._x = (viewW - canvasW * this._zoom) / 2;
    this._y = (viewH - canvasH * this._zoom) / 2;
    this._rotation = 0;
    this._dirty = true;
  }
}
