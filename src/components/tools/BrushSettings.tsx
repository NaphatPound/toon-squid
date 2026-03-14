import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import Slider from '../common/Slider';
import ColorPicker from './ColorPicker';

const PALETTE_KEY = 'toon-squid-palette';

function loadPalette(): string[] {
  try {
    const stored = localStorage.getItem(PALETTE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return ['#e6edf3', '#f85149', '#f0883e', '#e3b341', '#3fb950', '#58a6ff', '#bc8cff', '#ff7b72', '#0d1117', '#ffffff'];
}

function savePalette(colors: string[]) {
  try {
    localStorage.setItem(PALETTE_KEY, JSON.stringify(colors));
  } catch { /* ignore */ }
}

const BrushSettings: React.FC = () => {
  const brushSettings = useDrawingStore((s) => s.brushSettings);
  const setBrushSettings = useDrawingStore((s) => s.setBrushSettings);
  const brushType = useDrawingStore((s) => s.brushType);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [palette, setPalette] = useState<string[]>(loadPalette);

  const handleSize = useCallback(
    (v: number) => setBrushSettings({ size: v }),
    [setBrushSettings]
  );
  const handleOpacity = useCallback(
    (v: number) => setBrushSettings({ opacity: v / 100 }),
    [setBrushSettings]
  );
  const handleFlow = useCallback(
    (v: number) => setBrushSettings({ flow: v / 100 }),
    [setBrushSettings]
  );
  const handleSmoothing = useCallback(
    (v: number) => setBrushSettings({ smoothing: v / 100 }),
    [setBrushSettings]
  );
  const handleHardness = useCallback(
    (v: number) => setBrushSettings({ hardness: v / 100 }),
    [setBrushSettings]
  );
  const handlePressureSize = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setBrushSettings({ pressureSize: e.target.checked }),
    [setBrushSettings]
  );
  const handlePressureOpacity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setBrushSettings({ pressureOpacity: e.target.checked }),
    [setBrushSettings]
  );

  // Draw brush preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    // Draw a sample stroke
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.35;
    const displayRadius = Math.min(radius, brushSettings.size / 2);

    // Radial gradient for hardness
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, displayRadius);
    const color = brushSettings.color;
    const alpha = brushSettings.opacity;
    const innerStop = brushSettings.hardness;

    grad.addColorStop(0, color);
    grad.addColorStop(Math.min(innerStop, 0.99), color);
    grad.addColorStop(1, 'transparent');

    ctx.globalAlpha = alpha;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, displayRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw a sample curve
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, brushSettings.size * 0.15);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(12, h - 12);
    for (let t = 0; t <= 1; t += 0.02) {
      const x = 12 + t * (w - 24);
      const y = cy + Math.sin(t * Math.PI * 2) * (h * 0.25);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, [brushSettings]);

  const formatPercent = useCallback((v: number) => `${Math.round(v)}%`, []);
  const formatPx = useCallback((v: number) => `${v}px`, []);

  const styles = useMemo(
    () => ({
      container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 8,
        padding: 12,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      },
      title: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-primary, #e6edf3)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
      },
      brushTypeLabel: {
        fontSize: 10,
        color: 'var(--accent-blue, #58a6ff)',
        textTransform: 'capitalize' as const,
        fontWeight: 500,
      },
      preview: {
        width: '100%',
        height: 60,
        borderRadius: 6,
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        backgroundColor: '#0d1117',
      },
      checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
      },
      checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: 'var(--text-secondary, #8b949e)',
        cursor: 'pointer',
        userSelect: 'none' as const,
      },
      checkbox: {
        width: 14,
        height: 14,
        accentColor: 'var(--accent-blue, #58a6ff)',
        cursor: 'pointer',
      },
      pressureTitle: {
        fontSize: 11,
        color: 'var(--text-secondary, #8b949e)',
        marginTop: 4,
        marginBottom: 2,
      },
    }),
    []
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Brush</span>
        <span style={styles.brushTypeLabel}>{brushType}</span>
      </div>

      <canvas
        ref={previewCanvasRef}
        width={200}
        height={60}
        style={styles.preview}
      />

      {/* Color section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: brushSettings.color,
            border: '2px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Pick color"
        />
        <span style={{ fontSize: 11, color: 'var(--text-secondary, #8b949e)', fontFamily: 'monospace' }}>
          {brushSettings.color}
        </span>
        <button
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary, #8b949e)',
            borderRadius: 4,
            cursor: 'pointer',
            padding: 0,
          }}
          onClick={() => {
            const color = brushSettings.color.toLowerCase();
            if (!palette.includes(color)) {
              const newPalette = [...palette, color];
              setPalette(newPalette);
              savePalette(newPalette);
            }
          }}
          title="Save to palette"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-blue, #58a6ff)';
            e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary, #8b949e)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Color Picker (toggle) */}
      {showColorPicker && <ColorPicker />}

      {/* Palette */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted, #484f58)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          Palette
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {palette.map((color, i) => (
            <div
              key={`${color}-${i}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: color,
                border: brushSettings.color.toLowerCase() === color.toLowerCase()
                  ? '2px solid var(--accent-blue, #58a6ff)'
                  : '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => setBrushSettings({ color })}
              onContextMenu={(e) => {
                e.preventDefault();
                const newPalette = palette.filter((_, idx) => idx !== i);
                setPalette(newPalette);
                savePalette(newPalette);
              }}
              title={`${color} (right-click to remove)`}
            />
          ))}
        </div>
      </div>

      <Slider
        label="Size"
        value={brushSettings.size}
        min={1}
        max={200}
        step={1}
        onChange={handleSize}
        formatValue={formatPx}
      />
      <Slider
        label="Opacity"
        value={Math.round(brushSettings.opacity * 100)}
        min={0}
        max={100}
        step={1}
        onChange={handleOpacity}
        formatValue={formatPercent}
      />
      <Slider
        label="Flow"
        value={Math.round(brushSettings.flow * 100)}
        min={0}
        max={100}
        step={1}
        onChange={handleFlow}
        formatValue={formatPercent}
      />
      <Slider
        label="Smoothing"
        value={Math.round(brushSettings.smoothing * 100)}
        min={0}
        max={100}
        step={1}
        onChange={handleSmoothing}
        formatValue={formatPercent}
      />
      <Slider
        label="Hardness"
        value={Math.round(brushSettings.hardness * 100)}
        min={0}
        max={100}
        step={1}
        onChange={handleHardness}
        formatValue={formatPercent}
      />

      <div style={styles.pressureTitle}>Pressure Sensitivity</div>
      <div style={styles.checkboxRow}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={brushSettings.pressureSize}
            onChange={handlePressureSize}
            style={styles.checkbox}
          />
          Size
        </label>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={brushSettings.pressureOpacity}
            onChange={handlePressureOpacity}
            style={styles.checkbox}
          />
          Opacity
        </label>
      </div>
    </div>
  );
};

export default BrushSettings;
