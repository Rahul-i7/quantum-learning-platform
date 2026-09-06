// Shared design tokens for Role 2 (Frontend/Visualization Engineer) components.
// Import this from BlochSphereVisualizer.jsx, MeasurementHistogram.jsx, and any
// future dashboard/visualization components so the palette stays consistent
// without copy-pasting the same object into every file.

export const COLORS = {
  bg: '#0B1220',
  panel: '#0F1A2E',
  border: '#1E2A44',
  textDim: '#7C8AA5',
  textBright: '#E7ECF5',
  accent: '#5EEAD4',
  accent2: '#A78BFA',
  axis: '#3A4A6B',
  grid: '#1E2A44',
  danger: '#F87171',
};

export const panelStyle = {
  background: COLORS.panel,
  borderLeft: `1px solid ${COLORS.border}`,
};

export const primaryButtonStyle = {
  background: COLORS.accent,
  color: '#0B1220',
  fontWeight: 500,
};

export const textareaStyle = {
  fontFamily: 'ui-monospace, monospace',
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textBright,
  resize: 'none',
};

export function presetButtonStyle(active) {
  return {
    background: active ? COLORS.accent2 : 'transparent',
    color: active ? '#0B1220' : COLORS.textBright,
    border: `1px solid ${active ? COLORS.accent2 : COLORS.border}`,
  };
}
