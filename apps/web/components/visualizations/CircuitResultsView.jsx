'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
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
import { Loader2, Dice5, Info } from 'lucide-react';
import { COLORS, panelStyle, primaryButtonStyle, textareaStyle, presetButtonStyle } from './theme';

const SQRT1_2 = 1 / Math.sqrt(2);

const PRESETS = [
  {
    label: 'Bell state (2q)',
    numQubits: 2,
    statevector: [{ re: SQRT1_2, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: SQRT1_2, im: 0 }],
    idealCounts: { '00': 0.5, '11': 0.5 },
  },
  {
    label: 'GHZ state (3q)',
    numQubits: 3,
    statevector: [
      { re: SQRT1_2, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 },
      { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: SQRT1_2, im: 0 },
    ],
    idealCounts: { '000': 0.5, '111': 0.5 },
  },
  {
    label: 'Product state |+⟩|0⟩ (2q)',
    numQubits: 2,
    statevector: [{ re: SQRT1_2, im: 0 }, { re: 0, im: 0 }, { re: SQRT1_2, im: 0 }, { re: 0, im: 0 }],
    idealCounts: { '00': 0.5, '10': 0.5 },
  },
];

const SIMULATED_DELAY_MS = 400;


function reducedBlochVector(statevector, numQubits, qubitIndex) {
  const dim = 1 << numQubits;
  const bitPos = numQubits - 1 - qubitIndex;
  let rho00 = 0, rho11 = 0, rho01re = 0, rho01im = 0;
  for (let i = 0; i < dim; i++) {
    const bit = (i >> bitPos) & 1;
    const amp = statevector[i] || { re: 0, im: 0 };
    const p = amp.re * amp.re + amp.im * amp.im;
    if (bit === 0) {
      rho00 += p;
      const j = i | (1 << bitPos);
      const ampJ = statevector[j] || { re: 0, im: 0 };
      rho01re += amp.re * ampJ.re + amp.im * ampJ.im;
      rho01im += amp.im * ampJ.re - amp.re * ampJ.im;
    } else {
      rho11 += p;
    }
  }
  return { x: 2 * rho01re, y: -2 * rho01im, z: rho00 - rho11 };
}

function normalizeStatevector(amps) {
  const norm = Math.sqrt(amps.reduce((s, a) => s + a.re * a.re + a.im * a.im, 0)) || 1;
  return amps.map((a) => ({ re: a.re / norm, im: a.im / norm }));
}

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

// --- Per-qubit mini Bloch sphere ---------------------------------------------

