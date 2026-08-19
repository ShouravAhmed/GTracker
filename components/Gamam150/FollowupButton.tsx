'use client'

import { Bookmark } from 'lucide-react'

interface FollowupButtonProps {
  active: boolean
  disabled?: boolean
  onToggle: () => void
}

export function FollowupButton({ active, disabled, onToggle }: FollowupButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`group flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all ${disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer hover:scale-105'
        }`}
      title={active ? 'Marked for follow-up' : 'Mark for follow-up'}
    >
      <div className={`p-1.5 rounded-lg transition-colors ${active
        ? 'bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50'
        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
        }`}>
        <Bookmark
          size={20}
          className={active ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}
          fill={active ? 'currentColor' : 'none'}
        />
      </div>
      <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400 font-medium">follow-up</span>
    </button>
  )
}
