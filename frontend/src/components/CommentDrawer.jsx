import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { showSuccess, showError } from '../utils/toast'
import CommentSkeleton from './skeletons/CommentSkeleton'

export default function CommentDrawer({ postId, onClose, onUpdate }) {
  const [comment, setComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user, session } = useUserStore()
  const queryClient = useQueryClient()

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }) => {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || postId?.startsWith('dev-post-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Comment would be updated:', { commentId, content })
        return
      }

      // PRODUCTION: Update comment via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ content: content.trim() })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to update comment')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId])
      onUpdate()
      showSuccess('Comment updated', 'Your comment has been updated')
    },
    onError: (error) => {
      showError('Failed to update comment', error.message)
    }
  })

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || postId?.startsWith('dev-post-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Comment would be deleted:', commentId)
        return
      }

      // PRODUCTION: Delete comment via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to delete comment')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', postId])
      onUpdate()
      setShowDeleteConfirm(null)
      showSuccess('Comment deleted', 'Your comment has been removed')
    },
    onError: (error) => {
      showError('Failed to delete comment', error.message)
      setShowDeleteConfirm(null)
    }
  })

  const { data: comments, isLoading: commentsLoading, refetch } = useQuery({
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
    refetchInterval: 20 * 1000, // Poll every 20 seconds for new comments
    refetchIntervalInBackground: false, // Only poll when drawer is open
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

      // Optimistic update: Clear input and show success immediately
      setComment('')
      showSuccess('Comment posted', 'Your comment has been added')
      
      // Refetch comments to get the new one
      refetch()
      onUpdate()
    } catch (err) {
      console.error('Error creating comment:', err)
      showError('Failed to post comment', err.message)
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
          {commentsLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : comments && comments.length > 0 ? (
            comments.map((commentItem) => {
              const isOwner = user && commentItem.user_id === user.id
              const isEditing = editingCommentId === commentItem.id

              return (
                <div key={commentItem.id} className="border-b border-gray-200 pb-3">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-black text-sm">
                      {commentItem.user?.name || commentItem.user?.phone || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        {formatTime(commentItem.created_at)}
                      </div>
                      {isOwner && !isEditing && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingCommentId(commentItem.id)
                              setEditContent(commentItem.content)
                            }}
                            className="text-xs text-gray-500 hover:text-black"
                            aria-label="Edit comment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(commentItem.id)}
                            className="text-xs text-gray-500 hover:text-red-600"
                            aria-label="Delete comment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await updateCommentMutation.mutateAsync({
                              commentId: commentItem.id,
                              content: editContent.trim()
                            })
                            setEditingCommentId(null)
                            setEditContent('')
                          }}
                          disabled={updateCommentMutation.isLoading || !editContent.trim()}
                          className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800 disabled:opacity-50"
                        >
                          {updateCommentMutation.isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null)
                            setEditContent('')
                          }}
                          className="px-3 py-1 border border-black text-black text-xs rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-black text-sm">{commentItem.content}</p>
                  )}
                </div>
              )
            })
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
            >
              <h3 className="text-lg font-bold text-black mb-2">Delete Comment?</h3>
              <p className="text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 border border-black rounded-lg text-black hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCommentMutation.mutate(showDeleteConfirm)}
                  disabled={deleteCommentMutation.isLoading}
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteCommentMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}

