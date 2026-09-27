'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Search,
} from 'lucide-react'

import {
  CATEGORY_LABELS,
  TOPICS,
  type Topic,
} from '@/lib/content/quantum-theory'

interface LearnSidebarProps {
  activeId: string
  setActiveId: (id: string) => void

  searchQuery: string
  setSearchQuery: (value: string) => void

  completedTopics: Record<string, boolean>

  completedCount: number
  totalTopics: number
}

export default function LearnSidebar({
  activeId,
  setActiveId,
  searchQuery,
  setSearchQuery,
  completedTopics,
  completedCount,
  totalTopics,
}: LearnSidebarProps) {
  const filteredTopics = TOPICS.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = Array.from(
    new Set(TOPICS.map((topic) => topic.category))
  )

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="sticky top-24 flex flex-col gap-7">

        {/* Header */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />

              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Learning Path
              </span>
            </div>

            <span className="font-mono text-[10px] text-zinc-400">
              {String(completedCount).padStart(2, '0')} /{' '}
              {String(totalTopics).padStart(2, '0')}
            </span>
          </div>

          {/* Progress */}
          <div className="h-px w-full bg-zinc-200">
            <div
              className="h-px bg-blue-600 transition-all duration-500"
              style={{
                width: `${
                  totalTopics
                    ? (completedCount / totalTopics) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />

          <input
            type="text"
            placeholder="Filter modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-b border-zinc-200 bg-transparent py-2 pl-6 pr-2 text-xs text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-500"
          />
        </div>

        {/* Modules */}
        <div className="flex max-h-[calc(100vh-300px)] flex-col gap-7 overflow-y-auto pr-2">
          {categories.map((category, categoryIndex) => {
            const categoryTopics = filteredTopics.filter(
              (topic) => topic.category === category
            )

            if (categoryTopics.length === 0) return null

            return (
              <div key={category}>

                {/* Category */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[9px] font-semibold text-zinc-400">
                    {String(categoryIndex + 1).padStart(2, '0')}
                  </span>

                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                    {CATEGORY_LABELS[category]}
                  </span>
                </div>

                {/* Topics */}
                <div className="border-l border-zinc-200">
                  {categoryTopics.map((topic) => {
                    const isSelected = activeId === topic.id
                    const isDone = !!completedTopics[topic.id]

                    return (
                      <button
                        key={topic.id}
                        onClick={() => setActiveId(topic.id)}
                        className={`group relative flex w-full items-center justify-between py-2 pl-4 pr-2 text-left transition-all ${
                          isSelected
                            ? 'text-zinc-950'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        {/* Active indicator */}
                        {isSelected && (
                          <span className="absolute -left-px top-0 h-full w-px bg-blue-600" />
                        )}

                        <span
                          className={`text-xs ${
                            isSelected
                              ? 'font-semibold'
                              : 'font-medium'
                          }`}
                        >
                          {topic.title}
                        </span>

                        {isDone && (
                          <CheckCircle2
                            className={`h-3.5 w-3.5 ${
                              isSelected
                                ? 'text-blue-600'
                                : 'text-emerald-500'
                            }`}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Builder */}
        <Link
          href="/builder"
          className="group flex items-center justify-between border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-zinc-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Cpu className="h-4 w-4 text-blue-600" />

            <div>
              <div className="text-xs font-semibold text-zinc-900">
                Circuit Builder
              </div>

              <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                Apply what you learn
              </div>
            </div>
          </div>

          <ArrowRight className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
        </Link>

      </div>
    </aside>
  )
}