import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import ImageUploader from './ImageUploader'

export default function PostComposer({ onClose, onSuccess }) {
  const [content, setContent] = useState('')
  const [type, setType] = useState('post') // 'post' or 'alert'
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user, neighbourhood, session } = useUserStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || !neighbourhood) return

    setLoading(true)
    try {
      // DEV MODE: Bypass API call
      const isDevMode = user?.id?.startsWith('dev-user-') || neighbourhood?.id?.startsWith('dev-neighbourhood-')
      
      if (isDevMode) {
        console.log('🔧 DEV MODE: Post would be created:', { content, type, neighbourhood: neighbourhood.name })
        onSuccess()
        return
      }

      // PRODUCTION: Create post via backend API
      const accessToken = session?.access_token
      if (!accessToken) {
        throw new Error('No access token found. Please sign in again.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/posts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            content: content.trim(),
            type: type,
            neighbourhood_id: neighbourhood.id,
            image_url: imageUrl || undefined,
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create post')
      }

      onSuccess()
    } catch (err) {
      console.error('Error creating post:', err)
      alert('Failed to create post: ' + err.message)
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

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Image (optional)
            </label>
            <ImageUploader
              onImageUploaded={(url) => setImageUrl(url)}
              onImageRemoved={() => setImageUrl(null)}
            />
          </div>

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

