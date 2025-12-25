'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Play, Pause, RotateCcw } from 'lucide-react'

interface PomodoroTimerProps {
  onComplete: (seconds: number) => void
  onClose: () => void
  problemName: string
}

export default function PomodoroTimer({ onComplete, onClose, problemName }: PomodoroTimerProps) {
  const [initialMinutes, setInitialMinutes] = useState(25)
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current!) / 1000)
        setElapsedSeconds(elapsed)
        
        const totalSeconds = initialMinutes * 60
        const remaining = Math.max(0, totalSeconds - elapsed)
        const newMinutes = Math.floor(remaining / 60)
        const newSecs = remaining % 60

        setMinutes(newMinutes)
        setSeconds(newSecs)

        if (remaining <= 0) {
          setIsRunning(false)
          onComplete(elapsed)
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, initialMinutes, onComplete])

  const handleStart = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - elapsedSeconds * 1000
      setIsRunning(true)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setMinutes(initialMinutes)
    setSeconds(0)
    startTimeRef.current = null
  }

  const handleStop = () => {
    if (elapsedSeconds > 0) {
      onComplete(elapsedSeconds)
    }
    onClose()
  }

  const formatTime = (mins: number, secs: number) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const totalSeconds = initialMinutes * 60
  const progress = totalSeconds > 0 ? ((totalSeconds - elapsedSeconds) / totalSeconds) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Focus Timer: {problemName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="120"
              value={initialMinutes}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 25
                setInitialMinutes(val)
                if (!isRunning) {
                  setMinutes(val)
                  setSeconds(0)
                }
              }}
              disabled={isRunning}
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>
          <div className="relative w-64 h-64 mb-4">
            <svg className="transform -rotate-90 w-64 h-64">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                className="text-blue-600 dark:text-blue-500 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatTime(minutes, seconds)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isRunning ? 'Focusing...' : 'Paused'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              <Play size={20} />
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium"
            >
              <Pause size={20} />
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Save & Close
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

