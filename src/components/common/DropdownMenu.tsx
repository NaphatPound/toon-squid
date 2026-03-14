import React, { useCallback, useEffect, useRef, useState } from "react";

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "left" | "right";
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setHoveredIndex(-1);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    // Use setTimeout to avoid catching the trigger click
    const id = setTimeout(() => {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("keydown", handleKeyDown);
    }, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = useCallback(
    (item: DropdownMenuItem) => {
      if (item.disabled) return;
      setIsOpen(false);
      item.onClick();
    },
    []
  );

  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: "relative",
      display: "inline-flex",
    },
    triggerWrap: {
      cursor: "pointer",
      display: "inline-flex",
    },
    menu: {
      position: "absolute",
      top: "calc(100% + 4px)",
      ...(align === "left" ? { left: 0 } : { right: 0 }),
      zIndex: 1000,
      minWidth: "180px",
      background: "rgba(22, 27, 34, 0.95)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
      padding: "4px",
      opacity: isOpen ? 1 : 0,
      transform: isOpen ? "translateY(0)" : "translateY(-4px)",
      transition: "opacity 0.15s ease, transform 0.15s ease",
      pointerEvents: isOpen ? "auto" : "none",
    },
    divider: {
      height: "1px",
      background: "rgba(255,255,255,0.06)",
      margin: "4px 8px",
    },
  };

  const getItemStyle = (index: number, item: DropdownMenuItem): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "6px 10px",
    background:
      hoveredIndex === index && !item.disabled
        ? "rgba(255,255,255,0.06)"
        : "transparent",
    border: "none",
    borderRadius: "4px",
    color: item.disabled ? "#484f58" : "#e6edf3",
    fontSize: "12px",
    cursor: item.disabled ? "default" : "pointer",
    outline: "none",
    textAlign: "left",
    transition: "background 0.1s ease",
    gap: "16px",
  });

  const shortcutStyle: React.CSSProperties = {
    fontSize: "10px",
    color: "#484f58",
    fontFamily: "monospace",
    flexShrink: 0,
  };

  return (
    <div style={styles.container} ref={containerRef}>
      <div style={styles.triggerWrap} onClick={toggle}>
        {trigger}
      </div>
      <div style={styles.menu} ref={menuRef} role="menu">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {item.divider && i > 0 && <div style={styles.divider} />}
            <button
              style={getItemStyle(i, item)}
              role="menuitem"
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(-1)}
              disabled={item.disabled}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <span style={shortcutStyle}>{item.shortcut}</span>
              )}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default DropdownMenu;
