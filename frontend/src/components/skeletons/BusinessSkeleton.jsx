export default function BusinessSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="flex">
        {/* Image placeholder */}
        <div className="w-32 h-32 bg-gray-200 flex-shrink-0"></div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Name and category */}
            <div className="flex items-start justify-between mb-2">
              <div className="h-5 bg-gray-200 rounded w-40"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-4/5"></div>
            </div>

            {/* Contact info */}
            <div className="space-y-1 mb-2">
              <div className="h-3 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          </div>

          {/* Time */}
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

