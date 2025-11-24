import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { useUserStore } from '../store/useUserStore'

export default function PostComposer({ onClose, onSuccess }) {
  const [content, setContent] = useState('')
  const [type, setType] = useState('post') // 'post' or 'alert'
  const [loading, setLoading] = useState(false)
  const { user, neighbourhood } = useUserStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || !neighbourhood) return

    setLoading(true)
    try {
      // In dev mode, skip Supabase insert
      if (user?.id?.startsWith('dev-user-')) {
        console.log('Dev mode: Post would be created:', { content, type })
        onSuccess()
        return
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          neighbourhood_id: neighbourhood.id,
          content: content.trim(),
          type: type,
        })

      if (error) throw error
      onSuccess()
    } catch (err) {
      console.error('Error creating post:', err)
      alert('Failed to create post')
    } finally {
      setLoading(false)
    }
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
        className="w-full bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">Create Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType('post')}
              className={`flex-1 py-2 rounded-lg border ${
                type === 'post'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-black'
              }`}
            >
              Post
            </button>
            <button
              type="button"
              onClick={() => setType('alert')}
              className={`flex-1 py-2 rounded-lg border ${
                type === 'alert'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-black border-black'
              }`}
            >
              🚨 Alert
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your neighbourhood?"
            className="w-full px-4 py-3 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
            rows={6}
            required
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-black rounded-lg text-black hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

