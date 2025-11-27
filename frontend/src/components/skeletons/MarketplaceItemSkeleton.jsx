export default function MarketplaceItemSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="flex">
        {/* Image placeholder */}
        <div className="w-32 h-32 bg-gray-200 flex-shrink-0"></div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Title and badge */}
            <div className="flex items-start justify-between mb-2">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>

            {/* Price and status */}
            <div className="flex items-center justify-between mb-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
          </div>

          {/* User and time */}
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-24"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

