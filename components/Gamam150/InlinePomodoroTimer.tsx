'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { useTheme } from '../ThemeProvider'

interface InlinePomodoroTimerProps {
  problemId: string
  problemName: string
  onComplete: (seconds: number) => void
  onUpdate?: (seconds: number) => void
  onElapsedChange?: (seconds: number) => void
  onClose: () => void
}

export function InlinePomodoroTimer({
  problemId,
  problemName,
  onComplete,
  onUpdate,
  onElapsedChange,
  onClose
}: InlinePomodoroTimerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [initialMinutes, setInitialMinutes] = useState(20)
  const [minutes, setMinutes] = useState(20)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const lastSavedTimeRef = useRef<number>(0)

  // Clock dimensions
  const CLOCK_SIZE = 300
  const CENTER = CLOCK_SIZE / 2
  const RADIUS = 110
  const HANDLE_RADIUS = 12
  const INNER_RADIUS = 90

  // Convert minutes to angle (0 minutes = -90 degrees, counter-clockwise)
  const minutesToAngle = (mins: number) => {
    return -90 - (mins / 60) * 360
  }

  // Convert angle to minutes (counter-clockwise from top)
  const angleToMinutes = (angle: number) => {
    let normalized = ((angle + 90) % 360 + 360) % 360
    let minutes = ((360 - normalized) % 360) / 360 * 60
    return Math.min(60, Math.max(0, Math.round(minutes)))
  }

  // Get handle position based on minutes - closer to outer border
  const getHandlePosition = (mins: number) => {
    const angle = (minutesToAngle(mins) * Math.PI) / 180
    const handleRadius = INNER_RADIUS + (RADIUS - INNER_RADIUS) * 0.6
    const x = CENTER + handleRadius * Math.cos(angle)
    const y = CENTER + handleRadius * Math.sin(angle)
    return { x, y }
  }

  // Get point on circle from angle
  const getPointOnCircle = (angleDeg: number, radius: number) => {
    const angle = (angleDeg * Math.PI) / 180
    const x = CENTER + radius * Math.cos(angle)
    const y = CENTER + radius * Math.sin(angle)
    return { x, y }
  }

  // Create path for red fill (pie slice) - counter-clockwise
  const getRedFillPath = (mins: number) => {
    if (mins === 0) return ''
    const endAngle = minutesToAngle(mins)
    const startAngle = -90
    
    const startPoint = getPointOnCircle(startAngle, INNER_RADIUS)
    const endPoint = getPointOnCircle(endAngle, INNER_RADIUS)
    
    const largeArcFlag = mins > 30 ? 1 : 0
    
    return `M ${CENTER} ${CENTER} L ${startPoint.x} ${startPoint.y} A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${endPoint.x} ${endPoint.y} Z`
  }

  // Handle mouse/touch events for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning) return
    setIsDragging(true)
    handlePointerMove(e)
  }

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || isRunning) return
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX || (e as PointerEvent).clientX) - rect.left - CENTER
      const y = (e.clientY || (e as PointerEvent).clientY) - rect.top - CENTER
      
      let angle = Math.atan2(y, x) * (180 / Math.PI)
      const newMinutes = angleToMinutes(angle)
      
      if (newMinutes >= 0 && newMinutes <= 60) {
        setInitialMinutes(newMinutes)
        setMinutes(newMinutes)
        setSeconds(0)
        setElapsedSeconds(0)
        startTimeRef.current = null
      }
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: PointerEvent) => handlePointerMove(e)
      const handleUp = () => handlePointerUp()
      
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      
      return () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
    }
  }, [isDragging])

  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      const updateTimer = () => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current!) / 1000)
        setElapsedSeconds(elapsed)
        
        if (onElapsedChange) {
          onElapsedChange(elapsed)
        }
        
        const totalSeconds = initialMinutes * 60
        const remaining = Math.max(0, totalSeconds - elapsed)
        const newMinutes = Math.floor(remaining / 60)
        const newSecs = remaining % 60

        setMinutes(newMinutes)
        setSeconds(newSecs)

        if (onUpdate && elapsed > 0 && elapsed - lastSavedTimeRef.current >= 300) {
          const additionalSeconds = elapsed - lastSavedTimeRef.current
          lastSavedTimeRef.current = elapsed
          onUpdate(additionalSeconds)
        }

        if (remaining <= 0) {
          setIsRunning(false)
          onComplete(elapsed)
          setElapsedSeconds(0)
          setMinutes(initialMinutes)
          setSeconds(0)
          startTimeRef.current = null
          lastSavedTimeRef.current = 0
          if (onElapsedChange) {
            onElapsedChange(0)
          }
        }
      }

      updateTimer()
      intervalRef.current = setInterval(updateTimer, 1000)
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
  }, [isRunning, initialMinutes, onComplete, onUpdate, onElapsedChange])

  const handleStart = () => {
    if (!isRunning) {
      if (elapsedSeconds === 0) {
        startTimeRef.current = Date.now()
        lastSavedTimeRef.current = 0
        setMinutes(initialMinutes)
        setSeconds(0)
      } else {
        startTimeRef.current = Date.now() - elapsedSeconds * 1000
        const totalSeconds = initialMinutes * 60
        const remaining = Math.max(0, totalSeconds - elapsedSeconds)
        setMinutes(Math.floor(remaining / 60))
        setSeconds(remaining % 60)
      }
      setIsRunning(true)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
    if (onUpdate && elapsedSeconds > 0 && elapsedSeconds > lastSavedTimeRef.current) {
      const remainingSeconds = elapsedSeconds - lastSavedTimeRef.current
      if (remainingSeconds > 0) {
        onUpdate(remainingSeconds)
        lastSavedTimeRef.current = elapsedSeconds
      }
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setMinutes(initialMinutes)
    setSeconds(0)
    startTimeRef.current = null
    lastSavedTimeRef.current = 0
    if (onElapsedChange) {
      onElapsedChange(0)
    }
  }

  const handleStop = () => {
    if (elapsedSeconds > 0 && elapsedSeconds > lastSavedTimeRef.current) {
      const remainingSeconds = elapsedSeconds - lastSavedTimeRef.current
      if (onUpdate && remainingSeconds > 0) {
        onUpdate(remainingSeconds)
      }
    }
    if (elapsedSeconds > 0) {
      onComplete(elapsedSeconds)
    }
    onClose()
  }

  const displayMinutes = isRunning ? initialMinutes : initialMinutes
  const currentMinutes = (!isRunning && elapsedSeconds === 0) ? initialMinutes : minutes
  const currentSeconds = (!isRunning && elapsedSeconds === 0) ? 0 : seconds

  const totalSeconds = initialMinutes * 60
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  const redFillMinutes = isRunning 
    ? remainingSeconds / 60
    : (elapsedSeconds === 0 ? initialMinutes : minutes + seconds / 60)

  const handlePos = getHandlePosition(displayMinutes)

  const numbers = Array.from({ length: 12 }, (_, i) => i * 5)
  const numberPositions = numbers.map(num => {
    const angle = minutesToAngle(num)
    const rad = (angle * Math.PI) / 180
    const numberRadius = RADIUS + 18
    const x = CENTER + numberRadius * Math.cos(rad)
    const y = CENTER + numberRadius * Math.sin(rad)
    return { num, x, y, angle }
  })

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: CLOCK_SIZE, height: CLOCK_SIZE }}>
          <div className="absolute -top-1 left-0 flex justify-start pointer-events-none">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Focus Timer</h3>
          </div>
          <svg
            ref={svgRef}
            width={CLOCK_SIZE}
            height={CLOCK_SIZE}
            className={isRunning ? 'cursor-default' : 'cursor-grab'}
            onPointerDown={handlePointerDown}
            style={{ touchAction: 'none' }}
          >
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="largeDropShadow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
                <feOffset dx="0" dy="8" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope={isDark ? 0.4 : 0.25}/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? "#1a1a2a" : "#f0f0f0"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "#0f0f1a" : "#d0d0d0"} stopOpacity="1" />
              </linearGradient>
              <radialGradient id="ringGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor={isDark ? "#e5e7eb" : "#f8f8f8"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "#d1d5db" : "#e8e8e8"} stopOpacity="1" />
              </radialGradient>
              <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="0" dy="1" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feComposite in="SourceGraphic" in2="offsetblur" operator="arithmetic" k2="-1" k3="1"/>
              </filter>
              <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                <feOffset dx="0" dy="3" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="handleShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="1" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <radialGradient id="handleGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor={isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.9)"} stopOpacity="1" />
                <stop offset="50%" stopColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)"} stopOpacity="1" />
              </radialGradient>
              <radialGradient id="centerGlassGradient" cx="40%" cy="40%">
                <stop offset="0%" stopColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)"} stopOpacity="1" />
                <stop offset="50%" stopColor={isDark ? "rgba(200,200,200,0.05)" : "rgba(200,200,200,0.2)"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "rgba(150,150,150,0.08)" : "rgba(150,150,150,0.3)"} stopOpacity="1" />
              </radialGradient>
              <radialGradient id="innerCircleShadow" cx="50%" cy="50%">
                <stop offset="70%" stopColor={isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)"} stopOpacity="1" />
                <stop offset="80%" stopColor={isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)"} stopOpacity="1" />
                <stop offset="90%" stopColor={isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.1)"} stopOpacity="1" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
              </radialGradient>
              <mask id="shadowRingMask">
                <rect width="100%" height="100%" fill="white"/>
                <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="black"/>
              </mask>
            </defs>

            <g filter="url(#largeDropShadow)">
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS + 5}
                fill="url(#circleGradient)"
                stroke={isDark ? "#1a1a2a" : "#b0b0b0"}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS + 5}
                fill="url(#ringGradient)"
                stroke="none"
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={INNER_RADIUS + 25}
                fill="url(#innerCircleShadow)"
                mask="url(#shadowRingMask)"
                style={{ pointerEvents: 'none' }}
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={INNER_RADIUS}
                fill={isDark ? "#f3f4f6" : "white"}
                stroke="none"
              />
              
              <circle
                cx={CENTER}
                cy={CENTER + 1}
                r={INNER_RADIUS}
                fill="none"
                stroke={isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)"}
                strokeWidth="2"
              />
              
              <circle
                cx={CENTER}
                cy={CENTER}
                r={INNER_RADIUS}
                fill="none"
                stroke={isDark ? "#d1d5db" : "#e0e0e0"}
                strokeWidth="1.5"
              />
              
              <line
                x1={CENTER}
                y1={CENTER - RADIUS - 5}
                x2={CENTER}
                y2={CENTER - INNER_RADIUS}
                stroke={isDark ? "#6b7280" : "#808080"}
                strokeWidth="2"
              />
              
              {(() => {
                const angle59 = minutesToAngle(59)
                const rad59 = (angle59 * Math.PI) / 180
                const x59 = CENTER + (RADIUS + 5) * Math.cos(rad59)
                const y59 = CENTER + (RADIUS + 5) * Math.sin(rad59)
                const x59Inner = CENTER + INNER_RADIUS * Math.cos(rad59)
                const y59Inner = CENTER + INNER_RADIUS * Math.sin(rad59)
                return (
                  <line
                    x1={x59}
                    y1={y59}
                    x2={x59Inner}
                    y2={y59Inner}
                    stroke={isDark ? "#6b7280" : "#808080"}
                    strokeWidth="2"
                  />
                )
              })()}
              
              {(() => {
                const angle0 = minutesToAngle(0)
                const angle59 = minutesToAngle(59)
                const rad0 = (angle0 * Math.PI) / 180
                const rad59 = (angle59 * Math.PI) / 180
                const radius = RADIUS + 5
                
                const x0 = CENTER + radius * Math.cos(rad0)
                const y0 = CENTER + radius * Math.sin(rad0)
                const x59 = CENTER + radius * Math.cos(rad59)
                const y59 = CENTER + radius * Math.sin(rad59)
                
                return (
                  <path
                    d={`M ${x59} ${y59}
                        L ${CENTER} ${CENTER}
                        L ${x0} ${y0}
                        A ${radius} ${radius} 0 0 1 ${x59} ${y59} Z`}
                    fill={isDark ? "#f3f4f6" : "white"}
                  />
                )
              })()}

              {redFillMinutes > 0 && (
                <path
                  d={getRedFillPath(redFillMinutes)}
                  fill="#D30009"
                />
              )}

              {Array.from({ length: 12 }, (_, i) => {
                const minutes = i * 5
                const angle = minutesToAngle(minutes)
                const rad = (angle * Math.PI) / 180
                const x1 = CENTER + (INNER_RADIUS - 5) * Math.cos(rad)
                const y1 = CENTER + (INNER_RADIUS - 5) * Math.sin(rad)
                const x2 = CENTER + (INNER_RADIUS + 5) * Math.cos(rad)
                const y2 = CENTER + (INNER_RADIUS + 5) * Math.sin(rad)
                return (
                  <line
                    key={`5min-${minutes}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isDark ? "#374151" : "#000"}
                    strokeWidth="2.5"
                  />
                )
              })}

              {Array.from({ length: 60 }, (_, i) => {
                if (i % 5 === 0) return null
                const angle = minutesToAngle(i)
                const rad = (angle * Math.PI) / 180
                const x1 = CENTER + (INNER_RADIUS - 2.5) * Math.cos(rad)
                const y1 = CENTER + (INNER_RADIUS - 2.5) * Math.sin(rad)
                const x2 = CENTER + (INNER_RADIUS + 2.5) * Math.cos(rad)
                const y2 = CENTER + (INNER_RADIUS + 2.5) * Math.sin(rad)
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isDark ? "#6b7280" : "#000"}
                    strokeWidth="1"
                  />
                )
              })}

              {numberPositions.map(({ num, x, y }) => (
                <text
                  key={num}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="14"
                  fontWeight="500"
                  fill={isDark ? "#6b7280" : "#000"}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {num}
                </text>
              ))}

              <circle
                cx={CENTER}
                cy={CENTER}
                r="4"
                fill={isDark ? "#374151" : "#000"}
              />

              {!isRunning && (
                <g>
                  <circle
                    cx={handlePos.x + 1}
                    cy={handlePos.y + 2}
                    r={HANDLE_RADIUS}
                    fill={isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.25)"}
                    style={{ filter: 'blur(4px)' }}
                  />
                  <circle
                    cx={handlePos.x}
                    cy={handlePos.y}
                    r={HANDLE_RADIUS}
                    fill="url(#handleGradient)"
                    stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                    strokeWidth="1.5"
                    filter="url(#handleShadow)"
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    className="hover:scale-110 transition-transform"
                  />
                  <circle
                    cx={handlePos.x - 3}
                    cy={handlePos.y - 3}
                    r={HANDLE_RADIUS - 5}
                    fill={isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)"}
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={handlePos.x}
                    cy={handlePos.y}
                    r={HANDLE_RADIUS - 6}
                    fill="url(#centerGlassGradient)"
                    stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"}
                    strokeWidth="0.5"
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={handlePos.x - 2}
                    cy={handlePos.y - 2}
                    r={HANDLE_RADIUS - 8}
                    fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"}
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={handlePos.x}
                    cy={handlePos.y}
                    r={HANDLE_RADIUS}
                    fill="none"
                    stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)"}
                    strokeWidth="1"
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              )}
            </g>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={isRunning ? handlePause : handleStart}
              className="pointer-events-auto w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={initialMinutes === 0}
            >
              {isRunning ? (
                <Pause size={24} className="text-gray-700 dark:text-gray-300" fill="currentColor" />
              ) : (
                <Play size={24} className="text-gray-700 dark:text-gray-300 ml-1" fill="currentColor" />
              )}
            </button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pt-28 pointer-events-none">
            <div 
              className="flex items-center gap-0 pointer-events-auto cursor-pointer"
              onClick={initialMinutes === 0 ? undefined : (isRunning ? handlePause : handleStart)}
            >
              <div className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-gray-100/50 dark:bg-white/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-300/50 shadow-sm hover:bg-gray-200/50 dark:hover:bg-white/80 transition-colors">
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-700">
                  {String(currentMinutes).padStart(2, '0')}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-gray-100/50 dark:bg-white/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-300/50 shadow-sm hover:bg-gray-200/50 dark:hover:bg-white/80 transition-colors">
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-700">
                  {String(currentSeconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

