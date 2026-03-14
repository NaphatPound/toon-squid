import type { BlendMode } from '../../types/drawing';

interface BlendModeSelectProps {
  value: BlendMode;
  onChange: (mode: BlendMode) => void;
}

const BLEND_GROUPS: { label: string; modes: { value: BlendMode; label: string }[] }[] = [
  {
    label: 'Normal',
    modes: [{ value: 'normal', label: 'Normal' }],
  },
  {
    label: 'Darken',
    modes: [
      { value: 'darken', label: 'Darken' },
      { value: 'multiply', label: 'Multiply' },
      { value: 'color-burn', label: 'Color Burn' },
    ],
  },
  {
    label: 'Lighten',
    modes: [
      { value: 'lighten', label: 'Lighten' },
      { value: 'screen', label: 'Screen' },
      { value: 'color-dodge', label: 'Color Dodge' },
    ],
  },
  {
    label: 'Contrast',
    modes: [
      { value: 'overlay', label: 'Overlay' },
      { value: 'hard-light', label: 'Hard Light' },
      { value: 'soft-light', label: 'Soft Light' },
    ],
  },
  {
    label: 'Other',
    modes: [
      { value: 'difference', label: 'Difference' },
      { value: 'exclusion', label: 'Exclusion' },
    ],
  },
];

const styles = {
  select: {
    background: 'var(--bg-tertiary, #161b22)',
    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
    borderRadius: 4,
    color: 'var(--text-primary, #e6edf3)',
    fontSize: 'var(--font-size-sm, 11px)',
    padding: '3px 6px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 8 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%238b949e' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 6px center',
    paddingRight: 20,
  },
  optgroup: {
    background: 'var(--bg-tertiary, #161b22)',
    color: 'var(--text-secondary, #8b949e)',
    fontSize: 'var(--font-size-sm, 11px)',
  },
  option: {
    background: 'var(--bg-tertiary, #161b22)',
    color: 'var(--text-primary, #e6edf3)',
    fontSize: 'var(--font-size-sm, 11px)',
  },
};

export default function BlendModeSelect({ value, onChange }: BlendModeSelectProps) {
  return (
    <select
      style={styles.select}
      value={value}
      onChange={(e) => onChange(e.target.value as BlendMode)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-blue, #58a6ff)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color, rgba(255, 255, 255, 0.08))';
      }}
    >
      {BLEND_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label} style={styles.optgroup}>
          {group.modes.map((mode) => (
            <option key={mode.value} value={mode.value} style={styles.option}>
              {mode.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
