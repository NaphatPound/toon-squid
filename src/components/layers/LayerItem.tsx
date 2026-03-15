import { useState, useRef, useEffect, useMemo } from 'react';
import type { Layer } from '../../types/drawing';
import { useDrawingStore } from '../../store/drawingStore';
import { useBoneStore } from '../../store/boneStore';

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    height: 36,
    padding: '0 var(--spacing-sm, 8px)',
    cursor: 'pointer',
    gap: 'var(--spacing-xs, 4px)',
    borderLeft: '2px solid transparent',
    transition: 'background 0.1s',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    border: 'none',
    background: 'transparent',
    borderRadius: 3,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  name: {
    flex: 1,
    fontSize: 'var(--font-size-sm, 11px)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    minWidth: 0,
  },
  nameInput: {
    flex: 1,
    fontSize: 'var(--font-size-sm, 11px)',
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid var(--accent-blue, #58a6ff)',
    borderRadius: 3,
    color: 'var(--text-primary, #e6edf3)',
    padding: '1px 4px',
    outline: 'none',
    minWidth: 0,
  },
  opacity: {
    fontSize: 'var(--font-size-xs, 10px)',
    color: 'var(--text-muted, #484f58)',
    flexShrink: 0,
    minWidth: 28,
    textAlign: 'right' as const,
  },
};

export default function LayerItem({ layer, isActive }: LayerItemProps) {
  const setActiveLayer = useDrawingStore((s) => s.setActiveLayer);
  const updateLayer = useDrawingStore((s) => s.updateLayer);
  const bindings = useBoneStore((s) => s.bindings);
  const skeletonBones = useBoneStore((s) => s.skeleton?.bones ?? null);

  const bindingCount = useMemo(
    () => bindings.filter((b) => b.layerId === layer.id).length,
    [bindings, layer.id]
  );
  const tooltip = useMemo(() => {
    if (!skeletonBones || bindingCount === 0) return '';
    return bindings
      .filter((b) => b.layerId === layer.id)
      .map((binding) => skeletonBones.find((b) => b.id === binding.boneId)?.name ?? '?')
      .join(', ');
  }, [bindings, skeletonBones, layer.id, bindingCount]);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== layer.name) {
      updateLayer(layer.id, { name: trimmed });
    } else {
      setEditName(layer.name);
    }
    setIsEditing(false);
  };

  const rowBg = isActive
    ? 'var(--active-bg, rgba(255, 255, 255, 0.08))'
    : hovered
      ? 'var(--hover-bg, rgba(255, 255, 255, 0.04))'
      : 'transparent';

  const borderColor = isActive
    ? 'var(--accent-blue, #58a6ff)'
    : 'transparent';

  const textColor = isActive
    ? 'var(--text-primary, #e6edf3)'
    : 'var(--text-secondary, #8b949e)';

  return (
    <div
      style={{
        ...styles.row,
        background: rowBg,
        borderLeftColor: borderColor,
        opacity: layer.visible ? 1 : 0.5,
      }}
      onClick={() => setActiveLayer(layer.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Visibility toggle */}
      <button
        style={{
          ...styles.iconBtn,
          color: layer.visible
            ? 'var(--text-secondary, #8b949e)'
            : 'var(--text-muted, #484f58)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          updateLayer(layer.id, { visible: !layer.visible });
        }}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        {layer.visible ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2.5 2.5l9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Lock toggle */}
      <button
        style={{
          ...styles.iconBtn,
          color: layer.locked
            ? 'var(--accent-blue, #58a6ff)'
            : 'var(--text-muted, #484f58)',
        }}
        onClick={(e) => {
          e.stopPropagation();
          updateLayer(layer.id, { locked: !layer.locked });
        }}
        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
      >
        {layer.locked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2.5" y="5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2.5" y="5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 5V3.5a2 2 0 014 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Layer name */}
      {isEditing ? (
        <input
          ref={inputRef}
          style={styles.nameInput}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitName();
            if (e.key === 'Escape') {
              setEditName(layer.name);
              setIsEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          style={{ ...styles.name, color: textColor }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditName(layer.name);
            setIsEditing(true);
          }}
        >
          {layer.name}
        </span>
      )}

      {/* Frame-by-frame indicator */}
      {layer.isFrameByFrame && (
        <span
          title="Frame-by-frame layer"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'var(--accent-orange, #f0883e)',
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="2.5" width="4" height="7" rx="0.5" stroke="currentColor" strokeWidth="0.9" />
            <rect x="4.5" y="2.5" width="4" height="7" rx="0.5" stroke="currentColor" strokeWidth="0.9" />
            <rect x="8" y="2.5" width="3" height="7" rx="0.5" stroke="currentColor" strokeWidth="0.9" />
          </svg>
        </span>
      )}

      {/* Bone binding indicator */}
      {bindingCount > 0 && (
        <span
          title={`Bound to: ${tooltip}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'var(--accent-blue, #58a6ff)',
            flexShrink: 0,
            fontSize: 'var(--font-size-xs, 10px)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="5" cy="15" r="2.5" />
            <circle cx="15" cy="5" r="2.5" />
            <line x1="7" y1="13" x2="13" y2="7" />
          </svg>
          {bindingCount > 1 && <span>{bindingCount}</span>}
        </span>
      )}

      {/* Opacity */}
      <span style={styles.opacity}>
        {Math.round(layer.opacity * 100)}%
      </span>
    </div>
  );
}
