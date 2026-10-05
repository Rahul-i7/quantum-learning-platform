'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { RotateCcw, Loader2, Orbit } from 'lucide-react'
import { useCircuitStore } from '@/lib/store/circuit-store'
import { useIsDark } from './useChartColors'
/* ---------- PURE MATH START (no three.js / React in here; unit-tested separately) ---------- */

const GROUND_STATE = {
    x: 0,
    y: 0,
    z: 1,
    mag: 1,
    prob0: 1,
    prob1: 0,
    isDefault: true,
    approximate: false,
}

function readAmp(amp) {
    if (Array.isArray(amp)) return [amp[0] ?? 0, amp[1] ?? 0]
    return [amp?.re ?? amp?.real ?? 0, amp?.im ?? amp?.imag ?? 0]
}

// Bloch vector of ONE qubit, from the full statevector (exact) or, failing that,
// from measurement probabilities (Z-axis only, flagged `approximate`).
// Qiskit is little-endian: qubit k is bit k of the statevector index.
function computeBlochVector(data, qubitIndex) {
    if (!data) return GROUND_STATE

    const sv = data.statevector
    const dim = Array.isArray(sv) ? sv.length : 0
    const isPow2 = dim > 1 && (dim & (dim - 1)) === 0

    if (isPow2 && qubitIndex < Math.log2(dim)) {
        const mask = 1 << qubitIndex
        let rho00 = 0
        let rho11 = 0
        let rho01re = 0
        let rho01im = 0

        for (let i = 0; i < dim; i++) {
            if (i & mask) continue // visit each (bit=0, bit=1) pair once
            const [re0, im0] = readAmp(sv[i])
            const [re1, im1] = readAmp(sv[i | mask])

            rho00 += re0 * re0 + im0 * im0
            rho11 += re1 * re1 + im1 * im1
            // rho01 = a0 * conj(a1)
            rho01re += re0 * re1 + im0 * im1
            rho01im += im0 * re1 - re0 * im1
        }

        const x = 2 * rho01re
        const y = -2 * rho01im
        const z = rho00 - rho11
        return {
            x,
            y,
            z,
            mag: Math.sqrt(x * x + y * y + z * z),
            prob0: rho00,
            prob1: rho11,
            isDefault: false,
            approximate: false,
        }
    }

    if (data.probabilities) {
        let p0 = 0
        let p1 = 0
        Object.entries(data.probabilities).forEach(([bitstring, prob]) => {
            const bits = bitstring.replace(/\s/g, '')
            const ch = bits[bits.length - 1 - qubitIndex]
            if (ch === '0') p0 += prob
            else if (ch === '1') p1 += prob
        })
        const z = p0 - p1
        // x and y are unknown here, so this is NOT a real Bloch vector.
        return {
            x: 0,
            y: 0,
            z,
            mag: Math.abs(z),
            prob0: p0,
            prob1: p1,
            isDefault: false,
            approximate: true,
        }
    }

    return GROUND_STATE
}

const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ]
}
const norm3 = (v) => Math.hypot(v[0], v[1], v[2])
const unit3 = (v) => {
    const n = norm3(v) || 1
    return [v[0] / n, v[1] / n, v[2] / n]
}

