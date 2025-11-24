import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/useUserStore'
import CommentDrawer from './CommentDrawer'

export default function PostCard({ post, onUpdate }) {
  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(false)
  const { user } = useUserStore()

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const isAlert = post.type === 'alert'

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white border border-black rounded-lg p-4 ${
          isAlert ? 'border-2 border-red-500' : ''
        }`}
      >
        {isAlert && (
          <div className="mb-2 text-red-600 font-semibold text-sm">🚨 ALERT</div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-medium text-black">
              {post.user?.name || post.user?.phone || 'Anonymous'}
            </div>
            <div className="text-xs text-gray-500">{formatTime(post.created_at)}</div>
          </div>
        </div>

        {post.content && (
          <p className="text-black mb-3 whitespace-pre-wrap">{post.content}</p>
        )}

        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-lg mb-3"
          />
        )}

        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1 ${
              liked ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likes_count || 0}</span>
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1 text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{Array.isArray(post.comments) ? post.comments.length : 0}</span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showComments && (
          <CommentDrawer
            postId={post.id}
            onClose={() => setShowComments(false)}
            onUpdate={onUpdate}
          />
        )}
      </AnimatePresence>
    </>
  )
}

