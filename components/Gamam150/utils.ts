/**
 * Format time in seconds to a human-readable string
 */
export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

/**
 * Format elapsed time in seconds to a human-readable string
 */
export const formatElapsedTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return `${mins}m ${secs}s`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

/**
 * Get time components (hours, minutes, seconds) from total seconds
 */
export const getTimeComponents = (seconds: number): { hours: number; minutes: number; seconds: number } => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return { hours, minutes, seconds: secs }
}

/**
 * Whether a note's rich-text HTML has any actual visible content.
 * A contentEditable note that's been typed into and then fully cleared
 * often leaves stray markup behind (e.g. "<br>" or "<div><br></div>")
 * instead of an empty string, which plain .trim() won't catch.
 */
export const hasVisibleContent = (html?: string | null): boolean => {
  if (!html) return false
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ')
  return text.trim().length > 0
}

/**
 * Get difficulty color class based on difficulty string
 */
export const getDifficultyColor = (difficulty?: string): string => {
  if (!difficulty) return ''
  if (difficulty === '(Easy)') return 'text-green-600 dark:text-green-400'
  if (difficulty === '(Medium)') return 'text-orange-600 dark:text-orange-400'
  if (difficulty === '(Hard)') return 'text-red-600 dark:text-red-400'
  return ''
}

/**
 * Get glass morphism styles based on difficulty
 */
export const getGlassMorphismStyles = (difficulty?: string): string => {
  if (!difficulty) {
    return 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 text-gray-900 dark:text-white'
  }
  if (difficulty === '(Easy)') {
    return 'bg-green-500/20 dark:bg-green-400/20 border-green-500/30 dark:border-green-400/30 text-green-700 dark:text-green-300'
  }
  if (difficulty === '(Medium)') {
    return 'bg-yellow-500/20 dark:bg-yellow-400/20 border-yellow-500/30 dark:border-yellow-400/30 text-yellow-700 dark:text-yellow-300'
  }
  if (difficulty === '(Hard)') {
    return 'bg-red-500/20 dark:bg-red-400/20 border-red-500/30 dark:border-red-400/30 text-red-700 dark:text-red-300'
  }
  return 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 text-gray-900 dark:text-white'
}

