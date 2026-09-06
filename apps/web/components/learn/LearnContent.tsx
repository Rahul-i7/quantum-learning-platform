'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { TOPICS, CATEGORY_LABELS, type Topic, type TopicBlock } from '@/lib/content/quantum-theory'

function TopicBody({ blocks }: { blocks: TopicBlock[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return (
            <p key={i} className="text-[15px] leading-7 text-gray-700">
              {block.text}
            </p>
          )
        }
        if (block.type === 'matrix') {
          return (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-3">
              <span className="font-mono text-sm text-slate-300">{block.label}</span>
              <pre className="font-mono text-sm leading-6 text-emerald-400">
                {block.rows.join('\n')}
              </pre>
            </div>
          )
        }
        // note
        return (
          <div
            key={i}
            className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900"
          >
            <span className="font-semibold">Try it: </span>
            {block.text}
          </div>
        )
      })}
    </div>
  )
}

export default function LearnContent() {
  const [activeId, setActiveId] = useState<string>(TOPICS[0].id)
  const active = TOPICS.find((t) => t.id === activeId) as Topic

  const categories = Array.from(new Set(TOPICS.map((t) => t.category)))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="mb-4 flex items-center gap-2 text-gray-800">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold">Theory</h2>
        </div>

        <div className="flex flex-col gap-5">
          {categories.map((category) => (
            <div key={category}>
              <div className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {CATEGORY_LABELS[category]}
              </div>
              <div className="flex flex-col gap-0.5">
                {TOPICS.filter((t) => t.category === category).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setActiveId(topic.id)}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                      activeId === topic.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {topic.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/builder"
          className="mt-6 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          Try it in the Builder
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </aside>

      {/* Content panel */}
      <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-1 text-sm font-medium text-blue-600">
          {CATEGORY_LABELS[active.category]}
        </p>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{active.title}</h1>
        <p className="mb-6 text-sm text-gray-500">{active.summary}</p>

        <TopicBody blocks={active.body} />
      </div>
    </div>
  )
}
