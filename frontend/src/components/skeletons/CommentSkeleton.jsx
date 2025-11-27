export default function CommentSkeleton() {
  return (
    <div className="border-b border-gray-200 pb-3 animate-pulse">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  )
}

