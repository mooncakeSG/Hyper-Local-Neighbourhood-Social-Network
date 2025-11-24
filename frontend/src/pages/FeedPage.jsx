import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import PostCard from '../components/PostCard'
import PostComposer from '../components/PostComposer'
import { useState } from 'react'

export default function FeedPage() {
  const { neighbourhood, user, session } = useUserStore()
  const [showComposer, setShowComposer] = useState(false)

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
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-black">Loading posts...</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black mb-1">
            {neighbourhood?.name || 'Feed'}
          </h1>
          <p className="text-gray-600 text-sm">Local community updates</p>
        </div>

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

