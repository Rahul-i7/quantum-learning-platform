'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Dice5, Info, Loader2 } from 'lucide-react';
import { COLORS, panelStyle, primaryButtonStyle, textareaStyle, presetButtonStyle } from './theme';

// ---------------------------------------------------------------------------
// This component expects measurement results in the shape the Simulation
// Service (Section 3/4 of the design doc) is expected to return:
//   { counts: { "00": 512, "11": 488 }, shots: 1000 }
// i.e. bitstrings mapped to how many times they were observed. Until Role 3
// finalizes the exact field names, use `parseCountsInput` below as the
// integration point — swap its body once the real schema is agreed.
// ---------------------------------------------------------------------------

const PRESETS = [
  { label: 'Bell state (2q)', ideal: { '00': 0.5, '11': 0.5 } },
  { label: 'GHZ state (3q)', ideal: { '000': 0.5, '111': 0.5 } },
  { label: 'Uniform superposition (2q)', ideal: { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 } },
  { label: 'Biased single qubit', ideal: { '0': 0.75, '1': 0.25 } },
];

// Simulated latency for the "loading" state — stands in for the real network
// round-trip to the Simulation Service once it exists.
const SIMULATED_DELAY_MS = 400;

// Simulate shot noise: draw `shots` samples from the ideal probability
// distribution so the bars look like a real measurement run rather than an
// exact theoretical split.
function sampleCounts(ideal, shots) {
  const keys = Object.keys(ideal);
  const counts = Object.fromEntries(keys.map((k) => [k, 0]));
  for (let i = 0; i < shots; i++) {
    const r = Math.random();
    let cumulative = 0;
    for (const k of keys) {
      cumulative += ideal[k];
      if (r <= cumulative) {
        counts[k] += 1;
        break;
      }
    }
  }
  return counts;
}

function parseCountsInput(text) {
  const data = JSON.parse(text);
  if (!data.counts || typeof data.counts !== 'object') {
    throw new Error('missing "counts" object');
  }
  return data.counts;
}

