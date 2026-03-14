import React from 'react';
import { useUIStore } from '../../store/uiStore';

const toolLabels: Record<string, string> = {
  select: 'Select',
  pen: 'Pen',
  ink: 'Ink Brush',
  pencil: 'Pencil',
  marker: 'Marker',
  eraser: 'Eraser',
  bone: 'Bone Tool',
  ik: 'IK Handle',
  pan: 'Pan',
  zoom: 'Zoom',
};

const barStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 'var(--statusbar-height)',
  minHeight: 'var(--statusbar-height)',
  background: 'var(--bg-secondary)',
  borderTop: '1px solid var(--border-color)',
  padding: '0 12px',
  fontSize: 'var(--font-size-xs)',
  color: 'var(--text-muted)',
  userSelect: 'none',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 100,
};

const monoStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
  letterSpacing: '0.3px',
};

function StatusBar() {
  const activeTool = useUIStore((s) => s.activeTool);
  const cursorPosition = useUIStore((s) => s.cursorPosition);
  const zoomLevel = useUIStore((s) => s.zoomLevel);

  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <div style={barStyle}>
      {/* Left: Tool name */}
      <div style={{ ...sectionStyle, justifyContent: 'flex-start' }}>
        <span>{toolLabels[activeTool] ?? activeTool}</span>
      </div>

      {/* Center: Cursor position */}
      <div style={{ ...sectionStyle, justifyContent: 'center', minWidth: 160 }}>
        <span style={monoStyle}>
          X: {cursorPosition.x.toFixed(0).padStart(4, '\u2007')}
        </span>
        <span style={{ color: 'var(--border-color)', margin: '0 2px' }}>|</span>
        <span style={monoStyle}>
          Y: {cursorPosition.y.toFixed(0).padStart(4, '\u2007')}
        </span>
      </div>

      {/* Right: Zoom level */}
      <div style={{ ...sectionStyle, justifyContent: 'flex-end' }}>
        <span style={monoStyle}>{zoomPercent}%</span>
      </div>
    </div>
  );
}

export default StatusBar;
