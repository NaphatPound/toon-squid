import React, { lazy, Suspense } from 'react';
import { useUIStore } from '../../store/uiStore';
import Toolbar from './Toolbar';
import StatusBar from './StatusBar';

// Lazy-load heavy child panels; fall back to empty divs while loading
const ToolPanel = lazy(() => import('../tools/ToolPanel'));
const CanvasViewport = lazy(() => import('../canvas/CanvasViewport'));
const BrushSettings = lazy(() => import('../tools/BrushSettings'));
const LayerPanel = lazy(() => import('../layers/LayerPanel'));
const BoneTreePanel = lazy(() => import('../bones/BoneTreePanel'));
const BoneProperties = lazy(() => import('../bones/BoneProperties'));
const Timeline = lazy(() => import('../timeline/Timeline'));

/* ------------------------------------------------------------------ */
/*  Fallback placeholder shown while lazy chunks load                  */
/* ------------------------------------------------------------------ */
const Placeholder: React.FC<{ name?: string }> = ({ name }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      color: 'var(--text-muted)',
      fontSize: 'var(--font-size-sm)',
    }}
  >
    {name ?? ''}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Right panel contents based on mode                                */
/* ------------------------------------------------------------------ */
function RightPanel() {
  const appMode = useUIStore((s) => s.appMode);

  if (appMode === 'draw') {
    return (
      <Suspense fallback={<Placeholder name="Loading..." />}>
        <BrushSettings />
        <LayerPanel />
      </Suspense>
    );
  }

  if (appMode === 'rig') {
    return (
      <Suspense fallback={<Placeholder name="Loading..." />}>
        <LayerPanel />
        <BoneTreePanel />
        <BoneProperties />
      </Suspense>
    );
  }

  // animate mode
  return (
    <Suspense fallback={<Placeholder name="Loading..." />}>
      <BoneTreePanel />
      <BoneProperties />
    </Suspense>
  );
}

/* ------------------------------------------------------------------ */
/*  Main layout                                                       */
/* ------------------------------------------------------------------ */

const layoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: 'var(--toolbar-height) 1fr var(--statusbar-height)',
  gridTemplateColumns: '1fr',
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const middleRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'var(--sidebar-width) 1fr var(--panel-width)',
  gridTemplateRows: '1fr',
  overflow: 'hidden',
  minHeight: 0,
};

const toolPanelSlotStyle: React.CSSProperties = {
  background: 'var(--bg-panel)',
  borderRight: '1px solid var(--border-color)',
  overflow: 'hidden',
};

const centerColumnStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateRows: '1fr',
  overflow: 'hidden',
  minHeight: 0,
  minWidth: 0,
};

const centerColumnWithTimelineStyle: React.CSSProperties = {
  ...centerColumnStyle,
  gridTemplateRows: '1fr var(--timeline-height)',
};

const canvasSlotStyle: React.CSSProperties = {
  overflow: 'hidden',
  minHeight: 0,
  minWidth: 0,
  position: 'relative',
};

const timelineSlotStyle: React.CSSProperties = {
  background: 'var(--bg-panel)',
  borderTop: '1px solid var(--border-color)',
  overflow: 'hidden',
};

const rightPanelSlotStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-panel)',
  borderLeft: '1px solid var(--border-color)',
  overflow: 'hidden',
  overflowY: 'auto',
};

function AppLayout() {
  const showTimeline = useUIStore((s) => s.showTimeline);

  return (
    <div style={layoutStyle}>
      {/* Row 1: Toolbar */}
      <Toolbar />

      {/* Row 2: Tool panel | Canvas (+Timeline) | Right panel */}
      <div style={middleRowStyle}>
        {/* Left sidebar: tool icons */}
        <div style={toolPanelSlotStyle}>
          <Suspense fallback={<Placeholder />}>
            <ToolPanel />
          </Suspense>
        </div>

        {/* Center: canvas + optional timeline */}
        <div
          style={
            showTimeline ? centerColumnWithTimelineStyle : centerColumnStyle
          }
        >
          <div style={canvasSlotStyle}>
            <Suspense fallback={<Placeholder name="Canvas" />}>
              <CanvasViewport />
            </Suspense>
          </div>

          {showTimeline && (
            <div style={timelineSlotStyle}>
              <Suspense fallback={<Placeholder name="Timeline" />}>
                <Timeline />
              </Suspense>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={rightPanelSlotStyle}>
          <RightPanel />
        </div>
      </div>

      {/* Row 3: Status bar */}
      <StatusBar />
    </div>
  );
}

export default AppLayout;
