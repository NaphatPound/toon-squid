import React, { useCallback, useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 420,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll on body while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  const styles: Record<string, React.CSSProperties> = {
    backdrop: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      animation: "modalFadeIn 0.2s ease",
    },
    panel: {
      position: "relative",
      width: `${width}px`,
      maxWidth: "calc(100vw - 32px)",
      maxHeight: "calc(100vh - 64px)",
      display: "flex",
      flexDirection: "column",
      background: "rgba(22, 27, 34, 0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      boxShadow:
        "0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
      overflow: "hidden",
      animation: "modalScaleIn 0.2s ease",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px 12px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    },
    title: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#e6edf3",
      margin: 0,
      letterSpacing: "0.01em",
    },
    closeButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "24px",
      height: "24px",
      background: "transparent",
      border: "none",
      borderRadius: "4px",
      color: "#8b949e",
      cursor: "pointer",
      fontSize: "16px",
      padding: 0,
      transition: "all 0.15s ease",
      lineHeight: 1,
    },
    body: {
      padding: "16px 20px 20px",
      overflowY: "auto",
      flex: 1,
      color: "#e6edf3",
      fontSize: "13px",
      lineHeight: "1.5",
    },
  };

  // Inject keyframe animations
  const keyframes = `
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalScaleIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.backdrop} onClick={handleBackdropClick}>
        <div style={styles.panel} ref={panelRef} role="dialog" aria-modal="true">
          <div style={styles.header}>
            <h2 style={styles.title}>{title}</h2>
            <button
              style={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "#e6edf3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#8b949e";
              }}
            >
              &#10005;
            </button>
          </div>
          <div style={styles.body}>{children}</div>
        </div>
      </div>
    </>
  );
};

export default Modal;
