import React from 'react';
import { useUIStore } from '../../store/uiStore';
import type { AppMode } from '../../types/project';

const modes: { key: AppMode; label: string }[] = [
  { key: 'draw', label: 'Draw' },
  { key: 'rig', label: 'Rig' },
  { key: 'animate', label: 'Animate' },
];

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 'var(--toolbar-height)',
  minHeight: 'var(--toolbar-height)',
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border-color)',
  padding: '0 12px',
  userSelect: 'none',
};

const brandStyle: React.CSSProperties = {
  color: 'var(--accent-blue)',
  fontWeight: 700,
  fontSize: 'var(--font-size-md)',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
};

const modesContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  height: '100%',
};

const modeTabBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '0 14px',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  borderBottom: '2px solid transparent',
  transition: 'color 0.15s, border-color 0.15s',
};

const modeTabActive: React.CSSProperties = {
  color: 'var(--accent-blue)',
  borderBottomColor: 'var(--accent-blue)',
};

const menuContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const menuButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 'var(--font-size-sm)',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
};

const menuItems = [
  { label: 'New', icon: '+" viewBox="0 0 16 16' , svg: 'M8 2v12M2 8h12' },
  { label: 'Save', svg: 'M3 14V2h7l3 3v9H3zM7 2v4h3M5 9h6M5 11.5h6' },
  { label: 'Export', svg: 'M8 2v8M4 6l4-4 4 4M3 12v2h10v-2' },
];

function Toolbar() {
  const appMode = useUIStore((s) => s.appMode);
  const setAppMode = useUIStore((s) => s.setAppMode);

  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
    // Auto-show timeline and select bone tool in animate mode
    if (mode === 'animate') {
      const uiState = useUIStore.getState();
      if (!uiState.showTimeline) uiState.toggleTimeline();
      uiState.setActiveTool('bone');
    }
  };

  return (
    <div style={toolbarStyle}>
      {/* Left: Brand */}
      <div style={brandStyle}>Toon Squid</div>

      {/* Center: Mode tabs */}
      <div style={modesContainerStyle}>
        {modes.map((mode) => (
          <button
            key={mode.key}
            style={{
              ...modeTabBase,
              ...(appMode === mode.key ? modeTabActive : {}),
            }}
            onClick={() => handleModeChange(mode.key)}
            title={mode.label}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Right: Menu buttons */}
      <div style={menuContainerStyle}>
        {menuItems.map((item) => (
          <button
            key={item.label}
            style={menuButtonStyle}
            title={item.label}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={item.svg} />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Toolbar;
