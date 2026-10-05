'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowDown, Atom } from 'lucide-react'
import AnimatedQuantumGrid from '../ui/AnimatedQuantumGrid'

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

    const ref = useRef<HTMLElement>(null)
    const [height, setHeight] = useState(600)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const { scrollY } = useScroll()
    const opacity = useTransform(scrollY, [0, height], [1, 0])

    return (
        <motion.section
            ref={ref}
            style={{ opacity }}
            className="lg:sticky top-16 z-0 overflow-hidden border-b border-zinc-200 dark:border-zinc-800"
        >
            {/* Technical grid */}
            <AnimatedQuantumGrid />

            <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
                <div className="grid items-end gap-12 lg:grid-cols-[1fr_320px]">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={fadeInUp}
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                                Learn / Quantum Computing
                            </span>

                            <span className="h-px w-12 bg-zinc-300 dark:bg-zinc-700" />
                        </div>

                        <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-zinc-100 sm:text-6xl lg:text-7xl">
                            Understand
                            <br />
                            <span className="text-zinc-400 dark:text-zinc-500">the quantum world.</span>
                        </h1>

                        <p className="mt-7 max-w-xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
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
                        <div className="aspect-square border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] p-6">
                            <div className="flex h-full flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                                        Learning system
                                    </span>

                                    <Atom className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>

                                <div className="relative flex flex-1 items-center justify-center">
                                    <div className="absolute h-40 w-40 rounded-full border border-zinc-200 dark:border-zinc-800" />
                                    <div className="absolute h-28 w-28 rounded-full border border-zinc-200 dark:border-zinc-800" />
                                    <div className="absolute h-16 w-16 rounded-full border border-blue-200 dark:border-blue-800" />

                                    <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.45)]" />
                                </div>

                                <div className="flex items-end justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                    <div>
                                        <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                                            Progress
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-200">
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
        </motion.section>
    )
}