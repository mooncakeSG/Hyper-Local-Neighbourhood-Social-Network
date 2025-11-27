import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/useUserStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authenticatedFetch } from '../utils/apiClient'
import { showError, showSuccess, showInfo } from '../utils/toast'
import { generatePostLink, copyToClipboard, shareNative, shareToWhatsApp } from '../utils/share'
import { renderTextWithMentions } from '../utils/mentions'
import CommentDrawer from './CommentDrawer'

export default function PostCard({ post, onUpdate }) {
  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(post.user_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const { user, session } = useUserStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Sync with post prop changes
  useEffect(() => {
    setLiked(post.user_liked || false)
    setLikesCount(post.likes_count || 0)
  }, [post.user_liked, post.likes_count])

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

  // Like/unlike mutation
  const likeMutation = useMutation({
    mutationFn: async (shouldLike) => {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/posts/${post.id}/like`
      const method = shouldLike ? 'POST' : 'DELETE'
      
      const response = await authenticatedFetch(apiUrl, { method })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to update like')
      }
      return response.json()
    },
    onMutate: async (shouldLike) => {
      // Optimistic update
      const previousLiked = liked
      const previousCount = likesCount
      
      setLiked(shouldLike)
      setLikesCount(prev => shouldLike ? prev + 1 : Math.max(0, prev - 1))
      
      return { previousLiked, previousCount }
    },
    onSuccess: (data) => {
      setLiked(data.liked)
      setLikesCount(data.likes_count)
      // Invalidate posts query to refetch
      queryClient.invalidateQueries(['posts'])
    },
    onError: (error, shouldLike, context) => {
      // Rollback optimistic update
      if (context) {
        setLiked(context.previousLiked)
        setLikesCount(context.previousCount)
      }
      showError('Failed to update like', error.message)
    }
  })

  const handleLike = () => {
    if (!session?.access_token) {
      showError('Please sign in', 'You need to be signed in to like posts')
      return
    }
    likeMutation.mutate(!liked)
  }

  const handleShare = async () => {
    const postUrl = generatePostLink(post.id)
    const shareText = `Check out this post from ${post.user?.name || 'a neighbour'}: ${post.content?.substring(0, 100)}${post.content?.length > 100 ? '...' : ''}`
    
    const shareData = {
      title: 'Neighbourhood Post',
      text: shareText,
      url: postUrl
    }

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await shareNative(shareData)
        return
      } catch (error) {
        // User cancelled or error - show share menu
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
        }
      }
    }

    // Show share menu for desktop or if native share failed
    setShowShareMenu(true)
  }

  const handleCopyLink = async () => {
    const postUrl = generatePostLink(post.id)
    const copied = await copyToClipboard(postUrl)
    if (copied) {
      showSuccess('Link copied!', 'Post link copied to clipboard')
      setShowShareMenu(false)
    } else {
      showError('Failed to copy', 'Please try again')
    }
  }

  const handleShareWhatsApp = () => {
    const postUrl = generatePostLink(post.id)
    const shareText = `Check out this post from ${post.user?.name || 'a neighbour'}: ${post.content?.substring(0, 100)}${post.content?.length > 100 ? '...' : ''}`
    shareToWhatsApp(shareText, postUrl)
    setShowShareMenu(false)
  }

  const handleNativeShare = async () => {
    const postUrl = generatePostLink(post.id)
    const shareText = `Check out this post from ${post.user?.name || 'a neighbour'}: ${post.content?.substring(0, 100)}${post.content?.length > 100 ? '...' : ''}`
    
    const shareData = {
      title: 'Neighbourhood Post',
      text: shareText,
      url: postUrl
    }

    try {
      await shareNative(shareData)
      setShowShareMenu(false)
    } catch (error) {
      if (error.name !== 'AbortError') {
        showError('Share failed', 'Please try again')
      }
    }
  }

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
          <div className="flex items-center gap-3 flex-1">
            {/* User Avatar */}
            <button
              onClick={() => navigate(`/app/user/${post.user_id}`)}
              className="flex-shrink-0"
            >
              {post.user?.avatar_url ? (
                <img
                  src={post.user.avatar_url}
                  alt={post.user?.name || 'User'}
                  className="w-10 h-10 rounded-full border border-black object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border border-black bg-gray-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </button>
            <div className="flex-1">
              <button
                onClick={() => navigate(`/app/user/${post.user_id}`)}
                className="font-medium text-black hover:underline"
              >
                {post.user?.name || post.user?.phone || 'Anonymous'}
              </button>
              <div className="text-xs text-gray-500">{formatTime(post.created_at)}</div>
            </div>
          </div>
        </div>

        {post.content && (
          <p className="text-black mb-3 whitespace-pre-wrap">
            {renderTextWithMentions(
              post.content,
              post.mentions || [],
              (username) => {
                // Find the mentioned user from mentions array
                // Backend returns: { id, post_id, mentioned_user_id, mentioned_user: { id, name, email } }
                const mentionedUser = post.mentions?.find(
                  m => {
                    const user = m.mentioned_user
                    if (!user) return false
                    const nameMatch = user.name?.toLowerCase().includes(username.toLowerCase())
                    const emailMatch = user.email?.toLowerCase().includes(username.toLowerCase())
                    return nameMatch || emailMatch
                  }
                )
                
                if (mentionedUser?.mentioned_user?.id) {
                  navigate(`/app/user/${mentionedUser.mentioned_user.id}`)
                } else if (mentionedUser?.mentioned_user_id) {
                  // Fallback: use mentioned_user_id directly
                  navigate(`/app/user/${mentionedUser.mentioned_user_id}`)
                } else {
                  showInfo('User mention', `Could not find profile for @${username}`)
                }
              }
            )}
          </p>
        )}

        {post.image_url && (
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-lg mb-3"
          />
        )}

        <div className="flex items-center gap-4 text-sm relative">
          <motion.button
            onClick={handleLike}
            disabled={likeMutation.isLoading}
            className={`flex items-center gap-1 transition-colors ${
              liked ? 'text-red-500' : 'text-gray-500'
            } ${likeMutation.isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'}`}
            whileTap={{ scale: 0.9 }}
          >
            <motion.svg
              className="w-5 h-5"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={liked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </motion.svg>
            <span>{likesCount}</span>
          </motion.button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{post.comments_count || 0}</span>
          </button>

          {/* Share Button */}
          <div className="relative">
            <motion.button
              onClick={handleShare}
              className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </motion.button>

            {/* Share Menu Dropdown */}
            <AnimatePresence>
              {showShareMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowShareMenu(false)}
                  />
                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-black rounded-lg shadow-lg z-50"
                  >
                    <div className="py-2">
                      {navigator.share && (
                        <button
                          onClick={handleNativeShare}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                          Share via...
                        </button>
                      )}
                      <button
                        onClick={handleCopyLink}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                      </button>
                      <button
                        onClick={handleShareWhatsApp}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Share to WhatsApp
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
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

