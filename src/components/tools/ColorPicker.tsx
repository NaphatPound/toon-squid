import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb } from '../../utils/color';

const SV_SIZE = 200;
const HUE_HEIGHT = 16;
const SWATCH_SIZE = 20;
const MAX_RECENT = 12;

const ColorPicker: React.FC = () => {
  const brushSettings = useDrawingStore((s) => s.brushSettings);
  const setBrushSettings = useDrawingStore((s) => s.setBrushSettings);

  const currentColor = brushSettings.color;
  const initialHsv = rgbToHsv(hexToRgb(currentColor));

  const [hue, setHue] = useState(initialHsv.h);
  const [sat, setSat] = useState(initialHsv.s);
  const [val, setVal] = useState(initialHsv.v);
  const [hexInput, setHexInput] = useState(currentColor);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [draggingSV, setDraggingSV] = useState(false);
  const [draggingHue, setDraggingHue] = useState(false);

  const svCanvasRef = useRef<HTMLCanvasElement>(null);
  const hueCanvasRef = useRef<HTMLCanvasElement>(null);
  const svContainerRef = useRef<HTMLDivElement>(null);
  const hueContainerRef = useRef<HTMLDivElement>(null);

  // Sync external color changes
  useEffect(() => {
    const hsv = rgbToHsv(hexToRgb(currentColor));
    // Only update if the color actually changed (avoid feedback loops)
    const currentHex = rgbToHex(hsvToRgb({ h: hue, s: sat, v: val }));
    if (currentHex.toLowerCase() !== currentColor.toLowerCase()) {
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
      setHexInput(currentColor);
    }
  }, [currentColor]);

  // Apply color to store
  const applyColor = useCallback(
    (h: number, s: number, v: number) => {
      const hex = rgbToHex(hsvToRgb({ h, s, v }));
      setHexInput(hex);
      setBrushSettings({ color: hex });
    },
    [setBrushSettings]
  );

  // Add to recent when mouse is released
  const addToRecent = useCallback((hex: string) => {
    setRecentColors((prev) => {
      const lower = hex.toLowerCase();
      const filtered = prev.filter((c) => c.toLowerCase() !== lower);
      return [hex, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  // -- Draw SV canvas --
  useEffect(() => {
    const canvas = svCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hue base color
    const hueRgb = hsvToRgb({ h: hue, s: 1, v: 1 });
    const hueColor = `rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b})`;

    // Fill with hue
    ctx.fillStyle = hueColor;
    ctx.fillRect(0, 0, SV_SIZE, SV_SIZE);

    // White gradient (left to right)
    const whiteGrad = ctx.createLinearGradient(0, 0, SV_SIZE, 0);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, SV_SIZE, SV_SIZE);

    // Black gradient (top to bottom)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, SV_SIZE);
    blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
    blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, SV_SIZE, SV_SIZE);
  }, [hue]);

  // -- Draw Hue bar --
  useEffect(() => {
    const canvas = hueCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, SV_SIZE, 0);
    for (let i = 0; i <= 6; i++) {
      const rgb = hsvToRgb({ h: i * 60, s: 1, v: 1 });
      grad.addColorStop(i / 6, `rgb(${rgb.r},${rgb.g},${rgb.b})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SV_SIZE, HUE_HEIGHT);
  }, []);

  // -- SV interaction --
  const updateSV = useCallback(
    (clientX: number, clientY: number) => {
      const container = svContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(
        0,
        Math.min(1, 1 - (clientY - rect.top) / rect.height)
      );
      setSat(s);
      setVal(v);
      applyColor(hue, s, v);
    },
    [hue, applyColor]
  );

  const handleSVMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggingSV(true);
      updateSV(e.clientX, e.clientY);
    },
    [updateSV]
  );

  // -- Hue interaction --
  const updateHue = useCallback(
    (clientX: number) => {
      const container = hueContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const h = Math.max(
        0,
        Math.min(360, ((clientX - rect.left) / rect.width) * 360)
      );
      setHue(h);
      applyColor(h, sat, val);
    },
    [sat, val, applyColor]
  );

  const handleHueMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDraggingHue(true);
      updateHue(e.clientX);
    },
    [updateHue]
  );

  // -- Global mouse move/up --
  useEffect(() => {
    if (!draggingSV && !draggingHue) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (draggingSV) updateSV(e.clientX, e.clientY);
      if (draggingHue) updateHue(e.clientX);
    };

    const handleMouseUp = () => {
      if (draggingSV || draggingHue) {
        addToRecent(rgbToHex(hsvToRgb({ h: hue, s: sat, v: val })));
      }
      setDraggingSV(false);
      setDraggingHue(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingSV, draggingHue, updateSV, updateHue, hue, sat, val, addToRecent]);

  // -- Hex input --
  const handleHexChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setHexInput(v);
    },
    []
  );

  const handleHexCommit = useCallback(() => {
    let hex = hexInput.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      const hsv = rgbToHsv(hexToRgb(hex));
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
      setBrushSettings({ color: hex.toLowerCase() });
      addToRecent(hex.toLowerCase());
    } else {
      setHexInput(currentColor);
    }
  }, [hexInput, currentColor, setBrushSettings, addToRecent]);

  const handleHexKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleHexCommit();
    },
    [handleHexCommit]
  );

  // -- Select recent color --
  const handleRecentClick = useCallback(
    (color: string) => {
      const hsv = rgbToHsv(hexToRgb(color));
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
      setHexInput(color);
      setBrushSettings({ color });
    },
    [setBrushSettings]
  );

  const previewColor = rgbToHex(hsvToRgb({ h: hue, s: sat, v: val }));

  const styles = useMemo(
    () => ({
      container: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 10,
        padding: 12,
      },
      title: {
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-primary, #e6edf3)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: 2,
      },
      svContainer: {
        position: 'relative' as const,
        width: SV_SIZE,
        height: SV_SIZE,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'crosshair',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
      },
      svCanvas: {
        display: 'block',
        width: SV_SIZE,
        height: SV_SIZE,
      },
      svCursor: {
        position: 'absolute' as const,
        left: sat * SV_SIZE - 7,
        top: (1 - val) * SV_SIZE - 7,
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid #fff',
        boxShadow: '0 0 3px rgba(0,0,0,0.5), inset 0 0 2px rgba(0,0,0,0.3)',
        pointerEvents: 'none' as const,
      },
      hueContainer: {
        position: 'relative' as const,
        width: SV_SIZE,
        height: HUE_HEIGHT,
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
      },
      hueCanvas: {
        display: 'block',
        width: SV_SIZE,
        height: HUE_HEIGHT,
      },
      hueCursor: {
        position: 'absolute' as const,
        left: (hue / 360) * SV_SIZE - 3,
        top: -1,
        width: 6,
        height: HUE_HEIGHT + 2,
        borderRadius: 2,
        border: '2px solid #fff',
        boxShadow: '0 0 3px rgba(0,0,0,0.5)',
        pointerEvents: 'none' as const,
      },
      previewRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      },
      swatch: {
        width: 32,
        height: 32,
        borderRadius: 6,
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        backgroundColor: previewColor,
        flexShrink: 0,
      },
      hexInput: {
        flex: 1,
        height: 28,
        background: 'var(--active-bg, rgba(255, 255, 255, 0.08))',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        borderRadius: 4,
        color: 'var(--text-primary, #e6edf3)',
        fontSize: 12,
        fontFamily: 'monospace',
        padding: '0 8px',
        outline: 'none',
      },
      recentLabel: {
        fontSize: 10,
        color: 'var(--text-secondary, #8b949e)',
        marginTop: 2,
      },
      recentRow: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: 4,
      },
    }),
    [sat, val, hue, previewColor]
  );

  return (
    <div style={styles.container}>
      <span style={styles.title}>Color</span>

      {/* Saturation / Value square */}
      <div
        ref={svContainerRef}
        style={styles.svContainer}
        onMouseDown={handleSVMouseDown}
      >
        <canvas
          ref={svCanvasRef}
          width={SV_SIZE}
          height={SV_SIZE}
          style={styles.svCanvas}
        />
        <div style={styles.svCursor} />
      </div>

      {/* Hue bar */}
      <div
        ref={hueContainerRef}
        style={styles.hueContainer}
        onMouseDown={handleHueMouseDown}
      >
        <canvas
          ref={hueCanvasRef}
          width={SV_SIZE}
          height={HUE_HEIGHT}
          style={styles.hueCanvas}
        />
        <div style={styles.hueCursor} />
      </div>

      {/* Color preview + hex input */}
      <div style={styles.previewRow}>
        <div style={styles.swatch} />
        <input
          type="text"
          value={hexInput}
          onChange={handleHexChange}
          onBlur={handleHexCommit}
          onKeyDown={handleHexKeyDown}
          style={styles.hexInput}
          maxLength={7}
          spellCheck={false}
        />
      </div>

      {/* Recent colors */}
      {recentColors.length > 0 && (
        <>
          <span style={styles.recentLabel}>Recent</span>
          <div style={styles.recentRow}>
            {recentColors.map((color, i) => (
              <RecentSwatch
                key={`${color}-${i}`}
                color={color}
                onClick={handleRecentClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface RecentSwatchProps {
  color: string;
  onClick: (color: string) => void;
}

const RecentSwatch: React.FC<RecentSwatchProps> = React.memo(
  ({ color, onClick }) => {
    const [hovered, setHovered] = useState(false);

    const style: React.CSSProperties = {
      width: SWATCH_SIZE,
      height: SWATCH_SIZE,
      borderRadius: 4,
      backgroundColor: color,
      border: hovered
        ? '2px solid var(--accent-blue, #58a6ff)'
        : '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
    };

    return (
      <button
        style={style}
        onClick={() => onClick(color)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={color}
      />
    );
  }
);

RecentSwatch.displayName = 'RecentSwatch';

export default ColorPicker;
