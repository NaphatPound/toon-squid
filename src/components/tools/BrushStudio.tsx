import { useCallback } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import type { CustomBrush, StampShape } from '../../types/drawing';
import { IMAGE_TEMPLATES } from '../../engine/brush/ImageStamps';

const SHAPES: { value: StampShape; label: string }[] = [
  { value: 'circle', label: 'Circle' },
  { value: 'square', label: 'Square' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'star', label: 'Star' },
  { value: 'scatter-dots', label: 'Scatter' },
  { value: 'image', label: 'Image Stamp' },
];

const ROTATIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'follow-stroke', label: 'Follow Stroke' },
  { value: 'random', label: 'Random' },
];

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    padding: '8px 12px',
    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-primary, #e6edf3)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  brushList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
    maxHeight: 120,
    overflowY: 'auto' as const,
    marginBottom: 4,
  },
  brushItem: {
    display: 'flex',
    alignItems: 'center',
    height: 26,
    padding: '0 6px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 11,
    gap: 6,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #8b949e)',
    width: '100%',
    textAlign: 'left' as const,
  },
  section: {
    fontSize: 10,
    fontWeight: 600,
    color: 'var(--text-muted, #484f58)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    marginTop: 4,
    marginBottom: 2,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  label: {
    fontSize: 10,
    color: 'var(--text-muted, #484f58)',
    flexShrink: 0,
    minWidth: 60,
  },
  slider: {
    flex: 1,
    height: 4,
    appearance: 'none' as const,
    background: 'var(--bg-tertiary, #161b22)',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  },
  select: {
    flex: 1,
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    borderRadius: 3,
    color: 'var(--text-primary, #e6edf3)',
    fontSize: 10,
    padding: '2px 4px',
    outline: 'none',
    cursor: 'pointer',
  },
  val: {
    fontSize: 10,
    color: 'var(--text-secondary, #8b949e)',
    minWidth: 28,
    textAlign: 'right' as const,
  },
  nameInput: {
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    borderRadius: 3,
    color: 'var(--text-primary, #e6edf3)',
    fontSize: 11,
    padding: '3px 6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #8b949e)',
    borderRadius: 3,
    cursor: 'pointer',
    padding: '0 4px',
    fontSize: 10,
  },
  checkbox: {
    width: 12,
    height: 12,
    accentColor: 'var(--accent-blue, #58a6ff)',
    cursor: 'pointer',
  },
};

function SliderRow({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div style={s.row}>
      <span style={s.label}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={s.slider}
      />
      <span style={s.val as React.CSSProperties}>{format ? format(value) : value.toFixed(2)}</span>
    </div>
  );
}

