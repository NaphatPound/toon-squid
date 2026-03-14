import { useState } from 'react';
import { useBoneStore } from '../../store/boneStore';
import { useDrawingStore } from '../../store/drawingStore';
import BoneTreeItem from './BoneTreeItem';

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
  tree: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: 'var(--spacing-xs, 4px) 0',
  },
  empty: {
    padding: 'var(--spacing-md, 12px)',
    color: 'var(--text-muted, #484f58)',
    fontSize: 'var(--font-size-sm, 11px)',
    textAlign: 'center' as const,
  },
};

export default function BoneTreePanel() {
  const skeleton = useBoneStore((s) => s.skeleton);
  const addBone = useBoneStore((s) => s.addBone);
  const createSkeleton = useBoneStore((s) => s.createSkeleton);
  const bindLayerToBone = useBoneStore((s) => s.bindLayerToBone);
  const autoWeightLayer = useBoneStore((s) => s.autoWeightLayer);
  const reparentBone = useBoneStore((s) => s.reparentBone);

  const [rootDropHover, setRootDropHover] = useState(false);

  const rootBones = skeleton
    ? skeleton.bones.filter((b) => b.parentId === null)
    : [];

  const handleAddRootBone = () => {
    if (!skeleton) {
      createSkeleton('Skeleton');
    }
    const { canvasWidth, canvasHeight, activeLayerId } = useDrawingStore.getState();
    const newId = addBone(null, canvasWidth / 2, canvasHeight / 2, 80, 0);
    if (activeLayerId && newId) {
      bindLayerToBone(newId, activeLayerId);
      autoWeightLayer(activeLayerId);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Skeleton</span>
        <button
          style={styles.addBtn}
          onClick={handleAddRootBone}
          title="Add root bone"
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

      <div
        style={styles.tree}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setRootDropHover(true);
        }}
        onDragLeave={() => setRootDropHover(false)}
        onDrop={(e) => {
          e.preventDefault();
          const draggedId = e.dataTransfer.getData('bone-id');
          if (draggedId) {
            reparentBone(draggedId, null);
          }
          setRootDropHover(false);
        }}
      >
        {!skeleton || rootBones.length === 0 ? (
          <div style={styles.empty}>No bones</div>
        ) : (
          rootBones.map((bone) => (
            <BoneTreeItem key={bone.id} bone={bone} depth={0} />
          ))
        )}
        {/* Root drop zone */}
        {rootDropHover && (
          <div style={{
            height: 24,
            margin: '2px 8px',
            border: '1px dashed var(--accent-blue, #58a6ff)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xs, 10px)',
            color: 'var(--accent-blue, #58a6ff)',
          }}>
            Drop here to make root
          </div>
        )}
      </div>
    </div>
  );
}