function MiniBlochSphere({ x, y, z, label, status }) {
  const mountRef = useRef(null);
  const threeRef = useRef({});
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.2, 1.6, 2.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const sphereGeo = new THREE.SphereGeometry(1, 24, 18);
    group.add(new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: COLORS.axis, transparent: true, opacity: 0.05 })));
    group.add(new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: COLORS.axis, wireframe: true, transparent: true, opacity: 0.3 })));

    const axisMat = new THREE.LineBasicMaterial({ color: COLORS.axis, transparent: true, opacity: 0.4 });
    [
      [new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(1.2, 0, 0)],
      [new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, 1.2, 0)],
      [new THREE.Vector3(0, 0, -1.2), new THREE.Vector3(0, 0, 1.2)],
    ].forEach(([a, b]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
      group.add(new THREE.Line(geo, axisMat));
    });

    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      new THREE.Color(COLORS.accent).getHex(),
      0.14,
      0.08
    );
    arrow.visible = false;
    group.add(arrow);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshBasicMaterial({ color: COLORS.accent2 })
    );
    dot.visible = false;
    group.add(dot);

    threeRef.current = { scene, camera, renderer, group, arrow, dot, mount };

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!dragRef.current.dragging) group.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const { arrow, dot } = threeRef.current;
    if (!arrow || !dot) return;
    if (status !== 'ready') {
      arrow.visible = false;
      dot.visible = false;
      return;
    }
    const mag = Math.sqrt(x * x + y * y + z * z);
    if (mag < 0.05) {
      arrow.visible = false;
      dot.visible = true;
    } else {
      dot.visible = false;
      arrow.visible = true;
      const dir = new THREE.Vector3(x, z, y).normalize();
      arrow.setDirection(dir);
      arrow.setLength(mag, 0.1 * mag + 0.06, 0.06 * mag + 0.03);
    }
  }, [x, y, z, status]);

  const onPointerDown = (e) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const { group } = threeRef.current;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    group.rotation.y += dx * 0.008;
    group.rotation.x = Math.max(-1.2, Math.min(1.2, group.rotation.x + dy * 0.008));
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };
  const endDrag = () => {
    dragRef.current.dragging = false;
  };

  const mag = Math.sqrt(x * x + y * y + z * z);
  const isMixed = status === 'ready' && mag < 0.9;

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, background: 'rgba(15,26,46,0.4)' }}>
      <div
        ref={mountRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        style={{ width: '100%', height: 180, touchAction: 'none', cursor: 'grab' }}
      />
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ color: COLORS.textBright, fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
          {label}
        </div>
        {isMixed && (
          <div style={{ color: COLORS.textDim, fontSize: '0.7rem', marginTop: 2 }}>
            {mag < 0.05 ? 'Maximally mixed — entangled' : 'Partially mixed — entangled'}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Histogram panel ---------------------------------------------------------

function ResultsHistogram({ status, counts }) {
  const totalShots = useMemo(
    () => (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0),
    [counts]
  );
  const chartData = useMemo(() => {
    if (!counts) return [];
    return Object.entries(counts)
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([bitstring, count]) => ({ bitstring, count, probability: totalShots ? count / totalShots : 0 }));
  }, [counts, totalShots]);

  const isEmpty = status === 'empty';
  const isLoading = status === 'loading';

  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        background: 'rgba(15,26,46,0.4)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div style={{ color: COLORS.textBright, fontSize: '0.95rem', fontWeight: 600 }}>Measurement outcomes</div>
        <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginTop: 2 }}>
          {isEmpty ? 'No results yet' : `${totalShots.toLocaleString()} shots · ${chartData.length} states`}
        </div>
      </div>
      <div style={{ width: '100%', height: 280, position: 'relative' }}>
        {isEmpty && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <p style={{ color: COLORS.textDim, fontSize: '0.8rem', textAlign: 'center' }}>
              Run a circuit to see results
            </p>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
              <Loader2 size={14} className="animate-spin" style={{ color: COLORS.accent }} />
              <span style={{ color: COLORS.textBright, fontSize: '0.78rem' }}>Running shots…</span>
            </div>
          </div>
        )}
        {status === 'ready' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
              <XAxis
                dataKey="bitstring"
                tick={{ fill: COLORS.textDim, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                axisLine={{ stroke: COLORS.border }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                tick={{ fill: COLORS.textDim, fontSize: 11 }}
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
    </div>
  );
}

// --- Main combined view -------------------------------------------------------

export default function CircuitResultsView() {
  const [activePreset, setActivePreset] = useState('');
  const [shots, setShots] = useState(1000);
  const [status, setStatus] = useState('empty');
  const [numQubits, setNumQubits] = useState(2);
  const [statevector, setStatevector] = useState(null);
  const [counts, setCounts] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const delayRef = useRef(null);

  useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  const blochVectors = useMemo(() => {
    if (!statevector) return [];
    return Array.from({ length: numQubits }, (_, q) => reducedBlochVector(statevector, numQubits, q));
  }, [statevector, numQubits]);

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
    runWithDelay(() => {
      setNumQubits(preset.numQubits);
      setStatevector(preset.statevector);
      setCounts(sampleCounts(preset.idealCounts, shots));
    });
  };

  const reroll = () => {
    const preset = PRESETS.find((p) => p.label === activePreset);
    if (preset) runWithDelay(() => setCounts(sampleCounts(preset.idealCounts, shots)));
  };

  const handleShotsChange = (v) => {
    const n = Math.max(1, Math.min(20000, Math.round(v)));
    setShots(n);
    const preset = PRESETS.find((p) => p.label === activePreset);
    if (preset) setCounts(sampleCounts(preset.idealCounts, n));
  };

  const handleParse = useCallback(() => {
    try {
      const data = JSON.parse(pasteText);
      if (!data.statevector || !data.counts || !data.num_qubits) {
        throw new Error('missing fields');
      }
      const sv = normalizeStatevector(
        data.statevector.map((a) => ({ re: Number(a.re) || 0, im: Number(a.im) || 0 }))
      );
      setPasteError('');
      setActivePreset('');
      runWithDelay(() => {
        setNumQubits(data.num_qubits);
        setStatevector(sv);
        setCounts(data.counts);
      });
    } catch (err) {
      setPasteError('Could not parse — expected {"num_qubits":2,"statevector":[...],"counts":{...}}');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteText]);

  const isEmpty = status === 'empty';

  return (
    <div
      className="w-full h-full min-h-screen flex flex-col md:flex-row"
      style={{ background: COLORS.bg, fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Results area: spheres + histogram side by side */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4">
        <div>
          <h2 style={{ color: COLORS.textBright, fontSize: '1.05rem', fontWeight: 600 }}>Circuit results</h2>
          <p style={{ color: COLORS.textDim, fontSize: '0.8rem', marginTop: 4 }}>
            {isEmpty ? 'No circuit run yet' : `${numQubits}-qubit state`}
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          {isEmpty ? (
            <div
              style={{
                border: `1px solid ${COLORS.border}`,
                background: 'rgba(15,26,46,0.4)',
                padding: '32px 20px',
                flex: '1 1 100%',
                textAlign: 'center',
              }}
            >
              <p style={{ color: COLORS.textDim, fontSize: '0.85rem' }}>
                Choose an example circuit to see per-qubit states and measurement results
              </p>
            </div>
          ) : (
            blochVectors.map((v, i) => (
              <div key={i} style={{ flex: '1 1 220px', maxWidth: 260 }}>
                <MiniBlochSphere x={v.x} y={v.y} z={v.z} label={`Qubit ${i}`} status={status} />
              </div>
            ))
          )}
        </div>

        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <ResultsHistogram status={status} counts={counts} />
        </div>
      </div>

      {/* Shared controls */}
      <div className="w-full md:w-96 flex flex-col gap-6 p-4 sm:p-6 md:overflow-y-auto" style={panelStyle}>
        <div>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
            Example circuits
          </div>
          <div className="flex flex-col gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="py-3 sm:py-2 px-3 text-sm text-left"
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
            className="mt-3 w-full py-3 sm:py-2 text-sm flex items-center justify-center gap-2"
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
            placeholder='{"num_qubits":2,"statevector":[{"re":0.707,"im":0},{"re":0,"im":0},{"re":0,"im":0},{"re":0.707,"im":0}],"counts":{"00":512,"11":488}}'
            rows={5}
            className="w-full p-2 text-base sm:text-xs"
            style={textareaStyle}
          />
          <button onClick={handleParse} className="mt-2 w-full py-3 sm:py-2 text-sm" style={primaryButtonStyle}>
            Load results
          </button>
          {pasteError && (
            <div style={{ color: COLORS.danger, fontSize: '0.7rem', marginTop: 6 }}>{pasteError}</div>
          )}
        </div>

        <div className="text-xs flex items-start gap-1.5" style={{ color: COLORS.textDim }}>
          <Info size={13} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>
            Per-qubit spheres are computed via partial trace from the full statevector — entangled qubits
            (like the Bell/GHZ examples) show shortened or zero-length arrows, since no single qubit has a
            pure state of its own.
          </span>
        </div>
      </div>
    </div>
  );
}
