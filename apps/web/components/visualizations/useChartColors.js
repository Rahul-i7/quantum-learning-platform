'use client'

import { useTheme } from 'next-themes'

// Recharts / canvas / three.js need real colour values (CSS classes can't reach them),
// so the chart components read their palette from here and re-render on theme change.
const LIGHT = {
  accent: '#2563eb',     // blue-600
  accent2: '#059669',    // emerald-600
  textDim: '#71717a',    // zinc-500
  textMid: '#52525b',    // zinc-600
  textBright: '#18181b', // zinc-900
  border: '#e4e4e7',     // zinc-200
  axis: '#d4d4d8',       // zinc-300
  grid: '#f4f4f5',       // zinc-100
  panel: '#ffffff',
  barTrack: '#f4f4f5',
  selected: '#18181b',
  cursor: 'rgba(37, 99, 235, 0.06)',
  cursorSoft: 'rgba(37, 99, 235, 0.04)',
}

const DARK = {
  accent: '#60a5fa',     // blue-400
  accent2: '#34d399',    // emerald-400
  textDim: '#a1a1aa',    // zinc-400
  textMid: '#d4d4d8',    // zinc-300
  textBright: '#f4f4f5', // zinc-100
  border: '#27272a',     // zinc-800
  axis: '#3f3f46',       // zinc-700
  grid: '#1f1f23',
  panel: '#111111',
  barTrack: '#1c1c1f',
  selected: '#f4f4f5',
  cursor: 'rgba(96, 165, 250, 0.10)',
  cursorSoft: 'rgba(96, 165, 250, 0.08)',
}

export function useIsDark() {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === 'dark'
}

export function useChartColors() {
  return useIsDark() ? DARK : LIGHT
}
