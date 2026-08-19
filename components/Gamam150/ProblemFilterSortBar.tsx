'use client'

import { Bookmark, Star, ArrowUp, ArrowDown } from 'lucide-react'

export type SortField = 'followup_at' | 'rating' | 'rated_at'
export type SortDir = 'asc' | 'desc'

interface SortOption {
  field: SortField
  label: string
}

interface ProblemFilterSortBarProps {
  filterFollowup: boolean
  filterStarred: boolean
  onToggleFollowup: () => void
  onToggleStarred: () => void
  sortField: SortField
  onSortFieldChange: (field: SortField) => void
  sortDir: SortDir
  onToggleSortDir: () => void
}

export function ProblemFilterSortBar({
  filterFollowup,
  filterStarred,
  onToggleFollowup,
  onToggleStarred,
  sortField,
  onSortFieldChange,
  sortDir,
  onToggleSortDir,
}: ProblemFilterSortBarProps) {
  const anyFilterActive = filterFollowup || filterStarred

  const sortOptions: SortOption[] = [
    ...(filterFollowup ? [{ field: 'followup_at' as const, label: 'Date marked' }] : []),
    ...(filterStarred
      ? [
        { field: 'rating' as const, label: 'Rating' },
        { field: 'rated_at' as const, label: 'Date rated' },
      ]
      : []),
  ]

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-5 mb-6 border border-gray-200/50 dark:border-gray-700/50 shadow-md">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onToggleFollowup}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${filterFollowup
            ? 'bg-amber-500 border-amber-500 text-white'
            : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
        >
          <Bookmark size={14} fill={filterFollowup ? 'currentColor' : 'none'} />
          Follow-up only
        </button>
        <button
          onClick={onToggleStarred}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${filterStarred
            ? 'bg-yellow-500 border-yellow-500 text-white'
            : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            }`}
        >
          <Star size={14} fill={filterStarred ? 'currentColor' : 'none'} />
          Starred only
        </button>

        {anyFilterActive && (
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={sortField}
              onChange={(e) => onSortFieldChange(e.target.value as SortField)}
              className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1.5 focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.field} value={opt.field}>
                  Sort: {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={onToggleSortDir}
              className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