export default function MeasurementHistogram() {
  const [shots, setShots] = useState(1000);
  const [activePreset, setActivePreset] = useState('');
  const [counts, setCounts] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  // 'empty'   -> no circuit has been run yet
  // 'loading' -> simulating the round-trip to the (future) Simulation Service
  // 'ready'   -> results are loaded and the chart reflects them
  const [status, setStatus] = useState('empty');
  const delayRef = useRef(null);

  useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  const totalShots = useMemo(
    () => (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0),
    [counts]
  );

  const chartData = useMemo(() => {
    if (!counts) return [];
    return Object.entries(counts)
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([bitstring, count]) => ({
        bitstring,
        count,
        probability: totalShots ? count / totalShots : 0,
      }));
  }, [counts, totalShots]);

  const runWithDelay = (fn) => {
    setStatus('loading');
    if (delayRef.current) clearTimeout(delayRef.current);
    delayRef.current = setTimeout(() => {
      fn();
      setStatus('ready');
    }, SIMULATED_DELAY_MS);
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    setPasteError('');
    runWithDelay(() => setCounts(sampleCounts(preset.ideal, shots)));
  };

  const reroll = () => {
    const preset = PRESETS.find((p) => p.label === activePreset);
    if (preset) runWithDelay(() => setCounts(sampleCounts(preset.ideal, shots)));
  };

  const handleShotsChange = (v) => {
    const n = Math.max(1, Math.min(20000, Math.round(v)));
    setShots(n);
    const preset = PRESETS.find((p) => p.label === activePreset);
    if (preset) setCounts(sampleCounts(preset.ideal, n));
  };

  const handleParse = useCallback(() => {
    try {
      const parsed = parseCountsInput(pasteText);
      setPasteError('');
      setActivePreset('');
      runWithDelay(() => setCounts(parsed));
    } catch (err) {
      setPasteError('Could not parse — expected {"counts": {"00": 512, "11": 488}}');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteText]);

  const isEmpty = status === 'empty';
  const isLoading = status === 'loading';

  return (
    <div
      className="w-full h-full min-h-screen flex flex-col md:flex-row"
      style={{ background: COLORS.bg, fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Chart */}
      <div className="relative flex-1 p-4 sm:p-6 flex flex-col" style={{ minHeight: 420 }}>
        <div className="mb-4">
          <h2 style={{ color: COLORS.textBright, fontSize: '1.05rem', fontWeight: 600 }}>
            Measurement outcomes
          </h2>
          <p style={{ color: COLORS.textDim, fontSize: '0.8rem', marginTop: 4 }}>
            {isEmpty
              ? 'No results yet'
              : `${totalShots.toLocaleString()} shots across ${chartData.length} observed states`}
          </p>
        </div>

        <div style={{ width: '100%', height: '360px', position: 'relative' }}>
          {isEmpty && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div
                className="text-center px-5 py-4"
                style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, maxWidth: 340 }}
              >
                <p style={{ color: COLORS.textBright, fontSize: '0.9rem', marginBottom: 4 }}>
                  Run a circuit to see results
                </p>
                <p style={{ color: COLORS.textDim, fontSize: '0.78rem' }}>
                  Choose an example circuit or paste a Simulation Service response
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
                <Loader2 size={15} className="animate-spin" style={{ color: COLORS.accent }} />
                <span style={{ color: COLORS.textBright, fontSize: '0.8rem' }}>Running shots…</span>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                <XAxis
                  dataKey="bitstring"
                  tick={{ fill: COLORS.textDim, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: COLORS.textDim, fontSize: 12 }}
                  axisLine={{ stroke: COLORS.border }}
                  tickLine={false}
                  domain={[0, 1]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(94, 234, 212, 0.06)' }}
                  contentStyle={{
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 0,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: COLORS.textBright }}
                  itemStyle={{ color: COLORS.textBright }}
                  formatter={(value, name, props) => {
                    if (name === 'probability') {
                      return [`${(value * 100).toFixed(1)}% (${props.payload.count} shots)`, 'probability'];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="probability" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={entry.bitstring} fill={i % 2 === 0 ? COLORS.accent : COLORS.accent2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {!isEmpty && (
          <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: COLORS.textDim }}>
            <Info size={13} />
            Bars simulate real shot noise — rerun to see the distribution shift
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full md:w-96 flex flex-col gap-6 p-4 sm:p-6 overflow-y-auto" style={panelStyle}>
        <div>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
            Example circuits
          </div>
          <div className="flex flex-col gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="py-2 px-3 text-sm text-left"
                style={presetButtonStyle(activePreset === p.label)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between" style={{ fontSize: '0.8rem' }}>
            <span style={{ color: COLORS.textDim }}>Shots</span>
            <span style={{ color: COLORS.textBright, fontFamily: 'ui-monospace, monospace' }}>
              {shots.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={shots}
            onChange={(e) => handleShotsChange(parseInt(e.target.value, 10))}
            className="w-full mt-1"
            style={{ accentColor: COLORS.accent }}
          />
          <button
            onClick={reroll}
            disabled={isEmpty}
            className="mt-3 w-full py-2 text-sm flex items-center justify-center gap-2"
            style={{
              background: 'transparent',
              color: isEmpty ? COLORS.textDim : COLORS.textBright,
              border: `1px solid ${COLORS.border}`,
              opacity: isEmpty ? 0.5 : 1,
              cursor: isEmpty ? 'not-allowed' : 'pointer',
            }}
          >
            <Dice5 size={14} />
            Re-run shots
          </button>
        </div>

        <div>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
            Preview a Simulation Service response
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder='{"counts": {"00": 512, "11": 488}}'
            rows={3}
            className="w-full p-2 text-xs"
            style={textareaStyle}
          />
          <button onClick={handleParse} className="mt-2 w-full py-2 text-sm" style={primaryButtonStyle}>
            Load results
          </button>
          {pasteError && (
            <div style={{ color: COLORS.danger, fontSize: '0.7rem', marginTop: 6 }}>{pasteError}</div>
          )}
        </div>
      </div>
    </div>
  );
}
