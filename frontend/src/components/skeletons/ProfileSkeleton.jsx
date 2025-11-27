export default function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      {/* Profile form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Name field */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>

        {/* Email field */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>

        {/* Phone field */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>

        {/* Neighbourhood field */}
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>

        {/* Save button */}
        <div className="h-12 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  )
}

