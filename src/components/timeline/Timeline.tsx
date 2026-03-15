import { useRef, useCallback, useState, useEffect } from 'react';
import { useBoneStore } from '../../store/boneStore';
import { useDrawingStore } from '../../store/drawingStore';
import { getLayerFrames, saveFrame, restoreFrame, hasFrameData, deleteFrame } from '../../engine/canvas/FrameCanvasManager';
import PlaybackControls from './PlaybackControls';

const TRACK_HEIGHT = 24;
const HEADER_HEIGHT = 28;
const FRAME_WIDTH = 20;
const RULER_HEIGHT = 22;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: 180,
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
  frameMarker: {
    position: 'absolute' as const,
    width: 14,
    height: 14,
    top: '50%',
    marginTop: -7,
    borderRadius: 3,
    background: 'var(--accent-orange, #f0883e)',
    cursor: 'pointer',
  },
  frameMarkerEmpty: {
    position: 'absolute' as const,
    width: 14,
    height: 14,
    top: '50%',
    marginTop: -7,
    borderRadius: 3,
    border: '1px dashed var(--text-muted, #484f58)',
    background: 'transparent',
    cursor: 'pointer',
  },
  noAnim: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: 'var(--text-muted, #484f58)',
    fontSize: 'var(--font-size-sm, 11px)',
  },
  contextMenu: {
    position: 'fixed' as const,
    zIndex: 1000,
    background: 'var(--bg-secondary, #1c2129)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
    borderRadius: 6,
    padding: '4px 0',
    minWidth: 160,
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  contextMenuItem: {
    display: 'block',
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary, #8b949e)',
    fontSize: 11,
    textAlign: 'left' as const,
    cursor: 'pointer',
  },
};

interface ContextMenuState {
  x: number;
  y: number;
  layerId: string;
  frame: number;
  hasData: boolean;
}

