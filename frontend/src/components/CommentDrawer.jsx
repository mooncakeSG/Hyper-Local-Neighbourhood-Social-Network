import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import { useQuery } from '@tanstack/react-query'

export default function CommentDrawer({ postId, onClose, onUpdate }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, session } = useUserStore()

  const { data: comments, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      // DEV MODE: Return mock comments
      const isDevMode = user?.id?.startsWith('dev-user-') || postId?.startsWith('dev-post-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Returning mock comments')
        return [
          {
            id: 'dev-comment-1',
            content: 'This is a sample comment in dev mode!',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            user: { id: 'dev-user-1', name: 'Dev User', email: 'dev@example.com' },
          },
        ]
      }

      // PRODUCTION: Fetch comments from backend API
      const accessToken = session?.access_token
      const headers = {
        'Content-Type': 'application/json',
      }
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/comments/post/${postId}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data = await response.json()
      return data || []
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    try {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || postId?.startsWith('dev-post-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Comment would be created:', { postId, content: comment })
        setComment('')
        refetch()
        onUpdate()
        return
      }

      // PRODUCTION: Create comment via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            post_id: postId,
            content: comment.trim(),
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create comment')
      }

      setComment('')
      refetch()
      onUpdate()
    } catch (err) {
      console.error('Error creating comment:', err)
      alert('Failed to post comment: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-2xl p-6 max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Comments</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 pb-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="font-medium text-black text-sm">
                    {comment.user?.name || comment.user?.phone || 'Anonymous'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(comment.created_at)}
                  </div>
                </div>
                <p className="text-black text-sm">{comment.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No comments yet. Be the first!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={loading || !comment.trim()}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? '...' : 'Post'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

