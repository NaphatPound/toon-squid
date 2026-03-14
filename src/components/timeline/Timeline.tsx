import { useRef, useCallback } from 'react';
import { useBoneStore } from '../../store/boneStore';
import PlaybackControls from './PlaybackControls';

const TRACK_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const FRAME_WIDTH = 20;
const RULER_HEIGHT = 22;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 150,
    background: 'var(--bg-panel, rgba(22, 27, 34, 0.85))',
    borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    userSelect: 'none' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    flexShrink: 0,
  },
  trackLabel: {
    width: 140,
    flexShrink: 0,
    borderRight: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 'var(--spacing-md, 12px)',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  trackNames: {
    width: 140,
    flexShrink: 0,
    borderRight: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    overflowY: 'auto' as const,
  },
  trackNameRow: {
    display: 'flex',
    alignItems: 'center',
    height: TRACK_HEIGHT,
    paddingLeft: 'var(--spacing-md, 12px)',
    fontSize: 'var(--font-size-xs, 10px)',
    color: 'var(--text-secondary, #8b949e)',
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  framesArea: {
    flex: 1,
    overflow: 'auto',
    position: 'relative' as const,
  },
  ruler: {
    height: RULER_HEIGHT,
    position: 'sticky' as const,
    top: 0,
    zIndex: 2,
    background: 'var(--bg-tertiary, #161b22)',
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    cursor: 'pointer',
  },
  rulerCanvas: {
    display: 'block',
  },
  tracksContainer: {
    position: 'relative' as const,
  },
  trackRow: {
    height: TRACK_HEIGHT,
    borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    position: 'relative' as const,
  },
  playhead: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    width: 1,
    background: 'var(--accent-blue, #58a6ff)',
    zIndex: 3,
    pointerEvents: 'none' as const,
  },
  playheadHead: {
    position: 'absolute' as const,
    top: 0,
    left: -5,
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTop: '6px solid var(--accent-blue, #58a6ff)',
  },
  keyframe: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    transform: 'rotate(45deg) translate(-50%, -50%)',
    background: 'var(--accent-blue, #58a6ff)',
    top: '50%',
    marginTop: -4,
    borderRadius: 1,
  },
  noAnim: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: 'var(--text-muted, #484f58)',
    fontSize: 'var(--font-size-sm, 11px)',
  },
};

export default function Timeline() {
  const skeleton = useBoneStore((s) => s.skeleton);
  const animations = useBoneStore((s) => s.animations);
  const activeAnimationId = useBoneStore((s) => s.activeAnimationId);
  const currentTime = useBoneStore((s) => s.currentTime);
  const setCurrentTime = useBoneStore((s) => s.setCurrentTime);

  const framesRef = useRef<HTMLDivElement>(null);

  const activeAnimation = animations.find((a) => a.id === activeAnimationId) ?? null;
  const totalFrames = activeAnimation ? Math.ceil(activeAnimation.duration * activeAnimation.fps) : 24;
  const fps = activeAnimation?.fps ?? 24;
  const currentFrame = Math.round(currentTime * fps);

  const contentWidth = totalFrames * FRAME_WIDTH;
  const bones = skeleton?.bones ?? [];

  const scrubToPosition = useCallback(
    (clientX: number) => {
      if (!framesRef.current) return;
      const rect = framesRef.current.getBoundingClientRect();
      const scrollLeft = framesRef.current.scrollLeft;
      const x = clientX - rect.left + scrollLeft;
      const frame = Math.max(0, Math.min(totalFrames - 1, Math.floor(x / FRAME_WIDTH)));
      setCurrentTime(frame / fps);
    },
    [totalFrames, fps, setCurrentTime],
  );

  const handleRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      scrubToPosition(e.clientX);

      const handleMove = (ev: MouseEvent) => scrubToPosition(ev.clientX);
      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [scrubToPosition],
  );

  // Render ruler frame markers
  const rulerMarkers: React.ReactNode[] = [];
  for (let i = 0; i < totalFrames; i++) {
    const x = i * FRAME_WIDTH;
    const isMajor = i % 5 === 0;
    rulerMarkers.push(
      <g key={i}>
        <line
          x1={x + FRAME_WIDTH / 2}
          y1={isMajor ? 8 : 14}
          x2={x + FRAME_WIDTH / 2}
          y2={RULER_HEIGHT}
          stroke="var(--text-muted, #484f58)"
          strokeWidth="1"
        />
        {isMajor && (
          <text
            x={x + FRAME_WIDTH / 2}
            y={8}
            fill="var(--text-muted, #484f58)"
            fontSize="9"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {i}
          </text>
        )}
      </g>,
    );
  }

  return (
    <div style={styles.container}>
      <PlaybackControls />

      {!activeAnimation ? (
        <div style={styles.noAnim}>No animation selected</div>
      ) : (
        <div style={styles.body}>
          {/* Track names column */}
          <div style={styles.trackNames}>
            {bones.map((bone) => (
              <div key={bone.id} style={styles.trackNameRow}>
                {bone.name}
              </div>
            ))}
          </div>

          {/* Frames area */}
          <div style={styles.framesArea} ref={framesRef}>
            {/* Ruler */}
            <div style={styles.ruler} onMouseDown={handleRulerMouseDown}>
              <svg
                width={contentWidth}
                height={RULER_HEIGHT}
                style={styles.rulerCanvas}
              >
                {rulerMarkers}
              </svg>
            </div>

            {/* Tracks */}
            <div style={{ ...styles.tracksContainer, width: contentWidth }}>
              {bones.map((bone) => {
                // Find keyframes for this bone in the active animation
                const keyframeTimes = activeAnimation.poses
                  .filter((p) => bone.id in p.boneTransforms)
                  .map((p) => p.time);

                return (
                  <div key={bone.id} style={styles.trackRow}>
                    {keyframeTimes.map((time, ki) => (
                      <div
                        key={ki}
                        style={{
                          ...styles.keyframe,
                          left: Math.round(time * fps) * FRAME_WIDTH + FRAME_WIDTH / 2 - 4,
                        }}
                      />
                    ))}
                  </div>
                );
              })}

              {/* Playhead */}
              <div
                style={{
                  ...styles.playhead,
                  left: currentFrame * FRAME_WIDTH + FRAME_WIDTH / 2,
                  top: -RULER_HEIGHT,
                }}
              >
                <div style={styles.playheadHead} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