// Moves the vector along the sphere surface (slerp) instead of cutting through its interior.
function interpolateBloch(a, b, t) {
    if (a.approximate || b.approximate) return b

    const prob0 = lerp(a.prob0, b.prob0, t)
    const prob1 = lerp(a.prob1, b.prob1, t)
    const isDefault = t < 1 ? a.isDefault : b.isDefault
    const base = { prob0, prob1, isDefault, approximate: false }
    const mag = lerp(a.mag, b.mag, t)

    const linear = () => ({
        ...base,
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        z: lerp(a.z, b.z, t),
        mag,
    })

    if (a.mag < 0.05 || b.mag < 0.05) return linear()

    const ua = unit3([a.x, a.y, a.z])
    const ub = unit3([b.x, b.y, b.z])
    const dot = Math.max(-1, Math.min(1, ua[0] * ub[0] + ua[1] * ub[1] + ua[2] * ub[2]))
    const omega = Math.acos(dot)

    let dir
    if (omega < 1e-3) {
        return linear()
    } else if (Math.PI - omega < 1e-3) {
        // Exactly opposite (e.g. |0> -> |1>): any great circle works; pick a perpendicular.
        let p = cross(ua, [0, 1, 0])
        if (norm3(p) < 1e-3) p = cross(ua, [1, 0, 0])
        p = unit3(p)
        const c = Math.cos(Math.PI * t)
        const s = Math.sin(Math.PI * t)
        dir = [ua[0] * c + p[0] * s, ua[1] * c + p[1] * s, ua[2] * c + p[2] * s]
    } else {
        const sa = Math.sin((1 - t) * omega) / Math.sin(omega)
        const sb = Math.sin(t * omega) / Math.sin(omega)
        dir = [
            ua[0] * sa + ub[0] * sb,
            ua[1] * sa + ub[1] * sb,
            ua[2] * sa + ub[2] * sb,
        ]
    }

    return { ...base, x: dir[0] * mag, y: dir[1] * mag, z: dir[2] * mag, mag }
}

// -0.00 looks like a bug on screen.
const fmt = (v) => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2)

/* ---------- PURE MATH END ---------- */

function makeTextSprite(text, color = '#334155') {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 128

    const ctx = canvas.getContext('2d')
    if (!ctx) return new THREE.Sprite()

    ctx.font = 'bold 44px ui-monospace, monospace'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
    })

    const sprite = new THREE.Sprite(material)
    sprite.scale.set(0.55, 0.275, 1)
    return sprite
}

// Bloch (X, Y, Z) -> three.js (x, y, z).
// Z is "up" (three's +y). Y must map to three's -z, otherwise the picture is a mirror image
// (left-handed): X x Y has to equal Z.
function toScene(x, y, z) {
    return new THREE.Vector3(x, z, -y)
}

function applyState(arrow, dot, state) {
    if (!arrow || !dot) return
    const { x, y, z, mag, approximate } = state

    if (approximate) {
        // Only Z-axis information is known: don't draw a vector that would be wrong.
        arrow.visible = false
        dot.visible = false
        return
    }
    if (mag < 0.08) {
        arrow.visible = false
        dot.visible = true // maximally mixed: sits at the centre
        return
    }

    dot.visible = false
    arrow.visible = true
    const len = Math.min(1, mag)
    arrow.setDirection(toScene(x, y, z).normalize())
    arrow.setLength(len, 0.16 * len + 0.04, 0.08 * len + 0.02)
}

