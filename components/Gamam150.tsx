'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Home as HomeIcon } from 'lucide-react'
import gamamJson from '@/src/assets/json/gamam150.json'
import { getProblemStatus, toggleProblemStatus } from '@/lib/localStorage'
import type { Problem } from '@/types/gamam'

type ProblemData = Record<string, Problem[]>

export default function Gamam150() {
  const [codingProblems, setCodingProblems] = useState<ProblemData>({})
  const [problemStatusToggle, setProblemStatusToggle] = useState(false)

  const [isCodingChecked, setIsCodingChecked] = useState(true)
  const [isSystemDesignChecked, setIsSystemDesignChecked] = useState(true)
  const [isObjectOrientedDesignChecked, setIsObjectOrientedDesignChecked] = useState(true)
  const [isSchemaDesignChecked, setIsSchemaDesignChecked] = useState(true)
  const [isApiDesignChecked, setIsApiDesignChecked] = useState(true)
  const [isBehavioralChecked, setIsBehavioralChecked] = useState(true)

  const fetchCodingProblems = useCallback(() => {
    const data: ProblemData = {}

    if (isCodingChecked) {
      for (const item of gamamJson.Coding) {
        if (!('day' in item)) continue
        const problem: Problem = { ...item, type: 'Coding' }
        if (!(item.day! in data)) {
          data[item.day!] = []
        }
        data[item.day!].push(problem)
      }
    }

    if (isSystemDesignChecked) {
      for (const item of gamamJson.SystemDesign) {
        if (!('day' in item)) continue
        const problem: Problem = { ...item, type: 'System Design' }
        if (!(item.day! in data)) {
          data[item.day!] = []
        }
        data[item.day!].push(problem)
      }
    }

    if (isObjectOrientedDesignChecked) {
      for (const item of gamamJson.ObjectOrientedDesign) {
        if (!('day' in item)) continue
        const problem: Problem = { ...item, type: 'Object Oriented Design' }
        if (!(item.day! in data)) {
          data[item.day!] = []
        }
        data[item.day!].push(problem)
      }
    }

    if (isSchemaDesignChecked) {
      for (const item of gamamJson.SchemaDesign) {
        if (!('day' in item)) continue
        const problem: Problem = { ...item, type: 'Schema Design' }
        if (!(item.day! in data)) {
          data[item.day!] = []
        }
        data[item.day!].push(problem)
      }
    }

    if (isApiDesignChecked) {
      for (const item of gamamJson.APIDesign) {
        if (!('day' in item)) continue
        const problem: Problem = { ...item, type: 'API Design' }
        if (!(item.day! in data)) {
          data[item.day!] = []
        }
        data[item.day!].push(problem)
      }
    }

    if (isBehavioralChecked) {
      for (const item of gamamJson.Behavioral) {
        if (!('day' in item)) continue
        const problem: Problem = { ...item, type: 'Behavioral' }
        if (!(item.day! in data)) {
          data[item.day!] = []
        }
        data[item.day!].push(problem)
      }
    }

    setCodingProblems(data)
  }, [
    isCodingChecked,
    isSystemDesignChecked,
    isObjectOrientedDesignChecked,
    isSchemaDesignChecked,
    isApiDesignChecked,
    isBehavioralChecked,
  ])

  useEffect(() => {
    fetchCodingProblems()
  }, [fetchCodingProblems])

  const isDayCompleted = (day: string): boolean => {
    const problems = codingProblems[day]
    if (!problems) return false
    let cnt = 0
    for (const problem of problems) {
      if (getProblemStatus(problem.name)) {
        cnt += 1
      }
    }
    return cnt === problems.length
  }

  const isProblemSolved = (problemName: string): boolean => {
    return getProblemStatus(problemName)
  }

  const updateProblemStatus = (problemName: string) => {
    toggleProblemStatus(problemName)
    setProblemStatusToggle(!problemStatusToggle)
  }

  const totalSolved = Object.values(codingProblems).reduce((total, problems) => {
    return total + problems.filter(problem => getProblemStatus(problem.name)).length
  }, 0)

  const daysCompleted = Object.keys(codingProblems).filter(day => isDayCompleted(day)).length

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
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 mb-6 text-xl"
        >
          <HomeIcon size={20} />
        </Link>
        
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-10">
          GAMAM 150 Day Tracker
        </h1>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Day Completed</span>
            <strong className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{daysCompleted}</strong>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Total Solved</span>
            <strong className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{totalSolved}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="coding"
              checked={isCodingChecked}
              onChange={() => setIsCodingChecked(!isCodingChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="coding" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              Coding
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="system-design"
              checked={isSystemDesignChecked}
              onChange={() => setIsSystemDesignChecked(!isSystemDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="system-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              System Design
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="object-oriented-design"
              checked={isObjectOrientedDesignChecked}
              onChange={() => setIsObjectOrientedDesignChecked(!isObjectOrientedDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="object-oriented-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              OOD
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="schema-design"
              checked={isSchemaDesignChecked}
              onChange={() => setIsSchemaDesignChecked(!isSchemaDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="schema-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              Schema Design
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="api-design"
              checked={isApiDesignChecked}
              onChange={() => setIsApiDesignChecked(!isApiDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="api-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              API Design
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="behavioral"
              checked={isBehavioralChecked}
              onChange={() => setIsBehavioralChecked(!isBehavioralChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="behavioral" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              Behavioral
            </label>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {Object.entries(codingProblems).map(([day, problems]) => (
            <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Day {parseInt(day) + 1}
                </span>
                <span
                  className={`px-4 sm:px-8 py-2 text-sm sm:text-base font-bold rounded-full ${
                    isDayCompleted(day)
                      ? 'bg-green-600 dark:bg-green-500 text-white'
                      : 'bg-red-600 dark:bg-red-500 text-white'
                  }`}
                >
                  {isDayCompleted(day) ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div className="space-y-3">
                {problems.map((problem, problemNo) => (
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
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center">
                      {problem.type && (
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{problem.type}</span>
                      )}
                      {problem.difficulty && (
                        <span className={`text-xs sm:text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                          {problem.difficulty}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => updateProblemStatus(problem.name)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors ${
                        isProblemSolved(problem.name)
                          ? 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600'
                          : 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700'
                      }`}
                    >
                      {isProblemSolved(problem.name) ? 'Solved' : 'Unsolved'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

