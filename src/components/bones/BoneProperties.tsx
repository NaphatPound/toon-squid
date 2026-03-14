import { useBoneStore } from '../../store/boneStore';
import { useDrawingStore } from '../../store/drawingStore';

const styles = {
  panel: {
    padding: 'var(--spacing-md, 12px)',
    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
  },
  sectionTitle: {
    fontSize: 'var(--font-size-xs, 10px)',
    fontWeight: 600,
    color: 'var(--text-muted, #484f58)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 'var(--spacing-sm, 8px)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
    alignItems: 'center',
  },
  fullRow: {
    gridColumn: '1 / -1',
  },
  label: {
    fontSize: 'var(--font-size-xs, 10px)',
    color: 'var(--text-muted, #484f58)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  input: {
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    borderRadius: 4,
    color: 'var(--text-primary, #e6edf3)',
    fontSize: 'var(--font-size-sm, 11px)',
    padding: '3px 6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  readonlyInput: {
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid transparent',
    borderRadius: 4,
    color: 'var(--text-secondary, #8b949e)',
    fontSize: 'var(--font-size-sm, 11px)',
    padding: '3px 6px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  nameInput: {
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    borderRadius: 4,
    color: 'var(--text-primary, #e6edf3)',
    fontSize: 'var(--font-size-md, 13px)',
    padding: '4px 8px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    marginBottom: 'var(--spacing-sm, 8px)',
  },
  empty: {
    color: 'var(--text-muted, #484f58)',
    fontSize: 'var(--font-size-sm, 11px)',
    textAlign: 'center' as const,
    padding: 'var(--spacing-md, 12px)',
  },
  fieldRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
};

const bindingRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 0',
  borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
};

const bindingNameStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 'var(--font-size-sm, 11px)',
  color: 'var(--text-primary, #e6edf3)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
};

const weightInputStyle: React.CSSProperties = {
  background: 'var(--bg-tertiary, #161b22)',
  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
  borderRadius: 3,
  color: 'var(--text-primary, #e6edf3)',
  fontSize: 'var(--font-size-xs, 10px)',
  padding: '2px 4px',
  outline: 'none',
  width: 44,
  textAlign: 'right' as const,
};

const removeBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted, #484f58)',
  borderRadius: 3,
  cursor: 'pointer',
  padding: 0,
  flexShrink: 0,
};

const autoMeshBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  width: '100%',
  padding: '5px 8px',
  marginBottom: 4,
  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
  borderRadius: 4,
  background: 'var(--bg-tertiary, #161b22)',
  color: 'var(--text-primary, #e6edf3)',
  fontSize: 'var(--font-size-sm, 11px)',
  cursor: 'pointer',
  boxSizing: 'border-box',
  transition: 'background 0.15s, color 0.15s',
};

