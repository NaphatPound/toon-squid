import { useBoneStore } from '../../store/boneStore';
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

  const rootBones = skeleton
    ? skeleton.bones.filter((b) => b.parentId === null)
    : [];

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>Skeleton</span>
      </div>

      <div style={styles.tree}>
        {!skeleton || rootBones.length === 0 ? (
          <div style={styles.empty}>No bones</div>
        ) : (
          rootBones.map((bone) => (
            <BoneTreeItem key={bone.id} bone={bone} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
