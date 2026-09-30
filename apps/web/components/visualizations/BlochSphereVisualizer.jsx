'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { RotateCcw, Loader2, Orbit } from 'lucide-react'

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

function computeBlochVector(data, qubitIndex) {
  if (!data) {
    return {
      x: 0,
      y: 0,
      z: 1,
      mag: 1,
      prob0: 1,
      prob1: 0,
      isDefault: true,
    }
  }

  const numQubits = data.num_qubits || 1

  if (
    data.statevector &&
    Array.isArray(data.statevector) &&
    data.statevector.length > 0
  ) {
    const dim = data.statevector.length
    const bitPos = qubitIndex

    let rho00 = 0
    let rho11 = 0
    let rho01re = 0
    let rho01im = 0

    for (let i = 0; i < dim; i++) {
      const bit = (i >> bitPos) & 1
      const amp = data.statevector[i]

      const re = Array.isArray(amp) ? amp[0] : (amp?.re ?? 0)
      const im = Array.isArray(amp) ? amp[1] : (amp?.im ?? 0)

      const p = re * re + im * im

      if (bit === 0) {
        rho00 += p

        const j = i | (1 << bitPos)

        if (j < dim) {
          const ampJ = data.statevector[j]

          const jRe = Array.isArray(ampJ)
            ? ampJ[0]
            : (ampJ?.re ?? 0)

          const jIm = Array.isArray(ampJ)
            ? ampJ[1]
            : (ampJ?.im ?? 0)

          rho01re += re * jRe + im * jIm
          rho01im += im * jRe - re * jIm
        }
      } else {
        rho11 += p
      }
    }

    const x = 2 * rho01re
    const y = -2 * rho01im
    const z = rho00 - rho11
    const mag = Math.sqrt(x * x + y * y + z * z)

    return {
      x,
      y,
      z,
      mag,
      prob0: rho00,
      prob1: rho11,
      isDefault: false,
    }
  }

  if (data.probabilities) {
    let p0 = 0
    let p1 = 0

    Object.entries(data.probabilities).forEach(([bitstring, prob]) => {
      const charIndex = bitstring.length - 1 - qubitIndex

      if (
        charIndex >= 0 &&
        charIndex < bitstring.length
        ) {
          if (bitstring[charIndex] === '0') {
            p0 += prob
          } else if (bitstring[charIndex] === '1') {
            p1 += prob
          }
        }
      }
    )

    const z = p0 - p1

    return {
      x: 0,
      y: 0,
      z,
      mag: Math.abs(z),
      prob0: p0,
      prob1: p1,
      isDefault: false,
    }
  }

  return {
    x: 0,
    y: 0,
    z: 1,
    mag: 1,
    prob0: 1,
    prob1: 0,
    isDefault: true,
  }
}