export default function BrushStudio() {
  const customBrushes = useDrawingStore((st) => st.customBrushes);
  const activeCustomBrushId = useDrawingStore((st) => st.activeCustomBrushId);
  const setActiveCustomBrush = useDrawingStore((st) => st.setActiveCustomBrush);
  const updateCustomBrush = useDrawingStore((st) => st.updateCustomBrush);
  const addCustomBrush = useDrawingStore((st) => st.addCustomBrush);
  const deleteCustomBrush = useDrawingStore((st) => st.deleteCustomBrush);
  const duplicateCustomBrush = useDrawingStore((st) => st.duplicateCustomBrush);

  const activeBrush = customBrushes.find((b) => b.id === activeCustomBrushId) ?? null;

  const update = useCallback(
    (updates: Partial<CustomBrush>) => {
      if (activeCustomBrushId) updateCustomBrush(activeCustomBrushId, updates);
    },
    [activeCustomBrushId, updateCustomBrush]
  );

  return (
    <div style={s.container}>
      <div style={s.header}>
        <span style={s.title}>Brush Studio</span>
        <button
          style={s.btn}
          onClick={addCustomBrush}
          title="New brush"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-blue, #58a6ff)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary, #8b949e)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Brush list */}
      <div style={s.brushList}>
        {customBrushes.map((brush) => (
          <button
            key={brush.id}
            style={{
              ...s.brushItem,
              background: brush.id === activeCustomBrushId ? 'var(--active-bg, rgba(255, 255, 255, 0.08))' : 'transparent',
              color: brush.id === activeCustomBrushId ? 'var(--text-primary, #e6edf3)' : 'var(--text-secondary, #8b949e)',
            }}
            onClick={() => setActiveCustomBrush(brush.id)}
            onMouseEnter={(e) => { if (brush.id !== activeCustomBrushId) e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))'; }}
            onMouseLeave={(e) => { if (brush.id !== activeCustomBrushId) e.currentTarget.style.background = 'transparent'; }}
          >
            {brush.shape === 'image' ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1" />
                <path d="M3 7l2-3 2 2 1-1 1 2" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" fill="currentColor" />
              </svg>
            )}
            {brush.name}
          </button>
        ))}
      </div>

      {/* Editor for active brush */}
      {activeBrush && (
        <>
          {/* Name + actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              style={s.nameInput}
              value={activeBrush.name}
              onChange={(e) => update({ name: e.target.value })}
            />
            <button style={s.btn} onClick={() => duplicateCustomBrush(activeBrush.id)} title="Duplicate">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <rect x="0" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
                <rect x="2" y="0" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="var(--bg-tertiary, #161b22)" />
              </svg>
            </button>
            <button
              style={{ ...s.btn, color: 'var(--text-muted, #484f58)' }}
              onClick={() => deleteCustomBrush(activeBrush.id)}
              title="Delete"
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f85149'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted, #484f58)'; }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Shape */}
          <div style={s.section}>Shape</div>
          <div style={s.row}>
            <span style={s.label}>Shape</span>
            <select style={s.select} value={activeBrush.shape} onChange={(e) => update({ shape: e.target.value as StampShape })}>
              {SHAPES.map((sh) => <option key={sh.value} value={sh.value}>{sh.label}</option>)}
            </select>
          </div>
          {activeBrush.shape === 'image' && (
            <div style={s.row}>
              <span style={s.label}>Stamp</span>
              <select
                style={s.select}
                value={activeBrush.imageStampId || ''}
                onChange={(e) => update({ imageStampId: e.target.value })}
              >
                <option value="">None</option>
                {IMAGE_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          {activeBrush.shape !== 'image' && (
            <>
              <SliderRow label="Roundness" value={activeBrush.roundness} min={0.1} max={1} step={0.05} onChange={(v) => update({ roundness: v })} />
              <SliderRow label="Hardness" value={activeBrush.hardness} min={0} max={1} step={0.05} onChange={(v) => update({ hardness: v })} />
            </>
          )}

          {/* Stroke */}
          <div style={s.section}>Stroke</div>
          <SliderRow label="Spacing" value={activeBrush.spacing} min={0.01} max={1} step={0.01} onChange={(v) => update({ spacing: v })} />
          <SliderRow label="Scatter" value={activeBrush.scatter} min={0} max={1} step={0.05} onChange={(v) => update({ scatter: v })} />
          <SliderRow label="Taper Start" value={activeBrush.taperStart} min={0} max={0.5} step={0.05} onChange={(v) => update({ taperStart: v })} />
          <SliderRow label="Taper End" value={activeBrush.taperEnd} min={0} max={0.5} step={0.05} onChange={(v) => update({ taperEnd: v })} />

          {/* Rotation */}
          <div style={s.section}>Rotation</div>
          <div style={s.row}>
            <span style={s.label}>Mode</span>
            <select style={s.select} value={activeBrush.rotation} onChange={(e) => update({ rotation: e.target.value as CustomBrush['rotation'] })}>
              {ROTATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {activeBrush.rotation === 'none' && (
            <SliderRow label="Angle" value={activeBrush.rotationAngle} min={0} max={360} step={1} onChange={(v) => update({ rotationAngle: v })} format={(v) => `${Math.round(v)}`} />
          )}

          {/* Jitter */}
          <div style={s.section}>Jitter</div>
          <SliderRow label="Size" value={activeBrush.sizeJitter} min={0} max={1} step={0.05} onChange={(v) => update({ sizeJitter: v })} />
          <SliderRow label="Opacity" value={activeBrush.opacityJitter} min={0} max={1} step={0.05} onChange={(v) => update({ opacityJitter: v })} />

          {/* Grain */}
          <div style={s.section}>Grain</div>
          <SliderRow label="Amount" value={activeBrush.grainOpacity} min={0} max={1} step={0.05} onChange={(v) => update({ grainOpacity: v })} />
          <SliderRow label="Scale" value={activeBrush.grainScale} min={0.5} max={4} step={0.1} onChange={(v) => update({ grainScale: v })} />

          {/* Pressure */}
          <div style={s.section}>Pressure</div>
          <div style={s.row}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-secondary, #8b949e)', cursor: 'pointer' }}>
              <input type="checkbox" checked={activeBrush.pressureSize} onChange={(e) => update({ pressureSize: e.target.checked })} style={s.checkbox} />
              Size
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-secondary, #8b949e)', cursor: 'pointer' }}>
              <input type="checkbox" checked={activeBrush.pressureOpacity} onChange={(e) => update({ pressureOpacity: e.target.checked })} style={s.checkbox} />
              Opacity
            </label>
          </div>

          {/* Dual Brush */}
          <div style={s.section}>Dual Brush</div>
          <div style={s.row}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-secondary, #8b949e)', cursor: 'pointer' }}>
              <input type="checkbox" checked={activeBrush.dualBrush} onChange={(e) => update({ dualBrush: e.target.checked })} style={s.checkbox} />
              Enable
            </label>
          </div>
          {activeBrush.dualBrush && (
            <>
              <div style={s.row}>
                <span style={s.label}>Shape</span>
                <select style={s.select} value={activeBrush.dualShape} onChange={(e) => update({ dualShape: e.target.value as StampShape })}>
                  {SHAPES.map((sh) => <option key={sh.value} value={sh.value}>{sh.label}</option>)}
                </select>
              </div>
              <SliderRow label="Size Ratio" value={activeBrush.dualSizeRatio} min={0.1} max={1} step={0.05} onChange={(v) => update({ dualSizeRatio: v })} />
            </>
          )}
        </>
      )}
    </div>
  );
}
