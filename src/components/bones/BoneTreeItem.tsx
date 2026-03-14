import { useState } from 'react';
import type { Bone } from '../../types/bone';
import { useBoneStore } from '../../store/boneStore';

interface BoneTreeItemProps {
  bone: Bone;
  depth: number;
}

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    height: 28,
    cursor: 'pointer',
    gap: 'var(--spacing-xs, 4px)',
    transition: 'background 0.1s',
    paddingRight: 'var(--spacing-sm, 8px)',
  },
  expandBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted, #484f58)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  expandPlaceholder: {
    width: 16,
    height: 16,
    flexShrink: 0,
  },
  boneIcon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    fontSize: 'var(--font-size-sm, 11px)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    minWidth: 0,
  },
  visBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    border: 'none',
    background: 'transparent',
    borderRadius: 3,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    opacity: 0,
    transition: 'opacity 0.15s',
  },
};

export default function BoneTreeItem({ bone, depth }: BoneTreeItemProps) {
  const skeleton = useBoneStore((s) => s.skeleton);
  const selectedBoneId = useBoneStore((s) => s.selectedBoneId);
  const hoveredBoneId = useBoneStore((s) => s.hoveredBoneId);
  const selectBone = useBoneStore((s) => s.selectBone);
  const setHoveredBone = useBoneStore((s) => s.setHoveredBone);
  const updateBone = useBoneStore((s) => s.updateBone);

  const [expanded, setExpanded] = useState(true);
  const [rowHovered, setRowHovered] = useState(false);

  const children = skeleton
    ? skeleton.bones.filter((b) => b.parentId === bone.id)
    : [];
  const hasChildren = children.length > 0;

  const isSelected = selectedBoneId === bone.id;
  const isHovered = hoveredBoneId === bone.id;

  const rowBg = isSelected
    ? 'var(--active-bg, rgba(255, 255, 255, 0.08))'
    : isHovered || rowHovered
      ? 'var(--hover-bg, rgba(255, 255, 255, 0.04))'
      : 'transparent';

  const textColor = isSelected
    ? 'var(--text-primary, #e6edf3)'
    : 'var(--text-secondary, #8b949e)';

  return (
    <>
      <div
        style={{
          ...styles.row,
          background: rowBg,
          paddingLeft: depth * 16 + 4,
          opacity: bone.visible ? 1 : 0.5,
        }}
        onClick={() => selectBone(bone.id)}
        onMouseEnter={() => {
          setRowHovered(true);
          setHoveredBone(bone.id);
        }}
        onMouseLeave={() => {
          setRowHovered(false);
          setHoveredBone(null);
        }}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            style={styles.expandBtn}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              style={{
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            >
              <path d="M2 1l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div style={styles.expandPlaceholder} />
        )}

        {/* Bone icon */}
        <div style={styles.boneIcon}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 9l6-6M2.5 3.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM9.5 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"
              stroke={bone.color || 'var(--accent-blue, #58a6ff)'}
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Name */}
        <span style={{ ...styles.name, color: textColor }}>
          {bone.name}
        </span>

        {/* Visibility toggle */}
        <button
          style={{
            ...styles.visBtn,
            opacity: rowHovered || !bone.visible ? 1 : 0,
            color: bone.visible
              ? 'var(--text-secondary, #8b949e)'
              : 'var(--text-muted, #484f58)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            updateBone(bone.id, { visible: !bone.visible });
          }}
          title={bone.visible ? 'Hide bone' : 'Show bone'}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            {bone.visible ? (
              <>
                <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2" />
              </>
            ) : (
              <>
                <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2.5 2.5l9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        children.map((child) => (
          <BoneTreeItem key={child.id} bone={child} depth={depth + 1} />
        ))
      )}
    </>
  );
}
