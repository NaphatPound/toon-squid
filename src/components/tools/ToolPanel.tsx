import React, { useMemo, useCallback } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useDrawingStore } from '../../store/drawingStore';
import type { ToolType } from '../../types/project';
import type { BrushType } from '../../types/drawing';

interface ToolDef {
  type: ToolType;
  label: string;
  shortcut: string;
  icon: React.ReactNode;
  group: 'draw' | 'rig' | 'nav';
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const tools: (ToolDef | 'divider')[] = [
  {
    type: 'select',
    label: 'Select',
    shortcut: 'V',
    group: 'draw',
    icon: (
      <svg {...iconProps}>
        <path d="M5 3l10 7-5 1-3 5z" />
        <path d="M12 11l3 5" />
      </svg>
    ),
  },
  {
    type: 'pen',
    label: 'Pen',
    shortcut: 'B',
    group: 'draw',
    icon: (
      <svg {...iconProps}>
        <path d="M4 16l1.5-4L14 3.5 16.5 6 8 14.5z" />
        <path d="M5.5 12L8 14.5" />
      </svg>
    ),
  },
  {
    type: 'ink',
    label: 'Ink',
    shortcut: 'I',
    group: 'draw',
    icon: (
      <svg {...iconProps}>
        <path d="M10 3c-3 4-5 7-5 10a5 5 0 0010 0c0-3-2-6-5-10z" />
      </svg>
    ),
  },
  {
    type: 'pencil',
    label: 'Pencil',
    shortcut: 'N',
    group: 'draw',
    icon: (
      <svg {...iconProps}>
        <path d="M3 17l1-4L14.5 2.5 17.5 5.5 7 16z" />
        <path d="M4 13l3 3" />
        <path d="M14.5 2.5l3 3" />
      </svg>
    ),
  },
  {
    type: 'marker',
    label: 'Marker',
    shortcut: 'M',
    group: 'draw',
    icon: (
      <svg {...iconProps}>
        <rect x="7" y="2" width="6" height="12" rx="1" transform="rotate(15 10 10)" />
        <path d="M8 14l-2 4h8l-2-4" transform="rotate(15 10 10)" />
      </svg>
    ),
  },
  {
    type: 'eraser',
    label: 'Eraser',
    shortcut: 'E',
    group: 'draw',
    icon: (
      <svg {...iconProps}>
        <path d="M7 17h10" />
        <path d="M4 14l6-8 5 4-6 8-4 0z" />
        <path d="M10 6l5 4" />
      </svg>
    ),
  },
  'divider',
  {
    type: 'bone',
    label: 'Bone',
    shortcut: 'J',
    group: 'rig',
    icon: (
      <svg {...iconProps}>
        <circle cx="5" cy="15" r="2.5" />
        <circle cx="15" cy="5" r="2.5" />
        <line x1="7" y1="13" x2="13" y2="7" />
      </svg>
    ),
  },
  {
    type: 'ik',
    label: 'IK Chain',
    shortcut: 'K',
    group: 'rig',
    icon: (
      <svg {...iconProps}>
        <circle cx="5" cy="15" r="2" />
        <circle cx="10" cy="7" r="2" />
        <circle cx="16" cy="3" r="2" />
        <line x1="6.5" y1="13.5" x2="8.5" y2="8.5" />
        <line x1="11.5" y1="5.5" x2="14.5" y2="4.5" />
      </svg>
    ),
  },
  'divider',
  {
    type: 'pan',
    label: 'Pan',
    shortcut: 'H',
    group: 'nav',
    icon: (
      <svg {...iconProps}>
        <path d="M10 2v3M10 15v3M2 10h3M15 10h3" />
        <path d="M6 4.5L10 2l4 2.5" />
        <path d="M6 15.5L10 18l4-2.5" />
        <path d="M4.5 6L2 10l2.5 4" />
        <path d="M15.5 6L18 10l-2.5 4" />
      </svg>
    ),
  },
  {
    type: 'zoom',
    label: 'Zoom',
    shortcut: 'Z',
    group: 'nav',
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="9" r="5" />
        <line x1="13" y1="13" x2="17" y2="17" />
        <line x1="7" y1="9" x2="11" y2="9" />
        <line x1="9" y1="7" x2="9" y2="11" />
      </svg>
    ),
  },
];

