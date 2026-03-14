import React, { useCallback, useRef, useState } from "react";

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  active = false,
  onClick,
  size = "md",
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const px = size === "sm" ? 24 : 32;

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    timerRef.current = setTimeout(() => setShowTooltip(true), 500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowTooltip(false);
    clearTimeout(timerRef.current);
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    button: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: `${px}px`,
      height: `${px}px`,
      background: active
        ? "rgba(88,166,255,0.12)"
        : isHovered
          ? "rgba(255,255,255,0.04)"
          : "transparent",
      border: "1px solid",
      borderColor: active
        ? "rgba(88,166,255,0.3)"
        : "transparent",
      borderRadius: "6px",
      color: active ? "#58a6ff" : disabled ? "#484f58" : "#8b949e",
      cursor: disabled ? "not-allowed" : "pointer",
      padding: 0,
      outline: "none",
      transition: "all 0.15s ease",
      fontSize: size === "sm" ? "14px" : "16px",
      opacity: disabled ? 0.5 : 1,
    },
    tooltip: {
      position: "absolute",
      bottom: "calc(100% + 6px)",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1c2128",
      color: "#e6edf3",
      fontSize: "10px",
      padding: "4px 8px",
      borderRadius: "4px",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: 1000,
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      opacity: showTooltip ? 1 : 0,
      transition: "opacity 0.15s ease",
    },
  };

  return (
    <button
      style={styles.button}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title=""
      aria-label={label}
      disabled={disabled}
    >
      {icon}
      {showTooltip && <div style={styles.tooltip}>{label}</div>}
    </button>
  );
};

export default IconButton;
