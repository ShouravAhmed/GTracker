'use client'

import { Play, Calendar, FileText, CheckCircle2, TrendingUp, ArrowRight, Lock } from 'lucide-react'
import type { ModuleCard as ModuleCardType } from '@/types/home'
import type { ModuleStats } from '@/types/home'
import type { ModuleProgress } from '@/lib/supabase/solves'

interface ModuleCardProps {
  module: ModuleCardType
  stats: ModuleStats
  moduleProgress?: ModuleProgress | null
  isGamam150: boolean
  moduleHasStarted: boolean
  onCardClick: (module: ModuleCardType) => void
  onStartModule: (moduleId: string, module: ModuleCardType) => void
}

/**
 * Individual module card component
 * Displays module information, progress, and action buttons
 */
export function ModuleCard({
  module,
  stats,
  moduleProgress,
  isGamam150,
  moduleHasStarted,
  onCardClick,
  onStartModule,
}: ModuleCardProps) {
  const { days, items, progress } = stats
  const isDummy = module.type === 'dummy'
  const hasProgress = progress > 0
  const isCompleted = progress === 100

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
        isDummy
          ? 'cursor-default opacity-60'
          : 'cursor-pointer hover:-translate-y-2 hover:scale-[1.02]'
      }`}
      onClick={() => onCardClick(module)}
    >
      {/* Abstract Background with enhanced depth */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${module.colorScheme.bg} ${module.colorScheme.bgDark} transition-opacity duration-500 group-hover:opacity-95`}
      >
        {/* Enhanced abstract geometric shapes */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-lg blur-xl -translate-x-1/2 -translate-y-1/2 rotate-45 transition-transform duration-1000 group-hover:rotate-90"></div>
        <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg transition-transform duration-500 group-hover:scale-125"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-white/5 rounded-full blur-md transition-transform duration-500 group-hover:scale-125"></div>
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/10 rounded-sm blur-md rotate-12 transition-transform duration-700 group-hover:rotate-45"></div>
        <div className="absolute bottom-1/3 left-1/4 w-14 h-14 bg-white/5 rounded-full blur-sm transition-transform duration-700 group-hover:scale-150"></div>
      </div>

      {/* Glow effect on hover */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/10 to-transparent pointer-events-none`}
      ></div>

      {/* Content */}
      <div className="relative p-6 sm:p-7 h-full flex flex-col min-h-[240px]">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          {isDummy ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
              <Lock size={14} className="text-white/70" />
              <span className="text-xs font-medium text-white/70">Coming Soon</span>
            </div>
          ) : (
            <>
              {isCompleted ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                  <CheckCircle2 size={14} className="text-white" />
                  <span className="text-xs font-medium text-white">Completed</span>
                </div>
              ) : hasProgress ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                  <TrendingUp size={14} className="text-white" />
                  <span className="text-xs font-medium text-white">In Progress</span>
                </div>
              ) : (
                <div className="h-6"></div>
              )}
            </>
          )}
        </div>

        {/* Title Section */}
        <div className="mb-5 flex-grow">
          {module.subtitle && (
            <p className="text-xs sm:text-sm text-white/70 mb-2 font-medium uppercase tracking-wider">
              {module.subtitle}
            </p>
          )}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-5 line-clamp-2 leading-tight">
            {module.title}
          </h3>

          {/* Stats with Icons */}
          {isGamam150 && moduleProgress ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2.5 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white">Day {moduleProgress.currentDay + 1}</span>
                    <span className="text-xs text-white/70 font-medium">Ongoing</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                    <CheckCircle2 size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white">{moduleProgress.completedDays}</span>
                    <span className="text-xs text-white/70 font-medium">Completed</span>
                  </div>
                </div>
              </div>

              {moduleProgress.overdueDays > 0 && (
                <div className="flex items-center gap-2.5 text-red-200">
                  <div className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm">
                    <TrendingUp size={16} className="text-red-200" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-red-200">{moduleProgress.overdueDays}</span>
                    <span className="text-xs text-red-200/70 font-medium">Overdue Days</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 sm:gap-6">
              {module.type === 'all' ? (
                // For GAMAM 150, show both Days and Items
                <>
                  <div className="flex items-center gap-2.5 text-white/90">
                    <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Calendar size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-white">{days}</span>
                      <span className="text-xs text-white/70 font-medium">Days</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-white/90">
                    <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                      <FileText size={16} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-white">{items}</span>
                      <span className="text-xs text-white/70 font-medium">Total Items</span>
                    </div>
                  </div>
                </>
              ) : (
                // For category cards, only show Total Items
                <div className="flex items-center gap-2.5 text-white/90">
                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                    <FileText size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white">{items}</span>
                    <span className="text-xs text-white/70 font-medium">Total Items</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isDummy && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white/90">Progress</span>
              <span className="text-sm font-bold text-white">
                {isGamam150 && moduleProgress
                  ? `${moduleProgress.completedPercentage}%${
                      moduleProgress.overduePercentage > 0
                        ? ` (+${moduleProgress.overduePercentage}% overdue)`
                        : ''
                    }`
                  : `${progress}%`}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden relative">
              {isGamam150 && moduleProgress ? (
                <>
                  {/* Completed progress (green) */}
                  <div
                    className="h-full bg-green-500/80 dark:bg-green-600/80 transition-all duration-700 ease-out absolute left-0"
                    style={{ width: `${moduleProgress.completedPercentage}%` }}
                  />
                  {/* Overdue progress (red) */}
                  {moduleProgress.overduePercentage > 0 && (
                    <div
                      className="h-full bg-red-500/80 dark:bg-red-600/80 transition-all duration-700 ease-out absolute"
                      style={{
                        left: `${moduleProgress.completedPercentage}%`,
                        width: `${moduleProgress.overduePercentage}%`,
                      }}
                    />
                  )}
                  {/* Shimmer effect on completed */}
                  {moduleProgress.completedPercentage > 0 && (
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                      style={{ width: `${moduleProgress.completedPercentage}%` }}
                    />
                  )}
                </>
              ) : (
                <div
                  className="h-full rounded-full bg-white/40 backdrop-blur-sm transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isDummy && (
          <div className="flex items-center justify-between mt-auto pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStartModule(module.id, module)
              }}
              className="group/btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 w-full"
              aria-label={`Start ${module.title}`}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:bg-white/30 transition-colors">
                <Play size={14} className="text-white ml-0.5" fill="white" />
              </div>
              <span className="text-sm font-semibold text-white flex-grow text-left">
                {moduleHasStarted ? (hasProgress ? 'Continue' : 'View') : 'Start'}
              </span>
              <ArrowRight
                size={16}
                className="text-white/80 group-hover/btn:translate-x-1 transition-transform"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

