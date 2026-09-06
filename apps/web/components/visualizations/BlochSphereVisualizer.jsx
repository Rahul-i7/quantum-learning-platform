'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { RotateCcw, Loader2, Orbit } from 'lucide-react';

function makeTextSprite(text, color = '#334155') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 44px ui-monospace, monospace';
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

function computeBlochVector(data, qubitIndex) {
  if (!data) {
    return { x: 0, y: 0, z: 1, mag: 1, prob0: 1, prob1: 0, isDefault: true };
  }

  const numQubits = data.num_qubits || 1;

  if (data.statevector && Array.isArray(data.statevector) && data.statevector.length > 0) {
    const dim = data.statevector.length;
    const bitPos = qubitIndex;
    let rho00 = 0, rho11 = 0, rho01re = 0, rho01im = 0;

    for (let i = 0; i < dim; i++) {
      const bit = (i >> bitPos) & 1;
      const amp = data.statevector[i];
      const re = Array.isArray(amp) ? amp[0] : (amp?.re ?? 0);
      const im = Array.isArray(amp) ? amp[1] : (amp?.im ?? 0);
      const p = re * re + im * im;

      if (bit === 0) {
        rho00 += p;
        const j = i | (1 << bitPos);
        if (j < dim) {
          const ampJ = data.statevector[j];
          const jRe = Array.isArray(ampJ) ? ampJ[0] : (ampJ?.re ?? 0);
          const jIm = Array.isArray(ampJ) ? ampJ[1] : (ampJ?.im ?? 0);
          rho01re += re * jRe + im * jIm;
          rho01im += im * jRe - re * jIm;
        }
      } else {
        rho11 += p;
      }
    }

    const x = 2 * rho01re;
    const y = -2 * rho01im;
    const z = rho00 - rho11;
    const mag = Math.sqrt(x * x + y * y + z * z);
    return { x, y, z, mag, prob0: rho00, prob1: rho11, isDefault: false };
  }

  if (data.probabilities) {
    let p0 = 0, p1 = 0;
    Object.entries(data.probabilities).forEach(([bitstring, prob]) => {
      const charIndex = bitstring.length - 1 - qubitIndex;
      if (charIndex >= 0 && charIndex < bitstring.length) {
        if (bitstring[charIndex] === '0') p0 += prob;
        else if (bitstring[charIndex] === '1') p1 += prob;
      }
    });
    const z = p0 - p1;
    return { x: 0, y: 0, z, mag: Math.abs(z), prob0: p0, prob1: p1, isDefault: false };
  }

  return { x: 0, y: 0, z: 1, mag: 1, prob0: 1, prob1: 0, isDefault: true };
}

export default function BlochSphereVisualizer({ data, qubitIndex = 0, numQubits = 3, loading = false }) {
  const mountRef = useRef(null);
  const threeRef = useRef({});
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });

  const [selectedQubit, setSelectedQubit] = useState(qubitIndex);

  useEffect(() => {
    setSelectedQubit(qubitIndex);
  }, [qubitIndex]);

  const effectiveNumQubits = data?.num_qubits || numQubits || 3;
  const qubitsList = Array.from({ length: effectiveNumQubits }, (_, i) => i);

  const blochState = useMemo(() => {
    return computeBlochVector(data, selectedQubit);
  }, [data, selectedQubit]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(2.4, 1.8, 2.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const solidMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.1,
    });
    group.add(new THREE.Mesh(sphereGeo, solidMat));

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xcbd5e1,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    group.add(new THREE.Mesh(sphereGeo, wireMat));

    const equatorPts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      equatorPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    const equatorGeo = new THREE.BufferGeometry().setFromPoints(equatorPts);
    const equatorMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 });
    group.add(new THREE.LineLoop(equatorGeo, equatorMat));

    const axisMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
    [
      [new THREE.Vector3(-1.3, 0, 0), new THREE.Vector3(1.3, 0, 0)],
      [new THREE.Vector3(0, -1.3, 0), new THREE.Vector3(0, 1.3, 0)],
      [new THREE.Vector3(0, 0, -1.3), new THREE.Vector3(0, 0, 1.3)],
    ].forEach(([a, b]) => {
      const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
      group.add(new THREE.Line(geo, axisMat));
    });

    const labelDefs = [
      ['|0⟩', 0, 1.5, 0],
      ['|1⟩', 0, -1.5, 0],
      ['|+⟩', 1.5, 0, 0],
      ['|−⟩', -1.5, 0, 0],
      ['|+i⟩', 0, 0, 1.5],
      ['|−i⟩', 0, 0, -1.5],
    ];
    labelDefs.forEach(([text, x, y, z]) => {
      const sprite = makeTextSprite(text, '#334155');
      sprite.position.set(x, y, z);
      group.add(sprite);
    });

    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1,
      0x2563eb,
      0.18,
      0.1
    );
    group.add(arrow);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x059669 })
    );
    dot.visible = false;
    group.add(dot);

    threeRef.current = { scene, camera, renderer, group, arrow, dot, mount };

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
      if (!mount) return;
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
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const { arrow, dot } = threeRef.current;
    if (!arrow || !dot) return;

    const { x, y, z, mag } = blochState;

    if (mag < 0.08) {
      arrow.visible = false;
      dot.visible = true;
    } else {
      dot.visible = false;
      arrow.visible = true;
      const dir = new THREE.Vector3(x, z, y).normalize();
      arrow.setDirection(dir);
      arrow.setLength(Math.max(0.2, mag), 0.16 * mag + 0.04, 0.08 * mag + 0.02);
    }
  }, [blochState]);

  const onPointerDown = (e) => {
    dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const { group } = threeRef.current;
    if (!group) return;
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

  const resetView = () => {
    const { group } = threeRef.current;
    if (group) group.rotation.set(0, 0, 0);
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            Bloch Sphere Visualizer
          </h3>
          <p className="text-xs text-gray-500">
            {blochState.isDefault
              ? 'Showing ground state |0⟩'
              : `State representation for Qubit ${selectedQubit}`}
          </p>
        </div>

        {qubitsList.length > 1 && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
            {qubitsList.map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQubit(q)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                  selectedQubit === q
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                q[{q}]
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-[260px] rounded-lg border border-gray-100 bg-slate-50/50 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium text-gray-600">Simulating state...</span>
          </div>
        )}

        <div
          ref={mountRef}
          className="w-full h-full min-h-[260px] cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={resetView}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-white/90 hover:bg-white border border-gray-200 rounded-md shadow-xs transition-colors"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>

        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[11px] text-gray-400 pointer-events-none">
          <Orbit size={12} />
          <span>Click & drag to rotate</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-gray-500">Bloch vector (x, y, z):</span>
          <span className="font-mono font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
            ({blochState.x.toFixed(2)}, {blochState.y.toFixed(2)}, {blochState.z.toFixed(2)})
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-gray-600">P(|0⟩)</span>
              <span className="font-mono font-medium text-gray-800">
                {(blochState.prob0 * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, blochState.prob0 * 100))}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-gray-600">P(|1⟩)</span>
              <span className="font-mono font-medium text-gray-800">
                {(blochState.prob1 * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, blochState.prob1 * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {blochState.mag < 0.85 && !blochState.isDefault && (
          <p className="text-[11px] text-amber-600 mt-0.5">
            Qubit vector length is {blochState.mag.toFixed(2)} &lt; 1 (entangled / mixed with other qubits).
          </p>
        )}
      </div>
    </div>
  );
}