const ToolPanel: React.FC = () => {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const appMode = useUIStore((s) => s.appMode);

  const setBrushType = useDrawingStore((s) => s.setBrushType);
  const setAppMode = useUIStore((s) => s.setAppMode);

  const handleToolClick = useCallback(
    (tool: ToolType) => {
      setActiveTool(tool);
      // Sync brushType in drawing store when a brush tool is selected
      const brushTools: Set<string> = new Set(['pen', 'ink', 'pencil', 'marker', 'eraser']);
      if (brushTools.has(tool)) {
        setBrushType(tool as BrushType);
        setAppMode('draw');
      }
      // Auto-switch to rig mode when selecting rig tools (unless already in animate)
      const rigTools: Set<string> = new Set(['bone', 'ik']);
      if (rigTools.has(tool) && appMode !== 'animate') {
        setAppMode('rig');
      }
    },
    [setActiveTool, setBrushType, setAppMode, appMode]
  );

  const styles = useMemo(
    () => ({
      panel: {
        width: 48,
        height: '100%',
        backgroundColor: 'var(--bg-panel, rgba(22, 27, 34, 0.85))',
        borderRight: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        paddingTop: 8,
        paddingBottom: 8,
        gap: 2,
        flexShrink: 0,
        overflow: 'hidden',
      },
      divider: {
        width: 24,
        height: 1,
        backgroundColor: 'var(--border-color, rgba(255, 255, 255, 0.08))',
        margin: '4px 0',
        flexShrink: 0,
      },
    }),
    []
  );

  return (
    <div style={styles.panel}>
      {tools.map((item, i) => {
        if (item === 'divider') {
          return <div key={`div-${i}`} style={styles.divider} />;
        }
        const isActive = activeTool === item.type;
        const isRigTool = item.group === 'rig';
        const isDrawTool = item.group === 'draw';
        const dimmed =
          (appMode === 'rig' && isDrawTool) ||
          (appMode === 'draw' && isRigTool) ||
          (appMode === 'animate' && isDrawTool);

        return (
          <ToolButton
            key={item.type}
            tool={item}
            isActive={isActive}
            dimmed={dimmed}
            onClick={handleToolClick}
          />
        );
      })}
    </div>
  );
};

interface ToolButtonProps {
  tool: ToolDef;
  isActive: boolean;
  dimmed: boolean;
  onClick: (type: ToolType) => void;
}

const ToolButton: React.FC<ToolButtonProps> = React.memo(
  ({ tool, isActive, dimmed, onClick }) => {
    const [hovered, setHovered] = React.useState(false);

    const style: React.CSSProperties = {
      position: 'relative',
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      color: isActive
        ? '#fff'
        : dimmed
          ? 'var(--text-secondary, #8b949e)'
          : 'var(--text-primary, #e6edf3)',
      backgroundColor: isActive
        ? 'var(--accent-blue, #58a6ff)'
        : hovered
          ? 'var(--hover-bg, rgba(255, 255, 255, 0.04))'
          : 'transparent',
      opacity: dimmed ? 0.4 : 1,
      transition: 'background-color 0.15s ease, opacity 0.15s ease',
      padding: 0,
      flexShrink: 0,
    };

    const tooltipStyle: React.CSSProperties = {
      position: 'absolute',
      left: 44,
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#1c2128',
      color: '#e6edf3',
      fontSize: 11,
      padding: '4px 8px',
      borderRadius: 4,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 1000,
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    };

    const shortcutStyle: React.CSSProperties = {
      marginLeft: 6,
      color: '#8b949e',
      fontSize: 10,
      fontFamily: 'monospace',
    };

    return (
      <button
        style={style}
        title={`${tool.label} (${tool.shortcut})`}
        onClick={() => onClick(tool.type)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {tool.icon}
        {hovered && (
          <div style={tooltipStyle}>
            {tool.label}
            <span style={shortcutStyle}>{tool.shortcut}</span>
          </div>
        )}
      </button>
    );
  }
);

ToolButton.displayName = 'ToolButton';

export default ToolPanel;
