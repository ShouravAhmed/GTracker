'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const TOAST_DURATION_MS = 5000

type ToastItem = { id: number; message: string }

type ToastContextValue = {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      showToast: (message: string) => {
        if (typeof window !== 'undefined') {
          console.warn('[Toast] No provider:', message)
        }
      },
    }
  }
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timeoutRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: number) => {
    const t = timeoutRefs.current.get(id)
    if (t) clearTimeout(t)
    timeoutRefs.current.delete(id)
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev.slice(-2), { id, message }])

      const t = setTimeout(() => removeToast(id), TOAST_DURATION_MS)
      timeoutRefs.current.set(id, t)

      return () => removeToast(id)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(({ id, message }) => (
          <div
            key={id}
            className="pointer-events-auto flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 shadow-lg dark:border-red-800 dark:bg-red-950/90 dark:text-red-200"
            role="alert"
          >
            <span>{message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
