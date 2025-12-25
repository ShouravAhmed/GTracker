'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggleTheme}
      className="neumorphic-toggle relative w-20 h-9 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      aria-label="Toggle theme"
    >
      {/* Track */}
      <div className="neumorphic-toggle-track absolute inset-0 rounded-full" />
      
      {/* Sun Icon - Left side */}
      <div
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 neumorphic-toggle-icon"
        aria-hidden="true"
      >
        <Sun className="w-4 h-4" />
      </div>

      {/* Moon Icon - Right side */}
      <div
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 neumorphic-toggle-icon"
        aria-hidden="true"
      >
        <Moon className="w-4 h-4" />
      </div>
      
      {/* Thumb */}
      <div
        className={`neumorphic-toggle-thumb absolute top-1.5 w-6 h-6 rounded-full transition-all duration-300 z-20 ${
          isLight ? 'left-1.5' : 'left-[calc(100%-1.75rem)]'
        }`}
      />
    </button>
  )
}

