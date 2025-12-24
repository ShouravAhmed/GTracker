import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-900 dark:text-white">404</h1>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Looks like you&apos;re lost
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you are looking for is not available!
          </p>
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}

