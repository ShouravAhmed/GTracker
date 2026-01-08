export interface ModuleCard {
  id: string
  title: string
  subtitle?: string
  route: string
  type: string
  colorScheme: {
    bg: string
    bgDark: string
    accent: string
  }
}

export interface MaterialSet {
  id: string
  title: string
  modules: ModuleCard[]
}

export interface ModuleStats {
  days: number
  items: number
  progress: number
  hasStarted: boolean
  firstProblemId?: string
}

export interface ModuleStatsMap {
  [moduleId: string]: ModuleStats
}

