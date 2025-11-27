import { useState } from 'react'
import PostSkeleton from '../components/skeletons/PostSkeleton'
import CommentSkeleton from '../components/skeletons/CommentSkeleton'
import MarketplaceItemSkeleton from '../components/skeletons/MarketplaceItemSkeleton'
import BusinessSkeleton from '../components/skeletons/BusinessSkeleton'
import ProfileSkeleton from '../components/skeletons/ProfileSkeleton'

export default function SkeletonTestPage() {
  const [showPostSkeletons, setShowPostSkeletons] = useState(false)
  const [showCommentSkeletons, setShowCommentSkeletons] = useState(false)
  const [showMarketplaceSkeletons, setShowMarketplaceSkeletons] = useState(false)
  const [showBusinessSkeletons, setShowBusinessSkeletons] = useState(false)
  const [showProfileSkeleton, setShowProfileSkeleton] = useState(false)
  const [showAll, setShowAll] = useState(false)

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-2">Skeleton Loader Test Page</h1>
        <p className="text-gray-600 mb-8">
          Test all skeleton loader components. Click buttons to toggle skeletons on/off.
        </p>

        <div className="space-y-8">
          {/* Post Skeletons */}
          <section className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Post Skeletons</h2>
                <p className="text-sm text-gray-600">
                  Used in FeedPage while loading posts
                </p>
              </div>
              <button
                onClick={() => setShowPostSkeletons(!showPostSkeletons)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {showPostSkeletons ? 'Hide' : 'Show'} Post Skeletons
              </button>
            </div>
            {showPostSkeletons && (
              <div className="space-y-4">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            )}
          </section>

          {/* Comment Skeletons */}
          <section className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Comment Skeletons</h2>
                <p className="text-sm text-gray-600">
                  Used in CommentDrawer while loading comments
                </p>
              </div>
              <button
                onClick={() => setShowCommentSkeletons(!showCommentSkeletons)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {showCommentSkeletons ? 'Hide' : 'Show'} Comment Skeletons
              </button>
            </div>
            {showCommentSkeletons && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <CommentSkeleton />
                <CommentSkeleton />
                <CommentSkeleton />
              </div>
            )}
          </section>

          {/* Marketplace Item Skeletons */}
          <section className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Marketplace Item Skeletons</h2>
                <p className="text-sm text-gray-600">
                  Used in MarketplacePage while loading items
                </p>
              </div>
              <button
                onClick={() => setShowMarketplaceSkeletons(!showMarketplaceSkeletons)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {showMarketplaceSkeletons ? 'Hide' : 'Show'} Marketplace Skeletons
              </button>
            </div>
            {showMarketplaceSkeletons && (
              <div className="space-y-4">
                <MarketplaceItemSkeleton />
                <MarketplaceItemSkeleton />
                <MarketplaceItemSkeleton />
              </div>
            )}
          </section>

          {/* Business Skeletons */}
          <section className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Business Skeletons</h2>
                <p className="text-sm text-gray-600">
                  Used in BusinessPage while loading businesses
                </p>
              </div>
              <button
                onClick={() => setShowBusinessSkeletons(!showBusinessSkeletons)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {showBusinessSkeletons ? 'Hide' : 'Show'} Business Skeletons
              </button>
            </div>
            {showBusinessSkeletons && (
              <div className="space-y-4">
                <BusinessSkeleton />
                <BusinessSkeleton />
                <BusinessSkeleton />
              </div>
            )}
          </section>

          {/* Profile Skeleton */}
          <section className="border-b border-gray-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Profile Skeleton</h2>
                <p className="text-sm text-gray-600">
                  Used in ProfilePage while loading user profile
                </p>
              </div>
              <button
                onClick={() => setShowProfileSkeleton(!showProfileSkeleton)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {showProfileSkeleton ? 'Hide' : 'Show'} Profile Skeleton
              </button>
            </div>
            {showProfileSkeleton && <ProfileSkeleton />}
          </section>

          {/* Show All */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-black mb-1">Show All Skeletons</h2>
                <p className="text-sm text-gray-600">
                  Display all skeleton types at once for comparison
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAll(!showAll)
                  if (!showAll) {
                    setShowPostSkeletons(true)
                    setShowCommentSkeletons(true)
                    setShowMarketplaceSkeletons(true)
                    setShowBusinessSkeletons(true)
                    setShowProfileSkeleton(true)
                  } else {
                    setShowPostSkeletons(false)
                    setShowCommentSkeletons(false)
                    setShowMarketplaceSkeletons(false)
                    setShowBusinessSkeletons(false)
                    setShowProfileSkeleton(false)
                  }
                }}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {showAll ? 'Hide All' : 'Show All'}
              </button>
            </div>
          </section>

          {/* Testing Instructions */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-black mb-2">Testing Instructions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Click any "Show" button to display that skeleton type</li>
              <li>Observe the pulse animation on skeleton elements</li>
              <li>Compare skeleton structure with actual components</li>
              <li>Check that skeletons match the black/white theme</li>
              <li>Verify spacing and layout consistency</li>
              <li>Use "Show All" to see all skeletons simultaneously</li>
            </ul>
            <div className="mt-4 p-4 bg-white rounded border border-gray-200">
              <h4 className="font-semibold text-black mb-2">What to Check:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>✅ Smooth pulse animation (2s cycle)</li>
                <li>✅ Proper spacing and padding</li>
                <li>✅ Correct dimensions matching real content</li>
                <li>✅ Gray color scheme (gray-200) for skeleton elements</li>
                <li>✅ No layout shifts when skeletons appear</li>
                <li>✅ Consistent styling across all skeleton types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

