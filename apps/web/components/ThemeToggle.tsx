"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeToggleProps {
  expand?: boolean;
}

export default function ThemeToggle({ expand = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-10" />;
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="text-sm rounded-md text-zinc-600 hover:bg-zinc-200/80 flex w-full gap-4 px-3 py-2 cursor-pointer items-center overflow-hidden outline-none transition-colors duration-300"
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isLight ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4" strokeWidth={1.7} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4" strokeWidth={1.7} />
          </motion.div>
        )}

        {expand && (
          <motion.span
            key="label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {isLight ? "Light" : "Dark"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}