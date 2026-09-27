import { CATEGORY_LABELS, type Topic } from '@/lib/content/quantum-theory'
import { CheckCircle2 } from 'lucide-react'

interface LessonHeaderProps {
  topic: Topic
  completed: boolean
  onToggleComplete: () => void
}

export default function LessonHeader({
  topic,
  completed,
  onToggleComplete,
}: LessonHeaderProps) {
  return (
    <header className="border-b border-zinc-200 pb-8">

      {/* Metadata */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
            {CATEGORY_LABELS[topic.category]}
          </span>

          <span className="h-px w-8 bg-zinc-300" />

          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400">
            Quantum Computing
          </span>
        </div>

        <button
          onClick={onToggleComplete}
          className={`flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
            completed
              ? 'text-emerald-600'
              : 'text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />

          {completed ? 'Completed' : 'Mark complete'}
        </button>
      </div>

      {/* Title */}
      <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-5xl">
        {topic.title}
      </h1>

      {/* Summary */}
      <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-500">
        {topic.summary}
      </p>
    </header>
  )
}