'use client'

import { useState } from 'react'

import { TOPICS, type Topic, } from '@/lib/content/quantum-theory'

import TopicBody from './TopicBody'
import QuantumBasicsOverview from './QuantumBasicsOverview'
import LearnSidebar from './LearnSidebar'
import LessonNavigation from './LessonNavigation'
import LessonHeader from './LessonHeader'

export default function LearnContent() {
  const [activeId, setActiveId] = useState<string>(TOPICS[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({})

  const activeIndex = TOPICS.findIndex((t) => t.id === activeId)

  const active = (TOPICS[activeIndex] || TOPICS[0]) as Topic

  const prevTopic = TOPICS[activeIndex - 1]
  const nextTopic = TOPICS[activeIndex + 1]

  const toggleComplete = (id: string) => {
    setCompletedTopics((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Progress should always be based on ALL topics,
  // not the currently filtered search results.
  const completedCount = Object.values(completedTopics).filter(Boolean).length
  const totalTopics = TOPICS.length

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">

      {/* Sidebar */}
      <LearnSidebar
        activeId={activeId}
        setActiveId={setActiveId}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        completedTopics={completedTopics}
        completedCount={completedCount}
        totalTopics={totalTopics}
      />

      {/* Main Content Area */}
      <div className="min-w-0 flex-1 flex-col">

        {/* Core Quantum Summary */}
        <QuantumBasicsOverview />

        {/* Selected Lesson */}
        <div className="min-w-0">

          {/* Module Header */}
          <LessonHeader
            topic={active}
            completed={!!completedTopics[active.id]}
            onToggleComplete={() => toggleComplete(active.id)}
          />

          {/* Lesson Body */}
          <TopicBody blocks={active.body} />

          {/* Lesson Navigation */}
          <LessonNavigation
            prevTopic={prevTopic}
            nextTopic={nextTopic}
            onPrevious={() =>
              prevTopic && setActiveId(prevTopic.id)
            }
            onNext={() =>
              nextTopic && setActiveId(nextTopic.id)
            }
          />

        </div>
      </div>
    </div>
  )
}