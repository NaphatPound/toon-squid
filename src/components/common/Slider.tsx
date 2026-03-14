import React, { useCallback, useId, useMemo } from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
}) => {
  const id = useId();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const displayValue = useMemo(
    () => (formatValue ? formatValue(value) : String(value)),
    [formatValue, value]
  );

  const percent = ((value - min) / (max - min)) * 100;

  const styles = useMemo(
    () => ({
      container: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        minHeight: "28px",
      } as React.CSSProperties,
      label: {
        fontSize: "11px",
        color: "#8b949e",
        whiteSpace: "nowrap",
        userSelect: "none",
        minWidth: "50px",
        flexShrink: 0,
      } as React.CSSProperties,
      inputWrapper: {
        flex: 1,
        position: "relative",
        display: "flex",
        alignItems: "center",
      } as React.CSSProperties,
      input: {
        width: "100%",
        height: "4px",
        appearance: "none",
        WebkitAppearance: "none",
        background: `linear-gradient(to right, #58a6ff ${percent}%, rgba(255,255,255,0.08) ${percent}%)`,
        borderRadius: "2px",
        outline: "none",
        cursor: "pointer",
        margin: 0,
      } as React.CSSProperties,
      value: {
        fontSize: "11px",
        color: "#e6edf3",
        minWidth: "32px",
        textAlign: "right",
        fontFamily: "monospace",
        userSelect: "none",
        flexShrink: 0,
      } as React.CSSProperties,
    }),
    [percent]
  );

  // Inject thumb styles via a <style> tag scoped to this instance
  const thumbCss = `
    #${CSS.escape(id)}::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #58a6ff;
      border: 2px solid #0d1117;
      cursor: pointer;
      box-shadow: 0 0 4px rgba(88,166,255,0.4);
      transition: box-shadow 0.15s ease, transform 0.15s ease;
    }
    #${CSS.escape(id)}::-webkit-slider-thumb:hover {
      box-shadow: 0 0 8px rgba(88,166,255,0.6);
      transform: scale(1.15);
    }
    #${CSS.escape(id)}::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #58a6ff;
      border: 2px solid #0d1117;
      cursor: pointer;
      box-shadow: 0 0 4px rgba(88,166,255,0.4);
    }
    #${CSS.escape(id)}::-moz-range-track {
      height: 4px;
      background: transparent;
      border: none;
    }
  `;

  return (
    <div style={styles.container}>
      <style>{thumbCss}</style>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrapper}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          style={styles.input}
        />
      </div>
      <span style={styles.value}>{displayValue}</span>
    </div>
  );
};

export default Slider;
