'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCcw, Info, Loader2 } from 'lucide-react';
import { COLORS, panelStyle, primaryButtonStyle, textareaStyle, presetButtonStyle } from './theme';

// ---------------------------------------------------------------------------
// Bloch sphere math
//
// A single-qubit pure state |psi> = alpha|0> + beta|1> maps to a point on the
// unit sphere via:
//   alpha = cos(theta/2)                     (chosen real & non-negative)
//   beta  = e^(i*phi) * sin(theta/2)
//   x = sin(theta)*cos(phi)   (|+>/|-> axis)
//   y = sin(theta)*sin(phi)   (|+i>/|-i> axis)
//   z = cos(theta)            (|0>/|1> axis)
//
// This is exactly the shape you'll eventually receive from the Simulation
// Service (Section 3/4 of the design doc) as a statevector. Until Role 3
// (Backend Lead) finalizes the exact field names for that response, this
// component accepts a small mock schema — swap `parseStatevectorInput`
// below for the real one once it's agreed.
// ---------------------------------------------------------------------------

const PRESETS = [
  { label: '|0⟩', theta: 0, phi: 0 },
  { label: '|1⟩', theta: Math.PI, phi: 0 },
  { label: '|+⟩', theta: Math.PI / 2, phi: 0 },
  { label: '|−⟩', theta: Math.PI / 2, phi: Math.PI },
  { label: '|+i⟩', theta: Math.PI / 2, phi: Math.PI / 2 },
  { label: '|−i⟩', theta: Math.PI / 2, phi: (3 * Math.PI) / 2 },
];

// Simulated latency for the "loading" state — stands in for the real network
// round-trip to the Simulation Service once it exists.
const SIMULATED_DELAY_MS = 350;

function amplitudesFromAngles(theta, phi) {
  const alpha = Math.cos(theta / 2);
  const beta = {
    re: Math.sin(theta / 2) * Math.cos(phi),
    im: Math.sin(theta / 2) * Math.sin(phi),
  };
  return { alpha: { re: alpha, im: 0 }, beta };
}

function anglesFromAmplitudes(alpha, beta) {
  const alphaMag = Math.hypot(alpha.re, alpha.im);
  const betaMag = Math.hypot(beta.re, beta.im);
  const norm = Math.hypot(alphaMag, betaMag) || 1;
  const theta = 2 * Math.atan2(betaMag / norm, alphaMag / norm);
  let phi = Math.atan2(beta.im, beta.re) - Math.atan2(alpha.im, alpha.re);
  phi = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return { theta, phi };
}

function fmt(n) {
  const v = Math.abs(n) < 1e-4 ? 0 : n;
  return v.toFixed(3);
}

function formatComplex(c) {
  if (Math.abs(c.im) < 1e-4) return fmt(c.re);
  const sign = c.im >= 0 ? '+' : '−';
  return `${fmt(c.re)} ${sign} ${fmt(Math.abs(c.im))}i`;
}

function makeTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '52px system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.55, 0.275, 1);
  return sprite;
}

