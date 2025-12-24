import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
          Cracking the GAMAM Technical Interview
        </h1>
        
        <div className="space-y-4 sm:space-y-6">
          <Link 
            href="/gamam-150"
            className="flex items-center gap-4 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">1.</span>
            <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline flex-1">
              GAMAM 150 days Tracker.
            </span>
          </Link>

          <Link 
            href="/coding"
            className="flex items-center gap-4 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">2.</span>
            <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline flex-1">
              Coding Problems.
            </span>
          </Link>

          <Link 
            href="/system-design"
            className="flex items-center gap-4 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">3.</span>
            <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline flex-1">
              System Design Problems.
            </span>
          </Link>

          <Link 
            href="/object-oriented-design"
            className="flex items-center gap-4 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">4.</span>
            <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline flex-1">
              Object Oriented Design Problems.
            </span>
          </Link>

          <Link 
            href="/schema-design"
            className="flex items-center gap-4 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">5.</span>
            <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline flex-1">
              Schema Design Problems.
            </span>
          </Link>

          <Link 
            href="/api-design"
            className="flex items-center gap-4 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">6.</span>
            <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline flex-1">
              API Design Problems.
            </span>
          </Link>

          <Link 
            href="/behavioral"
            className="flex items-center gap-4 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
          >
            <span className="text-lg sm:text-xl font-bold text-gray-700 dark:text-gray-300">7.</span>
            <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 hover:underline flex-1">
              Behavioral Problems.
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

