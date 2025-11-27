export default function NeighbourhoodSelectSkeleton() {
  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-9 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        {/* GPS button skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>

        {/* Divider skeleton */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Search button skeleton */}
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>

        {/* Neighbourhood list skeletons */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 border border-gray-200 rounded-lg space-y-2"
            >
              <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

