import React, { useCallback, useRef, useState, useEffect } from "react";

interface NumberInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  min = -Infinity,
  max = Infinity,
  step = 1,
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(String(value));
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef({ startX: 0, startValue: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = useCallback(
    (v: number) => {
      const clamped = Math.min(max, Math.max(min, v));
      // Round to step precision to avoid floating point drift
      const precision = String(step).includes(".")
        ? String(step).split(".")[1].length
        : 0;
      return parseFloat(clamped.toFixed(precision));
    },
    [min, max, step]
  );

  // Drag-to-adjust on label
  const handleLabelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragRef.current = { startX: e.clientX, startValue: value };
    },
    [value]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragRef.current.startX;
      const sensitivity = e.shiftKey ? 0.1 : 1;
      const newValue = dragRef.current.startValue + Math.round(delta / 2) * step * sensitivity;
      onChange(clamp(newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, step, onChange, clamp]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditText(e.target.value);
    },
    []
  );

  const commitEdit = useCallback(() => {
    const parsed = parseFloat(editText);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
    setIsEditing(false);
  }, [editText, onChange, clamp]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commitEdit();
      } else if (e.key === "Escape") {
        setIsEditing(false);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        onChange(clamp(value + step));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onChange(clamp(value - step));
      }
    },
    [commitEdit, onChange, clamp, value, step]
  );

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditText(String(value));
    requestAnimationFrame(() => inputRef.current?.select());
  }, [value]);

  const handleIncrement = useCallback(
    (dir: 1 | -1) => {
      onChange(clamp(value + step * dir));
    },
    [onChange, clamp, value, step]
  );

  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      minHeight: "28px",
    },
    label: {
      fontSize: "11px",
      color: "#8b949e",
      whiteSpace: "nowrap",
      userSelect: "none",
      cursor: isDragging ? "ew-resize" : "ew-resize",
      minWidth: "50px",
      flexShrink: 0,
      transition: "color 0.15s ease",
      ...(isDragging ? { color: "#58a6ff" } : {}),
    },
    inputWrapper: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      width: "64px",
      height: "24px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "4px",
      overflow: "hidden",
      transition: "border-color 0.15s ease",
      ...(isEditing
        ? { borderColor: "#58a6ff", background: "rgba(255,255,255,0.06)" }
        : {}),
    },
    input: {
      width: "100%",
      height: "100%",
      background: "transparent",
      border: "none",
      outline: "none",
      color: "#e6edf3",
      fontSize: "11px",
      fontFamily: "monospace",
      textAlign: "center",
      padding: "0 16px 0 4px",
      appearance: "none",
      MozAppearance: "textfield",
    },
    valueDisplay: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#e6edf3",
      fontSize: "11px",
      fontFamily: "monospace",
      cursor: "text",
      padding: "0 16px 0 4px",
    },
    arrows: {
      position: "absolute",
      right: "1px",
      top: "1px",
      bottom: "1px",
      display: "flex",
      flexDirection: "column",
      width: "14px",
      opacity: isHovered || isEditing ? 1 : 0,
      transition: "opacity 0.15s ease",
    },
    arrowBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      background: "transparent",
      border: "none",
      color: "#8b949e",
      fontSize: "8px",
      cursor: "pointer",
      padding: 0,
      lineHeight: 1,
    },
  };

  return (
    <div style={styles.container}>
      <label style={styles.label} onMouseDown={handleLabelMouseDown}>
        {label}
      </label>
      <div
        style={styles.inputWrapper}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={handleInputChange}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            style={styles.input}
            autoFocus
          />
        ) : (
          <div style={styles.valueDisplay} onDoubleClick={handleDoubleClick}>
            {value}
          </div>
        )}
        <div style={styles.arrows}>
          <button
            style={styles.arrowBtn}
            onMouseDown={(e) => {
              e.preventDefault();
              handleIncrement(1);
            }}
            tabIndex={-1}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#e6edf3")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#8b949e")
            }
          >
            &#9650;
          </button>
          <button
            style={styles.arrowBtn}
            onMouseDown={(e) => {
              e.preventDefault();
              handleIncrement(-1);
            }}
            tabIndex={-1}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#e6edf3")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#8b949e")
            }
          >
            &#9660;
          </button>
        </div>
      </div>
    </div>
  );
};

export default NumberInput;
