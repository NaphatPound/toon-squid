import type { Point } from '../types/drawing';
import { clamp } from './math';

const MAX_VELOCITY = 1500;

let lastX = 0;
let lastY = 0;
let lastTime = 0;

export function normalizePointerEvent(e: PointerEvent): Point {
  const now = performance.now();
  const dt = lastTime > 0 ? (now - lastTime) / 1000 : 0;
  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;
  const velocity = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;

  let pressure = e.pressure;

  // Simulate pressure from mouse velocity
  if (e.pointerType === 'mouse' || pressure === 0.5) {
    pressure = 1.0 - clamp(velocity / MAX_VELOCITY, 0, 0.7);
  }

  lastX = e.clientX;
  lastY = e.clientY;
  lastTime = now;

  return {
    x: e.clientX,
    y: e.clientY,
    pressure: clamp(pressure, 0.05, 1),
    timestamp: now,
  };
}

export function getCoalescedPoints(e: PointerEvent): Point[] {
  const coalescedEvents = e.getCoalescedEvents?.() ?? [];
  if (coalescedEvents.length === 0) {
    return [normalizePointerEvent(e)];
  }
  return coalescedEvents.map((ce) => normalizePointerEvent(ce));
}

export function resetInputState(): void {
  lastX = 0;
  lastY = 0;
  lastTime = 0;
}
