import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import PostCard from '../components/PostCard'
import PostComposer from '../components/PostComposer'
import PostSkeleton from '../components/skeletons/PostSkeleton'
import { useState, useEffect, useRef } from 'react'
import { setupPullToRefresh } from '../utils/pullToRefresh'

export default function FeedPage() {
  const { neighbourhood, user, session } = useUserStore()
  const [showComposer, setShowComposer] = useState(false)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const feedContainerRef = useRef(null)
  const lastPostIdRef = useRef(null)

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ['posts', neighbourhood?.id],
    queryFn: async () => {
      if (!neighbourhood?.id) return []

      // DEV MODE: Return mock data
      const isDevMode = neighbourhood?.id?.startsWith('dev-neighbourhood-') || user?.id?.startsWith('dev-user-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Returning mock posts')
        return [
          {
            id: 'dev-post-1',
            content: 'Welcome to Developer Mode! This is a sample post.',
            type: 'post',
            created_at: new Date().toISOString(),
            user: { id: 'dev-user-1', name: 'Dev User', email: 'dev@example.com' },
            comments_count: 0,
            likes_count: 0,
          },
          {
            id: 'dev-post-2',
            content: '🚨 Alert: This is a sample alert post in dev mode!',
            type: 'alert',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            user: { id: 'dev-user-2', name: 'Test User', email: 'test@example.com' },
            comments_count: 2,
            likes_count: 5,
          },
        ]
      }

      // PRODUCTION: Fetch posts from backend API
      const accessToken = session?.access_token
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/posts?neighbourhood_id=${neighbourhood.id}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      return data || []
    },
    enabled: !!neighbourhood?.id,
    refetchInterval: 30 * 1000, // Poll every 30 seconds for new posts
    refetchIntervalInBackground: true, // Continue polling when tab is in background
  })

  // Track new posts
  useEffect(() => {
    if (posts && posts.length > 0) {
      const firstPostId = posts[0].id
      
      // If we have a previous post ID and it's different, we have new posts
      if (lastPostIdRef.current && lastPostIdRef.current !== firstPostId) {
        // Count new posts
        const newPosts = posts.filter(
          (post, index) => index < posts.findIndex(p => p.id === lastPostIdRef.current)
        )
        setNewPostsCount(prev => prev + newPosts.length)
      }
      
      lastPostIdRef.current = firstPostId
    }
  }, [posts])

  // Setup pull-to-refresh
  useEffect(() => {
    if (!feedContainerRef.current) return

    const cleanup = setupPullToRefresh(feedContainerRef.current, async () => {
      await refetch()
      setNewPostsCount(0) // Clear new posts count after refresh
    })

    return cleanup
  }, [refetch])

  const handleShowNewPosts = () => {
    setNewPostsCount(0)
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20" ref={feedContainerRef}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-1">
            {neighbourhood?.name || 'Feed'}
          </h1>
          <p className="text-gray-600 text-sm">Local community updates</p>
        </div>

        {/* New Posts Indicator */}
        {newPostsCount > 0 && (
          <div className="mb-4">
            <button
              onClick={handleShowNewPosts}
              className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{newPostsCount} new post{newPostsCount > 1 ? 's' : ''} available</span>
            </button>
          </div>
        )}

        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={refetch} />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>

      {showComposer && (
        <PostComposer
          onClose={() => setShowComposer(false)}
          onSuccess={() => {
            setShowComposer(false)
            refetch()
          }}
        />
      )}

      <button
        onClick={() => setShowComposer(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-10"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  )
}

