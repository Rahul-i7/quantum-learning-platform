'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Search,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Cpu,
  Atom,
  HelpCircle,
} from 'lucide-react'
import { TOPICS, CATEGORY_LABELS, type Topic, type TopicBlock } from '@/lib/content/quantum-theory'

function TopicBody({ blocks }: { blocks: TopicBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={i} className="text-[15px] leading-relaxed text-gray-700">
              {block.text}
            </p>
          )
        }
        if (block.type === 'matrix') {
          return (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl bg-slate-900 p-4 shadow-md transition-all hover:shadow-lg"
            >
              <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {block.label}
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                  Matrix Representation
                </span>
              </div>
              <pre className="overflow-x-auto font-mono text-sm leading-6 text-emerald-400">
                {block.rows.join('\n')}
              </pre>
            </div>
          )
        }
        // Note / Try it block
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50 to-indigo-50/30 p-4 text-sm leading-relaxed text-blue-950 shadow-xs"
          >
            <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <span className="font-bold text-blue-900">Interactive Prompt: </span>
              {block.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuantumBasicsOverview() {
  return (
    <div className="mb-8 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-blue-50/50 p-6 shadow-xs">
      <div className="mb-4 flex items-center gap-2">
        <Atom className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-bold text-indigo-950">Core Concepts at a Glance</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            01. Qubits
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Superposition</h3>
          <p className="mt-1 text-xs text-gray-600 leading-normal">
            Unlike classical bits (0 or 1), a qubit exists in a continuum of state $| \psi \rangle = \alpha|0\rangle + \beta|1\rangle$ until measured.
          </p>
        </div>

        <div className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            02. Circuits
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Quantum Gates</h3>
          <p className="mt-1 text-xs text-gray-600 leading-normal">
            Reversible matrix transformations (like Hadamard or CNOT) that rotate qubits across the Bloch Sphere.
          </p>
        </div>

        <div className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-xs backdrop-blur-xs">
          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
            03. Systems
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Entanglement</h3>
          <p className="mt-1 text-xs text-gray-600 leading-normal">
            Strong correlations where measuring Qubit A instantly specifies the state outcome of Qubit B.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LearnContent() {
  const [activeId, setActiveId] = useState<string>(TOPICS[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({})

  const activeIndex = TOPICS.findIndex((t) => t.id === activeId)
  const active = (TOPICS[activeIndex] || TOPICS[0]) as Topic
  const prevTopic = TOPICS[activeIndex - 1]
  const nextTopic = TOPICS[activeIndex + 1]

  const toggleComplete = (id: string) => {
    setCompletedTopics((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredTopics = TOPICS.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = Array.from(new Set(TOPICS.map((t) => t.category)))
  const completedCount = Object.values(completedTopics).filter(Boolean).length

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-72">
        <div className="sticky top-6 flex flex-col gap-6">
          {/* Header & Progress Tracker */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h2 className="font-bold text-base">Modules</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {completedCount}/{TOPICS.length} Done
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(completedCount / TOPICS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Navigation Categories */}
          <div className="flex max-h-[calc(100vh-280px)] flex-col gap-5 overflow-y-auto pr-1">
            {categories.map((category) => {
              const categoryTopics = filteredTopics.filter((t) => t.category === category)
              if (categoryTopics.length === 0) return null

              return (
                <div key={category}>
                  <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    {CATEGORY_LABELS[category]}
                  </div>
                  <div className="flex flex-col gap-1">
                    {categoryTopics.map((topic) => {
                      const isSelected = activeId === topic.id
                      const isDone = !!completedTopics[topic.id]

                      return (
                        <button
                          key={topic.id}
                          onClick={() => setActiveId(topic.id)}
                          className={`group flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <span className="truncate pr-2">{topic.title}</span>
                          <CheckCircle2
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isDone
                                ? isSelected
                                  ? 'text-white'
                                  : 'text-emerald-500'
                                : isSelected
                                ? 'text-blue-200'
                                : 'text-gray-300 group-hover:text-gray-400'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Direct CTA */}
          <Link
            href="/builder"
            className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gray-700 to-slate-700 p-4 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              <span>Open Circuit Builder</span>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex-col">
        {/* Core Quantum Summary Component */}
        <QuantumBasicsOverview />

        {/* Selected Lesson Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-10">
          {/* Module Header */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {CATEGORY_LABELS[active.category]}
              </span>
              <button
                onClick={() => toggleComplete(active.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  completedTopics[active.id]
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedTopics[active.id] ? 'Completed' : 'Mark Complete'}
              </button>
            </div>

            <h1 className="text-3xl font-extrabold text-gray-900">{active.title}</h1>
            <p className="mt-2 text-sm text-gray-600">{active.summary}</p>
          </div>

          {/* Lesson Body */}
          <TopicBody blocks={active.body} />

          {/* Next / Previous Page Controls */}
          <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
            {prevTopic ? (
              <button
                onClick={() => setActiveId(prevTopic.id)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="truncate max-w-[120px] sm:max-w-none">{prevTopic.title}</span>
              </button>
            ) : (
              <div />
            )}

            {nextTopic ? (
              <button
                onClick={() => setActiveId(nextTopic.id)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 cursor-pointer"
              >
                <span className="truncate max-w-[120px] sm:max-w-none">{nextTopic.title}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href="/builder"
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 cursor-pointer"
              >
                <span>Build Circuits Now</span>
                <Sparkles className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}