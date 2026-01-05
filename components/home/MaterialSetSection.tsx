'use client'

import type { MaterialSet } from '@/types/home'
import type { ModuleStatsMap } from '@/types/home'
import type { ModuleProgress } from '@/lib/supabase/solves'
import { ModuleCard } from './ModuleCard'

interface MaterialSetSectionProps {
  materialSet: MaterialSet
  moduleStats: ModuleStatsMap
  moduleProgress?: ModuleProgress | null
  checkModuleStarted: (moduleType: string) => boolean
  onCardClick: (module: MaterialSet['modules'][0]) => void
  onStartModule: (moduleId: string, module: MaterialSet['modules'][0]) => void
}

/**
 * Section component for displaying a material set with its modules
 */
export function MaterialSetSection({
  materialSet,
  moduleStats,
  moduleProgress,
  checkModuleStarted,
  onCardClick,
  onStartModule,
}: MaterialSetSectionProps) {
  return (
    <div className="space-y-6">
      {/* Material Set Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-left text-gray-900 dark:text-white">
        {materialSet.title}
      </h2>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {materialSet.modules.map((module) => {
          const stats = moduleStats[module.id] || {
            days: 0,
            items: 0,
            progress: 0,
            hasStarted: false,
          }
          const isGamam150 = module.id === 'gamam-150' && module.type === 'all'
          const moduleHasStarted = checkModuleStarted(module.type)

          return (
            <ModuleCard
              key={module.id}
              module={module}
              stats={stats}
              moduleProgress={isGamam150 ? moduleProgress : null}
              isGamam150={isGamam150}
              moduleHasStarted={moduleHasStarted}
              onCardClick={onCardClick}
              onStartModule={onStartModule}
            />
          )
        })}
      </div>
    </div>
  )
}

