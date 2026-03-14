import React, { useCallback, useMemo, useState } from 'react';
import { useBoneStore } from '../../store/boneStore';

const BoneTools: React.FC = () => {
  const skeleton = useBoneStore((s) => s.skeleton);
  const selectedBoneId = useBoneStore((s) => s.selectedBoneId);
  const addBone = useBoneStore((s) => s.addBone);
  const removeBone = useBoneStore((s) => s.removeBone);
  const updateBone = useBoneStore((s) => s.updateBone);
  const createSkeleton = useBoneStore((s) => s.createSkeleton);


  const selectedBone = useMemo(
    () => skeleton?.bones.find((b) => b.id === selectedBoneId) ?? null,
    [skeleton, selectedBoneId]
  );

  const handleAddRoot = useCallback(() => {
    if (!skeleton) {
      createSkeleton('Skeleton');
    }
    // Add a root bone at center of canvas
    addBone(null, 400, 300, 80, 0);
  }, [skeleton, createSkeleton, addBone]);

  const handleAddChild = useCallback(() => {
    if (!selectedBoneId || !selectedBone) return;
    const endX = selectedBone.worldX + Math.cos(selectedBone.worldRotation * Math.PI / 180) * selectedBone.length;
    const endY = selectedBone.worldY + Math.sin(selectedBone.worldRotation * Math.PI / 180) * selectedBone.length;
    addBone(selectedBoneId, endX, endY, 60, 0);
  }, [selectedBoneId, selectedBone, addBone]);

  const handleDelete = useCallback(() => {
    if (!selectedBoneId) return;
    removeBone(selectedBoneId);
  }, [selectedBoneId, removeBone]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedBoneId) return;
      updateBone(selectedBoneId, { name: e.target.value });
    },
    [selectedBoneId, updateBone]
  );

  const handleRotationChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedBoneId) return;
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) {
        updateBone(selectedBoneId, { localRotation: v });
      }
    },
    [selectedBoneId, updateBone]
  );

  const handleLengthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedBoneId) return;
      const v = parseFloat(e.target.value);
      if (!isNaN(v) && v > 0) {
        updateBone(selectedBoneId, { length: v });
      }
    },
    [selectedBoneId, updateBone]
  );

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
      buttonRow: {
        display: 'flex',
        gap: 6,
      },
      button: {
        flex: 1,
        height: 30,
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        borderRadius: 5,
        backgroundColor: 'var(--active-bg, rgba(255, 255, 255, 0.08))',
        color: 'var(--text-primary, #e6edf3)',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        padding: '0 8px',
      },
      deleteButton: {
        flex: 1,
        height: 30,
        border: '1px solid rgba(248, 81, 73, 0.3)',
        borderRadius: 5,
        backgroundColor: 'rgba(248, 81, 73, 0.1)',
        color: '#f85149',
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        padding: '0 8px',
      },
      disabledButton: {
        opacity: 0.4,
        cursor: 'not-allowed' as const,
      },
      separator: {
        width: '100%',
        height: 1,
        backgroundColor: 'var(--border-color, rgba(255, 255, 255, 0.08))',
        margin: '4px 0',
      },
      sectionTitle: {
        fontSize: 11,
        color: 'var(--text-secondary, #8b949e)',
        marginBottom: 2,
      },
      propertyRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 28,
      },
      propertyLabel: {
        fontSize: 11,
        color: 'var(--text-secondary, #8b949e)',
        minWidth: 56,
        flexShrink: 0,
        userSelect: 'none' as const,
      },
      propertyInput: {
        flex: 1,
        height: 26,
        background: 'var(--active-bg, rgba(255, 255, 255, 0.08))',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
        borderRadius: 4,
        color: 'var(--text-primary, #e6edf3)',
        fontSize: 11,
        fontFamily: 'monospace',
        padding: '0 6px',
        outline: 'none',
      },
      emptyState: {
        fontSize: 11,
        color: 'var(--text-secondary, #8b949e)',
        fontStyle: 'italic' as const,
        textAlign: 'center' as const,
        padding: '12px 0',
      },
      boneCount: {
        fontSize: 10,
        color: 'var(--text-secondary, #8b949e)',
      },
    }),
    []
  );

  const boneCount = skeleton?.bones.length ?? 0;

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={styles.title}>Bones</span>
        <span style={styles.boneCount}>
          {boneCount} bone{boneCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={styles.buttonRow}>
        <ActionButton
          label={selectedBoneId ? 'Add Child' : 'Add Root Bone'}
          style={styles.button}
          onClick={selectedBoneId ? handleAddChild : handleAddRoot}
        />
        <ActionButton
          label="Delete Selected"
          style={{
            ...styles.deleteButton,
            ...(selectedBoneId ? {} : styles.disabledButton),
          }}
          onClick={handleDelete}
          disabled={!selectedBoneId}
        />
      </div>

      <div style={styles.separator} />

      {selectedBone ? (
        <>
          <span style={styles.sectionTitle}>Selected Bone</span>

          <div style={styles.propertyRow}>
            <span style={styles.propertyLabel}>Name</span>
            <input
              type="text"
              value={selectedBone.name}
              onChange={handleNameChange}
              style={styles.propertyInput}
              spellCheck={false}
            />
          </div>

          <div style={styles.propertyRow}>
            <span style={styles.propertyLabel}>Rotation</span>
            <input
              type="number"
              value={Math.round(selectedBone.localRotation * 100) / 100}
              onChange={handleRotationChange}
              style={styles.propertyInput}
              step={1}
            />
            <span style={{ fontSize: 10, color: '#8b949e' }}>deg</span>
          </div>

          <div style={styles.propertyRow}>
            <span style={styles.propertyLabel}>Length</span>
            <input
              type="number"
              value={Math.round(selectedBone.length * 100) / 100}
              onChange={handleLengthChange}
              style={styles.propertyInput}
              step={1}
              min={1}
            />
            <span style={{ fontSize: 10, color: '#8b949e' }}>px</span>
          </div>

          <div style={styles.propertyRow}>
            <span style={styles.propertyLabel}>Position</span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-primary, #e6edf3)',
                fontFamily: 'monospace',
              }}
            >
              {Math.round(selectedBone.worldX)}, {Math.round(selectedBone.worldY)}
            </span>
          </div>

          <div style={styles.propertyRow}>
            <span style={styles.propertyLabel}>Parent</span>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-secondary, #8b949e)',
                fontStyle: selectedBone.parentId ? 'normal' : 'italic',
              }}
            >
              {selectedBone.parentId
                ? skeleton?.bones.find((b) => b.id === selectedBone.parentId)
                    ?.name ?? 'Unknown'
                : 'None (root)'}
            </span>
          </div>
        </>
      ) : (
        <div style={styles.emptyState}>
          {boneCount > 0
            ? 'Click a bone to select it'
            : 'Add a root bone to get started'}
        </div>
      )}
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  style: React.CSSProperties;
  onClick: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = React.memo(
  ({ label, style, onClick, disabled }) => {
    const [hovered, setHovered] = useState(false);

    const mergedStyle: React.CSSProperties = {
      ...style,
      backgroundColor: hovered && !disabled
        ? 'var(--hover-bg, rgba(255, 255, 255, 0.06))'
        : style.backgroundColor,
    };

    return (
      <button
        style={mergedStyle}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {label}
      </button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

export default BoneTools;