export default function BoneProperties() {
  const selectedBoneId = useBoneStore((s) => s.selectedBoneId);
  const skeleton = useBoneStore((s) => s.skeleton);
  const updateBone = useBoneStore((s) => s.updateBone);
  const bindings = useBoneStore((s) => s.bindings);
  const bindLayerToBone = useBoneStore((s) => s.bindLayerToBone);
  const removeBinding = useBoneStore((s) => s.removeBinding);
  const updateBindingWeight = useBoneStore((s) => s.updateBindingWeight);
  const layers = useDrawingStore((s) => s.layers);

  const bone = skeleton?.bones.find((b) => b.id === selectedBoneId) ?? null;
  // All bindings for this bone
  const boneBindings = bone ? bindings.filter((b) => b.boneId === bone.id) : [];
  // Layer IDs already bound to this bone
  const boundLayerIds = new Set(boneBindings.map((b) => b.layerId));

  if (!bone) {
    return (
      <div style={styles.panel}>
        <div style={styles.empty}>Select a bone to view properties</div>
      </div>
    );
  }

  const handleNumberChange = (field: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateBone(bone.id, { [field]: num });
    }
  };

  // Available layers (not yet bound to this bone)
  const availableLayers = layers.filter((l) => !boundLayerIds.has(l.id));

  return (
    <div style={styles.panel}>
      <div style={styles.sectionTitle}>Properties</div>

      {/* Name */}
      <input
        style={styles.nameInput}
        value={bone.name}
        onChange={(e) => updateBone(bone.id, { name: e.target.value })}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-blue, #58a6ff)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
        }}
      />

      <div style={styles.grid}>
        {/* Position X */}
        <div style={styles.fieldRow}>
          <span style={styles.label}>X</span>
          <input
            style={styles.readonlyInput}
            value={bone.worldX.toFixed(1)}
            readOnly
          />
        </div>

        {/* Position Y */}
        <div style={styles.fieldRow}>
          <span style={styles.label}>Y</span>
          <input
            style={styles.readonlyInput}
            value={bone.worldY.toFixed(1)}
            readOnly
          />
        </div>

        {/* Rotation */}
        <div style={styles.fieldRow}>
          <span style={styles.label}>Rotation</span>
          <input
            style={styles.input}
            type="number"
            value={Math.round(bone.localRotation * (180 / Math.PI))}
            onChange={(e) => {
              const deg = parseFloat(e.target.value);
              if (!isNaN(deg)) {
                updateBone(bone.id, { localRotation: deg * (Math.PI / 180) });
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue, #58a6ff)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
            }}
          />
        </div>

        {/* Length */}
        <div style={styles.fieldRow}>
          <span style={styles.label}>Length</span>
          <input
            style={styles.input}
            type="number"
            value={bone.length.toFixed(1)}
            onChange={(e) => handleNumberChange('length', e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue, #58a6ff)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
            }}
          />
        </div>

        {/* Color */}
        <div style={styles.fieldRow}>
          <span style={styles.label}>Color</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="color"
              value={bone.color.startsWith('rgba') ? '#64a0ff' : bone.color}
              onChange={(e) => updateBone(bone.id, { color: e.target.value })}
              style={{
                width: 24,
                height: 20,
                padding: 0,
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                borderRadius: 3,
                background: 'transparent',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: 'var(--font-size-xs, 10px)', color: 'var(--text-muted, #484f58)' }}>
              {bone.color.startsWith('rgba') ? '#64a0ff' : bone.color}
            </span>
          </div>
        </div>
      </div>

      {/* Layer Bindings Section */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={styles.sectionTitle}>Layer Bindings</div>
          {boneBindings.length > 0 && (
            <span style={{ fontSize: 'var(--font-size-xs, 10px)', color: 'var(--text-muted, #484f58)' }}>
              {boneBindings.length} layer{boneBindings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* List of bound layers with weight */}
        {boneBindings.map((binding) => {
          const layer = layers.find((l) => l.id === binding.layerId);
          if (!layer) return null;
          return (
            <div key={binding.layerId} style={bindingRowStyle}>
              <span style={bindingNameStyle}>{layer.name}</span>
              <span style={{ fontSize: 'var(--font-size-xs, 10px)', color: 'var(--text-muted, #484f58)', flexShrink: 0 }}>W</span>
              <input
                style={weightInputStyle}
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={binding.weight.toFixed(2)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    updateBindingWeight(bone.id, binding.layerId, val);
                  }
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-blue, #58a6ff)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
                }}
              />
              <button
                style={removeBtnStyle}
                onClick={() => removeBinding(bone.id, binding.layerId)}
                title="Remove binding"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f85149';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted, #484f58)';
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          );
        })}

        {/* Add layer binding */}
        {availableLayers.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <select
              style={{
                ...styles.input,
                cursor: 'pointer',
              }}
              value=""
              onChange={(e) => {
                const layerId = e.target.value;
                if (layerId) {
                  bindLayerToBone(bone.id, layerId);
                }
              }}
            >
              <option value="">+ Add layer...</option>
              {availableLayers.map((layer) => (
                <option key={layer.id} value={layer.id}>
                  {layer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {boneBindings.length === 0 && availableLayers.length === 0 && (
          <div style={{ ...styles.empty, padding: '6px 0' }}>No layers available</div>
        )}

        {/* Auto Mesh buttons per bound layer */}
        {boneBindings.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {boneBindings.map((binding) => {
              const layer = layers.find((l) => l.id === binding.layerId);
              if (!layer) return null;
              const hasMesh = !!useBoneStore.getState().getMesh(binding.layerId);
              return (
                <button
                  key={binding.layerId}
                  style={autoMeshBtnStyle}
                  onClick={() => {
                    useBoneStore.getState().generateMesh(layer);
                  }}
                  title={hasMesh ? `Rebuild mesh for ${layer.name}` : `Generate mesh for ${layer.name}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-blue, #58a6ff)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-tertiary, #161b22)';
                    e.currentTarget.style.color = 'var(--text-primary, #e6edf3)';
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <path d="M1 1h3v3H1zM5 1h3v3H5zM9 1h2v3H9zM1 5h3v3H1zM5 5h3v3H5zM9 5h2v3H9zM1 9h3v2H1zM5 9h3v2H5zM9 9h2v2H9z" />
                  </svg>
                  {hasMesh ? 'Rebuild' : 'Auto'} Mesh: {layer.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
