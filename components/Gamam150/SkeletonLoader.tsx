export function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Title skeleton */}
        <div className="mb-6 sm:mb-10">
          <div className="h-8 sm:h-10 lg:h-12 w-64 sm:w-80 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats section skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 sm:h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 sm:h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Filter checkboxes skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Day cards skeleton */}
        <div className="space-y-4 sm:space-y-6">
          {[...Array(3)].map((_, dayIndex) => (
            <div key={dayIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              {/* Day header skeleton */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="h-6 sm:h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </div>

              {/* Problem rows skeleton */}
              <div className="space-y-3">
                {[...Array(4)].map((_, problemIndex) => (
                  <div
                    key={problemIndex}
                    className="grid grid-cols-1 sm:grid-cols-[40px_1fr_auto_auto_auto_auto_auto_auto] gap-2 sm:gap-4 items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    {/* Number */}
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto sm:mx-0"></div>
                    
                    {/* Problem name and solve count */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-5 w-48 sm:w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>

                    {/* Solving time skeleton */}
                    <div className="flex flex-col gap-0.5">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
                    </div>

                    {/* Focus time skeleton */}
                    <div className="flex flex-col gap-0.5">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
                    </div>

                    {/* Type/Difficulty skeleton */}
                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

                    {/* Focus button skeleton */}
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                    {/* Note button skeleton */}
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                    {/* State button skeleton */}
                    <div className="h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
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

