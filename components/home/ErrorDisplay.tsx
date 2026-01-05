import { AlertCircle } from 'lucide-react'

interface ErrorDisplayProps {
  title: string
  message: string
  developerMessage?: string
}

/**
 * Error display component for configuration and runtime errors
 */
export function ErrorDisplay({ title, message, developerMessage }: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        {developerMessage && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>For developers:</strong> {developerMessage}
            </p>
          </div>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}

