/**
 * CanvasOverlay - Cursor overlay rendering for the canvas viewport.
 * Draws tool-specific cursors (brush circle, crosshair, move icon) on the overlay canvas.
 */

export function renderCursorOverlay(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  brushSize: number,
  zoom: number,
  tool: string
): void {
  ctx.save();

  if (tool === 'pan') {
    // Move/pan cursor: four-arrow icon
    drawPanCursor(ctx, x, y);
  } else if (tool === 'bone' || tool === 'ik' || tool === 'select') {
    // Crosshair cursor
    drawCrosshair(ctx, x, y, tool === 'bone' ? '#58a6ff' : '#e6edf3');
  } else {
    // Brush tools: circle showing brush size + small crosshair
    drawBrushCursor(ctx, x, y, brushSize, zoom);
  }

  ctx.restore();
}

function drawBrushCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  brushSize: number,
  zoom: number
): void {
  const radius = (brushSize / 2) * zoom;
  const minRadius = 2;
  const displayRadius = Math.max(radius, minRadius);

  // Outer circle (brush size)
  ctx.beginPath();
  ctx.arc(x, y, displayRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Shadow circle for contrast
  ctx.beginPath();
  ctx.arc(x, y, displayRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Center crosshair (small, always same screen size)
  const crossSize = 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x - crossSize, y);
  ctx.lineTo(x + crossSize, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y - crossSize);
  ctx.lineTo(x, y + crossSize);
  ctx.stroke();
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
): void {
  const size = 10;
  const gap = 3;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // Horizontal lines
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - gap, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();

  // Vertical lines
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y - gap);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + gap);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  // Shadow for contrast
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 0.5;

  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - gap, y);
  ctx.moveTo(x + gap, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y - gap);
  ctx.moveTo(x, y + gap);
  ctx.lineTo(x, y + size);
  ctx.stroke();
}

function drawPanCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): void {
  const size = 8;
  const arrowSize = 3;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 1.5;

  // Draw four arrows
  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 },  // right
  ];

  for (const dir of directions) {
    const tipX = x + dir.dx * size;
    const tipY = y + dir.dy * size;

    // Line from center
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    if (dir.dx === 0) {
      // Vertical arrow
      ctx.lineTo(tipX - arrowSize, tipY - dir.dy * arrowSize);
      ctx.lineTo(tipX + arrowSize, tipY - dir.dy * arrowSize);
    } else {
      // Horizontal arrow
      ctx.lineTo(tipX - dir.dx * arrowSize, tipY - arrowSize);
      ctx.lineTo(tipX - dir.dx * arrowSize, tipY + arrowSize);
    }
    ctx.closePath();
    ctx.fill();
  }
}
