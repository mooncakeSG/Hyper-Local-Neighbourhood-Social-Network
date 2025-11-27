/**
 * Share Utility
 * Handles sharing posts via various methods
 */

/**
 * Generate a shareable link for a post
 * @param {string} postId - Post ID
 * @returns {string} - Shareable URL
 */
export function generatePostLink(postId) {
  const baseUrl = window.location.origin
  return `${baseUrl}/app/post/${postId}`
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - True if successful
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Share using native Web Share API
 * @param {Object} shareData - Share data object
 * @param {string} shareData.title - Share title
 * @param {string} shareData.text - Share text
 * @param {string} shareData.url - Share URL
 * @returns {Promise<boolean>} - True if shared successfully
 */
export async function shareNative(shareData) {
  if (!navigator.share) {
    return false
  }

  try {
    await navigator.share(shareData)
    return true
  } catch (error) {
    // User cancelled or error occurred
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error)
    }
    return false
  }
}

/**
 * Share to WhatsApp
 * @param {string} text - Text to share
 * @param {string} url - URL to share
 * @returns {void}
 */
export function shareToWhatsApp(text, url) {
  const message = `${text}\n\n${url}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

/**
 * Share post with all available methods
 * @param {Object} post - Post object
 * @param {Function} onCopy - Callback when link is copied
 * @returns {Promise<void>}
 */
export async function sharePost(post, onCopy) {
  const postUrl = generatePostLink(post.id)
  const shareText = `Check out this post from ${post.user?.name || 'a neighbour'}: ${post.content?.substring(0, 100)}...`
  
  const shareData = {
    title: 'Neighbourhood Post',
    text: shareText,
    url: postUrl
  }

  // Try native share first (mobile)
  if (navigator.share) {
    const shared = await shareNative(shareData)
    if (shared) {
      return
    }
  }

  // Fallback: Copy to clipboard
  const copied = await copyToClipboard(postUrl)
  if (copied && onCopy) {
    onCopy()
  }
}