export default function Timeline() {
  const skeleton = useBoneStore((s) => s.skeleton);
  const animations = useBoneStore((s) => s.animations);
  const activeAnimationId = useBoneStore((s) => s.activeAnimationId);
  const currentTime = useBoneStore((s) => s.currentTime);
  const setCurrentTime = useBoneStore((s) => s.setCurrentTime);
  const layers = useDrawingStore((s) => s.layers);

  const framesRef = useRef<HTMLDivElement>(null);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [dupTarget, setDupTarget] = useState<{ layerId: string; srcFrame: number } | null>(null);

  const activeAnimation = animations.find((a) => a.id === activeAnimationId) ?? null;
  const totalFrames = activeAnimation ? Math.ceil(activeAnimation.duration * activeAnimation.fps) : 24;
  const fps = activeAnimation?.fps ?? 24;
  const currentFrame = Math.round(currentTime * fps);
  const contentWidth = totalFrames * FRAME_WIDTH;
  const bones = skeleton?.bones ?? [];
  const frameLayers = layers.filter((l) => l.isFrameByFrame);

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

  const handleFrameContextMenu = useCallback(
    (e: React.MouseEvent, layerId: string, frame: number) => {
      e.preventDefault();
      setCtxMenu({
        x: e.clientX,
        y: e.clientY,
        layerId,
        frame,
        hasData: hasFrameData(layerId, frame),
      });
    },
    [],
  );

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  const handleDuplicateStart = useCallback(() => {
    if (!ctxMenu) return;
    setDupTarget({ layerId: ctxMenu.layerId, srcFrame: ctxMenu.frame });
    setCtxMenu(null);
  }, [ctxMenu]);

  const handleDuplicateTo = useCallback(
    (targetFrame: number) => {
      if (!dupTarget) return;
      const layer = layers.find((l) => l.id === dupTarget.layerId);
      if (!layer?.canvas) { setDupTarget(null); return; }

      // Save current frame first
      saveFrame(layer.id, currentFrame, layer.canvas);

      // Restore source frame to canvas temporarily
      restoreFrame(dupTarget.layerId, dupTarget.srcFrame, layer.canvas);
      // Save it as target frame
      saveFrame(dupTarget.layerId, targetFrame, layer.canvas);

      // Restore the current frame back
      restoreFrame(layer.id, currentFrame, layer.canvas);

      setDupTarget(null);
    },
    [dupTarget, layers, currentFrame],
  );

  const handleClearFrame = useCallback(() => {
    if (!ctxMenu) return;
    const layer = layers.find((l) => l.id === ctxMenu.layerId);
    if (layer?.canvas && ctxMenu.frame === currentFrame) {
      const ctx = layer.canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    }
    deleteFrame(ctxMenu.layerId, ctxMenu.frame);
    setCtxMenu(null);
  }, [ctxMenu, layers, currentFrame]);

  // Esc to cancel duplicate mode
  useEffect(() => {
    if (!dupTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDupTarget(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dupTarget]);

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
    <div style={styles.container} onClick={closeCtxMenu}>
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
            {/* Frame layer track names */}
            {frameLayers.map((layer) => (
              <div
                key={layer.id}
                style={{
                  ...styles.trackNameRow,
                  color: 'var(--accent-orange, #f0883e)',
                  gap: 4,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="2" width="4" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.9" />
                  <rect x="4.5" y="2" width="4" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.9" />
                  <rect x="8" y="2" width="3" height="8" rx="0.5" stroke="currentColor" strokeWidth="0.9" />
                </svg>
                {layer.name}
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
              {/* Bone tracks */}
              {bones.map((bone) => {
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

              {/* Frame layer tracks */}
              {frameLayers.map((layer) => {
                const drawnFrames = getLayerFrames(layer.id);
                // Also include current frame if canvas has content
                const allFrames = new Set(drawnFrames);
                if (currentFrame >= 0) allFrames.add(currentFrame);

                return (
                  <div key={layer.id} style={styles.trackRow}>
                    {Array.from({ length: totalFrames }, (_, i) => {
                      const has = allFrames.has(i) && hasFrameData(layer.id, i);
                      const isCurrent = i === currentFrame;
                      const isDupSrc = dupTarget?.layerId === layer.id && dupTarget.srcFrame === i;

                      return (
                        <div
                          key={i}
                          style={{
                            ...(has ? styles.frameMarker : styles.frameMarkerEmpty),
                            left: i * FRAME_WIDTH + FRAME_WIDTH / 2 - 7,
                            ...(isCurrent && !has ? { borderColor: 'var(--accent-orange, #f0883e)', borderStyle: 'solid' } : {}),
                            ...(isDupSrc ? { outline: '2px solid var(--accent-blue, #58a6ff)' } : {}),
                            ...(dupTarget && dupTarget.layerId === layer.id && !isDupSrc ? { cursor: 'copy' } : {}),
                          }}
                          title={
                            dupTarget && dupTarget.layerId === layer.id && !isDupSrc
                              ? `Paste frame ${dupTarget.srcFrame} here`
                              : has ? `Frame ${i} (right-click for options)` : `Frame ${i} (empty)`
                          }
                          onClick={() => {
                            if (dupTarget && dupTarget.layerId === layer.id) {
                              handleDuplicateTo(i);
                            }
                          }}
                          onContextMenu={(e) => handleFrameContextMenu(e, layer.id, i)}
                        />
                      );
                    })}
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

      {/* Context menu */}
      {ctxMenu && (
        <div
          style={{ ...styles.contextMenu, left: ctxMenu.x, top: ctxMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {ctxMenu.hasData && (
            <button
              style={styles.contextMenuItem}
              onClick={handleDuplicateStart}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.06))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Duplicate frame {ctxMenu.frame} to...
            </button>
          )}
          {ctxMenu.hasData && (
            <button
              style={{ ...styles.contextMenuItem, color: '#f85149' }}
              onClick={handleClearFrame}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.06))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Clear frame {ctxMenu.frame}
            </button>
          )}
          {!ctxMenu.hasData && (
            <div style={{ ...styles.contextMenuItem, color: 'var(--text-muted, #484f58)', cursor: 'default' }}>
              Empty frame
            </div>
          )}
          <button
            style={styles.contextMenuItem}
            onClick={closeCtxMenu}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover-bg, rgba(255, 255, 255, 0.06))'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Duplicate mode indicator */}
      {dupTarget && (
        <div style={{
          position: 'absolute',
          bottom: 4,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent-blue, #58a6ff)',
          color: '#fff',
          padding: '3px 10px',
          borderRadius: 4,
          fontSize: 10,
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          Click a frame to paste frame {dupTarget.srcFrame} — press Esc to cancel
        </div>
      )}
    </div>
  );
}
