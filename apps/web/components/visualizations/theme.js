// Shared design tokens for Role 2 (Frontend/Visualization Engineer) components.
// Import this from BlochSphereVisualizer.jsx, MeasurementHistogram.jsx, and any
// future dashboard/visualization components so the palette stays consistent
// without copy-pasting the same object into every file.

export const COLORS = {
  bg: '#f8fafc',
  panel: '#ffffff',
  border: '#e2e8f0',
  borderDark: '#cbd5e1',
  textDim: '#64748b',
  textBright: '#1e293b',
  accent: '#2563eb',
  accent2: '#059669',
  axis: '#94a3b8',
  grid: '#f1f5f9',
  danger: '#ef4444',
};

export const panelStyle = {
  background: COLORS.panel,
  borderLeft: `1px solid ${COLORS.border}`,
};

export const primaryButtonStyle = {
  background: COLORS.accent,
  color: '#ffffff',
  fontWeight: 500,
  borderRadius: '0.375rem',
};

export const textareaStyle = {
  fontFamily: 'ui-monospace, monospace',
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textBright,
  resize: 'none',
  borderRadius: '0.375rem',
};

export function presetButtonStyle(active) {
  return {
    background: active ? COLORS.accent : '#f1f5f9',
    color: active ? '#ffffff' : COLORS.textBright,
    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
    borderRadius: '0.375rem',
  };
}

