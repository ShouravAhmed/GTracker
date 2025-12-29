import type { Problem as DBProblem } from '@/lib/supabase/solves'

export type ProblemData = Record<string, DBProblem[]>

export type ExpandedProblem = {
  id: string
  showNote: boolean
  showFocus: boolean
}

