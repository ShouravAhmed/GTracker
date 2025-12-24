'use client'

/**
 * Client-side utility for localStorage operations
 * Safe to use in client components
 */

export const getProblemStatus = (problemName: string): boolean => {
  if (typeof window === 'undefined') return false
  const status = localStorage.getItem(problemName)
  return status === 'true'
}

export const setProblemStatus = (problemName: string, status: boolean): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(problemName, status ? 'true' : 'false')
}

export const toggleProblemStatus = (problemName: string): boolean => {
  if (typeof window === 'undefined') return false
  const currentStatus = getProblemStatus(problemName)
  const newStatus = !currentStatus
  setProblemStatus(problemName, newStatus)
  return newStatus
}

