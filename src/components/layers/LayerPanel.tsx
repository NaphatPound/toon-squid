import { useDrawingStore } from '../../store/drawingStore';
import LayerItem from './LayerItem';

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'var(--bg-panel, rgba(22, 27, 34, 0.85))',
    borderLeft: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    height: '100%',
    minWidth: 220,
    userSelect: 'none' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-sm, 8px) var(--spacing-md, 12px)',
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    flexShrink: 0,
  },
  title: {
    fontSize: 'var(--font-size-sm, 11px)',
    fontWeight: 600,
    color: 'var(--text-secondary, #8b949e)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  addBtn: {
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
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 'var(--spacing-xs, 4px) 0',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 'var(--spacing-xs, 4px) var(--spacing-md, 12px)',
    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    flexShrink: 0,
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted, #484f58)',
    borderRadius: 4,
    cursor: 'pointer',
    padding: 0,
  },
  empty: {
    padding: 'var(--spacing-md, 12px)',
    color: 'var(--text-muted, #484f58)',
    fontSize: 'var(--font-size-sm, 11px)',
    textAlign: 'center' as const,
  },
};

export default function LayerPanel() {
  const layers = useDrawingStore((s) => s.layers);
  const activeLayerId = useDrawingStore((s) => s.activeLayerId);
  const addLayer = useDrawingStore((s) => s.addLayer);
  const removeLayer = useDrawingStore((s) => s.removeLayer);

  const reversedLayers = [...layers].reverse();

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Layers</span>
        <button
          style={styles.addBtn}
          onClick={addLayer}
          title="Add layer"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary, #e6edf3)';
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

      <div style={styles.list}>
        {reversedLayers.length === 0 ? (
          <div style={styles.empty}>No layers</div>
        ) : (
          reversedLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={layer.id === activeLayerId}
            />
          ))
        )}
      </div>

      <div style={styles.footer}>
        <button
          style={{
            ...styles.deleteBtn,
            opacity: layers.length <= 1 ? 0.3 : 1,
            cursor: layers.length <= 1 ? 'default' : 'pointer',
          }}
          onClick={() => activeLayerId && removeLayer(activeLayerId)}
          disabled={layers.length <= 1}
          title="Delete layer"
          onMouseEnter={(e) => {
            if (layers.length > 1) {
              e.currentTarget.style.color = '#f85149';
              e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted, #484f58)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 4h8M5.5 4V3a1 1 0 011-1h1a1 1 0 011 1v1M6 6.5v3M8 6.5v3M4 4l.5 7a1 1 0 001 1h3a1 1 0 001-1L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
