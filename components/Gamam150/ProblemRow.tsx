'use client'

import { Play, Timer, NotepadText, Users, Clock, CheckCircle } from 'lucide-react'
import { InlinePomodoroTimer } from './InlinePomodoroTimer'
import { InlineNoteEditor } from './InlineNoteEditor'
import { StarRating } from './StarRating'
import { FollowupButton } from './FollowupButton'
import { getTimeComponents, getGlassMorphismStyles, hasVisibleContent } from './utils'
import type { Problem as DBProblem, UserSolve } from '@/lib/supabase/solves'

export interface ProblemRowProps {
  problem: DBProblem
  index: number
  moduleHasStarted: boolean
  isAuthenticated: boolean
  solvesLoading: boolean
  isSolved: boolean
  userSolve?: UserSolve
  solveCount: number
  isExpanded: boolean
  solvingTime: number
  focusTimeElapsedForProblem: number
  lastSavedTimeForProblem: number
  onToggleStatus: () => void
  onStart: () => void
  onToggleFocus: () => void
  onToggleNote: () => void
  onFocusTimeComplete: (seconds: number) => void
  onFocusTimeUpdate: (seconds: number) => void
  onFocusElapsedChange: (seconds: number) => void
  onNoteSave: (content: string) => void
  onCloseFocusView: () => void
  onCloseNoteView: () => void
  onRate: (rating: number | null) => void
  onToggleFollowup: () => void
}