export default function BlochSphereVisualizer() {
  const mountRef = useRef(null);
  const threeRef = useRef({});
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const delayRef = useRef(null);

  const [theta, setTheta] = useState(0);
  const [phi, setPhi] = useState(0);
  const [activePreset, setActivePreset] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  // 'empty'   -> no circuit/state has been loaded yet
  // 'loading' -> simulating the round-trip to the (future) Simulation Service
  // 'ready'   -> a state is loaded and the sphere/readout reflect it
  const [status, setStatus] = useState('empty');

  // --- Three.js scene setup (once) ---------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(2.4, 1.7, 2.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Sphere: faint solid fill + wireframe
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const solidMat = new THREE.MeshBasicMaterial({
      color: COLORS.axis,
      transparent: true,
      opacity: 0.05,
    });
    group.add(new THREE.Mesh(sphereGeo, solidMat));

    const wireMat = new THREE.MeshBasicMaterial({
      color: COLORS.axis,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    group.add(new THREE.Mesh(sphereGeo, wireMat));

    // Equator ring, highlighted
    const equatorPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      equatorPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    const equatorGeo = new THREE.BufferGeometry().setFromPoints(equatorPts);
    const equatorMat = new THREE.LineBasicMaterial({ color: COLORS.axis, transparent: true, opacity: 0.6 });
    group.add(new THREE.LineLoop(equatorGeo, equatorMat));

    // Axes through the sphere
    const axisMat = new THREE.LineBasicMaterial({ color: COLORS.axis, transparent: true, opacity: 0.5 });
    [
      [new THREE.Vector3(-1.3, 0, 0), new THREE.Vector3(1.3, 0, 0)],
      [new THREE.Vector3(0, -1.3, 0), new THREE.Vector3(0, 1.3, 0)],
      [new THREE.Vector3(0, 0, -1.3), new THREE.Vector3(0, 0, 1.3)],
    ].forEach(([a, b]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
      group.add(new THREE.Line(geo, axisMat));
    });

    // Axis labels
    const labelDefs = [
      ['|0⟩', 0, 1.55, 0],
      ['|1⟩', 0, -1.55, 0],
      ['|+⟩', 1.55, 0, 0],
      ['|−⟩', -1.55, 0, 0],
      ['|+i⟩', 0, 0, 1.55],
      ['|−i⟩', 0, 0, -1.55],
    ];
    labelDefs.forEach(([text, x, y, z]) => {
      const sprite = makeTextSprite(text, COLORS.textBright);
      sprite.position.set(x, y, z);
      group.add(sprite);
    });

    // State vector arrow — starts hidden until a state is actually loaded
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      new THREE.Color(COLORS.accent).getHex(),
      0.16,
      0.09
    );
    arrow.line.material.linewidth = 2;
    arrow.visible = false;
    group.add(arrow);

    threeRef.current = { scene, camera, renderer, group, arrow, mount };

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!dragRef.current.dragging) {
        group.rotation.y += 0.0015;
      }
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

  // --- Update arrow whenever theta/phi/status change ----------------------
  useEffect(() => {
    const { arrow } = threeRef.current;
    if (!arrow) return;
    arrow.visible = status === 'ready';
    const bx = Math.sin(theta) * Math.cos(phi);
    const by = Math.sin(theta) * Math.sin(phi);
    const bz = Math.cos(theta);
    const dir = new THREE.Vector3(bx, bz, by).normalize();
    arrow.setDirection(dir);
  }, [theta, phi, status]);

  // Clear any pending simulated-delay timer on unmount
  useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  }, []);

  // --- Pointer drag to rotate ---------------------------------------------
  const onPointerDown = (e) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const { group } = threeRef.current;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    group.rotation.y += dx * 0.006;
    group.rotation.x = Math.max(-1.2, Math.min(1.2, group.rotation.x + dy * 0.006));
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };
  const endDrag = () => {
    dragRef.current.dragging = false;
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    setPasteError('');
    setStatus('loading');
    if (delayRef.current) clearTimeout(delayRef.current);
    delayRef.current = setTimeout(() => {
      setTheta(preset.theta);
      setPhi(preset.phi);
      setStatus('ready');
    }, SIMULATED_DELAY_MS);
  };

  const handleThetaChange = (v) => {
    setActivePreset('');
    setTheta(v);
    setStatus('ready');
  };
  const handlePhiChange = (v) => {
    setActivePreset('');
    setPhi(v);
    setStatus('ready');
  };

  const handleParse = useCallback(() => {
    try {
      const data = JSON.parse(pasteText);
      if (!data.alpha || !data.beta) throw new Error('missing alpha/beta');
      const a = { re: Number(data.alpha.re) || 0, im: Number(data.alpha.im) || 0 };
      const b = { re: Number(data.beta.re) || 0, im: Number(data.beta.im) || 0 };
      const { theta: t, phi: p } = anglesFromAmplitudes(a, b);
      setPasteError('');
      setActivePreset('');
      setStatus('loading');
      if (delayRef.current) clearTimeout(delayRef.current);
      delayRef.current = setTimeout(() => {
        setTheta(t);
        setPhi(p);
        setStatus('ready');
      }, SIMULATED_DELAY_MS);
    } catch (err) {
      setPasteError('Could not parse — expected {"alpha":{"re":..,"im":..},"beta":{"re":..,"im":..}}');
    }
  }, [pasteText]);

  const resetView = () => {
    const { group } = threeRef.current;
    if (group) {
      group.rotation.set(0, 0, 0);
    }
  };

  const isEmpty = status === 'empty';
  const isLoading = status === 'loading';
  const { alpha, beta } = amplitudesFromAngles(theta, phi);
  const probZero = Math.pow(Math.cos(theta / 2), 2);
  const probOne = 1 - probZero;

  return (
    <div
      className="w-full h-full min-h-screen flex flex-col md:flex-row"
      style={{ background: COLORS.bg, fontFamily: 'system-ui, sans-serif' }}
    >
      {/* 3D viewport */}
      <div className="relative flex-1" style={{ minHeight: 320 }}>
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ minHeight: 320, touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        />

        {isEmpty && (
          <div
            className="absolute inset-0 flex items-center justify-center px-6 pointer-events-none"
          >
            <div
              className="text-center px-5 py-4"
              style={{ background: 'rgba(15,26,46,0.85)', border: `1px solid ${COLORS.border}`, maxWidth: 320 }}
            >
              <p style={{ color: COLORS.textBright, fontSize: '0.9rem', marginBottom: 4 }}>
                No state loaded yet
              </p>
              <p style={{ color: COLORS.textDim, fontSize: '0.78rem' }}>
                Choose a preset or paste a statevector to visualize a qubit
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="flex items-center gap-2 px-4 py-2"
              style={{ background: 'rgba(15,26,46,0.85)', border: `1px solid ${COLORS.border}` }}
            >
              <Loader2 size={15} className="animate-spin" style={{ color: COLORS.accent }} />
              <span style={{ color: COLORS.textBright, fontSize: '0.8rem' }}>Simulating…</span>
            </div>
          </div>
        )}

        <button
          onClick={resetView}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-3 sm:py-2 text-sm"
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.textDim,
          }}
        >
          <RotateCcw size={14} />
          Reset view
        </button>
        <div
          className="absolute bottom-4 left-4 text-xs flex items-center gap-1.5"
          style={{ color: COLORS.textDim }}
        >
          <Info size={13} />
          Drag to orbit — rotates automatically otherwise
        </div>
      </div>

      {/* Control / readout panel */}
      <div
        className="w-full md:w-96 flex flex-col gap-6 p-4 sm:p-6 md:overflow-y-auto"
        style={panelStyle}
      >
        <div>
          <h2 style={{ color: COLORS.textBright, fontSize: '1.05rem', fontWeight: 600 }}>
            Single-qubit state
          </h2>
          <p style={{ color: COLORS.textDim, fontSize: '0.8rem', marginTop: 4 }}>
            Position on the Bloch sphere for α|0⟩ + β|1⟩
          </p>
        </div>

        {/* Presets */}
        <div>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
            Preset states
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="py-3 sm:py-2 text-sm"
                style={{ fontFamily: 'ui-monospace, monospace', ...presetButtonStyle(activePreset === p.label) }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex justify-between" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: COLORS.textDim }}>θ (polar)</span>
              <span style={{ color: COLORS.textBright, fontFamily: 'ui-monospace, monospace' }}>
                {((theta * 180) / Math.PI).toFixed(1)}°
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.PI}
              step={0.01}
              value={theta}
              onChange={(e) => handleThetaChange(parseFloat(e.target.value))}
              className="w-full mt-1"
              style={{ accentColor: COLORS.accent }}
            />
          </div>
          <div>
            <div className="flex justify-between" style={{ fontSize: '0.8rem' }}>
              <span style={{ color: COLORS.textDim }}>φ (azimuth)</span>
              <span style={{ color: COLORS.textBright, fontFamily: 'ui-monospace, monospace' }}>
                {((phi * 180) / Math.PI).toFixed(1)}°
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={2 * Math.PI}
              step={0.01}
              value={phi}
              onChange={(e) => handlePhiChange(parseFloat(e.target.value))}
              className="w-full mt-1"
              style={{ accentColor: COLORS.accent }}
            />
          </div>
        </div>

        {/* Readout */}
        <div style={{ border: `1px solid ${COLORS.border}`, padding: 14 }}>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 10 }}>
            State
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
              color: isEmpty ? COLORS.textDim : COLORS.textBright,
              lineHeight: 1.8,
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <div>α = {isEmpty ? '—' : formatComplex(alpha)}</div>
            <div>β = {isEmpty ? '—' : formatComplex(beta)}</div>
          </div>

          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', margin: '14px 0 8px' }}>
            Measurement probability
          </div>
          <div className="flex flex-col gap-2" style={{ opacity: isLoading ? 0.5 : 1 }}>
            <ProbBar label="|0⟩" value={isEmpty ? 0 : probZero} />
            <ProbBar label="|1⟩" value={isEmpty ? 0 : probOne} />
          </div>
        </div>

        {/* Statevector paste-in, for future integration */}
        <div>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
            Preview a Simulation Service response
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder='{"alpha":{"re":0.707,"im":0},"beta":{"re":0,"im":0.707}}'
            rows={3}
            className="w-full p-2 text-base sm:text-xs"
            style={textareaStyle}
          />
          <button onClick={handleParse} className="mt-2 w-full py-3 sm:py-2 text-sm" style={primaryButtonStyle}>
            Load state
          </button>
          {pasteError && (
            <div style={{ color: COLORS.danger, fontSize: '0.7rem', marginTop: 6 }}>{pasteError}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProbBar({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 32, color: COLORS.textBright, fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
        {label}
      </div>
      <div className="flex-1 h-2" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
        <div
          style={{
            width: `${(value * 100).toFixed(1)}%`,
            height: '100%',
            background: COLORS.accent,
          }}
        />
      </div>
      <div style={{ width: 44, textAlign: 'right', color: COLORS.textDim, fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>
        {(value * 100).toFixed(1)}%
      </div>
    </div>
  );
}
