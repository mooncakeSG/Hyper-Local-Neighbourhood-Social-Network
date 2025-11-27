/**
 * Mentions Utility
 * Handles parsing and rendering @mentions in posts
 */

/**
 * Extract @mentions from text
 * @param {string} text - Text to parse
 * @returns {Array<{text: string, start: number, end: number}>} - Array of mention objects
 */
export function parseMentions(text) {
  if (!text) return []
  
  const mentionPattern = /@(\w+(?:\.\w+)*@?\w*\.?\w*)/g
  const mentions = []
  let match
  
  while ((match = mentionPattern.exec(text)) !== null) {
    mentions.push({
      text: match[0], // Full match including @
      username: match[1], // Username without @
      start: match.index,
      end: match.index + match[0].length
    })
  }
  
  return mentions
}

/**
 * Render text with mentions as clickable elements
 * @param {string} text - Text to render
 * @param {Array} mentions - Array of mention objects from parseMentions
 * @param {Function} onMentionClick - Callback when mention is clicked
 * @returns {Array} - Array of React elements (text and mention links)
 */
export function renderTextWithMentions(text, mentions = [], onMentionClick = null) {
  if (!text) return []
  
  // Parse mentions if not provided
  const parsedMentions = mentions.length > 0 ? mentions : parseMentions(text)
  
  if (parsedMentions.length === 0) {
    return [text]
  }
  
  const elements = []
  let lastIndex = 0
  
  parsedMentions.forEach((mention, index) => {
    // Add text before mention
    if (mention.start > lastIndex) {
      const beforeText = text.substring(lastIndex, mention.start)
      if (beforeText) {
        elements.push(beforeText)
      }
    }
    
    // Add mention as clickable element
    const mentionElement = (
      <span
        key={`mention-${index}`}
        onClick={(e) => {
          e.stopPropagation()
          if (onMentionClick) {
            onMentionClick(mention.username)
          }
        }}
        className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium"
      >
        {mention.text}
      </span>
    )
    elements.push(mentionElement)
    
    lastIndex = mention.end
  })
  
  // Add remaining text after last mention
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex)
    if (afterText) {
      elements.push(afterText)
    }
  }
  
  return elements
}

/**
 * Check if text contains a mention at cursor position
 * @param {string} text - Text to check
 * @param {number} cursorPosition - Current cursor position
 * @returns {Object|null} - Mention object or null
 */
export function getMentionAtCursor(text, cursorPosition) {
  const mentions = parseMentions(text)
  
  for (const mention of mentions) {
    if (cursorPosition >= mention.start && cursorPosition <= mention.end) {
      return mention
    }
  }
  
  return null
}

/**
 * Get the current mention being typed (if any)
 * @param {string} text - Text to check
 * @param {number} cursorPosition - Current cursor position
 * @returns {string|null} - Partial mention text or null
 */
export function getPartialMention(text, cursorPosition) {
  // Find the last @ before cursor
  const beforeCursor = text.substring(0, cursorPosition)
  const lastAtIndex = beforeCursor.lastIndexOf('@')
  
  if (lastAtIndex === -1) return null
  
  // Check if there's a space after @ (mention ended)
  const afterAt = beforeCursor.substring(lastAtIndex + 1)
  if (afterAt.includes(' ') || afterAt.includes('\n')) return null
  
  // Return the partial mention
  return afterAt
}