export function ProblemRow({
  problem,
  index,
  moduleHasStarted,
  isAuthenticated,
  solvesLoading,
  isSolved,
  userSolve,
  solveCount,
  isExpanded,
  solvingTime,
  focusTimeElapsedForProblem,
  lastSavedTimeForProblem,
  onToggleStatus,
  onStart,
  onToggleFocus,
  onToggleNote,
  onFocusTimeComplete,
  onFocusTimeUpdate,
  onFocusElapsedChange,
  onNoteSave,
  onCloseFocusView,
  onCloseNoteView,
  onRate,
  onToggleFollowup,
}: ProblemRowProps) {
  const hasNote = hasVisibleContent(userSolve?.note)
  const hasStarted = !!userSolve?.started_at
  const isInProgress = hasStarted && !isSolved

  return (
    <div
      id={`problem-${problem.id}`}
      className={`border-b border-gray-100/80 dark:border-gray-700/80 last:border-b-0 transition-all duration-300 ease-in-out hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg px-2 py-1 ${isSolved ? 'bg-green-50/30 dark:bg-green-900/10' : isInProgress ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
        }`}
    >
      {!isExpanded ? (
        // Normal collapsed view
        <>
          <div className="flex flex-col items-center md:grid md:grid-cols-[40px_minmax(0,1fr)_auto_auto_auto_auto_auto_auto_140px] gap-3 md:gap-3 pt-3 pb-0 md:items-center">
            <span className={`hidden md:block text-center font-bold text-gray-700 dark:text-gray-300 text-sm sm:text-base ${!moduleHasStarted ? 'opacity-60' : ''}`}>
              {index}
            </span>
            <div className={`flex items-center gap-2 ${!moduleHasStarted ? 'opacity-60' : ''} min-w-0 w-full md:w-auto`}>
              <span className="md:hidden font-bold text-gray-700 dark:text-gray-300 text-sm mr-1">
                {index}.
              </span>
              {moduleHasStarted ? (
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base truncate"
                  title={problem.name}
                >
                  {problem.name}
                </a>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 text-sm sm:text-base truncate cursor-not-allowed">
                  {problem.name}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap shrink-0 ml-auto md:ml-0">
                <Users size={14} />
                <span>{solveCount}</span>
              </div>
            </div>

            {/* Mobile Metadata Row */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:contents">
              {/* Solving time column */}
              <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                <div className="flex flex-col gap-0.5">
                  <div className="grid grid-cols-3 gap-0.5">
                    {(() => {
                      const { hours, minutes, seconds: secs } = getTimeComponents(solvingTime)
                      return (
                        <>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                              {String(hours).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                              {String(minutes).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                              {String(secs).padStart(2, '0')}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center">
                    solving time
                  </span>
                </div>
              </div>
              {/* Focus time column */}
              <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                <div className="flex flex-col gap-0.5">
                  <div className="grid grid-cols-3 gap-0.5">
                    {(() => {
                      const { hours, minutes, seconds: secs } = getTimeComponents(userSolve?.focus_time || 0)
                      return (
                        <>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                              {String(hours).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                              {String(minutes).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                              {String(secs).padStart(2, '0')}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center">
                    focus time
                  </span>
                </div>
              </div>
              {/* Type/Difficulty column */}
              <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                {(problem.type || problem.difficulty) && (
                  <button
                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 backdrop-blur-md border shadow-sm ${getGlassMorphismStyles(problem.difficulty)}`}
                  >
                    {problem.type && <span>{problem.type}</span>}
                    {problem.type && problem.difficulty && <span className="mx-1.5">•</span>}
                    {problem.difficulty && <span>{problem.difficulty}</span>}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Actions Row */}
            <div className="flex items-center justify-center gap-2 w-full md:w-auto md:contents mt-1 md:mt-0">
              {/* Focus button column */}
              <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                <button
                  onClick={onToggleFocus}
                  disabled={!moduleHasStarted}
                  className={`group flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all ${moduleHasStarted
                    ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer hover:scale-105'
                    : 'opacity-50 cursor-not-allowed'
                    }`}
                  title="Focus timer"
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${moduleHasStarted
                    ? 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50'
                    : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                    <Timer size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400 font-medium">focus</span>
                </button>
              </div>
              {/* Note button column */}
              <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                <button
                  onClick={onToggleNote}
                  disabled={!moduleHasStarted}
                  className={`group flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all ${moduleHasStarted
                    ? 'hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer hover:scale-105'
                    : 'opacity-50 cursor-not-allowed'
                    }`}
                  title="Edit note"
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${hasNote
                    ? 'bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'
                    : moduleHasStarted
                      ? 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                      : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                    <NotepadText
                      size={20}
                      className={hasNote ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
                    />
                  </div>
                  <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400 font-medium">note</span>
                </button>
              </div>
              {/* Follow-up button column */}
              <FollowupButton
                active={!!userSolve?.followup}
                disabled={!moduleHasStarted}
                onToggle={onToggleFollowup}
              />
              {/* State button column */}
              <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''} flex-1 md:flex-none`}>
                {solvesLoading && isAuthenticated ? (
                  <button
                    disabled
                    className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors bg-gray-500 dark:bg-gray-500 cursor-not-allowed"
                  >
                    Loading...
                  </button>
                ) : !moduleHasStarted ? (
                  <button
                    disabled
                    className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-full text-xs sm:text-sm font-bold cursor-not-allowed opacity-60"
                  >
                    <Play size={14} />
                    Start
                  </button>
                ) : !hasStarted ? (
                  <button
                    onClick={onStart}
                    className="group w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 dark:from-red-500 dark:to-rose-500 dark:hover:from-red-600 dark:hover:to-rose-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    <Play size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    Start
                  </button>
                ) : isInProgress ? (
                  <button
                    onClick={onToggleStatus}
                    className="group w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 animate-pulse"
                  >
                    <Clock size={14} />
                    <span className="group-hover:hidden whitespace-nowrap">In progress</span>
                    <span className="hidden group-hover:inline whitespace-nowrap">Mark solved</span>
                  </button>
                ) : (
                  <button
                    onClick={onToggleStatus}
                    className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    <CheckCircle size={14} />
                    Solved
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Star rating row, directly under and aligned with the problem name */}
          <div className={`flex items-center justify-start -mt-2 pb-2 pl-6 md:pl-[52px] ${!moduleHasStarted ? 'opacity-60' : ''}`}>
            <StarRating
              value={userSolve?.rating ?? null}
              onChange={onRate}
              disabled={!moduleHasStarted}
            />
          </div>
        </>
      ) : (
        // Expanded view with 3 equal columns
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-4 transition-all duration-300 ease-in-out">
          {/* Left Column: Problem Info */}
          <div className="flex items-center h-full">
            {/* Centered content */}
            <div className="flex flex-col gap-3 items-center justify-center w-full">
              {/* First row: Problem title and difficulty */}
              <div className={`flex flex-col gap-2 items-center ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                <div className="flex flex-col gap-2 items-center">
                  {moduleHasStarted ? (
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-xl sm:text-2xl font-semibold text-center font-mono tracking-wide"
                      style={{ fontFamily: '"Roboto Mono", "Courier New", monospace' }}
                    >
                      {problem.name}
                    </a>
                  ) : (
                    <span
                      className="text-blue-600 dark:text-blue-400 text-xl sm:text-2xl font-semibold text-center font-mono tracking-wide cursor-not-allowed"
                      style={{ fontFamily: '"Roboto Mono", "Courier New", monospace' }}
                    >
                      {problem.name}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Users size={14} />
                    <span>{solveCount}</span>
                  </div>
                </div>
                {(problem.type || problem.difficulty) && (
                  <button
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 backdrop-blur-md border shadow-sm ${getGlassMorphismStyles(problem.difficulty)}`}
                  >
                    {problem.type && <span>{problem.type}</span>}
                    {problem.type && problem.difficulty && <span className="mx-1.5">•</span>}
                    {problem.difficulty && <span>{problem.difficulty}</span>}
                  </button>
                )}
              </div>

              {/* Second row: Solving time and focus time */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Solving Time</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(() => {
                      const { hours, minutes, seconds: secs } = getTimeComponents(solvingTime)
                      return (
                        <>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                              {String(hours).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                              {String(minutes).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                              {String(secs).padStart(2, '0')}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Focus Time</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(() => {
                      // Show saved focus time + unsaved elapsed focus time in real-time
                      const savedFocusTime = userSolve?.focus_time || 0
                      const unsavedElapsedTime = Math.max(0, focusTimeElapsedForProblem - lastSavedTimeForProblem)
                      const totalFocusTime = savedFocusTime + unsavedElapsedTime
                      const { hours, minutes, seconds: secs } = getTimeComponents(totalFocusTime)
                      return (
                        <>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                              {String(hours).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                              {String(minutes).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                              {String(secs).padStart(2, '0')}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Third row: Star rating */}
              <div className="flex flex-col gap-1 items-center w-full">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Rating</span>
                <StarRating
                  value={userSolve?.rating ?? null}
                  onChange={onRate}
                  disabled={!moduleHasStarted}
                />
              </div>

              {/* Fourth row: Problem state and Close button */}
              <div className="flex flex-col gap-1 items-center w-full">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Status</span>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {solvesLoading && isAuthenticated ? (
                    <button
                      disabled
                      className="w-full min-h-[32px] flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors bg-gray-500 dark:bg-gray-500 cursor-not-allowed"
                    >
                      Loading...
                    </button>
                  ) : !hasStarted ? (
                    <button
                      onClick={onStart}
                      className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-full text-xs font-bold transition-colors"
                    >
                      <Play size={12} />
                      Start
                    </button>
                  ) : isInProgress ? (
                    <button
                      onClick={onToggleStatus}
                      className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full text-xs font-bold transition-colors group animate-breathe"
                    >
                      <Clock size={12} />
                      <span className="group-hover:hidden whitespace-nowrap">In progress</span>
                      <span className="hidden group-hover:inline whitespace-nowrap">Mark solved</span>
                    </button>
                  ) : (
                    <button
                      onClick={onToggleStatus}
                      className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                      <CheckCircle size={12} />
                      Solved
                    </button>
                  )}
                  <button
                    onClick={onCloseFocusView}
                    className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors bg-gray-500 hover:bg-gray-600 dark:bg-gray-500 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Focus Timer */}
          <div className="flex flex-col">
            <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <InlinePomodoroTimer
                problemId={problem.id}
                problemName={problem.name}
                onComplete={onFocusTimeComplete}
                onUpdate={onFocusTimeUpdate}
                onElapsedChange={onFocusElapsedChange}
                onClose={onCloseFocusView}
              />
            </div>
          </div>

          {/* Right Column: Note Editor */}
          <div className="flex flex-col">
            <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <InlineNoteEditor
                problemId={problem.id}
                initialContent={userSolve?.note || ''}
                onSave={onNoteSave}
                onClose={onCloseNoteView}
                problemName={problem.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
