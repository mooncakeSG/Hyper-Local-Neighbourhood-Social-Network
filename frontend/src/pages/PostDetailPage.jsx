import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUserStore } from '../store/useUserStore'
import { authenticatedFetch } from '../utils/apiClient'
import PostCard from '../components/PostCard'
import PostSkeleton from '../components/skeletons/PostSkeleton'
import { showError } from '../utils/toast'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { session, neighbourhood } = useUserStore()
  const [post, setPost] = useState(null)

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', neighbourhood?.id],
    queryFn: async () => {
      if (!neighbourhood?.id) return []

      // DEV MODE: Return mock data
      const isDevMode = neighbourhood?.id?.startsWith('dev-neighbourhood-')
      
      if (isDevMode) {
        return [
          {
            id: postId,
            content: 'This is a sample post in dev mode.',
            type: 'post',
            created_at: new Date().toISOString(),
            user: { id: 'dev-user-1', name: 'Dev User', email: 'dev@example.com' },
            comments_count: 0,
            likes_count: 0,
            user_liked: false,
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

      const response = await authenticatedFetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/posts?neighbourhood_id=${neighbourhood.id}`,
        { headers },
        false
      )

      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }

      const data = await response.json()
      return data || []
    },
    enabled: !!neighbourhood?.id,
  })

  useEffect(() => {
    if (posts && posts.length > 0) {
      const foundPost = posts.find(p => p.id === postId)
      if (foundPost) {
        setPost(foundPost)
      } else {
        showError('Post not found', 'This post may have been deleted or is not available')
        navigate('/app')
      }
    }
  }, [posts, postId, navigate])

  if (isLoading) {
    return (
      <div className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <PostSkeleton />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Post not found</p>
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

  return (
    <div className="pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/app')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Feed
        </button>
        <PostCard post={post} onUpdate={() => {}} />
      </div>
    </div>
  )
}

