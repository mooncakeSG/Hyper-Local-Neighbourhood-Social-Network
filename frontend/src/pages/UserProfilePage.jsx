import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import { authenticatedFetch } from '../utils/apiClient'
import { showError } from '../utils/toast'
import PostCard from '../components/PostCard'
import MarketplaceItemCard from '../components/MarketplaceItemCard'
import BusinessCard from '../components/BusinessCard'
import PostSkeleton from '../components/skeletons/PostSkeleton'
import MarketplaceItemSkeleton from '../components/skeletons/MarketplaceItemSkeleton'
import BusinessSkeleton from '../components/skeletons/BusinessSkeleton'
import ProfileSkeleton from '../components/skeletons/ProfileSkeleton'

export default function UserProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, session, neighbourhood } = useUserStore()
  const [activeTab, setActiveTab] = useState('posts') // 'posts', 'items', 'businesses'

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      // DEV MODE: Return mock data
      const isDevMode = userId?.startsWith('dev-user-')
      if (isDevMode) {
        return {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null,
          bio: 'Neighbourhood enthusiast',
          created_at: new Date().toISOString(),
        }
      }

      // PRODUCTION: Fetch from backend API
      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/${userId}`,
        {},
        false
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found')
        } else if (response.status === 403) {
          throw new Error('You can only view profiles of users in your neighbourhood')
        }
        throw new Error('Failed to fetch user profile')
      }

      return response.json()
    },
    enabled: !!userId && !!session,
  })

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      const isDevMode = userId?.startsWith('dev-user-')
      if (isDevMode) {
        return {
          posts_count: 5,
          comments_count: 12,
          marketplace_items_count: 2,
          businesses_count: 1
        }
      }

      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/users/${userId}/stats`,
        {},
        false
      )

      if (!response.ok) {
        return { posts_count: 0, comments_count: 0, marketplace_items_count: 0, businesses_count: 0 }
      }

      return response.json()
    },
    enabled: !!userId && !!session,
  })

  // Fetch user posts
  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      const isDevMode = userId?.startsWith('dev-user-')
      if (isDevMode) {
        return [
          {
            id: 'dev-post-1',
            content: 'Sample post from this user',
            type: 'post',
            created_at: new Date().toISOString(),
            user: { id: userId, name: 'John Doe' },
            comments_count: 0,
            likes_count: 0,
            user_liked: false,
          }
        ]
      }

      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/posts/user/${userId}`,
        {},
        false
      )

      if (!response.ok) {
        return []
      }

      return response.json()
    },
    enabled: !!userId && !!session && activeTab === 'posts',
  })

  // Fetch user marketplace items
  const { data: userItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['userMarketplaceItems', userId],
    queryFn: async () => {
      const isDevMode = userId?.startsWith('dev-user-')
      if (isDevMode) {
        return [
          {
            id: 'dev-item-1',
            title: 'Sample Item',
            price: 100,
            status: 'available',
            image_url: null,
            created_at: new Date().toISOString(),
          }
        ]
      }

      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/marketplace?user_id=${userId}&status=available`,
        {},
        false
      )

      if (!response.ok) {
        return []
      }

      return response.json()
    },
    enabled: !!userId && !!session && activeTab === 'items',
  })

  // Fetch user businesses
  const { data: userBusinesses, isLoading: businessesLoading } = useQuery({
    queryKey: ['userBusinesses', userId],
    queryFn: async () => {
      const isDevMode = userId?.startsWith('dev-user-')
      if (isDevMode) {
        return [
          {
            id: 'dev-business-1',
            name: 'Sample Business',
            category: 'restaurant',
            image_url: null,
            created_at: new Date().toISOString(),
          }
        ]
      }

      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/businesses?user_id=${userId}`,
        {},
        false
      )

      if (!response.ok) {
        return []
      }

      return response.json()
    },
    enabled: !!userId && !!session && activeTab === 'businesses',
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (profileLoading) {
    return (
      <div className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <ProfileSkeleton />
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">User not found</p>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Back to Feed
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-white border border-black rounded-lg p-6 mb-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center mb-4">
              {userProfile.avatar_url ? (
                <img src={userProfile.avatar_url} alt={userProfile.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-black mb-2">
              {userProfile.name || 'Anonymous'}
            </h1>

            {/* Bio */}
            {userProfile.bio && (
              <p className="text-sm text-gray-600 mb-4 max-w-md">{userProfile.bio}</p>
            )}

            {/* Stats */}
            {userStats && (
              <div className="grid grid-cols-4 gap-4 w-full max-w-md mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-xl font-bold text-black">{userStats.posts_count || 0}</div>
                  <div className="text-xs text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-black">{userStats.comments_count || 0}</div>
                  <div className="text-xs text-gray-600">Comments</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-black">{userStats.marketplace_items_count || 0}</div>
                  <div className="text-xs text-gray-600">Items</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-black">{userStats.businesses_count || 0}</div>
                  <div className="text-xs text-gray-600">Businesses</div>
                </div>
              </div>
            )}

            {/* Join Date */}
            <div className="mt-4 text-xs text-gray-500">
              Joined {formatDate(userProfile.created_at)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Posts ({userStats?.posts_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'items'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Marketplace ({userStats?.marketplace_items_count || 0})
          </button>
          <button
            onClick={() => setActiveTab('businesses')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'businesses'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Businesses ({userStats?.businesses_count || 0})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'posts' && (
            <>
              {postsLoading ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : userPosts && userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <PostCard key={post.id} post={post} onUpdate={() => {}} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No posts yet</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'items' && (
            <>
              {itemsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MarketplaceItemSkeleton />
                  <MarketplaceItemSkeleton />
                </div>
              ) : userItems && userItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userItems.map((item) => (
                    <MarketplaceItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No marketplace items yet</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'businesses' && (
            <>
              {businessesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BusinessSkeleton />
                  <BusinessSkeleton />
                </div>
              ) : userBusinesses && userBusinesses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userBusinesses.map((business) => (
                    <BusinessCard key={business.id} business={business} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No businesses yet</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

