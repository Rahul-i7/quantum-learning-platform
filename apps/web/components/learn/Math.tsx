'use client'

import { useMemo } from 'react'
import katex from 'katex'

/**
 * Renders a LaTeX string with KaTeX. `katex.min.css` is already loaded
 * globally in app/layout.tsx, so no extra CSS import is needed here.
 *
 * display=true  -> centered block equation (used for standalone "math" blocks)
 * display=false -> inline equation (used inside running prose)
 */
export default function MathBlock({
    tex,
    display = false,
}: {
    tex: string
    display?: boolean
}) {
    const html = useMemo(() => {
        try {
            return katex.renderToString(tex, {
                throwOnError: false,
                displayMode: display,
            })
        } catch {
            return tex
        }
    }, [tex, display])

    if (display) {
        return (
            <div
                className="max-w-3xl overflow-x-auto py-1 text-[15px] text-zinc-800 dark:text-zinc-200"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: html }}
            />
        )
    }

    return (
        <span
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}