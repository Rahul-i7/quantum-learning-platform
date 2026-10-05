"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
  /** When true, shows label text (for menus). When false, icon-only (for navbar). */
  expand?: boolean;
  /** Compact icon-only variant for the navbar — shows a clean pill toggle */
  variant?: "default" | "nav";
}

export default function ThemeToggle({
  expand = false,
  variant = "default",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const isDark = resolvedTheme === "dark";

  // ── Nav variant: clean pill toggle (Vercel-style) ─────────────────────
  if (variant === "nav") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <Sun
          className={`h-4 w-4 transition-all duration-300 ${isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"} absolute`}
          strokeWidth={1.7}
        />
        <Moon
          className={`h-4 w-4 transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"} absolute`}
          strokeWidth={1.7}
        />
      </button>
    );
  }

  // ── Default variant: expandable menu item ─────────────────────────────
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="min-h-10 text-sm rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 flex w-full gap-4 px-3 py-2 cursor-pointer items-center overflow-hidden outline-none"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative h-4 w-4">
        <Sun
          className={`h-4 w-4 transition-all duration-300 ${isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"} absolute inset-0`}
          strokeWidth={1.7}
        />
        <Moon
          className={`h-4 w-4 transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"} absolute inset-0`}
          strokeWidth={1.7}
        />
      </div>

      {expand && (
        <span>{isDark ? "Dark" : "Light"}</span>
      )}
    </button>
  );
}