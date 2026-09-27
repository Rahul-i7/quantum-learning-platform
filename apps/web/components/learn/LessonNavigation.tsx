import Link from "next/link"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import type { Topic } from "@/lib/content/quantum-theory"

interface LessonNavigationProps {
    prevTopic?: Topic
    nextTopic?: Topic
    onPrevious: () => void
    onNext: () => void
}

export default function LessonNavigation({ prevTopic, nextTopic, onPrevious, onNext }: LessonNavigationProps) {
    return (
        <div className="mt-10 flex items-center justify-between border-t border-gray-100 pt-6">
            {prevTopic ? (
                <button
                    onClick={onPrevious}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="truncate max-w-30 sm:max-w-none">{prevTopic.title}</span>
                </button>
            ) : (
                <div />
            )}

            {nextTopic ? (
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-blue-700 cursor-pointer"
                >
                    <span className="truncate max-w-30 sm:max-w-none">{nextTopic.title}</span>
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
    )
}