import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import { useQuery } from '@tanstack/react-query'

export default function CommentDrawer({ postId, onClose, onUpdate }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useUserStore()

  const { data: comments, refetch } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(id, name, phone)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    setLoading(true)
    try {
      // In dev mode, skip Supabase insert
      if (user?.id?.startsWith('dev-user-')) {
        console.log('Dev mode: Comment would be created:', { postId, content: comment })
        setComment('')
        refetch()
        onUpdate()
        return
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: comment.trim(),
        })

      if (error) throw error
      setComment('')
      refetch()
      onUpdate()
    } catch (err) {
      console.error('Error creating comment:', err)
      alert('Failed to post comment')
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

