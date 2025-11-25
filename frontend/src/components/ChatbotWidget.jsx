import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import NeighbourBot from './chatbot/NeighbourBot'

export default function ChatbotWidget({ isLandingPage = false }) {
  const { session, neighbourhood, setNeighbourhood } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState(() => {
    // Load saved position from localStorage
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    
    const saved = localStorage.getItem('chatbot-position')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Validate position is within viewport
        if (parsed.x >= 0 && parsed.y >= 0) {
          return parsed
        }
      } catch {
        // Invalid JSON, use default
      }
    }
    // Default position: bottom right
    return { 
      x: window.innerWidth - 56 - 16, // 56px button + 16px margin
      y: window.innerHeight - 160 // 160px from bottom (bottom-40 = 160px)
    }
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const widgetRef = useRef(null)
  const buttonRef = useRef(null)

  // Allow chatbot on landing page even without session/neighbourhood
  // It will work with limited functionality (no authenticated API calls)
  const jwtToken = session?.access_token || null
  const apiBase = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1`
  const neighbourhoodId = neighbourhood?.id || null

  // Save position to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatbot-position', JSON.stringify(position))
  }, [position])

  const handleNeighbourhoodUpdate = (newNeighbourhoodId) => {
    // Update neighbourhood in store if needed
    if (newNeighbourhoodId && newNeighbourhoodId !== neighbourhoodId) {
      // You might want to fetch the full neighbourhood object here
      console.log('Neighbourhood updated to:', newNeighbourhoodId)
    }
  }

  // Handle mouse/touch drag for button
  const handleDragStart = (e) => {
    // Don't start drag on click if it's a quick click (toggle)
    const startTime = Date.now()
    const startX = e.touches ? e.touches[0].clientX : e.clientX
    const startY = e.touches ? e.touches[0].clientY : e.clientY
    
    const handleMove = (moveEvent) => {
      const moveX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
      const moveY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY
      
      // If moved more than 5px, start dragging
      if (Math.abs(moveX - startX) > 5 || Math.abs(moveY - startY) > 5) {
        setIsDragging(true)
        setDragStart({
          x: startX - position.x,
          y: startY - position.y
        })
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('touchmove', handleMove)
      }
    }
    
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('touchmove', handleMove, { passive: false })
    
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('touchmove', handleMove)
      document.removeEventListener('mouseup', cleanup)
      document.removeEventListener('touchend', cleanup)
    }
    
    document.addEventListener('mouseup', cleanup)
    document.addEventListener('touchend', cleanup)
  }

  const handleDrag = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    const newX = clientX - dragStart.x
    const newY = clientY - dragStart.y

    // Constrain to viewport
    const maxX = window.innerWidth - 56 // button width
    const maxY = window.innerHeight - 56 // button height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDrag, { passive: false })
      document.addEventListener('touchend', handleDragEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleDrag)
        document.removeEventListener('mouseup', handleDragEnd)
        document.removeEventListener('touchmove', handleDrag)
        document.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, dragStart, position])

  // Calculate panel position based on button position
  // Use a function to get current window dimensions
  const getPanelPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    
    const buttonRight = window.innerWidth - position.x - 56
    const buttonLeft = position.x
    const panelWidth = 384 // w-96 = 384px
    
    // Position panel to the left if button is on right side, otherwise to the right
    const panelX = buttonRight < window.innerWidth / 2
      ? position.x - panelWidth - 8 // Left of button
      : position.x + 56 + 8 // Right of button
    
    // Constrain panel Y to viewport
    const panelY = Math.max(0, Math.min(position.y, window.innerHeight - 600))
    
    return { x: panelX, y: panelY }
  }

  const panelPos = getPanelPosition()

  return (
    <>
      {/* Toggle Button - Draggable */}
      <motion.button
        ref={buttonRef}
        onClick={(e) => {
          if (!isDragging) {
            setIsOpen(!isOpen)
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault()
          handleDragStart(e)
        }}
        onTouchStart={(e) => {
          e.preventDefault()
          handleDragStart(e)
        }}
        animate={{
          left: position.x,
          top: position.y,
          scale: isDragging ? 1.1 : 1
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30
        }}
        className="fixed w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-50 cursor-move"
        style={{
          left: position.x || (typeof window !== 'undefined' ? window.innerWidth - 56 - 16 : 0),
          top: position.y || (typeof window !== 'undefined' ? window.innerHeight - 160 : 0)
        }}
        aria-label="Toggle chatbot"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </motion.button>

      {/* Chatbot Panel - Positioned relative to button */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            left: panelPos.x,
            top: panelPos.y
          }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30
          }}
          className="fixed w-96 h-[600px] bg-white border border-black rounded-lg shadow-2xl z-40 flex flex-col overflow-hidden"
          style={{
            left: panelPos.x,
            top: panelPos.y
          }}
        >
          <NeighbourBot
            jwtToken={jwtToken}
            apiBase={apiBase}
            neighbourhoodId={neighbourhoodId}
            onNeighbourhoodUpdate={handleNeighbourhoodUpdate}
            useBackend={false}
            isLandingPage={isLandingPage}
          />
        </motion.div>
      )}
    </>
  )
}


