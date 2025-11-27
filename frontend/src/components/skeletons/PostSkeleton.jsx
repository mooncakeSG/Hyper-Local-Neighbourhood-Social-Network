export default function PostSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      {/* Alert badge (optional) */}
      <div className="h-4 w-16 bg-gray-200 rounded mb-3"></div>
      
      {/* User info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>

      {/* Content lines */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>

      {/* Image placeholder (optional) */}
      <div className="h-48 bg-gray-200 rounded-lg mb-3"></div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <div className="h-5 w-16 bg-gray-200 rounded"></div>
        <div className="h-5 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

