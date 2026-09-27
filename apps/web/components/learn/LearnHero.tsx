'use client'

import { motion } from 'motion/react'
import { ArrowDown, Atom } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.215, 0.61, 0.355, 1] as const,
    },
  },
}

export default function LearnHero() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-200">
      {/* Technical grid */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e4e4e7 1px, transparent 1px),
              linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_320px]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                Learn / Quantum Computing
              </span>

              <span className="h-px w-12 bg-zinc-300" />
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-6xl lg:text-7xl">
              Understand
              <br />
              <span className="text-zinc-400">the quantum world.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-zinc-500">
              Build your understanding from the ground up — from qubits and
              measurement to gates, circuits, and quantum algorithms.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeInUp}
            className="relative"
          >
            <div className="aspect-square border border-zinc-200 bg-white p-6">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    Learning system
                  </span>

                  <Atom className="h-4 w-4 text-blue-600" />
                </div>

                <div className="relative flex flex-1 items-center justify-center">
                  <div className="absolute h-40 w-40 rounded-full border border-zinc-200" />
                  <div className="absolute h-28 w-28 rounded-full border border-zinc-200" />
                  <div className="absolute h-16 w-16 rounded-full border border-blue-200" />

                  <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.45)]" />
                </div>

                <div className="flex items-end justify-between border-t border-zinc-100 pt-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                      Progress
                    </div>
                    <div className="mt-1 text-sm font-semibold text-zinc-900">
                      Begin at the foundation
                    </div>
                  </div>

                  <ArrowDown className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}