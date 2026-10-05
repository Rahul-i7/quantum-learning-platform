'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface AIExplanationProps {
  content: string
}

export default function AIExplanation({
  content,
}: AIExplanationProps) {
  return (
    <div className="ai-explanation text-[13px] leading-6 text-zinc-600 dark:text-zinc-400">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-lg font-semibold tracking-tight text-zinc-950 first:mt-0 dark:text-zinc-100">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
              {children}
            </h3>
          ),

          p: ({ children }) => (
            <p className="mb-4 leading-6 text-zinc-600 dark:text-zinc-400">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              {children}
            </strong>
          ),

          em: ({ children }) => (
            <em className="text-zinc-500 dark:text-zinc-400">
              {children}
            </em>
          ),

          ul: ({ children }) => (
            <ul className="mb-4 ml-4 list-disc space-y-1.5 text-zinc-600 dark:text-zinc-400">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-4 ml-5 list-decimal space-y-2 text-zinc-600 dark:text-zinc-400">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="pl-1 leading-6">
              {children}
            </li>
          ),

          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-blue-500 bg-blue-50/50 px-4 py-3 text-zinc-600 dark:bg-blue-500/10 dark:text-zinc-400">
              {children}
            </blockquote>
          ),

          hr: () => (
            <div className="my-6 h-px bg-zinc-200 dark:bg-zinc-700" />
          ),

          code: ({ children }) => (
            <code className="bg-zinc-100 px-1 py-0.5 font-mono text-[11px] text-blue-700 dark:bg-zinc-800 dark:text-blue-400">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}