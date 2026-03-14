import { useBoneStore } from '../../store/boneStore';
import { generateId } from '../../utils/math';
import type { Pose, BoneTransform } from '../../types/bone';

const FPS_OPTIONS = [12, 24, 30, 60];

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    height: 30,
    padding: '0 var(--spacing-sm, 8px)',
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    gap: 'var(--spacing-sm, 8px)',
    flexShrink: 0,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #8b949e)',
    borderRadius: 4,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  activeBtn: {
    color: 'var(--accent-blue, #58a6ff)',
  },
  frameDisplay: {
    fontSize: 'var(--font-size-xs, 10px)',
    color: 'var(--text-secondary, #8b949e)',
    whiteSpace: 'nowrap' as const,
    fontVariantNumeric: 'tabular-nums',
  },
  separator: {
    width: 1,
    height: 16,
    background: 'var(--border-color, rgba(255, 255, 255, 0.08))',
    flexShrink: 0,
  },
  spacer: {
    flex: 1,
  },
  fpsSelect: {
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    borderRadius: 4,
    color: 'var(--text-secondary, #8b949e)',
    fontSize: 'var(--font-size-xs, 10px)',
    padding: '2px 4px',
    outline: 'none',
    cursor: 'pointer',
  },
  label: {
    fontSize: 'var(--font-size-xs, 10px)',
    color: 'var(--text-muted, #484f58)',
  },
};

export default function PlaybackControls() {
  const isPlaying = useBoneStore((s) => s.isPlaying);
  const setIsPlaying = useBoneStore((s) => s.setIsPlaying);
  const currentTime = useBoneStore((s) => s.currentTime);
  const setCurrentTime = useBoneStore((s) => s.setCurrentTime);
  const animations = useBoneStore((s) => s.animations);
  const activeAnimationId = useBoneStore((s) => s.activeAnimationId);
  const addAnimation = useBoneStore((s) => s.addAnimation);
  const addPose = useBoneStore((s) => s.addPose);
  const skeleton = useBoneStore((s) => s.skeleton);

  const activeAnimation = animations.find((a) => a.id === activeAnimationId) ?? null;
  const fps = activeAnimation?.fps ?? 24;
  const totalFrames = activeAnimation ? Math.ceil(activeAnimation.duration * fps) : 24;
  const currentFrame = Math.round(currentTime * fps) + 1;

  const handlePlay = () => setIsPlaying(!isPlaying);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleNewAnimation = () => {
    addAnimation('Animation 1', 24, 2);
  };

  const handleRecordKeyframe = () => {
    if (!activeAnimation || !skeleton) return;
    // Record current bone transforms as a keyframe at currentTime
    const boneTransforms: Record<string, BoneTransform> = {};
    for (const bone of skeleton.bones) {
      boneTransforms[bone.id] = {
        rotation: bone.localRotation,
        scaleX: bone.localScaleX,
        scaleY: bone.localScaleY,
        translateX: 0,
        translateY: 0,
      };
    }
    const pose: Pose = {
      id: generateId(),
      name: `Pose @ ${currentTime.toFixed(2)}s`,
      time: currentTime,
      boneTransforms,
    };
    // Remove existing pose at same time (replace)
    const existingPose = activeAnimation.poses.find(
      (p) => Math.abs(p.time - currentTime) < 0.001
    );
    if (existingPose) {
      useBoneStore.getState().removePose(activeAnimation.id, existingPose.id);
    }
    addPose(activeAnimation.id, pose);
  };

  const handleFpsChange = (_newFps: number) => {
    if (!activeAnimation) return;
  };

  return (
    <div style={styles.bar}>
      {/* Play/Pause */}
      <button
        style={{
          ...styles.btn,
          ...(isPlaying ? styles.activeBtn : {}),
        }}
        onClick={handlePlay}
        title={isPlaying ? 'Pause' : 'Play'}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
            <rect x="7" y="2" width="3" height="8" rx="0.5" fill="currentColor" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 1.5v9l7.5-4.5L3 1.5z" fill="currentColor" />
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        style={styles.btn}
        onClick={handleStop}
        title="Stop"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor" />
        </svg>
      </button>

      {/* New Animation (only when none exists) */}
      {!activeAnimation && (
        <button
          style={styles.btn}
          onClick={handleNewAnimation}
          title="New Animation"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Record Keyframe */}
      {activeAnimation && (
        <button
          style={{
            ...styles.btn,
            color: '#f85149',
          }}
          onClick={handleRecordKeyframe}
          title="Record Keyframe"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" fill="currentColor" />
          </svg>
        </button>
      )}

      <div style={styles.separator} />

      {/* Frame display */}
      <span style={styles.frameDisplay}>
        Frame {currentFrame} / {totalFrames}
      </span>

      <div style={styles.spacer} />

      {/* FPS selector */}
      <span style={styles.label}>FPS</span>
      <select
        style={styles.fpsSelect}
        value={fps}
        onChange={(e) => handleFpsChange(parseInt(e.target.value, 10))}
      >
        {FPS_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <div style={styles.separator} />

      {/* Loop toggle */}
      <button
        style={{
          ...styles.btn,
          ...(activeAnimation?.loop ? styles.activeBtn : {}),
        }}
        title={activeAnimation?.loop ? 'Loop on' : 'Loop off'}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.04))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M10.5 3H4.5a2 2 0 00-2 2v1M3.5 11h6a2 2 0 002-2V8"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M8.5 1l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 13l-2-2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
