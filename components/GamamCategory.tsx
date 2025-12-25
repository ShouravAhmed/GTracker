'use client'

import { useState, useEffect, useCallback } from 'react'
import gamamJson from '@/src/assets/json/gamam150.json'
import { useSolves } from '@/lib/solves-client'
import type { Problem, CategoryName } from '@/types/gamam'

interface GamamCategoryProps {
  categoryName: CategoryName
}

export default function GamamCategory({ categoryName }: GamamCategoryProps) {
  const { getProblemStatus, toggleProblemStatus, triggerLogin, loading: solvesLoading, isAuthenticated } = useSolves()
  const [problemsList, setProblemsList] = useState<Problem[]>([])
  const [problemStatusToggle, setProblemStatusToggle] = useState(false)

  const fetchCodingProblems = useCallback(() => {
    setProblemsList(gamamJson[categoryName] as Problem[])
  }, [categoryName])

  useEffect(() => {
    fetchCodingProblems()
  }, [fetchCodingProblems])

  const isProblemSolved = (problemName: string): boolean => {
    return getProblemStatus(problemName)
  }

  const updateProblemStatus = async (problemName: string) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      try {
        await triggerLogin()
      } catch (error) {
        console.error('Failed to trigger login:', error)
      }
      return
    }

    const result = await toggleProblemStatus(problemName)
    if (result !== null) {
      setProblemStatusToggle(!problemStatusToggle)
    }
  }

  const totalSolved = problemsList.filter(problem => getProblemStatus(problem.name)).length

  const getDifficultyColor = (difficulty?: string): string => {
    if (!difficulty) return ''
    if (difficulty === '(Easy)') return 'text-green-600 dark:text-green-400'
    if (difficulty === '(Medium)') return 'text-orange-600 dark:text-orange-400'
    if (difficulty === '(Hard)') return 'text-red-600 dark:text-red-400'
    return ''
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-10">
          {categoryName}
        </h1>

        <div className="flex justify-end p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex flex-col items-end">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Total Solved</span>
            <strong className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{totalSolved}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
          <div className="space-y-3">
            {problemsList.map((problem, problemNo) => (
              <div
                key={problemNo}
                className="grid grid-cols-1 sm:grid-cols-[40px_1fr_auto_auto] gap-2 sm:gap-4 items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <span className="text-center font-bold text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  {problemNo + 1}
                </span>
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base truncate"
                >
                  {problem.name}
                </a>
                <div className="flex items-center">
                  {problem.difficulty && (
                    <span className={`text-xs sm:text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => updateProblemStatus(problem.name)}
                  disabled={solvesLoading}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isProblemSolved(problem.name)
                      ? 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600'
                      : 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700'
                  }`}
                >
                  {solvesLoading ? 'Loading...' : isProblemSolved(problem.name) ? 'Solved' : 'Unsolved'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

