/**
 * Skeleton loader component for the home page
 * Provides a smooth loading experience while data is being fetched
 */
export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {[...Array(3)].map((_, setIndex) => (
          <div key={setIndex} className="space-y-6">
            {/* Material Set Title Skeleton */}
            <div className="h-7 sm:h-8 w-64 sm:w-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

            {/* Module Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(7)].map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="relative overflow-hidden rounded-2xl shadow-lg animate-pulse min-h-[240px]"
                >
                  {/* Gradient Background Skeleton */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 dark:from-gray-700 dark:via-gray-600 dark:to-gray-800 opacity-90">
                    {/* Abstract shapes skeleton */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
                  </div>

                  {/* Card Content Skeleton */}
                  <div className="relative p-6 sm:p-7 h-full flex flex-col">
                    {/* Status Badge Skeleton */}
                    <div className="h-6 w-24 bg-white/20 dark:bg-white/10 rounded-full mb-3"></div>

                    {/* Title Skeleton */}
                    <div className="h-7 w-3/4 bg-white/30 dark:bg-white/10 rounded mb-5"></div>
                    <div className="h-6 w-1/2 bg-white/20 dark:bg-white/5 rounded mb-5"></div>

                    {/* Stats Skeleton */}
                    <div className="flex items-center gap-4 sm:gap-6 mb-5 flex-grow">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white/20 dark:bg-white/10"></div>
                        <div className="flex flex-col gap-1">
                          <div className="h-5 w-12 bg-white/30 dark:bg-white/10 rounded"></div>
                          <div className="h-3 w-16 bg-white/20 dark:bg-white/5 rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white/20 dark:bg-white/10"></div>
                        <div className="flex flex-col gap-1">
                          <div className="h-5 w-12 bg-white/30 dark:bg-white/10 rounded"></div>
                          <div className="h-3 w-20 bg-white/20 dark:bg-white/5 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Skeleton */}
                    <div className="mb-5">
                      <div className="h-2.5 w-full rounded-full bg-white/20 dark:bg-white/10"></div>
                    </div>

                    {/* Button Skeleton */}
                    <div className="h-10 w-32 rounded-xl bg-white/20 dark:bg-white/10"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

