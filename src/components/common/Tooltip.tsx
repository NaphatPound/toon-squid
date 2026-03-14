import React, { useCallback, useRef, useState } from "react";

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

const positionStyles: Record<string, React.CSSProperties> = {
  top: {
    bottom: "calc(100% + 6px)",
    left: "50%",
    transform: "translateX(-50%)",
  },
  bottom: {
    top: "calc(100% + 6px)",
    left: "50%",
    transform: "translateX(-50%)",
  },
  left: {
    right: "calc(100% + 6px)",
    top: "50%",
    transform: "translateY(-50%)",
  },
  right: {
    left: "calc(100% + 6px)",
    top: "50%",
    transform: "translateY(-50%)",
  },
};

const arrowStyles: Record<string, React.CSSProperties> = {
  top: {
    bottom: "-3px",
    left: "50%",
    transform: "translateX(-50%) rotate(45deg)",
  },
  bottom: {
    top: "-3px",
    left: "50%",
    transform: "translateX(-50%) rotate(45deg)",
  },
  left: {
    right: "-3px",
    top: "50%",
    transform: "translateY(-50%) rotate(45deg)",
  },
  right: {
    left: "-3px",
    top: "50%",
    transform: "translateY(-50%) rotate(45deg)",
  },
};

const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = "top",
  delay = 400,
}) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      position: "relative",
      display: "inline-flex",
    },
    tooltip: {
      position: "absolute",
      zIndex: 1000,
      background: "#1c2128",
      color: "#e6edf3",
      fontSize: "10px",
      lineHeight: "1.4",
      padding: "4px 8px",
      borderRadius: "4px",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.15s ease",
      ...positionStyles[position],
    },
    arrow: {
      position: "absolute",
      width: "6px",
      height: "6px",
      background: "#1c2128",
      borderRight:
        position === "top" || position === "left"
          ? "1px solid rgba(255,255,255,0.08)"
          : "none",
      borderBottom:
        position === "top" || position === "left"
          ? "1px solid rgba(255,255,255,0.08)"
          : "none",
      borderLeft:
        position === "bottom" || position === "right"
          ? "1px solid rgba(255,255,255,0.08)"
          : "none",
      borderTop:
        position === "bottom" || position === "right"
          ? "1px solid rgba(255,255,255,0.08)"
          : "none",
      ...arrowStyles[position],
    },
  };

  return (
    <div
      style={styles.wrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <div style={styles.tooltip} role="tooltip">
        {text}
        <div style={styles.arrow} />
      </div>
    </div>
  );
};

export default Tooltip;
