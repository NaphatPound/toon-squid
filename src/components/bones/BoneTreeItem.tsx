import { useState, useRef } from 'react';
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
    cursor: 'grab',
    gap: 'var(--spacing-xs, 4px)',
    transition: 'background 0.1s',
    paddingRight: 'var(--spacing-sm, 8px)',
    position: 'relative' as const,
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
  actionBtn: {
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
  dropIndicator: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 2,
    background: 'var(--accent-blue, #58a6ff)',
    pointerEvents: 'none' as const,
    zIndex: 10,
  },
};

export default function BoneTreeItem({ bone, depth }: BoneTreeItemProps) {
  const skeleton = useBoneStore((s) => s.skeleton);
  const selectedBoneId = useBoneStore((s) => s.selectedBoneId);
  const hoveredBoneId = useBoneStore((s) => s.hoveredBoneId);
  const selectBone = useBoneStore((s) => s.selectBone);
  const setHoveredBone = useBoneStore((s) => s.setHoveredBone);
  const updateBone = useBoneStore((s) => s.updateBone);
  const removeBone = useBoneStore((s) => s.removeBone);
  const reparentBone = useBoneStore((s) => s.reparentBone);

  const [expanded, setExpanded] = useState(true);
  const [rowHovered, setRowHovered] = useState(false);
  const [dropTarget, setDropTarget] = useState<'none' | 'above' | 'on' | 'below'>('none');
  const rowRef = useRef<HTMLDivElement>(null);

  const children = skeleton
    ? skeleton.bones.filter((b) => b.parentId === bone.id)
    : [];
  const hasChildren = children.length > 0;

  const isSelected = selectedBoneId === bone.id;
  const isHovered = hoveredBoneId === bone.id;

  const rowBg = dropTarget === 'on'
    ? 'rgba(88, 166, 255, 0.15)'
    : isSelected
      ? 'var(--active-bg, rgba(255, 255, 255, 0.08))'
      : isHovered || rowHovered
        ? 'var(--hover-bg, rgba(255, 255, 255, 0.04))'
        : 'transparent';

  const textColor = isSelected
    ? 'var(--text-primary, #e6edf3)'
    : 'var(--text-secondary, #8b949e)';

  // --- Drag handlers ---
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('bone-id', bone.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const third = rect.height / 3;

    if (y < third) {
      setDropTarget('above');
    } else if (y > third * 2) {
      setDropTarget('below');
    } else {
      setDropTarget('on'); // drop as child
    }
  };

  const handleDragLeave = () => {
    setDropTarget('none');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('bone-id');
    if (!draggedId || draggedId === bone.id) {
      setDropTarget('none');
      return;
    }

    if (dropTarget === 'on') {
      // Reparent as child of this bone
      reparentBone(draggedId, bone.id);
      setExpanded(true);
    } else if (dropTarget === 'above' || dropTarget === 'below') {
      // Reparent as sibling (same parent as this bone)
      reparentBone(draggedId, bone.parentId);
    }

    setDropTarget('none');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeBone(bone.id);
  };

  return (
    <>
      <div
        ref={rowRef}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
        {/* Drop indicator lines */}
        {dropTarget === 'above' && (
          <div style={{ ...styles.dropIndicator, top: 0 }} />
        )}
        {dropTarget === 'below' && (
          <div style={{ ...styles.dropIndicator, bottom: 0 }} />
        )}

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

        {/* Delete button */}
        <button
          style={{
            ...styles.actionBtn,
            opacity: rowHovered ? 1 : 0,
            color: 'var(--text-muted, #484f58)',
          }}
          onClick={handleDelete}
          title="Delete bone"
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

        {/* Visibility toggle */}
        <button
          style={{
            ...styles.actionBtn,
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