export default function BlochSphereVisualizer({
    data,
    qubitIndex = 0,
    numQubits = 3,
    gates = [],
    loading = false,
    variant = 'default',
    showReset = false,
    showreset = false, // legacy lowercase prop name, still accepted
    animated = false,
}) {
    const mountRef = useRef(null)
    const threeRef = useRef({})
    const displayedRef = useRef(null)
    const animRef = useRef(null)
    const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 })

    const store = useCircuitStore()

    const isHero = variant === 'hero'
    const canReset = showReset || showreset

    const [selectedQubit, setSelectedQubit] = useState(qubitIndex)
    const [prevQubitIndex, setPrevQubitIndex] = useState(qubitIndex)
    const [glError, setGlError] = useState(false)

    // Follow the prop if the parent changes it.
    if (qubitIndex !== prevQubitIndex) {
        setPrevQubitIndex(qubitIndex)
        setSelectedQubit(qubitIndex)
    }

    // Trust the statevector length first, then num_qubits, then the prop.
    const svLen = Array.isArray(data?.statevector) ? data.statevector.length : 0
    const fromStatevector = svLen > 1 ? Math.round(Math.log2(svLen)) : 0
    const effectiveNumQubits = Math.max(1, fromStatevector || data?.num_qubits || numQubits || 1)

    // If the circuit shrank, never point at a qubit that no longer exists.
    const activeQubit = Math.min(selectedQubit, effectiveNumQubits - 1)
    const qubitsList = Array.from({ length: effectiveNumQubits }, (_, i) => i)

    const hasMeasurementGate = store.gates.some(
        (gate) =>
            gate.type === 'measure' &&
            gate.qubits.includes(activeQubit)
    )

    const targetBlochState = useMemo(
        () => computeBlochVector(data, activeQubit),
        [data, activeQubit]
    )

    // Animated mode keeps its own interpolated state; otherwise show the target directly.
    const [animState, setAnimState] = useState(targetBlochState)

    useEffect(() => {
        if (!animated) return

        const start = animRef.current ?? targetBlochState
        const end = targetBlochState
        const startTime = performance.now()
        const duration = 550
        let frame

        const step = (now) => {
            const p = Math.min(1, (now - startTime) / duration)
            const next = interpolateBloch(start, end, easeInOut(p))
            animRef.current = next
            setAnimState(next)
            if (p < 1) frame = requestAnimationFrame(step)
        }

        frame = requestAnimationFrame(step)
        return () => cancelAnimationFrame(frame)
    }, [targetBlochState, animated])

    const displayedBlochState = animated ? animState : targetBlochState

    // Scene setup (runs once per variant; rebuilt when the theme flips so the 3D labels stay readable)
    const isDarkTheme = useIsDark()
    useEffect(() => {
        const mount = mountRef.current
        if (!mount) return

        const labelColor = isHero || isDarkTheme ? '#94a3b8' : '#334155'

        let renderer
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        } catch {
            // WebGL disabled/unsupported (some VMs, locked-down browsers): show a message, don't crash.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setGlError(true)
            return
        }

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
        camera.position.set(2.4, 1.8, 2.6)
        camera.lookAt(0, 0, 0)

        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        const canvas = renderer.domElement
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
        mount.appendChild(canvas)

        const resize = () => {
            const w = mount.clientWidth
            const h = mount.clientHeight
            if (!w || !h) return // hidden / collapsed: keep the last good size
            renderer.setSize(w, h, false)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
        }
        resize()
        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(mount)

        const group = new THREE.Group()
        scene.add(group)

        const sphereGeo = new THREE.SphereGeometry(1, 32, 24)

        group.add(
            new THREE.Mesh(
                sphereGeo,
                new THREE.MeshBasicMaterial({ color: 0xf1f5f9, transparent: true, opacity: 0.1 })
            )
        )
        group.add(
            new THREE.Mesh(
                sphereGeo,
                new THREE.MeshBasicMaterial({
                    color: 0xcbd5e1,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.45,
                })
            )
        )

        const equatorPts = []
        for (let i = 0; i <= 64; i++) {
            const a = (i / 64) * Math.PI * 2
            equatorPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)))
        }
        group.add(
            new THREE.LineLoop(
                new THREE.BufferGeometry().setFromPoints(equatorPts),
                new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.7 })
            )
        )

        const axisMat = new THREE.LineBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.5,
        })
            ;[
                [new THREE.Vector3(-1.3, 0, 0), new THREE.Vector3(1.3, 0, 0)],
                [new THREE.Vector3(0, -1.3, 0), new THREE.Vector3(0, 1.3, 0)],
                [new THREE.Vector3(0, 0, -1.3), new THREE.Vector3(0, 0, 1.3)],
            ].forEach(([a, b]) => {
                group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), axisMat))
            })

        // Labels use the same Bloch -> scene mapping as the arrow, so they can't drift apart.
        const labelDefs = [
            ['|0⟩', 0, 0, 1.5],
            ['|1⟩', 0, 0, -1.5],
            ['|+⟩', 1.5, 0, 0],
            ['|−⟩', -1.5, 0, 0],
            ['|+i⟩', 0, 1.5, 0],
            ['|−i⟩', 0, -1.5, 0],
        ]
        labelDefs.forEach(([text, bx, by, bz]) => {
            const sprite = makeTextSprite(text, labelColor)
            sprite.position.copy(toScene(bx, by, bz))
            group.add(sprite)
        })

        const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            1,
            0x2563eb,
            0.18,
            0.1
        )
        group.add(arrow)

        const dot = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x059669 })
        )
        dot.visible = false
        group.add(dot)

        threeRef.current = { scene, camera, renderer, group, arrow, dot }

        // The scene may be (re)built after the state already changed.
        if (displayedRef.current) applyState(arrow, dot, displayedRef.current)

        // Pause rendering while off-screen; respect reduced-motion for the idle spin.
        let visible = true
        const intersectionObserver =
            typeof IntersectionObserver !== 'undefined'
                ? new IntersectionObserver(([entry]) => {
                    visible = entry.isIntersecting
                })
                : null
        intersectionObserver?.observe(mount)

        const reduceMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches

        let raf
        let last = performance.now()
        const loop = (now) => {
            raf = requestAnimationFrame(loop)
            const dt = Math.min(0.1, (now - last) / 1000)
            last = now
            if (!visible) return
            if (!dragRef.current.dragging && !reduceMotion) {
                group.rotation.y += 0.09 * dt // frame-rate independent (was 0.0015 per frame)
            }
            renderer.render(scene, camera)
        }
        raf = requestAnimationFrame(loop)

        return () => {
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            intersectionObserver?.disconnect()

            // Free GPU memory: renderer.dispose() alone does not release geometries/textures,
            // and browsers cap the number of live WebGL contexts.
            scene.traverse((obj) => {
                obj.geometry?.dispose()
                const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
                mats.forEach((m) => {
                    m.map?.dispose()
                    m.dispose()
                })
            })
            renderer.dispose()
            renderer.forceContextLoss()
            if (canvas.parentNode === mount) mount.removeChild(canvas)
            threeRef.current = {}
        }
    }, [isHero, isDarkTheme])

    // Push the current state into the scene.
    useEffect(() => {
        displayedRef.current = displayedBlochState
        const { arrow, dot } = threeRef.current
        applyState(arrow, dot, displayedBlochState)
    }, [displayedBlochState])

    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId)
        dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }
    }

    const onPointerMove = (e) => {
        if (!dragRef.current.dragging) return
        const { group } = threeRef.current
        if (!group) return

        const dx = e.clientX - dragRef.current.lastX
        const dy = e.clientY - dragRef.current.lastY

        group.rotation.y += dx * 0.008
        group.rotation.x = Math.max(-1.2, Math.min(1.2, group.rotation.x + dy * 0.008))

        dragRef.current.lastX = e.clientX
        dragRef.current.lastY = e.clientY
    }

    const endDrag = (e) => {
        dragRef.current.dragging = false
        try {
            e?.currentTarget?.releasePointerCapture?.(e.pointerId)
        } catch {
            /* pointer already released */
        }
    }

    const resetView = () => {
        const { group } = threeRef.current
        if (group) group.rotation.set(0, 0, 0)
    }

    const { approximate, isDefault } = displayedBlochState
    const ariaLabel = isDefault
        ? `Bloch sphere, qubit ${activeQubit}, ground state |0⟩`
        : approximate
            ? `Bloch sphere, qubit ${activeQubit}: measurement probabilities only`
            : `Bloch sphere, qubit ${activeQubit}, vector (${fmt(displayedBlochState.x)}, ${fmt(
                displayedBlochState.y
            )}, ${fmt(displayedBlochState.z)})`

    return (
        <div
            className={
                isHero
                    ? 'relative flex h-full min-h-0 w-full min-w-0 flex-col'
                    : 'flex h-full min-h-0 w-full min-w-0 flex-col bg-white dark:bg-[#111111]'
            }
        >
            {/* Header */}
            {!isHero && (
                <div className="mb-4 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-blue-600" />
                            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">Bloch Sphere</h3>
                        </div>

                        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">
                            {isDefault
                                ? 'Ground state · |0⟩'
                                : approximate
                                    ? `Z-basis only · q[${activeQubit}]`
                                    : hasMeasurementGate
                                        ? `State before measurement · q[${activeQubit}]`
                                        : `State Representation · q[${activeQubit}]`}
                        </p>
                    </div>

                    {qubitsList.length > 1 && (
                        <div className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">
                                Qubit
                            </span>

                            <div className="flex border border-zinc-200 dark:border-zinc-800">
                                {qubitsList.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        aria-pressed={activeQubit === q}
                                        onClick={() => setSelectedQubit(q)}
                                        className={`border-r border-zinc-200 px-2.5 py-1.5 font-mono text-[10px] transition-colors last:border-r-0 dark:border-zinc-800 ${activeQubit === q
                                            ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                                            : 'bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                            }`}
                                    >
                                        q[{q}]
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Viewport */}
            <div
                className={
                    isHero
                        ? 'relative min-h-0 flex-1 overflow-hidden'
                        : 'relative min-h-[280px] flex-1 overflow-hidden border border-zinc-200 bg-[#fafafa] dark:border-zinc-800 dark:bg-[#0a0a0a]'
                }
            >
                {loading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80">
                        <Loader2 className="mb-3 h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                            Simulating state
                        </span>
                    </div>
                )}

                {glError && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                        3D view unavailable: WebGL is disabled or unsupported in this browser.
                    </div>
                )}

                <div
                    ref={mountRef}
                    role="img"
                    aria-label={ariaLabel}
                    className="h-full min-h-0 w-full min-w-0 cursor-grab touch-none active:cursor-grabbing"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                />

                {canReset && (
                    <button
                        type="button"
                        onClick={resetView}
                        className={
                            isHero
                                ? 'absolute right-2 top-2 z-10 flex items-center gap-1 border border-zinc-800 bg-[#0b0d10]/80 px-2.5 py-1.5 text-xs text-zinc-500 backdrop-blur-sm transition hover:border-zinc-600 hover:text-white'
                                : 'absolute right-3 top-3 z-10 flex items-center gap-1 border border-zinc-200 bg-white/90 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 backdrop-blur-sm transition hover:border-zinc-300 hover:text-zinc-900'
                        }
                    >
                        <RotateCcw size={12} />
                        Reset
                    </button>
                )}

                <div
                    className={
                        isHero
                            ? 'absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300'
                            : 'pointer-events-none absolute bottom-2 left-3 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-zinc-400'
                    }
                >
                    <Orbit size={11} />
                    <span>Drag to rotate</span>
                </div>
            </div>

            {/* State readout */}
            {!isHero && (
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <div className="flex items-center justify-between gap-4">
                        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                            Bloch vector
                        </span>

                        <span className="font-mono text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                            {approximate
                                ? 'n/a'
                                : `(${fmt(displayedBlochState.x)}, ${fmt(displayedBlochState.y)}, ${fmt(
                                    displayedBlochState.z
                                )})`}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-6">
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">P(|0⟩)</span>
                                <span className="font-mono text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">
                                    {(displayedBlochState.prob0 * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-px w-full bg-zinc-200 dark:bg-zinc-700">
                                <div
                                    className="h-px bg-blue-600 transition-all duration-300"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, displayedBlochState.prob0 * 100))}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">P(|1⟩)</span>
                                <span className="font-mono text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">
                                    {(displayedBlochState.prob1 * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-px w-full bg-zinc-200 dark:bg-zinc-700">
                                <div
                                    className="h-px bg-emerald-600 transition-all duration-300"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, displayedBlochState.prob1 * 100))}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {approximate && (
                        <div className="mt-4 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
                            <p className="font-mono text-[12px] leading-4 text-amber-700 dark:text-amber-400">
                                Measured circuit: the full quantum state is not available, so only Z-basis
                                probabilities are shown. Remove the measurement to see the Bloch vector.
                            </p>
                        </div>
                    )}

                    {!approximate && !isDefault && displayedBlochState.mag < 0.98 && (
                        <div className="mt-4 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
                            <p className="font-mono text-[9px] leading-4 text-amber-700 dark:text-amber-400">
                                Mixed or reduced state · vector magnitude:{' '}
                                {displayedBlochState.mag.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}