export default function BlochSphereVisualizer({
  data,
  qubitIndex = 0,
  numQubits = 3,
  loading = false,
  variant = 'default',
  showreset = false,
  animated = false,
}) {
  const mountRef = useRef(null)
  const threeRef = useRef({})
  const dragRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
  })

  const isHero = variant === 'hero'

  const [selectedQubit, setSelectedQubit] =
    useState(qubitIndex)

  const effectiveNumQubits =
    data?.num_qubits || numQubits || 3

  const qubitsList = Array.from(
    { length: effectiveNumQubits },
    (_, i) => i
  )

  const targetBlochState = useMemo(() => {
    return computeBlochVector(data, selectedQubit)
  }, [data, selectedQubit])

  const [displayedBlochState, setDisplayedBlochState] =
    useState(targetBlochState)

  useEffect(() => {
    if (!animated) {
      const frame = requestAnimationFrame(() => {
        setDisplayedBlochState(targetBlochState)
      })

      return () => cancelAnimationFrame(frame)
    }

    const start = displayedBlochState
    const end = targetBlochState

    let frame

    const startTime = performance.now()
    const duration = 550

    const easeInOut = (t) => {
      return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    const animate = (now) => {
      const progress = Math.min(1, (now - startTime) / duration)

      const t = easeInOut(progress)

      setDisplayedBlochState({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
        mag: start.mag + (end.mag - start.mag) * t,
        prob0:
          start.prob0 +
          (end.prob0 - start.prob0) * t,
        prob1:
          start.prob1 +
          (end.prob1 - start.prob1) * t,
        isDefault:
          progress < 1
            ? start.isDefault
            : end.isDefault,
      })

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [targetBlochState, animated])

  useEffect(() => {
    const mount = mountRef.current

    if (!mount) return

    const width = mount.clientWidth || 320
    const height = mount.clientHeight || 260

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      40,
      width / height,
      0.1,
      100
    )

    camera.position.set(2.4, 1.8, 2.6)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })

    renderer.setSize(width, height)
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    )

    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const sphereGeo = new THREE.SphereGeometry(
      1,
      32,
      24
    )

    const solidMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.1,
    })

    group.add(
      new THREE.Mesh(sphereGeo, solidMat)
    )

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xcbd5e1,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    })

    group.add(
      new THREE.Mesh(sphereGeo, wireMat)
    )

    const equatorPts = []

    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2

      equatorPts.push(
        new THREE.Vector3(
          Math.cos(a),
          0,
          Math.sin(a)
        )
      )
    }

    const equatorGeo =
      new THREE.BufferGeometry().setFromPoints(
        equatorPts
      )

    const equatorMat =
      new THREE.LineBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.7,
      })

    group.add(
      new THREE.LineLoop(
        equatorGeo,
        equatorMat
      )
    )

    const axisMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.5,
    })

    ;[
      [
        new THREE.Vector3(-1.3, 0, 0),
        new THREE.Vector3(1.3, 0, 0),
      ],
      [
        new THREE.Vector3(0, -1.3, 0),
        new THREE.Vector3(0, 1.3, 0),
      ],
      [
        new THREE.Vector3(0, 0, -1.3),
        new THREE.Vector3(0, 0, 1.3),
      ],
    ].forEach(([a, b]) => {
      const geo =
        new THREE.BufferGeometry().setFromPoints([
          a,
          b,
        ])

      group.add(
        new THREE.Line(geo, axisMat)
      )
    })

    const labelDefs = [
      ['|0⟩', 0, 1.5, 0],
      ['|1⟩', 0, -1.5, 0],
      ['|+⟩', 1.5, 0, 0],
      ['|−⟩', -1.5, 0, 0],
      ['|+i⟩', 0, 0, 1.5],
      ['|−i⟩', 0, 0, -1.5],
    ]

    labelDefs.forEach(([text, x, y, z]) => {
      const sprite = makeTextSprite(
        text,
        '#334155'
      )

      sprite.position.set(x, y, z)

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
      new THREE.SphereGeometry(
        0.08,
        16,
        16
      ),
      new THREE.MeshBasicMaterial({
        color: 0x059669,
      })
    )

    dot.visible = false

    group.add(dot)

    threeRef.current = {
      scene,
      camera,
      renderer,
      group,
      arrow,
      dot,
      mount,
    }

    let raf
    const animate = () => {
      raf = requestAnimationFrame(animate)

      if (!dragRef.current.dragging) {
        group.rotation.y += 0.0015
      }

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!mount) return

      const w = mount.clientWidth
      const h = mount.clientHeight

      camera.aspect = w / h
      camera.updateProjectionMatrix()

      renderer.setSize(w, h)
    }

    window.addEventListener(
      'resize',
      handleResize
    )

    return () => {
      cancelAnimationFrame(raf)

      window.removeEventListener(
        'resize',
        handleResize
      )

      if (
        mount &&
        renderer.domElement
      ) {
        mount.removeChild(
          renderer.domElement
        )
      }

      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    const { arrow, dot } = threeRef.current

    if (!arrow || !dot) return

    const { x, y, z, mag } = displayedBlochState

    if (mag < 0.08) {
      arrow.visible = false
      dot.visible = true
    } else {
      dot.visible = false
      arrow.visible = true

      const dir = new THREE.Vector3(
        x,
        z,
        y
      ).normalize()

      arrow.setDirection(dir)

      arrow.setLength(
        Math.max(0.2, mag),
        0.16 * mag + 0.04,
        0.08 * mag + 0.02
      )
    }
  }, [displayedBlochState])

  const onPointerDown = (e) => {
    dragRef.current = {
      dragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
    }
  }

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return

    const { group } = threeRef.current

    if (!group) return

    const dx =
      e.clientX - dragRef.current.lastX

    const dy =
      e.clientY - dragRef.current.lastY

    group.rotation.y += dx * 0.008

    group.rotation.x = Math.max(
      -1.2,
      Math.min(
        1.2,
        group.rotation.x + dy * 0.008
      )
    )

    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
  }

  const endDrag = () => {
    dragRef.current.dragging = false
  }

  const resetView = () => {
    const { group } = threeRef.current

    if (group) {
      group.rotation.set(0, 0, 0)
    }
  }

  return (
    <div
      className={
        isHero
          ? 'relative flex h-full min-h-0 w-full min-w-0 flex-col'
          : 'flex h-full min-h-0 w-full min-w-0 flex-col bg-white'
      }
    >
      {/* Header */}
      {!isHero && (
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-blue-600" />

              <h3 className="text-sm font-semibold text-zinc-950">
                Bloch Sphere
              </h3>
            </div>

            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">
              {displayedBlochState.isDefault
                ? 'Ground state · |0⟩'
                : `State representation · Q[${selectedQubit}]`}
            </p>
          </div>

          {qubitsList.length > 1 && (
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">
                Qubit
              </span>

              <div className="flex border border-zinc-200">
                {qubitsList.map((q) => (
                  <button
                    key={q}
                    onClick={() =>
                      setSelectedQubit(q)
                    }
                    className={`border-r border-zinc-200 px-2.5 py-1.5 font-mono text-[10px] transition-colors last:border-r-0 ${
                      selectedQubit === q
                        ? 'bg-zinc-950 text-white'
                        : 'bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
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
            : 'relative min-h-[280px] flex-1 overflow-hidden border border-zinc-200 bg-[#fafafa]'
        }
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-blue-600" />

            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Simulating state
            </span>
          </div>
        )}

        <div
          ref={mountRef}
          className="h-full min-h-0 w-full min-w-0 cursor-grab active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        />

        {showreset && (
          <button
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
              ? 'absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-zinc-700'
              : 'pointer-events-none absolute bottom-2 left-3 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-zinc-400'
          }
        >
          <Orbit size={11} />
          <span>Drag to rotate</span>
        </div>
      </div>

      {/* State readout */}
      {!isHero && (
        <div className="mt-4 border-t border-zinc-200 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Bloch vector
            </span>

            <span className="font-mono text-[11px] font-semibold text-zinc-900">
              (
              {displayedBlochState.x.toFixed(2)}
              {', '}
              {displayedBlochState.y.toFixed(2)}
              {', '}
              {displayedBlochState.z.toFixed(2)}
              )
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500">
                  P(|0⟩)
                </span>

                <span className="font-mono text-[10px] font-semibold text-zinc-900">
                  {(
                    displayedBlochState.prob0 * 100
                  ).toFixed(1)}
                  %
                </span>
              </div>

              <div className="h-px w-full bg-zinc-200">
                <div
                  className="h-px bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        displayedBlochState.prob0 *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500">
                  P(|1⟩)
                </span>

                <span className="font-mono text-[10px] font-semibold text-zinc-900">
                  {(
                    displayedBlochState.prob1 * 100
                  ).toFixed(1)}
                  %
                </span>
              </div>

              <div className="h-px w-full bg-zinc-200">
                <div
                  className="h-px bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        displayedBlochState.prob1 *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {displayedBlochState.mag < 0.85 &&
            !displayedBlochState.isDefault && (
              <div className="mt-4 border-l-2 border-amber-400 bg-amber-50 px-3 py-2">
                <p className="font-mono text-[9px] leading-4 text-amber-700">
                  Vector magnitude:{' '}
                  {displayedBlochState.mag.toFixed(2)}
                  {' < 1 · '}
                  entangled / mixed with other qubits
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  )
}