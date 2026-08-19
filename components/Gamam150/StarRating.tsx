'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number | null
  onChange: (rating: number | null) => void
  disabled?: boolean
}

const STAR_VALUES = Array.from({ length: 10 }, (_, i) => i + 1)

export function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [poppedStar, setPoppedStar] = useState<number | null>(null)

  const displayValue = hovered ?? value ?? 0

  const handleSelect = (star: number) => {
    if (disabled) return
    // Clicking the currently-selected star clears the rating
    onChange(value === star ? null : star)
    setPoppedStar(star)
    setTimeout(() => setPoppedStar(null), 400)
  }

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
    >
      {STAR_VALUES.map((star) => {
        const filled = star <= displayValue
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(star)}
            onMouseEnter={() => setHovered(star)}
            className={`p-0.5 transition-transform ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-125'} ${star <= (poppedStar ?? 0) ? 'animate-star-pop' : ''}`}
            style={poppedStar !== null && star <= poppedStar ? { animationDelay: `${(poppedStar - star) * 25}ms` } : undefined}
            aria-label={`Rate ${star} out of 10`}
            title={`${star}/10`}
          >
            <Star
              size={16}
              className={filled ? 'text-yellow-400 dark:text-yellow-300' : 'text-gray-300 dark:text-gray-600'}
              fill={filled ? 'currentColor' : 'none'}
            />
          </button>
        )
      })}
    </div>
  )
}
