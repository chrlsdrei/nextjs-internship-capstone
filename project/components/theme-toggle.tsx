"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-lg bg-platinum-500 dark:bg-paynes-gray-500 text-outer-space-500 dark:text-platinum-500 hover:bg-french-gray-500 dark:hover:bg-paynes-gray-400 transition-colors border border-french-gray-300 dark:border-paynes-gray-400"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  )
}
